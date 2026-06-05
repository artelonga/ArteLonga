#!/usr/bin/env node
/* tools/bake-geo.mjs — compila o dataset CC0 ip-location-db (IP→país) em binários
 * compactos que o surfaces-server lê com stdlib (busca binária). Princípio: geo é
 * resolvido EMBARCADO (self-hosted, sem chamada externa por request, só país).
 *
 * Fonte: github.com/sapics/ip-location-db — geo-whois-asn-country (licença CC0,
 * domínio público; commitável em repo público — ao contrário do GeoLite2, que
 * exige license key e proíbe redistribuição).
 *
 * Saídas (em yuri/geo/):
 *   ip4-country.bin  AG41: magic(4) + count(u32 LE) + starts[count×u32 LE] + codes[count×2B]
 *   ip6-country.bin  AG61: magic(4) + count(u32 LE) + starts[count×16B BE]  + codes[count×2B]
 * codes = país ASCII 2B ("\0\0" = desconhecido/gap). Faixas adjacentes do mesmo
 * país são coladas (push-on-change). Lookup: acha o maior start <= ip → país.
 *
 * Uso:  node tools/bake-geo.mjs                 (baixa os CSVs se não houver cache)
 *       node tools/bake-geo.mjs /tmp/geo4.csv /tmp/geo6.csv */
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";

const BASE = "https://raw.githubusercontent.com/sapics/ip-location-db/main/geo-whois-asn-country/";
const SRC4 = BASE + "geo-whois-asn-country-ipv4-num.csv";
const SRC6 = BASE + "geo-whois-asn-country-ipv6.csv";
const OUT4 = path.resolve(process.cwd(), "yuri/geo/ip4-country.bin");
const OUT6 = path.resolve(process.cwd(), "yuri/geo/ip6-country.bin");
const UNK = "\0\0";

async function getCsv(url, cacheName, arg) {
  if (arg) return fs.readFile(arg, "utf8");
  const cache = path.join(os.tmpdir(), cacheName);
  try { const t = await fs.readFile(cache, "utf8"); if (t.length > 1000) { console.log("[geo] cache " + cache); return t; } } catch (_) {}
  console.log("[geo] baixando " + url);
  const r = await fetch(url, { signal: AbortSignal.timeout(90000) });
  if (!r.ok) throw new Error("download " + r.status);
  const t = await r.text();
  await fs.writeFile(cache, t).catch(() => {});
  return t;
}

// IPv6 string → Buffer de 16 bytes big-endian (ou null). Trata "::", IPv4 embutido.
function ip6Bytes(s) {
  s = String(s).trim().split("%")[0];
  if (s.indexOf(":") < 0) return null;
  if (s.indexOf(".") >= 0) {                              // IPv4 embutido no último grupo
    const li = s.lastIndexOf(":"), tail = s.slice(li + 1);
    const m = tail.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (!m) return null;
    const b = m.slice(1).map(Number);
    if (b.some(x => x > 255)) return null;
    s = s.slice(0, li + 1) + ((b[0] << 8) | b[1]).toString(16) + ":" + ((b[2] << 8) | b[3]).toString(16);
  }
  const parts = s.split("::");
  if (parts.length > 2) return null;
  const head = parts[0] ? parts[0].split(":") : [];
  const tail = parts.length === 2 ? (parts[1] ? parts[1].split(":") : []) : null;
  let hextets;
  if (tail === null) { hextets = head; if (hextets.length !== 8) return null; }
  else { const fill = 8 - head.length - tail.length; if (fill < 0) return null; hextets = head.concat(Array(fill).fill("0")).concat(tail); }
  if (hextets.length !== 8) return null;
  const buf = Buffer.alloc(16);
  for (let i = 0; i < 8; i++) {
    if (!/^[0-9a-fA-F]{1,4}$/.test(hextets[i])) return null;
    const v = parseInt(hextets[i], 16);
    buf[i * 2] = (v >> 8) & 0xff; buf[i * 2 + 1] = v & 0xff;
  }
  return buf;
}
function inc16(b) { const o = Buffer.from(b); for (let i = 15; i >= 0; i--) { if (o[i] === 255) o[i] = 0; else { o[i]++; break; } } return o; }

