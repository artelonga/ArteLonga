/**
 * Bake recursos/finances.yaml into the AUTO-GENERATED finances section
 * of assets/data.js.
 *
 * Usage: node tools/bake-finances.mjs
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
const FINANCES_YAML = path.join(root, "recursos", "finances.yaml");

const START_MARKER = "// AUTO-GENERATED:FINANCES-START";
const END_MARKER   = "// AUTO-GENERATED:FINANCES-END";

// ── Pre-flight: schema validation ─────────────────────────────────────────────
try {
    execSync("node tools/validate-yaml.mjs --type=finance", {
        cwd: root,
        stdio: "inherit",
    });
} catch {
    console.error("[bake-finances] ABORT: schema validation failed (see above).");
    process.exit(1);
}

// ── Load finances.yaml ────────────────────────────────────────────────────────
if (!fs.existsSync(FINANCES_YAML)) {
    console.error(`[bake-finances] ERROR: ${FINANCES_YAML} not found`);
    process.exit(1);
}

const raw = fs.readFileSync(FINANCES_YAML, "utf8");
const finances = yaml.load(raw, { schema: yaml.CORE_SCHEMA });

if (!finances || typeof finances !== "object") {
    console.error("[bake-finances] ERROR: finances.yaml did not parse to an object");
    process.exit(1);
}

console.log("[bake-finances] Loaded recursos/finances.yaml");

// ── Serialize to JS ───────────────────────────────────────────────────────────
const serialized = JSON.stringify(finances, null, 2);
const indented = serialized.split("\n").map((l, i) => i === 0 ? "    " + l : "    " + l).join("\n");

const lines = [];
lines.push("    " + START_MARKER);
lines.push("    const finances = " + indented + ";");
lines.push("    " + END_MARKER);

const newBlock = lines.join("\n");

// ── Patch data.js ─────────────────────────────────────────────────────────────
const original = fs.readFileSync(DATA_JS, "utf8");

const startIdx = original.indexOf(START_MARKER);
const endIdx   = original.indexOf(END_MARKER);

if (startIdx === -1 || endIdx === -1) {
    console.error(`[bake-finances] ERROR: markers not found in ${DATA_JS}`);
    console.error("  Add // AUTO-GENERATED:FINANCES-START and // AUTO-GENERATED:FINANCES-END");
    process.exit(1);
}

let blockStart = startIdx;
while (blockStart > 0 && original[blockStart - 1] !== "\n") blockStart--;

let blockEnd = endIdx + END_MARKER.length;
while (blockEnd < original.length && original[blockEnd] !== "\n") blockEnd++;
if (blockEnd < original.length && original[blockEnd] === "\n") blockEnd++;

const patched = original.slice(0, blockStart) + newBlock + "\n" + original.slice(blockEnd);

fs.writeFileSync(DATA_JS, patched, "utf8");
console.log(`[bake-finances] Wrote ${DATA_JS}`);

// ── Validate ──────────────────────────────────────────────────────────────────
try {
    execSync(`node -e "require('${DATA_JS}')"`, { stdio: "pipe" });
    console.log("[bake-finances] Validation OK: data.js parses without error.");
} catch (err) {
    console.error("[bake-finances] VALIDATION FAILED:");
    console.error(err.stderr?.toString() || err.message);
    process.exit(1);
}
