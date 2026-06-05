# Telemetria — surfaces universe-owned & convergência

Companheiro de [`analytics-api.md`](./analytics-api.md). Aquele documenta o
sistema **co marketing-batch** (apex `artelonga.com.br` → co, dashboard
`/analytics/`). Este documenta o **segundo sistema** — telemetria
**universe-owned** das surfaces CNAME — e o **design de convergência** que mantém
a observabilidade de tempo de um parceiro contínua quando ele é promovido de
path (`/yuri/`) pra surface própria (`yuri.artelonga.com.br`).

## Mapa dos dois sistemas

| | **co marketing-batch** | **surface universe-owned** |
|---|---|---|
| Onde roda | `artelonga.com.br` + paths | surfaces CNAME (`yuri.artelonga.com.br`, `hostinger.…`, `comunicacao.…`) |
| Cliente | `assets/analytics.js` (rico, GA-like) | `yuri/telemetry.js` (beacon mínimo) + `yuri/feedback.js` |
| Ingest | `POST co/api/v1/telemetry/events` | `POST /api/track`, `POST /api/feedback` (mesma origem) |
| Servidor | `artelonga/co` (Rust/Axum, SQLite) | `tools/surfaces-server.mjs` (Node stdlib, Fly) |
| Storage | `telemetry_events` (SQL) | NDJSON `/data/telemetry-<universe>.jsonl` (volume Fly) |
| Leitura | `co/api/v1/analytics/public/{summary,recent}` | `GET /api/telemetry` (agrega surfaces irmãs server-side) |
| Dashboard | `artelonga.com.br/analytics/` | `<surface>/analytics/` (ex. `yuri.artelonga.com.br/analytics`) |
| Princípio | co é a fonte de leitura | **a universe é dona da telemetria; co é alvo de broadcast consentido, nunca fonte de leitura** (`surfaces-server.mjs:28`) |

O princípio universe-owned é deliberado: acesso/interação **não** vão pro co —
só o **feedback** (consentido no envio) é broadcastado. Ver `feedback` abaixo.

---

## 1. Endpoints da surface (`tools/surfaces-server.mjs`)

Servidor de UMA surface por app Fly, parametrizado por env (§4). Sem
dependências além da stdlib do Node.

### `POST /api/track` — acesso + interação (beacon)

Recebe pageview/interaction do cliente (`yuri/telemetry.js`, via `sendBeacon`).
Mesma origem, sem CORS. Body ≤ 8 KiB. Resposta `204 No Content`.

Request body:

```ts
type TrackBody = {
  kind: "pageview" | "interaction",   // default "pageview"
  page?: string,        // location.pathname + search
  referrer?: string | null,
  session?: string,     // al.sid — sessionStorage, POR ABA (ver continuidade §5)
  action?: string | null,    // ex. "click"
  target?: string | null,    // href clicado (≤ 200 chars)
  outbound?: boolean,        // saiu do host atual
  lang?: string | null,
  vw?: number | null,        // viewport width
  t?: string                 // ISO timestamp (cliente); server usa se presente
}
```

Persistido como uma linha NDJSON (`teleSave`):

```ts
type TrackEvent = {
  t: string,                 // ISO
  universe: string,          // = FEEDBACK_UNIVERSE
  kind: "pageview" | "interaction",
  page, referrer, session, action, target, outbound, lang, vw
  // PLANEJADO (Option C, §3): country  ← resolvido server-side no ingest
}
```

### `POST /api/feedback` — feedback consentido (broadcast pro co)

Recebe o modal "Fale Conosco" (`yuri/feedback.js`). Body ≤ 16 KiB. Loga no
stdout (→ `fly logs`), persiste no NDJSON da universe **e** encaminha pro co.

Request body:

```ts
type FeedbackBody = {
  message: string,
  sentiment?: -1 | 0 | 1,    // 👎 / • / 👍
  entry_path?: string,       // ou page
  kind?: string,             // default "feedback"
  name?: string,
  email?: string,            // ou contact
}
```

