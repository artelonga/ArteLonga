#!/usr/bin/env node
/**
 * pre-commit-check — enforça que `assets/data.js` esteja em sync com
 * os arquivos YAML source-of-truth. Previne L-021 (edição direta no
 * bloco AUTO-GENERATED — silenciosamente sobrescrita pelo bake).
 *
 * Algoritmo:
 *   1. Snapshot do `assets/data.js` atual (bytes).
 *   2. Roda bake-people + bake-communities (regenera os blocos
 *      AUTO-GENERATED a partir dos YAMLs).
 *   3. Compara bytes. Se mudou, data.js estava dessincronizado.
 *   4. Em caso de mismatch: restaura snapshot, falha com instruções.
 *
 * Bake só toca os blocos entre AUTO-GENERATED:*-START/END.
 * Todas as seções content de data.js agora são AUTO-GENERATED.
 *
 * Uso:
 *   node tools/pre-commit-check.mjs
 *   npm run pre-commit
 *
 * Wire ao git hook via .husky/pre-commit (ver AL-17 + CLAUDE.md).
 *
 * Exit 0 = OK. Exit 1 = data.js out of sync. Exit 2 = bake erro.
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_JS = path.join(ROOT, "assets/data.js");
const TYPES_GEN = path.join(ROOT, "src/types.gen.ts");

// ── Part 1: Check types.gen.ts sync with openapi/artelonga.yaml ──────────

const typesGenBefore = fs.existsSync(TYPES_GEN) ? fs.readFileSync(TYPES_GEN, "utf8") : "";

try {
    execSync("npm run gen-types", { cwd: ROOT, stdio: "ignore" });
} catch (e) {
    console.error("[pre-commit-check] FAIL: gen-types error.");
    console.error(e.message);
    if (typesGenBefore) fs.writeFileSync(TYPES_GEN, typesGenBefore);
    process.exit(2);
}

const typesGenAfter = fs.readFileSync(TYPES_GEN, "utf8");

if (typesGenBefore !== typesGenAfter) {
    // Restore snapshot
    if (typesGenBefore) fs.writeFileSync(TYPES_GEN, typesGenBefore);
    else fs.unlinkSync(TYPES_GEN);

    console.error("");
    console.error("❌ src/types.gen.ts está dessincronizado de openapi/artelonga.yaml.");
    console.error("");
    console.error("   Você editou o openapi/artelonga.yaml e esqueceu de rodar `npm run gen-types`.");
    console.error("");
    console.error("   Fix:");
    console.error("       npm run gen-types");
    console.error("       git add src/types.gen.ts");
    console.error("       git commit (de novo)");
    console.error("");
    process.exit(1);
}

// ── Part 2: Check assets/data.js sync with YAML source-of-truth ──────────

// 1. Snapshot
const before = fs.readFileSync(DATA_JS, "utf8");

// 2. Run bakes
try {
    execSync("node tools/bake-people.mjs", { cwd: ROOT, stdio: "ignore" });
    execSync("node tools/bake-communities.mjs", { cwd: ROOT, stdio: "ignore" });
    execSync("node tools/bake-services.mjs", { cwd: ROOT, stdio: "ignore" });
    execSync("node tools/bake-missions.mjs", { cwd: ROOT, stdio: "ignore" });
    execSync("node tools/bake-solutions.mjs", { cwd: ROOT, stdio: "ignore" });
    execSync("node tools/bake-finances.mjs", { cwd: ROOT, stdio: "ignore" });
    execSync("node tools/bake-backlinks.mjs", { cwd: ROOT, stdio: "ignore" });
} catch (e) {
    console.error("[pre-commit-check] FAIL: bake error.");
    console.error(e.message);
    // Restore snapshot
    fs.writeFileSync(DATA_JS, before);
    process.exit(2);
}

// 3. Compare
const after = fs.readFileSync(DATA_JS, "utf8");

if (before === after) {
    // No drift. data.js was in sync.
    process.exit(0);
}

// 4. Drift detected — restore snapshot, fail loud
fs.writeFileSync(DATA_JS, before);

console.error("");
console.error("❌ assets/data.js está dessincronizado dos YAMLs source-of-truth.");
console.error("");
console.error("   Possíveis causas:");
console.error("   (a) Você editou um YAML source-of-truth e esqueceu de rodar `npm run bake`.");
console.error("       YAMLs: <handle>/profile.yaml, <handle>/community.yaml,");
console.error("              servicos/<slug>/service.yaml, missoes/<slug>/mission.yaml,");
console.error("              solucoes/<handle>/solution.yaml, recursos/finances.yaml");
console.error("   (b) Você editou data.js DIRETAMENTE no bloco AUTO-GENERATED:*-START/END.");
console.error("       Esse bloco é regenerado pelo bake — qualquer edição manual seria");
console.error("       silenciosamente sobrescrita. Mova o conteúdo pro YAML correspondente.");
console.error("");
console.error("   Fix:");
console.error("       npm run bake");
console.error("       git add assets/data.js");
console.error("       git commit (de novo)");
console.error("");
console.error("   Lesson: docs/LESSONS.md#L-021 (edição direta em arquivo AUTO-GENERATED).");
console.error("");
process.exit(1);
