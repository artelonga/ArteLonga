#!/usr/bin/env node
/* tools/deploy-surface.mjs — deploy de superfície COM checagem de localhost antes (CI/CD gate).
 *
 * Sobe a superfície localmente com o MESMO env do fly.toml, faz smoke test das rotas-chave,
 * e só roda `fly deploy` se passar. Previne deploy de página quebrada: server que não sobe,
 * conteúdo ausente, ou fallback de render (L-002).
 *
 *   node tools/deploy-surface.mjs <yuri|hostinger|comunicacao|retro>   # smoke check + deploy
 *   node tools/deploy-surface.mjs <surface> --check-only               # só o smoke check (não faz deploy)
 *
 * Saída ≠ 0 se o smoke check OU o deploy falhar. */
import { spawn } from "node:child_process";
import http from "node:http";

const SURFACES = {
  yuri: {
    server: "tools/surfaces-server.mjs", env: { SURFACE: "/yuri/", FEEDBACK_UNIVERSE: "yuri" },
    config: "deploy/surfaces/yuri.toml", dockerfile: "deploy/surfaces/Dockerfile",
    expect: ["system-graph.js", "feedback.js", "</html>"], dirCheck: "/aws"
  },
  hostinger: {
    server: "tools/surfaces-server.mjs", env: { SURFACE: "/yuri/hostinger/", FEEDBACK_UNIVERSE: "yuri" },
    config: "deploy/surfaces/hostinger.toml", dockerfile: "deploy/surfaces/Dockerfile",
    expect: ["Data Analyst", "Hostinger", "feedback.js"], dirCheck: "/studies"
  },
  comunicacao: {
    server: "tools/surfaces-server.mjs",
    env: { MODE: "iframe", FEEDBACK_UNIVERSE: "comunicacao", REDIRECT_URL: "https://yggdrasil.artelonga.com.br/universos/comunicacao" },
    config: "deploy/surfaces/comunicacao.toml", dockerfile: "deploy/surfaces/Dockerfile",
    expect: ["<iframe", "feedback.js"]
  },
  retro: {
    server: "tools/retro-server.mjs", env: {},
    config: "deploy/retro/fly.toml", dockerfile: "deploy/retro/Dockerfile",
    expect: ["Cardápio", "feedback.js"]
  }
};

// strings que indicam falha de render (L-002) — NUNCA devem aparecer numa página saudável
const BAD = ["algo deu errado", "erro ao renderizar", "failed to render", "cannot read prop", "is not defined", "undefined is not"];

const PORT = 8099;
const args = process.argv.slice(2);
const checkOnly = args.includes("--check-only");
const name = args.find((a) => !a.startsWith("--"));
const s = SURFACES[name];
if (!s) {
  console.error("uso: node tools/deploy-surface.mjs <" + Object.keys(SURFACES).join("|") + "> [--check-only]");
  process.exit(2);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const get = (path) => new Promise((resolve, reject) => {
  const req = http.get({ host: "127.0.0.1", port: PORT, path, timeout: 5000 }, (r) => {
    let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => resolve({ status: r.statusCode, body: d }));
  });
  req.on("error", reject);
  req.on("timeout", () => req.destroy(new Error("timeout")));
});

console.log(`[predeploy] subindo ${s.server} (${name}) em :${PORT} …`);
const srv = spawn("node", [s.server], {
  env: { ...process.env, ...s.env, PORT: String(PORT), ROOT: process.cwd() },
  stdio: ["ignore", "pipe", "pipe"]
});
let srvlog = "";
srv.stdout.on("data", (d) => (srvlog += d));
srv.stderr.on("data", (d) => (srvlog += d));

let ok = false;
try {
  let up = false;
  for (let i = 0; i < 40 && !up; i++) {
    try { const h = await get("/api/health"); if (h.status === 200) up = true; } catch (e) {}
    if (!up) await sleep(200);
  }
  if (!up) throw new Error("server não subiu em 8s\n" + srvlog.slice(-600));

  const checks = [];
  const health = await get("/api/health");
  checks.push(["GET /api/health → 200", health.status === 200]);
  const root = await get("/");
  checks.push(["GET / → 200", root.status === 200]);
  for (const m of s.expect) checks.push([`/ contém "${m}"`, root.body.includes(m)]);
  const low = root.body.toLowerCase();
  for (const b of BAD) checks.push([`/ sem fallback "${b}"`, !low.includes(b)]);
  // regressão de trailing-slash: diretório sem barra DEVE 301 (senão links relativos quebram → 404)
  if (s.dirCheck) { const d = await get(s.dirCheck); checks.push([`${s.dirCheck} → 301 (trailing-slash)`, d.status === 301]); }

  ok = checks.every((c) => c[1]);
  for (const [label, pass] of checks) console.log(`  ${pass ? "✓" : "✗"} ${label}`);
} catch (e) {
  console.error("[predeploy] erro:", e.message);
  ok = false;
} finally {
  srv.kill("SIGTERM");
}

if (!ok) {
  console.error("[predeploy] ✗ smoke check FALHOU — deploy abortado.");
  process.exit(1);
}
console.log("[predeploy] ✓ smoke check passou.");
if (checkOnly) process.exit(0);

console.log(`[deploy] fly deploy ${name} (${s.config}) …`);
const dep = spawn("flyctl", ["deploy", "--config", s.config, "--dockerfile", s.dockerfile, "--remote-only", "--ha=false"], { stdio: "inherit" });
dep.on("exit", (code) => process.exit(code || 0));