Broadcast pro co: `POST $CO_FEEDBACK` (default
`https://co.artelonga.com.br/api/v1/feedback`) com
`{ universe, kind, message, entry_path, name, email }`. O status fica no
evento (`broadcast.co ∈ {ok, failed, pending}`, `broadcast.status` = HTTP).
**Co é só alvo de broadcast** — o NDJSON local é a fonte da verdade.
Resposta: `200 {ok, broadcast}`.

### `GET /api/telemetry` — leitura agregada (estado da universe)

Agrega o NDJSON local + as **surfaces irmãs** (`$SIBLINGS`, server-side, sem
CORS). `?local=1` = só esta surface (usado na agregação pra evitar recursão).
Cache: nenhum (calculado on-read sobre `TELE_MEM`). Shape real (verificado):

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
    topPages: Array<{ n: number, page: string }>,     // top 12
    referrers: Array<{ n: number, ref: string }>      // top 8, externos (refDomain)
  },
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

### Não-telemetria

`/analytics` → serve `<surface>/analytics/index.html`. `MODE=iframe` →
joga `REDIRECT_URL` num iframe + carrega feedback. `MODE=redirect` → 302.
Resto = arquivo estático (cache `max-age=60`).

---

## 2. Geo embarcado (`yuri/geo/ip4-country.bin`)

