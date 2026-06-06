# Analytics framework — central, filtrável, multi-tenant, extensível

Como os **dois sistemas de telemetria** de hoje (apex co-backed + surfaces
universe-owned, ver [`telemetry-surfaces.md`](./telemetry-surfaces.md)) viram **um
framework** central, filtrável e extensível — pra novos parceiros e pra qualquer
universe do `co`, dentro ou fora da artelonga.

> **Status:** Fase 1 (este doc + schema canônico em
> `openapi/artelonga.yaml#/components/schemas/{TelemetryEvent,DailyRollup,…}`).
> Fases 2–5 abaixo. O que já existe está marcado ✅.

## Ideia central

Um **schema canônico keyed by `universe`** + um **warehouse central com uma API de
query filtrável** + **producers uniformes e plugáveis** + **um dashboard
parametrizado**. A tenancy é a chave `universe` — que o `co` já modela (universes
recursivas; um parceiro **é** uma universe; ver [[reference_co_recursive_universes]]).
Então "estender pra novos parceiros / outras universes co" não é um sistema novo —
é o mesmo sistema com outra chave de tenant.

**O princípio que concilia "central" com "a universe é dona da sua telemetria":**

> Os **edges são donos do RAW** (soberano, nunca sai). O **centro guarda só
> agregados CONSENTIDOS, sem PII** (rollups). Isso é a Option C
> ([`telemetry-surfaces.md §3`](./telemetry-surfaces.md)) generalizada em framework.

```
producers (edges, donos do raw)            centro (warehouse co)             consumers
──────────────────────────────            ─────────────────────             ─────────
surface artelonga (yuri)  ─┐                                                ┌─ dash apex   (scope=network)
apex artelonga            ─┤  DailyRollup                                   ├─ dash surface (scope=yuri)
parceiro novo (CNAME)     ─┼─ consentido, ──▶  tabela rollups  ──query──────┼─ dash parceiro (scope=<id>)
qualquer universe co      ─┤  sem PII,         (multi-tenant,  API          ├─ view de rede (owner)
stack externa (SDK)       ─┘  keyed by universe  filtrável)                 └─ componente embutível
```

## Schema canônico (source of truth: openapi)

Os dois sistemas já emitem ~a mesma taxonomia. Convergem em dois shapes, versionados
em `openapi/artelonga.yaml`:

- **`TelemetryEvent`** — RAW, edge-owned, **nunca centralizado**. Fica no NDJSON da
  surface. Geo resolvido no ingest a partir do IP (descartado). `vid/session/IP` não
  saem do edge.
- **`DailyRollup`** — agregado **consentido, sem PII** — a **única** coisa que vai
  pro centro, keyed by `(universe, day)`, idempotente (upsert). Campos: `metrics`
  (`RollupMetrics` — pageviews, visitors, returning, sessions, bounced,
  dwell_ms_sum, conversions) + `dims` (`RollupDims` — geo, device, source, pages,
  goals, referrers).

`teleAgg()` (`tools/surfaces-server.mjs`) **já produz** quase exatamente
`DailyRollup.dims` ✅ — a surface está a um bucketing diário de virar producer
conforme.

## Warehouse central + API filtrável (co)

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

Resposta = **`AnalyticsSummary`** (openapi): `{ scope, range, filter, metrics,
timeseries[], breakdown[] }`. Isto **realiza os params `?from`/`&to`/`?universe`**
que o dashboard apex já feature-detecta hoje
([`analytics-api.md §9`](./analytics-api.md)).

**Acesso é tenant-scoped:** a chave de um parceiro → só a universe dele; a chave do
owner artelonga → `network`. Mesmo endpoint, escopo pela auth.

## Producers — uniformes e plugáveis (a extensibilidade)

O **contrato é o schema (`DailyRollup`), não a implementação.** Um parceiro/universe
integra de dois jeitos:

1. **Turnkey** — sobe o `surfaces-server` universe-owned (já agrega ✅; falta só o
   *push* do rollup, no cold-start + um ping de cron — máquinas Fly auto-stop não têm
   timer residente). É o caminho de CNAME da artelonga, já coberto pelo runbook
   [`universe-upgrade.md`](./universe-upgrade.md).
2. **SDK / contrato raw** — qualquer stack externa (uma universe co, um site não-
   artelonga) faz `POST DailyRollup` no schema canônico com uma tenant key. Coleta e
   storage do raw continuam dela.

Onboarding de um producer = (a) escolher universe id, (b) emitir/“pushar”
`DailyRollup` diário, (c) receber uma tenant key. Nada além do schema.

