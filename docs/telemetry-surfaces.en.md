# Telemetry — universe-owned surfaces & convergence

Companion to [`analytics-api.md`](./analytics-api.md). That one documents the
**co marketing-batch** system (apex `artelonga.com.br` → co, dashboard
`/analytics/`). This one documents the **second system** — **universe-owned**
telemetry of the CNAME surfaces — and the **convergence design** that keeps a
partner's time-based observability continuous when they are promoted from a
path (`/yuri/`) to their own surface (`yuri.artelonga.com.br`).

## Map of the two systems

| | **co marketing-batch** | **universe-owned surface** |
|---|---|---|
| Where it runs | `artelonga.com.br` + paths | CNAME surfaces (`yuri.artelonga.com.br`, `hostinger.…`, `comunicacao.…`) |
| Client | `assets/analytics.js` (rich, GA-like) | `yuri/telemetry.js` (minimal beacon) + `yuri/feedback.js` |
| Ingest | `POST co/api/v1/telemetry/events` | `POST /api/track`, `POST /api/feedback` (same origin) |
| Server | `artelonga/co` (Rust/Axum, SQLite) | `tools/surfaces-server.mjs` (Node stdlib, Fly) |
| Storage | `telemetry_events` (SQL) | NDJSON `/data/telemetry-<universe>.jsonl` (Fly volume) |
| Read | `co/api/v1/analytics/public/{summary,recent}` | `GET /api/telemetry` (aggregates sibling surfaces server-side) |
| Dashboard | `artelonga.com.br/analytics/` | `<surface>/analytics/` (e.g. `yuri.artelonga.com.br/analytics`) |
| Principle | co is the read source | **the universe owns the telemetry; co is a consented broadcast target, never a read source** (`surfaces-server.mjs:28`) |

The universe-owned principle is deliberate: access/interaction do **not** go to
co — only **feedback** (consented on send) is broadcast. See `feedback` below.

---

## 1. Surface endpoints (`tools/surfaces-server.mjs`)

A server for ONE surface per Fly app, parameterized by env (§4). No
dependencies beyond Node's stdlib.

### `POST /api/track` — access + interaction (beacon)

Receives pageview/interaction from the client (`yuri/telemetry.js`, via
`sendBeacon`). Same origin, no CORS. Body ≤ 8 KiB. Response `204 No Content`.

Request body:

```ts
type TrackBody = {
  kind: "pageview" | "interaction",   // default "pageview"
  page?: string,        // location.pathname + search
  referrer?: string | null,
  session?: string,     // al.sid — sessionStorage, PER TAB (see continuity §5)
  action?: string | null,    // ex. "click"
  target?: string | null,    // clicked href (≤ 200 chars)
  outbound?: boolean,        // left the current host
  lang?: string | null,
  vw?: number | null,        // viewport width
  t?: string                 // ISO timestamp (client); server uses it if present
}
```

Persisted as one NDJSON line (`teleSave`):

```ts
type TrackEvent = {
  t: string,                 // ISO
  universe: string,          // = FEEDBACK_UNIVERSE
  kind: "pageview" | "interaction",
  page, referrer, session, action, target, outbound, lang, vw
  // PLANEJADO (Option C, §3): country  ← resolvido server-side no ingest
}
```

### `POST /api/feedback` — consented feedback (broadcast to co)

Receives the "Talk to Us" modal (`yuri/feedback.js`). Body ≤ 16 KiB. Logs to
stdout (→ `fly logs`), persists to the universe's NDJSON **and** forwards to co.

Request body:

```ts
type FeedbackBody = {
  message: string,
  sentiment?: -1 | 0 | 1,    // 👎 / • / 👍
  entry_path?: string,       // or page
  kind?: string,             // default "feedback"
  name?: string,
  email?: string,            // or contact
}
```

