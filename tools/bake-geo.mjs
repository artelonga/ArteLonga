#!/usr/bin/env node
/* tools/bake-geo.mjs — compila o dataset CC0 ip-location-db (IPv4→país) num
 * binário compacto que o surfaces-server lê com stdlib (busca binária). Princípio:
 * geo é resolvido EMBARCADO (self-hosted, sem chamada externa por request, só país).
 *
 * Fonte: github.com/sapics/ip-location-db — geo-whois-asn-country (licença CC0,
 * domínio público; pode ser commitado em repo público — ao contrário do GeoLite2,
 * que exige license key e proíbe redistribuição). Formato CSV: start,end,CC (inteiros).
 *
 * Saída: yuri/geo/ip4-country.bin
 *   header  : magic 'AG41' (4B) + count uint32 LE (4B)
 *   starts  : count × uint32 LE  (limite inferior de cada faixa, ordenado)
 *   codes   : count × 2 bytes ASCII (país; "\0\0" = desconhecido/gap)
 * Lookup: ip→uint32, acha o maior start <= ip, devolve o país daquela faixa.
 *
 * Uso:  node tools/bake-geo.mjs              (baixa o CSV se não houver cache)
 *       node tools/bake-geo.mjs /tmp/geo4.csv  (usa um CSV local) */
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";

const SRC = "https://raw.githubusercontent.com/sapics/ip-location-db/main/geo-whois-asn-country/geo-whois-asn-country-ipv4-num.csv";
const OUT = path.resolve(process.cwd(), "yuri/geo/ip4-country.bin");
const CACHE = path.join(os.tmpdir(), "geo4.csv");

async function getCsv(arg) {
  if (arg) return fs.readFile(arg, "utf8");
  try { const t = await fs.readFile(CACHE, "utf8"); if (t.length > 1000) { console.log("[geo] cache " + CACHE); return t; } } catch (_) {}
  console.log("[geo] baixando " + SRC);
  const r = await fetch(SRC, { signal: AbortSignal.timeout(60000) });
  if (!r.ok) throw new Error("download " + r.status);
  const t = await r.text();
  await fs.writeFile(CACHE, t).catch(() => {});
  return t;
}

const UNK = "\0\0";

async function main() {
  const csv = await getCsv(process.argv[2]);
  const rows = [];
  for (const line of csv.split("\n")) {
    if (!line) continue;
    const c1 = line.indexOf(","), c2 = line.indexOf(",", c1 + 1);
    if (c1 < 0 || c2 < 0) continue;
    const s = +line.slice(0, c1), e = +line.slice(c1 + 1, c2), cc = line.slice(c2 + 1).trim().toUpperCase();
    if (!Number.isFinite(s) || !Number.isFinite(e) || cc.length !== 2) continue;
    rows.push([s, e, cc]);
  }
  rows.sort((a, b) => a[0] - b[0]);

  // boundaries: empurra um limite só quando o país MUDA (colapsa faixas adjacentes
  // do mesmo país e gaps consecutivos) → binário muito menor.
  const starts = [], codes = [];
  let last = null, prevEnd = -1;
  const push = (at, cc) => { if (cc !== last) { starts.push(at >>> 0); codes.push(cc); last = cc; } };
  for (const [s, e, cc] of rows) {
    if (s > prevEnd + 1) push(prevEnd + 1, UNK);   // gap antes desta faixa → desconhecido
    push(s, cc);
    if (e > prevEnd) prevEnd = e;
  }
  if (starts.length === 0 || starts[0] !== 0) { starts.unshift(0); codes.unshift(UNK); }

  const count = starts.length;
  const buf = Buffer.alloc(8 + count * 4 + count * 2);
  buf.write("AG41", 0, "ascii");
  buf.writeUInt32LE(count, 4);
  let off = 8;
  for (let i = 0; i < count; i++) { buf.writeUInt32LE(starts[i], off); off += 4; }
  for (let i = 0; i < count; i++) { buf.write(codes[i] === UNK ? "\0\0" : codes[i], off, 2, "latin1"); off += 2; }

  await fs.mkdir(path.dirname(OUT), { recursive: true });
  await fs.writeFile(OUT, buf);
  console.log("[geo] faixas-fonte=" + rows.length + " boundaries=" + count +
    " bytes=" + buf.length + " (" + (buf.length / 1048576).toFixed(2) + " MB) → " + OUT);
}
main().catch(e => { console.error("[geo] erro:", e.message); process.exit(1); });
