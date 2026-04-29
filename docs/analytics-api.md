# Analytics API — wire contract

Spec for the `POST /events` endpoint that the static site (this repo) talks to.
The endpoint lives in **`artelonga/co`** (Rust/Axum). Until it's deployed, events
queue locally in the visitor's `localStorage` (cap 1000) and ship retroactively
once the endpoint is set in `assets/analytics.js` (`ENDPOINT`).

This file is the source of truth for the schema and HTTP contract. Bump
`SCHEMA_VERSION` in both this doc and `analytics.js` together.

---

## 1. Endpoints

### `POST /events` — public ingest

CORS: allow origins `https://artelonga.com.br` and `https://co.artelonga.com.br`
(plus dev origins). No credentials. Body limit: 64 KiB. Rate limit: per IP, e.g.
60 req/min (sliding window).

Request body:

```json
{
  "schema": 1,
  "batch": [ { Event }, { Event }, ... ]
}
```

Response: `204 No Content` on success, `400` on malformed payload, `413` on body
too large, `429` on rate limit. The client retries with exponential backoff on
5xx and network errors; non-2xx 4xx (validation) drops the batch.

### `GET /api/v1/admin/analytics/...` — auth-protected

Read endpoints for the dashboard. Require admin auth (cookie or token, same as
the rest of `co`'s admin surface). Suggested first endpoints:

| Path                                                 | Returns                                  |
| ---                                                  | ---                                      |
| `/sessions/recent?limit=100`                         | latest N sessions, with first/last event |
| `/funnel?steps=page_view,click_section,click_email`  | per-step counts and drop-off             |
| `/experiments/:id/results`                           | exposures + conversions per variant      |
| `/timeseries?event=page_view&bucket=hour&days=7`     | event counts over time                   |

---

## 2. Event shape (schema 1)

```ts
type Event = {
  s: 1,                        // schema version
  site: "artelonga" | "co",    // surface that emitted the event; same vid may appear under multiple sites
  name: string,                // event name, ≤ 64 chars (see taxonomy below)
  sid: string,                 // session ID (UUID, per tab session)
  vid: string,                 // visitor ID (UUID, persists in localStorage)
  ts: number,                  // event timestamp, epoch ms (client clock — backend records its own received_at too)
  tz?: string | null,          // IANA timezone, e.g. "America/Sao_Paulo"
  path: string,                // normalized pathname, e.g. "/yuri/" (trailing slash, no /index.html)
  query?: string | null,       // raw location.search, including leading "?"
  ref?: string | null,         // document.referrer
  vw: number, vh: number,      // viewport in CSS pixels
  lang?: string | null,        // navigator.language
  ua_brand?: string | null,    // userAgentData.brands joined by ","; null on Safari/Firefox
  utm?: {                      // first-touch UTM for the session (null if no UTM ever seen)
    source?: string, medium?: string, campaign?: string, term?: string, content?: string
  } | null,
  experiments?: {              // active variants for this visitor (snapshotted at event time)
    [expId: string]: string    // expId → variantId
  } | null,
  props?: object               // event-specific payload, see taxonomy
}
```

The backend should store all required fields as columns and `experiments`/`props`
as JSON. Add a server-side `received_at` column (epoch ms) and compute `ip_hash`
as `SHA-256(salt || client_ip)` where `salt` is a long-lived secret in env.

---

## 3. Event taxonomy

| name                    | when                                          | props                                                                  |
| ---                     | ---                                           | ---                                                                    |
| `page_view`             | once on page load                             | `{ title }`                                                            |
| `page_end`              | first visibility:hidden or pagehide           | `{ active_ms, total_ms }` — `active_ms` excludes backgrounded time     |
| `scroll_depth`          | when crossing 25 / 50 / 75 / 100% of page     | `{ pct }`                                                              |
| `click_section`         | click on `/parceiros/`, `/servicos/`, etc.    | `{ section, href }`                                                    |
| `click_profile`         | click on `/<handle>/`                         | `{ handle }`                                                           |
| `click_email`           | `mailto:` click                               | `{ href }`                                                             |
| `click_tel`             | `tel:` click                                  | `{ href }`                                                             |
| `click_whatsapp`        | wa.me / api.whatsapp.com click                | `{ href }`                                                             |
| `click_pdf`             | `.pdf` link click                             | `{ href }`                                                             |
| `click_app`             | click on a different `*.artelonga.com.br` host (same product, other surface) | `{ app, href }` — `app` is the subdomain (`co`, `co-dev`, …), or `main` for apex |
| `click_outbound`        | external `https?://...` click (different host, not in-network)    | `{ href }`                                         |
| `click_cta`             | `<button>` / `.see-more` / `.ver-servicos-btn` | `{ kind, label }`                                                     |
| `experiment_exposure`   | first time a variant is read in the session   | `{ exp, variant }`                                                     |
| `modal_em_breve`        | "em breve" modal opens (e.g., wiki-link)      | `{ title }`                                                            |
| `js_error`              | window error event (capped 20 / page)         | `{ message, source, line, col, stack }`                                |
| `js_promise_rejection`  | unhandledrejection (capped 20 / page)         | `{ reason }`                                                           |

Any future event name is fine — the backend stores it as-is. Reserve the prefix
`_` for system events (none yet).

---

## 4. Privacy

- **One first-party cookie, scoped to `.artelonga.com.br`.** Carries the same
  `al_vid` that lives in localStorage so identity threads across
  `artelonga.com.br` and `co.artelonga.com.br`. `SameSite=Lax`, `Secure`,
  `Max-Age=2y`. Not sent to any third party (no cross-site tracking, no ads,
  no fingerprinting). Outside the apex domain (e.g. localhost) the cookie is
  not set and the client falls back to localStorage-only.
- **Visitor opt-out**: the client sets `localStorage.al_optout = "1"` *and*
  the cookie `al_optout=1` on the apex domain so opt-out propagates across
  subdomains. Backend never sees these clients.
- **DNT**: `navigator.doNotTrack === "1"` short-circuits the client.
- **Webdriver**: `navigator.webdriver` short-circuits (Lighthouse, Cypress, etc.).
- **IP**: hashed with secret salt server-side; raw IP never persisted.
- **Retention**: recommend ≤ 90 days raw; aggregate older data (counts per
  `(name, path, day)`) and drop the row-level table beyond that.

### Cross-subdomain identity

Because both surfaces share the registrable domain `artelonga.com.br`, a single
`vid` carries through marketing → app. On every page load the client:

1. Reads the `al_vid` cookie from `.artelonga.com.br` first.
2. If absent, reads `localStorage.al_vid`.
3. If both absent, mints a UUID.
4. Writes the resulting `vid` to **both** localStorage and the cookie, so the
   first visit to any subdomain seeds the other.

This means the *first* same-day visit to either subdomain after rollout will
appear as a "new" visitor; subsequent cross-subdomain hops unify on the same
`vid`. Visits before rollout cannot be retroactively unified — the backend can
optionally join old per-origin `vid`s heuristically via `(ip_hash, ua_brand)`
proximity if needed for one-off analyses.

---

## 5. A/B framework

Experiments are declared in `assets/analytics.js` under `EXPERIMENTS`. Each
experiment has variants with weights. Assignment is deterministic:

```
variant_id = variants[ FNV-1a(vid + ":" + expId) % sum(weights) ]
```

The same `vid` always gets the same variant for the same experiment, across
sessions. Different experiments are independent (different seed).

Backend correlation: every event after exposure carries `experiments` map.
To compute results for experiment `X`:

```sql
-- conversions per variant
SELECT json_extract(experiments, '$.X')           AS variant,
       COUNT(DISTINCT vid) FILTER (WHERE name = 'click_email') AS conversions,
       COUNT(DISTINCT vid)                                     AS exposed
FROM events
WHERE json_extract(experiments, '$.X') IS NOT NULL
  AND ts BETWEEN ? AND ?
GROUP BY variant;
```

(Use `experiment_exposure` events for the denominator if you want
"reached the experiment" rather than "saw any event after exposure".)

---

## 6. SQLite schema (suggested)

```sql
CREATE TABLE events (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  received_at  INTEGER NOT NULL,
  ts           INTEGER NOT NULL,
  schema       INTEGER NOT NULL,
  site         TEXT    NOT NULL,
  name         TEXT    NOT NULL,
  sid          TEXT    NOT NULL,
  vid          TEXT    NOT NULL,
  ip_hash      TEXT    NOT NULL,
  country      TEXT,
  path         TEXT    NOT NULL,
  query        TEXT,
  ref          TEXT,
  vw           INTEGER,
  vh           INTEGER,
  lang         TEXT,
  tz           TEXT,
  ua_brand     TEXT,
  utm_source   TEXT, utm_medium TEXT, utm_campaign TEXT, utm_term TEXT, utm_content TEXT,
  experiments  TEXT,                     -- JSON, NULL if none
  props        TEXT NOT NULL DEFAULT '{}'
);
CREATE INDEX events_ts          ON events(ts);
CREATE INDEX events_received_at ON events(received_at);
CREATE INDEX events_sid         ON events(sid);
CREATE INDEX events_vid         ON events(vid);
CREATE INDEX events_name_ts     ON events(name, ts);
CREATE INDEX events_path_ts     ON events(path, ts);
```

---

## 7. Switching it on

1. In `co`: implement `POST /events` per this spec, deploy, verify with
   `curl -X POST $URL/events -d '{"schema":1,"batch":[{...}]}' -H 'content-type: application/json'`.
2. In this repo: set `ENDPOINT` in `assets/analytics.js` to the production URL,
   bump cache-buster on every HTML page (`?v=YYYYMMDD` for `analytics.js`),
   commit, deploy.
3. Verify in prod: open the site, then in devtools console run
   `AL_analytics.info()` (queue should drain) and check the backend table.

---

## 8. Schema-version migration policy

- Adding optional fields → no version bump (forward-compatible).
- Removing or renaming required fields, changing types, redefining semantics →
  bump `SCHEMA_VERSION`. Backend keeps the old read-path live for at least 30
  days so queued events from older clients still ingest.
