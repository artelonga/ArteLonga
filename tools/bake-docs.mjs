#!/usr/bin/env node
/* tools/bake-docs.mjs — renderiza os docs markdown como CONTEÚDO estático, BILÍNGUE (pt+en).
 *
 * Princípio: conteúdo (docs/<slug>.<lang>.md) separado de forma (este renderer). O idioma
 * é do CONTEÚDO; a forma (render, diagramas) é a mesma — uma cópia traduzida do .md basta.
 * Pré-renderiza markdown + mermaid → HTML+SVG estático no build (sem runtime/terceiros).
 * Saída: docs/<slug>.html (pt, primária) + docs/<slug>.en.html (en) + docs/index.html.
 * Links de idioma relativos (toggle) + hreflang. Form em inglês; conteúdo i18n.
 *
 * Uso: node tools/bake-docs.mjs   (precisa de rede no build pra marked+mermaid CDN)
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const ROOT = process.cwd();
const DOCS = path.join(ROOT, "docs");
const LANGS = ["pt", "en"];
const esc = s => String(s).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

// curadoria: { slug, group: "publico"|"dev" } — títulos derivam do frontmatter de cada idioma
const MANIFEST = [
  { slug: "use-cases", group: "publico" },
  { slug: "intelligence-as-a-service", group: "publico" },
  { slug: "scrum-retrospective", group: "publico" },
  { slug: "lead-acquisition", group: "publico" },
  { slug: "scrum-universe", group: "dev" },
  { slug: "analytics-framework", group: "dev" },
  { slug: "telemetry-surfaces", group: "dev" },
  { slug: "universe-upgrade", group: "dev" },
  { slug: "analytics-api", group: "dev" },
];

const outName = (slug, lang) => lang === "pt" ? `${slug}.html` : `${slug}.${lang}.html`;
function frontTitle(md, fallback) {
  const m = md.match(/^---\n([\s\S]*?)\n---/);
  if (m) { const t = m[1].match(/^title:\s*(.+)$/m); if (t) return t[1].trim().replace(/^["']|["']$/g, ""); }
  const h = md.match(/^#\s+(.+)$/m); return h ? h[1].trim() : fallback;
}
const stripFront = md => md.replace(/^---\n[\s\S]*?\n---\s*\n/, "");
// reescreve links .md → .html no idioma certo (pt → <slug>.html · en → <slug>.en.html)
function relinks(md, lang) {
  const ext = lang === "pt" ? ".html" : ".en.html";
  return md.replace(/\]\(\.?\/?([\w-]+)\.md(#[\w-]+)?\)/g, (_, s, h) => `](./${s}${ext}${h || ""})`)
           .replace(/\]\(\.\.\/docs\/([\w-]+)\.md(#[\w-]+)?\)/g, (_, s, h) => `](./${s}${ext}${h || ""})`);
}

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
  th,td{border:1px solid var(--line);padding:.45rem .6rem;text-align:left;vertical-align:top}th{background:var(--bg2);font-weight:700}
  code{background:var(--bg2);border:1px solid var(--line);border-radius:4px;padding:.05em .35em;font-size:.85em}
  pre{background:var(--bg2);border:1px solid var(--line);border-radius:8px;padding:1em;overflow-x:auto}pre code{border:0;background:none;padding:0}
  hr{border:0;border-top:1px solid var(--line);margin:2em 0}
  .mermaid svg{max-width:100%;height:auto;background:var(--bg2);border:1px solid var(--line);border-radius:10px;padding:.6rem}
  .crumb{display:flex;justify-content:space-between;font-size:.8rem;color:var(--ink3);margin-bottom:2em}
  .crumb .lang{font-weight:700;border:1px solid var(--line);border-radius:999px;padding:.1rem .6rem}
  .grp{margin:1.4em 0}.grp h2{border:0;padding:0;font-size:.72rem;letter-spacing:.18em;text-transform:uppercase;color:var(--ink3)}
  .doclist{list-style:none;padding:0}.doclist li{margin:.5em 0}.doclist .src{font-size:.72rem;color:var(--ink3)}
  .tag{font-size:.6rem;font-weight:700;border-radius:999px;padding:.05rem .45rem;letter-spacing:.04em;vertical-align:middle}
  .tag.dev{background:#eef1f6;color:var(--ink3)}.tag.pub{background:#e6f1e8;color:#3a7d44}`;

function docShell(title, bodyHtml, group, slug, lang, hasOther) {
  const robots = group === "dev" ? '<meta name="robots" content="noindex, nofollow">' : "";
  const selfHref = outName(slug, lang), otherLang = lang === "pt" ? "en" : "pt", otherHref = outName(slug, otherLang);
  const toggle = hasOther ? `<a class="lang" href="${otherHref}" hreflang="${otherLang}">${otherLang.toUpperCase()}</a>` : "";
  const alt = hasOther ? `<link rel="alternate" hreflang="${otherLang === "pt" ? "pt-br" : "en"}" href="${otherHref}">` : "";
  return `<!DOCTYPE html><html lang="${lang === "pt" ? "pt-BR" : "en"}"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${esc(title)} — Arte Longa</title>
${robots}<link rel="alternate" hreflang="${lang === "pt" ? "pt-br" : "en"}" href="${selfHref}">${alt}
<style>${CSS}</style></head><body>
<div class="crumb"><span><a href="/">Arte Longa</a> · <a href="/docs/">docs</a>${group === "dev" ? " · dev (noindex)" : ""}</span>${toggle}</div>
${bodyHtml}
</body></html>`;
}

async function render(page, body) {
  return page.evaluate(async (mdBody) => {
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
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(`<!doctype html><html><body><div id="out"></div>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script></body></html>`,
    { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.marked && window.mermaid, null, { timeout: 20000 });
  await page.evaluate(() => window.mermaid.initialize({ startOnLoad: false, theme: "neutral", securityLevel: "loose" }));

  const done = [];
  for (const d of MANIFEST) {
    const present = {};
    for (const lang of LANGS) {
      try { present[lang] = await fs.readFile(path.join(DOCS, `${d.slug}.${lang}.md`), "utf8"); } catch {}
    }
    const langs = LANGS.filter(l => present[l]);
    if (!langs.length) { console.log("[docs] skip (sem fonte) " + d.slug); continue; }
    const titles = {};
    for (const lang of langs) {
      const md = present[lang];
      const title = frontTitle(md, d.slug); titles[lang] = title;
      const html = await render(page, relinks(stripFront(md), lang));
      await fs.writeFile(path.join(DOCS, outName(d.slug, lang)), docShell(title, html, d.group, d.slug, lang, langs.length > 1));
      console.log(`[docs] ${outName(d.slug, lang)} (${d.group}/${lang})`);
    }
    done.push({ slug: d.slug, group: d.group, title: titles.pt || titles.en, langs });
  }
  await browser.close();

  const li = g => done.filter(x => x.group === g).map(x => {
    const en = x.langs.includes("en") ? ` · <a href="/docs/${x.slug}.en.html">en</a>` : "";
    return `<li><a href="/docs/${outName(x.slug, "pt")}">${esc(x.title)}</a> <span class="tag ${g === "publico" ? "pub" : "dev"}">${g === "publico" ? "público" : "dev"}</span>${en}<br><span class="src">docs/${x.slug}.{pt,en}.md</span></li>`;
  }).join("\n");
  const aws = `<li><a href="/yuri/aws/">AWS — caso de uso pela experiência</a> <span class="tag pub">público</span> · <a href="/yuri/aws/en/">en</a><br><span class="src">yuri/aws/ · estudo de cloud do yuri</span></li>`;
  const hub = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Docs — Arte Longa</title>
<meta name="description" content="Base de conhecimento Arte Longa (bilíngue): Intelligence as a Service, telemetria, escala horizontal.">
<style>${CSS}</style></head><body>
<div class="crumb"><span><a href="/">Arte Longa</a> · docs</span></div>
<h1>Documentação</h1>
<p>Base de conhecimento — conteúdo bilíngue (pt/en), renderizado estático (sem runtime). Forma em inglês, conteúdo no idioma. Promovível a <code>docs.artelonga.com.br</code>.</p>
<div class="grp"><h2>Conhecimento (público)</h2><ul class="doclist">${li("publico")}\n${aws}</ul></div>
<div class="grp"><h2>Engenharia · specs (dev)</h2><ul class="doclist">${li("dev")}</ul></div>
<p class="src">+ Scrum (parceiro): <a href="/scrum/">/scrum/</a> · backlog: <code>work/artelonga/AL-N.md</code></p>
</body></html>`;
  await fs.writeFile(path.join(DOCS, "index.html"), hub);
  console.log(`[docs] index.html — ${done.length} docs · bilíngue ${done.filter(x => x.langs.length > 1).length}/${done.length}`);
}
main().catch(e => { console.error("[docs] erro:", e.message); process.exit(1); });
