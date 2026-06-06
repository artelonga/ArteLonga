#!/usr/bin/env node
/* tools/bake-domains.mjs — gera o mapa de domínios/CNAMEs a partir de deploy/domains.yaml
 * (single source of truth) + audita drift contra os arquivos de config reais.
 *
 * Saída: docs/domains.html (noindex — mapa de infra). Sai != 0 se drift detectado.
 * Uso: node tools/bake-domains.mjs
 */
import { promises as fs } from "node:fs";
import { existsSync } from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

const ROOT = process.cwd();
const esc = s => String(s == null ? "" : s).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

async function main() {
  const reg = yaml.load(await fs.readFile(path.join(ROOT, "deploy/domains.yaml"), "utf8"));
  const domains = reg.domains || [];

  // ── audit: drift entre o registro e a realidade ──
  const warns = [];
  for (const d of domains) {
    if (d.config && !existsSync(path.join(ROOT, d.config))) warns.push(`config ausente: ${d.config} (${d.domain})`);
    if (d.config && /\.toml$/.test(d.config) && d.app) {
      try { if (!(await fs.readFile(path.join(ROOT, d.config), "utf8")).includes(`"${d.app}"`)) warns.push(`app "${d.app}" não bate com ${d.config}`); } catch {}
    }
  }
  // tomls de deploy sem entrada no registro
  for (const t of ["deploy/surfaces/yuri.toml", "deploy/surfaces/hostinger.toml", "deploy/surfaces/comunicacao.toml", "deploy/neuro/fly.toml", "deploy/retro/fly.toml"])
    if (!domains.some(d => d.config === t)) warns.push(`toml sem entrada no registro: ${t}`);

  const COLOR = { apex: "#9a3b2e", surface: "#3a7d44", graduated: "#5b5450" };
  const SCOLOR = { live: "#3a7d44", "path-only": "#c9821f", planned: "#888" };
  const row = d => `<tr>
    <td><b>${esc(d.domain)}</b></td>
    <td><span class="pill" style="background:${COLOR[d.type] || "#888"}">${esc(d.type)}</span></td>
    <td>${esc(d.host)}${d.app ? ` · <code>${esc(d.app)}</code>` : ""}</td>
    <td><code>${esc(d.content)}</code>${d.surface ? `<br><span class="src">SURFACE ${esc(d.surface)}</span>` : ""}</td>
    <td class="src">${esc(d.dns)}</td>
    <td><span class="pill" style="background:${SCOLOR[d.status] || "#888"}">${esc(d.status)}</span><br><span class="src">${esc(d.config)}</span></td></tr>`;

  const CSS = `body{font-family:-apple-system,system-ui,sans-serif;max-width:1000px;margin:0 auto;padding:3vh 1.4rem 8vh;color:#161413;background:#fbf9f6;line-height:1.5}
   h1{font-size:1.7rem}h2{font-size:1rem;margin-top:1.8em;border-top:1px solid #e7e1da;padding-top:.7em}
   a{color:#9a3b2e}table{border-collapse:collapse;width:100%;font-size:.78rem;margin:1em 0}
   th,td{border-bottom:1px solid #eee;padding:.4rem .5rem;text-align:left;vertical-align:top}
   th{font-size:.62rem;text-transform:uppercase;letter-spacing:.06em;color:#888}
   code{font-family:ui-monospace,Menlo,monospace;font-size:.92em}.src{font-size:.7rem;color:#888}
   .pill{color:#fff;font-size:.6rem;font-weight:700;border-radius:999px;padding:.05rem .45rem}
   pre{background:#fff;border:1px solid #e7e1da;border-radius:8px;padding:1em;overflow-x:auto;font-size:.74rem;line-height:1.4}
   .warn{background:#fdecea;border:1px solid #f3c4bd;border-left:3px solid #9a3b2e;border-radius:8px;padding:.6rem .9rem;font-size:.8rem;margin:1em 0}
   .ok{background:#e6f1e8;border:1px solid #b9dcc1;border-left:3px solid #3a7d44;border-radius:8px;padding:.5rem .9rem;font-size:.8rem;margin:1em 0}`;

  const lifecycle = `local      → localhost:8000 (apex) · node tools/surfaces-server.mjs (surface)
branch/PR  → review localhost → merge
apex       → push main → GitHub Pages (~1min + Fastly ~10min)
surface    → npm run deploy:&lt;key&gt;  (smoke gate → fly deploy, imagem imutável)
promoção   → path /x/ no apex  →  x.artelonga.com.br : fly app + fly certs + CNAME
             (mesma key/histórico/analytics — docs/universe-upgrade.html)`;

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0"><meta name="robots" content="noindex,nofollow">
<title>Mapa de domínios — Arte Longa</title><style>${CSS}</style></head><body>
<p class="src"><a href="/">Arte Longa</a> · <a href="/docs/">docs</a> · mapa de domínios</p>
<h1>Mapa de domínios · CNAMEs · surfaces</h1>
<p>Fonte única: <code>deploy/domains.yaml</code>. Gerado por <code>tools/bake-domains.mjs</code>.
Os registros DNS reais vivem no registrar/Fly — aqui ficam <b>documentados</b> em git.</p>
${warns.length ? `<div class="warn"><b>⚠ drift (${warns.length}):</b><br>${warns.map(esc).join("<br>")}</div>` : `<div class="ok">✓ sem drift — registro bate com os configs.</div>`}
<table><thead><tr><th>domínio</th><th>tipo</th><th>host · app</th><th>conteúdo</th><th>DNS</th><th>status · config</th></tr></thead>
<tbody>${domains.map(row).join("")}</tbody></table>
<h2>Ciclo de desenvolvimento (path → CNAME)</h2>
<pre>${lifecycle}</pre>
<p class="src">Modelo recursivo: cada universe é uma pasta servida como path no apex; promover = app Fly + cert + CNAME, carregando a mesma chave/histórico/analytics.</p>
</body></html>`;
  await fs.writeFile(path.join(ROOT, "docs/domains.html"), html);
  console.log(`[domains] ${domains.length} domínios → docs/domains.html · drift: ${warns.length}`);
  warns.forEach(w => console.log("  ⚠ " + w));
  if (warns.length) process.exit(1);
}
main().catch(e => { console.error("[domains] erro:", e.message); process.exit(1); });
