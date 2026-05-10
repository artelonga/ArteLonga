# Estado do projeto · 2026-05-10

> Snapshot do desenvolvimento de artelonga.com.br até agora. Para um dev novo
> (ou agente AI) entender em 10 minutos: o que é, como chegou aqui, o que
> está aberto, e como contribuir.

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
- **Renderer:** `assets/renderer.js` (~1900 linhas) — dispatcher por
  `body[data-page]` que renderiza home, profile, service, parceiros, etc.
  Escreve `document.body.innerHTML` no fim de cada renderer.
- **Data:** `assets/data.js` (~1500 linhas) — pricing, location, people,
  communities, services, missions, universos, portfolio. Parcialmente
  AUTO-GENERATED (people + communities migrados pra YAML per-handle, AL-1/2).
- **Analytics:** `assets/analytics.js` — SDK self-hosted, queue em
  localStorage, batch POST pra `co.artelonga.com.br/api/v1/telemetry/events`
  (endpoint pendente CORS allow + wire — CO-177).
- **Backend opcional:** `co.artelonga.com.br` (Rust/Axum, repo separado
  `~/projects/co/`) — auth, telemetry, leads (futuro), analytics público.

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
├── membros/                 # frontmatter mínimo lido pelo backend
├── assets/                  # bootstrap.js + CSS + data.js + renderer.js
├── tools/                   # bake-people.mjs, bake-communities.mjs
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

**Marco:** commit `0063126b` (e successive) — `feat(home): marketplace
landing focado no contratante · ICP Jardim Umarizal`. Site reorientado
de catálogo institucional pra marketplace product-first. Direção definida
por feedback de mercado (Jack Dorsey: "reduzir elementos ao mínimo, cada
um o mais perfeito"; liquidez via recorte geográfico; 5 segundos de
atenção).

Mudanças load-bearing:
- **Home** vira marketplace — hero + busca fuzzy + 8 supercategorias +
  grid de cards + footer global.
- **Personas separadas** — cliente é o foco; prestadores no rodapé.
- **`/servicos/<slug>/` product-oriented** — sai CNAE/Em soluções/Em
  missões; entra Exemplos + CTA único.
- **Catálogo ganha 3 campos** — `paraQuem`, `faixaPreco`, `isPortfolio`.
- **Pricing model** — várias iterações: flat → horas × taxa → planos
  nomeados (semanal/mensal/Sob consulta) → diferencial sócio vs
  não-sócio.
- **`/contato/` form pra cliente** — CTAs de serviço apontam pra ele
  com `?servico=X&parceiro=Y` pré-populado.
- **`/faca-parte/` form pra novos prestadores** — direitos do sócio
  + remuneração explícita (128h × R$ 100 = R$ 12.800).
- **`/legal/`** — mapeia conceitos da rede contra Lei 14.133/2021.
- **`/sobre/` simplificada** — saem dados cadastrais (CNPJ, capital,
  CNAE) que viram backoffice em `docs/`.
- **`/oportunidade/` enxuta** — vira form de contato, tese fica em
  `docs/oportunidade-tese.md`.
- **`/proximos-passos/` sem GPL Q2** (movido pra docs).

### Fase 4 · UX polish + LGPD migration (em andamento)

Foco: refinar a experiência do contratante e separar content de form.

UX polish:
- Filter Estado · Cidade · Bairro com dropdowns custom (datalist tinha
  autofill non-determinístico).
- Anglicism map — "cloud" casa "nuvem", "design" casa "criação".
- Filtro "Prestados pela Arte Longa" — só sócios responsáveis.
- Page summaries (home, parceiros, recursos).
- `/contato/` pills toggle físico/digital.
- Sub-serviços visíveis na página do parent + badge "+N" no card.
- Badge "online" no card pra serviços digitais (substitui caveat textual
  sobre localização).
- Chip counts atualizam ao filtrar por nome.
- Remove `paraQuem` do card UI (mantém em data.js como metadata).

Refactors estruturais:
- `e2dd5240` — `refactor: centralizar carregamento de assets via
  /assets/bootstrap.js`. **Marco arquitetural.** Cada HTML carrega só
  `bootstrap.js`; bumpar `V` lá invalida cache de todo o site sem editar
  os 150 HTMLs.
- `251d7bfe` — `fix(bootstrap): renderer roda mesmo se DCL ja passou`.
  Race condition descoberta após o refactor acima — listener de
  `DOMContentLoaded` em script dinâmico não dispara se DCL já passou.
  Consertado com `document.readyState` check.
- `f6d33a35` — `fix(renderer): try/catch no dispatch evita blank page
  silencioso`. Defensiva pareada com fix anterior.

