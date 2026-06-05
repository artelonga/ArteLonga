#!/usr/bin/env node
/* tools/bake-security-index.mjs — índice de SUPERFÍCIE EXPOSTA pra revisão de segurança.
 *
 * O GH Pages serve o REPO INTEIRO publicamente em artelonga.com.br/<path> — não só os
 * .html, mas todo .md, .yaml, .json, .js commitado. Este tool lista TUDO que está
 * aberto (todos os caminhos), classifica por sensibilidade e marca indexado/noindex,
 * pra um humano revisar o que está exposto. Inclui os endpoints de API (apex/co/surface).
 *
 * Saída: _security-review.html (noindex, GITIGNORED — é mapa de superfície de ataque,
 * não deve ser servido). Serve em localhost pra revisar.
 *
 * Uso: node tools/bake-security-index.mjs
 */
import { execSync } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const esc = s => String(s).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

// heurística de sensibilidade
function classify(p) {
  const f = p.toLowerCase();
  if (/\.(enc|pem|key)$/.test(f) || /secret|token|password|credential/.test(f)) return ["ALTA", "credencial/segredo"];
  if (/\.ndjson$/.test(f) || /^data\//.test(f)) return ["ALTA", "dados coletados (feedback/telemetria) — possível PII"];
  if (/^work\//.test(f)) return ["MÉDIA", "backlog interno (co-auto)"];
  if (/^docs\/architecture\//.test(f) || /^docs\/(state|lessons|uat|abstractions)\.md$/i.test(f)) return ["MÉDIA", "doc interna de engenharia"];
  if (/profile\.yaml$|community\.yaml$/.test(f)) return ["MÉDIA", "perfil — contato/PII pública"];
  if (/^assets\/data.*\.js$/.test(f)) return ["MÉDIA", "dados agregados (pessoas/comunidades) servidos"];
  if (/\.ya?ml$/.test(f) || /openapi/.test(f)) return ["INFO", "schema/config (esperado)"];
  if (/\.(md)$/.test(f)) return ["INFO", "markdown-fonte servido cru"];
  if (/\.(png|jpe?g|svg|webp|gif|ico|pdf|woff2?|ttf)$/.test(f)) return ["OK", "asset/binário"];
  if (/\.(css|js|mjs)$/.test(f)) return ["OK", "código/estilo (forma)"];
  return ["INFO", "outro"];
}

const RANK = { ALTA: 0, "MÉDIA": 1, INFO: 2, OK: 3 };
const COLOR = { ALTA: "#9a3b2e", "MÉDIA": "#c9821f", INFO: "#5b5450", OK: "#3a7d44" };

// endpoints de API (estáticos = abertos por GH Pages; dinâmicos = co/surface)
const API = [
  ["surface", "POST /api/track", "aberto", "ingest telemetria (sem PII no corpo; IP descartado)"],
  ["surface", "POST /api/feedback", "aberto", "ingest feedback → broadcast co"],
  ["surface", "GET /api/telemetry", "aberto", "agregado da universe (sem PII)"],
  ["surface", "GET /api/health", "aberto", "liveness"],
  ["co", "GET /api/v1/analytics/public/{summary,recent,popularity}", "aberto", "agregados sem PII"],
  ["co", "POST /api/v1/analytics/public/rollups", "token (CO_ROLLUP_TOKEN)", "ingest de rollup"],
  ["co", "POST /api/v1/telemetry/events", "aberto", "ingest batch (CORS-gated)"],
  ["co", "POST /api/v1/feedback", "aberto", "feedback (validado, rate-limited)"],
  ["co", "POST /api/v1/leads", "aberto", "intake de lead (rate-limited)"],
  ["co", "POST /api/v1/auth/onboard-with-email[/verify]", "aberto", "signup magic-code"],
  ["co", "GET /api/v1/admin/**", "auth (github admin)", "dashboards/admin — protegido"],
];

async function main() {
  const files = execSync("git ls-files", { cwd: ROOT, encoding: "utf8" }).split("\n").filter(Boolean);
  const rows = [];
  for (const p of files) {
    const [sev, why] = classify(p);
    let indexed = "—";
    if (p.endsWith(".html")) {
      try { indexed = (await fs.readFile(path.join(ROOT, p), "utf8")).match(/noindex/i) ? "noindex" : "INDEXADO"; }
      catch { indexed = "?"; }
    }
    rows.push({ p, sev, why, indexed });
  }
  rows.sort((a, b) => RANK[a.sev] - RANK[b.sev] || a.p.localeCompare(b.p));

  const counts = rows.reduce((m, r) => (m[r.sev] = (m[r.sev] || 0) + 1, m), {});
  const indexedHtml = rows.filter(r => r.indexed === "INDEXADO").length;
  const noindexHtml = rows.filter(r => r.indexed === "noindex").length;

  const rowHtml = r => `<tr>
    <td><span class="sev" style="background:${COLOR[r.sev]}">${r.sev}</span></td>
    <td class="path">${esc(r.p)}</td>
    <td>${r.indexed === "INDEXADO" ? '<b style="color:#9a3b2e">INDEXADO</b>' : esc(r.indexed)}</td>
    <td class="why">${esc(r.why)}</td></tr>`;
  const apiRow = a => `<tr><td>${esc(a[0])}</td><td class="path">${esc(a[1])}</td><td>${a[2] === "aberto" ? '<b style="color:#9a3b2e">aberto</b>' : esc(a[2])}</td><td class="why">${esc(a[3])}</td></tr>`;

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<meta name="robots" content="noindex, nofollow"><title>Security review — superfície exposta</title>
<style>
 body{font-family:-apple-system,system-ui,sans-serif;max-width:1000px;margin:0 auto;padding:3vh 1.4rem 8vh;color:#161413;background:#fbf9f6;line-height:1.5}
 h1{font-size:1.7rem}h2{font-size:1rem;margin-top:2em;border-top:1px solid #e7e1da;padding-top:.8em}
 .warn{background:#fdecea;border:1px solid #f3c4bd;border-left:3px solid #9a3b2e;border-radius:8px;padding:.8rem 1rem;font-size:.85rem;margin:1em 0}
 .cards{display:flex;gap:.6rem;flex-wrap:wrap;margin:1em 0}
 .card{border:1px solid #e7e1da;border-radius:8px;background:#fff;padding:.6rem .9rem;text-align:center;min-width:90px}
 .card b{display:block;font-size:1.5rem}.card span{font-size:.62rem;text-transform:uppercase;letter-spacing:.05em;color:#888}
 table{border-collapse:collapse;width:100%;font-size:.78rem;margin:.5em 0}
 th,td{border-bottom:1px solid #eee;padding:.3rem .5rem;text-align:left;vertical-align:top}
 th{font-size:.62rem;text-transform:uppercase;letter-spacing:.06em;color:#888}
 .path{font-family:ui-monospace,Menlo,monospace;font-size:.74rem}
 .why{color:#5b5450}.sev{color:#fff;font-size:.6rem;font-weight:700;border-radius:999px;padding:.05rem .45rem}
</style></head><body>
<h1>Security review — superfície exposta (todos os caminhos abertos)</h1>
<div class="warn"><b>O GH Pages serve o repositório inteiro</b> em <code>artelonga.com.br/&lt;path&gt;</code> —
todo arquivo commitado é público (não só HTML: <code>.md</code>, <code>.yaml</code>, <code>.json</code>,
<code>.js</code>). Esta página (noindex, não commitada) lista tudo pra revisão. Ordenado por sensibilidade.</div>
<div class="cards">
 <div class="card"><b>${rows.length}</b><span>arquivos servidos</span></div>
 <div class="card"><b style="color:#9a3b2e">${counts["ALTA"] || 0}</b><span>sev ALTA</span></div>
 <div class="card"><b style="color:#c9821f">${counts["MÉDIA"] || 0}</b><span>sev MÉDIA</span></div>
 <div class="card"><b>${indexedHtml}</b><span>HTML indexado</span></div>
 <div class="card"><b>${noindexHtml}</b><span>HTML noindex</span></div>
</div>
<h2>Endpoints de API (dinâmicos)</h2>
<table><thead><tr><th>onde</th><th>endpoint</th><th>auth</th><th>nota</th></tr></thead><tbody>${API.map(apiRow).join("")}</tbody></table>
<h2>Arquivos servidos (todos os caminhos) — por sensibilidade</h2>
<table><thead><tr><th>sev</th><th>caminho</th><th>index</th><th>por quê</th></tr></thead><tbody>${rows.map(rowHtml).join("")}</tbody></table>
</body></html>`;
  await fs.writeFile(path.join(ROOT, "_security-review.html"), html);
  console.log(`[security] ${rows.length} arquivos · ALTA=${counts["ALTA"] || 0} MÉDIA=${counts["MÉDIA"] || 0} · HTML indexado=${indexedHtml} noindex=${noindexHtml}`);
  console.log("[security] → _security-review.html (noindex, gitignored)");
}
main().catch(e => { console.error("[security] erro:", e.message); process.exit(1); });
