#!/usr/bin/env node
/**
 * observability-collect — coletor unificado de observabilidade dos web services
 * da Arte Longa. Junta DUAS camadas para cada serviço:
 *
 *   1. USAGE  — telemetria (telemetry-surfaces spec): up?, http_status, version
 *               (do health endpoint), latency_ms, e opcionalmente
 *               GET /api/telemetry -> { total, pageviews, sessions }.
 *   2. OPS    — sinais de operação via flyctl: release#, último deploy, estado
 *               da máquina, checks (de `flyctl status`/`flyctl releases`).
 *
 * É READ-ONLY: só faz GET nos serviços e `flyctl status`/`releases` (leituras).
 * Nunca escreve em nenhum serviço de produção. Resiliente: a falha de um
 * serviço (health down, flyctl timeout) nunca aborta o run — vira `error` no
 * registro daquele serviço.
 *
 * Uso:
 *   node tools/observability-collect.mjs                 # escreve observability/snapshot.json
 *   node tools/observability-collect.mjs > out.json      # também imprime no stdout
 *
 * Requisitos: flyctl instalado + autenticado (para os campos OPS). Sem flyctl
 * os campos fly_version/last_deploy/state/checks ficam null com um `error`.
 */

import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import { execFile } from "node:child_process";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const REGISTRY = path.join(ROOT, "observability/services.json");
const OUT = path.join(ROOT, "observability/snapshot.json");

const HTTP_TIMEOUT_MS = 8000;
const FLY_TIMEOUT_MS = 15000;

/** GET com timeout; resolve { status, json, latency_ms, error }. Nunca lança. */
async function httpGetJson(target) {
  const started = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), HTTP_TIMEOUT_MS);
  try {
    const res = await fetch(target, {
      method: "GET",
      redirect: "follow",
      signal: ctrl.signal,
      headers: { "user-agent": "artelonga-observability-collect" },
    });
    const latency_ms = Date.now() - started;
    let json = null;
    const text = await res.text();
    try {
      json = JSON.parse(text);
    } catch {
      json = null; // health endpoint may not return JSON; that's fine
    }
    return { status: res.status, json, latency_ms, error: null };
  } catch (e) {
    return {
      status: null,
      json: null,
      latency_ms: Date.now() - started,
      error: e && e.name === "AbortError" ? "timeout" : String(e && e.message ? e.message : e),
    };
  } finally {
    clearTimeout(timer);
  }
}

/** Roda flyctl com timeout; resolve { json, error }. Nunca lança. */
function flyctlJson(args) {
  return new Promise((resolve) => {
    execFile(
      "flyctl",
      args,
      { timeout: FLY_TIMEOUT_MS, maxBuffer: 8 * 1024 * 1024 },
      (err, stdout) => {
        if (err) {
          resolve({ json: null, error: String(err.message || err) });
          return;
        }
        try {
          resolve({ json: JSON.parse(stdout), error: null });
        } catch (e) {
          resolve({ json: null, error: "flyctl: invalid JSON (" + String(e.message || e) + ")" });
        }
      }
    );
  });
}

/** Deriva estado da máquina + checks de `flyctl status --json`. */
function summarizeStatus(statusJson) {
  if (!statusJson) return { state: null, region: null, checks: null };
  // flyctl status --json shape varies; tolerate both Machines[] and a top-level Status.
  const machines = Array.isArray(statusJson.Machines) ? statusJson.Machines : [];
  let state = statusJson.Status || statusJson.DeploymentStatus?.Status || null;
  let region = null;
  let checkPass = 0;
  let checkTotal = 0;
  for (const m of machines) {
    if (!state && m.state) state = m.state;
    if (!region && m.region) region = m.region;
    for (const c of m.checks || []) {
      checkTotal++;
      if (c.status === "passing" || c.Status === "passing") checkPass++;
    }
  }
  const checks = checkTotal > 0 ? `${checkPass}/${checkTotal} passing` : null;
  return { state, region, checks };
}

/** Deriva release# + último deploy de `flyctl releases --json`. */
function summarizeReleases(releasesJson) {
  if (!Array.isArray(releasesJson) || releasesJson.length === 0) {
    return { fly_version: null, last_deploy: null, release_status: null };
  }
  // releases come newest-first; pick the highest Version to be safe.
  const sorted = [...releasesJson].sort(
    (a, b) => (b.Version || 0) - (a.Version || 0)
  );
  const latest = sorted[0];
  return {
    fly_version: latest.Version ?? null,
    last_deploy: latest.CreatedAt || latest.created_at || null,
    release_status: latest.Status || latest.status || null,
  };
}