Broadcast to co: `POST $CO_FEEDBACK` (default
`https://co.artelonga.com.br/api/v1/feedback`) with
`{ universe, kind, message, entry_path, name, email }`. The status lives in the
event (`broadcast.co ∈ {ok, failed, pending}`, `broadcast.status` = HTTP).
**Co is only a broadcast target** — the local NDJSON is the source of truth.
Response: `200 {ok, broadcast}`.

### `GET /api/telemetry` — aggregated read (universe state)

Aggregates the local NDJSON + the **sibling surfaces** (`$SIBLINGS`,
server-side, no CORS). `?local=1` = only this surface (used in aggregation to
avoid recursion). Cache: none (computed on-read over `TELE_MEM`). Real shape
(verified):

```ts
type TelemetryResponse = {
  universe: string,
  surface: string,           // ex. "/yuri/"
  source: "universe-state",
  durable: boolean,          // true só com volume montado (TELEMETRY_DURABLE=1)
  co: { endpoint, role: "broadcast-target", read: false, verify: string },
  total: number,             // total de eventos
  access: {
    pageviews: number,
    sessions: number,        // unique session (por-aba; ver §5)
    visitors: number,        // unique vid
    returning: number,       // vid visto em >1 dia
    topPages: Array<{ n: number, page: string }>,     // top 12
    referrers: Array<{ n: number, ref: string }>      // top 8, externos (refDomain)
  },
  acquisition: Array<{ n: number, source: string }>,  // utm_source → referrer → "(direto)", top 10
  devices: Array<{ n: number, device: string }>,      // mobile/tablet/desktop por viewport
  timeseries: Array<{ bucket: string, count: number }>,  // pageviews/dia
  retention: { visitors, returning, bounceRate, dwellAvgMs, ... },
  geo: Array<{ n: number, country: string }>,         // país (v4+v6), top 12
  cities: Array<{ n: number, city: string }>,         // "cidade, país" (IPv4 · DB-IP), top 12
  conversions: { total: number, top: Array<{ n: number, goal: string }> },
  interactions: {
    total: number,
    outbound: number,
    topTargets: Array<{ n: number, target: string }>  // top 10
  },
  feedback: {
    total: number,
    bySentiment: { up: number, neutral: number, down: number },
    broadcast: { ok: number, failed: number, pending: number },
    recent: Array<{ t, page, sentiment, message, broadcast, surface }>  // últimos 20
  },
  recent: Array<{ t, kind, page, action, target, outbound, message, surface }>, // últimos 25
  surfaces: Array<{ surface, url, ok, total, durable, self? }>   // esta + irmãs
}
```

### `GET /api/health`

`200 {"ok":true,"surface":"/yuri/","mode":"static"}`.

### Non-telemetry

`/analytics` → serves `<surface>/analytics/index.html`. `MODE=iframe` →
loads `REDIRECT_URL` in an iframe + loads feedback. `MODE=redirect` → 302.
Everything else = static file (cache `max-age=60`).

---

## 2. Embedded geo (`yuri/geo/*.bin`)

