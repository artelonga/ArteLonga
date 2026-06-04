#!/usr/bin/env node
/* tools/surfaces-server.mjs — servidor estático mínimo de UMA superfície (CNAME).
 * Cada deploy é um app Fly independente, parametrizado por env:
 *
 *   SURFACE       caminho da superfície servido na raiz "/"  (default "/yuri/")
 *                 ex: artelonga-yuri → "/yuri/" · artelonga-hostinger → "/yuri/hostinger/"
 *   MODE          "static" (default) ou "redirect"
 *   REDIRECT_URL  destino do 302 quando MODE=redirect (ex: o jogo Godot no yggdrasil)
 *
 * Os index.html usam caminhos absolutos /yuri/* , então só "/" é mapeado pro
 * index da superfície; o resto serve o arquivo direto. Sem dependências (stdlib). */
import http from "node:http";
import { promises as fs } from "node:fs";
import { createReadStream } from "node:fs";
import path from "node:path";
import os from "node:os";
import { appendFile, readFile, mkdir } from "node:fs/promises";

const PORT = +(process.env.PORT || 8080);
const ROOT = path.resolve(process.env.ROOT || process.cwd());
const SURFACE = (process.env.SURFACE || "/yuri/").replace(/\/?$/, "/");   // garante "/" no fim
const MODE = process.env.MODE || "static";
const REDIRECT_URL = process.env.REDIRECT_URL || "https://yggdrasil.artelonga.com.br/universos/comunicacao";
const FRAME_TITLE = process.env.FRAME_TITLE || "comunicação · Arte Longa";
const FEEDBACK_UNIVERSE = process.env.FEEDBACK_UNIVERSE || "";   // universo do co p/ encaminhar feedback (por app)

// ── telemetria: estado DA universe (fonte da verdade local) ─────────────────
// Princípio (decisão do dono): a universe é DONA da sua telemetria, salva no
// próprio estado. O co é ALVO DE BROADCAST, consentido no envio — nunca a fonte
// de leitura. /analytics lê /api/telemetry deste servidor, agrega as surfaces
// IRMÃS da mesma universe (server-side, sem CORS) e só REPORTA o status do
// broadcast pro co (o que checar lá) — sem depender de ler do co.
const UNIVERSE = FEEDBACK_UNIVERSE || "yuri";
const CO_FEEDBACK = process.env.CO_FEEDBACK || "https://co.artelonga.com.br/api/v1/feedback";
const SIBLINGS = (process.env.SIBLINGS || "").split(",").map(s => s.trim()).filter(Boolean);
const TELE_DIR = process.env.TELEMETRY_DIR || "/data";
const TELE_DURABLE = process.env.TELEMETRY_DURABLE === "1";    // true só com volume montado
let TELE_FILE = path.join(TELE_DIR, "telemetry-" + UNIVERSE + ".jsonl");
const TELE_MEM = [];                                           // cache em memória (carregado no boot)