Migração LGPD (separação content/form):
- **AL-1** — `refactor(AL-1): migrar perfis de membros de data.js para
  per-handle YAML`. 36 membros viram `<handle>/profile.yaml`. Build
  script `tools/bake-people.mjs` regenera o array `people` em
  `data.js` (AUTO-GENERATED markers). Cada membro ganha jurisdição
  clara sobre seu próprio folder pra exercer direitos LGPD.
- **AL-2** — mesmo padrão pra communities. 3 entries
  (quilomboaraucaria, hfsassociados, hedix) viram
  `<handle>/community.yaml`.

Conteúdo + métricas:
- **Assistência Técnica** + **Babá** como serviços novos (Yuri+Matheus,
  Kelly).
- Análise de aproveitamento; matheus + kelly como novos perfis.
- `/analytics/` página pública de telemetria (depende de CO-179 pra
  endpoints públicos).

---

## Backlog aberto

Tasks abertas em `work/artelonga/`:

| Task | Status | Resumo |
|---|---|---|
| AL-3 | todo | Memory system: docs/LESSONS.md + docs/STATE.md (esse) + CLAUDE.md lições |
| AL-4 | todo | `/contato/` persiste leads no co backend (substituir mailto) |

Tasks pareadas no `co` repo (pré-requisitos):

| Task | Status | Resumo |
|---|---|---|
| CO-177 | todo | CORS allow artelonga.com.br + populate universe_key |
| CO-178 | todo | Geo enrichment server-side em telemetry_events |
| CO-179 | todo | Public analytics endpoints (`/summary`, `/recent`) |
| CO-180 | todo | Popularity endpoint para ranking de serviços no home |
| CO-183 | todo | POST `/api/v1/leads` + admin queue (pareada com AL-4) |

---

## Princípios em prática

Padrões repetidos pelo histórico que viram convenção:

1. **Separar content de form.** Dados (perfis, comunidades, futuramente
   serviços/missões) vivem como YAML per-handle no folder do owner;
   forma (renderização, agregação) vive em código JS. Build aggrega.
   Aplicado: AL-1, AL-2. A aplicar: serviços, missões, leads (AL-4).

2. **Ownership por folder.** O dono de `<handle>/` é o `<handle>`. PR
   no folder dele = direito LGPD exercido. Multi-tenant em arquivo
   único viola.

3. **Falha visível > falha silenciosa.** Dispatcher tem try/catch com
   fallback. Render que escreve body.innerHTML no fim sempre arrisca
   blank page se algo lança no meio.

4. **Versionamento centralizado.** `V` em `bootstrap.js` é único ponto.
   150 HTMLs nunca são editados pra invalidar cache.

5. **Copy é trabalho técnico.** "Sob demanda" vs "Sob consulta", "Tradução"
   vs "Interpretação", "Marcas · estúdios" vs sem caveat. Precisão > brevidade.

6. **UI auto-explicativa > help text.** Se a UI precisa de texto pra
   explicar o que faz, conserta a UI. Badge "online" > caveat
   "serviços digitais aparecem em qualquer lugar".

7. **Coverage audit.** Toda URL no renderer tem que ter shell HTML
   correspondente. Toda referência de handle tem que resolver via
   `AL.get`. Regressões vêm sempre de gaps aqui.

Detalhes em `docs/LESSONS.md`.

---

## Como contribuir

1. **Leia primeiro:**
   - Esse doc (STATE) → estado atual.
   - `docs/LESSONS.md` → anti-patterns que mordem se ignorados.
   - `CLAUDE.md` (raiz) → stack, convenções, V bumping.

2. **Pegue um AL- aberto** ou abra um novo em `work/artelonga/AL-N.md`.

3. **Commits convencionais em PT-BR:** `feat(escopo): descrição`,
   `fix(escopo): descrição`, etc. Co-Authored-By se trabalho com
   agente.

4. **Bumpe `V`** em `assets/bootstrap.js` se mudou CSS/JS.

5. **Adicione entrada em CHANGELOG.md** sob `[Unreleased]`.

6. **Adicione entrada em `docs/LESSONS.md`** se o fix ensinou algo
   generalizável (não trivial, não óbvio).

7. **PR pra main** — regra global PR-only, nunca push direto.

---

## Métricas

- Total de commits: 163
- Membros catalogados: 36 (AL-1)
- Comunidades: 3 (AL-2)
- Serviços no catálogo: ~50 top-level + sub-serviços
- Universos (oportunidade): 5+ ativos + futuros
- Cache version atual: ver `assets/bootstrap.js:18`