function buildV4(csv) {
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
  const starts = [], codes = []; let last = null, prevEnd = -1;
  const push = (at, cc) => { if (cc !== last) { starts.push(at >>> 0); codes.push(cc); last = cc; } };
  for (const [s, e, cc] of rows) {
    if (s > prevEnd + 1) push(prevEnd + 1, UNK);
    push(s, cc);
    if (e > prevEnd) prevEnd = e;
  }
  if (starts.length === 0 || starts[0] !== 0) { starts.unshift(0); codes.unshift(UNK); }
  const count = starts.length, buf = Buffer.alloc(8 + count * 4 + count * 2);
  buf.write("AG41", 0, "ascii"); buf.writeUInt32LE(count, 4);
  let off = 8;
  for (let i = 0; i < count; i++) { buf.writeUInt32LE(starts[i], off); off += 4; }
  for (let i = 0; i < count; i++) { buf.write(codes[i] === UNK ? "\0\0" : codes[i], off, 2, "latin1"); off += 2; }
  return { buf, rows: rows.length, count };
}

function buildV6(csv) {
  const rows = [];
  for (const line of csv.split("\n")) {
    if (!line) continue;
    const c1 = line.indexOf(","), c2 = line.indexOf(",", c1 + 1);
    if (c1 < 0 || c2 < 0) continue;
    const s = ip6Bytes(line.slice(0, c1)), e = ip6Bytes(line.slice(c1 + 1, c2)), cc = line.slice(c2 + 1).trim().toUpperCase();
    if (!s || !e || cc.length !== 2) continue;
    rows.push([s, e, cc]);
  }
  rows.sort((a, b) => Buffer.compare(a[0], b[0]));
  const ZERO = Buffer.alloc(16);
  const starts = [], codes = []; let last = null, prevEnd = null;
  const push = (buf, cc) => { if (cc !== last) { starts.push(buf); codes.push(cc); last = cc; } };
  for (const [s, e, cc] of rows) {
    if (prevEnd !== null) { const gap = inc16(prevEnd); if (Buffer.compare(s, gap) > 0) push(gap, UNK); }
    push(s, cc);
    if (prevEnd === null || Buffer.compare(e, prevEnd) > 0) prevEnd = e;
  }
  if (starts.length === 0 || Buffer.compare(starts[0], ZERO) !== 0) { starts.unshift(ZERO); codes.unshift(UNK); }
  const count = starts.length, buf = Buffer.alloc(8 + count * 16 + count * 2);
  buf.write("AG61", 0, "ascii"); buf.writeUInt32LE(count, 4);
  let off = 8;
  for (let i = 0; i < count; i++) { starts[i].copy(buf, off); off += 16; }
  for (let i = 0; i < count; i++) { buf.write(codes[i] === UNK ? "\0\0" : codes[i], off, 2, "latin1"); off += 2; }
  return { buf, rows: rows.length, count };
}

async function main() {
  const csv4 = await getCsv(SRC4, "geo4.csv", process.argv[2]);
  const csv6 = await getCsv(SRC6, "geo6.csv", process.argv[3]);
  await fs.mkdir(path.dirname(OUT4), { recursive: true });
  const v4 = buildV4(csv4); await fs.writeFile(OUT4, v4.buf);
  const v6 = buildV6(csv6); await fs.writeFile(OUT6, v6.buf);
  const mb = n => (n / 1048576).toFixed(2) + " MB";
  console.log("[geo] v4: faixas=" + v4.rows + " boundaries=" + v4.count + " " + mb(v4.buf.length) + " → " + OUT4);
  console.log("[geo] v6: faixas=" + v6.rows + " boundaries=" + v6.count + " " + mb(v6.buf.length) + " → " + OUT6);
}
main().catch(e => { console.error("[geo] erro:", e.message); process.exit(1); });
