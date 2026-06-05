#!/usr/bin/env node
/* tools/bake-docs.mjs — renderiza os docs markdown como CONTEÚDO estático.
 *
 * Princípio (igual ao resto): conteúdo (docs/*.md) separado de forma (este renderer).
 * Pré-renderiza markdown + diagramas mermaid pra HTML+SVG ESTÁTICO no build (marked
 * e mermaid só rodam aqui, via Playwright) — as páginas publicadas não têm dependência
 * de runtime nem terceiros, e renderizam do cache. Saída em docs/<slug>.html + docs/index.html.
 *
 * Visibilidade (decisão do dono): público (indexado) = case study/metodologia;
 * dev (noindex) = specs técnicas.
 *
 * Uso: node tools/bake-docs.mjs   (precisa de rede no build pra marked+mermaid CDN)
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const ROOT = process.cwd();
const DOCS = path.join(ROOT, "docs");

// curadoria: { file, slug, title, group: "publico"|"dev" }
const MANIFEST = [
  { file: "use-cases.md", title: "Use cases — catálogo (artelonga/co)", group: "publico" },
  { file: "brain-as-a-service.md", title: "Brain as a Service — case study", group: "publico" },
  { file: "scrum-retrospective.md", title: "Scrum — entrega & retrospectiva (ArteLonga)", group: "publico" },
  { file: "lead-acquisition.md", title: "Aquisição de lead — o funil E2E", group: "publico" },
  { file: "scrum-universe.md", title: "Scrum — pasta → página → surface", group: "dev" },
  { file: "analytics-framework.md", title: "Analytics framework — schema multi-tenant", group: "dev" },
  { file: "telemetry-surfaces.md", title: "Telemetria — surfaces & convergência", group: "dev" },
  { file: "universe-upgrade.md", title: "Upgrade de universe — path → CNAME", group: "dev" },
  { file: "analytics-api.md", title: "Analytics API — wire contract (co)", group: "dev" },
];

const slugify = f => f.replace(/\.md$/, "");
const esc = s => String(s).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

function frontTitle(md, fallback) {
  const m = md.match(/^---\n([\s\S]*?)\n---/);
  if (m) { const t = m[1].match(/^title:\s*(.+)$/m); if (t) return t[1].trim().replace(/^["']|["']$/g, ""); }
  const h = md.match(/^#\s+(.+)$/m);
  return h ? h[1].trim() : fallback;
}
function stripFront(md) { return md.replace(/^---\n[\s\S]*?\n---\s*\n/, ""); }

const CSS = `
  :root{--ink:#0a0a0a;--ink2:#444;--ink3:#888;--line:#e7e1da;--bg:#fbf9f6;--bg2:#fff;--accent:#9a3b2e}
  *{box-sizing:border-box} body{font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;
    max-width:820px;margin:0 auto;padding:4vh 1.4rem 10vh;line-height:1.6;color:var(--ink);background:var(--bg)}
  a{color:var(--accent);text-decoration:none;border-bottom:1px solid rgba(154,59,46,.25)}a:hover{border-bottom-color:var(--accent)}
  h1{font-size:2.1rem;letter-spacing:-.02em;line-height:1.12;margin:.3em 0 .2em}
  h2{font-size:1.3rem;margin:1.8em 0 .4em;border-top:1px solid var(--line);padding-top:.8em}
  h3{font-size:1.02rem;margin:1.3em 0 .3em}
  blockquote{margin:1.2em 0;padding:.7em 1.1em;background:var(--bg2);border-left:3px solid var(--accent);border-radius:8px;color:var(--ink2);font-size:.95rem}
  ul,ol{padding-left:1.3em}li{margin:.15em 0}
  table{border-collapse:collapse;width:100%;font-size:.86rem;margin:1.2em 0;display:block;overflow-x:auto}
  th,td{border:1px solid var(--line);padding:.45rem .6rem;text-align:left;vertical-align:top}
  th{background:var(--bg2);font-weight:700}
  code{background:var(--bg2);border:1px solid var(--line);border-radius:4px;padding:.05em .35em;font-size:.85em}
  pre{background:var(--bg2);border:1px solid var(--line);border-radius:8px;padding:1em;overflow-x:auto}pre code{border:0;background:none;padding:0}
  hr{border:0;border-top:1px solid var(--line);margin:2em 0}
  .mermaid svg{max-width:100%;height:auto;background:var(--bg2);border:1px solid var(--line);border-radius:10px;padding:.6rem}
  .crumb{font-size:.8rem;color:var(--ink3);margin-bottom:2em}
  .grp{margin:1.4em 0}.grp h2{border:0;padding:0;font-size:.72rem;letter-spacing:.18em;text-transform:uppercase;color:var(--ink3)}
  .doclist{list-style:none;padding:0}.doclist li{margin:.5em 0}.doclist .src{font-size:.72rem;color:var(--ink3)}
  .tag{font-size:.6rem;font-weight:700;border-radius:999px;padding:.05rem .45rem;letter-spacing:.04em;vertical-align:middle}
  .tag.dev{background:#eef1f6;color:var(--ink3)}.tag.pub{background:#e6f1e8;color:#3a7d44}`;

function docShell(title, bodyHtml, group) {
  const robots = group === "dev" ? '<meta name="robots" content="noindex, nofollow">' : "";
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${esc(title)} — Arte Longa</title>
${robots}<style>${CSS}</style></head><body>
<div class="crumb"><a href="/">Arte Longa</a> · <a href="/docs/">docs</a>${group === "dev" ? " · <span>dev (noindex)</span>" : ""}</div>
${bodyHtml}
</body></html>`;
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  // shell com marked + mermaid (só no build) pra pré-renderizar
  await page.setContent(`<!doctype html><html><body><div id="out"></div>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script></body></html>`,
    { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.marked && window.mermaid, null, { timeout: 20000 });
  await page.evaluate(() => window.mermaid.initialize({ startOnLoad: false, theme: "neutral", securityLevel: "loose" }));

  const done = [];
  for (const d of MANIFEST) {
    let md;
    try { md = await fs.readFile(path.join(DOCS, d.file), "utf8"); }
    catch { console.log("[docs] skip (faltando) " + d.file); continue; }
    const title = frontTitle(md, d.title);
    const body = stripFront(md).replace(/\]\(\.?\/?([\w-]+)\.md(#[\w-]+)?\)/g, "](./$1.html$2)")  // link .md → .html
                               .replace(/\]\(\.\.\/docs\/([\w-]+)\.md(#[\w-]+)?\)/g, "](./$1.html$2)");
    const rendered = await page.evaluate(async (mdBody) => {
      const tmp = document.createElement("div");
      tmp.innerHTML = window.marked.parse(mdBody);
      tmp.querySelectorAll("pre > code.language-mermaid").forEach(c => {
        const div = document.createElement("div"); div.className = "mermaid"; div.textContent = c.textContent;
        c.parentElement.replaceWith(div);
      });
      const out = document.getElementById("out"); out.innerHTML = tmp.innerHTML;
      try { await window.mermaid.run({ querySelector: "#out .mermaid" }); } catch (e) {}
      return out.innerHTML;
    }, body);
    const slug = slugify(d.file);
    await fs.writeFile(path.join(DOCS, slug + ".html"), docShell(title, rendered, d.group));
    done.push({ slug, title, group: d.group, file: d.file });
    console.log("[docs] " + slug + ".html (" + d.group + ")");
  }
  await browser.close();

  // hub index (indexado — entrada pública)
  const li = g => done.filter(x => x.group === g).map(x =>
    `<li><a href="/docs/${x.slug}.html">${esc(x.title)}</a> <span class="tag ${g === "publico" ? "pub" : "dev"}">${g === "publico" ? "público" : "dev"}</span><br><span class="src">docs/${x.file}</span></li>`).join("\n");
  const hub = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Docs — Arte Longa</title>
<meta name="description" content="Base de conhecimento Arte Longa: arquitetura, telemetria, BaaS, escala horizontal.">
<style>${CSS}</style></head><body>
<div class="crumb"><a href="/">Arte Longa</a> · docs</div>
<h1>Documentação</h1>
<p>Base de conhecimento — renderizada como conteúdo (markdown → estático, sem dependência de runtime).
Promovível a <code>docs.artelonga.com.br</code> pelo runbook de <a href="/docs/universe-upgrade.html">universe-upgrade</a>.</p>
<div class="grp"><h2>Conhecimento (público)</h2><ul class="doclist">${li("publico")}</ul></div>
<div class="grp"><h2>Engenharia · specs (dev)</h2><ul class="doclist">${li("dev")}</ul></div>
<p class="src">+ Scrum (parceiro): <a href="/scrum/">/scrum/</a> · backlog: <code>work/artelonga/AL-N.md</code></p>
</body></html>`;
  await fs.writeFile(path.join(DOCS, "index.html"), hub);
  console.log("[docs] index.html — " + done.length + " docs (" + done.filter(x => x.group === "publico").length + " público, " + done.filter(x => x.group === "dev").length + " dev)");
}
main().catch(e => { console.error("[docs] erro:", e.message); process.exit(1); });
