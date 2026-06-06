# Use cases — artelonga / co universe platform

Catalog of every use case raised, with problem → solution → state →
artifact, and the role of **co** (the platform). It's the index; each row links the underlying doc/
endpoint/code. State: ✅ delivered · ◑ partial/design · ⏳ co-side/next.

> Principle that runs through everything: **separate content from form from data**; each **universe**
> (recursive/fractal — the abstraction belongs to co) **owns its own state**; and
> **publish is atomic + cache-first** (the last good version stays live if ingestion
> breaks). Universes are co's abstraction — we don't re-document the model here.

---

## A · Observability & Analytics

| # | Use case | Solution | State | Artifact |
|---|---|---|---|---|
| A1 | Collect telemetry for a universe without third parties | universe-owned surface (`/api/track`) + apex (analytics.js) | ✅ | [telemetry-surfaces](./telemetry-surfaces.md) |
| A2 | Geo without SaaS, zero cost | embedded CC0/DB-IP binary (country v4+v6, city IPv4), build-time | ✅ | telemetry-surfaces §2 |
| A3 | Parity with Google Analytics | retention · dwell · timeseries · conversions · acquisition (UTM) · device | ✅ | telemetry-surfaces §7 |
| A4 | Central analytics, filterable, multi-tenant | `?universe=` · `?from/&to` · `?breakdown=` over rollups | ◑ | [analytics-framework](./analytics-framework.md) · [analytics-api](./analytics-api.md) |
| A5 | New data (CNAME) reaches the parent without breaking the series | bidirectional rollup (push + read-back) + `path LIKE '/x/%'` bridge | ✅ | telemetry-surfaces §3 · co CO-340 |
| A6 | See stats of any universe from artelonga | summary `?universe=<handle>` | ⏳ | co CO-340 (PR #152) |
| A7 | Dashboards (time chart, filter by day, geo) | apex `/analytics/` + surface `/analytics` | ✅ | — |

## B · Universes (recursive/fractal model — co's abstraction)

| # | Use case | Solution | State | Artifact |
|---|---|---|---|---|
| B1 | Represent each domain as a universe | It's co's abstraction (`/api/v1/universes/:slug`); the domain declares `_universe.yaml` | ◑ | co · `work/artelonga/_universe.yaml` |
| B2 | Promote universe path → CNAME without friction | Same universe, same key/history/changelog/analytics | ✅ | [universe-upgrade](./universe-upgrade.md) |
| B3 | A universe owns its own state | Raw at the edge; co is the target of a consented broadcast | ✅ | telemetry-surfaces |
| B4 | Don't duplicate shared data | Shared data is a universe, referenced (yuri → neuro) | ✅ | author identity |

## C · Content: verify & publish

| # | Use case | Solution | State | Artifact |
|---|---|---|---|---|
| C1 | **Verify and publish content from MANY universes** | **co**: entries + proposals + reindex (verify) → immutable artifact + `current` pointer (publish) | ⏳ | **§ co Contract (below)** |
| C2 | Content separated from form | markdown/data (content) + renderer (form); bakes; `bake-docs` | ✅ | [scrum-universe](./scrum-universe.md) |
| C3 | Knowledge base / references as data | neuro references + author registry; queryable | ✅ | neuro/references.js · authors.js |
| C4 | Canonical author identity (resolves variants) | `author=yuri` resolves "Vieira Sugano"/"Yuri"/ABNT | ✅ | neuro/authors.js |
| C5 | Docs as rendered content | `/docs/` hub (markdown+mermaid → static), public/dev split | ✅ | tools/bake-docs.mjs |
| C6 | Publish fast/easy, scalable | folder + `draft:false`; N universes, one template | ◑ | scrum-universe |

## D · Business: funnel → conversion → delivery

| # | Use case | Solution | State | Artifact |
|---|---|---|---|---|
| D1 | Lead acquisition (E2E funnel) | discover→engage→intent→capture→qualify→register→convert→onboard | ◑ | [lead-acquisition](./lead-acquisition.md) |
| D2 | Conversion → provisions Kanban (co board) | co tasks API; board seeded at the moment of conversion | ⏳ | [scrum-retrospective](./scrum-retrospective.md) |
| D3 | Scrum delivery (cadence, roadmap/backlog, DoD) | biweekly Thu 15h BRT; backlog/sprint as co tasks; retrospective | ◑ | scrum-retrospective |
| D4 | Partner onboarding | BaaS: register→provision→deploy→ingest→sync→convert→satisfy | ◑ | [intelligence-as-a-service](./intelligence-as-a-service.md) §4 |
| D5 | Partner (e.g. Scrum) referenced, not embedded | `/scrum/` is the partner (draft/noindex); docs link to it | ✅ | /scrum/ |

## E · Platform & infra

| # | Use case | Solution | State | Artifact |
|---|---|---|---|---|
| E1 | Horizontal scale at zero SaaS cost | Intelligence as a Service — sovereign universe, ~1 VM each | ◑ | intelligence-as-a-service |
| E2 | Infra freedom (any domain/machine) | stdlib server + static + data spec; portable immutable artifact | ✅ | intelligence-as-a-service §2 |
| E3 | Runtime data ≠ content (don't commit/serve) | geo bins build-time; `*.ndjson`/`*.enc` gitignored | ✅ | refactor geo · security |
| E4 | Security review (what's exposed) | surface index (all paths + endpoints) by sensitivity | ✅ | tools/bake-security-index.mjs |
| E5 | Conversion (registration → payment) | identity + payment in co | ⏳ | intelligence-as-a-service §8 |

---

## § co Contract — verify & publish content from many universes (C1)

**The problem:** N universes need a **consistent** way to verify and
publish content. Bespoke per-universe pipelines don't scale. **co is the answer** —
it's already multi-tenant by `:slug` and has both halves.

**co already has the primitives** (it's not aspirational):

- **Publish** (`core/deploy.rs`): each universe publishes an **IMMUTABLE artifact**
  (`{universe_id}/{timestamp}-{suffix}`) to R2 → **stable deploy ID + public URL**,
  with an atomic **`current`** pointer (`co-deployments-current/{universe_id}/current`).
- **Verify**: `entries` (content model) · **`proposals`** (review/approval) ·
  **`reindex`** (validate + index) — all keyed by `:slug`.

**The loop, per universe:**

```
author/sync → co entries (the universe owns the content)
   → VERIFY:  reindex (schema) + proposals (review) + gates, on the immutable artifact
   → PUBLISH: atomic flip of current → deploy_id   (instant, no partial state)
   → OBSERVE: analytics keyed by universe (rollups)
   rollback = repoint current · preview = serve the deploy_id before the flip
```

**Why this actually solves it:**

- **Verify before publish** — build the immutable artifact → gates (down to preview
  URL) → only then flip `current`. Nothing goes live without verifying.
- **Atomic + reversible** — instant flip; rollback = repoint. No broken
  intermediate state.
- **Cache-first (our principle)** — serving reads `current` → last good artifact. If the
  build/verify pipeline falls over, **the live site stays up**. A publish failure ≠ an outage.
- **N universes, one pipeline** — `co publish <slug>`; a board of every universe's state;
  cross-universe verification (= the network view from the analytics-framework).

**Map: ArteLonga's bespoke pipeline → co gates** (ArteLonga is the *reference
implementation*; it should generalize into co):

| ArteLonga (today, bespoke) | → co (generic gate) |
|---|---|
| `validate-yaml` (vs openapi) | `reindex` validates the canonical schema |
| `audit-handles` / `audit-consistency` | `reindex` checks refs/backlinks |
| `audit-storage-keys` / lint | lint gate on the artifact |
| `quality` CI (Playwright/a11y/Lighthouse) | render+gate step on the artifact (preview) |
| human review | **proposals** (approval gate) |
| bakes (`bake-*`) | co's **renderer** (content → static) |
| `git push → GH Pages` / `fly deploy` | **deploy** (immutable artifact + `current` flip) |

**Endpoints (co) that materialize C1:**

- `POST /api/v1/universes/:slug/entries` — content (the universe owns it).
- `POST /api/v1/universes/:slug/reindex` — verify (schema + refs + index).
- `POST /api/v1/universes/:slug/proposals` — review/approval.
- `POST /api/v1/universes/:slug/deploy` *(to be specified)* — build → immutable artifact
  + flip `current`; response = deploy_id + public URL.
- `GET /api/v1/universes/:slug/deploys` *(to be specified)* — history/rollback.

**Honest gap:** the primitives exist; what's missing is (1) ArteLonga content → co
entries (or co reads the git repo), (2) bakes → co's renderer, (3) the `quality` gates →
a verify step in co. None of this is new infra — it's wiring ArteLonga's already-proven
pipeline into co's universe model.

**Reconciliation with the principles:** *a universe owns its state* (the universe owns the
content; co orchestrates) · *infra freedom* (immutable artifact + stable URL, serve
from R2/Fly/GH Pages) · *render-at-cache* (the `current` pointer IS the cache-first guarantee).

---

## Docs index

- [telemetry-surfaces](./telemetry-surfaces.md) · [analytics-framework](./analytics-framework.md) · [analytics-api](./analytics-api.md)
- [universe-upgrade](./universe-upgrade.md) · [intelligence-as-a-service](./intelligence-as-a-service.md)
- [lead-acquisition](./lead-acquisition.md) · [scrum-retrospective](./scrum-retrospective.md) · [scrum-universe](./scrum-universe.md)
- Partner: [/scrum/](/scrum/) · Base: neuro `references.js`/`authors.js` · Backlog: `work/artelonga/AL-N.md`