Geo é resolvido **embarcado, self-hosted, sem chamada externa por request, só
país** — escolha consciente vs. GeoLite2 (que exige license key e **proíbe**
redistribuição em repo público). Fonte:
[`sapics/ip-location-db`](https://github.com/sapics/ip-location-db)
`geo-whois-asn-country` — licença **CC0** (domínio público, commitável).

Compilado por `tools/bake-geo.mjs` (baixa CSV → binário compacto). Formato:

```
header  : "AG41" (4B) + count uint32 LE (4B)
starts  : count × uint32 LE    — limite inferior de cada faixa IPv4, ordenado
codes   : count × 2 bytes ASCII — país ("\0\0" = desconhecido/gap)
```

Faixas adjacentes do mesmo país são coladas (push-on-change) → 334k faixas-fonte
viram ~341k boundaries, **1.95 MB**. Lookup = `ip→uint32`, busca binária pelo
maior `start ≤ ip`, devolve o país. IPv6/privado/desconhecido → `null`.

Regenerar: `node tools/bake-geo.mjs` (ou passar um CSV: `… /tmp/geo4.csv`).
O `.bin` entra na imagem via `COPY yuri` (Dockerfile) — o reader é **inline** no
`surfaces-server.mjs` (o Dockerfile só copia esse `.mjs` + `yuri/`).

> **Privacidade:** o país é derivado no ingest a partir de `Fly-Client-IP` e só o
> país é gravado — o IP cru **nunca** é persistido nem sai da surface.

---

## 3. Convergência — parceiro upgrade & observabilidade de tempo contínua

**Problema:** quando um parceiro é promovido de path (`/yuri/`, telemetria no co:
timeseries/geo/retenção) pra surface CNAME (`yuri.artelonga.com.br`, NDJSON:
só contagens), ele (a) **perde** o gráfico de tempo, geo, retenção e (b) sofre
**descontinuidade** na série (histórico no co, novo na NDJSON). O upgrade deveria
ser melhoria estrita — hoje é regressão.

**Design escolhido — Option C: edge dono do raw + co warehouse de rollups
consentidos (sem PII).**

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

Por que C: honra o princípio universe-owned (raw fica no edge; só agregado
consentido sem PII vai pro co — mesmo modelo do feedback); a série é contínua no
upgrade (mesma key `universe`); sobrevive ao sleep da máquina (rollup on
cold-start + cron externo, não timer residente — surfaces têm
`min_machines_running=0`); PII fica no edge (só histograma de país sai).

**Rollup schema (planejado):**

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

**Runbook do upgrade (uma vez por promoção):**

1. **Freeze** — marca o timestamp de corte `T`.
2. **Backfill** — exporta eventos pré-`T` do parceiro do co
   (`GET /api/v1/admin/telemetry/export`, filtrado a `/<handle>/*`), rola pra
   série diária sob `universe=<handle>`.
3. **Ponte de identidade** — surface adota `al_vid` (cookie apex
   `.artelonga.com.br`) no lugar do `al.sid` por-aba, pra retenção atravessar.
4. **Cutover** — surface começa a emitir rollups pra `≥ T`; linhas `/<handle>/*`
   no dash da rede são redirecionadas/anotadas pra surface.
5. **Verifica** — consulta a série no warehouse cruzando `T`: sem gap, sem
   dupla contagem.

**Alternativas descartadas:** (A) encaminhar todo raw pro co + `?universe` —
viola o princípio e recentraliza PII; (B) surface 100% self-owned sem co — pura,
mas cada surface reimplementa o cérebro de analytics e não há warehouse de
horizonte longo sobrevivendo ao sleep. C = continuidade do A + ownership do B.

### Lacunas de paridade a fechar na surface (substrato da Option C)

Pra surface não regredir vs. co, o build de paridade (aprovado, parcialmente
feito):

| Capacidade | co tem | surface tem | gap |
|---|---|---|---|
| timeseries diário | ✅ | ❌ | agregar `TrackEvent.t` por dia em `teleAgg` |
| geo (país) | ✅ (país+cidade) | ⏳ binário pronto | ligar lookup no ingest `/api/track` |
| retenção (novo/returning) | ✅ | ❌ | `al_vid` persistente (hoje `al.sid` por-aba) |
| dwell / sessão | ✅ | ❌ | evento `page_end` com `active_ms` (visibilitychange/pagehide) |
| conversão / funil | parcial | ❌ | mapa de goals client + agregação |

---

## 4. Config (env por app — `deploy/surfaces/*.toml`)

| Env | Default | O que faz |
|---|---|---|
| `SURFACE` | `/yuri/` | path da surface servido na raiz `/` |
| `FEEDBACK_UNIVERSE` | `yuri` | universe (key de telemetria + roteamento de feedback) |
| `TELEMETRY_DIR` | `/data` | onde grava o `.jsonl` |
| `TELEMETRY_DURABLE` | `` (off) | `1` = persiste no volume; senão memória/efêmero |
| `SIBLINGS` | `` | URLs de surfaces irmãs da mesma universe (agregação) |
| `CO_FEEDBACK` | `co…/api/v1/feedback` | alvo do broadcast de feedback |
| `MODE` | `static` | `static` / `iframe` / `redirect` |
| `GEO_DB` (planejado) | `yuri/geo/ip4-country.bin` | binário geo (§2) |

Surfaces auto-stop (`min_machines_running=0`): a coleta continua (a máquina
auto-starta no request, NDJSON durável persiste), mas **não há rollup residente**
— por isso o rollup roda on-cold-start + cron externo (§3).

---

## 5. Continuidade de identidade (crítico pro upgrade)

| | apex (`analytics.js`) | surface (`telemetry.js`) |
|---|---|---|
| visitor id | `al_vid` — localStorage **+ cookie `.artelonga.com.br`**, 2 anos | — (não tem) |
| session id | `al_sid` — sessionStorage por aba | `al.sid` — sessionStorage por aba |

O `al_vid` do apex é cookie no **domínio registrável** `.artelonga.com.br`, então
**sobrevive** à mudança pro subdomínio `yuri.artelonga.com.br` — *se* a surface
adotar `al_vid` em vez do `al.sid` por-aba. Hoje a surface só tem session por-aba
→ `sessions` superestima e não há conceito de visitante recorrente. Fechar isso é
o passo 3 do runbook (§3).

---

## 6. Privacidade (ambos os sistemas)

- Sem cookies de terceiros, sem fingerprinting, sem ads. Respeita
  `navigator.doNotTrack` e (no apex) `navigator.webdriver` + opt-out
  (`localStorage.al_optout="1"` + cookie apex).
- Surface: beacon respeita DNT (`telemetry.js:8`). Sem PII no `/api/track`.
- Geo: país derivado do IP **no edge**; IP cru nunca persistido (apex: hash com
  sal server-side; surface: descartado após lookup).
- Só **feedback** (consentido) e **rollups agregados sem PII** saem da surface
  pro co. Acesso/interação raw ficam universe-owned.
- Retenção recomendada: ≤ 90 dias raw, agregado (rollup diário) depois.
