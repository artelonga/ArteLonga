#!/usr/bin/env node
/**
 * al-ship — após `co-auto --task AL-N` rodar, faz:
 *   1. push da branch atual pro remote
 *   2. abre PR (gh pr create) com title + body derivados do último commit
 *
 * Não mergeia. Owner aprova/rejeita no GitHub.
 *
 * Uso:
 *   co-auto --task AL-44
 *   npm run ship             # ou: node tools/al-ship.mjs
 *
 * Pressupõe:
 * - branch atual tem commits ahead de origin/main
 * - gh CLI logado
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

function sh(cmd) {
    return execSync(cmd, { encoding: "utf8" }).trim();
}

// Branch + safety
const branch = sh("git rev-parse --abbrev-ref HEAD");
if (branch === "main") {
    console.error("[al-ship] FAIL: você está em main. Checkout pra branch da AL primeiro.");
    process.exit(1);
}

const aheadCount = Number(sh(`git rev-list --count origin/main..${branch} 2>/dev/null`) || "0");
if (aheadCount === 0) {
    console.error(`[al-ship] FAIL: branch '${branch}' não tem commits ahead de origin/main.`);
    process.exit(1);
}

// Push (set upstream if not already)
console.log(`[al-ship] Pushing ${branch} (${aheadCount} commits)…`);
try {
    sh(`git push -u origin ${branch} 2>&1`);
} catch (e) {
    console.error(`[al-ship] FAIL: push error.\n${e.stderr || e.message}`);
    process.exit(1);
}

// Check if PR already exists
const existing = (() => {
    try {
        return sh(`gh pr list --head ${branch} --state open --json number,url --jq '.[0].url // ""'`);
    } catch { return ""; }
})();
if (existing) {
    console.log(`[al-ship] PR já existe: ${existing}`);
    process.exit(0);
}

// Derive title from latest commit subject
const subject = sh("git log -1 --pretty=%s");
// Derive body from latest commit body + AL reference
const body = sh("git log -1 --pretty=%b") || "";

// Detect AL number from branch name or subject (best-effort)
const alMatch = (branch.match(/AL-(\d+)/i) || subject.match(/AL-(\d+)/i));
const alRef = alMatch ? `AL-${alMatch[1]}` : null;

const finalBody = [
    body,
    "",
    alRef ? `## Reference\n\n- Task: \`work/artelonga/${alRef}.md\`` : "",
    "",
    "## Checklist (manual review)",
    "",
    "- [ ] Validações passam (audit, validate-yaml, typecheck)",
    "- [ ] Smoke test nas páginas afetadas",
    "- [ ] CHANGELOG entry",
    "- [ ] V bumped em bootstrap.js se mudou CSS/JS",
    "- [ ] AL-N.md com status: done",
].filter(Boolean).join("\n");

// Open PR — body via tmp file pra evitar shell escape hell (backticks etc).
console.log(`[al-ship] Opening PR: ${subject}`);
const bodyFile = path.join(os.tmpdir(), `al-ship-body-${Date.now()}.md`);
fs.writeFileSync(bodyFile, finalBody, "utf8");
try {
    const url = execSync(
        `gh pr create --base main --head ${branch} --title ${JSON.stringify(subject)} --body-file ${JSON.stringify(bodyFile)}`,
        { encoding: "utf8" }
    ).trim();
    console.log(`[al-ship] ✓ PR aberta: ${url}`);
    console.log(`[al-ship] Owner revisa + aprova (não auto-merge).`);
} catch (e) {
    console.error(`[al-ship] FAIL: gh pr create error.\n${e.stderr || e.message}`);
    process.exit(1);
} finally {
    try { fs.unlinkSync(bodyFile); } catch {}
}