async function teleInit() {
  try { await mkdir(TELE_DIR, { recursive: true }); }
  catch (e) { TELE_FILE = path.join(os.tmpdir(), "telemetry-" + UNIVERSE + ".jsonl"); }
  try {
    const txt = await readFile(TELE_FILE, "utf8");
    txt.split("\n").forEach(l => { if (l.trim()) { try { TELE_MEM.push(JSON.parse(l)); } catch (_) {} } });
  } catch (e) {}
  console.log("[TELE] universe=" + UNIVERSE + " file=" + TELE_FILE + " durable=" + TELE_DURABLE + " loaded=" + TELE_MEM.length);
}
async function teleSave(ev) {
  TELE_MEM.push(ev);
  try { await appendFile(TELE_FILE, JSON.stringify(ev) + "\n"); }
  catch (e) { console.log("[TELE] write-failed " + (e && e.message)); }
}
function refDomain(r) {           // domínio do referrer externo (ignora same-site/vazio)
  if (!r) return null;
  try { const h = new URL(r).hostname; if (!h || /(^|\.)artelonga\.com\.br$/.test(h)) return null; return h; } catch (e) { return null; }
}
function topN(obj, n, keyName) {
  return Object.keys(obj).map(k => { const o = { n: obj[k] }; o[keyName] = k; return o; }).sort((a, b) => b.n - a.n).slice(0, n);
}
// telemetria GA-like: 3 tipos — pageview (acesso), interaction (clique), feedback (consentido).
function teleAgg(events) {
  const fb = events.filter(e => (e.kind || "feedback") === "feedback");
  const pv = events.filter(e => e.kind === "pageview");
  const ix = events.filter(e => e.kind === "interaction");
  const bySent = { up: 0, neutral: 0, down: 0 }, bc = { ok: 0, failed: 0, pending: 0 };
  fb.forEach(e => { bySent[e.sentiment > 0 ? "up" : e.sentiment < 0 ? "down" : "neutral"]++; const st = (e.broadcast && e.broadcast.co) || "pending"; if (bc[st] != null) bc[st]++; });
  const sess = {}, refs = {}, pvPages = {};
  pv.forEach(e => { if (e.session) sess[e.session] = 1; const r = refDomain(e.referrer); if (r) refs[r] = (refs[r] || 0) + 1; const p = e.page || "?"; pvPages[p] = (pvPages[p] || 0) + 1; });
  const tgt = {}; let outbound = 0;
  ix.forEach(e => { if (e.outbound) outbound++; const k = e.target || e.action || "?"; tgt[k] = (tgt[k] || 0) + 1; });
  return {
    total: events.length,
    access: { pageviews: pv.length, sessions: Object.keys(sess).length, topPages: topN(pvPages, 12, "page"), referrers: topN(refs, 8, "ref") },
    interactions: { total: ix.length, outbound: outbound, topTargets: topN(tgt, 10, "target") },
    feedback: { total: fb.length, bySentiment: bySent, broadcast: bc,
      recent: fb.slice(-20).reverse().map(e => ({ t: e.t, page: e.page, sentiment: e.sentiment, message: (e.message || "").slice(0, 280), broadcast: e.broadcast, surface: SURFACE })) },
    recent: events.slice(-25).reverse().map(e => ({ t: e.t, kind: e.kind || "feedback", page: e.page, sentiment: e.sentiment, action: e.action, target: e.target, outbound: e.outbound, message: (e.message || "").slice(0, 140), surface: SURFACE }))
  };
}
function mergeCounts(dst, list, keyName) { (list || []).forEach(x => { dst[x[keyName]] = (dst[x[keyName]] || 0) + x.n; }); }
function teleCombine(aggs) {      // soma agregados de várias surfaces da MESMA universe
  const out = { total: 0,
    access: { pageviews: 0, sessions: 0, _pages: {}, _refs: {} },
    interactions: { total: 0, outbound: 0, _tgt: {} },
    feedback: { total: 0, bySentiment: { up: 0, neutral: 0, down: 0 }, broadcast: { ok: 0, failed: 0, pending: 0 }, recent: [] },
    recent: [] };
  aggs.forEach(a => {
    if (!a) return;
    out.total += a.total || 0;
    const ac = a.access || {}, ix = a.interactions || {}, fb = a.feedback || {};
    out.access.pageviews += ac.pageviews || 0; out.access.sessions += ac.sessions || 0;
    mergeCounts(out.access._pages, ac.topPages, "page"); mergeCounts(out.access._refs, ac.referrers, "ref");
    out.interactions.total += ix.total || 0; out.interactions.outbound += ix.outbound || 0;
    mergeCounts(out.interactions._tgt, ix.topTargets, "target");
    out.feedback.total += fb.total || 0;
    ["up", "neutral", "down"].forEach(k => out.feedback.bySentiment[k] += (fb.bySentiment && fb.bySentiment[k]) || 0);
    ["ok", "failed", "pending"].forEach(k => out.feedback.broadcast[k] += (fb.broadcast && fb.broadcast[k]) || 0);
    (fb.recent || []).forEach(r => out.feedback.recent.push(r));
    (a.recent || []).forEach(r => out.recent.push(r));
  });
  out.access.topPages = topN(out.access._pages, 12, "page"); delete out.access._pages;
  out.access.referrers = topN(out.access._refs, 8, "ref"); delete out.access._refs;
  out.interactions.topTargets = topN(out.interactions._tgt, 10, "target"); delete out.interactions._tgt;
  out.feedback.recent = out.feedback.recent.sort((a, b) => (a.t < b.t ? 1 : -1)).slice(0, 20);
  out.recent = out.recent.sort((a, b) => (a.t < b.t ? 1 : -1)).slice(0, 25);
  return out;
}