Geo is resolved **embedded, self-hosted, with no external call per request** —
a conscious choice vs. GeoLite2 (license key + prohibits redistribution).
Country via
[`sapics/ip-location-db`](https://github.com/sapics/ip-location-db)
`geo-whois-asn-country` (**CC0**); city via DB-IP City Lite (**CC-BY**, §below).

> **Geo is runtime DATA, not content+form.** The binaries **are not committed**
> nor served by GH Pages — they are **downloaded + compiled in the image build**
> (`Dockerfile` → `RUN bake-geo`), and excluded from git (`.gitignore`) and from
> the build-context (`.dockerignore yuri/geo/*.bin`). This keeps the content
> repo clean and makes the deploy reproducible regardless of local state.
>
> **Local dev:** run `node tools/bake-geo.mjs` (country) and `node
> tools/bake-geo.mjs --city` (city) once to populate `yuri/geo/` in your clone;
> without it the server boots without geo (degrades to `null`, no crash).

Compiled by `tools/bake-geo.mjs` (downloads the CSVs → compact binaries).
Country in **IPv4 and IPv6**, two files:

```
ip4-country.bin  AG41: magic(4) + count(u32 LE) + starts[count×u32 LE]  + codes[count×2B]
ip6-country.bin  AG61: magic(4) + count(u32 LE) + starts[count×16B BE]  + codes[count×2B]
codes = país ASCII 2B ("\0\0" = desconhecido/gap)
```

Adjacent ranges of the same country are merged (push-on-change). v4: 334k ranges
→ 341k boundaries, **1.95 MB**; v6: 214k ranges → 273k boundaries, **4.69 MB**.
Lookup (`geoCountry`) dispatches by family: IPv4 (or `::ffff:a.b.c.d`) → binary
search by `uint32`; IPv6 → parse to 16 bytes big-endian + binary search by
`Buffer.compare`. Private/loopback/unknown → `null`.

**City (optional, IPv4):** `ip4-city.bin` (format `AGC4` — starts `u32` +
index `u32` into a deduplicated `country|region|city` table). Source: **DB-IP
City Lite**, license **CC-BY-4.0** → requires visible attribution ("IP
Geolocation by DB-IP", present in the dashboard). It is large (~31 MB, and the
IPv6 set is ~98 MB gz), so it is **not committed**: the `Dockerfile` downloads +
compiles it during the build (`bake-geo.mjs --city`), inside the image, outside
git and the build context. If missing, the surface falls back to country geo.
**IPv6 resolves at country level** (no city v6).

Regenerate: `node tools/bake-geo.mjs` (or pass a CSV: `… /tmp/geo4.csv`).
The `.bin` enters the image via `COPY yuri` (Dockerfile) — the reader is
**inline** in `surfaces-server.mjs` (the Dockerfile only copies that `.mjs` +
`yuri/`).

> **Privacy:** the country is derived at ingest from `Fly-Client-IP` and only
> the country is stored — the raw IP is **never** persisted nor leaves the
> surface.

---

## 3. Convergence — partner upgrade & continuous time-based observability

**Problem:** when a partner is promoted from a path (`/yuri/`, telemetry in co:
timeseries/geo/retention) to a CNAME surface (`yuri.artelonga.com.br`, NDJSON:
counts only), they (a) **lose** the time chart, geo, retention and (b) suffer a
**discontinuity** in the series (history in co, new data in the NDJSON). The
upgrade should be a strict improvement — today it is a regression.

**Chosen design — Option C: edge owns the raw + co warehouse of consented
rollups (no PII).**

```
visitante → surface
  ├─ NDJSON raw ............ fonte da verdade, universe-owned, nunca sai
  │                          (geo resolvido aqui → só país, IP descartado)
  ├─ /analytics ............ dash local fino (lê raw)
  └─ rollup diário ......... {universe, day, views, visitors, sessions,
                              dwell, geo[], goals[]} — consentido, só contagens,
                              zero PII ──▶ co warehouse
co warehouse (série diária por universe)
  ├─ histórico pré-upgrade (rollup único dos eventos /yuri raw do co)
  └─ rollups pós-upgrade (append)  ──▶ UMA série contínua, keyed by universe
dashboard rede: /analytics?universe=yuri ──lê──▶ co warehouse
```

Why C: it honors the universe-owned principle (raw stays at the edge; only
consented aggregate with no PII goes to co — same model as feedback); the series
is continuous across the upgrade (same key `universe`); it survives machine
sleep (rollup on cold-start + external cron, not a resident timer — surfaces
have `min_machines_running=0`); PII stays at the edge (only the country
histogram leaves).

**Rollup schema (planned):**

```ts
type DailyRollup = {
  universe: string,          // "yuri" — estável path↔CNAME
  day: string,               // YYYY-MM-DD (UTC)
  views: number, visitors: number, sessions: number,
  bounce: number,            // sessões com 1 pageview e 0 interação / total
  dwell_avg_ms: number,
  geo: Array<{ country: string, n: number }>,
  goals: Array<{ name: string, n: number }>   // conversões
}
// POST consentido → co warehouse, keyed by (universe, day). Idempotente (upsert).
```

**Upgrade runbook (once per promotion):**

1. **Freeze** — mark the cutoff timestamp `T`.
2. **Backfill** — export the partner's pre-`T` events from co
   (`GET /api/v1/admin/telemetry/export`, filtered to `/<handle>/*`), roll them
   into a daily series under `universe=<handle>`.
3. **Identity bridge** — the surface adopts `al_vid` (apex cookie
   `.artelonga.com.br`) in place of the per-tab `al.sid`, so retention carries
   across.
4. **Cutover** — the surface starts emitting rollups for `≥ T`; `/<handle>/*`
   rows in the network dash are redirected/annotated to the surface.
5. **Verify** — query the warehouse series across `T`: no gap, no double count.

**Discarded alternatives:** (A) forward all raw to co + `?universe` — violates
the principle and re-centralizes PII; (B) surface 100% self-owned with no co —
pure, but each surface re-implements the analytics brain and there is no
long-horizon warehouse surviving sleep. C = continuity of A + ownership of B.

### Surface parity (substrate of Option C) — status

| Capability | co | surface | status |
|---|---|---|---|
| daily timeseries | ✅ | ✅ | `teleAgg` aggregates `TrackEvent.t` by day |
| geo | ✅ country+city | ✅ country (v4+v6) + city (IPv4) | embedded binaries; city via DB-IP in the image; v6 city = delta |
| retention (new/returning) | ✅ | ✅ | persistent `al_vid` (apex cookie) |
| dwell / engagement | ✅ | ✅ | `page_end` with `active_ms` |
| bounce | ~ | ✅ | session ≤1 pageview and 0 interaction |
| conversion (goals) | ✅ | ✅ | built-in rules + `[data-goal]` |
| acquisition (utm/source) | ✅ | ✅ | `utm` first-touch → referrer → "(direct)" |
| device | ✅ | ✅ | category by viewport (mobile/tablet/desktop) |

---

## 7. Parity with Google Analytics (GA4)

Goal: telemetry that delivers **as much and as granular as GA** — no
third-party cookies, no cross-site, self-hosted, exportable raw. Where "surface"
appears, it is the current state of `yuri.artelonga.com.br`.

| GA4 | apex (co) | surface | note |
|---|---|---|---|
| Pageviews | ✅ | ✅ | |
| Sessions | ✅ | ✅ | per-tab (`al.sid`) |
| Unique users | ✅ | ✅ | `al_vid` |
| New vs. returning | ✅ | ✅ | vid on >1 day |
| Engagement time | ✅ | ✅ | `page_end active_ms` / dwell |
| Bounce/engagement rate | ~ | ✅ | bounce |
| Events (custom) | ✅ | ✅ | pageview/interaction/page_end/goal |
| Conversions (key events) | ✅ | ✅ | goals |
| Acquisition (source/medium/campaign) | ✅ | ✅ | UTM first-touch + referrer |
| Referrals | ✅ | ✅ | |
| Geo country | ✅ | ✅ | v4+v6 embedded |
| Geo region/city | ✅ city | ✅ city (IPv4) / country (IPv6) | DB-IP City Lite (CC-BY) compiled in the image; **delta** = city IPv6 |
| Device (category) | ~ | ✅ | viewport → mobile/tablet/desktop |
| Browser / OS | ~ `ua_brand` | ⛔ | **delta** — requires User-Agent parsing |
| Viewport / resolution | ✅ | ✅ | `vw` |
| Language | ✅ | ✅ | `lang` |
| Landing page | ✅ | ~ derivable | 1st pageview of the session |
| Scroll depth | ✅ | ⛔ | **delta** — 25/50/75/100% listener on the client |
| Outbound clicks | ✅ | ✅ | |
| Real time | ✅ | ✅ | `recent` |
| Funnel / path | ~ | ~ goals | **delta** — multi-step funnel |
| Cohort / retention curve | ~ | ~ new/returning | **delta** — cohort curve |
| **Demographics (age/gender/interests)** | ⛔ | ⛔ | **deliberate** — GA depends on Google Signals (cross-site, sells identity); violates the privacy principle. We don't do it. |
| **Audiences / cross-site segments** | ⛔ | ⛔ | **deliberate** — same |
| Raw export (BigQuery-like) | ~ admin export | ✅ | NDJSON is the source of truth, exportable |

**Conclusion:** in the **privacy-respecting core**, the surface is **on par with
or above** GA (self-hosted, no third parties, exportable raw, geo v4+v6). The GA
pillars we do **not** cover are the **surveillance** ones (demographics via
Google Signals, cross-site audiences) — omitted on principle, not by limitation.

**Granularity deltas still open** (none require compromising privacy, all
incremental): **city IPv6** (~98 MB gz set), browser/OS (UA parse), scroll
depth, multi-step funnel and cohort curve. Prioritize on demand.

---

## 4. Config (env per app — `deploy/surfaces/*.toml`)

| Env | Default | What it does |
|---|---|---|
| `SURFACE` | `/yuri/` | surface path served at the root `/` |
| `FEEDBACK_UNIVERSE` | `yuri` | universe (telemetry key + feedback routing) |
| `TELEMETRY_DIR` | `/data` | where the `.jsonl` is written |
| `TELEMETRY_DURABLE` | `` (off) | `1` = persist to the volume; otherwise in-memory/ephemeral |
| `SIBLINGS` | `` | URLs of sibling surfaces of the same universe (aggregation) |
| `CO_FEEDBACK` | `co…/api/v1/feedback` | feedback broadcast target |
| `MODE` | `static` | `static` / `iframe` / `redirect` |
| `GEO_DB` (planned) | `yuri/geo/ip4-country.bin` | geo binary (§2) |

Auto-stop surfaces (`min_machines_running=0`): collection continues (the machine
auto-starts on request, the durable NDJSON persists), but **there is no resident
rollup** — that is why the rollup runs on-cold-start + external cron (§3).

---

## 5. Identity continuity (critical for the upgrade)

| | apex (`analytics.js`) | surface (`telemetry.js`) |
|---|---|---|
| visitor id | `al_vid` — localStorage **+ cookie `.artelonga.com.br`**, 2 years | — (none) |
| session id | `al_sid` — sessionStorage per tab | `al.sid` — sessionStorage per tab |

The apex's `al_vid` is a cookie on the **registrable domain**
`.artelonga.com.br`, so it **survives** the move to the subdomain
`yuri.artelonga.com.br` — *if* the surface adopts `al_vid` instead of the
per-tab `al.sid`. Today the surface only has a per-tab session → `sessions`
overcounts and there is no concept of a returning visitor. Closing this is step
3 of the runbook (§3).

---

## 6. Privacy (both systems)

- No third-party cookies, no fingerprinting, no ads. Respects
  `navigator.doNotTrack` and (on the apex) `navigator.webdriver` + opt-out
  (`localStorage.al_optout="1"` + apex cookie).
- Surface: the beacon respects DNT (`telemetry.js:8`). No PII in `/api/track`.
- Geo: country derived from the IP **at the edge**; the raw IP is never
  persisted (apex: hash with a server-side salt; surface: discarded after
  lookup).
- Only **feedback** (consented) and **aggregated rollups with no PII** leave the
  surface for co. Raw access/interaction stay universe-owned.
- Recommended retention: ≤ 90 days raw, aggregated (daily rollup) afterward.
