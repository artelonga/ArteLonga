#!/usr/bin/env node
/* tools/bake-aws.mjs — publica /aws (yuri/aws) bilíngue (pt + en) como conteúdo estático.
 *
 * Content (yuri/aws/aws.{pt,en}.md) separado de form (este renderer). Pré-renderiza
 * markdown → HTML estático (marked só no build) — zero dependência de runtime.
 * Os links de idioma são RELATIVOS, então funcionam tanto no apex
 * (artelonga.com.br/yuri/aws/) quanto promovido a surface (aws.artelonga.com.br/),
 * sem rework — a mesma universe em qualquer escala (recursive/fractal).
 *
 * Uso: node tools/bake-aws.mjs   (precisa de rede no build pra marked CDN)
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const ROOT = process.cwd();
const DIR = path.join(ROOT, "yuri", "aws");
const esc = s => String(s).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
const APEX = "https://artelonga.com.br/yuri/aws/";
const DOCS = "https://artelonga.com.br/docs/";   // siblings absolutos — resolvem no apex E no surface

// pt = raiz da universe (/yuri/aws/ ou /), en = /en/
const PAGES = [
  { src: "aws.pt.md", out: "index.html", lang: "pt-BR", toHref: "en/", toLabel: "EN", self: APEX,
    desc: "AWS pela experiência: ferramentas, decisões, custos e postmortems de uma plataforma de dados real (~US$ 155/mês).",
    metrics: [["~US$ 155/mês", "custo operacional"], ["95% ↓", "custo DynamoDB→S3"], ["700×", "migração mais rápida"], ["226M", "itens migrados"]],
    seeLabel: "Ver também",
    seeAlso: [["Brain as a Service", DOCS + "brain-as-a-service.html"], ["Telemetria & Analytics", DOCS + "telemetry-surfaces.html"]] },
  { src: "aws.en.md", out: "en/index.html", lang: "en", toHref: "../", toLabel: "PT", self: APEX + "en/",
    desc: "AWS through experience: tools, decisions, costs and postmortems from a real data platform (~US$ 155/mo).",
    metrics: [["~US$ 155/mo", "operating cost"], ["95% ↓", "cost DynamoDB→S3"], ["700×", "faster migration"], ["226M", "items migrated"]],
    seeLabel: "See also",
    seeAlso: [["Brain as a Service", DOCS + "brain-as-a-service.html"], ["Telemetry & Analytics", DOCS + "telemetry-surfaces.html"]] },
];

const CSS = `
 :root{--ink:#0a0a0a;--ink2:#444;--ink3:#888;--line:#e7e1da;--bg:#fbf9f6;--bg2:#fff;--accent:#9a3b2e}
 *{box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;max-width:780px;margin:0 auto;padding:4vh 1.4rem 10vh;line-height:1.62;color:var(--ink);background:var(--bg)}
 a{color:var(--accent);text-decoration:none;border-bottom:1px solid rgba(154,59,46,.25)}a:hover{border-bottom-color:var(--accent)}
 h1{font-size:2.2rem;letter-spacing:-.02em;line-height:1.12;margin:.2em 0 .15em}
 h2{font-size:1.25rem;margin:1.9em 0 .4em;border-top:1px solid var(--line);padding-top:.8em}
 blockquote{margin:1.2em 0;padding:.7em 1.1em;background:var(--bg2);border-left:3px solid var(--accent);border-radius:8px;color:var(--ink2);font-size:.95rem}
 ul,ol{padding-left:1.3em}li{margin:.25em 0}
 table{border-collapse:collapse;width:100%;font-size:.82rem;margin:1.2em 0;display:block;overflow-x:auto}
 th,td{border:1px solid var(--line);padding:.4rem .55rem;text-align:left;vertical-align:top}th{background:var(--bg2);font-weight:700}
 code{background:var(--bg2);border:1px solid var(--line);border-radius:4px;padding:.05em .35em;font-size:.85em}
 pre{background:var(--bg2);border:1px solid var(--line);border-radius:8px;padding:1em;overflow-x:auto;font-size:.78rem;line-height:1.4}pre code{border:0;background:none;padding:0}
 .top{display:flex;justify-content:space-between;align-items:center;font-size:.8rem;color:var(--ink3);margin-bottom:2em}
 .lang{font-weight:700;border:1px solid var(--line);border-radius:999px;padding:.25rem .7rem}
 .metrics{display:flex;flex-wrap:wrap;gap:.6rem;margin:1.3em 0 1.9em}
 .stat{flex:1 1 130px;border:1px solid var(--line);border-radius:10px;background:var(--bg2);padding:.65rem .9rem}
 .stat b{display:block;font-size:1.35rem;letter-spacing:-.02em;color:var(--accent);line-height:1.1}
 .stat span{font-size:.68rem;color:var(--ink3);text-transform:uppercase;letter-spacing:.04em}
 .seealso{margin-top:2.6em;padding-top:1.2em;border-top:1px solid var(--line)}
 .seealso h3{font-size:.7rem;text-transform:uppercase;letter-spacing:.1em;color:var(--ink3);margin:0 0 .55em}
 .seealso a{display:inline-block;margin-right:1.1em}
 footer{margin-top:2.4em;padding-top:1.2em;border-top:1px solid var(--line);font-size:.76rem;color:var(--ink3)}`;

function shell(p, title, body) {
  const other = p.lang === "pt-BR" ? APEX + "en/" : APEX;
  // case study: tira de resultados logo após o h1 (lidera pelo impacto)
  const metrics = '<div class="metrics">' + p.metrics.map(m => '<div class="stat"><b>' + esc(m[0]) + '</b><span>' + esc(m[1]) + '</span></div>').join("") + '</div>';
  const withStrip = body.replace("</h1>", "</h1>\n" + metrics);
  // see also: tece nas universes irmãs (links absolutos → resolvem no surface também)
  const seeAlso = '<nav class="seealso"><h3>' + esc(p.seeLabel) + '</h3>' + p.seeAlso.map(s => '<a href="' + s[1] + '">' + esc(s[0]) + ' ↗</a>').join("") + '</nav>';
  return `<!DOCTYPE html><html lang="${p.lang}"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${esc(title)} — Yuri · Arte Longa</title>
<meta name="description" content="${esc(p.desc)}">
<link rel="canonical" href="${p.self}">
<link rel="alternate" hreflang="${p.lang === "pt-BR" ? "pt-br" : "en"}" href="${p.self}">
<link rel="alternate" hreflang="${p.lang === "pt-BR" ? "en" : "pt-br"}" href="${other}">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(p.desc)}"><meta property="og:type" content="article">
<style>${CSS}</style></head><body>
<div class="top"><a href="/yuri/">← yuri</a><a class="lang" href="${p.toHref}" hreflang="${p.toLabel === "EN" ? "en" : "pt-br"}">${p.toLabel}</a></div>
${withStrip}
${seeAlso}
<footer>Conteúdo: <code>yuri/aws/aws.${p.lang === "pt-BR" ? "pt" : "en"}.md</code> · forma separada de conteúdo, pré-renderizado.
Universe <code>aws</code> (promovível a <code>aws.artelonga.com.br</code>).</footer>
</body></html>`;
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(`<!doctype html><body><div id="out"></div><script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script></body>`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.marked, null, { timeout: 20000 });
  await fs.mkdir(path.join(DIR, "en"), { recursive: true });
  for (const p of PAGES) {
    const md = await fs.readFile(path.join(DIR, p.src), "utf8");
    const title = (md.match(/^title:\s*(.+)$/m) || [, "AWS"])[1].trim();
    const body = md.replace(/^---\n[\s\S]*?\n---\s*\n/, "");
    const rendered = await page.evaluate(b => window.marked.parse(b), body);
    await fs.writeFile(path.join(DIR, p.out), shell(p, title, rendered));
    console.log("[aws] " + p.out + " (" + p.lang + ")");
  }
  await browser.close();
}
main().catch(e => { console.error("[aws] erro:", e.message); process.exit(1); });
