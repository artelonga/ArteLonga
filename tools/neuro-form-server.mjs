#!/usr/bin/env node
/* tools/neuro-form-server.mjs — servidor mínimo (sem dependências) para a
 * apresentação /2026-05-29 e o formulário de feedback.
 *
 *   • serve os arquivos estáticos do repo (a página + /neuro/* + /yuri/*)
 *   • POST /api/feedback  → grava em DATA/feedback.ndjson (1 JSON por linha)
 *   • GET  /api/feedback.csv?key=ADMIN_KEY  → export/backup
 *   • GET  /api/health
 *
 * Backup = o arquivo DATA/feedback.ndjson (em produção, num volume Fly montado
 * em /data, sobrevive a restarts; baixe via /api/feedback.csv ou `fly ssh`).
 *
 * Local:   node tools/neuro-form-server.mjs   → http://localhost:8787/2026-05-29/
 * Env:     PORT (8787), ROOT (cwd), DATA (./data), ADMIN_KEY (proteção do export),
 *          ALLOW_ORIGIN ("*" — CORS p/ quando a página está noutro host).
 */
import http from "node:http";
import { promises as fs } from "node:fs";
import { createReadStream } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";

// versão observável: SURFACE_VERSION (env) → SHA curto do git (capturado no boot) → "dev"
function surfaceVersion() {
  if (process.env.SURFACE_VERSION) return process.env.SURFACE_VERSION;
  try { return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim() || "dev"; }
  catch { return "dev"; }
}
const VERSION = surfaceVersion();

const PORT = +(process.env.PORT || 8787);
const ROOT = path.resolve(process.env.ROOT || process.cwd());
const DATA = path.resolve(process.env.DATA || path.join(ROOT, "data"));
const FILE = path.join(DATA, "feedback.ndjson");
const UPLOADS = path.join(DATA, "uploads");
const ANATOMIA = path.join(DATA, "anatomia");   // galeria sensível mora no volume, não no repo
const ADMIN_KEY = process.env.ADMIN_KEY || "";
const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN || "*";
const SURFACE = "/neuro/";   // superfície reportada no /api/health

const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".md": "text/markdown; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".pdf": "application/pdf", ".webp": "image/webp", ".woff2": "font/woff2", ".ico": "image/x-icon" };

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", ALLOW_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}
function json(res, code, obj) { cors(res); res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(obj)); }

