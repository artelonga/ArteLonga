# Use cases — artelonga / co universe platform

Catálogo de todos os casos de uso levantados, com problema → solução → estado →
artefato, e o papel do **co** (a plataforma). É o índice; cada linha linka o doc/
endpoint/código de fundo. Estado: ✅ entregue · ◑ parcial/design · ⏳ co-side/próximo.

> Princípio que atravessa tudo: **separar content de form de data**; cada **universe**
> (recursivo/fractal — a abstração é do co) **é dona do próprio estado**; e o
> **publish é atômico + cache-first** (a última versão boa segue no ar se a ingestão
> quebrar). Universos são a abstração do co — não redocumentamos o modelo aqui.

---

## A · Observabilidade & Analytics

| # | Caso de uso | Solução | Estado | Artefato |
|---|---|---|---|---|
| A1 | Coletar telemetria de uma universe sem terceiros | Surface universe-owned (`/api/track`) + apex (analytics.js) | ✅ | [telemetry-surfaces](./telemetry-surfaces.md) |
| A2 | Geo sem SaaS, custo zero | Binário CC0/DB-IP embarcado (país v4+v6, cidade IPv4), build-time | ✅ | telemetry-surfaces §2 |
| A3 | Paridade com Google Analytics | retenção · dwell · timeseries · conversões · aquisição (UTM) · dispositivo | ✅ | telemetry-surfaces §7 |
| A4 | Analytics central, filtrável, multi-tenant | `?universe=` · `?from/&to` · `?breakdown=` sobre rollups | ◑ | [analytics-framework](./analytics-framework.md) · [analytics-api](./analytics-api.md) |
| A5 | Dado novo (CNAME) chega no pai sem partir a série | Rollup bidirecional (push + read-back) + ponte `path LIKE '/x/%'` | ✅ | telemetry-surfaces §3 · co CO-340 |
| A6 | Ver stats de qualquer universe pela artelonga | summary `?universe=<handle>` | ⏳ | co CO-340 (PR #152) |
| A7 | Dashboards (gráfico de tempo, filtro por dia, geo) | apex `/analytics/` + surface `/analytics` | ✅ | — |

## B · Universes (modelo recursivo/fractal — abstração do co)

| # | Caso de uso | Solução | Estado | Artefato |
|---|---|---|---|---|
| B1 | Representar cada domínio como universe | É a abstração do co (`/api/v1/universes/:slug`); domínio declara `_universe.yaml` | ◑ | co · `work/artelonga/_universe.yaml` |
| B2 | Promover universe path → CNAME sem fricção | Mesma universe, mesma chave/histórico/changelog/analytics | ✅ | [universe-upgrade](./universe-upgrade.md) |
| B3 | Universe é dona do próprio estado | Raw no edge; co é alvo de broadcast consentido | ✅ | telemetry-surfaces |
| B4 | Não duplicar dado compartilhado | Dado compartilhado é uma universe, referenciada (yuri → neuro) | ✅ | author identity |

## C · Conteúdo: verificar & publicar

| # | Caso de uso | Solução | Estado | Artefato |
|---|---|---|---|---|
| C1 | **Verificar e publicar conteúdo de VÁRIAS universes** | **co**: entries + proposals + reindex (verify) → artefato imutável + ponteiro `current` (publish) | ⏳ | **§ Contrato co (abaixo)** |
| C2 | Content separado de form | markdown/data (content) + renderer (form); bakes; `bake-docs` | ✅ | [scrum-universe](./scrum-universe.md) |
| C3 | Base de conhecimento / referências como dado | neuro references + registro de autores; queryável | ✅ | neuro/references.js · authors.js |
| C4 | Identidade canônica de autor (resolve variantes) | `author=yuri` resolve "Vieira Sugano"/"Yuri"/ABNT | ✅ | neuro/authors.js |
| C5 | Docs como conteúdo renderizado | `/docs/` hub (markdown+mermaid → estático), split público/dev | ✅ | tools/bake-docs.mjs |
| C6 | Publicar rápido/fácil, escalável | folder + `draft:false`; N universes, um template | ◑ | scrum-universe |

## D · Negócio: funil → conversão → entrega

| # | Caso de uso | Solução | Estado | Artefato |
|---|---|---|---|---|
| D1 | Aquisição de lead (funil E2E) | discover→engage→intent→capture→qualify→register→convert→onboard | ◑ | [lead-acquisition](./lead-acquisition.md) |
| D2 | Conversão → provisiona Kanban (board co) | tasks API do co; board semeado no momento da conversão | ⏳ | [scrum-retrospective](./scrum-retrospective.md) |
| D3 | Entrega Scrum (cadência, roadmap/backlog, DoD) | quinzenal Thu 15h BRT; backlog/sprint como co tasks; retrospectiva | ◑ | scrum-retrospective |
| D4 | Onboarding de parceiro | BaaS: register→provision→deploy→ingest→sync→convert→satisfy | ◑ | [brain-as-a-service](./brain-as-a-service.md) §4 |
| D5 | Parceiro (ex. Scrum) referenciado, não embutido | `/scrum/` é o parceiro (draft/noindex); docs linkam | ✅ | /scrum/ |

## E · Plataforma & infra

| # | Caso de uso | Solução | Estado | Artefato |
|---|---|---|---|---|
| E1 | Escala horizontal a custo SaaS zero | Brain as a Service — universe soberana, ~1 VM cada | ◑ | brain-as-a-service |
| E2 | Liberdade de infra (qualquer domínio/máquina) | server stdlib + estático + data spec; artefato imutável portável | ✅ | brain-as-a-service §2 |
| E3 | Dado de runtime ≠ content (não commitar/servir) | geo bins build-time; `*.ndjson`/`*.enc` gitignored | ✅ | refactor geo · security |
| E4 | Revisão de segurança (o que está exposto) | índice de superfície (todos os paths + endpoints) por sensibilidade | ✅ | tools/bake-security-index.mjs |
| E5 | Conversão (registro → pagamento) | identidade + pagamento no co | ⏳ | brain-as-a-service §8 |

---

## § Contrato co — verificar & publicar conteúdo de várias universes (C1)

**O problema:** N universes precisam de uma forma **consistente** de verificar e
publicar conteúdo. Pipelines bespoke por universe não escalam. **co é a resposta** —
ele já é multi-tenant por `:slug` e tem as duas metades.

**co já tem os primitivos** (não é aspiracional):

- **Publish** (`core/deploy.rs`): cada universe publica um **artefato IMUTÁVEL**
  (`{universe_id}/{timestamp}-{suffix}`) no R2 → **deploy ID estável + URL pública**,
  com ponteiro atômico **`current`** (`co-deployments-current/{universe_id}/current`).
- **Verify**: `entries` (modelo de conteúdo) · **`proposals`** (revisão/aprovação) ·
  **`reindex`** (validar + indexar) — tudo keyed by `:slug`.

**O loop, por universe:**

```
author/sync → co entries (a universe é dona do conteúdo)
   → VERIFY:  reindex (schema) + proposals (revisão) + gates, no artefato imutável
   → PUBLISH: flip atômico do current → deploy_id   (instantâneo, sem estado parcial)
   → OBSERVE: analytics keyed by universe (rollups)
   rollback = repointar current · preview = servir o deploy_id antes do flip
```

**Por que isso resolve de fato:**

- **Verifica antes de publicar** — build do artefato imutável → gates (até preview
  URL) → só então flipa `current`. Nada vai ao ar sem verificar.
- **Atômico + reversível** — flip instantâneo; rollback = repointar. Sem estado
  intermediário quebrado.
- **Cache-first (nosso princípio)** — servir lê `current` → último artefato bom. Se a
  pipeline de build/verify cair, **o site no ar continua**. Falha de publish ≠ outage.
- **N universes, uma pipeline** — `co publish <slug>`; board do estado de todas;
  verificação cross-universe (= a visão de rede do analytics-framework).

**Mapa: a pipeline bespoke da ArteLonga → gates do co** (a ArteLonga é a *reference
implementation*; deve generalizar pra dentro do co):

| ArteLonga (hoje, bespoke) | → co (gate genérico) |
|---|---|
| `validate-yaml` (vs openapi) | `reindex` valida o schema canônico |
| `audit-handles` / `audit-consistency` | `reindex` checa refs/backlinks |
| `audit-storage-keys` / lint | gate de lint no artefato |
| `quality` CI (Playwright/a11y/Lighthouse) | passo render+gate no artefato (preview) |
| revisão humana | **proposals** (gate de aprovação) |
| bakes (`bake-*`) | o **renderer** do co (content → estático) |
| `git push → GH Pages` / `fly deploy` | **deploy** (artefato imutável + flip `current`) |

**Endpoints (co) que materializam C1:**

- `POST /api/v1/universes/:slug/entries` — conteúdo (a universe é dona).
- `POST /api/v1/universes/:slug/reindex` — verify (schema + refs + index).
- `POST /api/v1/universes/:slug/proposals` — revisão/aprovação.
- `POST /api/v1/universes/:slug/deploy` *(a especificar)* — build → artefato imutável
  + flip `current`; resposta = deploy_id + URL pública.
- `GET /api/v1/universes/:slug/deploys` *(a especificar)* — histórico/rollback.

**Lacuna honesta:** os primitivos existem; falta (1) conteúdo da ArteLonga → co
entries (ou co lê o repo git), (2) bakes → renderer do co, (3) os gates `quality` →
um passo de verify no co. Nada disso é infra nova — é fiar a pipeline já provada da
ArteLonga no modelo de universe do co.

**Reconciliação com os princípios:** *universe é dona do estado* (a universe é dona do
conteúdo; co orquestra) · *liberdade de infra* (artefato imutável + URL estável, sirva
de R2/Fly/GH Pages) · *render-at-cache* (o ponteiro `current` É a garantia cache-first).

---

## Índice de docs

- [telemetry-surfaces](./telemetry-surfaces.md) · [analytics-framework](./analytics-framework.md) · [analytics-api](./analytics-api.md)
- [universe-upgrade](./universe-upgrade.md) · [brain-as-a-service](./brain-as-a-service.md)
- [lead-acquisition](./lead-acquisition.md) · [scrum-retrospective](./scrum-retrospective.md) · [scrum-universe](./scrum-universe.md)
- Parceiro: [/scrum/](/scrum/) · Base: neuro `references.js`/`authors.js` · Backlog: `work/artelonga/AL-N.md`
