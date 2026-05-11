/**
 * Bake all servicos/<slug>/service.yaml files into the AUTO-GENERATED
 * serviceCatalog section of assets/data.js.
 *
 * Usage: node tools/bake-services.mjs
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
const ORDER_FILE = path.join(__dirname, "services-order.txt");

const START_MARKER = "// AUTO-GENERATED:SERVICES-START";
const END_MARKER   = "// AUTO-GENERATED:SERVICES-END";

// ── Pre-flight: schema validation ─────────────────────────────────────────────
try {
    execSync("node tools/validate-yaml.mjs --type=service", {
        cwd: root,
        stdio: "inherit",
    });
} catch {
    console.error("[bake-services] ABORT: schema validation failed (see above).");
    process.exit(1);
}

// ── Load order ────────────────────────────────────────────────────────────────
const order = fs.existsSync(ORDER_FILE)
    ? fs.readFileSync(ORDER_FILE, "utf8").trim().split("\n").map(s => s.trim()).filter(Boolean)
    : [];

// ── Collect all service.yaml files ───────────────────────────────────────────
const servDir = path.join(root, "servicos");
const slugs = fs.readdirSync(servDir, { withFileTypes: true })
    .filter(e => e.isDirectory() && fs.existsSync(path.join(servDir, e.name, "service.yaml")))
    .map(e => e.name);

// Sort by order; unknown slugs go to the end alphabetically.
const orderIndex = Object.fromEntries(order.map((s, i) => [s, i]));
slugs.sort((a, b) => {
    const ia = orderIndex[a] ?? order.length;
    const ib = orderIndex[b] ?? order.length;
    if (ia !== ib) return ia - ib;
    return a.localeCompare(b);
});

// ── Load and validate each service ───────────────────────────────────────────
const REQUIRED = ["titulo"];
const services = [];

for (const slug of slugs) {
    const yamlPath = path.join(servDir, slug, "service.yaml");
    const raw = fs.readFileSync(yamlPath, "utf8");
    const service = yaml.load(raw, { schema: yaml.CORE_SCHEMA });

    for (const field of REQUIRED) {
        if (service[field] === undefined || service[field] === null) {
            console.error(`[bake-services] ERROR: servicos/${slug}/service.yaml missing required field "${field}"`);
            process.exit(1);
        }
    }

    services.push(service);
}

console.log(`[bake-services] Loaded ${services.length} services.`);

// ── Serialize to JS ───────────────────────────────────────────────────────────
function serializeEntry(obj) {
    return JSON.stringify(obj, null, 2);
}

const lines = [];
lines.push("    " + START_MARKER);
lines.push("    const serviceCatalog = [");
for (let i = 0; i < services.length; i++) {
    const block = serializeEntry(services[i]);
    const indented = block.split("\n").map(l => "        " + l).join("\n");
    const comma = i < services.length - 1 ? "," : "";
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
    console.error(`[bake-services] ERROR: markers not found in ${DATA_JS}`);
    console.error("  Add // AUTO-GENERATED:SERVICES-START and // AUTO-GENERATED:SERVICES-END");
    process.exit(1);
}

let blockStart = startIdx;
while (blockStart > 0 && original[blockStart - 1] !== "\n") blockStart--;

let blockEnd = endIdx + END_MARKER.length;
while (blockEnd < original.length && original[blockEnd] !== "\n") blockEnd++;
if (blockEnd < original.length && original[blockEnd] === "\n") blockEnd++;

const patched = original.slice(0, blockStart) + newBlock + "\n" + original.slice(blockEnd);

fs.writeFileSync(DATA_JS, patched, "utf8");
console.log(`[bake-services] Wrote ${DATA_JS}`);

// ── Validate ──────────────────────────────────────────────────────────────────
try {
    execSync(`node -e "require('${DATA_JS}')"`, { stdio: "pipe" });
    console.log("[bake-services] Validation OK: data.js parses without error.");
} catch (err) {
    console.error("[bake-services] VALIDATION FAILED:");
    console.error(err.stderr?.toString() || err.message);
    process.exit(1);
}
