/**
 * Bake all <handle>/community.yaml files into the AUTO-GENERATED communities
 * section of assets/data.js.
 *
 * Usage: node tools/bake-communities.mjs
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
const ORDER_FILE = path.join(__dirname, 'communities-order.txt');

const START_MARKER = '// AUTO-GENERATED:COMMUNITIES-START';
const END_MARKER   = '// AUTO-GENERATED:COMMUNITIES-END';

// ── Load order ──────────────────────────────────────────────────────────────
const order = fs.existsSync(ORDER_FILE)
    ? fs.readFileSync(ORDER_FILE, 'utf8').trim().split('\n').map(s => s.trim()).filter(Boolean)
    : [];

// ── Collect all community.yaml files ────────────────────────────────────────
const entries = fs.readdirSync(root, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name)
    .filter(name => fs.existsSync(path.join(root, name, 'community.yaml')));

// Sort by order; unknown handles go to the end alphabetically.
const orderIndex = Object.fromEntries(order.map((h, i) => [h, i]));
entries.sort((a, b) => {
    const ia = orderIndex[a] ?? order.length;
    const ib = orderIndex[b] ?? order.length;
    if (ia !== ib) return ia - ib;
    return a.localeCompare(b);
});

// ── Load and validate each community ────────────────────────────────────────
const REQUIRED = ['handle', 'type', 'nome'];
const communities = [];

for (const handle of entries) {
    const yamlPath = path.join(root, handle, 'community.yaml');
    const raw = fs.readFileSync(yamlPath, 'utf8');
    // Use CORE_SCHEMA to prevent date strings from being parsed as Date objects.
    const community = yaml.load(raw, { schema: yaml.CORE_SCHEMA });

    for (const field of REQUIRED) {
        if (community[field] === undefined || community[field] === null) {
            console.error(`[bake-communities] ERROR: ${handle}/community.yaml missing required field "${field}"`);
            process.exit(1);
        }
    }

    if (community.handle !== handle) {
        console.error(`[bake-communities] ERROR: ${handle}/community.yaml has handle="${community.handle}", expected "${handle}"`);
        process.exit(1);
    }

    communities.push(community);
}

console.log(`[bake-communities] Loaded ${communities.length} communities.`);

// ── Serialize to JS ──────────────────────────────────────────────────────────
function serializeEntry(obj) {
    return JSON.stringify(obj, null, 2);
}

const lines = [];
lines.push('    ' + START_MARKER);
lines.push('    const communities = [');
for (let i = 0; i < communities.length; i++) {
    const block = serializeEntry(communities[i]);
    const indented = block.split('\n').map(l => '        ' + l).join('\n');
    const comma = i < communities.length - 1 ? ',' : '';
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
    console.error(`[bake-communities] ERROR: markers not found in ${DATA_JS}`);
    console.error('  Add // AUTO-GENERATED:COMMUNITIES-START and // AUTO-GENERATED:COMMUNITIES-END');
    process.exit(1);
}

let blockStart = startIdx;
while (blockStart > 0 && original[blockStart - 1] !== '\n') blockStart--;

let blockEnd = endIdx + END_MARKER.length;
while (blockEnd < original.length && original[blockEnd] !== '\n') blockEnd++;
if (blockEnd < original.length && original[blockEnd] === '\n') blockEnd++;

const patched = original.slice(0, blockStart) + newBlock + '\n' + original.slice(blockEnd);

fs.writeFileSync(DATA_JS, patched, 'utf8');
console.log(`[bake-communities] Wrote ${DATA_JS}`);

// ── Validate ─────────────────────────────────────────────────────────────────
try {
    execSync(`node -e "require('${DATA_JS}')"`, { stdio: 'pipe' });
    console.log('[bake-communities] Validation OK: data.js parses without error.');
} catch (err) {
    console.error('[bake-communities] VALIDATION FAILED:');
    console.error(err.stderr?.toString() || err.message);
    process.exit(1);
}
