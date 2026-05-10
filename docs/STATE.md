# Estado do projeto · 2026-05-10

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

---

## Recentes feats (últimos 30 dias)

- feat: AL-17 + AL-25 + AL-26 + AL-23 (consolidated) (#43) (3b9b583c)
- feat(AL-22): TS foundation + OpenAPI spec + /design/ palette (#42) (36beee62)
- feat(home): badge "online" no card pra servicos digitais (a46fdd8f)
- feat(alice): bio com easter egg [...] + áudio inline (132819cc)
- feat(faca-parte): direitos do sócio + remuneração 128h × R$ 100 = R$ 12.800 (e855dd17)
- feat(contato): /contato/ form pra cliente · CTAs de serviço apontam pra ele (59f573ef)
- feat: Interpretação · /index/ sitemap · analytics fallback local (c72d13a9)
- feat(home): filtro "Prestados pela Arte Longa" · só sócios responsáveis (3bca9efc)
- feat(ux): page summaries · home / parceiros / recursos (cee78f55)
- feat(sobre): seção Bio antes de História · manifesto da rede (daf7a64b)
- feat: /legal/ mapeia conceitos da rede contra Lei 14.133/2021 (89798cd0)
- feat(servicos): sub-serviços visíveis na página do parent + badge "+N" no card (2b08ad5c)
- feat: Tradução com sub-pares de idiomas · Denise (Guarani) · backlink home (d0c84d1a)
- feat: copy/UI overhaul · 3 location inputs full-width · anglicism map · faca-parte form (d491f052)
- feat(home): busca primeiro · localização free-text · flag digital · sem tagline (b91f94f6)
- feat(analytics): página pública /analytics/ · noindex · in-house telemetry (cf0cdeb7)
- feat(home): filtro Estado · Cidade · Bairro · default SP/SP/Jardim Umarizal (c31d94a2)
- feat(manifesto): missão "conectar parceiros a clientes" · visão "rede social profissional" (f8de942e)
- feat(schema): docs/SCHEMA.md · AL.portfolio* · fix Rodney 404 (35abe1db)
- feat(header): "Para parceiros" como botão fixo no header · footer enxuto (07bf6bbd)
- feat: Sob demanda flat · Rodney/Piloto de Drone · /faca-parte/ vira form (06d99ca0)
- feat(catalog): adiciona Auditoria (Sob consulta) e Automação de Processos (Yuri, 8-20h) (1e9eac29)
- feat(planos): aplicar em ofertas Arte Longa-padronizadas · psi volta a Sob consulta (add2039b)
- feat(planos): pacotes nomeados (semanal/mensal/etc.) como feature default (bb64a9b1)
- feat(precos): só sócios têm preço calculado · não-sócios = Sob consulta (4a5b67c3)
- feat(parceiros): canal direto por prestador · landing /faca-parte/ (5ff7dab6)
- feat(precos): preço dinâmico por horas × taxa · CTA prestador · Saúde Mental como pai (ebdd4c38)
- feat(home): hero novo · busca dinâmica · supercats · footer global (c47445e6)
- feat(home): marketplace landing focado no contratante · ICP Jardim Umarizal (0063016b)
- feat(oportunidade): Co como plataforma para academia (pesquisa · ensino · extensão) (564d019a)
- feat(oportunidade): receita em três fontes · BRL · Co como hub de comm (7f87a96e)
- feat(oportunidade): tese de descentralização e marco GPL Q2 (1163eb32)
- feat(perfil): poema "Inocência" sob /kiyoshi/ (0d2f7564)
- feat(analytics): identidade compartilhada entre subdomínios + click_app (e2570ea8)
- feat(brand): favicon a partir do L do logo (22a14480)
- feat(sobre): seção História + call-to-action Oportunidade (1a7a66c1)
- feat(solucoes): hub Arte Longa · meta no catálogo · perfil de Hedix interno (d6c9cb9f)
- feat(diagram): identidade ilustrada · mesh em tempo real (sem AUTH/setas) (b4fb7d6e)
- feat(solucoes): Universos · ativos vs futuro · diagrama de arquitetura (1217e832)
- feat(yuri/showall): descrição inicial · jacdias link · ShowAll agrupado · UX editorial (99c8844f)
- feat(yuri): revisão da bio + ShowAll mode em /parceiros/ (5c2586b1)
- feat(site): perfil yuri "Terra" + analytics self-hosted + A/B + modal em-breve (c295352e)
- feat(sylvia): Syl Saghira — bio completa, role Cientista-artista, 3 servicos novos (afecf151)
- feat(quilomboaraucaria): adiciona Rogerio, Alzira e Joao aos membros de QA (37040b8c)
- feat(parceiro): Joao — bio completa + 4 servicos novos de psicologia (499f652c)
- feat(parceiro): Retro Umarizal Burger & Chopp — perfil + cardapio (35b54623)
- feat(parceiro): Retro Burger — hambúrgueres artesanais (f75a2052)
- feat(catalogo): CNAE completo + gaps de missoes + cleanup (3/3) (2ce7ae97)
- feat(catalogo): ponte missao <-> servico (Commit 2/3) (d0a0254f)
- feat(hedix): Desenvolvimento de API em servicos + bundledServices (7b73c719)
- feat(solucoes): Hedix - Market Making em Mercados de Previsao (0433d57f)
- feat(parceiros): Miguel (Futuro) (23233739)
- feat(joseantonio): adiciona Mentoria Espiritual (be843383)
- feat(analytics): beacon self-hosted (Fase 1 frontend) (eec7a2d9)
- feat(alice): adiciona pfp (a230fd4a)
- feat(parceiros): Alice (Movimento) e Ramona (Internalizacao) (bd0095af)
- feat(recursos): fecha gap com Servicos + 3-card alinhamento Q2 (7e2f9903)
- feat(parceiros): marcador de socio + reorder Marina/Karina (9ed47c0b)
- feat(sobre): manifesto enxuto + tipografia unificada (1a1076e3)
- feat(content): novas pessoas, parceria QA pro-bono, catálogo refatorado (f180da5c)
- feat(ui): floating hover card + popover pattern + schema v2.1 (417e4f7a)
- feat(recursos): modelo de negócio detalhado com receita projetada (ab22378d)
- feat(recursos): adiciona /recursos — transparência financeira (21d9eead)
- feat(content): fotos yuri/qa/luke, resumo + PDF Raízes do Futuro, CTA enxuto, b&w (5bd5d79f)
- feat(site): contadores de idade, produtos digitais, desenvolvimento web (d34423fa)
- feat(parceiros): Kiyoshi (Shin) e Soninha sob Yuri (24203fb6)
- feat(parceiros): adiciona Rogério e Alzira abaixo de Raquel (e2fda6fc)
- feat(parceiros): adiciona Sylvia, Raquel, Alicia sob Bruna, John sob Aime (6e459f3a)
- feat(site): estrutura inicial — home, parceiros, produtos e serviços, sobre (99256f70)

## Recentes fixes (últimos 30 dias)

- fix: shells faltantes + Kelly/Matheus em quilombo + audit guards (#41) (e8c0fa23)
- fix(home): chip counts atualizam ao filtrar por nome (e58a3653)
- fix(renderer): try/catch no dispatch evita blank page silencioso (f6d33a35)
- fix(bootstrap): renderer roda mesmo se DCL ja passou (251d7bfe)
- fix(contato): pills toggle físico/digital + rename /index/ → /mapa/ (4e89a4ad)
- fix: contato hero · físico/digital · analytics empty state enxuto (7616a4ba)
- fix(recursos): fecha gap custos × meta · clarifica Interpretação vs Tradução (e6765060)
- fix(planos): planos sem hours mostram "Sob consulta" (era "Sob demanda") (1f3c7059)
- fix(catalog): Sylvia services todos viram Sob consulta (1e72a891)
- fix: 6 service shells faltando que retornavam 404 (2f5593ab)
- fix(precos): fórmula por palavra ilegível · vira "Tarifa-base R\$ 100/h" (1b6fea8a)
- fix(precos): per-unit (palavra) usa rate da rede · ignora non-sócio rule (e7eb082e)
- fix(home): dropdown próprio em vez de datalist · só valores do DB (9f65ee7a)
- fix(home): 3 inputs separados (Estado · Cidade · Bairro) · default cinza · CTA empty (954f9f39)
- fix(faca-parte): tira anglicismos · "Padrão da rede, defina a sua" (2d5bbdc8)
- fix(faca-parte): "Como funciona" em 6 cards enxutos · gestão = preço de parceiro (a4872294)
- fix: GNU GPL Q2 volta · /faca-parte/ corrige copy · footer fixo (c8c3420c)
- fix(home): label "Para parceiros" visível no CTA secundário (6148ead7)
- fix(tortas): Sob demanda também Sob consulta · cliente fala com Veh direto (91abdcd8)
- fix: Sob demanda computa hours · Semanal/Mensal Sob consulta · 404 dos serviços novos (785e5075)
- fix(precos): reverter flat R\$ 1.000 (era typo) · tudo em hours × R\$ 100/h (3a8e6df6)
- fix(oportunidade): renomear "The Universe" para "O Universo" e enxugar lista de templates (4d79dcf1)
- fix(perfil): grafia guarani na bio do Yuri (38f20bae)
- fix(valores): título opcional · Desenvolvimento Sustentável só com texto (b3056499)
- fix(valores): texto do valor Desenvolvimento Sustentável (c2d79555)
- fix(sobre): História antes de Manifesto (9d5322ba)
- fix(solucoes): title volta a ser "Soluções" (não "Universos") (3f80a664)
- fix(home-links): uma linha por item · seta ao final (6a061977)
- fix(modal): remove "em breve" duplicado — só footer EM BREVE permanece (94c1470c)
- fix(yuri): pequenas quebras na estrofe "Não se esquece de respirar" (7d1a97ef)
- fix(html): corrige titulo das paginas (era "U<handle>") em 21 perfis (4f84585b)
- fix(roster): adiciona Joao ao rosterOrder (top-level apos Miguel) (32ac322e)
- fix(servicos): remove nota "a formalizar" da pagina do servico (ee98c9d2)
- fix(recursos): Market Making rampa tambem aponta hedix-solution (af0f6596)
- fix(recursos): API Development aponta para hedix-solution (9f808a0a)
- fix: publica alice.png + corrige role da Ramona (4c857a82)
- fix: Aime nao e "em memoria" + exemplos estatico/dinamico invertidos (3f0ff581)
- fix(parceiros): asterisco de socio visivel (estava somido no flex) (c65e156b)
- fix(sobre): Rerum Novarum subtitulo completo + UAT alinhada (93b8ebb6)
- fix(profile): contador de idade em anos/meses/dias, minutos em movimento (f6ae52ae)

---

## Backlog aberto

Tasks abertas em `work/artelonga/`:

| Task | Status | Resumo |
|---|---|---|
| AL-4 | aberto | /contato/ persiste leads no co backend (substituir mailto) |
| AL-26 | em andamento | Portfolio abstraction: poemas + ensaios em profile.yaml.portfolio |

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

- Total de commits: 163
- Membros catalogados: 36 (AL-1)
- Comunidades: 3 (AL-2)
- Serviços no catálogo: ~50 top-level + sub-serviços
- Universos (oportunidade): 5+ ativos + futuros
- Cache version atual: ver `assets/bootstrap.js:18`
