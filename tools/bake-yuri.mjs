#!/usr/bin/env node
/* tools/bake-yuri.mjs — indexa as entradas de yuri/ (dias, refs, notas) num
 * yuri/entries.json consultável pelo índice. Parser de frontmatter mínimo
 * (sem deps): escalares, arrays inline [a,b] e o bloco media: (- kind:/url:). */
import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.argv[2] || ".");
const DIRS = ["dias", "refs", "notas", "escrita"];  // pastas escaneadas (cada arquivo .md = entrada)
const OUT = path.join(ROOT, "yuri/entries.json");

// kind: separa Portfólio de Sistemas do Criativo. Default deriva do type; frontmatter `kind:` sobrepõe.
const SYS_TYPES = new Set(["portfolio", "nota", "page", "url", "resume", "paper", "project"]);
const kindFromType = (type) => (SYS_TYPES.has(type) ? "systems" : "creative");

function parseScalar(v) {
  v = v.trim();
  if (v === "") return "";
  if ((v[0] === '"' && v.endsWith('"')) || (v[0] === "'" && v.endsWith("'"))) return v.slice(1, -1);
  if (v === "true") return true;
  if (v === "false") return false;
  if (/^-?\d+$/.test(v)) return parseInt(v, 10);
  if (/^\[.*\]$/.test(v)) return v.slice(1, -1).split(",").map((x) => x.trim()).filter(Boolean);
  return v;
}

function parseFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { fm: {}, body: text };
  const lines = m[1].split("\n");
  const fm = {};
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() || /^\s*#/.test(line)) continue;
    const mm = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!mm) continue;
    const key = mm[1], rest = mm[2];
    if (key === "media" && rest.trim() === "") {        // bloco de mídia recursiva
      const media = [];
      let j = i + 1;
      while (j < lines.length && /^\s+/.test(lines[j])) {
        const item = lines[j].match(/^\s*-\s*kind:\s*(.+)$/);
        if (item) {
          const obj = { kind: parseScalar(item[1]) };
          while (j + 1 < lines.length && /^\s+\w+:/.test(lines[j + 1]) && !/^\s*-\s/.test(lines[j + 1])) {
            const kv = lines[++j].match(/^\s*(\w+):\s*(.+)$/);
            if (kv) obj[kv[1]] = parseScalar(kv[2]);
          }
          media.push(obj);
        }
        j++;
      }
      fm.media = media; i = j - 1;
    } else {
      fm[key] = parseScalar(rest);
    }
  }
  return { fm, body: m[2] };
}

// remove sintaxe de link markdown ([txt](url)) e wiki ([[a|b]]) → texto puro (pra prévia)
function plain(s) {
  return s
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, a, b) => (b || a).trim());
}
// trecho de prévia: a 1ª citação [!quote] ou a 1ª linha de texto
function snippet(body) {
  const q = body.match(/>\s*\[!quote\][^\n]*\n((?:>\s?.*\n?)+)/i);
  if (q) return plain(q[1].replace(/^>\s?/gm, "").trim().split("\n").slice(0, 3).join(" · "));
  const line = body.split("\n").map((l) => l.trim()).find((l) => l && !l.startsWith("#") && !l.startsWith("!["));
  return plain(line || "").slice(0, 140);
}

const entries = [];
for (const dir of DIRS) {
  let files = [];
  try { files = await fs.readdir(path.join(ROOT, "yuri", dir)); } catch { continue; }
  for (const f of files) {
    if (!f.endsWith(".md")) continue;
    const rel = `yuri/${dir}/${f}`;
    const text = await fs.readFile(path.join(ROOT, rel), "utf8");
    const { fm, body } = parseFrontmatter(text);
    if (fm.published === false) continue;             // rascunho: não entra no índice público
    const slug = f.replace(/\.md$/, "");
    const type = fm.type || (dir === "dias" ? "dia" : dir === "notas" ? "nota" : dir === "escrita" ? "texto" : "ref");
    entries.push({
      slug, path: "/" + rel, folder: dir,
      type,
      kind: fm.kind || kindFromType(type),          // technical | creative (split do índice)
      lang: fm.lang || "pt-BR",                      // idioma do conteúdo (UI bilíngue + fallback)
      tkey: fm.tkey || slug,                         // chave de tradução: agrupa variantes pt/en do mesmo item
      category: fm.category || null,
      title: fm.title || (fm.date ? String(fm.date) : slug),
      author: fm.author || null, mine: fm.mine === true,
      created: fm.created != null ? String(fm.created) : null,
      added: fm.added || fm.date || null,
      date: fm.date || null,
      published: fm.published !== false,            // dias: default publicado salvo published:false
      tags: Array.isArray(fm.tags) ? fm.tags : (fm.tags ? [fm.tags] : []),
      media: Array.isArray(fm.media) ? fm.media : [],
      caderno: fm.caderno || null, pagina: fm.pagina != null ? fm.pagina : null,
      snippet: snippet(body),
    });
  }
}
// dias publicadas + todas as refs/notas; ordena por data desc (added/date/created)
entries.sort((a, b) => String(b.added || b.date || b.created || "").localeCompare(String(a.added || a.date || a.created || "")));

await fs.mkdir(path.dirname(OUT), { recursive: true });
await fs.writeFile(OUT, JSON.stringify({ generated: "static", count: entries.length, entries }, null, 2));
console.log(`bake-yuri: ${entries.length} entradas → ${path.relative(ROOT, OUT)}`);
for (const e of entries) console.log(`  ${e.kind.padEnd(9)} ${e.type.padEnd(9)} ${e.lang.padEnd(5)} ${e.category ? "[" + e.category + "] " : ""}${e.title}`);
