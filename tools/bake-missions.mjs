/**
 * Bake all missoes/<handle>/mission.yaml files into the AUTO-GENERATED
 * missions section of assets/data.js.
 *
 * Usage: node tools/bake-missions.mjs
 *
 * Deterministic: same input → byte-identical output.
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import yaml from "js-yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const DATA_JS = path.join(root, "assets", "data.js");
const ORDER_FILE = path.join(__dirname, "missions-order.txt");

const START_MARKER = "// AUTO-GENERATED:MISSIONS-START";
const END_MARKER   = "// AUTO-GENERATED:MISSIONS-END";

// ── Pre-flight: schema validation ─────────────────────────────────────────────
try {
    execSync("node tools/validate-yaml.mjs --type=mission", {
        cwd: root,
        stdio: "inherit",
    });
} catch {
    console.error("[bake-missions] ABORT: schema validation failed (see above).");
    process.exit(1);
}

// ── Load order ────────────────────────────────────────────────────────────────
const order = fs.existsSync(ORDER_FILE)
    ? fs.readFileSync(ORDER_FILE, "utf8").trim().split("\n").map(s => s.trim()).filter(Boolean)
    : [];

// ── Collect all mission.yaml files ───────────────────────────────────────────
const missDir = path.join(root, "missoes");
const handles = fs.readdirSync(missDir, { withFileTypes: true })
    .filter(e => e.isDirectory() && fs.existsSync(path.join(missDir, e.name, "mission.yaml")))
    .map(e => e.name);

// Sort by order; unknown handles go to the end alphabetically.
const orderIndex = Object.fromEntries(order.map((h, i) => [h, i]));
handles.sort((a, b) => {
    const ia = orderIndex[a] ?? order.length;
    const ib = orderIndex[b] ?? order.length;
    if (ia !== ib) return ia - ib;
    return a.localeCompare(b);
});

// ── Load and validate each mission ───────────────────────────────────────────
const REQUIRED = ["handle", "type", "nome", "comunidade"];
const missions = [];

for (const handle of handles) {
    const yamlPath = path.join(missDir, handle, "mission.yaml");
    const raw = fs.readFileSync(yamlPath, "utf8");
    const mission = yaml.load(raw, { schema: yaml.CORE_SCHEMA });

    for (const field of REQUIRED) {
        if (mission[field] === undefined || mission[field] === null) {
            console.error(`[bake-missions] ERROR: missoes/${handle}/mission.yaml missing required field "${field}"`);
            process.exit(1);
        }
    }

    if (mission.handle !== handle) {
        console.error(`[bake-missions] ERROR: missoes/${handle}/mission.yaml has handle="${mission.handle}", expected "${handle}"`);
        process.exit(1);
    }

    missions.push(mission);
}

console.log(`[bake-missions] Loaded ${missions.length} missions.`);

// ── Serialize to JS ───────────────────────────────────────────────────────────
function serializeEntry(obj) {
    return JSON.stringify(obj, null, 2);
}

const lines = [];
lines.push("    " + START_MARKER);
lines.push("    const missions = [");
for (let i = 0; i < missions.length; i++) {
    const block = serializeEntry(missions[i]);
    const indented = block.split("\n").map(l => "        " + l).join("\n");
    const comma = i < missions.length - 1 ? "," : "";
    lines.push(indented + comma);
}
lines.push("    ];");
lines.push("    " + END_MARKER);

const newBlock = lines.join("\n");

// ── Patch data.js ─────────────────────────────────────────────────────────────
const original = fs.readFileSync(DATA_JS, "utf8");

const startIdx = original.indexOf(START_MARKER);
const endIdx   = original.indexOf(END_MARKER);

if (startIdx === -1 || endIdx === -1) {
    console.error(`[bake-missions] ERROR: markers not found in ${DATA_JS}`);
    console.error("  Add // AUTO-GENERATED:MISSIONS-START and // AUTO-GENERATED:MISSIONS-END");
    process.exit(1);
}

let blockStart = startIdx;
while (blockStart > 0 && original[blockStart - 1] !== "\n") blockStart--;

let blockEnd = endIdx + END_MARKER.length;
while (blockEnd < original.length && original[blockEnd] !== "\n") blockEnd++;
if (blockEnd < original.length && original[blockEnd] === "\n") blockEnd++;

const patched = original.slice(0, blockStart) + newBlock + "\n" + original.slice(blockEnd);

fs.writeFileSync(DATA_JS, patched, "utf8");
console.log(`[bake-missions] Wrote ${DATA_JS}`);

// ── Validate ──────────────────────────────────────────────────────────────────
try {
    execSync(`node -e "require('${DATA_JS}')"`, { stdio: "pipe" });
    console.log("[bake-missions] Validation OK: data.js parses without error.");
} catch (err) {
    console.error("[bake-missions] VALIDATION FAILED:");
    console.error(err.stderr?.toString() || err.message);
    process.exit(1);
}
