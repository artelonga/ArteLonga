# Telemetria — surfaces universe-owned & convergência

Companheiro de [`analytics-api.md`](./analytics-api.md). Aquele documenta o
sistema **co marketing-batch** (apex `artelonga.com.br` → co, dashboard
`/analytics/`). Este documenta o **segundo sistema** — telemetria
**universe-owned** das surfaces CNAME — e o **design de convergência** que mantém
a observabilidade de tempo de um parceiro contínua quando ele é promovido de
path (`/user/`) pra surface própria (`user.artelonga.com.br`).

## Mapa dos dois sistemas

| | **co marketing-batch** | **surface universe-owned** |
|---|---|---|
| Onde roda | `artelonga.com.br` + paths | surfaces CNAME (`user.artelonga.com.br`, `hostinger.…`, `comunicacao.…`) |
| Cliente | `assets/analytics.js` (rico, GA-like) | `user/telemetry.js` (beacon mínimo) + `user/feedback.js` |
| Ingest | `POST co/api/v1/telemetry/events` | `POST /api/track`, `POST /api/feedback` (mesma origem) |
| Servidor | `artelonga/co` (Rust/Axum, SQLite) | `tools/surfaces-server.mjs` (Node stdlib, Fly) |
| Storage | `telemetry_events` (SQL) | NDJSON `/data/telemetry-<universe>.jsonl` (volume Fly) |
| Leitura | `co/api/v1/analytics/public/{summary,recent}` | `GET /api/telemetry` (agrega surfaces irmãs server-side) |
| Dashboard | `artelonga.com.br/analytics/` | `<surface>/analytics/` (ex. `user.artelonga.com.br/analytics`) |
| Princípio | co é a fonte de leitura | **a universe é dona da telemetria; co é alvo de broadcast consentido, nunca fonte de leitura** (`surfaces-server.mjs:28`) |

O princípio universe-owned é deliberado: acesso/interação **não** vão pro co —
só o **feedback** (consentido no envio) é broadcastado. Ver `feedback` abaixo.

### Chave de universo no co marketing-batch (`site` = universo)

No ingest co marketing-batch, o universo é **o campo `site` do evento**
(`co-web/src/platform/telemetry.rs` → `universe_key = site`), **não** o path.
Então **cada app que carrega `assets/analytics.js` declara o seu próprio
universo** assim — uma linha antes do beacon:

```html
<script>window.AL_SITE = "neuro";</script>   <!-- ou data-site no <script> -->
<script src="/assets/analytics.js?v=YYYYMMDD" defer></script>
```

Default = `artelonga` (apex). Apps fora do padrão surfaces-server (ex. **neuro**,
servido por `tools/neuro-form-server.mjs`, com paths heterogêneos `/2026-05-29/`,
`/neuro/…`) usam isso pra atribuir **todo** o tráfego ao seu universo de uma vez,
independente do path. É o caminho mínimo pra dar **analytics atual** a qualquer
app (base pra A/B, engajamento, user paths) antes mesmo de virar surface CNAME.
Universos co nativos (ex. `nlp`, sob `user`) reportam pela própria plataforma ao
serem servidos pelo co — herdam telemetria sem wiring extra.

---

## 1. Endpoints da surface (`tools/surfaces-server.mjs`)

Servidor de UMA surface por app Fly, parametrizado por env (§4). Sem
dependências além da stdlib do Node.

### `POST /api/track` — acesso + interação (beacon)

Recebe pageview/interaction do cliente (`user/telemetry.js`, via `sendBeacon`).
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

Recebe o modal "Fale Conosco" (`user/feedback.js`). Body ≤ 16 KiB. Loga no
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
  surface: string,           // ex. "/user/"
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

`200 {"ok":true,"surface":"/user/","mode":"static"}`.

### Não-telemetria

`/analytics` → serve `<surface>/analytics/index.html`. `MODE=iframe` →
joga `REDIRECT_URL` num iframe + carrega feedback. `MODE=redirect` → 302.
Resto = arquivo estático (cache `max-age=60`).

---

## 2. Geo embarcado (`user/geo/*.bin`)

