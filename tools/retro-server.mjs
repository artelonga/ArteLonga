/* tools/retro-server.mjs — app Fly do Retro Umarizal (retroumarizal.artelonga.com.br).
 * Serve o cardápio estático + uma galeria de fotos do Instagram (@retroumarizal),
 * baixadas via Instagram Graph API e guardadas no volume Fly (DATA/fotos) — mesmo
 * padrão das fotos do neuro (servidas do volume, fora do repo).
 *
 * Env: PORT, ROOT (repo), DATA (volume), IG_USER_ID, IG_TOKEN (long-lived).
 * Sem dependências (Node stdlib). A galeria lê /api/fotos.json.
 *
 * Deploy: fly deploy --config deploy/retro/fly.toml --dockerfile deploy/retro/Dockerfile */
import http from "node:http";
import { promises as fs, createReadStream, createWriteStream } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import https from "node:https";

// versão observável: SURFACE_VERSION (env) → SHA curto do git (capturado no boot) → "dev"
function surfaceVersion() {
  if (process.env.SURFACE_VERSION) return process.env.SURFACE_VERSION;
  try { return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim() || "dev"; }
  catch { return "dev"; }
}
const VERSION = surfaceVersion();

const PORT = process.env.PORT || 8080;
const ROOT = path.resolve(process.env.ROOT || ".");
const DATA = path.resolve(process.env.DATA || "./.retro-data");
const FOTOS = path.join(DATA, "fotos");
const MANIFEST = path.join(DATA, "fotos.json");
const IG_USER_ID = process.env.IG_USER_ID || "";
const IG_TOKEN = process.env.IG_TOKEN || "";
const REFRESH_MS = 6 * 60 * 60 * 1000;   // re-busca a cada 6h
const SURFACE = "/retro/";   // superfície reportada no /api/health
const CO_FEEDBACK = process.env.CO_FEEDBACK || "https://co.artelonga.com.br/api/v1/feedback";

const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript",
  ".json": "application/json", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".webp": "image/webp", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".woff2": "font/woff2" };

function getJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (r) => { let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => {
      try { resolve(JSON.parse(d)); } catch (e) { reject(e); } }); }).on("error", reject);
  });
}
function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (r) => {
      if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) return download(r.headers.location, dest).then(resolve, reject);
      if (r.statusCode !== 200) { r.resume(); return reject(new Error("http " + r.statusCode)); }
      const tmp = dest + ".tmp"; const out = createWriteStream(tmp);
      r.pipe(out); out.on("finish", () => out.close(() => fs.rename(tmp, dest).then(resolve, reject)));
    }).on("error", reject);
  });
}

// ── Instagram Graph API: busca media e baixa as imagens novas ──
async function syncInstagram() {
  if (!IG_USER_ID || !IG_TOKEN) { console.log("[retro] IG_USER_ID/IG_TOKEN ausentes — galeria fica vazia até configurar."); return; }
  await fs.mkdir(FOTOS, { recursive: true });
  const fields = "id,media_type,media_url,thumbnail_url,caption,permalink,timestamp";
  const url = `https://graph.instagram.com/${IG_USER_ID}/media?fields=${fields}&limit=50&access_token=${encodeURIComponent(IG_TOKEN)}`;
  let data;
  try { data = await getJSON(url); } catch (e) { console.error("[retro] erro IG:", e.message); return; }
  if (data.error) { console.error("[retro] IG API:", data.error.message); return; }
  const items = (data.data || []).filter((m) => m.media_type !== "VIDEO" || m.thumbnail_url);
  const manifest = [];
  for (const m of items) {
    const src = m.media_type === "VIDEO" ? m.thumbnail_url : m.media_url;
    if (!src) continue;
    const file = `${m.id}.jpg`, full = path.join(FOTOS, file);
    try { await fs.stat(full); } catch { try { await download(src, full); } catch (e) { console.error("[retro] download falhou", m.id, e.message); continue; } }
    manifest.push({ id: m.id, file, caption: (m.caption || "").slice(0, 280), permalink: m.permalink, timestamp: m.timestamp });
  }
  await fs.writeFile(MANIFEST, JSON.stringify({ updated: new Date().toISOString(), count: manifest.length, fotos: manifest }, null, 2));
  console.log(`[retro] Instagram sincronizado: ${manifest.length} fotos.`);
}

