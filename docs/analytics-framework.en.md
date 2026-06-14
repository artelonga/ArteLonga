# Analytics framework — central, filterable, multi-tenant, extensible

How the **two telemetry systems** of today (apex co-backed + universe-owned
surfaces, see [`telemetry-surfaces.md`](./telemetry-surfaces.md)) become **one**
central, filterable and extensible **framework** — for new partners and for any
`co` universe, inside or outside artelonga.

> **Status:** Phase 1 (this doc + canonical schema in
> `openapi/artelonga.yaml#/components/schemas/{TelemetryEvent,DailyRollup,…}`).
> Phases 2–5 below. What already exists is marked ✅.

## Core idea

A **canonical schema keyed by `universe`** + a **central warehouse with a
filterable query API** + **uniform, pluggable producers** + **a parametrized
dashboard**. Tenancy is the `universe` key — which `co` already models (recursive
universes; a partner **is** a universe; see [[reference_co_recursive_universes]]).
So "extend to new partners / other co universes" is not a new system — it is the
same system with another tenant key.

**The principle that reconciles "central" with "the universe owns its telemetry":**

> The **edges own the RAW** (sovereign, never leaves). The **center keeps only
> CONSENTED aggregates, no PII** (rollups). This is Option C
> ([`telemetry-surfaces.md §3`](./telemetry-surfaces.md)) generalized into a framework.

```
producers (edges, own the raw)             center (co warehouse)             consumers
──────────────────────────────            ─────────────────────             ─────────
surface artelonga (user)  ─┐                                                ┌─ dash apex   (scope=network)
apex artelonga            ─┤  DailyRollup                                   ├─ dash surface (scope=user)
parceiro novo (CNAME)     ─┼─ consentido, ──▶  tabela rollups  ──query──────┼─ dash parceiro (scope=<id>)
qualquer universe co      ─┤  sem PII,         (multi-tenant,  API          ├─ view de rede (owner)
stack externa (SDK)       ─┘  keyed by universe  filtrável)                 └─ componente embutível
```

## Canonical schema (source of truth: openapi)

The two systems already emit ~the same taxonomy. They converge on two shapes,
versioned in `openapi/artelonga.yaml`:

- **`TelemetryEvent`** — RAW, edge-owned, **never centralized**. Stays in the
  surface's NDJSON. Geo resolved at ingest from the IP (discarded). `vid/session/IP`
  do not leave the edge.
- **`DailyRollup`** — **consented, PII-free** aggregate — the **only** thing that
  goes to the center, keyed by `(universe, day)`, idempotent (upsert). Fields:
  `metrics` (`RollupMetrics` — pageviews, visitors, returning, sessions, bounced,
  dwell_ms_sum, conversions) + `dims` (`RollupDims` — geo, device, source, pages,
  goals, referrers).

`teleAgg()` (`tools/surfaces-server.mjs`) **already produces** almost exactly
`DailyRollup.dims` ✅ — the surface is one daily bucketing away from becoming a
compliant producer.

## Central warehouse + filterable API (co)

```
POST /api/v1/analytics/{universe}/rollups     producer push (tenant-keyed; upsert por universe+day)
GET  /api/v1/analytics/{scope}/summary        a ÚNICA leitura → AnalyticsSummary
        scope   = <universe> | network         (network = owner: todas as universes)
        ?from&to                                intervalo de datas
        ?groupBy=day|week|month                 bucket temporal
        ?filter=geo.country:BR,device:mobile    facetas (dimensões de baixa cardinalidade)
        ?breakdown=source|geo|device|page|goal  qual dimensão retornar
GET  /api/v1/analytics/{scope}/recent          live tail (opt-in)
```

Response = **`AnalyticsSummary`** (openapi): `{ scope, range, filter, metrics,
timeseries[], breakdown[] }`. This **realizes the `?from`/`&to`/`?universe` params**
that the apex dashboard already feature-detects today
([`analytics-api.md §9`](./analytics-api.md)).

**Access is tenant-scoped:** a partner's key → only their universe; the artelonga
owner's key → `network`. Same endpoint, scope by auth.

## Producers — uniform and pluggable (the extensibility)

The **contract is the schema (`DailyRollup`), not the implementation.** A
partner/universe integrates in two ways:

1. **Turnkey** — stand up the universe-owned `surfaces-server` (already aggregates
   ✅; only the rollup *push* is missing, at cold-start + a cron ping — Fly
   auto-stop machines have no resident timer). This is artelonga's CNAME path,
   already covered by the [`universe-upgrade.md`](./universe-upgrade.md) runbook.