Geo é resolvido **embarcado, self-hosted, sem chamada externa por request** —
escolha consciente vs. GeoLite2 (license key + proíbe redistribuição). País via
[`sapics/ip-location-db`](https://github.com/sapics/ip-location-db)
`geo-whois-asn-country` (**CC0**); cidade via DB-IP City Lite (**CC-BY**, §abaixo).

> **Geo é DATA de runtime, não content+form.** Os binários **não são commitados**
> nem servidos por GH Pages — são **baixados + compilados no build da imagem**
> (`Dockerfile` → `RUN bake-geo`), e excluídos do git (`.gitignore`) e do
> build-context (`.dockerignore user/geo/*.bin`). Assim o repo de conteúdo fica
> limpo e o deploy é reproduzível independente do estado local.
>
> **Local dev:** rode `node tools/bake-geo.mjs` (país) e `node tools/bake-geo.mjs
> --city` (cidade) uma vez pra popular `user/geo/` no seu clone; sem isso o server
> sobe sem geo (degrada pra `null`, sem crash).

Compilado por `tools/bake-geo.mjs` (baixa os CSVs → binários compactos).
País em **IPv4 e IPv6**, dois arquivos:

```
ip4-country.bin  AG41: magic(4) + count(u32 LE) + starts[count×u32 LE]  + codes[count×2B]
ip6-country.bin  AG61: magic(4) + count(u32 LE) + starts[count×16B BE]  + codes[count×2B]
codes = país ASCII 2B ("\0\0" = desconhecido/gap)
```

Faixas adjacentes do mesmo país são coladas (push-on-change). v4: 334k faixas →
341k boundaries, **1.95 MB**; v6: 214k faixas → 273k boundaries, **4.69 MB**.
Lookup (`geoCountry`) despacha por família: IPv4 (ou `::ffff:a.b.c.d`) → busca
binária por `uint32`; IPv6 → parse pra 16 bytes big-endian + busca binária por
`Buffer.compare`. Privado/loopback/desconhecido → `null`.

**Cidade (opcional, IPv4):** `ip4-city.bin` (formato `AGC4` — starts `u32` +
índice `u32` numa tabela `país|região|cidade` deduplicada). Fonte: **DB-IP City
Lite**, licença **CC-BY-4.0** → exige atribuição visível ("IP Geolocation by
DB-IP", presente no dashboard). É grande (~31 MB, e o set IPv6 é ~98 MB gz), então
**não é commitado**: o `Dockerfile` baixa + compila no build
(`bake-geo.mjs --city`), dentro da imagem, fora do git e do build context. Se
faltar, a surface cai pra geo de país. **IPv6 resolve em nível de país** (sem city
v6).

Regenerar: `node tools/bake-geo.mjs` (ou passar um CSV: `… /tmp/geo4.csv`).
O `.bin` entra na imagem via `COPY user` (Dockerfile) — o reader é **inline** no
`surfaces-server.mjs` (o Dockerfile só copia esse `.mjs` + `user/`).

> **Privacidade:** o país é derivado no ingest a partir de `Fly-Client-IP` e só o
> país é gravado — o IP cru **nunca** é persistido nem sai da surface.

---

## 3. Convergência — parceiro upgrade & observabilidade de tempo contínua

**Problema:** quando um parceiro é promovido de path (`/user/`, telemetria no co:
timeseries/geo/retenção) pra surface CNAME (`user.artelonga.com.br`, NDJSON:
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
  ├─ histórico pré-upgrade (rollup único dos eventos /user raw do co)
  └─ rollups pós-upgrade (append)  ──▶ UMA série contínua, keyed by universe
dashboard rede: /analytics?universe=user ──lê──▶ co warehouse
```

Por que C: honra o princípio universe-owned (raw fica no edge; só agregado
consentido sem PII vai pro co — mesmo modelo do feedback); a série é contínua no
upgrade (mesma key `universe`); sobrevive ao sleep da máquina (rollup on
cold-start + cron externo, não timer residente — surfaces têm
`min_machines_running=0`); PII fica no edge (só histograma de país sai).

**Rollup schema (planejado):**

```ts
type DailyRollup = {
  universe: string,          // "user" — estável path↔CNAME
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

### Paridade da surface (substrato da Option C) — estado

| Capacidade | co | surface | estado |
|---|---|---|---|
| timeseries diário | ✅ | ✅ | `teleAgg` agrega `TrackEvent.t` por dia |
| geo | ✅ país+cidade | ✅ país (v4+v6) + cidade (IPv4) | binários embarcados; city via DB-IP na imagem; v6 city = delta |
| retenção (novo/recorrente) | ✅ | ✅ | `al_vid` persistente (cookie apex) |
| dwell / engajamento | ✅ | ✅ | `page_end` com `active_ms` |
| rejeição (bounce) | ~ | ✅ | sessão ≤1 pageview e 0 interação |
| conversão (goals) | ✅ | ✅ | regras built-in + `[data-goal]` |
| aquisição (utm/origem) | ✅ | ✅ | `utm` first-touch → referrer → "(direto)" |
| dispositivo | ✅ | ✅ | categoria por viewport (mobile/tablet/desktop) |

---

## 7. Paridade com Google Analytics (GA4)

Objetivo: a telemetria entregar **tanto e tão granular quanto o GA** — sem cookies
de terceiros, sem cross-site, self-hosted, raw exportável. Onde "surface" aparece,
é o estado atual de `user.artelonga.com.br`.

| GA4 | apex (co) | surface | nota |
|---|---|---|---|
| Pageviews | ✅ | ✅ | |
| Sessões | ✅ | ✅ | por-aba (`al.sid`) |
| Usuários únicos | ✅ | ✅ | `al_vid` |
| Novo vs. recorrente | ✅ | ✅ | vid em >1 dia |
| Tempo de engajamento | ✅ | ✅ | `page_end active_ms` / dwell |
| Taxa de rejeição/engajamento | ~ | ✅ | bounce |
| Eventos (custom) | ✅ | ✅ | pageview/interaction/page_end/goal |
| Conversões (key events) | ✅ | ✅ | goals |
| Aquisição (source/medium/campaign) | ✅ | ✅ | UTM first-touch + referrer |
| Referrals | ✅ | ✅ | |
| Geo país | ✅ | ✅ | v4+v6 embarcado |
| Geo região/cidade | ✅ cidade | ✅ cidade (IPv4) / país (IPv6) | DB-IP City Lite (CC-BY) compilado na imagem; **delta** = city IPv6 |
| Dispositivo (categoria) | ~ | ✅ | viewport → mobile/tablet/desktop |
| Browser / OS | ~ `ua_brand` | ⛔ | **delta** — exige parse de User-Agent |
| Viewport / resolução | ✅ | ✅ | `vw` |
| Idioma | ✅ | ✅ | `lang` |
| Landing page | ✅ | ~ derivável | 1º pageview da sessão |
| Scroll depth | ✅ | ⛔ | **delta** — listener 25/50/75/100% no client |
| Cliques outbound | ✅ | ✅ | |
| Tempo real | ✅ | ✅ | `recent` |
| Funil / path | ~ | ~ goals | **delta** — funil multi-step |
| Coorte / curva de retenção | ~ | ~ novo/recorrente | **delta** — curva de coorte |
| **Demografia (idade/gênero/interesses)** | ⛔ | ⛔ | **deliberado** — GA depende de Google Signals (cross-site, vende identidade); viola o princípio de privacidade. Não fazemos. |
| **Audiências / segmentos cross-site** | ⛔ | ⛔ | **deliberado** — idem |
| Export raw (BigQuery-like) | ~ admin export | ✅ | NDJSON é a fonte da verdade, exportável |

**Conclusão:** no **core que respeita privacidade**, a surface está **igual ou
acima** do GA (self-hosted, sem terceiros, raw exportável, geo v4+v6). Os pilares
do GA que **não** cobrimos são os de **vigilância** (demografia via Google Signals,
audiências cross-site) — omitidos por princípio, não por limitação.

**Deltas de granularidade ainda abertos** (nenhum exige comprometer privacidade,
todos incrementais): **city IPv6** (set ~98 MB gz), browser/OS (parse UA), scroll
depth, funil multi-step e curva de coorte. Priorizar sob demanda.

---

## 4. Config (env por app — `deploy/surfaces/*.toml`)

| Env | Default | O que faz |
|---|---|---|
| `SURFACE` | `/user/` | path da surface servido na raiz `/` |
| `FEEDBACK_UNIVERSE` | `user` | universe (key de telemetria + roteamento de feedback) |
| `TELEMETRY_DIR` | `/data` | onde grava o `.jsonl` |
| `TELEMETRY_DURABLE` | `` (off) | `1` = persiste no volume; senão memória/efêmero |
| `SIBLINGS` | `` | URLs de surfaces irmãs da mesma universe (agregação) |
| `CO_FEEDBACK` | `co…/api/v1/feedback` | alvo do broadcast de feedback |
| `MODE` | `static` | `static` / `iframe` / `redirect` |
| `GEO_DB` (planejado) | `user/geo/ip4-country.bin` | binário geo (§2) |

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
**sobrevive** à mudança pro subdomínio `user.artelonga.com.br` — *se* a surface
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
