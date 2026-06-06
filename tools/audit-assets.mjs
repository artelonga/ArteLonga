#!/usr/bin/env node
/* tools/audit-assets.mjs — todo asset local referenciado por um HTML existe e está
 * TRACKED no git. Previne o caso /2026-05-29/ (página commitada, mas /neuro/*.css|js
 * ficaram staged-mas-não-commitados → 200 local, 404 na apex). Renderiza local, quebra
 * em produção. Sai != 0 se um asset referenciado não está versionado.
 *
 * Uso: node tools/audit-assets.mjs
 */
import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const tracked = new Set(execSync("git ls-files", { cwd: ROOT, encoding: "utf8" }).split("\n").filter(Boolean));
const htmls = [...tracked].filter(f => f.endsWith(".html") && !f.startsWith("node_modules"));
const ASSET = /\.(css|js|mjs|png|svg|jpe?g|webp|gif|ico|woff2?|json|pdf)$/i;

const missing = [];
for (const h of htmls) {
  let src; try { src = readFileSync(path.join(ROOT, h), "utf8"); } catch { continue; }
  const dir = path.dirname(h);
  const refs = [...src.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/gi)].map(m => m[1]);
  for (let ref of refs) {
    ref = ref.split("?")[0].split("#")[0];
    if (!ref || /^(https?:|data:|mailto:|tel:|\/\/)/i.test(ref)) continue;   // externos
    if (!ASSET.test(ref)) continue;                                          // só assets
    const rel = ref.startsWith("/") ? ref.slice(1) : path.join(dir, ref);    // absoluto = a partir da raiz
    const norm = path.normalize(rel);
    if (norm.startsWith("..")) continue;
    if (!tracked.has(norm)) missing.push(`${h}  →  /${norm}${existsSync(path.join(ROOT, norm)) ? "  (existe local, NÃO commitado)" : "  (não existe)"}`);
  }
}

if (missing.length) {
  console.error(`[audit-assets] ✗ ${missing.length} asset(s) referenciado(s) mas NÃO tracked (404 na apex):`);
  [...new Set(missing)].forEach(m => console.error("  " + m));
  process.exit(1);
}
console.log(`[audit-assets] ✓ todos os assets locais referenciados por ${htmls.length} HTMLs estão versionados.`);
