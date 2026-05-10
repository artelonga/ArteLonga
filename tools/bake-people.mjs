/**
 * Bake all <handle>/profile.yaml files into the AUTO-GENERATED people section
 * of assets/data.js.
 *
 * Usage: node tools/bake-people.mjs
 *
 * Deterministic: same input → byte-identical output.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const DATA_JS = path.join(root, 'assets', 'data.js');
const ORDER_FILE = path.join(__dirname, 'people-order.txt');

const START_MARKER = '// AUTO-GENERATED:PEOPLE-START';
const END_MARKER   = '// AUTO-GENERATED:PEOPLE-END';
const POEMS_START_MARKER = '// AUTO-GENERATED:POEMS-START';
const POEMS_END_MARKER   = '// AUTO-GENERATED:POEMS-END';

// ── Load order ──────────────────────────────────────────────────────────────
const order = fs.existsSync(ORDER_FILE)
    ? fs.readFileSync(ORDER_FILE, 'utf8').trim().split('\n').map(s => s.trim()).filter(Boolean)
    : [];

// ── Collect all profile.yaml files ──────────────────────────────────────────
const entries = fs.readdirSync(root, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name)
    .filter(name => fs.existsSync(path.join(root, name, 'profile.yaml')));

// Sort by order; unknown handles go to the end in alphabetical order.
const orderIndex = Object.fromEntries(order.map((h, i) => [h, i]));
entries.sort((a, b) => {
    const ia = orderIndex[a] ?? order.length;
    const ib = orderIndex[b] ?? order.length;
    if (ia !== ib) return ia - ib;
    return a.localeCompare(b);
});

// ── Load and validate each profile ──────────────────────────────────────────
const REQUIRED = ['handle', 'type', 'nome'];
const people = [];

for (const handle of entries) {
    const yamlPath = path.join(root, handle, 'profile.yaml');
    const raw = fs.readFileSync(yamlPath, 'utf8');
    // Use CORE_SCHEMA to prevent date strings from being parsed as Date objects.
    const profile = yaml.load(raw, { schema: yaml.CORE_SCHEMA });

    for (const field of REQUIRED) {
        if (profile[field] === undefined || profile[field] === null) {
            console.error(`[bake-people] ERROR: ${handle}/profile.yaml missing required field "${field}"`);
            process.exit(1);
        }
    }

    if (profile.handle !== handle) {
        console.error(`[bake-people] ERROR: ${handle}/profile.yaml has handle="${profile.handle}", expected "${handle}"`);
        process.exit(1);
    }

    people.push(profile);
}

console.log(`[bake-people] Loaded ${people.length} profiles.`);

// ── Serialize to JS ──────────────────────────────────────────────────────────
// Produces valid JSON (which is also valid JS), 2-space indent, then re-indent
// to fit inside the IIFE's 4-space block.

function serializeEntry(obj) {
    // JSON.stringify is deterministic for plain objects/arrays/primitives.
    return JSON.stringify(obj, null, 2);
}

const lines = [];
lines.push('    ' + START_MARKER);
lines.push('    const people = [');
for (let i = 0; i < people.length; i++) {
    const block = serializeEntry(people[i]);
    // Indent every line of the block by 8 spaces (inside `const people = [`)
    const indented = block.split('\n').map(l => '        ' + l).join('\n');
    const comma = i < people.length - 1 ? ',' : '';
    lines.push(indented + comma);
}
lines.push('    ];');
lines.push('    ' + END_MARKER);

const newBlock = lines.join('\n');

// ── Patch data.js ────────────────────────────────────────────────────────────
const original = fs.readFileSync(DATA_JS, 'utf8');

const startIdx = original.indexOf(START_MARKER);
const endIdx   = original.indexOf(END_MARKER);

if (startIdx === -1 || endIdx === -1) {
    console.error(`[bake-people] ERROR: markers not found in ${DATA_JS}`);
    console.error('  Add:');
    console.error('    // AUTO-GENERATED: do not edit by hand. Run `node tools/bake-people.mjs`.');
    console.error('    // AUTO-GENERATED:PEOPLE-START');
    console.error('    const people = [...];');
    console.error('    // AUTO-GENERATED:PEOPLE-END');
    process.exit(1);
}

// Find the start of the line that contains START_MARKER (walk back to previous \n)
let blockStart = startIdx;
while (blockStart > 0 && original[blockStart - 1] !== '\n') blockStart--;

// Find the end of the line that contains END_MARKER
let blockEnd = endIdx + END_MARKER.length;
while (blockEnd < original.length && original[blockEnd] !== '\n') blockEnd++;
// Include the newline itself
if (blockEnd < original.length && original[blockEnd] === '\n') blockEnd++;

let patched = original.slice(0, blockStart) + newBlock + '\n' + original.slice(blockEnd);

// ── Derive POEMS from people[].portfolio[kind=poem] ────────────────────────
// Cada poem entry vira { slug, titulo, autor, stanzas } compatível com o
// shape antigo do array poems[]. Drafts são pulados (não renderizados).
const poemsDerived = [];
for (const p of people) {
    if (!Array.isArray(p.portfolio)) continue;
    for (const item of p.portfolio) {
        if (item.kind !== 'poem') continue;
        if (item.draft) continue;
        poemsDerived.push({
            slug: item.slug,
            titulo: item.titulo,
            autor: p.handle,
            stanzas: item.stanzas,
        });
    }
}

const poemsLines = [];
poemsLines.push('    ' + POEMS_START_MARKER);
poemsLines.push('    const poems = [');
for (let i = 0; i < poemsDerived.length; i++) {
    const block = JSON.stringify(poemsDerived[i], null, 2);
    const indented = block.split('\n').map(l => '        ' + l).join('\n');
    const comma = i < poemsDerived.length - 1 ? ',' : '';
    poemsLines.push(indented + comma);
}
poemsLines.push('    ];');
poemsLines.push('    ' + POEMS_END_MARKER);
const poemsBlock = poemsLines.join('\n');

const poemsStartIdx = patched.indexOf(POEMS_START_MARKER);
const poemsEndIdx   = patched.indexOf(POEMS_END_MARKER);
if (poemsStartIdx === -1 || poemsEndIdx === -1) {
    console.error(`[bake-people] ERROR: poems markers not found in ${DATA_JS}`);
    process.exit(1);
}
let poemsBlockStart = poemsStartIdx;
while (poemsBlockStart > 0 && patched[poemsBlockStart - 1] !== '\n') poemsBlockStart--;
let poemsBlockEnd = poemsEndIdx + POEMS_END_MARKER.length;
while (poemsBlockEnd < patched.length && patched[poemsBlockEnd] !== '\n') poemsBlockEnd++;
if (poemsBlockEnd < patched.length && patched[poemsBlockEnd] === '\n') poemsBlockEnd++;
patched = patched.slice(0, poemsBlockStart) + poemsBlock + '\n' + patched.slice(poemsBlockEnd);

fs.writeFileSync(DATA_JS, patched, 'utf8');
console.log(`[bake-people] Wrote ${DATA_JS} (${people.length} people, ${poemsDerived.length} poems)`);

// ── Validate ─────────────────────────────────────────────────────────────────
try {
    execSync(`node -e "require('${DATA_JS}')"`, { stdio: 'pipe' });
    console.log('[bake-people] Validation OK: data.js parses without error.');
} catch (err) {
    console.error('[bake-people] VALIDATION FAILED:');
    console.error(err.stderr?.toString() || err.message);
    process.exit(1);
}