async function serveStatic(res, rel) {
  const full = path.join(ROOT, rel.replace(/^\/+/, ""));
  if (!full.startsWith(ROOT)) { res.writeHead(403); return res.end("forbidden"); }
  try {
    const st = await fs.stat(full);
    if (st.isDirectory()) return serveStatic(res, rel.replace(/\/?$/, "/") + "index.html");
    res.writeHead(200, { "Content-Type": TYPES[path.extname(full).toLowerCase()] || "application/octet-stream" });
    return createReadStream(full).pipe(res);
  } catch { res.writeHead(404, { "Content-Type": "text/plain" }); res.end("404"); }
}

const server = http.createServer(async (req, res) => {
  const u = (req.url || "/").split("?")[0];
  if (u === "/api/health") { res.writeHead(200, { "Content-Type": "application/json" }); return res.end(JSON.stringify({ ok: true, version: VERSION, surface: SURFACE })); }
  // feedback: loga no stdout (→ fly logs) e encaminha pro co
  if (req.method === "POST" && u === "/api/feedback") {
    let body = "";
    req.on("data", c => { body += c; if (body.length > 16384) req.destroy(); });
    req.on("end", async () => {
      let d; try { d = JSON.parse(body || "{}"); } catch (e) { d = { raw: String(body).slice(0, 500) }; }
      console.log("[FEEDBACK] " + new Date().toISOString() + " " + JSON.stringify(d));
      try {
        await fetch(CO_FEEDBACK, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ universe: d.universe || "retroumarizal", kind: d.kind || "feedback", message: d.message || "", entry_path: d.entry_path || d.page, name: d.name, email: d.email })
        });
        console.log("[FEEDBACK] forwarded to co");
      } catch (e) { console.log("[FEEDBACK] co-forward-failed " + (e && e.message)); }
      res.writeHead(200, { "Content-Type": "application/json" }); res.end('{"ok":true}');
    });
    return;
  }
  if (u === "/" || u === "/index.html") return serveStatic(res, "/retro-umarizal/menu/index.html");
  if (u === "/menu" || u === "/menu/") return serveStatic(res, "/retro-umarizal/menu/index.html");
  if (u === "/perfil" || u === "/perfil/") return serveStatic(res, "/retro-umarizal/index.html");
  if (u === "/fotos" || u === "/fotos/" || u === "/galeria" || u === "/galeria/") return serveStatic(res, "/retro-umarizal/gallery.html");
  if (u === "/api/fotos.json") {
    try { await fs.stat(MANIFEST); res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "public, max-age=600" }); return createReadStream(MANIFEST).pipe(res); }
    catch { res.writeHead(200, { "Content-Type": "application/json" }); return res.end('{"count":0,"fotos":[]}'); }
  }
  // fotos do Instagram moram no volume (DATA/fotos), não no repo
  if (u.startsWith("/fotos/") && u.length > 7) {
    const name = path.basename(decodeURIComponent(u));
    const full = path.join(FOTOS, name);
    try { await fs.stat(full); res.writeHead(200, { "Content-Type": TYPES[path.extname(full).toLowerCase()] || "image/jpeg", "Cache-Control": "public, max-age=86400" }); return createReadStream(full).pipe(res); }
    catch { res.writeHead(404); return res.end("404"); }
  }
  return serveStatic(res, u);
});

server.listen(PORT, () => {
  console.log(`[retro] retroumarizal em :${PORT} · ROOT=${ROOT} · DATA=${DATA}`);
  syncInstagram();
  setInterval(syncInstagram, REFRESH_MS);
});
