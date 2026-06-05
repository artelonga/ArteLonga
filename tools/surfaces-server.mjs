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
import { createReadStream, readFileSync } from "node:fs";
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

// ── geo EMBARCADO (país, sem chamada externa, IP nunca persistido) ──────────
// Lê o binário CC0 compilado por tools/bake-geo.mjs (formato AG41, ver
// docs/telemetry-surfaces.md §2). País resolvido no ingest a partir do IP do
// cliente; só o país é gravado no evento — o IP cru é descartado.
const GEO_DB = process.env.GEO_DB || path.join(ROOT, "yuri/geo/ip4-country.bin");
let GEO = null;                                                // { starts: Uint32Array, codes: Buffer, count }
function geoInit() {
  try {
    const buf = readFileSync(GEO_DB);
    if (buf.length < 8 || buf.toString("ascii", 0, 4) !== "AG41") { console.log("[GEO] formato inválido"); return; }
    const count = buf.readUInt32LE(4);
    const starts = new Uint32Array(count);
    for (let i = 0; i < count; i++) starts[i] = buf.readUInt32LE(8 + i * 4);
    GEO = { starts, codes: buf.subarray(8 + count * 4), count };
    console.log("[GEO] " + count + " faixas de " + GEO_DB);
  } catch (e) { console.log("[GEO] desabilitado (" + (e && e.message) + ")"); }
}
function ip2int(ip) {
  const m = String(ip || "").match(/(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})/);   // IPv4 (inclui ::ffff:a.b.c.d)
  if (!m) return null;
  const a = +m[1], b = +m[2], c = +m[3], d = +m[4];
  if (a > 255 || b > 255 || c > 255 || d > 255) return null;
  return ((a * 16777216) + (b * 65536) + (c * 256) + d) >>> 0;
}
function geoCountry(ip) {                                       // null se desconhecido/IPv6/privado
  if (!GEO) return null;
  const n = ip2int(ip);
  if (n == null) return null;
  let lo = 0, hi = GEO.count - 1, ans = -1;                    // maior start <= n
  while (lo <= hi) { const mid = (lo + hi) >> 1; if (GEO.starts[mid] <= n) { ans = mid; lo = mid + 1; } else hi = mid - 1; }
  if (ans < 0) return null;
  const c0 = GEO.codes[ans * 2], c1 = GEO.codes[ans * 2 + 1];
  if (!c0 || !c1) return null;                                 // "\0\0" = gap/desconhecido
  return String.fromCharCode(c0, c1);
}
function clientIp(req) {
  const h = req.headers || {};
  const xf = (h["x-forwarded-for"] || "").split(",")[0];
  return String(h["fly-client-ip"] || xf || (req.socket && req.socket.remoteAddress) || "").trim();
}

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
const dayOf = t => (t || "").slice(0, 10);                    // "2026-06-05T..." → "2026-06-05"
// telemetria GA-like: pageview (acesso) · interaction (clique) · page_end (dwell)
// · goal (conversão) · feedback (consentido). Agrega acesso, retenção (vid),
// timeseries diário, dwell, conversões e geo (país). Ver docs/telemetry-surfaces.md.
function teleAgg(events) {
  const fb = events.filter(e => (e.kind || "feedback") === "feedback");
  const pv = events.filter(e => e.kind === "pageview");
  const ix = events.filter(e => e.kind === "interaction");
  const pe = events.filter(e => e.kind === "page_end");
  const go = events.filter(e => e.kind === "goal");
  const bySent = { up: 0, neutral: 0, down: 0 }, bc = { ok: 0, failed: 0, pending: 0 };
  fb.forEach(e => { bySent[e.sentiment > 0 ? "up" : e.sentiment < 0 ? "down" : "neutral"]++; const st = (e.broadcast && e.broadcast.co) || "pending"; if (bc[st] != null) bc[st]++; });
  const sess = {}, refs = {}, pvPages = {}, geo = {}, tsMap = {};
  const vidDays = {}, sessPv = {};                            // retenção (vid→dias) e bounce (sessão→#pageviews)
  pv.forEach(e => {
    if (e.session) { sess[e.session] = 1; sessPv[e.session] = (sessPv[e.session] || 0) + 1; }
    const r = refDomain(e.referrer); if (r) refs[r] = (refs[r] || 0) + 1;
    const p = e.page || "?"; pvPages[p] = (pvPages[p] || 0) + 1;
    if (e.country) geo[e.country] = (geo[e.country] || 0) + 1;
    const d = dayOf(e.t); if (d) tsMap[d] = (tsMap[d] || 0) + 1;
    if (e.vid) (vidDays[e.vid] = vidDays[e.vid] || new Set()).add(dayOf(e.t));
  });
  const tgt = {}, sessIx = {}; let outbound = 0;
  ix.forEach(e => { if (e.outbound) outbound++; const k = e.target || e.action || "?"; tgt[k] = (tgt[k] || 0) + 1; if (e.session) sessIx[e.session] = 1; });
  // retenção: visitantes únicos (vid) e recorrentes (vid visto em mais de um dia)
  const visitors = Object.keys(vidDays).length;
  let returning = 0; for (const v in vidDays) if (vidDays[v].size > 1) returning++;
  // bounce: sessões com ≤1 pageview e nenhuma interação
  const allSess = new Set([...Object.keys(sessPv), ...Object.keys(sessIx)]);
  let bounced = 0; allSess.forEach(s => { if ((sessPv[s] || 0) <= 1 && !sessIx[s]) bounced++; });
  // dwell: soma de ms ativos (page_end). Média por pageview computada no display.
  let dwellSum = 0; pe.forEach(e => { if (typeof e.dur === "number") dwellSum += e.dur; });
  // conversões
  const goals = {}; go.forEach(e => { const k = e.goal || "?"; goals[k] = (goals[k] || 0) + 1; });
  const timeseries = Object.keys(tsMap).sort().map(d => ({ bucket: d, count: tsMap[d] }));
  return {
    total: events.length,
    access: { pageviews: pv.length, sessions: Object.keys(sess).length, visitors: visitors, returning: returning,
      topPages: topN(pvPages, 12, "page"), referrers: topN(refs, 8, "ref") },
    timeseries: timeseries,
    retention: { visitors: visitors, returning: returning, _bounce: { bounced: bounced, sessions: allSess.size }, _dwell: { sum: dwellSum, pageviews: pv.length } },
    geo: topN(geo, 12, "country"),
    interactions: { total: ix.length, outbound: outbound, topTargets: topN(tgt, 10, "target") },
    conversions: { total: go.length, top: topN(goals, 12, "goal") },
    feedback: { total: fb.length, bySentiment: bySent, broadcast: bc,
      recent: fb.slice(-20).reverse().map(e => ({ t: e.t, page: e.page, sentiment: e.sentiment, message: (e.message || "").slice(0, 280), broadcast: e.broadcast, surface: SURFACE })) },
    recent: events.slice(-25).reverse().map(e => ({ t: e.t, kind: e.kind || "feedback", page: e.page, sentiment: e.sentiment, action: e.action, target: e.target, outbound: e.outbound, goal: e.goal, country: e.country, dur: e.dur, message: (e.message || "").slice(0, 140), surface: SURFACE }))
  };
}
function mergeCounts(dst, list, keyName) { (list || []).forEach(x => { dst[x[keyName]] = (dst[x[keyName]] || 0) + x.n; }); }
function teleCombine(aggs) {      // soma agregados de várias surfaces da MESMA universe
  const out = { total: 0,
    access: { pageviews: 0, sessions: 0, visitors: 0, returning: 0, _pages: {}, _refs: {} },
    timeseries: {},   // bucket → count (consolidado abaixo)
    retention: { visitors: 0, returning: 0, bounced: 0, sessions: 0, dwellSum: 0, pageviews: 0 },
    geo: {},          // country → n (consolidado abaixo)
    interactions: { total: 0, outbound: 0, _tgt: {} },
    conversions: { total: 0, _top: {} },
    feedback: { total: 0, bySentiment: { up: 0, neutral: 0, down: 0 }, broadcast: { ok: 0, failed: 0, pending: 0 }, recent: [] },
    recent: [] };
  aggs.forEach(a => {
    if (!a) return;
    out.total += a.total || 0;
    const ac = a.access || {}, ix = a.interactions || {}, fb = a.feedback || {}, rt = a.retention || {}, cv = a.conversions || {};
    out.access.pageviews += ac.pageviews || 0; out.access.sessions += ac.sessions || 0;
    out.access.visitors += ac.visitors || 0; out.access.returning += ac.returning || 0;   // únicos somados entre surfaces = aproximado (mesmo vid pode cruzar)
    mergeCounts(out.access._pages, ac.topPages, "page"); mergeCounts(out.access._refs, ac.referrers, "ref");
    (a.timeseries || []).forEach(p => { out.timeseries[p.bucket] = (out.timeseries[p.bucket] || 0) + (p.count || 0); });
    mergeCounts(out.geo, a.geo, "country");
    out.retention.visitors += rt.visitors || 0; out.retention.returning += rt.returning || 0;
    if (rt._bounce) { out.retention.bounced += rt._bounce.bounced || 0; out.retention.sessions += rt._bounce.sessions || 0; }
    if (rt._dwell) { out.retention.dwellSum += rt._dwell.sum || 0; out.retention.pageviews += rt._dwell.pageviews || 0; }
    out.interactions.total += ix.total || 0; out.interactions.outbound += ix.outbound || 0;
    mergeCounts(out.interactions._tgt, ix.topTargets, "target");
    out.conversions.total += cv.total || 0; mergeCounts(out.conversions._top, cv.top, "goal");
    out.feedback.total += fb.total || 0;
    ["up", "neutral", "down"].forEach(k => out.feedback.bySentiment[k] += (fb.bySentiment && fb.bySentiment[k]) || 0);
    ["ok", "failed", "pending"].forEach(k => out.feedback.broadcast[k] += (fb.broadcast && fb.broadcast[k]) || 0);
    (fb.recent || []).forEach(r => out.feedback.recent.push(r));
    (a.recent || []).forEach(r => out.recent.push(r));
  });
  out.access.topPages = topN(out.access._pages, 12, "page"); delete out.access._pages;
  out.access.referrers = topN(out.access._refs, 8, "ref"); delete out.access._refs;
  out.timeseries = Object.keys(out.timeseries).sort().map(d => ({ bucket: d, count: out.timeseries[d] }));
  out.geo = topN(out.geo, 12, "country");
  out.interactions.topTargets = topN(out.interactions._tgt, 10, "target"); delete out.interactions._tgt;
  out.conversions.top = topN(out.conversions._top, 12, "goal"); delete out.conversions._top;
  const rt = out.retention;                       // métricas derivadas pro display
  rt.bounceRate = rt.sessions > 0 ? Math.round(rt.bounced / rt.sessions * 100) : 0;
  rt.dwellAvgMs = rt.pageviews > 0 ? Math.round(rt.dwellSum / rt.pageviews) : 0;
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
    const country = geoCountry(clientIp(req));   // resolve no ingest; IP NÃO é guardado
    let body = "";
    req.on("data", c => { body += c; if (body.length > 8192) req.destroy(); });
    req.on("end", async () => {
      let d; try { d = JSON.parse(body || "{}"); } catch (e) { d = {}; }
      // kinds: pageview (acesso) · interaction (clique) · page_end (dwell) · goal (conversão)
      const kind = (d.kind === "interaction" || d.kind === "page_end" || d.kind === "goal") ? d.kind : "pageview";
      const ev = { t: d.t || new Date().toISOString(), universe: UNIVERSE, kind: kind,
        page: d.page || null, referrer: d.referrer || null,
        session: d.session || null, vid: d.vid || null,
        action: d.action || null, target: d.target ? String(d.target).slice(0, 200) : null,
        outbound: !!d.outbound, lang: d.lang || null, vw: d.vw || null,
        dur: (typeof d.dur === "number" && d.dur >= 0) ? Math.min(Math.round(d.dur), 86400000) : null,  // page_end: ms ativos
        goal: d.goal ? String(d.goal).slice(0, 60) : null,                                              // goal: nome da conversão
        country: country };
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

geoInit();
teleInit().finally(() => server.listen(PORT, () => console.log("surface=" + SURFACE + " mode=" + MODE + " universe=" + UNIVERSE + " on :" + PORT)));
