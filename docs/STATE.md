# Estado do projeto · 2026-06-01

> Snapshot auto-gerado por `tools/bake-state.mjs` — não editar à mão.
> Para um dev novo (ou agente AI) entender em 10 minutos: o que é, como
> chegou aqui, o que está aberto, e como contribuir.
>
> Para gerar novamente: `npm run bake-state` (ou `node tools/bake-state.mjs`).

---

## O que isso é

**Arte Longa** é uma agência de gestão de carreira, marca e produto, tecnologia
e comunicação. Cooperativa de sócios (Yuri, Igo, José Antônio, Mono, Luke,
Marina) + parceiros + comunidades parceiras (Quilombo Araucária, HFS Associados,
Hedix). Site público estático em [artelonga.com.br](https://artelonga.com.br),
hospedado em GitHub Pages.

Posicionamento atual: **marketplace de serviços focado no contratante**. ICP
geográfico declarado (São Paulo · Jardim Umarizal); 5 segundos pra entender o
que o site faz; busca fuzzy + supercategorias + filtro de localização.

## Stack

- **Site:** HTML/CSS/JS vanilla, sem framework. GitHub Pages.
- **Bootstrap:** `assets/bootstrap.js` é o único `<script>` em cada HTML —
  carrega CSS + `data.js` + `renderer.js` dinamicamente. Bumpar `V` lá
  invalida cache de todos os ~150 HTMLs sem editá-los.
- **Renderer:** `assets/renderer.js` — dispatcher por `body[data-page]`
  que renderiza home, profile, service, parceiros, etc. Módulos TypeScript
  em `src/` compilados via Vite para o bundle final.
- **Data:** `assets/data.js` — pricing, location, people, communities,
  services, missions, universos, portfolio. Parcialmente AUTO-GENERATED
  (people + communities migrados pra YAML per-handle via AL-1/2).
- **Analytics:** `assets/analytics.js` — SDK self-hosted, queue em
  localStorage, batch POST pra `co.artelonga.com.br/api/v1/telemetry/events`.
- **Backend opcional:** `co.artelonga.com.br` (Rust/Axum, repo separado
  `~/projects/co/`) — auth, telemetry, leads (futuro), analytics público.
- **TypeScript:** `src/` com tipos em `src/types.ts` (espelho do openapi schema).
  Build via Vite produz `assets/renderer.js`.
- **OpenAPI:** `openapi/artelonga.yaml` — single source of truth das shapes.

## Estrutura de diretórios

```
ArteLonga/
├── <handle>/                # pasta por membro/comunidade/business
│   ├── profile.yaml         # source of truth do perfil (AL-1)
│   ├── community.yaml       # se for community type (AL-2)
│   ├── index.html           # entry point HTML (renderiza profile)
│   └── *.{jpg,png,ogg}      # assets
├── servicos/<slug>/         # shell HTML por serviço
├── solucoes/<slug>/         # shell HTML por universo (oportunidade)
├── relatos/<slug>/          # shell HTML por relato
├── jardim/                  # conhecimento editorial
├── docs/                    # docs internas (esse arquivo aqui)
├── eventos/                 # eventos passados
├── assets/                  # bootstrap.js + CSS + data.js + renderer.js
├── src/                     # TypeScript sources (compilados por Vite)
├── tools/                   # bake-people.mjs, bake-communities.mjs, bake-state.mjs
├── openapi/                 # artelonga.yaml — schema spec
├── design/                  # design palette estática (form sem content)
├── work/artelonga/          # board co-auto (AL-N.md)
├── CHANGELOG.md             # histórico narrativo por release
└── CLAUDE.md                # instruções pra agente
```

---

## Histórico em 4 fases

### Fase 0 · Bootstrap (commits iniciais)

- Repo criado, CNAME, `.nojekyll` (GH Pages sem Jekyll).
- Página "em construção".
- Modelos de conteúdo introduzidos.
- `gestao-de-carreira.md`, `sobre.md`, `Esperança` (primeiro perfil).

Pequeno, sem arquitetura definida. Cada página era HTML estático puro.

### Fase 1 · Site editorial multi-página (~30 commits)

- Estrutura inicial: home, parceiros, produtos, serviços, sobre.
- Pessoas: Aime + Alicia + John, Sylvia + Raquel, Bruna, Kiyoshi/Soninha
  sob Yuri, Rogério/Alzira, Carlinhos (em memória), Mara Brandão.
- Communities: Aime, Quilombo Araucária.
- Cache busting via `?v=20260417` query string (precursor do V centralizado).

Cada página HTML tinha seu próprio header/footer copy-paste. Mudar o footer
exigia editar ~50 arquivos. Insustentável.

### Fase 2 · Refactor de arquitetura escalável (~30 commits)

**Marco:** commit `eaf2bc2d` — `refactor(site): arquitetura escalável —
data.js + renderer.js + component CSS`. Move toda lógica + dados pra dois
arquivos JS centrais; HTML files viram shells de 11 linhas que carregam o
SDK. Inverte a topologia: dado/comportamento centralizado, HTML é só entry
point com `data-page`/`data-handle`.

Outros marcos da fase:
- `feat(recursos)` — transparência financeira com receita projetada.
- `feat(ui)` — floating hover card, popover pattern, schema v2.1.
- `feat(content)` — novas pessoas, parceria QA pro-bono, catálogo refatorado.
- `feat(analytics)` — beacon self-hosted (Fase 1 frontend).
- `feat(parceiros)` — Alice + Ramona, Retro Umarizal Burger.
- `feat(catalogo)` — CNAE completo, ponte missao↔serviço, serviceCatalog
  como fonte única.
- `feat(syl)` — Sylvia rebrand pra "Syl Saghira", handle renomeado.
- `feat(yuri)` — bio "Terra", ShowAll mode, perfil rico com citações.
- `feat(solucoes)` — Universos como hub (ativos vs futuro), diagrama de
  arquitetura.

### Fase 3 · Pivot product-oriented (marketplace de serviços) (~50 commits)

**Marco:** commit `0063126b` — `feat(home): marketplace landing focado no
contratante · ICP Jardim Umarizal`. Site reorientado de catálogo institucional
pra marketplace product-first. Direção definida por feedback de mercado
(Jack Dorsey: "reduzir elementos ao mínimo, cada um o mais perfeito";
liquidez via recorte geográfico; 5 segundos de atenção).

Mudanças load-bearing:
- **Home** vira marketplace — hero + busca fuzzy + 8 supercategorias +
  grid de cards + footer global.
- **Personas separadas** — cliente é o foco; prestadores no rodapé.
- **`/servicos/<slug>/` product-oriented** — sai CNAE/Em soluções/Em
  missões; entra Exemplos + CTA único.
- **Catálogo ganha 3 campos** — `paraQuem`, `faixaPreco`, `isPortfolio`.
- **Pricing model** — várias iterações: flat → horas × taxa → planos
  nomeados (semanal/mensal/Sob consulta) → diferencial sócio vs não-sócio.
- **`/contato/` form pra cliente** — CTAs de serviço apontam pra ele
  com `?servico=X&parceiro=Y` pré-populado.
- **`/faca-parte/` form pra novos prestadores** — direitos do sócio
  + remuneração explícita (128h × R$ 100 = R$ 12.800).
- **`/legal/`** — mapeia conceitos da rede contra Lei 14.133/2021.
- **`/sobre/` simplificada** — saem dados cadastrais (CNPJ, capital,
  CNAE) que viram backoffice em `docs/`.

### Fase 4 · UX polish + LGPD migration + TS foundation (em andamento)

UX polish:
- Filter Estado · Cidade · Bairro com dropdowns custom (datalist tinha
  autofill non-determinístico — L-006).
- Anglicism map — "cloud" casa "nuvem", "design" casa "criação".
- Filtro "Prestados pela Arte Longa" — só sócios responsáveis.
- Chip counts atualizam ao filtrar por nome (L-003).
- Badge "online" no card pra serviços digitais, substitui caveat textual (L-004).
- Sub-serviços visíveis na página do parent + badge "+N" no card.
- `/contato/` pills toggle físico/digital.

Refactors estruturais:
- **AL-13** — `refactor: centralizar carregamento de assets via bootstrap.js`.
  Cada HTML carrega só `bootstrap.js`; bumpar `V` invalida cache de todo o
  site sem editar os 150 HTMLs (L-011).
- **AL-14** — Refactor arquitetural completo: data.js + renderer.js + CSS.
- **AL-5/6** — DCL race fix (L-001) + try/catch defensivo (L-002).
- **AL-22** — TS foundation: OpenAPI spec + `src/types.ts` + `/design/` palette.
- **AL-23** — Renderer migrado pra componentes TS modulares compilados via Vite.
- **AL-25** — YAML validation pre-flight no bake (previne schema drift).
- **AL-17** — Pre-commit hook: bloqueia edição direta em data.js AUTO-GENERATED (L-021).

Migração LGPD (separação content/form):
- **AL-1** — 36 membros viram `<handle>/profile.yaml`. Build script
  `tools/bake-people.mjs` regenera array `people` em `data.js` (L-009).
- **AL-2** — 3 communities viram `<handle>/community.yaml`.

Memory system:
- **AL-3** — `docs/LESSONS.md` (21 anti-patterns L-001..L-021), `docs/STATE.md`
  (esse arquivo, auto-gerado), `tools/bake-state.mjs`, section "Lições críticas"
  em CLAUDE.md.

---

## Última release

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

---

## Recentes feats (últimos 30 dias)

_(nenhum no período)_

## Recentes fixes (últimos 30 dias)

_(nenhum no período)_

---

## Backlog aberto

Tasks abertas em `work/artelonga/`:

| Task | Status | Resumo |
|---|---|---|
| AL-64 | aberto | Epic — Funnel observability |
| AL-65 | aberto | Epic — Page-shell hygiene |
| AL-66 | aberto | Epic — Type + key centralization |

---

## Princípios em prática

Padrões repetidos pelo histórico que viraram convenção:

1. **Separar content de form.** Dados (perfis, comunidades) vivem como YAML
   per-handle no folder do owner; forma (renderização, agregação) vive em
   código JS. Build aggrega. Aplicado: AL-1, AL-2. A aplicar: serviços, missões.

2. **Ownership por folder.** O dono de `<handle>/` é o `<handle>`. PR no
   folder dele = direito LGPD exercido. Multi-tenant em arquivo único viola (L-009).

3. **Falha visível > falha silenciosa.** Dispatcher tem try/catch com fallback.
   Render que escreve body.innerHTML no fim sempre arrisca blank page se algo
   lança no meio (L-002).

4. **Versionamento centralizado.** `V` em `bootstrap.js` é único ponto.
   150 HTMLs nunca são editados pra invalidar cache (L-011).

5. **Copy é trabalho técnico.** "Sob demanda" vs "Sob consulta", "Tradução"
   vs "Interpretação" — precisão de domínio > brevidade (L-008).

6. **UI auto-explicativa > help text.** Se a UI precisa de texto pra
   explicar o que faz, conserta a UI. Badge > caveat (L-004).

7. **Coverage audit.** Toda URL no renderer tem que ter shell HTML
   correspondente. Regressões vêm sempre de gaps aqui (L-007).

Detalhes em `docs/LESSONS.md`.

---

## Como contribuir

1. **Leia primeiro:**
   - Esse doc (STATE) → estado atual.
   - `docs/LESSONS.md` → anti-patterns que mordem se ignorados.
   - `CLAUDE.md` (raiz) → stack, convenções, V bumping.

2. **Pegue um AL- aberto** ou abra um novo em `work/artelonga/AL-N.md`.

3. **Commits convencionais em PT-BR:** `feat(escopo): descrição`,
   `fix(escopo): descrição`, etc. Co-Authored-By se trabalho com agente.

4. **Bumpe `V`** em `assets/bootstrap.js` se mudou CSS/JS.

5. **Adicione entrada em CHANGELOG.md** sob `[Unreleased]`.

6. **Adicione entrada em `docs/LESSONS.md`** se o fix ensinou algo
   generalizável (não trivial, não óbvio).

7. **PR pra main** — regra global PR-only, nunca push direto.

---

## Métricas

- Total de commits: 1
- Membros catalogados: 36 (AL-1)
- Comunidades: 3 (AL-2)
- Serviços no catálogo: ~50 top-level + sub-serviços
- Universos (oportunidade): 5+ ativos + futuros
- Cache version atual: ver `assets/bootstrap.js:18`