2. **SDK / raw contract** — any external stack (a co universe, a non-artelonga
   site) does `POST DailyRollup` in the canonical schema with a tenant key.
   Collection and storage of the raw stay with it.

Onboarding a producer = (a) pick a universe id, (b) emit/"push" a daily
`DailyRollup`, (c) receive a tenant key. Nothing beyond the schema.

## Consumers — one parametrized dashboard

Collapse the two `analytics/index.html` into a single
`AnalyticsDashboard(scope, filters)` component that reads the central API:

- **apex** = `scope=network` (whole network);
- **each surface** = `scope=<its universe>` (keeps the local `/api/telemetry` for
  fine-grained live + reads the warehouse for history/cross-universe);
- **partners** embed the same component with their own scope.

The months chart + click-to-filter + facets that already exists ✅ becomes the
shared filter surface.

## The tension to design consciously: filterable vs sovereign raw

The **rollup cubes** give **single-dimension** facets at the center — "traffic from
Brazil over time", "conversions by source", "mobile share" — which cover ~all of
GA's reports. **Arbitrary cross-dimension** ("mobile users from Brazil who
converted via HN") needs raw events, which stay at the edge. So:

| Question | Where it's answered |
|---|---|
| 1-dimension facet + time | **center** (rollup cubes) |
| Deep cross-dimension / individual session | **owning edge** (query on the surface) or a **sampled** opt-in event feed |

GA also samples here. Per-tenant decision: most stays in cubes; whoever needs deep
drill-down enables the sampled (consented) feed.

## Privacy & tenancy

- **Sovereign raw at the edge** (folder/state per owner — LGPD, [`docs/LESSONS.md#L-009`](./LESSONS.md)).
- **Only PII-free aggregate at the center** (`DailyRollup` has no vid/sid/IP).
- **Geo/PII resolved at the edge** (country v4+v6 + IPv4 city; IP never persists).
- **Access scoped by tenant key** (a partner sees only their own; the owner sees
  the network).
- No third parties, no cross-site, no demographics via Google Signals (see the GA
  parity matrix in [`telemetry-surfaces.md §7`](./telemetry-surfaces.md)).

## Phased rollout (incremental — builds on what exists)

| Phase | Where | State |
|---|---|---|
| **1. Canonical schema** (`TelemetryEvent`, `DailyRollup`, dims) + this doc | ArteLonga | ✅ **done** (openapi + types) |
| **2. co: `rollups` table + ingest + filterable `summary`** (scope/from/to/filter/breakdown) | `co` (Rust) | ⏳ the central half |
| **3. surface emits `DailyRollup`** (producer half: daily bucketing + push) | ArteLonga | partial — `teleAgg` ✅, push missing |
| **4. Single dashboard** parametrized by scope | ArteLonga | chart/filter UI ✅, unification missing |
| **5. Partner onboarding** (turnkey + SDK + tenant key) | docs | extends `universe-upgrade.md` |

**Already de-risked:** edge aggregation with all GA-parity dimensions ✅, geo
(v4+v6 + city) ✅, the rollup *shape* (`teleAgg` ≈ `DailyRollup`) ✅, the
filter-by-day UI with backend feature-detect ✅, the privacy/ownership model ✅,
the upgrade runbook ✅. The real new work is **Phase 2 in the `co` repo** + wiring
up the Phase 3 push.

## Extension points

- **New dimension** → additive in `RollupDims` (schema versioned by `schema:`).
- **New producer** → conforms to `DailyRollup` (turnkey surfaces-server or SDK).
- **New consumer** → the `summary` API + the embeddable component.
- **Outside artelonga / a co universe** → since `co` is already multi-universe,
  analytics becomes a **universe capability**: every universe gets a dashboard by
  emitting rollups; a non-co partner uses the public ingest endpoint with a tenant
  key.

## References

- [`telemetry-surfaces.md`](./telemetry-surfaces.md) — the two systems, Option C,
  surface endpoints, geo, GA parity.
- [`universe-upgrade.md`](./universe-upgrade.md) — path→CNAME runbook (becomes the
  turnkey producer onboarding).
- [`analytics-api.md`](./analytics-api.md) — co marketing-batch contract + the
  `from/to/universe` params that Phase 2 realizes.
- `openapi/artelonga.yaml#/components/schemas/` — `TelemetryEvent`, `DailyRollup`,
  `RollupMetrics`, `RollupDims`, `GeoCount`, `DimensionCount`, `AnalyticsSummary`.