## Consumers — um dashboard parametrizado

Colapsar os dois `analytics/index.html` num componente único
`AnalyticsDashboard(scope, filters)` que lê a API central:

- **apex** = `scope=network` (rede inteira);
- **cada surface** = `scope=<sua universe>` (mantém o `/api/telemetry` local pro
  live fino + lê o warehouse pra histórico/cross-universe);
- **parceiros** embutem o mesmo componente com o scope deles.

O gráfico de meses + clique-filtra + facetas que já existe ✅ vira a superfície de
filtro compartilhada.

## A tensão a desenhar conscientemente: filtrável vs raw soberano

Os **cubos de rollup** dão facetas **de uma dimensão** no centro — "tráfego do
Brasil ao longo do tempo", "conversões por origem", "share mobile" — que cobrem ~todos
os relatórios do GA. **Cross-dimensão arbitrário** ("usuários mobile do Brasil que
converteram via HN") precisa de eventos raw, que ficam no edge. Então:

| Pergunta | Onde responde |
|---|---|
| Faceta de 1 dimensão + tempo | **centro** (rollup cubes) |
| Cross-dimensão profundo / sessão individual | **edge dono** (query na surface) ou feed de eventos **amostrado** opt-in |

O GA também amostra aqui. Decisão por-tenant: a maioria fica em cubos; quem precisar
de drill-down profundo habilita o feed amostrado (consentido).

## Privacidade & tenancy

- **Raw soberano no edge** (folder/estado por owner — LGPD, [`docs/LESSONS.md#L-009`](./LESSONS.md)).
- **Só agregado sem PII no centro** (`DailyRollup` não tem vid/sid/IP).
- **Geo/PII resolvido no edge** (país v4+v6 + cidade IPv4; IP nunca persiste).
- **Acesso scoped por tenant key** (parceiro vê só o seu; owner vê a rede).
- Sem terceiros, sem cross-site, sem demografia via Google Signals (ver matriz de
  paridade GA em [`telemetry-surfaces.md §7`](./telemetry-surfaces.md)).

## Rollout faseado (incremental — constrói no que existe)

| Fase | Onde | Estado |
|---|---|---|
| **1. Schema canônico** (`TelemetryEvent`, `DailyRollup`, dims) + este doc | ArteLonga | ✅ **feito** (openapi + types) |
| **2. co: tabela `rollups` + ingest + `summary` filtrável** (scope/from/to/filter/breakdown) | `co` (Rust) | ⏳ a metade central |
| **3. surface emite `DailyRollup`** (producer half: bucketing diário + push) | ArteLonga | parcial — `teleAgg` ✅, falta o push |
| **4. Dashboard único** parametrizado por scope | ArteLonga | UI de chart/filtro ✅, falta unificar |
| **5. Onboarding de parceiro** (turnkey + SDK + tenant key) | docs | estende `universe-upgrade.md` |

**Já de-riscado:** agregação no edge com todas as dimensões de paridade GA ✅, geo
(v4+v6 + cidade) ✅, o *shape* do rollup (`teleAgg` ≈ `DailyRollup`) ✅, a UI de
filtro-por-dia com feature-detect do backend ✅, o modelo de privacidade/ownership ✅,
o runbook de upgrade ✅. O trabalho novo real é a **Fase 2 no repo `co`** + ligar o
push da Fase 3.

## Pontos de extensão

- **Nova dimensão** → aditiva em `RollupDims` (schema versionado por `schema:`).
- **Novo producer** → conforma com `DailyRollup` (turnkey surfaces-server ou SDK).
- **Novo consumer** → a API `summary` + o componente embutível.
- **Fora da artelonga / universe co** → como o `co` já é multi-universe, analytics
  vira **capability de universe**: toda universe ganha dashboard emitindo rollups; um
  parceiro não-co usa o endpoint público de ingest com uma tenant key.

## Referências

- [`telemetry-surfaces.md`](./telemetry-surfaces.md) — os dois sistemas, Option C,
  endpoints da surface, geo, paridade GA.
- [`universe-upgrade.md`](./universe-upgrade.md) — runbook path→CNAME (vira o
  onboarding turnkey de producer).
- [`analytics-api.md`](./analytics-api.md) — contrato co marketing-batch + os params
  `from/to/universe` que a Fase 2 realiza.
- `openapi/artelonga.yaml#/components/schemas/` — `TelemetryEvent`, `DailyRollup`,
  `RollupMetrics`, `RollupDims`, `GeoCount`, `DimensionCount`, `AnalyticsSummary`.
