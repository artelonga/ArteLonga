#!/usr/bin/env node
/**
 * audit-handles — verifica que cada referência de handle em data.js
 * resolve para um perfil ou comunidade existente.
 *
 * Existe pra pegar typos em handles (ex: "yur" vs "yuri") e referências
 * a perfis removidos que não foram limpos das cross-references.
 *
 * Campos auditados:
 *   - service.responsavel[], service.implicitResponsavel[]
 *   - person.citacoes[].autor, person.subMembers[], person.parentHandle, person.communities[]
 *   - community.membros[], community.parcerias[].de, community.parcerias[].contribuicoes[].quem
 *
 * Uso:
 *   node tools/audit-handles.mjs
 *   npm run audit-handles
 *
 * Exit 0 = OK. Exit 1 = orphans detectados.
 */

import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

global.window = {};
const dataPath = path.join(ROOT, "assets/data.js");
const dataSource = fs.readFileSync(dataPath, "utf8");
new Function(dataSource).call(globalThis);
const AL = globalThis.window.AL;

if (!AL) {
    console.error("[audit-handles] FAIL: AL not loaded from data.js");
    process.exit(2);
}

// AL.get() resolves people, communities, solutions, and missions — the full graph.
const resolves = h => Boolean(AL.get(h));

const refs = [];

// services.responsavel / implicitResponsavel
for (const s of (AL.services || [])) {
    for (const h of (s.responsavel || [])) {
        refs.push({ src: `service "${s.titulo}".responsavel`, handle: h });
    }
    for (const h of (s.implicitResponsavel || [])) {
        refs.push({ src: `service "${s.titulo}".implicitResponsavel`, handle: h });
    }
}

// people: citacoes.autor, subMembers, parentHandle, communities
for (const p of (AL.people || [])) {
    for (const c of (p.citacoes || [])) {
        if (c.autor) refs.push({ src: `${p.handle}.citacoes[].autor`, handle: c.autor });
    }
    for (const h of (p.subMembers || [])) {
        refs.push({ src: `${p.handle}.subMembers`, handle: h });
    }
    if (p.parentHandle) {
        refs.push({ src: `${p.handle}.parentHandle`, handle: p.parentHandle });
    }
    for (const h of (p.communities || [])) {
        refs.push({ src: `${p.handle}.communities`, handle: h });
    }
}

// community.membros + parcerias.de + parcerias.contribuicoes.quem
for (const c of (AL.communities || [])) {
    for (const h of (c.membros || [])) {
        refs.push({ src: `${c.handle}.membros`, handle: h });
    }
    for (const pa of (c.parcerias || [])) {
        if (pa.de) refs.push({ src: `${c.handle}.parcerias.de`, handle: pa.de });
        for (const co of (pa.contribuicoes || [])) {
            if (co.quem) refs.push({ src: `${c.handle}.parcerias.contribuicoes.quem`, handle: co.quem });
        }
    }
}

const orphans = refs.filter(r => !resolves(r.handle));

if (orphans.length === 0) {
    console.log(`[audit-handles] OK — ${refs.length} referências verificadas, zero orphans.`);
    process.exit(0);
}

console.error(`[audit-handles] FAIL — ${orphans.length} handle${orphans.length === 1 ? "" : "s"} órfão${orphans.length === 1 ? "" : "s"}:`);
for (const o of orphans) {
    console.error(`  ❌ "${o.handle}"  (em ${o.src})`);
}
console.error(`\nFix: corrigir o handle no campo ou criar o perfil/comunidade correspondente.`);
process.exit(1);
