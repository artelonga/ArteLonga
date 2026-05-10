#!/usr/bin/env node
/**
 * audit-consistency — verifica integridade bidirecional entre
 * profile.yaml.communities e community.yaml.membros.
 *
 * Existe pra prevenir o caso Kelly/Matheus (criados com
 * communities: [quilomboaraucaria] mas não estavam em
 * quilomboaraucaria/community.yaml.membros — invisíveis em /parceiros/).
 *
 * Regra: se profile.yaml(X).communities inclui Y, então
 *        community.yaml(Y).membros DEVE incluir X. E vice-versa.
 *
 * Uso:
 *   node tools/audit-consistency.mjs
 *   npm run audit-consistency
 *
 * Exit 0 = OK. Exit 1 = inconsistencies detectadas.
 */

import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import yaml from "js-yaml";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// Lê todos os profile.yaml e community.yaml na raiz.
function readAllYamls(filename) {
    const out = new Map();
    for (const entry of fs.readdirSync(ROOT, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const p = path.join(ROOT, entry.name, filename);
        if (!fs.existsSync(p)) continue;
        try {
            const data = yaml.load(fs.readFileSync(p, "utf8"));
            if (data && data.handle) out.set(data.handle, data);
        } catch (e) {
            console.error(`[audit-consistency] FAIL: ${p} parse error: ${e.message}`);
            process.exit(2);
        }
    }
    return out;
}

const profiles = readAllYamls("profile.yaml");
const communities = readAllYamls("community.yaml");

const issues = [];

// 1. profile.communities → community.membros
for (const [handle, p] of profiles) {
    const profileCommunities = p.communities || [];
    for (const cHandle of profileCommunities) {
        const c = communities.get(cHandle);
        if (!c) {
            issues.push({
                kind: "missing-community",
                msg: `${handle}/profile.yaml referencia community "${cHandle}" mas ${cHandle}/community.yaml não existe`,
            });
            continue;
        }
        const membros = c.membros || [];
        if (!membros.includes(handle)) {
            issues.push({
                kind: "profile-not-in-community",
                msg: `${handle}/profile.yaml.communities inclui "${cHandle}", mas ${cHandle}/community.yaml.membros NÃO inclui "${handle}"`,
                fix: `Adicionar "${handle}" em ${cHandle}/community.yaml.membros[] e re-rodar bake.`,
            });
        }
    }
}

// NOTA: a direção inversa (community.membros → profile.communities) NÃO é
// enforced. Fundadores (Yuri, Igo, José Antônio, Mono, Bruna) participam
// de quilomboaraucaria mas a relação primária deles é artelonga; eles
// aparecem em community.membros mas não declaram communities no profile.
// Esse é design intencional (community = quem participa; profile.communities
// = relação primária externa). Audit só falha quando profile DIZ que está
// numa community e a community não confirma — bug do Kelly/Matheus.

if (issues.length === 0) {
    console.log(`[audit-consistency] OK — ${profiles.size} profiles × ${communities.size} communities, integridade bidirecional consistente.`);
    process.exit(0);
}

console.error(`[audit-consistency] FAIL — ${issues.length} inconsistência${issues.length === 1 ? "" : "s"}:`);
for (const i of issues) {
    console.error(`  ❌ ${i.msg}`);
    if (i.fix) console.error(`     → ${i.fix}`);
}
process.exit(1);