function readBody(req, cap = 1e5) {
  return new Promise((resolve, reject) => {
    let n = 0, chunks = [];
    req.on("data", (c) => { n += c.length; if (n > cap) { reject(new Error("too large")); req.destroy(); } else chunks.push(c); });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}
const clean = (s, max = 2000) => String(s == null ? "" : s).replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);
const csvCell = (s) => '"' + String(s == null ? "" : s).replace(/"/g, '""') + '"';

async function saveFeedback(body) {
  let d; try { d = JSON.parse(body); } catch { throw new Error("bad json"); }
  const nome = clean(d.nome, 200);
  if (!nome) throw new Error("nome obrigatório");
  const kind = clean(d.kind, 8);
  const entry = {
    nome, uid: clean(d.uid, 64), email: clean(d.email, 320), msg: clean(d.msg, 2000),
    section: clean(d.section, 16) || "geral",
    url: clean(d.url, 1000), kind: ["link", "pdf", "video", "edge"].includes(kind) ? kind : "",
    from: clean(d.from, 40), to: clean(d.to, 40),
    fromLabel: clean(d.fromLabel, 80), toLabel: clean(d.toLabel, 80),
    variant: clean(d.variant, 8), when: new Date().toISOString(),
  };
  await fs.mkdir(DATA, { recursive: true });
  await fs.appendFile(FILE, JSON.stringify(entry) + "\n", "utf8");
  return entry;
}

// apaga uma contribuição pelo timestamp `when` (o cliente só conhece os seus)
async function deleteFeedback(body) {
  let d; try { d = JSON.parse(body); } catch { throw new Error("bad json"); }
  const when = clean(d.when, 40);
  if (!when) throw new Error("when obrigatório");
  let lines = [];
  try { lines = (await fs.readFile(FILE, "utf8")).split("\n").filter(Boolean); } catch {}
  const kept = lines.filter((l) => { let o = {}; try { o = JSON.parse(l); } catch {} return o.when !== when; });
  await fs.writeFile(FILE, kept.length ? kept.join("\n") + "\n" : "", "utf8");
  return { removed: lines.length - kept.length };
}

// limpa o board PRESERVANDO o estado: arquiva o ndjson atual e zera o vivo.
async function clearBoard() {
  let cur = "";
  try { cur = await fs.readFile(FILE, "utf8"); } catch {}
  const count = cur.split("\n").filter(Boolean).length;
  let archived = null;
  if (count) {
    await fs.mkdir(path.join(DATA, "archives"), { recursive: true });
    archived = "feedback-" + new Date().toISOString().replace(/[:.]/g, "-") + ".ndjson";
    await fs.writeFile(path.join(DATA, "archives", archived), cur, "utf8");
  }
  await fs.writeFile(FILE, "", "utf8");
  return { archived, count };
}
async function listArchives() {
  try {
    const fns = await fs.readdir(path.join(DATA, "archives"));
    return fns.filter((f) => f.endsWith(".ndjson")).sort().reverse();
  } catch { return []; }
}
// devolve um arquivo (vivo ou arquivado) no formato do mural (e-mail nunca exposto)
async function archiveWall(res, file) {
  const full = file ? path.join(DATA, "archives", path.basename(file)) : FILE;
  let lines = [];
  try { lines = (await fs.readFile(full, "utf8")).split("\n").filter(Boolean); } catch {}
  const wall = lines.map((l) => { let o = {}; try { o = JSON.parse(l); } catch {} return o; })
    .filter((o) => o && o.msg)
    .map((o) => ({ nome: o.nome || "anônimo", msg: o.msg, when: o.when, section: o.section || "geral",
                   url: o.url || "", kind: o.kind || "" }));
  json(res, 200, { ok: true, wall });
}

// registro opcional: associa nome (e e-mail) ao uid e retroliga contribuições passadas
async function registerUser(body) {
  let d; try { d = JSON.parse(body); } catch { throw new Error("bad json"); }
  const uid = clean(d.uid, 64), nome = clean(d.nome, 200);
  if (!uid || !nome) throw new Error("uid e nome obrigatórios");
  const email = clean(d.email, 320);
  let lines = [];
  try { lines = (await fs.readFile(FILE, "utf8")).split("\n").filter(Boolean); } catch {}
  let updated = 0;
  const out = lines.map((l) => {
    let o; try { o = JSON.parse(l); } catch { return l; }
    if (o.uid === uid) { o.nome = nome; if (email) o.email = email; updated++; return JSON.stringify(o); }
    return l;
  });
  await fs.mkdir(DATA, { recursive: true });
  await fs.writeFile(FILE, out.length ? out.join("\n") + "\n" : "", "utf8");
  await fs.appendFile(path.join(DATA, "registry.ndjson"),
    JSON.stringify({ uid, nome, email, when: new Date().toISOString() }) + "\n", "utf8");
  return { updated };
}

// edita o texto de uma contribuição pelo timestamp `when` (cliente só conhece os seus)
async function editFeedback(body) {
  let d; try { d = JSON.parse(body); } catch { throw new Error("bad json"); }
  const when = clean(d.when, 40), msg = clean(d.msg, 2000);
  if (!when) throw new Error("when obrigatório");
  if (!msg) throw new Error("msg obrigatório");
  let lines = [];
  try { lines = (await fs.readFile(FILE, "utf8")).split("\n").filter(Boolean); } catch {}
  let updated = 0;
  const out = lines.map((l) => {
    let o; try { o = JSON.parse(l); } catch { return l; }
    if (o.when === when) { o.msg = msg; updated++; return JSON.stringify(o); }
    return l;
  });
  await fs.writeFile(FILE, out.length ? out.join("\n") + "\n" : "", "utf8");
  return { updated };
}

// upload de PDF (corpo cru + X-Filename) → grava em DATA/uploads, devolve a URL
async function saveUpload(req, res) {
  const cap = 20 * 1024 * 1024;                       // 20 MB
  const ct = (req.headers["content-type"] || "").toLowerCase();
  if (!ct.includes("pdf") && !ct.includes("octet-stream")) return json(res, 415, { ok: false, error: "só PDF" });
  let buf;
  try { buf = Buffer.from(await readBinary(req, cap)); } catch (e) { return json(res, 413, { ok: false, error: "arquivo grande demais" }); }
  if (!buf.length) return json(res, 400, { ok: false, error: "vazio" });
  const raw = decodeURIComponent(req.headers["x-filename"] || "ref.pdf");
  const safe = raw.replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/^_+/, "").slice(-80) || "ref.pdf";
  const name = Date.now() + "-" + (safe.toLowerCase().endsWith(".pdf") ? safe : safe + ".pdf");
  await fs.mkdir(UPLOADS, { recursive: true });
  await fs.writeFile(path.join(UPLOADS, name), buf);
  return json(res, 200, { ok: true, url: "/uploads/" + name });
}
function readBinary(req, cap) {
  return new Promise((resolve, reject) => {
    let n = 0, chunks = [];
    req.on("data", (c) => { n += c.length; if (n > cap) { reject(new Error("too large")); req.destroy(); } else chunks.push(c); });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

// mural público: nome + mensagem + quando + (referências) url/kind — e-mail nunca exposto
async function exportWall(res) {
  let lines = [];
  try { lines = (await fs.readFile(FILE, "utf8")).split("\n").filter(Boolean); } catch {}
  const wall = lines.map((l) => { let o = {}; try { o = JSON.parse(l); } catch {} return o; })
    .filter((o) => o && (o.msg || o.kind === "edge"))   // contribuições com texto OU conexões do grafo
    .map((o) => ({ nome: o.nome || "anônimo", msg: o.msg, when: o.when, section: o.section || "geral",
                   url: o.url || "", kind: o.kind || "",
                   from: o.from || "", to: o.to || "", fromLabel: o.fromLabel || "", toLabel: o.toLabel || "" }))
    .slice(-500);
  json(res, 200, { ok: true, wall: wall });
}

async function exportCsv(res) {
  let lines = [];
  try { lines = (await fs.readFile(FILE, "utf8")).split("\n").filter(Boolean); } catch {}
  const cols = ["when", "nome", "uid", "email", "msg", "section", "url", "kind", "variant"];
  const rows = [cols.join(",")].concat(lines.map((l) => {
    let o = {}; try { o = JSON.parse(l); } catch {}
    return cols.map((c) => csvCell(o[c])).join(",");
  }));
  cors(res);
  res.writeHead(200, { "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": 'attachment; filename="feedback-2026-05-29.csv"' });
  res.end(rows.join("\n"));
}

async function serveStatic(req, res, urlPath) {
  let rel = decodeURIComponent(urlPath.split("?")[0]);
  if (rel.endsWith("/")) rel += "index.html";
  const full = path.join(ROOT, rel);
  if (!full.startsWith(ROOT)) { res.writeHead(403); return res.end("forbidden"); }
  try {
    const st = await fs.stat(full);
    if (st.isDirectory()) return serveStatic(req, res, rel.replace(/\/?$/, "/"));
    res.writeHead(200, { "Content-Type": TYPES[path.extname(full).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-cache" });
    createReadStream(full).pipe(res);
  } catch { res.writeHead(404, { "Content-Type": "text/plain" }); res.end("404"); }
}

http.createServer(async (req, res) => {
  const u = req.url || "/";
  if (req.method === "OPTIONS") { cors(res); res.writeHead(204); return res.end(); }
  if (u === "/api/health") return json(res, 200, { ok: true, version: VERSION, surface: SURFACE });
  // raiz do app neuro → a apresentação (neuro.artelonga.com.br só serve neuro)
  if (req.method === "GET" && (u === "/" || u === "/index.html")) {
    res.writeHead(302, { Location: "/2026-05-29/" }); return res.end();
  }
  // bibliografia como componente composável "em casa" (?author=… filtra). O slide
  // renderiza o mesmo NeuroCite; esta rota serve a página standalone.
  if (req.method === "GET" && (u === "/bibliografia" || u.startsWith("/bibliografia?"))) {
    return serveStatic(req, res, "/neuro/bibliografia.html");
  }
  if (req.method === "POST" && u === "/api/feedback") {
    try { const e = await saveFeedback(await readBody(req)); return json(res, 200, { ok: true, when: e.when }); }
    catch (err) { return json(res, 400, { ok: false, error: err.message }); }
  }
  if (req.method === "POST" && u === "/api/feedback/delete") {
    try { const r = await deleteFeedback(await readBody(req)); return json(res, 200, { ok: true, removed: r.removed }); }
    catch (err) { return json(res, 400, { ok: false, error: err.message }); }
  }
  if (req.method === "POST" && u === "/api/feedback/edit") {
    try { const r = await editFeedback(await readBody(req)); return json(res, 200, { ok: true, updated: r.updated }); }
    catch (err) { return json(res, 400, { ok: false, error: err.message }); }
  }
  // ── admin: limpar (com arquivamento) e ler arquivos (gated por ADMIN_KEY) ──
  if (u.startsWith("/api/admin/")) {
    const key = new URL(u, "http://x").searchParams.get("key") || "";
    if (ADMIN_KEY && key !== ADMIN_KEY) return json(res, 401, { ok: false, error: "unauthorized" });
    if (req.method === "POST" && u.split("?")[0] === "/api/admin/clear") {
      try { const r = await clearBoard(); return json(res, 200, { ok: true, ...r }); }
      catch (err) { return json(res, 500, { ok: false, error: err.message }); }
    }
    // grava um asset da galeria no volume (DATA/anatomia/<basename>) — corpo cru
    if (req.method === "POST" && u.split("?")[0] === "/api/admin/anatomia") {
      const name = path.basename(new URL(u, "http://x").searchParams.get("name") || "");
      if (!name) return json(res, 400, { ok: false, error: "name obrigatório" });
      try {
        const buf = Buffer.from(await readBinary(req, 30 * 1024 * 1024));
        await fs.mkdir(ANATOMIA, { recursive: true });
        await fs.writeFile(path.join(ANATOMIA, name), buf);
        return json(res, 200, { ok: true, name, bytes: buf.length });
      } catch (err) { return json(res, 400, { ok: false, error: err.message }); }
    }
    if (req.method === "GET" && u.split("?")[0] === "/api/admin/archives") {
      return json(res, 200, { ok: true, archives: await listArchives() });
    }
    if (req.method === "GET" && u.split("?")[0] === "/api/admin/archive") {
      const file = new URL(u, "http://x").searchParams.get("file") || "";
      return archiveWall(res, file);
    }
    return json(res, 404, { ok: false, error: "not found" });
  }
  if (req.method === "POST" && u === "/api/register") {
    try { const r = await registerUser(await readBody(req)); return json(res, 200, { ok: true, updated: r.updated }); }
    catch (err) { return json(res, 400, { ok: false, error: err.message }); }
  }
  if (req.method === "POST" && u === "/api/upload") {
    try { return await saveUpload(req, res); }
    catch (err) { return json(res, 400, { ok: false, error: err.message }); }
  }
  // arquivos enviados moram no volume de dados (DATA/uploads), não no repo
  if (req.method === "GET" && u.startsWith("/uploads/")) {
    const name = path.basename(decodeURIComponent(u.split("?")[0]));
    const full = path.join(UPLOADS, name);
    try {
      await fs.stat(full);
      cors(res);
      res.writeHead(200, { "Content-Type": TYPES[path.extname(full).toLowerCase()] || "application/octet-stream",
        "Cache-Control": "public, max-age=86400" });
      return createReadStream(full).pipe(res);
    } catch { res.writeHead(404); return res.end("404"); }
  }
  // galeria sensível: serve do volume (DATA/anatomia); fallback p/ repo em dev local
  if (req.method === "GET" && u.split("?")[0].startsWith("/yuri/neuro/anatomia/")) {
    const name = path.basename(decodeURIComponent(u.split("?")[0]));
    const volFile = path.join(ANATOMIA, name);
    try {
      await fs.stat(volFile);
      cors(res);
      res.writeHead(200, { "Content-Type": TYPES[path.extname(volFile).toLowerCase()] || "application/octet-stream",
        "Cache-Control": "public, max-age=86400" });
      return createReadStream(volFile).pipe(res);
    } catch { /* não está no volume → cai no static (working tree local) */ }
  }
  if (req.method === "GET" && u.startsWith("/api/feedback.json")) return exportWall(res);
  if (u.startsWith("/api/feedback.csv")) {
    const key = new URL(u, "http://x").searchParams.get("key") || "";
    if (ADMIN_KEY && key !== ADMIN_KEY) return json(res, 401, { ok: false, error: "unauthorized" });
    return exportCsv(res);
  }
  if (req.method === "GET") return serveStatic(req, res, u);
  json(res, 405, { ok: false, error: "method not allowed" });
}).listen(PORT, () => {
  console.log(`neuro-form-server · http://localhost:${PORT}/2026-05-29/`);
  console.log(`  root=${ROOT}`);
  console.log(`  data=${FILE}${ADMIN_KEY ? "" : "  (sem ADMIN_KEY — export aberto)"}`);
});
