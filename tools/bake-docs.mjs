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
  { slug: "user-template", group: "publico" },
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
  .tag.dev{background:#eef1f6;color:var(--ink3)}.tag.pub{background:#e6f1e8;color:#3a7d44}
  .tag.app{background:#fbeae6;color:var(--accent)}.tag.ext{background:#f0ece6;color:var(--ink2)}`;

// CSS extra, só do mapa/lobby (index). Anexado ao CSS compartilhado nesta página.
const MAP_CSS = `
  .lede{font-size:1.05rem;color:var(--ink2);max-width:62ch}
  .spine{display:flex;align-items:center;gap:.7rem;margin:2.2em 0 .2em}
  .spine .end{font-size:.66rem;font-weight:700;letter-spacing:.04em;color:var(--ink3);white-space:nowrap}
  .spine .bar{flex:1;height:8px;border-radius:999px;
    background:linear-gradient(90deg,#cdd6e2 0%,#d9cfc6 50%,var(--accent) 100%)}
  .spine-cap{font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;color:var(--ink3);text-align:center;margin:.2em 0 2.4em}
  .jgroup{margin:2.2em 0;padding-left:1rem;border-left:3px solid var(--line)}
  .jgroup h2{border:0;padding:0;margin:0 0 .9em;font-size:1.18rem;letter-spacing:-.01em;display:flex;align-items:baseline;gap:.55rem}
  .jgroup .jn{display:inline-flex;align-items:center;justify-content:center;width:1.5rem;height:1.5rem;flex:none;
    font-size:.74rem;font-weight:700;color:#fff;background:var(--accent);border-radius:999px}
  .cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:.7rem}
  /* card = div com link de título "esticado" (cobre o card). Sem <a> aninhado:
     o link "en" é irmão, clicável acima do esticado. Evita o bug do card vazio. */
  .card{position:relative;display:flex;flex-direction:column;gap:.3rem;padding:.85rem .95rem;background:var(--bg2);
    border:1px solid var(--line);border-radius:10px;transition:border-color .15s}
  .card:hover{border-color:var(--accent)}
  .card .ct{font-weight:700;font-size:.95rem;line-height:1.25}
  .card .ct a{color:var(--ink);border:0}
  .card .ct a::after{content:"";position:absolute;inset:0;border-radius:10px}
  .card .cl{font-size:.82rem;color:var(--ink2);line-height:1.4}
  .card .cf{margin-top:auto;padding-top:.15em;display:flex;align-items:center;gap:.5rem}
  .card .en{font-size:.68rem;color:var(--ink3);border:0;position:relative;z-index:1}
  .card .en:hover{color:var(--accent)}
  .jgroup .src{font-size:.78rem;color:var(--ink3);margin:.7em 0 0}
  .maplinks{margin:3em 0 0;padding-top:1.2em;border-top:1px solid var(--line);font-size:.82rem;color:var(--ink3)}
  .maplinks a{color:var(--ink2)}
  /* prosa conceitual (① O que é) — sem widget, o espinhaço acima já visualiza */
  .concept{font-size:.95rem;color:var(--ink2);max-width:62ch;margin:.2em 0 1.4em}
  /* cartões de comando (② Construir) — adaptado de .codocs-cmd → paleta dos docs */
  .map-cmds{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:.7rem;margin:.2em 0 1.2em}
  .map-cmd{display:flex;flex-direction:column;gap:.4rem;padding:.85rem .95rem;background:var(--bg2);
    border:1px solid var(--line);border-left:3px solid var(--accent);border-radius:10px}
  .map-cmd-name{align-self:flex-start;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.86rem;
    font-weight:700;color:var(--ink);background:var(--bg);border:1px solid var(--line);padding:.18em .5em;border-radius:6px}
  .map-cmd-syn{font-size:.85rem;font-weight:700;color:var(--ink);margin:0}
  .map-cmd-faz{font-size:.8rem;color:var(--ink2);margin:0;line-height:1.4}
  .map-cmd-onde{font-size:.76rem;color:var(--ink3);margin:auto 0 0}
  .map-cmd-onde span{display:inline-block;font-size:.62rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--accent);margin-right:.45em}
  .map-note{font-size:.82rem;color:var(--ink3);margin:.4em 0 0}
  .map-note code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.85em;background:var(--bg2);border:1px solid var(--line);border-radius:4px;padding:.05em .35em;color:var(--ink2)}
  /* grupos de API (③ API) — adaptado de .codocs-api-group + .codocs-ep */
  .map-api{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:.7rem;margin:.2em 0 1.2em}
  .map-api-group{background:var(--bg2);border:1px solid var(--line);border-radius:12px;padding:.85rem .95rem}
  .map-api-head{display:flex;align-items:center;justify-content:space-between;gap:1em;margin:0 0 .6em}
  .map-api-name{font-size:.98rem;font-weight:700;color:var(--ink);margin:0}
  .map-auth{font-size:.6rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;padding:.2em .6em;border-radius:999px;white-space:nowrap}
  .map-auth-publico{background:#e6f1e8;color:#3a7d44}
  .map-auth-jwt{background:#eef1f6;color:#4452a6}
  .map-auth-token{background:#fbeae6;color:var(--accent)}
  table.map-ep{width:100%;border-collapse:collapse;font-size:.78rem;display:table;margin:0;overflow:visible}
  table.map-ep td{border:0;border-bottom:1px solid var(--line);padding:.45em .5em .45em 0;vertical-align:top}
  table.map-ep tr:last-child td{border-bottom:0}
  .map-ep-m{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-weight:700;font-size:.68rem;color:var(--accent);white-space:nowrap}
  .map-ep-p code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.74rem;color:var(--ink);word-break:break-all}
  .map-ep-d{color:var(--ink2)}
  .map-callout{margin:.6em 0 0;border:1px solid var(--accent);border-radius:14px;padding:1rem 1.1rem;background:var(--bg2);
    display:flex;flex-wrap:wrap;align-items:baseline;gap:.4em 1.2em}
  .map-callout strong{color:var(--ink);font-size:.98rem;flex-basis:100%}
  .map-callout a{font-weight:700}
  /* tabela de funcionalidades (④) — adaptado de .codocs-func */
  .map-func-wrap{overflow-x:auto;border:1px solid var(--line);border-radius:12px;margin:.2em 0 0}
  table.map-func{width:100%;border-collapse:collapse;font-size:.84rem;display:table;margin:0;overflow:visible}
  table.map-func th{text-align:left;font-size:.66rem;letter-spacing:.05em;text-transform:uppercase;color:var(--ink3);
    background:var(--bg2);font-weight:700;padding:.7em .9em;border:0;border-bottom:1px solid var(--line)}
  table.map-func td{padding:.65em .9em;border:0;border-bottom:1px solid var(--line);vertical-align:top}
  table.map-func tr:last-child td{border-bottom:0}
  .map-func-name{font-weight:700;color:var(--ink)}
  .map-func-onde code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.74rem;color:var(--ink2)}
  @media(max-width:560px){.cards,.map-cmds,.map-api{grid-template-columns:1fr}.spine{flex-wrap:wrap}.spine .bar{order:3;flex-basis:100%}}`;

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

  // ── MAPA / LOBBY (índice) ───────────────────────────────────────────────
  // Forma separada de conteúdo: o mapa é montado a partir de dados curados.
  // Lookup dos docs baqueados por slug → { slug, title, langs }.
  const bySlug = Object.fromEntries(done.map(x => [x.slug, x]));

  // Estilo dos cards: doc baqueado (pub/dev), página do site (app) ou link externo (ext).
  const TAGS = {
    pub: { cls: "pub", label: "doc" },
    dev: { cls: "dev", label: "spec" },
    app: { cls: "app", label: "página" },
    ext: { cls: "ext", label: "externo" },
  };

  // Card base: <div> com link de título esticado (sem <a> aninhado) + link "en" irmão.
  const card = (href, title, line, tagCls, tagLabel, { blank = false, en = "", enBlank = false } = {}) => {
    const tgt = blank ? ' target="_blank" rel="noopener"' : "";
    const enLink = en ? ` <a class="en" href="${en}"${enBlank ? ' target="_blank" rel="noopener"' : ""}>en ↗</a>` : "";
    return `<div class="card">
      <span class="ct"><a href="${href}"${tgt}>${esc(title)}</a></span>
      <span class="cl">${esc(line)}</span>
      <span class="cf"><span class="tag ${tagCls}">${tagLabel}</span>${enLink}</span></div>`;
  };

  // Card a partir de um doc baqueado (resolve título do `done` por slug; anexa link en se houver).
  const docCard = (slug, line, title) => {
    const d = bySlug[slug];
    if (!d) return ""; // doc sem fonte → não quebra o mapa
    const tag = d.group === "publico" ? TAGS.pub : TAGS.dev;
    const en = d.langs.includes("en") ? `/docs/${slug}.en.html` : "";
    // título curado pro mapa (cliente): PT, sem jargão interno ("universo"/"surface").
    return card(`/docs/${outName(slug, "pt")}`, title || d.title, line, tag.cls, tag.label, { en });
  };

  // Card a partir de um link curado (página do site `app` ou destino externo `ext`).
  const linkCard = (title, line, href, tagKey, en) => {
    const t = TAGS[tagKey];
    return card(href, title, line, t.cls, t.label, { blank: tagKey === "ext", en, enBlank: false });
  };

  // ── Conteúdo portado de src/pages/espectro.ts (consts curadas, já em PT) ──────
  // O /espectro foi removido; o que era mostrado lá agora vive AQUI, inline.

  // Referência viva do co (deep-links; a página estática não a alcança em runtime).
  const REF = {
    app: "https://co.artelonga.com.br",
    docs: "https://co.artelonga.com.br/api/docs",
    openapi: "https://co.artelonga.com.br/api/openapi.json",
    repo: "https://github.com/artelonga/co",
    health: "https://co.artelonga.com.br/health",
  };

  // Comandos principais (CLI) — cada um {cmd, sinopse, faz, onde}.
  const COMANDOS = [
    { cmd: "co serve", sinopse: "Sobe o servidor web do co localmente (localhost-first).",
      faz: "Inicia o servidor HTTP do co na sua máquina. Flags: --port (54321), --data-dir, --open, --public (bind 0.0.0.0).",
      onde: "Rodar o co na sua máquina; inspeção local antes de publicar." },
    { cmd: "co-auto", sinopse: "Motor de automação de tarefas (binário separado, dev/co-auto).",
      faz: "Lê o board work/<space>/<KEY>-<id>.md e orquestra agentes LLM no loop planejar→executar→revisar (roteamento de modelo por tarefa).",
      onde: "Entrega contínua dirigida por tarefas." },
    { cmd: "co init <name>", sinopse: "Inicializa um novo espaço de conteúdo.",
      faz: "Cria a estrutura de um espaço novo com a key derivada do nome.",
      onde: "Começar um projeto." },
    { cmd: "co push  ·  co sync push", sinopse: "Publica o conteúdo no servidor remoto (idempotente).",
      faz: "POST /api/v1/universes + PUT .../vault/{path}; delta jj por padrão. Flags: --dry-run, --bootstrap.",
      onde: "Publicar/atualizar conteúdo." },
    { cmd: "co construir", sinopse: "Gera o site estático (Quartz) em public/.",
      faz: "Constrói o site público estático a partir do markdown (exclui _source/ com dados sensíveis).",
      onde: "Site público estático." },
    { cmd: "co board", sinopse: "Sobe o quadro de gestão (Kanban/Calendar), porta 3000.",
      faz: "Abre o quadro de tarefas (visões Kanban e Calendar).",
      onde: "Quadro de tarefas." },
    { cmd: "co launch", sinopse: "Transforma o diretório atual em espaço no co local.",
      faz: "Deriva a key do nome do diretório e sobe o conteúdo no co local na hora.",
      onde: "Subir um MVP na hora." },
    { cmd: "co deploy", sinopse: "Publica o build num alvo (ex.: static-on-r2).",
      faz: "Faz o deploy do site estático no alvo configurado. rollback --deploy-id reverte.",
      onde: "Deploy de site estático." },
    { cmd: "co auth token create", sinopse: "Cria token de API de 90 dias.",
      faz: "POST /api/v1/auth/token — emite um token portador para acesso programático.",
      onde: "Acesso programático / API." },
  ];
  const COMANDOS_NOTA = "Lista completa em <code>co --help</code> e <code>co help &lt;tópico&gt;</code>.";

  // Grupos de API / endpoints (representativos). auth: "público"|"JWT"|"token de API".
  const API_GROUPS = [
    { nome: "Auth", auth: "JWT", endpoints: [
      { metodo: "POST", path: "/api/v1/auth/login", desc: "Inicia sessão (magic link / credenciais)." },
      { metodo: "POST", path: "/api/v1/auth/verify", desc: "Verifica o código e emite o JWT." },
      { metodo: "POST", path: "/api/v1/auth/token", desc: "Cria token de API de 90 dias." },
      { metodo: "GET", path: "/api/v1/auth/me", desc: "Identidade da sessão atual." },
    ]},
    { nome: "Universes", auth: "JWT", endpoints: [
      { metodo: "GET", path: "/api/v1/universes", desc: "Lista os espaços do usuário." },
      { metodo: "GET", path: "/api/v1/universes/public", desc: "Lista os espaços públicos." },
      { metodo: "POST", path: "/api/v1/universes", desc: "Cria um espaço (idempotente)." },
      { metodo: "GET", path: "/api/v1/universes/{slug}/manifest", desc: "Manifesto/metadados do espaço." },
    ]},
    { nome: "Conteúdo (entries)", auth: "JWT", endpoints: [
      { metodo: "GET·POST", path: "/api/v1/universes/{slug}/entries", desc: "Lista ou cria entradas (markdown + frontmatter)." },
      { metodo: "GET·PUT·DELETE", path: ".../entries/{*path}", desc: "Lê, grava ou remove uma entrada." },
      { metodo: "GET", path: ".../changelog", desc: "Histórico de mudanças do espaço." },
    ]},
    { nome: "Vault (compatível Obsidian)", auth: "token de API", endpoints: [
      { metodo: "GET·PUT·DELETE", path: "/api/v1/universes/{slug}/vault/{*path}", desc: "Lê, grava ou remove um arquivo do vault." },
      { metodo: "POST", path: ".../vault/search", desc: "Busca no vault (60 req/min)." },
    ]},
    { nome: "Tempo real / sync", auth: "token de API", endpoints: [
      { metodo: "GET", path: "/api/v1/sync/ws", desc: "WebSocket de sync CRDT." },
      { metodo: "GET", path: "/ws/doc/{slug}/{doc_id}", desc: "WebSocket por documento." },
      { metodo: "GET", path: "/api/v1/events", desc: "Stream de eventos (SSE)." },
    ]},
    { nome: "Analytics", auth: "público", endpoints: [
      { metodo: "GET", path: "/api/v1/analytics/public/...", desc: "Métricas públicas agregadas." },
      { metodo: "POST", path: "/api/v1/telemetry", desc: "Ingestão de telemetria." },
    ]},
    { nome: "Feedback / contato", auth: "público", endpoints: [
      { metodo: "POST", path: "/api/v1/feedback", desc: "Envia feedback." },
      { metodo: "POST", path: "/api/v1/contact", desc: "Envia mensagem de contato." },
    ]},
  ];

  // Funcionalidades → onde se aplicam. Rótulos em PT do cliente; refs literais na 2ª coluna.
  const FUNCS = [
    { func: "Espaços de conteúdo, isolados por cliente", onde: "co init · co launch · GET·POST /api/v1/universes" },
    { func: "Conteúdo markdown + frontmatter", onde: "GET·PUT .../entries/{*path} · co serve" },
    { func: "Vault Obsidian", onde: "GET·PUT·DELETE .../vault/{*path} · POST .../vault/search" },
    { func: "Sincronização em tempo real (CRDT)", onde: "GET /api/v1/sync/ws · GET /ws/doc/{slug}/{doc_id}" },
    { func: "Separação por cliente", onde: "slug em todos os caminhos · JWT por usuário" },
    { func: "Autenticação (JWT / token de API / OAuth)", onde: "POST /api/v1/auth/login · /auth/verify · co auth token create" },
    { func: "Automação co-auto", onde: "co-auto (board work/<space>/<KEY>-<id>.md)" },
    { func: "Construção / serviço estático", onde: "co construir · co serve · co deploy" },
  ];

  const authClass = a => a === "público" ? "publico" : a === "JWT" ? "jwt" : "token";

  const comandoCard = c => `<div class="map-cmd">
      <code class="map-cmd-name">${esc(c.cmd)}</code>
      <p class="map-cmd-syn">${esc(c.sinopse)}</p>
      <p class="map-cmd-faz">${esc(c.faz)}</p>
      <p class="map-cmd-onde"><span>onde se aplica</span>${esc(c.onde)}</p>
    </div>`;

  const apiGroupCard = g => {
    const rows = g.endpoints.map(e => `<tr>
        <td class="map-ep-m">${esc(e.metodo)}</td>
        <td class="map-ep-p"><code>${esc(e.path)}</code></td>
        <td class="map-ep-d">${esc(e.desc)}</td>
      </tr>`).join("");
    return `<div class="map-api-group">
        <div class="map-api-head">
          <h3 class="map-api-name">${esc(g.nome)}</h3>
          <span class="map-auth map-auth-${authClass(g.auth)}">${esc(g.auth)}</span>
        </div>
        <table class="map-ep"><tbody>${rows}</tbody></table>
      </div>`;
  };

  const funcRow = f => `<tr>
      <td class="map-func-name">${esc(f.func)}</td>
      <td class="map-func-onde"><code>${esc(f.onde)}</code></td>
    </tr>`;

  // Blocos HTML inline injetados nas seções da jornada (② e ③).
  const comandosBlock = `<div class="map-cmds">${COMANDOS.map(comandoCard).join("")}</div>
    <p class="map-note">${COMANDOS_NOTA}</p>`;

  const apiBlock = `<div class="map-api">${API_GROUPS.map(apiGroupCard).join("")}</div>
    <div class="map-callout">
      <strong>Referência completa e interativa → Swagger.</strong>
      <a href="${REF.docs}" target="_blank" rel="noopener">Abrir o Swagger →</a>
      <a href="${REF.openapi}" target="_blank" rel="noopener">Spec OpenAPI →</a>
    </div>`;

  const funcBlock = `<div class="map-func-wrap">
      <table class="map-func">
        <thead><tr><th>Funcionalidade</th><th>Onde se aplica</th></tr></thead>
        <tbody>${FUNCS.map(funcRow).join("")}</tbody>
      </table>
    </div>`;

  // Jornada do cliente, do que uma máquina executa sozinha à experiência sob medida.
  // Cada seção pode trazer um bloco HTML inline (`html`) além dos cartões de doc.
  const JOURNEY = [
    { n: "①", title: "O que é", cards: [
      docCard("user-template", "O que é um /user e como ele vira user.artelonga.com.br — troque user por você.", "O modelo /user"),
      docCard("intelligence-as-a-service", "Cada site é soberano; um só conjunto de ferramentas; custo marginal quase zero.", "Inteligência como serviço (IaaS)"),
    ], html: `<p class="concept">Do que uma máquina executa sozinha à experiência sob medida de uma pessoa — um só conjunto de ferramentas serve as duas pontas. Nos exemplos, <code>user</code> é você.</p>` },
    { n: "②", title: "Construir", cards: [
      docCard("use-cases", "O que dá pra fazer na rede, do primeiro contato à publicação.", "Casos de uso"),
      docCard("scrum-universe", "Como um site nasce: de uma pasta a uma página no ar.", "Do arquivo ao site publicado"),
      docCard("universe-upgrade", "De uma página na rede ao seu próprio endereço.", "Promover a domínio próprio"),
    ], html: comandosBlock },
    { n: "③", title: "API", cards: [], html: apiBlock },
    { n: "④", title: "Funcionalidades → onde se aplicam", cards: [], html: funcBlock },
    { n: "⑤", title: "Medir", cards: [
      docCard("telemetry-surfaces", "Métricas de origem, sem terceiros, que pertencem a você.", "Telemetria — números próprios"),
      docCard("analytics-framework", "O modelo de medição por trás de tudo.", "Estrutura de análise"),
      docCard("analytics-api", "A interface que entrega os números.", "API de análise"),
    ]},
    { n: "⑥", title: "Crescer", cards: [
      linkCard("Infraestrutura — preços e implantações", "O que roda, quanto custa, do primeiro contato à escala.", "/infra", "app"),
      linkCard("AWS — estudo de escala", "Quando trocar de serviço: −95% de custo, 157h→13min.", "/yuri/aws/", "app", "/yuri/aws/en/"),
      docCard("lead-acquisition", "O funil completo: do primeiro contato ao cliente.", "Aquisição de clientes"),
      docCard("scrum-retrospective", "O ciclo: contato → conversão → entrega.", "Entrega e retrospectiva"),
    ]},
  ];

  // O mapa da rede: repos públicos. Descrições aterradas no README/conteúdo real de cada um.
  const NETWORK = [
    { t: "co", l: "gestão de conteúdo em grafo: texto, quadros e wiki, sincronizados em tempo real.", h: "https://github.com/artelonga/co" },
    { t: "yggdrasil", l: "mundos digitais navegáveis; reaproveita o motor 2D do co (em construção).", h: "https://github.com/artelonga/yggdrasil" },
    { t: "ArteLonga", l: "o site público + o conteúdo da rede (perfis, serviços, missões).", h: "https://github.com/artelonga/ArteLonga" },
    { t: "redearte", l: "modelo de site de conteúdo (Quartz v4), com autonomia de dados.", h: "https://github.com/artelonga/redearte" },
    { t: "rfq", l: "motor de cotações sob demanda, de baixa latência (formação de mercado).", h: "https://github.com/artelonga/rfq" },
    { t: "quilombo", l: "plataforma comunitária (SvelteKit + SQLite), quilomboaraucaria.org.", h: "https://github.com/artelonga/quilombo-blog" },
  ];

  const journeyHtml = JOURNEY.map(s => {
    const cards = s.cards.filter(Boolean);
    const cardsHtml = cards.length ? `<div class="cards">${cards.join("")}</div>` : "";
    return `<section class="jgroup">
      <h2><span class="jn">${s.n}</span> ${s.title}</h2>
      ${cardsHtml}${s.html || ""}
    </section>`;
  }).join("\n");

  const networkCards = NETWORK.map(r => linkCard(r.t, r.l, r.h, "ext")).join("");
  const networkHtml =
    `<section class="jgroup">
      <h2><span class="jn">⑦</span> O mapa da rede</h2>
      <div class="cards">${networkCards}</div>
      <p class="src">um <code>/user</code> vive na rede e pode ganhar um endereço próprio.</p>
    </section>`;

  const footerLinks = [
    ["plataforma", "https://co.artelonga.com.br"],
    ["API", "https://co.artelonga.com.br/api/docs"],
    ["OpenAPI", "https://co.artelonga.com.br/api/openapi.json"],
    ["GitHub", "https://github.com/artelonga"],
    ["saúde", "https://co.artelonga.com.br/health"],
  ].map(([t, h]) => `<a href="${h}" target="_blank" rel="noopener">${t}</a>`).join(" · ");

  const hub = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Documentação — o mapa · Arte Longa</title>
<meta name="description" content="O mapa da documentação Arte Longa: a rede te dá um site que é seu, a infraestrutura pra mantê-lo no ar e os números pra crescer. Comece por onde quiser.">
<style>${CSS}${MAP_CSS}</style></head><body>
<div class="crumb"><span><a href="/">Arte Longa</a> · docs</span></div>
<h1>Documentação — o mapa</h1>
<p class="lede">Este é o ponto de entrada. A rede te dá um site que é seu, a infraestrutura pra mantê-lo no ar e os números pra crescer — um <code>/user</code> vira <code>user.artelonga.com.br</code>. Comece por onde quiser.</p>

<div class="spine" role="img" aria-label="espectro: 0 máquina a 100 pessoa">
  <span class="end left">0 · máquina (IA)</span>
  <span class="bar"></span>
  <span class="end right">100 · pessoa (você)</span>
</div>
<p class="spine-cap">uma só documentação, o espectro inteiro</p>

${journeyHtml}
${networkHtml}

<footer class="maplinks">${footerLinks}</footer>
</body></html>`;
  await fs.writeFile(path.join(DOCS, "index.html"), hub);
  console.log(`[docs] index.html — ${done.length} docs · bilíngue ${done.filter(x => x.langs.length > 1).length}/${done.length}`);
}
main().catch(e => { console.error("[docs] erro:", e.message); process.exit(1); });
