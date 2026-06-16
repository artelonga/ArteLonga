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
import { execSync } from "node:child_process";
import path from "node:path";
import os from "node:os";
import { appendFile, readFile, mkdir } from "node:fs/promises";

// versão observável: SURFACE_VERSION (env) → SHA curto do git (capturado no boot) → "dev"
function surfaceVersion() {
  if (process.env.SURFACE_VERSION) return process.env.SURFACE_VERSION;
  try { return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim() || "dev"; }
  catch { return "dev"; }
}
const VERSION = surfaceVersion();

const PORT = +(process.env.PORT || 8080);
const ROOT = path.resolve(process.env.ROOT || process.cwd());
const FEEDBACK_UNIVERSE = process.env.FEEDBACK_UNIVERSE || "";   // universo do co p/ encaminhar feedback (por app)
// default da SURFACE deriva da universe (FEEDBACK_UNIVERSE) em vez de hardcodar "/yuri/",
// pra cada deploy reportar a SUA superfície mesmo sem SURFACE setado (ex. comunicacao).
const SURFACE = (process.env.SURFACE || (FEEDBACK_UNIVERSE ? "/" + FEEDBACK_UNIVERSE + "/" : "/yuri/")).replace(/\/?$/, "/");
const MODE = process.env.MODE || "static";
const REDIRECT_URL = process.env.REDIRECT_URL || "https://yggdrasil.artelonga.com.br/universos/comunicacao";
const FRAME_TITLE = process.env.FRAME_TITLE || "comunicação · Arte Longa";

// ── telemetria: estado DA universe (fonte da verdade local) ─────────────────
// Princípio (decisão do dono): a universe é DONA da sua telemetria, salva no
// próprio estado. O co é ALVO DE BROADCAST, consentido no envio — nunca a fonte
// de leitura. /analytics lê /api/telemetry deste servidor, agrega as surfaces
// IRMÃS da mesma universe (server-side, sem CORS) e só REPORTA o status do
// broadcast pro co (o que checar lá) — sem depender de ler do co.
const UNIVERSE = FEEDBACK_UNIVERSE || "yuri";
const CO_FEEDBACK = process.env.CO_FEEDBACK || "https://co.artelonga.com.br/api/v1/feedback";
const SIBLINGS = (process.env.SIBLINGS || "").split(",").map(s => s.trim()).filter(Boolean);
// ── rollup → parent artelonga (co) ──────────────────────────────────────────
// Producer da Option C: a surface empurra DailyRollup diário (consentido, SEM PII)
// pro warehouse central do co, keyed by universe. Liga só se CO_ROLLUP_TOKEN setado
// (e só na surface PRIMÁRIA da universe, p/ não colidir no upsert (universe,day)).
const CO_ROLLUP_URL = process.env.CO_ROLLUP_URL || "https://co.artelonga.com.br/api/v1/analytics/public/rollups";
const CO_ROLLUP_TOKEN = process.env.CO_ROLLUP_TOKEN || "";
const ROLLUP_DAYS = +(process.env.ROLLUP_DAYS || 3);             // dias finalizados/recentes por push
const ROLLUP_INTERVAL_MS = +(process.env.ROLLUP_INTERVAL_MS || 1800000);  // debounce no tráfego (30min)
let lastRollupPush = 0;
// ── ler de volta o histórico da artelonga PAI (co) ──────────────────────────
// Bidirecional: além de empurrar (acima), a surface LÊ o summary unificado do co
// pra ESTA universe (histórico /yuri pré-CNAME + rollups), pra mostrar no child.
// É o PRÓPRIO dado da universe (não de terceiros) — reclamado de volta. Opt-in (env).
const CO_HISTORY = process.env.CO_HISTORY || "";   // ex. co…/analytics/public/summary?universe=yuri&days=90
let PARENT_CACHE = { at: 0, data: null };
const TELE_DIR = process.env.TELEMETRY_DIR || "/data";
const TELE_DURABLE = process.env.TELEMETRY_DURABLE === "1";    // true só com volume montado
let TELE_FILE = path.join(TELE_DIR, "telemetry-" + UNIVERSE + ".jsonl");
const TELE_MEM = [];                                           // cache em memória (carregado no boot)