async function collectService(svc) {
  const rec = {
    name: svc.name,
    type: svc.type,
    url: svc.url,
    up: false,
    http_status: null,
    version: null,
    latency_ms: null,
    fly_version: null,
    last_deploy: null,
    state: null,
    region: null,
    checks: null,
    release_status: null,
    usage: null,
    error: null,
  };
  const errors = [];

  // --- USAGE layer: health endpoint ---
  if (svc.health_path) {
    const healthUrl = svc.url.replace(/\/$/, "") + svc.health_path;
    const h = await httpGetJson(healthUrl);
    rec.http_status = h.status;
    rec.latency_ms = h.latency_ms;
    rec.up = h.status != null && h.status >= 200 && h.status < 400;
    if (h.json && typeof h.json === "object" && "version" in h.json) {
      rec.version = h.json.version ?? null;
    }
    if (h.error) errors.push(`health: ${h.error}`);
  } else {
    // static sites with no health endpoint: probe the root for liveness.
    const h = await httpGetJson(svc.url);
    rec.http_status = h.status;
    rec.latency_ms = h.latency_ms;
    rec.up = h.status != null && h.status >= 200 && h.status < 400;
    if (h.error) errors.push(`root: ${h.error}`);
  }

  // --- USAGE layer: optional telemetry ---
  if (svc.health_path) {
    const telUrl = svc.url.replace(/\/$/, "") + "/api/telemetry";
    const t = await httpGetJson(telUrl);
    if (t.status === 200 && t.json && typeof t.json === "object") {
      const j = t.json;
      // pageviews/sessions may sit at top level or nested under
      // .access / .summary / .totals (TelemetryResponse shapes vary).
      const src = j.access || j.summary || j.totals || j;
      rec.usage = {
        total: j.total ?? src.total ?? null,
        pageviews: src.pageviews ?? null,
        sessions: src.sessions ?? null,
      };
    }
    // telemetry is best-effort: absence is not an error.
  }

  // --- OPS layer: flyctl (only if fly_app set) ---
  if (svc.fly_app) {
    const [status, releases] = await Promise.all([
      flyctlJson(["status", "-a", svc.fly_app, "--json"]),
      flyctlJson(["releases", "-a", svc.fly_app, "--json"]),
    ]);

    if (status.json) {
      const s = summarizeStatus(status.json);
      rec.state = s.state;
      rec.region = s.region;
      rec.checks = s.checks;
    } else if (status.error) {
      errors.push(`fly status: ${status.error}`);
    }

    if (releases.json) {
      const r = summarizeReleases(releases.json);
      rec.fly_version = r.fly_version;
      rec.last_deploy = r.last_deploy;
      rec.release_status = r.release_status;
    } else if (releases.error) {
      errors.push(`fly releases: ${releases.error}`);
    }
  }

  if (errors.length) rec.error = errors.join("; ");
  return rec;
}

async function main() {
  let registry;
  try {
    registry = JSON.parse(fs.readFileSync(REGISTRY, "utf8"));
  } catch (e) {
    console.error(`[observability-collect] cannot read registry ${REGISTRY}: ${e.message}`);
    process.exit(2);
  }
  if (!Array.isArray(registry)) {
    console.error("[observability-collect] registry must be a JSON array");
    process.exit(2);
  }

  const services = await Promise.all(registry.map((s) => collectService(s)));

  const snapshot = {
    generated_at: new Date().toISOString(),
    services,
  };

  const out = JSON.stringify(snapshot, null, 2) + "\n";
  fs.writeFileSync(OUT, out);

  // also print to stdout so `> snapshot.json` works and runs are inspectable.
  process.stdout.write(out);

  const down = services.filter((s) => !s.up).map((s) => s.name);
  const errored = services.filter((s) => s.error).map((s) => s.name);
  console.error(
    `[observability-collect] wrote ${OUT} — ${services.length} services` +
      (down.length ? `; down: ${down.join(", ")}` : "") +
      (errored.length ? `; with errors: ${errored.join(", ")}` : "")
  );
}

main();
