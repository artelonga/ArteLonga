#!/usr/bin/env node
/**
 * bake-backlinks — gera assets/backlinks.json com o grafo reverso de referências.
 *
 * Para cada handle, lista todos os entries que o referenciam.
 * Consumido pelo renderer de perfil para exibir a seção "Mencionado em".
 *
 * Referências rastreadas (mesmo conjunto do audit-handles.mjs + missions):
 *   - service.responsavel[], service.implicitResponsavel[] → person/community handles
 *   - person.citacoes[].autor, person.subMembers[], person.parentHandle, person.communities[]
 *   - community.membros[], community.parcerias[].de, community.parcerias[].contribuicoes[].quem
 *   - mission.comunidade, mission.objetivoAutor, mission.envolvidos[], mission.parentMission
 *
 * Saída: assets/backlinks.json
 * Formato: { [handle]: BacklinkEntry[] }
 *
 * Uso:
 *   node tools/bake-backlinks.mjs
 *   npm run bake-backlinks
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
    console.error("[bake-backlinks] FAIL: AL not loaded from data.js");
    process.exit(2);
}

/** @type {Map<string, Array<{from: string, nome: string, type: string, via: string}>>} */
const index = new Map();

function addBacklink(targetHandle, from, nome, type, via) {
    if (!targetHandle || !from) return;
    if (!index.has(targetHandle)) index.set(targetHandle, []);
    const existing = index.get(targetHandle);
    if (!existing.some(e => e.from === from && e.via === via)) {
        existing.push({ from, nome, type, via });
    }
}

// ── Services ────────────────────────────────────────────────────────────────
for (const s of (AL.services || [])) {
    const slug = s.slug ?? AL.slugify(s.titulo);
    for (const h of (s.responsavel || [])) {
        addBacklink(h, slug, s.titulo, "service", "responsavel");
    }
    for (const h of (s.implicitResponsavel || [])) {
        addBacklink(h, slug, s.titulo, "service", "responsavel");
    }
}

// ── People ───────────────────────────────────────────────────────────────────
for (const p of (AL.people || [])) {
    for (const c of (p.citacoes || [])) {
        if (c.autor) addBacklink(c.autor, p.handle, p.nome, "person", "citacoes");
    }
    for (const h of (p.subMembers || [])) {
        addBacklink(h, p.handle, p.nome, "person", "subMembers");
    }
    if (p.parentHandle) {
        addBacklink(p.parentHandle, p.handle, p.nome, "person", "parentHandle");
    }
    for (const h of (p.communities || [])) {
        addBacklink(h, p.handle, p.nome, "person", "communities");
    }
}

// ── Communities ───────────────────────────────────────────────────────────────
for (const c of (AL.communities || [])) {
    for (const h of (c.membros || [])) {
        addBacklink(h, c.handle, c.nome, "community", "membros");
    }
    for (const pa of (c.parcerias || [])) {
        if (pa.de) addBacklink(pa.de, c.handle, c.nome, "community", "parcerias");
        for (const co of (pa.contribuicoes || [])) {
            if (co.quem) addBacklink(co.quem, c.handle, c.nome, "community", "parcerias");
        }
    }
}

// ── Missions ───────────────────────────────────────────────────────────────
for (const m of (AL.missions || [])) {
    if (m.comunidade) addBacklink(m.comunidade, m.handle, m.nome, "mission", "comunidade");
    if (m.objetivoAutor) addBacklink(m.objetivoAutor, m.handle, m.nome, "mission", "envolvidos");
    for (const h of (m.envolvidos || [])) {
        addBacklink(h, m.handle, m.nome, "mission", "envolvidos");
    }
    if (m.parentMission) addBacklink(m.parentMission, m.handle, m.nome, "mission", "parentMission");
}

// ── Serialize ───────────────────────────────────────────────────────────────
const result = {};
const sortedKeys = Array.from(index.keys()).sort();
for (const handle of sortedKeys) {
    result[handle] = index.get(handle);
}

const outPath = path.join(ROOT, "assets/backlinks.json");
fs.writeFileSync(outPath, JSON.stringify(result, null, 2) + "\n", "utf8");

const totalHandles = Object.keys(result).length;
const totalRefs = Object.values(result).reduce((s, a) => s + a.length, 0);
console.log(`[bake-backlinks] Wrote ${outPath} (${totalHandles} handles, ${totalRefs} refs)`);
