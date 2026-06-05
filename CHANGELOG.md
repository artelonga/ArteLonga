# Changelog

All notable changes to Arte Longa. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [semver](https://semver.org/) (pre-1.0 — breaking changes can happen on minor bumps).

Each release links to a *why* (the pain or opportunity it addresses) so a reader 6 months from now can reconstruct the thinking.

`AL-N` em headers de entrada refere-se a `work/artelonga/AL-N.md` — board de tarefas
co-auto. Convenção em CLAUDE.md.

---

## [Unreleased]

## [0.17.0] — 2026-06-05 — Telemetria: geo de cidade (IPv4, DB-IP CC-BY)

### Theme

Fechar o delta de granularidade geo vs. GA: **cidade** (não só país), via
DB-IP City Lite, sem inchar o repo.

### Why

GA reporta cidade/região; a surface só tinha país. Faltava o último pilar de geo.

### Added (`feat`)

- **Geo de cidade IPv4** (`tools/bake-geo.mjs --city`, `tools/surfaces-server.mjs`,
  `yuri/analytics/index.html`): resolve `país|região|cidade` no ingest a partir de
  **DB-IP City Lite** (CC-BY-4.0). Binário compacto `ip4-city.bin` (formato `AGC4`:
  starts `u32` + índice `u32` numa tabela de localidades deduplicada — 3.45M faixas,
  169k locais, ~31 MB). Verificado: `8.8.8.8`→Mountain View, IPs BR→Rio/Brasília,
  `1.1.1.1`→Sydney. Nova seção "cidades" no dashboard + **atribuição DB-IP**
  (exigida pela CC-BY). IPv6 continua em nível de país.

### Architecture

- O binário de cidade **não é commitado** (~31 MB; o set IPv6 é ~98 MB gz). O
  `Dockerfile` da surface **baixa + compila no build** (`bake-geo.mjs --city`,
  streaming via gunzip+readline pra não estourar memória), dentro da imagem, fora do
  git e do build context. **Non-fatal**: se o dataset falhar, a surface cai pra geo
  de país (binários commitados). `.gitignore` cobre `yuri/geo/*-city.bin`.

### Deploy

- `artelonga-yuri` + `artelonga-hostinger` redeployadas (build agora compila o city
  bin). Cliente inalterado (cidade é server-side).

> **Delta restante:** city IPv6 (~98 MB gz). Demais deltas vs GA: browser/OS,
> scroll, funil, coorte — todos sem comprometer privacidade.

## [0.16.0] — 2026-06-05 — Telemetria: geo IPv6, aquisição (UTM) e dispositivo — paridade com Google Analytics + runbook de upgrade

### Theme

Levar a telemetria da surface a **paridade com o Google Analytics** (sem cookies
de terceiros, sem cross-site, self-hosted) e documentar de forma **reproduzível**
como uma universe é promovida de path pra CNAME.

### Why

A geo só cobria IPv4 — parte relevante do tráfego (mobile/moderno) ficava sem
país. E faltavam pilares do GA: **aquisição** (campanha/origem) e **dispositivo**.
Fechados aqui. Além disso, o upgrade `/yuri` → `yuri.artelonga.com.br` precisava de
um runbook executável pra ser repetível com outros parceiros.

### Added (`feat`)

- **Geo IPv6** (`tools/bake-geo.mjs`, `tools/surfaces-server.mjs`): segundo binário
  `yuri/geo/ip6-country.bin` (formato `AG61`, 273k faixas, 4.69 MB) — starts de 16
  bytes big-endian + busca binária via `Buffer.compare`; parser de IPv6 (trata `::`,
  IPv4 embutido). `geoCountry` despacha v4/v6. Verificado: `2001:4860:4860::8888`→US,
  `2804:…`→BR, Cloudflare→US, loopback→null.
- **Aquisição / UTM** (`yuri/telemetry.js`, `surfaces-server.mjs`): UTM de primeiro
  toque (sessionStorage) enviado no pageview; servidor agrega origem
  (`utm_source` → referrer → "(direto)"). Nova seção "aquisição" no dashboard.
- **Dispositivo** (`surfaces-server.mjs`): categoria mobile/tablet/desktop derivada
  do viewport (sem custo no client, sem dataset). Nova seção "dispositivo".

### Docs

- **`docs/universe-upgrade.md`** (novo): runbook **reproduzível** path→CNAME (DNS na
  Hostinger, app/volume/cert Fly, deploy gate, continuidade de telemetria via Option
  C, checklist de verificação com comandos, rollback) — ancorado nos artefatos reais
  do yuri.
- **`docs/telemetry-surfaces.md`**: **matriz de paridade com o GA4** (§7) — igual ou
  acima no core que respeita privacidade; pilares de vigilância (demografia via
  Google Signals, audiências cross-site) omitidos por princípio. Deltas abertos
  (cidade, browser/OS, scroll, funil, coorte) listados. Geo §2 atualizado pra v4+v6;
  shape de `/api/telemetry` com `acquisition`/`devices`/`visitors`/`returning`.

### Deploy

- `artelonga-yuri` e `artelonga-hostinger` redeployadas (binários geo v4+v6,
  aquisição, dispositivo). `telemetry.js?v=` → `20260605b`.

> **Pendente:** deltas de granularidade vs GA (geo cidade, browser/OS, scroll,
> funil, coorte) — incrementais, nenhum exige comprometer privacidade. Metade co da
> Option C segue pendente (`telemetry-surfaces.md §3`).

## [0.15.0] — 2026-06-05 — Telemetria: paridade de observabilidade nas surfaces + gráfico de tempo no dashboard apex

### Theme

Fechar a lacuna de observabilidade entre os **dois sistemas de telemetria** (ver
`docs/telemetry-surfaces.md`): o apex `artelonga.com.br` (co, rico — timeseries,
geo, retenção) e as **surfaces universe-owned** (CNAME como `yuri.artelonga.com.br`,
que até então só contavam pageviews/cliques). Quando um parceiro é promovido de
path (`/yuri/`) pra surface própria, a observabilidade não pode regredir nem
quebrar a série temporal — esta release traz a surface à paridade e arruma o
gráfico de tempo do dashboard público.

### Why

`/yuri` migrou pra CNAME (`yuri.artelonga.com.br`), passando da telemetria do co
(timeseries/geo/retenção) pra NDJSON da surface (só contagens). O upgrade
*regredia* a observabilidade e *partia* a série no corte. Além disso o gráfico de
tempo do apex ficava sem eixo X além de 14 dias e não filtrava nada ao clicar.
Este é o **substrato da Option C** (edge dono do raw + rollups consentidos pro co)
documentada em `docs/telemetry-surfaces.md §3`.

### Added — geo embarcado, retenção, dwell, timeseries e conversões na surface (`feat`)

- **Geo país embarcado** (`tools/surfaces-server.mjs`, `tools/bake-geo.mjs`): país
  resolvido no ingest de `/api/track` a partir de `Fly-Client-IP`, via binário CC0
  compacto (`yuri/geo/ip4-country.bin`, formato `AG41`, 341k faixas, busca binária
  stdlib). Self-hosted, sem chamada externa por request, **IP cru nunca persistido**
  — só o país. Substitui o GeoLite2 (license key + proíbe redistribuição em repo
  público) pelo dataset `ip-location-db` (domínio público).
- **Visitante persistente + retenção** (`yuri/telemetry.js`): `al_vid` em
  localStorage + cookie no apex `.artelonga.com.br` — **ponte de identidade** com o
  cliente do apex, sobrevive ao upgrade path→CNAME. Habilita visitantes únicos e
  novo/recorrente.
- **Dwell / tempo ativo** (`page_end`): mede ms visíveis (visibilitychange/pagehide),
  envia o delta sem dupla contagem. Habilita tempo ativo médio e taxa de rejeição.
- **Timeseries diário + conversões** (`teleAgg`): série diária de pageviews;
  conversões via regras de goal built-in (resume/contato/github/linkedin) e
  `[data-goal]`, sem precisar editar HTML.
- **Dashboard da surface à paridade** (`yuri/analytics/index.html`): 8 cards
  (pageviews, visitantes, recorrentes, sessões, rejeição, tempo ativo, conversões,
  países), gráfico de tempo (meses no eixo, data exata no hover, clique filtra a
  atividade recente por dia), geolocalização por país e conversões. Agregação entre
  surfaces irmãs preservada (`teleCombine`).

### Added — gráfico de tempo do dashboard apex (`feat`)

- **Eixo X em meses + data exata no hover** (`analytics/index.html`): rótulos por
  mês em janelas longas (antes em branco além de 14 dias); readout com a data
  completa e contagem.
- **Clique na barra filtra os dados abaixo**: chip de dia, KPIs/top-pages/recentes
  por dia. Feature-detecta `?from`/`&to` no co — usa o slice do backend assim que
  ele existir; até lá recomputa o dia a partir de `/recent` (client-side).

### Fixed (`fix`)

- Gráfico de tempo do apex sem rótulos de eixo além de 14 dias → meses sempre
  visíveis (`analytics/index.html`).

### Docs

- **`docs/telemetry-surfaces.md`** (novo): mapa dos dois sistemas, contrato dos
  endpoints da surface (`/api/track`, `/api/feedback`, `/api/telemetry`), formato do
  binário geo, **design de convergência (Option C)** + schema de rollup + runbook do
  upgrade de parceiro.
- **`docs/analytics-api.md`**: status → LIVE; shape real do `summary`
  (`as_of`/`window_days`); documenta os params planejados `from`/`to`/`universe`;
  flag do bug `session_avg_ms ≈ 4ms` e do skew de IPs de datacenter no geo.

### Deploy

- Surfaces `artelonga-yuri` e `artelonga-hostinger` redeployadas (servidor +
  `yuri/` + binário geo). `telemetry.js?v=` bumpado pra `20260605a` nas 3 HTMLs.
- Dashboard apex (`analytics/index.html`) + docs vão pro `main` (GH Pages) via PR.

> **Pendente (próxima):** a metade co da Option C — endpoint de ingest de rollup
> por universe e os params `?from`/`&to`/`?universe` no `summary` (repo `co`).

## [0.14.0] — 2026-05-20 — Phase C wave 4-8 close (modular data, TypeScript runtime, OpenAPI codegen, signup integration, dist cleanup)

### Theme

Phase C of the cross-repo refactor lands ten user-stories (AL-51 through AL-60) into a single semver-meaningful release. Three converging threads:

1. **Modular data layer** (AL-53, AL-54) — `assets/data.js` (3372 LOC) split into six per-collection modules; bootstrap loads only what each page needs (`/solucoes/` drops 70% of payload).
2. **TypeScript runtime + OpenAPI as single source of truth** (AL-55, AL-56) — `analytics.js` + `al-signup.js` migrated to TS; `openapi/artelonga.yaml` drives `src/types.gen.ts` via `npm run gen-types`; pre-commit hook detects drift.
3. **Auth + ecosystem integration** (AL-50, AL-51, AL-52, AL-57, AL-58, AL-59, AL-60) — `/entrar/` signup flow bridges to CO via email magic-code, dist artifacts dropped from version control, analytics aligned with `STORAGE_KEYS` from AL-53.

### Why

ArteLonga was the largest non-CO repo in the audit (74 .js files, hand-maintained data, no type system). Phase C made the site (a) faster to render (per-page bundles), (b) safe to evolve (TS + OpenAPI), (c) auth-ready against the broader CO ecosystem. Release-tag aligns the deploy with the ecosystem-wide integration verification milestone.



### Refactored (AL-54: Split assets/data.js into per-collection modules)

`assets/data.js` (3372 LOC, 122KB) dividido em seis módulos independentes:
`data.people.js`, `data.communities.js`, `data.services.js`, `data.solutions.js`,
`data.missions.js` e `data.finances.js` — cada um auto-gerado pelo bake script correspondente.
`data.core.js` (hand-maintained) lê de `window.AL.*` e exporta todas as funções e derivações.

`bootstrap.js` atualizado com lógica URL-based: carrega apenas os módulos que cada página
precisa. Exemplos: `/` carrega people + communities + services + finances + core (105KB, -14%);
`/solucoes/` carrega só solutions + core (37KB, -70%); `/contato/` carrega só core (24KB, -80%).

`window.AL` API surface preservada integralmente — comportamento runtime idêntico.
Todos os seis bake scripts atualizados para dual-write (data.js + arquivo per-collection).
Pre-commit hook estendido para verificar drift em ambos os formatos. `V` bumped em `bootstrap.js`.

### Refactored (AL-56: Migrar analytics.js e al-signup.js para TypeScript)

`assets/analytics.js` e `assets/al-signup.js` migrados de vanilla JS para TypeScript em
`src/runtime/analytics.ts` e `src/runtime/al-signup.ts`. Comportamento em runtime preservado
bit-a-bit — ambos compilados para IIFE via novo `vite.runtime.config.ts` (lib mode, sem
minificação). `build:runtime` adicionado ao `package.json`; integrado ao `npm run build`.

APIs públicas (`window.AL_track`, `window.AL_analytics`, `window.AL_experiments`) tipadas em
`src/types.ts` como interfaces `ALAnalyticsAPI`, `ALAnalyticsInfo`, `ALExperimentsAPI` com
declaração global no `Window`. `analytics.ts` importa `STORAGE_KEYS` de `src/lib/storage-keys`
(AL-53), eliminando strings mágicas. `V` bumped em `bootstrap.js`.

### Added (AL-55: OpenAPI codegen para src/types.ts)

`openapi-typescript` adicionado como devDep. `npm run gen-types` gera `src/types.gen.ts` a partir de
`openapi/artelonga.yaml` (single source of truth). `src/types.ts` reduzido a re-exports dos tipos
gerados + tipos UI-only sem equivalente no schema (`FaixaPreco`, `FaixaPlano`, `EssayItem`,
`DefaultLocation`, `UniverseData`). `npm run gen-types` integrado ao início de `npm run bake`.
Pre-commit hook estendido para detectar drift entre `openapi/artelonga.yaml` e `src/types.gen.ts`.

OpenAPI schema também corrigido: campos faltantes adicionados a `Person` (`deathDate`, `bioHidden`,
`bioAudio`, `emBreve`, `aposentado`, `underage`, `muted`, `site`, `essaysTitle`), `Community`
(`bioCurta`, `muted`, `emBreve`, `emMemoria`), `Service` (`children`, `descNossa`, `summary`,
`nome`), `Contacts` (`whatsappDisplay`, `instagram`), `PortfolioPoem` (`autor`); campos `required`
ajustados nos schemas de finance (`FinanceCost.breakdown`, `FinanceRecurrentItem`,
`FinanceRampaItem`, `FinanceProject`); novo schema `FinanceProBono` para itens pro-bono.

### Added (AL-50: signup form — email magic-code flow com CO account)

Nova página `/entrar/` com fluxo de autenticação em dois passos: email → código mágico de 6 dígitos.
Integra com o endpoint CO-205 (`/api/v1/auth/onboard-with-email`) já live em `co.artelonga.com.br`.
Ao confirmar o código, um cookie de sessão é setado no domínio `.artelonga.com.br`, dando acesso ao
ecossistema CO (co.artelonga.com.br, quilomboaraucaria.org via SSO bridge). Origin `artelonga` é
enviado para analytics e tracking de campanhas.

**`/entrar/index.html`** (NEW): dois painéis alternados — passo 1 (email + Google OAuth) e passo 2
(código + reenvio com cooldown de 60s + editar email). Estilos inline seguindo o padrão `.fp-form`
da `/faca-parte/`. Carrega `al-signup.js` via `<script defer>`. Mobile responsive ≤ 768px.

**`assets/al-signup.js`** (NEW): módulo vanilla JS que orquestra todo o fluxo — POST para
`onboard-with-email`, transição email→code, POST para `verify`, redirect para `/` no sucesso,
inline error sem roundtrip para email inválido, cooldown de reenvio, Google OAuth start.
Na carga da página, verifica `/auth/me` e redireciona para `/` se já autenticado.

**Header auth indicator**: `SiteHeader.ts` ganhou `#al-header-auth` placeholder e `initHeaderAuth()`.
Na home, após o render, faz fetch de `/api/v1/auth/me` — se logado mostra "Olá, {nome} · Sair",
se deslogado mostra "Entrar →" apontando para `/entrar/`. Logout chama `POST /auth/logout` e recarrega.

**`assets/site.css`**: novos seletores `.site-header-nav`, `.site-cta-entrar`, `.al-auth-greeting`,
`.al-auth-logout` para suportar o estado de autenticação no header da home.

---

## [0.13.0] — 2026-05-11

**Why**. Estabelecimento do board de tarefas `work/artelonga/` (co-auto compatível)
e onda concentrada de fundação técnica: LGPD compliance via per-handle YAML (AL-1/2/26/27/46
fecham o ciclo content/form para todo o domínio editável), TS strict + Vite build em vez
de renderer.js monolítico (AL-23), persistência server-side de leads (AL-4), memory system
durável (AL-3), audit automation + STATE auto-regen (AL-44), quality gates em CI com
Playwright + axe + Lighthouse (AL-45, AL-49), SEO baseline com JSON-LD + sitemap (AL-47),
e ativação do endpoint de analytics + popularity ranking de serviços (AL-48).

### Fixed (AL-49: Quality budget close-the-gap — a11y contrast + SEO + CLS + perf)

**A11y (axe color-contrast re-enabled):** Todos os tons de cinza usados em texto
foram bumpeados para atingir WCAG AA 4.5:1 nos 3 arquivos CSS globais:
`#888` → `#666`, `#999` → `#5a5a5a`, `#aaa` → `#767676`, `#777` → `#666`,
`#bbb`/`#ccc`/`#c0c0c0` em texto → `#767676`. Easter egg `.profile-bio-hidden > summary`
trocado de `#f2f2f2` para `color: transparent` (axe pula elementos transparentes).
Separadores decorativos (`.sep`) em SiteFooter.ts e contato/index.html receberam
`aria-hidden="true"`. Regra `color-contrast` re-habilitada em `tests/e2e/smoke.spec.ts`.

**SEO (Lighthouse ≥ 0.95):** `src/lib/seo.ts` agora injeta `<meta name="description">`
além de og:description e twitter:description — resolve ausência do meta-standard que
Lighthouse verifica. `/contato/index.html` ganhou `<meta name="description">` estática.

**CLS (contato/ 0.224 → ≤ 0.1):** Logo `<img>` em `SiteHeader.ts` e
`contato/index.html` recebeu atributos `width="58" height="36"` — dimensões *renderizadas*
pelo CSS (`.site-brand img { height: 36px; width: auto }`), não as intrínsecas do PNG
(340x212). A correção inicial usando os 340x212 reservava um box gigante que depois
encolhia para ~58x36, *piorando* o CLS. Critical shell CSS (site-header/main/footer
baseline) também passou a ser inlined em `<style>` de `/contato/` para evitar shift
quando `site.css`/`pages.css` carregam via bootstrap.js assíncrono.

**LHCI estratégia híbrida:** `.lighthouserc.cjs` mantém só métricas estruturais
como `error` — `categories:accessibility` e `cumulative-layout-shift` (determinísticos
por SHA). Métricas temporal (`performance`, `largest-contentful-paint`, `seo`,
`best-practices`, `total-byte-weight`) ficam `warn` por evidência empírica de variance
amplificada em runners compartilhados (L-023). AL-49 Phase 5 ("restore all error")
rejeitado — próxima tentativa de tighten requer runner dedicado ou numberOfRuns ≥ 5
(fica em AL-50 se valer).

**Por que:** AL-45 estabeleceu pipeline com budgets aspirational mas baseline real
não atingia os números; AL-48 relaxou para warn para desbloquear merge. AL-49 fecha
cada gap estrutural e restaura gates como `error` para prevenir regressões futuras.

### Added (AL-48: Analytics activation pipeline)

`assets/analytics.js` ENDPOINT ativado: eventos coletados em localStorage agora
são enviados via batch POST para `https://co.artelonga.com.br/api/v1/telemetry/events`
(CO-177 CORS + universe_key wired). Fila local continua como buffer; backoff
exponencial mantém resiliência a falhas de rede.

`.github/workflows/bake-popularity.yml` adicionado: roda diariamente às 04h UTC
(e via `workflow_dispatch`) buscando
`/api/v1/analytics/public/popularity?prefix=/servicos/&days=30` e commitando
`assets/popularity.json` com `jq -S` (sorted keys para diff limpo). Usa
`stefanzweifel/git-auto-commit-action@v5`; só commita se o arquivo mudou.

`assets/popularity.json` adicionado como seed inicial `{ "items": [] }` para que
a página home não quebre antes do primeiro bake nightly.

`src/pages/home.ts` atualizado: `render()` passou a ser `async`. Carrega
`/assets/popularity.json` antes de montar o grid; se ausente ou com erro HTTP,
usa `{ items: [] }` como fallback (sort alfabético). Serviços de topo são
ordenados por `views desc` com tie-break `localeCompare` pt-BR. `renderer.js`
reconstruído via `npm run build:renderer`.

`/analytics/` dashboard já consumia `ENDPOINT_BASE` correto e já tinha fallback
localStorage — nenhuma mudança de JS necessária.

**Por que:** CO-177/178/179/180 mergeadas em 2026-05-11 desbloqueiam todas as
4 sub-tasks. Ranking empírico de serviços substitui ordem de inserção; telemetria
passa a fluir em tempo real para o backend.

### Added (AL-47: SEO + public polish — structured data, OG, sitemap, robots)

`src/lib/seo.ts` adicionado: helper `setPageSEO()` injeta no `<head>` canonical
URL, OG meta tags (og:title, og:description, og:image, og:url, og:type,
og:site_name), Twitter Card tags (twitter:card, twitter:title, twitter:description,
twitter:image) e JSON-LD `<script type="application/ld+json">`. Tags anteriores
removidas antes de cada injeção via `[data-seo]` sentinel.

Cada page module (`home`, `profile`, `service`, `poem`, `essay`, `servicos`,
`solucoes`, `recursos`, `parceiros`) chama `setPageSEO()` com schema JSON-LD
apropriado: WebSite + Organization na home, Person/Organization no profile,
Service no detalhe de serviço, CreativeWork no poem, Article no essay.

`assets/og-default.png` criado (1200×630 branco) como fallback para OG image.
Profile emite a foto do perfil como OG image quando `profile.yaml.pic` está
preenchida.

`tools/bake-sitemap.mjs` adicionado: carrega `assets/data.js` via `createRequire`,
enumera todas as URLs públicas (home, pessoas, comunidades, serviços, missões,
soluções internas, portfolio items não-draft) e gera `sitemap.xml`.
`npm run bake-sitemap` adicionado; integrado ao combo `npm run bake`.

`robots.txt` criado declarando sitemap em `https://artelonga.com.br/sitemap.xml`.

**Por que:** páginas indexadas sem structured data aparecem com snippet genérico
no Google e sem preview em shares sociais. JSON-LD + OG + sitemap habilitam
rich results (Person card, Service schema) e preview profissional em WhatsApp e
LinkedIn sem mudança de infraestrutura (site ainda estático).

### Refactored (AL-46: Content/form completeness — services + missions + solutions + finances → YAML)

`assets/data.js` agora tem ~90% do conteúdo AUTO-GENERATED a partir de YAMLs per-item.
Quatro content types migrados do hardcode para fonte YAML editável:

- **Services (89):** `servicos/<slug>/service.yaml` × 89 — `serviceCatalog` vira bloco
  `AUTO-GENERATED:SERVICES-START/END`. `tools/bake-services.mjs` + `tools/services-order.txt`.
- **Missions (4):** `missoes/<slug>/mission.yaml` × 4 — `missions` vira bloco
  `AUTO-GENERATED:MISSIONS-START/END`. `tools/bake-missions.mjs` + `tools/missions-order.txt`.
  Criadas shells HTML para as 3 missões que não tinham diretório (`gres-amazonia`,
  `reparacao-historica`, `eventos-espacos-saberes`).
- **Solutions (9):** `solucoes/<handle>/solution.yaml` × 9 — `solutions` vira bloco
  `AUTO-GENERATED:SOLUTIONS-START/END`. `tools/bake-solutions.mjs` + `tools/solutions-order.txt`.
- **Finances:** `recursos/finances.yaml` — bloco `AUTO-GENERATED:FINANCES-START/END`.
  `tools/bake-finances.mjs`.

`npm run bake` atualizado para rodar todos os 6 bakes em sequência.
`tools/pre-commit-check.mjs` atualizado para incluir os 4 novos bakes.
`tools/validate-yaml.mjs` estendido com suporte a `--type=service|mission|solution|finance`
(142 arquivos validados contra `openapi/artelonga.yaml` schemas).
Schemas `Service`, `Mission`, `Solution`, `Finances`, `Platform`, `Attachment`, `ServicePlan`
adicionados/refinados em `openapi/artelonga.yaml`. `CLAUDE.md` atualizada com 4 novas
seções "Como editar". V bumped para `20260511a`.

**Por que:** AL-1/AL-2/AL-26 estabeleceram o pattern YAML para people/communities/portfolio.
Essa migração fecha o loop: toda a content layer de data.js é agora editável via YAML,
com schema validation pre-bake. Adicionar serviço = editar YAML + bake — sem edição manual
em data.js. Mata L-021 de raiz para as 4 novas seções.

### Added (AL-45: Test + quality infrastructure — Playwright + axe + Lighthouse CI)

Pipeline de qualidade automática para PRs: `tests/e2e/smoke.spec.ts` cobre 9 páginas com
Playwright (status 200, sem L-002 fallback, sem JS errors, h1 correto) + `@axe-core/playwright`
(zero violações axe critical/serious, exceto `color-contrast` desabilitado como baseline issue).
`.lighthouserc.js` define budget de performance/SEO/a11y. `.github/workflows/quality.yml` roda
em todo PR e push. Baseline issue documentada: `color-contrast` generalizado no CSS (cinzas
leves — fix em PR separado).

**Por que:** regressões de UX, a11y e performance eram detectadas apenas em smoke test manual
pós-merge. Essa pipeline unifica 3 concerns (smoke, a11y, perf) em um único gate de PR.

### Added (AL-44: Audit + automation hardening — handles + STATE auto-regen)

`tools/audit-handles.mjs` adicionado: itera todas as referências de handle em
`data.js` (service.responsavel, citacoes.autor, subMembers, parentHandle,
communities, community.membros, parcerias.de, parcerias.contribuicoes.quem) e
valida que cada handle resolve via `AL.get()`. Exit 1 lista cada referência
órfã com source path. Previne typos de handle e referências a perfis removidos.

`npm run audit-handles` adicionado ao `package.json`. Combo `npm run audit`
extendido para incluir audit-handles (passa a rodar audit-shells + audit-consistency
+ audit-handles em sequência).

`.github/workflows/bake-state.yml` adicionado: roda `tools/bake-state.mjs`
no primeiro dia de cada mês (cron `0 3 1 * *`) + via `workflow_dispatch` manual.
Commita `docs/STATE.md` automaticamente se houve drift, via
`stefanzweifel/git-auto-commit-action@v5`. Mantém STATE.md current sem intervenção.

CLAUDE.md documentado com ambos (`## Audits` + `## GitHub Actions`).

**Por que:** audit-handles fecha lacuna onde typo em handle passava por todas
as validações existentes e só explodia em runtime. STATE.md estaria stale
indefinidamente sem o workflow de auto-regen mensal.

### Refactored (AL-27: Migrar Alice essays inline → portfolio[kind=essay] + renderEssay)

`alice/profile.yaml` substituiu os campos legado `essaysTitle` + `essays[]` por
`portfolio: [{kind: essay, slug, titulo, short, body, draft: true}]` × 8 — mesma
abstração de `PortfolioItem` estabelecida em AL-26 para poemas. `src/pages/essay.ts`
adicionado como renderer de essay individual em `/<handle>/<slug>/` (espelho de
`poem.ts`, typography editorial). Dispatcher atualizado com `essay` case. Todos os
8 ensaios permanecem `draft: true` até texto real chegar; shells HTML não criadas
enquanto drafts (L-007 não se aplica a conteúdo não publicado).

**Por que:** o shape ad-hoc `essays[]` impedia a abstração unificada de peças autorais
(`PortfolioItem`). Agora poem e essay consomem a mesma infra: bake derive + dispatcher
+ URL pattern `/<handle>/<slug>/`.

### Refactored (AL-23: Migrar renderer.js para componentes TS modulares)

`assets/renderer.js` (~1900 linhas de JS vanilla) extraído para módulos TypeScript estritos em `src/`. Componentes tipados com interfaces do `src/types.ts`; cada página vira um módulo independente; dispatcher com readyState check (L-001) e try/catch (L-002). Build pipeline Vite produz o bundle final `assets/renderer.js`.

**Estrutura criada:**
- `src/lib/` — helpers puros: `esc`, `norm`, `slugify`, `anglicism`, `markdown`, `ui`
- `src/components/` — 11 componentes: `Badge`, `Button`, `FilterChip`, `ToggleChip`, `ServiceCard`, `ProfileCard`, `EmptyState`, `SearchInput`, `LocationInput`, `SiteHeader`, `SiteFooter`
- `src/pages/` — 8 page modules: `home`, `parceiros`, `servicos`, `solucoes`, `recursos`, `profile`, `service`, `poem`
- `src/dispatcher.ts` — lazy imports por `body[data-page]`; async try/catch
- `src/showcase.ts` — popula `/design/` com componentes reais (não HTML mock)
- `vite.config.ts` + `vite.renderer.config.ts` — dois targets: IIFE → `assets/renderer.js`, ESM → `dist/showcase.js`

**Por que:** renderer monolítico de ~1900 linhas dificultava onboarding, reuso e testes. Agora cada componente tem interface estrita compilada; bugs de shape (typo em field name, props erradas) aparecem em compile time em vez de runtime. `/design/` palette usa os mesmos componentes que o site em vez de HTML mock.

### Added (AL-4: /contato/ persiste leads no co backend)

Form de `/contato/` substitui `mailto:` por POST para `https://co.artelonga.com.br/api/v1/leads`. Submissão bem-sucedida mostra "Enviado ✓" e exibe bloco de confirmação. Falha de rede mostra "Falhou — tente de novo" + link `mailto:` como recuperação (nenhum lead perdido). Privacy notice LGPD visível antes do submit (retenção 24 meses, contato para exercício de direitos). Backend (CO-183) persiste em SQLite com `created_at`, `status='new'` e `ip_hash` (daily-salt, nunca IP bruto); dispara email notification pra `rede@artelonga.com.br`. Admin queue em `co.artelonga.com.br/admin/leads`.

**Por que:** `mailto:` perdia leads sem feedback (usuário sem cliente de email default, falha silenciosa no envio). Persistência server-side cria queue auditável + admin dashboard + notification — sem perder nenhuma demanda nem comprometer fallback offline.

### Added (AL-3: Memory system — docs/LESSONS.md + docs/STATE.md + CLAUDE.md)

Catálogo append-only de anti-patterns extraídos do histórico de commits em
`docs/LESSONS.md` (cresce ao longo do tempo; veja arquivo para conteúdo atual). Snapshot auto-gerado do projeto em
`docs/STATE.md`, produzido por `tools/bake-state.mjs` (Node.js, sem deps
externas; determinístico no mesmo dia). Section "Lições críticas" adicionada
ao `CLAUDE.md` com as 7 lessons mais load-bearing inline.

**Por que:** padrões repetidos (DCL race, render silencioso, URL sem shell,
dado multi-tenant) só viviam implícitos em CHANGELOG.md + commit messages. Um
dev ou agente novo precisava ler centenas de commits pra entender convenções
estabelecidas. Agora: 4 docs, 4 camadas mentais, sem ler 30 commits.

### Refactored (AL-1 + AL-2: LGPD per-handle YAML migration · template)

Tanto perfis de membros (AL-1, 36 entries) quanto comunidades parceiras (AL-2, 3 entries) tem agora arquivo individual por handle (`<handle>/profile.yaml`, `<handle>/community.yaml`) como source of truth, substituindo os arrays `people` e `communities` hardcoded em `assets/data.js`. Exercício do Art. 18 LGPD (acesso, correção, deleção) é viável via PR na pasta do handle. `data.js` continua sendo o artefato consumido pelo renderer — comportamento runtime zero-alteração.

Estabelece **template repetível** pra futuros refactors de "separate content from form" (services, missions, leads, etc):

1. Source: `<handle>/<type>.yaml` (YAML puro, bio em literal block scalar `|`).
2. Build: `tools/bake-<type>.mjs` determinístico — lê todos os YAMLs, regenera bloco `AUTO-GENERATED:<TYPE>-START/END` em `data.js`.
3. Order: `tools/<type>-order.txt` define ordem canônica.
4. Validate: `node -e "require('./assets/data.js')"` no fim do bake.
5. CHANGELOG entry + V bump em `assets/bootstrap.js`.
6. `CLAUDE.md` raiz atualizado com instrução de "como editar".

Detalhes:
- **`<handle>/profile.yaml`** — 36 arquivos (pessoas, negócios, referências históricas).
- **`<handle>/community.yaml`** — 3 arquivos (quilomboaraucaria, hfsassociados, hedix).
- **`tools/bake-people.mjs` + `tools/bake-communities.mjs`** — scripts determinísticos.
- **`tools/people-order.txt` + `tools/communities-order.txt`** — ordens canônicas.
- **`assets/data.js`** — seções `people` e `communities` marcadas `AUTO-GENERATED`; suporte a `globalThis` pra validação com Node.js.
- **`package.json`** — `js-yaml` devDependency + scripts `bake-people`, `bake-communities`, `bake` (combo).

**Por que:** dado multi-tenant (perfis de 36+ pessoas) em arquivo único violava o princípio de propriedade do LGPD — exercício do Art. 18 (acesso, correção, deleção) exige scope per-handle. Migração para `<handle>/profile.yaml` cria pasta auditável por dono, viabiliza PR delegado, e estabelece o template para os refactors subsequentes (services AL-46, portfolio AL-26/27). L-009 documentada.

---

## [0.12.0] — 2026-05-10

**Why**. Pivot product-oriented (marketplace de serviços focado no contratante,
em vez de catálogo institucional) + fundação de medição: home reorientada,
analytics frontend Fase 1 (`assets/analytics.js` self-hosted com A/B framework),
perfil editorial do Yuri ("Terra" + ShowAll mode), refactor estrutural do catálogo
(serviceCatalog como fonte única, ponte missão↔serviço, CNAE completo cobrindo
58 de 67 serviços), modelo financeiro alinhado em três cards (custos/meta/potencial)
e introdução de Alice/Ramona/Miguel/Hedix como entidades novas. Trabalho concentrado
entre 2026-04-28 e 2026-05-10 — período imediatamente anterior ao board co-auto.

### Changed (pivot product-oriented · marketplace de serviços)

Site reorientado de catálogo institucional para **marketplace de serviços** focado no contratante. Direção definida pelo feedback de mercado (Jack Dorsey: "reduzir elementos ao mínimo, cada um o mais perfeito"; liquidez via recorte geográfico; 5 segundos de atenção).

- **Home** vira o marketplace: hero "Serviços / Desenvolvemos a solução pro seu problema / São Paulo · Jardim Umarizal" + busca dinâmica fuzzy (filtra enquanto digita) + 8 supercategorias como chips (Eventos, Digital, Educação, Bem-estar, Casa, Negócios, Alimentação, Audiovisual) + grid de cards. Sem botão de submit, sem menu de 3 abas. ICP geográfico declarado.
- **Personas separadas**: cliente (contratante) é o destaque principal; prestadores ficam no rodapé "Quem está por trás" — sem competir pela atenção. `/parceiros/` segue acessível mas fora do funil de contratação.
- **`/servicos/<slug>/` product-oriented**: título, "pra quem · faixa de preço", quem fornece, CTA único (Pedir orçamento ou Falar conosco) com mailto pré-preenchido, seção Exemplos e relacionados. **Saem CNAE, "Em soluções", "Em missões"** — info de backoffice.
- **Catálogo de serviços ganha 3 campos**: `paraQuem`, `faixaPreco`, `isPortfolio`. Portfolio (intersecção serviço × pessoa, ex.: Tortas Salgadas da Veh, Hambúrguer Artesanal) ganha badge discreto + CTA de orçamento; serviços de catálogo genérico ficam com CTA de contato. Quilombo Araucária listado como exemplo em Desenvolvimento Web, Design, Desenvolvimento de API, Privacidade e Segurança e Criação de Conteúdo (este último → /relatos/).
- **Footer global "Quem está por trás"** (Parceiros · Sobre · Próximos passos) replicado em todas as páginas — renderizadas e estáticas.
- **Conteúdo de fundamento vai pra docs**: tese de descentralização, GPL/GNU, universos com TAM/SAM/SOM, receita 3-fontes saem do site público (`/oportunidade/` e `/proximos-passos/`) e ficam em `docs/oportunidade-tese.md` e `docs/proximos-passos-tese.md`. Auditável em version control, fora do funil do cliente.
- **`/sobre/` simplificada**: saem Razão Social, CNPJ, Natureza Jurídica, Porte, Data de Abertura, Capital Social e a colapsável CNAE. Fica História, Manifesto, Endereço, Email. CSS morto também limpo.
- **`/oportunidade/` drasticamente enxuta**: lead curto + termos (CDI conversível, dashboard, projeção R$75k) + contato. Sem tese, sem fluxo, sem pilares, sem universos table, sem GPL Q2.
- **`/proximos-passos/`** sem o marco GPL Q2 (movido pra docs); transparência contábil sem mencionar CNAE.
- **`/solucoes/`** sai do menu da home; segue acessível por URL pra não quebrar links antigos.
- **CSS pages.css** ganha `.market-*` (hero, busca, supercats, cards, footer global) e `.svc-*` (badge, meta, CTA, exemplos). Cache busted em todas as ~115 shells estáticas: `pages.css` / `renderer.js` / `data.js` → `?v=20260523`.

### Changed (yuri descrição inicial · jacdias · ShowAll agrupado · UX editorial)

- **Yuri**: nova descrição inicial em `bioCurta` + primeiro parágrafo da `bio` ("Filho de Kiyoshi e Soninha e fascinado por todos que me inspiram. Como neurocientista, busco compreender a consiencia. Como ser humano, busco compreender os saberes ancestrais. Trabalho com desenvolvimento de tecnologia sustentavel."). Card teaser deixa de ser a primeira linha do poema e passa a ser a descrição prosa.
- **José Antônio**: bio ganha link para [jacdias.com.br](https://jacdias.com.br/) após a menção ao livro *Esperança — uma utopia possível*.
- **`/parceiros/#ShowAll` agrupado**: ao invés de uma lista plana única, agora três blocos com cabeçalho:
  1. **Parceiros** (top-level rosterOrder · 18)
  2. **Família e próximos** (sub-membros via `parentHandle` · 4: Alicia, John, Kiyoshi, Soninha)
  3. **Quilombo Araucária** (membros únicos da comunidade · 8: Antony, Bia, Ken, Quinho, Tião, Veh, Carlinhos, Mara Brandão) — cabeçalho linka para `/quilomboaraucaria/`. Membros que já aparecem em "Parceiros" são filtrados para evitar duplicação.
- **Intro do ShowAll**: substituída por **`{n} caminhos…`** dinâmico (30 hoje), em uppercase tracked.
- **Link de retorno**: "← voltar para a rede com papéis" → "← papéis e serviços".
- **UX editorial nos links da bio**: `.profile-bio a` e `blockquote.profile-bio-quote a` ganham underline pontilhado fino, herdando a cor do texto. Em hover, o pontilhado vira sólido. Links na bio (incluindo "todos que inspiram", a citação Rerum Novarum e o jacdias.com.br) ficam discretos, alinhados ao tom editorial — sem o azul vivo padrão do browser.

Cache-buster `?v=20260501` em `data.js` + `renderer.js` + `components.css`.

### Changed (yuri · revisão da bio + ShowAll mode em /parceiros/)

**Bio do Yuri** — pequenas reescritas e quebras:
- Reordenação: "O eu não se faz de reconhecimento ou recompensa. Não é sobre mim." promovida a parágrafo próprio, antes de "Nao chamavam-se".
- Quebras de linha dentro da estrofe "Nao chamavam-se" — uma linha por unidade (japoneses ou nordestinos / africanos ou indígenas / Eram gente, como a gente / Sem nome).
- "e o ioruba" → "èdè Yorùbá" (Òrìşà èdè Yorùbá — termo originário, não a versão portuguesa).
- "Para de tentar traduzir o que só se pode sentir com presença e atenção ao experienciar" → "Sem tentar traduzir o que so presenca e atencao te permitem sentir,".
- Última estrofe quebrada: "Chuva é tupã mandando descansar, autocuidado nhane noite" + parágrafo final isolado **"Jaxy pyau"** (frase de fecho).
- "todos que inspiram" virou hyperlink → `/parceiros/#ShowAll`.

**`/parceiros/#ShowAll`** — novo modo no roster de parceiros:
- Lista plana de todas as pessoas (`AL.people` exceto `referenceOnly`), ordenada alfabeticamente em pt-BR.
- Inclui: parceiros de nível superior, sub-membros (Alicia, John, Kiyoshi, Soninha) e membros de comunidades (Antony, Bia, Ken, Quinho, Tião, Veh, Carlinhos · em memória, Mara Brandão · em memória).
- Apenas nomes — sem papéis, serviços, foto ou hierarquia. 31 nomes hoje.
- Link "← voltar para a rede com papéis" leva ao modo padrão.
- Roteamento via `location.hash`: `renderParceiros` ouve `hashchange` (handler idempotente), trocando entre os dois modos sem reload.

**CSS**: `.roster-all` (grid auto-fill min 200px), `.show-all-intro`, `.show-all-toggle`.

Cache-buster `?v=20260430` em `data.js` + `renderer.js` + `components.css` (118 páginas).

### Added (analytics · self-hosted telemetry + A/B framework + em-breve modal)

**Reescrita de `assets/analytics.js`** (de scaffold inicial para coleta+experimentação completa):

- **Privacidade**: respeita DNT (`navigator.doNotTrack`), opt-out explícito (`localStorage.al_optout = "1"` ou `window.AL_optout = true`) e bloqueia automação (`navigator.webdriver` + UA bots como Lighthouse/Cypress/Playwright). Sem cookies, sem fingerprinting.
- **Identidade**:
  - `al_sid` (sessionStorage, UUID por aba) — mantido.
  - `al_vid` (localStorage, UUID persistente) — **novo**, necessário para análise de visitantes recorrentes e atribuição estável de variantes A/B entre sessões. `optOut()` apaga ambos.
- **Schema versioning**: cada evento carrega `s: SCHEMA_VERSION` (= 1). Política de bump documentada em `docs/analytics-api.md`.
- **UTM first-touch**: extrai `utm_source/medium/campaign/term/content` da URL na primeira página da sessão e anexa em todos os eventos subsequentes.
- **Path normalization**: `/yuri/index.html` → `/yuri/`, trailing slashes colapsam.
- **Dwell time visibility-aware**: `page_end.props.active_ms` exclui tempo em que a aba ficou em background (vs. `total_ms` bruto).
- **JS error capture**: novos eventos `js_error` e `js_promise_rejection`, capados em 20/page para evitar flood.
- **Backoff exponencial**: falhas de envio dobram o intervalo até `MAX_BACKOFF_MS = 60s`, em vez de retry linear a cada 5s.
- **Queue**: chave migrada de `al_evq` → `al_evq_v1` (cap 1000, FIFO drop). Old key é limpa automaticamente.

**Framework A/B** (primitivo, pronto para uso):
- `EXPERIMENTS` config no topo do arquivo. Cada experimento declara `variants` com `weight`, mais janela opcional `activeFrom` / `activeUntil`.
- Atribuição determinística via FNV-1a hash de `vid + ":" + expId` → bucket → variante. Mesmo `vid` sempre cai na mesma variante para o mesmo experimento, atravessando sessões.
- `window.AL_experiments.variant(expId)` retorna o id da variante (ou `null`). Primeira chamada por sessão emite `experiment_exposure`.
- Todos os eventos seguintes carregam `experiments: { expId: variantId }`, permitindo correlação de qualquer evento de conversão com as variantes ativas via SQL no backend (ver `docs/analytics-api.md`).

**Documentação**: `docs/analytics-api.md` — contrato completo de wire (`POST /events`), schema do evento, taxonomia, recomendações de schema SQLite, política de retenção, e fórmula SQL para resultados de A/B. Implementação do backend vai em `artelonga/co` (Rust/Axum).

**Status atual**: `ENDPOINT = ""` ainda, então eventos acumulam em `localStorage` (cap 1000) e drenam quando o endpoint for ligado. Cliente está pronto.

### Added (yuri · modal "em breve" para Capítulo 1: Gênesis)

- **Wiki-link `[[Label|Title]]`**: extensão de `mdInline` em `renderer.js`. Renderiza como `<a class="al-em-breve">` com `data-modal-title` e `data-modal-body`.
- **Modal lazy-mounted**: inicializado em `renderer.js` (cria DOM apenas no primeiro clique). Fecha por backdrop, botão `×`, ou `Esc`. Foca no `×` ao abrir (acessibilidade).
- **Telemetria**: clique emite evento `modal_em_breve` com o título alvo (ver taxonomia em `docs/analytics-api.md`).
- **Bio do Yuri** atualizada: última citação agora é `[[Yuri|Capítulo 1: Gênesis]], 2015` — quando a página `Capítulo 1: Gênesis` existir, basta substituir por link normal `[Yuri](/jardim/capitulo-1-genesis/)`.
- **CSS**: `.al-em-breve` (link com sublinhado pontilhado + `↗`) e `.al-modal*` em `components.css`.

Cache-buster `?v=20260428` em `analytics.js` em todas as 111 páginas. `retro-umarizal/menu/index.html` ganhou `analytics.js` (estava sem). `renderer.js` + `components.css` bumped em `/yuri/` (única página com bio que usa `[[]]` por enquanto).

### Changed (yuri · perfil "Terra" + bruna sai dos sócios)

- **Yuri**: bio completa adicionada com `bioTitle: "Terra"` (poema/manifesto pessoal) e citações finais (Papa Leão XIII · Rerum Novarum 1891 e auto-citação 2015). Foto `/yuri/yuri.jpg` re-versionada (`?v=20260428`).
- **Roster**: `bruna` movida da posição 5 para o final do bloco de pessoas (após `joao`).
- **Sócios**: `bruna` sai do breakdown de `custos.socios` em `finances` — agora 6 sócios × R$ 2.000 = R$ 12.000 (era 7 × R$ 2.000 = R$ 14.000). Total mensal de gastos cai para R$ 23.000 (de R$ 25.000). `metaMensal` mantido em R$ 25.000.
- **Renderer (bio)**: novo campo opcional `bioTitle` renderizado entre `role` e `bio` no hero do perfil. `bioFull` ganha suporte a (a) quebras de linha simples → `<br>` (poesia/versos), (b) blocos com prefixo `> ` → `<blockquote>` e (c) `*itálico*` inline via `mdInline`. Bios existentes (todas em prosa com `\n\n`) seguem renderizando idênticas.
- **CSS**: `.profile-bio-title` (h2 acima da bio) e `blockquote.profile-bio-quote` (borda lateral, itálico) em `components.css`.

Cache-buster `?v=20260428` em `/yuri/`, `/parceiros/`, `/recursos/` (data.js + renderer.js + components.css onde tocado).

### Changed (catalogo · CNAE completo + gaps + cleanup · Commit 3/3)

**CNAE — 6 correções** (CNAEs ideais já existentes, aplicados):
- `Grafite` · `Artes Visuais`: `9002-7/02 Restauração` → `9002-7/01 Artistas plásticos e escritores` (street art ≠ restauro)
- `Meditação`: `8599-6/99 Ensino` → `8690-9/99 Atenção à saúde humana` (bem-estar ≠ ensino)
- `Gestão Executiva` · `Conexões`: `7319-0/04 Publicidade` → `7020-4/00 Consultoria em gestão empresarial`
- `Rede de Talentos`: `7319-0/04 Publicidade` → `7810-8/00 Seleção e agenciamento de mão-de-obra`

**CNAE — 14 serviços ganharam classificação** (antes sem CNAE):
Acompanhamento Nutricional, Autocuidado, Consultoria Jurídica, Cuidado com o Idoso, Drywall e Bioconstrução, Gestão Administrativa/Contábil/Financeira/Fiscal/Operacional, Inteligência de Previsão, Market Making Preditivo, Saúde Mental — todos classificados dentro do sistema IBGE.

**3 serviços ganharam CNAE do CNPJ já existente** (sem ação burocrática):
- Dança e Expressão Corporal → `8592-9/01 Ensino de dança` (já no CNPJ)
- Mentoria Espiritual → `8599-6/99 Outras atividades de ensino` (já)
- Pensamento Islâmico → `8592-9/99 Ensino de arte/cultura` + `8599-6/99` (já)
- Tradução de Inglês → `7490-1/01` herda do serviço-pai (já)

**Campo novo `cnaeNovo: true`**: marca os 22 serviços cujo CNAE ainda **não está no CNPJ 56.975.561/0001-60** e precisa ser adicionado na Receita Federal. Visível na página do serviço como nota destacada *"Classificação ideal — a formalizar no CNPJ via Receita Federal."* Roadmap fiscal público da empresa.

**6 serviços novos** (gaps de missões):
- `Agrofloresta` (`0161-0/01`) · `Compostagem` (`3821-1/00`) · `Educação Ambiental` (`8599-6/99`) — Quilombo Araucária, realizam Raízes do Futuro
- `Produção de Desfile` (`9001-9/03`) · `Futebol e Esporte` (`9319-1/01`) — Quilombo Araucária, realizam GRES Amazônia
- `Produção de Eventos` (`8230-0/02`) — Bruna, realiza Eventos e Espaços de Saberes

**Hidden** (profissões pessoais / placeholders, não serviços comerciais):
- Atriz · Cantora · Poeta (em memória/aposentado)
- Distribuição de Frutas (Carlinhos, em memória — marcado hidden; reverter se quiser manter como legado público)
- Futuro · Filha da Bruna · Filho da Aime · Mãe do Yuri · Pai do Yuri

**Órfão removido**: `Raízes do futuro` saiu do `serviceCatalog` — era missão infiltrada. A missão homônima continua em `missions[]` e agora referencia seus próprios serviços (Agrofloresta, Compostagem, Educação Ambiental).

**Missões atualizadas**: Raízes do Futuro, GRES Amazônia e Eventos e Espaços de Saberes incorporam os 6 serviços novos em `mission.servicos`.

**Render**: página do serviço (`/servicos/<slug>/`) ganha nota amarela destacada quando `cnaeNovo: true`.

**Contagens**:
- Total no catálogo: 67 (+5 vs commit 2: 6 novos − 1 órfão removido)
- `publicServices()`: 58 (+5)
- Serviços com CNAE: 58 de 67 (era 40 de 62 no início da refactor — 87% cobertura agora vs 65%)
- Serviços com `cnaeNovo: true`: 22 (roadmap pra Receita Federal)

**Camada 2 da dívida** (CNAE genérico/errado + órfãos) resolvida. Commit 3/3 fecha a refactor B.

Cache-buster `?v=20260515` em /servicos (60 páginas + 6 novas), /solucoes, /parceiros, /recursos.

### Added (catalogo · ponte missão ↔ serviço · Commit 2/3)
- **`mission.servicos: string[]`** — campo opcional em cada missão lista os serviços do catálogo que a realizam. Popula nas 4 missões existentes:
  - *Raízes do Futuro* → Ensino, Formação e Liderança · Drywall e Bioconstrução
  - *GRES Amazônia* → Produção Musical · Artes Visuais · Dança e Expressão Corporal
  - *Reparação Histórica* → Mentoria Espiritual · Ensino, Formação e Liderança
  - *Eventos e Espaços de Saberes* → 8 serviços (ensino, meditação, alimentação, etc.)
- **`AL.missionsUsingService(titulo)`** — reverse index: retorna missões que usam um serviço dado.
- **Validação cruzada** em data.js: `console.warn` se `mission.servicos` referenciar título inexistente no `serviceCatalog`.
- **Render de missão** (`/solucoes/`) ganha bloco "Realizada por" logo após o objetivo — pílulas clicáveis para cada serviço.
- **Render de serviço** (`/servicos/<slug>/`) ganha seção "Em missões" (ao lado de "Em soluções") com link direto pra `/solucoes/#<mission-handle>`. Só aparece se houver missões que usam esse serviço.
- **Camada 3 da dívida** (missões em silo) resolvida. Navegação agora flui nos dois sentidos: missão → serviços que a realizam · serviço → missões em que participa.
- Cache-buster `?v=20260514` em `/servicos/`, `/solucoes/` e 56 páginas de serviço detalhadas.

### Changed (catalogo · refactor estrutural · fonte única)
- **`serviceCatalog`** agora é a **fonte única** de definição de cada serviço. Consolida 4 estruturas que antes viviam separadas: `cnaeMap` (CNAE + descrição) + `extraServices` (sub-serviços) + `serviceOverrides` (summary/attachments) + `hiddenServiceTitles` (relações pessoais). Cada entry tem: `titulo, parent?, cnae?, descNossa?, attachments?, tags?, hidden?, implicitResponsavel?`.
- **`deriveServices()`** reescrita: seeda a partir de `serviceCatalog`, auto-deriva `responsavel[]` de `people`/`communities`, emite **`console.warn`** se alguma entity referencia um título inexistente — typos viram erro explícito em vez de ficar órfão silencioso. Deduplica responsáveis.
- **`implicitResponsavel`** no catálogo: preserva o padrão "Yuri cobre toda a árvore de Inteligência e Tecnologia sem listar cada sub-serviço". Antes vinha via `extraServices.responsavel`; agora é um campo do próprio catálogo.
- **`summary` → `descNossa`**: renomeado pro novo nome semântico ("nossa descrição", distinta da descrição CNAE oficial). Render de `/servicos/<slug>/` aceita ambos (compat durante transição).
- **AL global**: `hiddenServiceTitles` removido; `serviceCatalog` exposto (útil pra ferramentas de debug/audit).
- Comportamento externo **sem mudança**: 62 entries no catálogo, 53 em `publicServices()`, todas as URLs de serviço continuam iguais, soluções e perfis renderizam idêntico.
- **Camada 1 da dívida** (fragmentação em 4 estruturas): resolvida.
- **Próximos commits**: (2) ponte missão ↔ serviço, (3) correções de CNAE + descNossa preenchidos + Atriz/Cantora/Poeta → hidden + remoção do órfão "Raízes do futuro" do catálogo.
- Cache-buster `?v=20260513` em `/servicos/`, `/solucoes/`, `/parceiros/`, `/recursos/`.

### Added (analytics · Fase 1 frontend)
- **`assets/analytics.js`** — beacon self-hosted, carregado em todas as 99 páginas com `<script defer>`. Captura: `page_view` · `scroll_depth` (25/50/75/100) · `click_section` (parceiros, serviços, soluções, etc.) · `click_profile` · `click_outbound` · `click_email` · `click_whatsapp` · `click_tel` · `click_pdf` · `click_cta` (ver mais, ver serviços) · `page_end` (duração de visita).
- **Privacidade** por design: sem cookies, sem fingerprint. Session ID efêmero em `sessionStorage` (some ao fechar aba). IP nunca sai do navegador — quando backend entrar, será hasheado lá.
- **Resiliência**: queue persistente em `localStorage` (cap 1000 eventos). Se endpoint offline ou vazio, eventos acumulam; drenam quando o collector em `artelonga/co` entrar no ar (basta definir `ENDPOINT` no topo do `analytics.js`). Unload usa `navigator.sendBeacon` com fallback pro queue.
- **API pública**: `window.AL_track(name, props)` para eventos custom e `window.AL_analytics` para inspeção (sid, queueSize, flush).
- **Fase 2** (pendente, `artelonga/co`): `POST /events` Axum + SQLite + Grafana datasource + dashboards (Overview, Parceiros, Serviços).

### Added
- **Marcador de sócio** em `/parceiros/` — asterisco discreto (`.socio-mark`) ao lado do nome de cada pessoa que recebe pro-labore. Fonte única: `finances.custos[socios].breakdown` → exposto como `AL.isSocio(handle)`. Legenda abaixo do roster: *"* sócio · sempre em expansão"* — símbolo + insinuação de crescimento contínuo.

### Changed
- **Roster** `/parceiros/` — Marina sobe para cima de Karina (ordem de sócios e parceiros mais alinhada com a realidade da rede).
- **Manifesto** enxuto. Missão: *"Semear sonhos, escrever legados."* Visão: *"Trabalho digno."* (agora com `referencia`, mesma estrutura dos valores) ancorada em *Rerum Novarum · Leão XIII*. Valores reduzidos de 5 para 1: **Desenvolvimento sustentável**, ancorado nos *Objetivos de Desenvolvimento Sustentável · ONU, 2015* — especificidades vivem no link.
- **`manifesto.visao`** passa de `string` para `{ texto, referencia? }`. Render em `/sobre/` isola `refHtml()` e aplica em visão + valores. Shim em tempo de render aceita string legada (`typeof m.visao === "string"`) para tolerar cache antigo.
- **Tipografia unificada** do manifesto: `.valor-titulo` e `.valor-texto` agora herdam o mesmo tamanho/peso/cor das frases de missão e visão (`0.95rem`, `400`, `#333`) — os três statements leem em pé de igualdade. Valor sem `texto` não renderiza o wrapper vazio; a referência ancora direto sob o título.
- **Rerum Novarum** recebe subtítulo completo: *"Rerum Novarum: sobre a condição dos operários"* (acentos e cedilha corretos). UAT §10.2 atualizada + §10.2.1 adicionada cobrindo o valor ODS/ONU.
- Cache-buster `?v=20260505` em `/sobre/` (manifesto) e `/parceiros/` (data.js, renderer.js, pages.css para o novo `.socio-mark`).

### Fixed
- **`.socio-mark` invisível em `/parceiros/`**. Causa: o span ficava como terceiro filho de `.row` (flex, `justify-content: space-between`) — o asterisco ia pro meio da linha, longe do nome. Correção: mover o span pra dentro do `<a class="name">`. Cache-buster `?v=20260506` em `/parceiros/` (renderer.js, data.js).

### Changed (recursos)
- **Serviços · outros sócios** — nova linha em Projetos: *"90 h × R$ 100/h · outros sócios (no trimestre)"* = R$ 9.000. Fecha o gap entre Potencial e Meta de Q2 (ambos agora em R$ 75.000). Campo `responsavel` tornou-se opcional no render de projetos — se ausente, a atribuição "por X" não é mostrada (o detail carrega "outros sócios").
- **Alinhamento visual** em `/recursos/`. A antiga seção "Meta vs Potencial" (2 cards) virou **"Alinhamento"** (3 cards lado a lado): **Custos · Q2** · **Meta · Q2** · **Potencial · Q2**. Os três em pé de igualdade — todos R$ 75.000 quando a conta fecha. Resolve a dissonância de escalas (custos era mensal, meta/potencial eram Q2).
- **Total de Gastos** ganhou linha secundária *"× 3 · Q2"* logo abaixo do Total mensal, com a mesma moldura de borda dupla. Permite leitura direta Custos-Q2 sem precisar multiplicar de cabeça.
- **Exemplos de solução corrigidos**. Website estático → `artelonga` (único site estático no portfólio). Website dinâmico → `co` + `quilomboaraucaria-solution` (Quilombo é plataforma dinâmica, não estática). Antes os exemplos estavam invertidos.
- Cache-buster `?v=20260506` em `/recursos/` (data.js, renderer.js, pages.css — novos `.fin-total-secondary` e `.fin-goal-grid-3`).

### Fixed (parceiros)
- **Aime parecia "em memória"**. `muted: true` aplicava italic-cinza ao nome, mesma linguagem visual de entidades falecidas. Split de classes: `.em-memoria` (italic, dessaturado, honra o legado) e `.em-breve` (peso normal, cor preservada — apenas role em cinza médio). `.muted` agora é só comportamental (suprime see-more e hint). Cache-buster `?v=20260507` em `/parceiros/` e `/recursos/` (renderer.js, pages.css, data.js).

### Added (solucoes)
- **Hedix · Market Making em Mercados de Previsão** (`hedix-solution`) — nova solução. Plataforma de market making preditivo: liquidez, formação de preço e agregação de sinal em prediction markets. Aponta para `hedix.com.br`. `bundledServices`: Market Making Preditivo, Inteligência de Previsão (ambos já da comunidade Hedix). Campo `comunidade: "hedix"` liga a solução à comunidade provedora.
- Cache-buster `?v=20260510` em `/solucoes/`.

### Added (parceiros · Miguel)
- **Miguel** (`miguel`) — parceiro · role **Futuro**. Bio pessoal (18 anos, robótica/negócios/desenvolvimento de ideias, meta de MS&E em Stanford). Entra no roster abaixo de Rogério e Alzira. Email pessoal (`mkbrito06@gmail.com`) incluso na própria bio — seção "Contato e Parcerias" continua com `rede@artelonga.com.br` padrão.

### Added (parceiros)
- **Alice** (`alice`) — parceira · role **Movimento**. Serviços: *Pensamento Islâmico* e *Dança e Expressão Corporal*. Perfil inclui estrutura de **8 ensaios** (`essays`), cada um com slots para versão curta e longa — todos em breve.
- **Ramona** (`ramona`) — parceira · role **Internalização**. Serviço: *Tradução de Inglês*.
- **Dança e Expressão Corporal** — serviço compartilhado entre **Alice** e **Sylvia** (auto-derivado do catálogo).
- **Seção "Ensaios"** no render de perfil. Novo padrão: `{ essaysTitle, essays: [{ titulo, short, long }] }`. Lista numerada em grid 3-col (número · título · formatos curto/longo). Placeholders "em breve" em cinza-claro até URL chegar. Mobile colapsa para 2-col com formatos embaixo do título.
- Roster: Alice e Ramona entram entre Raquel e Rogério.
- Cache-buster `?v=20260508` em `/parceiros/`, `/alice/` e `/ramona/`.

## [0.11.0] — 2026-04-19

**Why**. Duas frentes convergindo. **(1) Narrativa**: Co ganhou identidade própria ("Rede Social Web") distinta do slogan abstrato da Arte Longa ("Rede do Futuro"), e a Arte Longa passou a se posicionar por uma pergunta — *"Por que precisamos de uma Rede do Futuro?" → Comunidade.* A descrição do Co virou uma cadência em C: *Comunidade. Consciência Coletiva. Colaborar. Compartilhar. Comunicar. Coinventar.* **(2) Ergonomia**: o `/parceiros/` estava distraindo — cartões expandindo inline empurravam o layout inteiro. Migramos para popover flutuante, cartão menor, e serviços atrás de um botão "Ver Serviços" (revelação progressiva em vez de ruído de base). Mesma cura no `/servicos/` para o drawer de filhos do guarda-chuva (Inteligência e Tecnologia). Bônus: atribuição de autoria (Bia na Reparação Histórica) virou padrão reutilizável para citações.

### Added
- **Solução · pergunta/resposta** (`solution.pergunta` + `respostaChave`). Arte Longa: *"Por que precisamos de uma Rede do Futuro?" / "Comunidade."*
- **Tráfego e Crescimento** (sub-serviço de Inteligência e Tecnologia, Yuri) — antes contemplado como "Analytics e Growth" no rascunho 0.7 e removido; agora volta com nome português.
- **João** (`joao`) — parceiro do Quilombo Araucária · Saúde Mental.
- **Parcerias pro-bono** como estrutura de dados (`community.parcerias: [{ de, tipo, descricao, contribuicoes }]`). QA renderiza "Parceria · Arte Longa (pro-bono)" com contribuições discriminadas por pessoa.
- **Atribuição de autoria** (`mission.objetivoAutor`). Reparação Histórica cita Bia — *"A reparação à população negra e dos povos originários é urgente, é necessária, é fundamental."*
- **Missão · Visão · Valores** em `/sobre/` (âncora `#manifesto`). Valores podem carregar `referencia` (obra + data + autor-link).
- **Entidade de referência** — flag `referenceOnly: true` marca pessoas históricas (citáveis mas fora de parceiros/serviços/soluções). Primeiro caso: **Papa Leão XIII** (`leaoxiii`, em memória, *Rerum Novarum · 15 de maio de 1891*).
- **Conexões** (novo título para "Rede de Parcerias" · Igo) — termo mais enxuto e consistente com a linguagem do site.

### Changed
- **Co · tagline** → `Rede Social Web` (antes: "Rede do Futuro" — devolvido ao conceito guarda-chuva da Arte Longa).
- **Co · descrição** → `Comunidade. Consciência Coletiva. Colaborar. Compartilhar. Comunicar. Coinventar.` (Coinventar no infinitivo).
- **Co · bundledServices** → Inteligência e Tecnologia, Design, Gestão Executiva, Gestão Operacional, Privacidade e Segurança. Design agora co-ownership Luke + Yuri.
- **Yggdrasil · bundledServices** → Inteligência e Tecnologia, Design, Produção Musical (Design solo Luke).
- **/parceiros/** — cartões hover encolheram; serviços saíram do corpo do cartão para trás do botão "Ver Serviços" (popover flutuante, `position: absolute`, sem deslocar layout).
- **/parceiros/ comunidades** — lista curta + badge não-clicável `+ N membros` + único CTA `Ver Mais →` apontando para o perfil interno (`/quilomboaraucaria/`). Antes havia dois "Ver Mais" confusos.
- **/servicos/ filhos** — drawer de sub-serviços virou popover flutuante (mesmo padrão dos parceiros). "+N" não estoura mais o título.
- **/solucoes/** — cards não listam mais `bundledServices` (ficará em páginas dedicadas por solução no próximo passo).
- **em memória / aposentado** — rótulo "Serviços" no perfil substituído por **Legado** (hint: "serviços prestados · em memória" / "· aposentado").
- **QA missões** achatadas: Raízes do Futuro = Agrofloresta (mesma entidade, subtítulo "Agrofloresta · horta e compostagem"); GRES Amazônia e Reparação Histórica promovidas a top-level (irmãs, não filhas).
- **/sobre/** — removidos labels laterais redundantes "DADOS CADASTRAIS" e "SEDE". "classificação oficial" (CNAE) mantido por ser informativo.
- Cache-buster `?v=20260430`.

### Removed
- Raquel: `Terapia Comportamental` (não faz parte do escopo dela).
- Serviço `Rede Social` — não existe como item de catálogo; inferido da composição (IT + Design + Comunicação).

### Schema
`AL.version` → `2.1`:
- `solution.pergunta` / `solution.respostaChave` (ambos opcionais).
- `mission.objetivoAutor` (handle de pessoa).
- `community.parcerias[]` com `{de, tipo, descricao, contribuicoes[{quem, oque}]}`.
- `person.referenceOnly` (booleano, exclui de rosters/catálogos).
- `pagina.valores[]` com `{titulo, texto, referencia?:{obra, data, autor, url}}`.

---

## [0.10.0] — 2026-04-18

**Why**. O catálogo estava achatado: "Inteligência e Tecnologia" aparecia como um único serviço, enquanto suas sub-especialidades (Cloud, Network, API Development) eram irmãs soltas sem contexto. Queríamos que um visitante visse o guarda-chuva e, ao passar o mouse, descobrisse os filhos — mesmo padrão do roster de parceiros. Também separamos conceitualmente **serviços** (oferta comercial) de **missões** (projetos de comunidades, outputs de universos): Raízes do Futuro agora vive em Soluções, não no catálogo.

### Added
- **Hierarquia de serviços** (`parent` / `children`). Parents renderizam com hover-drawer revelando filhos, como os perfis no roster. Filhos também buscáveis na raiz via search.
- **Novos sub-serviços de Inteligência e Tecnologia** (Yuri · R$ 100/h): Desenvolvimento de Software, Hardware, Sistemas Operacionais. Mais: Desenvolvimento de API, Nuvem, Computação, Dados e Armazenamento, Redes, Desenvolvimento Web — todos `parent: "Inteligência e Tecnologia"`.
- **Missões** como entidade de primeira classe (`AL.missions`). Cada missão: `comunidade`, `objetivo`, `subMissions?`, `envolvidos?`, `attachments?`.
- **Seção "Missões"** em `/solucoes/`: agrupada por universo. ArteLonga em nível 0 (sem header). QA com header próprio e árvore:
  - Raízes do Futuro (com PDF do projeto)
    - Agrofloresta · horta e compostagem
    - GRES Amazônia · escola de samba, futebol feminino e masculino
    - Reparação Histórica · povos originários (envolve Rogério e Alzira)
- ArteLonga missão: Eventos e Espaços de Saberes.
- Lookups: `AL.missionBySlug`, `AL.missionsOfCommunity`, `AL.subMissionsOf`, `AL.topLevelMissions`.

### Changed
- **Casing padronizado** (Title Case PT): Gestão Administrativa · Gestão Financeira · Rede de Parcerias · Comunicação Visual · Criação de Conteúdo · Marketing Digital · Experiência de Usuário (UI/UX) · Acompanhamento Nutricional · Cuidado com o Idoso · Reforço Escolar.
- **Kayra**: `Modelo` → `Stylist, Moda e Passarela`.
- **Mono**: `Privacidade e segurança digital` → `Privacidade e Segurança`.
- **Yuri TI subs rename**: Cloud → Nuvem · Compute → Computação · Network → Redes · Data e Storage → Dados e Armazenamento · API Development → Desenvolvimento de API · Analytics e Growth → removido.
- **QA**: `servicos` agora vazio. Os 3 projetos foram promovidos a missões.
- **Rogério/Alzira**: `Resistência dos Povos Originários` removida dos serviços — agora são `envolvidos` na missão "Reparação Histórica".
- `/servicos/` subtitle: "Serviços são compostos em Soluções." (enxuto).
- Por padrão `/servicos/` mostra só top-level (40 itens). Busca achata toda a árvore (49 totais).
- Solutions bundles atualizados; QA mantém só Desenvolvimento Web, Artes Visuais, Grafite, Murais e Fachadas (projetos virariam missões).

### Removed
- Stubs obsoletos: `/servicos/{data-e-storage,cloud,compute,network,api-development,analytics-e-growth,modelo,privacidade-e-seguranca-digital,raizes-do-futuro,desenvolvimento-sustentavel,resistencia-dos-povos-originarios}/`.
- PDF `projeto.pdf` movido de `/servicos/raizes-do-futuro/` para `/missoes/raizes-do-futuro/`.

### Schema
`AL.version` → `2.0` (adiciona `missions` com `parentMission`/`subMissions` e `parent` no catálogo de serviços).

---

## [0.9.0] — 2026-04-18

**Why**. Rede social genuína precisa honrar quem já passou. Criamos a abstração universal `emMemoria` — qualquer pessoa (de Sócrates a um avô da família) é representada como `membro` na mesma estrutura, com esse flag dizendo "honra, mas não conta como ativa". Também ajustamos a lista de membros das comunidades: todos são mostrados, com "ver mais" escondendo os já visíveis no roster principal para evitar redundância.

### Added
- Carlinhos · Guardião · Distribuição de Frutas (em memória, 60 anos · 1965–2025). Último da lista expandida de QA.
- `/carlinhos/` — página de perfil com contador estático.
- Comunidades com "ver mais (+N)" para membros que já aparecem no roster principal (+ em-memória ao final).
- Documentado: em_memoria é filtro universal — serviços de quem passou não entram no catálogo, mas o perfil e os serviços prestados em vida permanecem visíveis como arte/memória.

### Changed
- QA membros agora incluem fundadores (Yuri, Igo, José, Mono, Bruna) + Carlinhos. Inicialmente só os únicos (Antony, Bia, Ken, Quinho, Tião, Veh) aparecem; "ver mais" revela os outros.

### Refactored (continuação do 0.8.0)
- Campo `missoes` em pessoas/comunidades renomeado para `servicos` em toda `data.js`.
- `/missoes/*.md` reclassificados: 49 arquivos movidos para `/servicos/*.md` com `type: servico`.
- `/missoes/` agora reservado exclusivamente para missões (comunidades com objetivo) — no momento vazio no top-level (existe apenas em `/comunidades/<h>/missoes/`).
- Renderer: rótulos data-driven — pessoa mostra "Serviços", comunidade mostra "Missões".

## [0.8.0] — 2026-04-18

**Why**. Até aqui o site foi construído com conteúdo hardcoded. Para escalar como rede social com conteúdo editável de usuários (posts, ensaios, portfolio) precisamos de abstrações claras e um pipeline markdown-first — compatível com o `co-web` quando migrarmos.

### Added
- `docs/ABSTRACTIONS.md` — modelo conceitual (`membro · comunidade · missao · servico · solucao · relato · evento · pagina`), alinhado ao schema do `quilomboaraucaria.org`.
- Hierarquia recursiva: comunidade contém comunidades; missão = comunidade com `objetivo`; serviço = missão vendável no catálogo.
- `/comunidades/quilomboaraucaria/` como diretório aninhado (overview + 3 missões: Raízes do Futuro, Resistência dos Povos Originários, Desenvolvimento Sustentável). Detalhe completo vive em quilomboaraucaria.org.
- `/relatos/<autor>/<slug>.md` — primeiro ensaio (Yuri · "Abstrações da rede").
- `/eventos/` — diretório vazio pronto para eventos.

### Changed
- `/schema.yaml` v2 — tipos em português com paridade QA (`membro`, `comunidade`, `missao`, `servico`, `solucao`, `relato`, `evento`, `pagina`).

### Deprecated
- `type: content` → `type: relato` (mais preciso e alinhado a QA).
- Campo `missoes: []` em pessoas/comunidades será renomeado para `servicos: []` no próximo patch — eram serviços todo esse tempo.

---

## [0.7.0] — 2026-04-18

**Why**. Uma rede sustentável precisa modelo financeiro transparente. Criamos `/recursos/` para mostrar publicamente gastos, receita projetada e gap em relação à meta.

### Added
- `/recursos/` — página pública (unlinked, noindex) com modelo de negócio detalhado.
- `AL.finances` em `data.js`: 6 gastos recorrentes (total R$ 25.000/mês) + receita potencial Q2 2026 (R$ 66.000 vs meta R$ 75.000).
- Receita recorrente, rampa (Hedix MM: 1k/5k/10k), projetos (3 sites estáticos + 1 dinâmico + traduções + consultoria avulsa), pro-bono (QA portfolio).
- 6 serviços de Consultoria em TI (Yuri): Data e Storage, Compute, Cloud, Network, Analytics e Growth, API Development.

### Changed
- Rebalanceamento de gastos: contabilidade coberta pela receita de API Development Hedix; coworking e armazenamento/computação explicitados separadamente.

---

## [0.6.0] — 2026-04-17

**Why**. Cada nova edição de conteúdo estava tocando 3+ arquivos. A página ficou lenta de manter. Refatoramos para um único ponto de verdade (`data.js`) + renderer compartilhado (`renderer.js`) + CSS componentizado, cortando 90% da duplicação.

### Refactored
- `/assets/data.js` — entidades tipadas (people, communities, services, solutions) com índices e lookups (`AL.get`, `AL.roster`, `AL.publicServices`, etc).
- `/assets/renderer.js` — componentes puros (`avatarSm`, `bioCard`, `counter`, `missaoLink`, `miniRow`, `platformItem`, `ctaLead`, `modalContact`) + dispatchers por `body[data-page]`.
- CSS dividido em `site.css` (base), `components.css` (reutilizáveis) e `pages.css` (específicos).
- Páginas reduzidas a stubs de ~15 linhas que carregam `data + renderer`.

### Added
- `/servicos/<slug>/` — 46+ páginas de detalhe geradas por script, cada uma com CNAE oficial, soluções que usam, e serviços relacionados.
- Filtro `?q=<termo>` no catálogo (vem de clique em missão no perfil).

### Changed
- Serviços deixam de abrir modal; abrem página dedicada (bookmarkável, indexável).

### Removed
- `/assets/profile.js` e `/assets/profile.css` (substituídos pelos componentes).

---

## [0.5.0] — 2026-04-17

**Why**. Roster precisava respirar: pessoas queriam exibir bio, foto, idade. Também faltava visibilidade para família (em memória) e futuro (filhos dos membros).

### Added
- Contadores de idade inline no perfil, com precisão automática pelo formato do `birthDate` (segundo, minuto, hora, dia).
- Contador estático para `emMemoria: true` (Soninha · 1961—2025 · 63 anos).
- Fotos: Bruna, Karina, Kayra, José Antônio.
- Sub-membros: Kiyoshi (Shin) e Soninha sob Yuri; Alicia sob Bruna; John sob Aime.
- Novos parceiros: Rogério (Xeramoi) e Alzira (Xejaryi) com Mentoria Espiritual e Resistência dos Povos Originários (compartilhado com QA).
- Produtos: Co (Gestão Coletiva), Quilombo Araucária, Arte Longa (recursivo), Yggdrasil (jun/2026).

### Changed
- Aime vira comunidade (com John como sub-membro) e volta ao estado `em breve` (muted).
- Luck → Luke (novo bio RPG, `/luck/` redireciona para `/luke/`).

---

## [0.4.0] — 2026-04-17

**Why**. Primeira versão funcional do site: ter um lugar para apresentar parceiros, serviços e soluções, com contato. Repo privado bloqueava GH Pages — tornado público para ativar deploy.

### Added
- Home com 3 links (Parceiros, Serviços, Soluções) + Sobre e Próximos Passos como CTA secundário.
- `/parceiros/` — roster editorial com hover cards, avatares, sub-membros aninhados.
- `/servicos/` — catálogo com busca e filtros por função e responsável.
- `/solucoes/` — soluções digitais com Web/Mobile status (dots pulsantes).
- `/sobre/` — dados cadastrais completos (CNPJ 56.975.561/0001-60, 39 CNAEs).
- `/proximos-passos/` — roadmap público Q2 2026.
- Lead magnets: "Seja um parceiro", "Anuncie seus serviços", "Construa soluções".
- Modal de contato com `rede@artelonga.com.br` (não-mailto, seleção manual).

### Changed
- `parceiros e clientes` → `parceiros` (unificação).
- 11 perfis individuais + 4 comunidades (Arte Longa, QA, HFS, Hedix).

### Deploy
- Repo tornado público; GH Pages ativado.
- `.nojekyll` adicionado (Jekyll falhava em `modelos/*.md` com templates Obsidian).
- CNAME transferido de `artelonga/home` para `artelonga/ArteLonga`.

### Security
- `.gitignore` endurecido: bloqueia `*.pptx`, `*.xlsx`, `*.docx`, `.obsidian/`, etc.

---

## [0.3.0] — 2026-04-15

**Why**. Primeiro passo real: listar os fundadores no universo Arte Longa com perfis públicos.

### Added
- 5 fundadores no roster: Yuri (Semeador), Igo (Resistência), José (Recursos), Mono (Segurança), Bruna (Comunicação).
- Perfis individuais em `/<handle>/`.
- `/membros/*.md`, `/missoes/*.md`, `/comunidades/*.md` como fonte de verdade inicial.

### Changed
- Compatibilidade de schema com quilomboaraucaria (mesmos frontmatter fields).

---

## [0.2.0] — 2026-03-27

**Why**. Substituir a home estática por algo editorial, com identidade.

### Changed
- Refactor editorial — tipografia tight, single-flow, elements minimalistas.
- Logo top-left, "semeando sonhos" top-right.

---

## [0.1.0] — 2026-03-24

### Added
- Primeira home (`index.html` em construção) + logo.
- CNAME para `artelonga.com.br`.

---

## Convenções

### Commits

Conventional commits com escopo. Exemplos:

```
feat(parceiros): adiciona Rogério e Alzira abaixo de Raquel
fix(profile): contador de idade em anos/meses/dias, minutos em movimento
refactor(site): arquitetura escalável — data.js + renderer.js + component CSS
chore(cache): bump ?v=20260423 para forçar recache
chore(pages): adiciona .nojekyll para desabilitar Jekyll
docs(abstractions): modelo alinhado com quilomboaraucaria.org
```

Tipos aceitos: `feat`, `fix`, `docs`, `refactor`, `chore`, `test`, `style`.

### Semver (pre-1.0)

- **MINOR** (`0.x.0`) — nova feature ou mudança estrutural significativa
- **PATCH** (`0.x.y`) — fix, docs, chore, pequenos refactors

Pós-1.0 seguiremos semver estrito (MAJOR para quebras).

### Changelog

- Toda release tem `### Why` (a dor ou oportunidade endereçada).
- Agrupamento: `Added` · `Changed` · `Deprecated` · `Removed` · `Fixed` · `Security` —
  conforme Keep-a-Changelog 1.1.0. Extensões locais: `Refactored` (reorganização
  sem mudança de comportamento — distinto de Changed) e `Deploy` (infra GH Pages,
  domínio, workflows).
- Entradas com header `AL-N` referenciam `work/artelonga/AL-N.md` e devem
  encerrar com um bloco `**Por que:**` explicando motivação — não apenas o quê.
- Entradas em `[Unreleased]` ficam ordenadas por AL descendente (mais recente
  no topo).
- Ordem cronológica reversa entre releases (release mais recente no topo).
- Data em formato `YYYY-MM-DD`.
