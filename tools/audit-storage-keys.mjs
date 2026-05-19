#!/usr/bin/env node
/**
 * audit-storage-keys — verifica que chaves al_* hardcoded não aparecem
 * fora dos dois arquivos autorizados:
 *   1. src/lib/storage-keys.ts  (definição TS — source of truth para código TS)
 *   2. assets/analytics.js      (IIFE vanilla — tem cópia própria das constantes; não pode importar TS)
 *
 * Escopo: arquivos .ts, .js, .mjs (exceto node_modules, dist, .git).
 * Arquivos HTML com inline scripts não são verificados — analytics/index.html
 * é um dashboard dev que lê a fila diretamente e não tem como importar TS.
 *
 * Uso:
 *   node tools/audit-storage-keys.mjs
 *   npm run audit-storage-keys
 *
 * Exit 0 = OK. Exit 1 = chaves hardcoded detectadas.
 */

import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const KEYS = ["al_vid", "al_sid", "al_optout", "al_evq_v1", "al_utm"];

const ALLOWED = new Set([
    path.join(ROOT, "src/lib/storage-keys.ts"),
    path.join(ROOT, "assets/analytics.js"),
    path.join(ROOT, "tools/audit-storage-keys.mjs"), // the key list lives here too
]);

const EXTENSIONS = new Set([".ts", ".js", ".mjs"]);
const SKIP_DIRS = new Set(["node_modules", "dist", ".git"]);

function* walkFiles(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (SKIP_DIRS.has(entry.name)) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) yield* walkFiles(full);
        else if (EXTENSIONS.has(path.extname(entry.name))) yield full;
    }
}

const violations = [];

for (const filePath of walkFiles(ROOT)) {
    if (ALLOWED.has(filePath)) continue;
    const content = fs.readFileSync(filePath, "utf8");
    for (const key of KEYS) {
        const rx = new RegExp(`["'\`]${key}["'\`]`, "g");
        let m;
        while ((m = rx.exec(content)) !== null) {
            const lineNo = content.slice(0, m.index).split("\n").length;
            violations.push({ file: path.relative(ROOT, filePath), line: lineNo, key });
        }
    }
}

if (violations.length === 0) {
    console.log(`[audit-storage-keys] OK — nenhuma chave al_* hardcoded fora dos arquivos autorizados.`);
    process.exit(0);
}

console.error(`[audit-storage-keys] FAIL — ${violations.length} ocorrência(s) de chave hardcoded:\n`);
for (const v of violations) {
    console.error(`  ❌ ${v.file}:${v.line}  "${v.key}"`);
}
console.error(`
Fix: use STORAGE_KEYS.* de src/lib/storage-keys.ts (código TS) ou o bloco de constantes de assets/analytics.js (JS vanilla).`);
process.exit(1);
