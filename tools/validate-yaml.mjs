#!/usr/bin/env node
/**
 * validate-yaml — valida cada `<handle>/profile.yaml` e
 * `<handle>/community.yaml` contra os schemas em
 * `openapi/artelonga.yaml#/components/schemas/{Person,Community}`.
 *
 * Pega bugs de shape ANTES do bake (fields desconhecidos, types
 * errados, required missing) — em vez de só descobrir no runtime
 * quando o renderer crasha.
 *
 * Uso:
 *   node tools/validate-yaml.mjs           # valida tudo
 *   node tools/validate-yaml.mjs yuri      # valida só yuri
 *   npm run validate-yaml
 *
 * Wired no bake — bake roda validate primeiro, falha early se gap.
 *
 * Exit 0 = OK. Exit 1 = validation errors (listed). Exit 2 = setup error.
 */

import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import yaml from "js-yaml";
import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SPEC_PATH = path.join(ROOT, "openapi/artelonga.yaml");

// Load spec
let spec;
try {
    spec = yaml.load(fs.readFileSync(SPEC_PATH, "utf8"));
} catch (e) {
    console.error(`[validate-yaml] FAIL: cannot load ${SPEC_PATH}`);
    console.error(e.message);
    process.exit(2);
}

// Setup ajv with the spec's schemas
const ajv = new Ajv.default({
    strict: false,        // OpenAPI uses some non-strict keywords (nullable, examples)
    allErrors: true,      // collect all errors, not just first
    verbose: true,
});
addFormats.default(ajv);

// Register all schemas with their $ref paths
for (const [name, schema] of Object.entries(spec.components.schemas)) {
    ajv.addSchema(schema, `#/components/schemas/${name}`);
}

const validatePerson = ajv.compile({ $ref: "#/components/schemas/Person" });
const validateCommunity = ajv.compile({ $ref: "#/components/schemas/Community" });

// Walk the repo, find <handle>/profile.yaml + <handle>/community.yaml
// CLI args:
//   --type=people     valida só profile.yaml
//   --type=community  valida só community.yaml
//   <handle>          valida só esse handle (filtro adicional)
const args = process.argv.slice(2);
const typeArg = args.find(a => a.startsWith("--type="));
const typeFilter = typeArg ? typeArg.slice("--type=".length) : "all";
const onlyHandle = args.find(a => !a.startsWith("--"));
const errors = [];
let validated = 0;

for (const entry of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (onlyHandle && entry.name !== onlyHandle) continue;

    const handle = entry.name;
    const profilePath = path.join(ROOT, handle, "profile.yaml");
    const communityPath = path.join(ROOT, handle, "community.yaml");

    if ((typeFilter === "all" || typeFilter === "people") && fs.existsSync(profilePath)) {
        const data = yaml.load(fs.readFileSync(profilePath, "utf8"));
        if (!validatePerson(data)) {
            errors.push({
                file: `${handle}/profile.yaml`,
                schema: "Person",
                errors: validatePerson.errors,
            });
        }
        validated++;
    }

    if ((typeFilter === "all" || typeFilter === "community") && fs.existsSync(communityPath)) {
        const data = yaml.load(fs.readFileSync(communityPath, "utf8"));
        if (!validateCommunity(data)) {
            errors.push({
                file: `${handle}/community.yaml`,
                schema: "Community",
                errors: validateCommunity.errors,
            });
        }
        validated++;
    }
}

// Report
if (errors.length === 0) {
    console.log(`[validate-yaml] OK — ${validated} arquivo${validated === 1 ? "" : "s"} validado${validated === 1 ? "" : "s"} contra openapi/artelonga.yaml schemas.`);
    process.exit(0);
}

console.error(`[validate-yaml] FAIL — ${errors.length} arquivo${errors.length === 1 ? "" : "s"} com erro:\n`);
for (const e of errors) {
    console.error(`  ❌ ${e.file} (schema: ${e.schema})`);
    for (const err of e.errors) {
        const loc = err.instancePath || "(root)";
        console.error(`     • ${loc} ${err.message}`);
        if (err.params && Object.keys(err.params).length) {
            console.error(`       params: ${JSON.stringify(err.params)}`);
        }
    }
    console.error("");
}
console.error(`Schema em openapi/artelonga.yaml#/components/schemas/{Person,Community}.`);
process.exit(1);