// ── geo EMBARCADO (país, sem chamada externa, IP nunca persistido) ──────────
// Lê o binário CC0 compilado por tools/bake-geo.mjs (formato AG41, ver
// docs/telemetry-surfaces.md §2). País resolvido no ingest a partir do IP do
// cliente; só o país é gravado no evento — o IP cru é descartado.
const GEO_DB = process.env.GEO_DB || path.join(ROOT, "yuri/geo/ip4-country.bin");
const GEO6_DB = process.env.GEO6_DB || path.join(ROOT, "yuri/geo/ip6-country.bin");
const CITY_DB = process.env.CITY_DB || path.join(ROOT, "yuri/geo/ip4-city.bin");  // DB-IP CC-BY, build-time, IPv4 só
let GEO = null;                                                // v4: { starts: Uint32Array, codes: Buffer, count }
let GEO6 = null;                                               // v6: { starts: Buffer(16B×count), codes: Buffer, count }
let CITY = null;                                               // v4 city: { starts: Uint32Array, ids: Uint32Array, locs: string[], count }
function geoInit() {                                           // AG41 (IPv4)
  try {
    const buf = readFileSync(GEO_DB);
    if (buf.length < 8 || buf.toString("ascii", 0, 4) !== "AG41") { console.log("[GEO] v4 formato inválido"); return; }
    const count = buf.readUInt32LE(4);
    const starts = new Uint32Array(count);
    for (let i = 0; i < count; i++) starts[i] = buf.readUInt32LE(8 + i * 4);
    GEO = { starts, codes: buf.subarray(8 + count * 4), count };
    console.log("[GEO] v4 " + count + " faixas de " + GEO_DB);
  } catch (e) { console.log("[GEO] v4 desabilitado (" + (e && e.message) + ")"); }
}
function geo6Init() {                                          // AG61 (IPv6)
  try {
    const buf = readFileSync(GEO6_DB);
    if (buf.length < 8 || buf.toString("ascii", 0, 4) !== "AG61") { console.log("[GEO] v6 formato inválido"); return; }
    const count = buf.readUInt32LE(4);
    GEO6 = { starts: buf.subarray(8, 8 + count * 16), codes: buf.subarray(8 + count * 16), count };
    console.log("[GEO] v6 " + count + " faixas de " + GEO6_DB);
  } catch (e) { console.log("[GEO] v6 desabilitado (" + (e && e.message) + ")"); }
}
function cityInit() {                                          // AGC4 (DB-IP city v4) — opcional
  try {
    const buf = readFileSync(CITY_DB);
    if (buf.length < 12 || buf.toString("ascii", 0, 4) !== "AGC4") { console.log("[GEO] city formato inválido"); return; }
    const count = buf.readUInt32LE(4), locCount = buf.readUInt32LE(8);
    const starts = new Uint32Array(count), ids = new Uint32Array(count);
    let off = 12;
    for (let i = 0; i < count; i++) { starts[i] = buf.readUInt32LE(off); off += 4; }
    for (let i = 0; i < count; i++) { ids[i] = buf.readUInt32LE(off); off += 4; }
    const locs = new Array(locCount);
    for (let i = 0; i < locCount; i++) { const len = buf.readUInt16LE(off); off += 2; locs[i] = buf.toString("utf8", off, off + len); off += len; }
    CITY = { starts, ids, locs, count };
    console.log("[GEO] city v4 " + count + " faixas / " + locCount + " locais de " + CITY_DB);
  } catch (e) { console.log("[GEO] city desabilitado (" + (e && e.message) + ")"); }
}
function ip2int(ip) {
  const m = String(ip || "").match(/(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})/);   // IPv4 (inclui ::ffff:a.b.c.d)
  if (!m) return null;
  const a = +m[1], b = +m[2], c = +m[3], d = +m[4];
  if (a > 255 || b > 255 || c > 255 || d > 255) return null;
  return ((a * 16777216) + (b * 65536) + (c * 256) + d) >>> 0;
}
function geoCity(ip) {                                         // {country, region, city} ou null (IPv4 só)
  if (!CITY) return null;
  const n = ip2int(ip); if (n == null) return null;
  let lo = 0, hi = CITY.count - 1, ans = -1;
  while (lo <= hi) { const mid = (lo + hi) >> 1; if (CITY.starts[mid] <= n) { ans = mid; lo = mid + 1; } else hi = mid - 1; }
  if (ans < 0) return null;
  const s = CITY.locs[CITY.ids[ans]]; if (!s) return null;
  const p = s.split("|");                                     // país|região|cidade
  if (!p[2] && !p[1]) return null;
  return { country: p[0] || null, region: p[1] || null, city: p[2] || null };
}
function ip6Bytes(s) {                                          // IPv6 string → Buffer 16B BE (ou null)
  s = String(s || "").trim().split("%")[0];
  if (s.indexOf(":") < 0) return null;
  if (s.indexOf(".") >= 0) {                                    // IPv4 embutido
    const li = s.lastIndexOf(":"), m = s.slice(li + 1).match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (!m) return null;
    const b = m.slice(1).map(Number); if (b.some(x => x > 255)) return null;
    s = s.slice(0, li + 1) + ((b[0] << 8) | b[1]).toString(16) + ":" + ((b[2] << 8) | b[3]).toString(16);
  }
  const parts = s.split("::"); if (parts.length > 2) return null;
  const head = parts[0] ? parts[0].split(":") : [];
  const tail = parts.length === 2 ? (parts[1] ? parts[1].split(":") : []) : null;
  let hx;
  if (tail === null) { hx = head; if (hx.length !== 8) return null; }
  else { const fill = 8 - head.length - tail.length; if (fill < 0) return null; hx = head.concat(Array(fill).fill("0")).concat(tail); }
  if (hx.length !== 8) return null;
  const buf = Buffer.alloc(16);
  for (let i = 0; i < 8; i++) { if (!/^[0-9a-fA-F]{1,4}$/.test(hx[i])) return null; const v = parseInt(hx[i], 16); buf[i * 2] = (v >> 8) & 0xff; buf[i * 2 + 1] = v & 0xff; }
  return buf;
}
function geo4(ip) {
  if (!GEO) return null;
  const n = ip2int(ip); if (n == null) return null;
  let lo = 0, hi = GEO.count - 1, ans = -1;                    // maior start <= n
  while (lo <= hi) { const mid = (lo + hi) >> 1; if (GEO.starts[mid] <= n) { ans = mid; lo = mid + 1; } else hi = mid - 1; }
  if (ans < 0) return null;
  const c0 = GEO.codes[ans * 2], c1 = GEO.codes[ans * 2 + 1];
  return (!c0 || !c1) ? null : String.fromCharCode(c0, c1);
}
function geo6(ip) {
  if (!GEO6) return null;
  const q = ip6Bytes(ip); if (!q) return null;
  let lo = 0, hi = GEO6.count - 1, ans = -1;                   // maior start <= q (compara bytes BE)
  while (lo <= hi) { const mid = (lo + hi) >> 1; if (Buffer.compare(GEO6.starts.subarray(mid * 16, mid * 16 + 16), q) <= 0) { ans = mid; lo = mid + 1; } else hi = mid - 1; }
  if (ans < 0) return null;
  const c0 = GEO6.codes[ans * 2], c1 = GEO6.codes[ans * 2 + 1];
  return (!c0 || !c1) ? null : String.fromCharCode(c0, c1);
}
function geoCountry(ip) {                                       // dispatch v4/v6; null se desconhecido/privado
  const s = String(ip || "");
  if (/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(s)) return geo4(s);   // IPv4 ou ::ffff:a.b.c.d
  if (s.indexOf(":") >= 0) return geo6(s);
  return null;
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
  const sess = {}, refs = {}, pvPages = {}, geo = {}, tsMap = {}, acq = {}, devs = {}, cities = {};
  const vidDays = {}, sessPv = {};                            // retenção (vid→dias) e bounce (sessão→#pageviews)
  pv.forEach(e => {
    if (e.session) { sess[e.session] = 1; sessPv[e.session] = (sessPv[e.session] || 0) + 1; }
    const r = refDomain(e.referrer); if (r) refs[r] = (refs[r] || 0) + 1;
    const p = e.page || "?"; pvPages[p] = (pvPages[p] || 0) + 1;
    if (e.country) geo[e.country] = (geo[e.country] || 0) + 1;
    if (e.city) { const ck = e.city + (e.country ? (", " + e.country) : ""); cities[ck] = (cities[ck] || 0) + 1; }
    const d = dayOf(e.t); if (d) tsMap[d] = (tsMap[d] || 0) + 1;
    if (e.vid) (vidDays[e.vid] = vidDays[e.vid] || new Set()).add(dayOf(e.t));
    const src = (e.utm && e.utm.source) || r || "(direto)";  // aquisição: utm_source → referrer → direto
    acq[src] = (acq[src] || 0) + 1;
    const dev = e.vw ? (e.vw < 768 ? "mobile" : e.vw < 1024 ? "tablet" : "desktop") : "(desconhecido)";  // categoria por viewport
    devs[dev] = (devs[dev] || 0) + 1;
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
    acquisition: topN(acq, 10, "source"),
    devices: topN(devs, 5, "device"),
    timeseries: timeseries,
    retention: { visitors: visitors, returning: returning, _bounce: { bounced: bounced, sessions: allSess.size }, _dwell: { sum: dwellSum, pageviews: pv.length } },
    geo: topN(geo, 12, "country"),
    cities: topN(cities, 12, "city"),
    interactions: { total: ix.length, outbound: outbound, topTargets: topN(tgt, 10, "target") },
    conversions: { total: go.length, top: topN(goals, 12, "goal") },
    feedback: { total: fb.length, bySentiment: bySent, broadcast: bc,
      recent: fb.slice(-20).reverse().map(e => ({ t: e.t, page: e.page, sentiment: e.sentiment, message: (e.message || "").slice(0, 280), broadcast: e.broadcast, surface: SURFACE })) },
    recent: events.slice(-25).reverse().map(e => ({ t: e.t, kind: e.kind || "feedback", page: e.page, sentiment: e.sentiment, action: e.action, target: e.target, outbound: e.outbound, goal: e.goal, country: e.country, city: e.city, dur: e.dur, message: (e.message || "").slice(0, 140), surface: SURFACE }))
  };
}
function mergeCounts(dst, list, keyName) { (list || []).forEach(x => { dst[x[keyName]] = (dst[x[keyName]] || 0) + x.n; }); }
function teleCombine(aggs) {      // soma agregados de várias surfaces da MESMA universe
  const out = { total: 0,
    access: { pageviews: 0, sessions: 0, visitors: 0, returning: 0, _pages: {}, _refs: {} },
    acquisition: {},  // source → count (consolidado abaixo)
    devices: {},      // device → count (consolidado abaixo)
    timeseries: {},   // bucket → count (consolidado abaixo)
    retention: { visitors: 0, returning: 0, bounced: 0, sessions: 0, dwellSum: 0, pageviews: 0 },
    geo: {},          // country → n (consolidado abaixo)
    cities: {},       // city → n (consolidado abaixo)
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
    mergeCounts(out.acquisition, a.acquisition, "source");
    mergeCounts(out.devices, a.devices, "device");
    (a.timeseries || []).forEach(p => { out.timeseries[p.bucket] = (out.timeseries[p.bucket] || 0) + (p.count || 0); });
    mergeCounts(out.geo, a.geo, "country");
    mergeCounts(out.cities, a.cities, "city");
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
  out.acquisition = topN(out.acquisition, 10, "source");
  out.devices = topN(out.devices, 5, "device");
  out.timeseries = Object.keys(out.timeseries).sort().map(d => ({ bucket: d, count: out.timeseries[d] }));
  out.geo = topN(out.geo, 12, "country");
  out.cities = topN(out.cities, 12, "city");
  out.interactions.topTargets = topN(out.interactions._tgt, 10, "target"); delete out.interactions._tgt;
  out.conversions.top = topN(out.conversions._top, 12, "goal"); delete out.conversions._top;
  const rt = out.retention;                       // métricas derivadas pro display
  rt.bounceRate = rt.sessions > 0 ? Math.round(rt.bounced / rt.sessions * 100) : 0;
  rt.dwellAvgMs = rt.pageviews > 0 ? Math.round(rt.dwellSum / rt.pageviews) : 0;
  out.feedback.recent = out.feedback.recent.sort((a, b) => (a.t < b.t ? 1 : -1)).slice(0, 20);
  out.recent = out.recent.sort((a, b) => (a.t < b.t ? 1 : -1)).slice(0, 25);
  return out;
}

// ── DailyRollup (schema do artelonga): agregado CONSENTIDO de UM dia, SEM PII.
// Só contagens — vid/session/IP não saem. `returning` = vid do dia visto antes dele.
function dayRollup(all, day) {
  const ev = all.filter(e => dayOf(e.t) === day);
  if (!ev.length) return null;
  const pv = ev.filter(e => e.kind === "pageview");
  const ix = ev.filter(e => e.kind === "interaction");
  const pe = ev.filter(e => e.kind === "page_end");
  const go = ev.filter(e => e.kind === "goal");
  const vids = new Set(pv.map(e => e.vid).filter(Boolean));
  const earlier = new Set(all.filter(e => e.kind === "pageview" && e.vid && dayOf(e.t) < day).map(e => e.vid));
  let returning = 0; vids.forEach(v => { if (earlier.has(v)) returning++; });
  const sessPv = {}, sessIx = {};
  pv.forEach(e => { if (e.session) sessPv[e.session] = (sessPv[e.session] || 0) + 1; });
  ix.forEach(e => { if (e.session) sessIx[e.session] = 1; });
  const allSess = new Set([...Object.keys(sessPv), ...Object.keys(sessIx)]);
  let bounced = 0; allSess.forEach(s => { if ((sessPv[s] || 0) <= 1 && !sessIx[s]) bounced++; });
  let dwell = 0; pe.forEach(e => { if (typeof e.dur === "number") dwell += e.dur; });
  const geo = {}, device = {}, source = {}, pages = {}, goals = {}, referrers = {};
  pv.forEach(e => {
    if (e.country) geo[e.country] = (geo[e.country] || 0) + 1;
    const dev = e.vw ? (e.vw < 768 ? "mobile" : e.vw < 1024 ? "tablet" : "desktop") : "(desconhecido)";
    device[dev] = (device[dev] || 0) + 1;
    const r = refDomain(e.referrer); if (r) referrers[r] = (referrers[r] || 0) + 1;
    const src = (e.utm && e.utm.source) || r || "(direto)"; source[src] = (source[src] || 0) + 1;
    const p = e.page || "?"; pages[p] = (pages[p] || 0) + 1;
  });
  go.forEach(e => { const k = e.goal || "?"; goals[k] = (goals[k] || 0) + 1; });
  return {
    universe: UNIVERSE, day, schema: 1,
    metrics: { pageviews: pv.length, visitors: vids.size, returning,
      sessions: Object.keys(sessPv).length, bounced, dwell_ms_sum: dwell, conversions: go.length },
    dims: { geo: topN(geo, 20, "country"), device: topN(device, 5, "device"),
      source: topN(source, 10, "source"), pages: topN(pages, 20, "page"),
      goals: topN(goals, 20, "goal"), referrers: topN(referrers, 10, "ref") }
  };
}

// Empurra os últimos ROLLUP_DAYS dias pro co (upsert idempotente por universe+day).
// No-op sem token. Non-fatal: o estado local é a fonte da verdade; isto é broadcast.
async function pushRollups() {
  if (!CO_ROLLUP_TOKEN) return;
  for (let i = 0; i < ROLLUP_DAYS; i++) {
    const day = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    const r = dayRollup(TELE_MEM, day);
    if (!r) continue;
    try {
      const res = await fetch(CO_ROLLUP_URL, {
        method: "POST", signal: AbortSignal.timeout(8000),
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + CO_ROLLUP_TOKEN },
        body: JSON.stringify(r)
      });
      if (!(res && res.ok)) console.log("[ROLLUP] " + day + " → co " + (res && res.status));
    } catch (e) { console.log("[ROLLUP] push-failed " + day + " " + (e && e.message)); }
  }
}

// Lê o summary unificado da universe no co (histórico + rollups), cache 5min. Non-fatal.
async function fetchParent() {
  if (!CO_HISTORY) return null;
  if (Date.now() - PARENT_CACHE.at < 300000) return PARENT_CACHE.data;
  try {
    const r = await fetch(CO_HISTORY, { signal: AbortSignal.timeout(4000) });
    if (r && r.ok) { PARENT_CACHE = { at: Date.now(), data: await r.json() }; }
  } catch (e) { /* mantém cache anterior */ }
  return PARENT_CACHE.data;
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
    const ip = clientIp(req);                    // resolve geo no ingest; IP NÃO é guardado
    const country = geoCountry(ip);
    const place = geoCity(ip);                   // {country,region,city} ou null (IPv4 só)
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
        utm: (d.utm && typeof d.utm === "object") ? {                                                   // aquisição (campanha)
          source: d.utm.source ? String(d.utm.source).slice(0, 80) : null,
          medium: d.utm.medium ? String(d.utm.medium).slice(0, 80) : null,
          campaign: d.utm.campaign ? String(d.utm.campaign).slice(0, 80) : null } : null,
        country: country || (place && place.country) || null,
        region: place && place.region || null,
        city: place && place.city || null };
      await teleSave(ev);
      res.writeHead(204); res.end();
      // debounce: empurra rollups pro co enquanto a máquina está de pé (auto-stop = sem timer residente)
      if (CO_ROLLUP_TOKEN && Date.now() - lastRollupPush > ROLLUP_INTERVAL_MS) {
        lastRollupPush = Date.now();
        pushRollups().catch(() => {});
      }
    });
    return;
  }

  if (url === "/api/health") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({ ok: true, version: VERSION, surface: SURFACE, mode: MODE }));
  }

  // telemetria DA universe (estado local). ?local=1 = só este surface (usado p/ agregar).
  if (url === "/api/telemetry") {
    const q = new URL(req.url, "http://x").searchParams;
    const localAgg = teleAgg(TELE_MEM);
    const meta = { universe: UNIVERSE, surface: SURFACE, source: "universe-state", durable: TELE_DURABLE,
      co: { endpoint: CO_FEEDBACK, role: CO_ROLLUP_TOKEN ? "broadcast + rollup" : "broadcast-target",
            read: !!CO_HISTORY, rollup: !!CO_ROLLUP_TOKEN,
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
    const parent = await fetchParent();   // histórico unificado da universe no co (bidirecional)
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify(Object.assign({}, meta, teleCombine(aggs), { surfaces, parent })));
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

  // resolve traversal-safe: {fp} pra arquivo · {dir} pra diretório · null
  const probe = async (u) => {
    const fp = path.normalize(path.join(ROOT, u));
    if (fp !== ROOT && !fp.startsWith(ROOT + path.sep)) return null;
    try { const st = await fs.stat(fp); return st.isDirectory() ? { dir: fp } : { fp }; }
    catch { return null; }
  };
  // 1) caminho direto;  2) universe promovida serve na PRÓPRIA raiz → /aws = SURFACE/aws (yuri/aws/).
  let hit = await probe(url);
  if (!hit && SURFACE !== "/" && !url.startsWith(SURFACE)) hit = await probe(SURFACE + url.replace(/^\/+/, ""));
  if (hit && hit.dir) {
    // diretório SEM barra final → 301 com barra. Senão os links RELATIVOS da página
    // (ex. toggle "en/") resolvem contra o pai (/aws → /en/) e dão 404 — causa-raiz do bug.
    if (!url.endsWith("/")) {
      const qi = (req.url || "").indexOf("?");
      res.writeHead(301, { Location: url + "/" + (qi >= 0 ? req.url.slice(qi) : "") });
      return res.end();
    }
    const idx = path.join(hit.dir, "index.html");
    hit = await fs.stat(idx).then(() => ({ fp: idx }), () => null);
  }
  if (hit && hit.fp) {
    res.writeHead(200, {
      "content-type": MIME[path.extname(hit.fp).toLowerCase()] || "application/octet-stream",
      "cache-control": "public, max-age=60"
    });
    return createReadStream(hit.fp).pipe(res);
  }
  res.writeHead(404, { "content-type": "text/html; charset=utf-8" });
  res.end('<!doctype html><meta charset=utf-8><title>404</title><body style="font-family:monospace;padding:3rem">404 — not found</body>');
});

geoInit(); geo6Init(); cityInit();
teleInit().finally(() => server.listen(PORT, () => {
  console.log("surface=" + SURFACE + " mode=" + MODE + " universe=" + UNIVERSE + " on :" + PORT);
  if (CO_ROLLUP_TOKEN) { lastRollupPush = Date.now(); pushRollups().catch(() => {}); }   // push no cold-start
}));