// MODE=iframe: renderiza REDIRECT_URL num iframe de tela cheia + carrega o widget de feedback (Fale Conosco)
function iframePage() {
  return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>' + FRAME_TITLE + '</title>' +
    '<style>html,body{margin:0;height:100%;overflow:hidden;background:#000}iframe{border:0;width:100vw;height:100vh;display:block}</style>' +
    '</head><body>' +
    '<iframe src="' + REDIRECT_URL + '" allow="autoplay; fullscreen; gamepad" title="' + FRAME_TITLE + '"></iframe>' +
    '<script src="/yuri/feedback.js?v=20260602f" defer></script>' +
    '</body></html>';
}

const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "application/javascript",
  ".mjs": "application/javascript", ".json": "application/json", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp",
  ".gif": "image/gif", ".ico": "image/x-icon", ".pdf": "application/pdf", ".woff2": "font/woff2",
  ".woff": "font/woff", ".ttf": "font/ttf", ".md": "text/markdown; charset=utf-8", ".txt": "text/plain; charset=utf-8"
};

const server = http.createServer(async (req, res) => {
  let url = (req.url || "/").split("?")[0].split("#")[0];
  try { url = decodeURIComponent(url); } catch (e) {}

  // recebe feedback (same-origin, sem CORS), LOGA no stdout (→ fly logs) e ENCAMINHA pro co
  if (req.method === "POST" && url === "/api/feedback") {
    let body = "";
    req.on("data", c => { body += c; if (body.length > 16384) req.destroy(); });
    req.on("end", async () => {
      let d; try { d = JSON.parse(body || "{}"); } catch (e) { d = { raw: String(body).slice(0, 500) }; }
      const ev = { t: new Date().toISOString(), universe: UNIVERSE, page: d.entry_path || d.page || null,
        sentiment: typeof d.sentiment === "number" ? d.sentiment : 0, message: d.message || "",
        contact: d.contact || d.email || null, kind: d.kind || "feedback", broadcast: { co: "pending" } };
      console.log("[FEEDBACK] " + ev.t + " " + JSON.stringify(d));
      try {   // broadcast pro co (consentido no envio); registra status — NÃO é a fonte da verdade
        const r = await fetch(CO_FEEDBACK, {
          method: "POST", headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(12000),
          body: JSON.stringify({ universe: UNIVERSE, kind: ev.kind, message: ev.message, entry_path: ev.page, name: d.name, email: d.email })
        });
        ev.broadcast.co = (r && r.ok) ? "ok" : "failed"; ev.broadcast.status = r && r.status;
        console.log("[FEEDBACK] co broadcast " + ev.broadcast.co + " (" + UNIVERSE + ")");
      } catch (e) { ev.broadcast.co = "failed"; ev.broadcast.error = String(e && e.message).slice(0, 120); console.log("[FEEDBACK] co-forward-failed " + (e && e.message)); }
      await teleSave(ev);   // estado DA universe — fonte da verdade
      res.writeHead(200, { "content-type": "application/json" }); res.end(JSON.stringify({ ok: true, broadcast: ev.broadcast.co }));
    });
    return;
  }

  // acesso/interação (GA-like): pageview + clique. Estado DA universe; NÃO vai pro co
  // (só feedback, consentido, é broadcastado). O beacon respeita DNT no cliente.
  if (req.method === "POST" && url === "/api/track") {
    let body = "";
    req.on("data", c => { body += c; if (body.length > 8192) req.destroy(); });
    req.on("end", async () => {
      let d; try { d = JSON.parse(body || "{}"); } catch (e) { d = {}; }
      const kind = d.kind === "interaction" ? "interaction" : "pageview";
      const ev = { t: d.t || new Date().toISOString(), universe: UNIVERSE, kind: kind,
        page: d.page || null, referrer: d.referrer || null, session: d.session || null,
        action: d.action || null, target: d.target ? String(d.target).slice(0, 200) : null,
        outbound: !!d.outbound, lang: d.lang || null, vw: d.vw || null };
      await teleSave(ev);
      res.writeHead(204); res.end();
    });
    return;
  }

  if (url === "/api/health") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end('{"ok":true,"surface":"' + SURFACE + '","mode":"' + MODE + '"}');
  }

  // telemetria DA universe (estado local). ?local=1 = só este surface (usado p/ agregar).
  if (url === "/api/telemetry") {
    const q = new URL(req.url, "http://x").searchParams;
    const localAgg = teleAgg(TELE_MEM);
    const meta = { universe: UNIVERSE, surface: SURFACE, source: "universe-state", durable: TELE_DURABLE,
      co: { endpoint: CO_FEEDBACK, role: "broadcast-target", read: false,
            verify: "co (universe='" + UNIVERSE + "') deve ter >= broadcast.ok linhas; failed/pending = não confirmado no co" } };
    if (q.get("local") === "1") {
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify(Object.assign({}, meta, localAgg)));
    }
    const surfaces = [{ surface: SURFACE, url: "local", ok: true, total: localAgg.total, durable: TELE_DURABLE, self: true }];
    const aggs = [localAgg];
    for (const s of SIBLINGS) {           // agrega surfaces irmãs (server-side, sem CORS); ?local=1 evita recursão
      try {
        const r = await fetch(s.replace(/\/$/, "") + "/api/telemetry?local=1", { signal: AbortSignal.timeout(4000) });
        if (r && r.ok) { const j = await r.json(); aggs.push(j); surfaces.push({ surface: j.surface || s, url: s, ok: true, total: j.total, durable: j.durable }); }
        else surfaces.push({ surface: s, url: s, ok: false, status: r && r.status });
      } catch (e) { surfaces.push({ surface: s, url: s, ok: false, error: String(e && e.message).slice(0, 80) }); }
    }
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify(Object.assign({}, meta, teleCombine(aggs), { surfaces })));
  }
  if (url === "/analytics" || url === "/analytics/") url = SURFACE + "analytics/index.html";
  if (MODE === "iframe" && (url === "/" || url === "")) {   // comunicacao → jogo no iframe + feedback
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    return res.end(iframePage());
  }
  if (MODE === "redirect") {
    res.writeHead(302, { Location: REDIRECT_URL });
    return res.end();
  }
  if (url === "/" || url === "") url = SURFACE + "index.html";

  let fp = path.normalize(path.join(ROOT, url));
  if (fp !== ROOT && !fp.startsWith(ROOT + path.sep)) { res.writeHead(403); return res.end("forbidden"); }
  try {
    let st = await fs.stat(fp);
    if (st.isDirectory()) { fp = path.join(fp, "index.html"); st = await fs.stat(fp); }
    res.writeHead(200, {
      "content-type": MIME[path.extname(fp).toLowerCase()] || "application/octet-stream",
      "cache-control": "public, max-age=60"
    });
    createReadStream(fp).pipe(res);
  } catch (e) {
    res.writeHead(404, { "content-type": "text/html; charset=utf-8" });
    res.end('<!doctype html><meta charset=utf-8><title>404</title><body style="font-family:monospace;padding:3rem">404 — not found</body>');
  }
});

teleInit().finally(() => server.listen(PORT, () => console.log("surface=" + SURFACE + " mode=" + MODE + " universe=" + UNIVERSE + " on :" + PORT)));
