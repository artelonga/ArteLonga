/**
 * Bake all solucoes/<handle>/solution.yaml files into the AUTO-GENERATED
 * solutions section of assets/data.js.
 *
 * Usage: node tools/bake-solutions.mjs
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
const ORDER_FILE = path.join(__dirname, "solutions-order.txt");

const START_MARKER = "// AUTO-GENERATED:SOLUTIONS-START";
const END_MARKER   = "// AUTO-GENERATED:SOLUTIONS-END";

// ── Pre-flight: schema validation ─────────────────────────────────────────────
try {
    execSync("node tools/validate-yaml.mjs --type=solution", {
        cwd: root,
        stdio: "inherit",
    });
} catch {
    console.error("[bake-solutions] ABORT: schema validation failed (see above).");
    process.exit(1);
}

// ── Load order ────────────────────────────────────────────────────────────────
const order = fs.existsSync(ORDER_FILE)
    ? fs.readFileSync(ORDER_FILE, "utf8").trim().split("\n").map(s => s.trim()).filter(Boolean)
    : [];

// ── Collect all solution.yaml files ──────────────────────────────────────────
const solDir = path.join(root, "solucoes");
const handles = fs.readdirSync(solDir, { withFileTypes: true })
    .filter(e => e.isDirectory() && fs.existsSync(path.join(solDir, e.name, "solution.yaml")))
    .map(e => e.name);

// Sort by order; unknown handles go to the end alphabetically.
const orderIndex = Object.fromEntries(order.map((h, i) => [h, i]));
handles.sort((a, b) => {
    const ia = orderIndex[a] ?? order.length;
    const ib = orderIndex[b] ?? order.length;
    if (ia !== ib) return ia - ib;
    return a.localeCompare(b);
});

// ── Load and validate each solution ──────────────────────────────────────────
const REQUIRED = ["handle", "type", "nome", "lifecycle"];
const solutions = [];

for (const handle of handles) {
    const yamlPath = path.join(solDir, handle, "solution.yaml");
    const raw = fs.readFileSync(yamlPath, "utf8");
    const solution = yaml.load(raw, { schema: yaml.CORE_SCHEMA });

    for (const field of REQUIRED) {
        if (solution[field] === undefined || solution[field] === null) {
            console.error(`[bake-solutions] ERROR: solucoes/${handle}/solution.yaml missing required field "${field}"`);
            process.exit(1);
        }
    }

    if (solution.handle !== handle) {
        console.error(`[bake-solutions] ERROR: solucoes/${handle}/solution.yaml has handle="${solution.handle}", expected "${handle}"`);
        process.exit(1);
    }

    solutions.push(solution);
}

console.log(`[bake-solutions] Loaded ${solutions.length} solutions.`);

// ── Serialize to JS ───────────────────────────────────────────────────────────
function serializeEntry(obj) {
    return JSON.stringify(obj, null, 2);
}

const lines = [];
lines.push("    " + START_MARKER);
lines.push("    const solutions = [");
for (let i = 0; i < solutions.length; i++) {
    const block = serializeEntry(solutions[i]);
    const indented = block.split("\n").map(l => "        " + l).join("\n");
    const comma = i < solutions.length - 1 ? "," : "";
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
    console.error(`[bake-solutions] ERROR: markers not found in ${DATA_JS}`);
    console.error("  Add // AUTO-GENERATED:SOLUTIONS-START and // AUTO-GENERATED:SOLUTIONS-END");
    process.exit(1);
}

let blockStart = startIdx;
while (blockStart > 0 && original[blockStart - 1] !== "\n") blockStart--;

let blockEnd = endIdx + END_MARKER.length;
while (blockEnd < original.length && original[blockEnd] !== "\n") blockEnd++;
if (blockEnd < original.length && original[blockEnd] === "\n") blockEnd++;

const patched = original.slice(0, blockStart) + newBlock + "\n" + original.slice(blockEnd);

fs.writeFileSync(DATA_JS, patched, "utf8");
console.log(`[bake-solutions] Wrote ${DATA_JS}`);

// ── Validate ──────────────────────────────────────────────────────────────────
try {
    execSync(`node -e "require('${DATA_JS}')"`, { stdio: "pipe" });
    console.log("[bake-solutions] Validation OK: data.js parses without error.");
} catch (err) {
    console.error("[bake-solutions] VALIDATION FAILED:");
    console.error(err.stderr?.toString() || err.message);
    process.exit(1);
}
