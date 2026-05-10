#!/usr/bin/env node
/**
 * audit-shells — verifica que cada slug referenciado em data.js
 * (services, people com handle, communities) tem shell HTML correspondente.
 *
 * Existe pra evitar L-007 (URL referenciada sem shell HTML = 404). Bug
 * típico: adiciona service novo no catálogo, esquece de criar
 * servicos/<slug>/index.html, usuário cai em 404 silencioso.
 *
 * Uso:
 *   node tools/audit-shells.mjs
 *   npm run audit-shells
 *
 * Exit 0 = OK. Exit 1 = gaps detectados (e listados).
 */

import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// Carrega data.js no escopo global (mesmo trick do bake — usa globalThis).
global.window = {};
const dataPath = path.join(ROOT, "assets/data.js");
const dataSource = fs.readFileSync(dataPath, "utf8");
new Function(dataSource).call(globalThis);
const AL = globalThis.window.AL;

if (!AL) {
    console.error("[audit-shells] FAIL: AL not loaded from data.js");
    process.exit(2);
}

const gaps = [];

// 1. Cada service.slug → servicos/<slug>/index.html
for (const s of (AL.services || [])) {
    if (!s.slug) continue;
    const shell = path.join(ROOT, "servicos", s.slug, "index.html");
    if (!fs.existsSync(shell)) {
        gaps.push({ kind: "service", slug: s.slug, expected: shell, ref: s.titulo });
    }
}

// 2. Cada person/community handle → <handle>/index.html
const allHandles = [
    ...(AL.people || []).map(p => ({ handle: p.handle, kind: "person", nome: p.nome })),
    ...(AL.communities || []).map(c => ({ handle: c.handle, kind: "community", nome: c.nome })),
];

for (const e of allHandles) {
    if (!e.handle) continue;
    const shell = path.join(ROOT, e.handle, "index.html");
    if (!fs.existsSync(shell)) {
        gaps.push({ kind: e.kind, handle: e.handle, expected: shell, ref: e.nome });
    }
}

// Output
if (gaps.length === 0) {
    console.log(`[audit-shells] OK — ${AL.services.length} services + ${allHandles.length} handles, todas as shells presentes.`);
    process.exit(0);
}

console.error(`[audit-shells] FAIL — ${gaps.length} shell${gaps.length === 1 ? "" : "s"} faltando:`);
for (const g of gaps) {
    const id = g.slug || g.handle;
    console.error(`  ❌ ${g.expected.replace(ROOT + "/", "")}  (${g.kind}: "${id}" → "${g.ref}")`);
}
console.error(`\nFix: criar shell HTML em cada path acima. Template:`);
console.error(`  <!DOCTYPE html><html lang="pt-BR"><head>...<script src="/assets/bootstrap.js"></script></head>`);
console.error(`  <body data-page="service" data-slug="<slug>"></body></html>  (pra services)`);
console.error(`  <body data-page="profile" data-handle="<handle>"></body></html>  (pra perfis)`);
process.exit(1);
