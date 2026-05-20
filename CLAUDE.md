---
type: doc
title: CLAUDE.md
---

# ArteLonga

Agência de gestão de carreira, marca e produto, tecnologia e comunicação.
Site público em [artelonga.com.br](https://artelonga.com.br).

## Mapa de documentação

Para entrar no projeto, leia nessa ordem:

| Doc | O que é | Quando consultar |
|---|---|---|
| `docs/STATE.md` | **Snapshot do projeto agora** — stack, 4 fases narradas, backlog aberto, princípios | Onboarding em 10min |
| `docs/LESSONS.md` | **Catálogo append-only de anti-patterns** mineradas dos fixes históricos (L-001..L-020) | Antes de começar qualquer trabalho |
| `/design/` | **Design palette estática** — cores, tipografia, components do sistema (form sem content) | Quando for adicionar UI |
| `openapi/artelonga.yaml` | **Schema spec** — single source of truth pras shapes (Person, Community, Service) | Quando mexer em data layer |
| `src/types.ts` | **TypeScript types** espelhando o openapi schema | Quando escrever TS |
| `CHANGELOG.md` | Histórico narrativo por release com o "why" | Quando precisar contexto histórico |
| `work/artelonga/AL-N.md` | **Backlog co-auto** — tasks abertas (todo) + done retroativas | Pegar próximo trabalho |
| `<folder>/_feature.yaml` | **Manifesto de feature** — schema, bake script, renderer e instruções de "como adicionar" por pasta cross-cutting (`servicos/`, `solucoes/`, `missoes/`) | Quando for adicionar/editar entradas nessas pastas |
| Esse `CLAUDE.md` | Stack, conventions, V bumping, como editar | Sempre carregado pelo agente |

## Rodar localmente

Site é estático; basta servir os arquivos. Escolha um:

```bash
# Python 3 (vem nativo no macOS)
python3 -m http.server 8000

# Ou Node
npx serve .
# ou
npx http-server -p 8000
```

Acessa em `http://localhost:8000`. Mudanças em arquivos = hard reload no browser (sem hot reload — é vanilla JS).

**Nota:** o cache do `bootstrap.js?v=...` significa que pra ver CSS/JS atualizados em testes locais, você pode (a) bumpar V, (b) DevTools > Disable cache (com DevTools aberto), ou (c) hard reload (`Cmd+Shift+R`).

## Deploy

**Main → produção automática.** GitHub Pages detecta push em `main` e republica em ~1min. Cache Fastly (CDN do GH Pages) tem TTL de ~10min — propagação completa pode levar isso. Bumpar `V` em `bootstrap.js` invalida assets versionados imediatamente.

**Branch → preview manual.** GH Pages serve só `main`. Pra testar uma branch sem mergear:
- `git push origin <branch>` + checkout local em outra dev machine.
- Ou abrir PR e usar [GitHub Codespaces](https://github.com/codespaces) com a branch + `python3 -m http.server`.
- Ou (recomendado) merge PR com `--squash` em main após review — deploy é trivial e rollback é só reverter.

**Sem CI build step.** Não há `npm run build`. Os bakes de `data.js` (people, communities) são opt-in: rode antes de commitar se editou `<handle>/profile.yaml` ou `<handle>/community.yaml` (ver "Como editar perfil" abaixo).

## Universe

- **Slug**: `artelonga`
- **API base**: `/api/v1/universes/artelonga`
- **Viewer**: `/co/artelonga`
- **Visibility**: public

## Estrutura de diretórios

```
ArteLonga/
├── <membro>/           # pasta por nome de membro (ex: yuri/, alice/)
│   └── *.md            # serviços, relatos, missões do membro
├── comunidades/        # comunidades parceiras
├── docs/               # documentação interna
├── eventos/            # eventos realizados
├── jardim/             # conhecimento editorial (type: garden)
└── assets/             # imagens e mídias
```

## Content types

- `servico` — serviço oferecido por um membro (50 entries)
- `missao` — objetivo/missão de um membro (5)
- `membro` — perfil de um colaborador (5)
- `comunidade` — comunidade parceira (5)
- `garden` — artigo editorial do jardim (4)
- `relato` — relato/história publicada (2)
- `ref` — referência bibliográfica (1)
- `proj` — projeto em andamento (1)
- `node` — nó livre no grafo (1)
- `doc` — documentação interna

## API

```bash
# Listar serviços
curl /api/v1/universes/artelonga/entries?type=servico

# Busca full-text
curl /api/v1/universes/artelonga/entries?q=carreira

# Re-sincronizar após edição local
curl -X POST /api/v1/universes/artelonga/reindex \
  -H "Authorization: Bearer $TOKEN"
```

## Convenções

- Cada membro tem sua própria pasta nomeada com o handle (ex: `yuri/`)
- Serviços ficam na pasta do membro que os oferece
- `draft: true` no frontmatter = não publicado
- Datas no formato ISO-8601 (`date: 2024-11-28`)

## Lições críticas (consulte antes de codar)

Catálogo completo em `docs/LESSONS.md`. As load-bearing:

1. **L-001 — DCL race em script dinâmico.** Use `document.readyState` check.
2. **L-002 — Render fail silencioso.** Try/catch em todo dispatcher de body.innerHTML.
3. **L-003 — UI derivada de filtro deve atualizar toda.** Não só o output principal.
4. **L-004 — Copy ajuda compensa UI ruim.** Conserta UI primeiro.
5. **L-007 — URL sem shell HTML = 404.** Audit cross-coverage em toda mudança de catalog.
6. **L-008 — Termos de domínio são trabalho técnico.** Precisão > brevidade.
7. **L-009 — Dado multi-tenant em arquivo único viola LGPD.** Folder per owner.

Adicionar entrada nova em `docs/LESSONS.md` quando um fix ensinar algo
generalizável. Sintaxe: L-NNN, próximo número livre. Não remover entradas.

## Como editar o perfil de um membro

A seção `people` em `assets/data.js` é **AUTO-GENERATED** — não edite diretamente.

1. Edite `<handle>/profile.yaml` (ex: `yuri/profile.yaml`).
2. Rode `node tools/bake-people.mjs` (ou `npm run bake-people`) para regenerar `assets/data.js`.
3. Bumpe `V` em `assets/bootstrap.js` para invalidar o cache do GitHub Pages.
4. Commit: `refactor(<handle>): atualiza perfil`.

Para adicionar um novo membro:
1. Crie a pasta `<handle>/` com `index.html` (copie de outro membro).
2. Crie `<handle>/profile.yaml` com os campos obrigatórios (`handle`, `type`, `nome`).
3. Adicione o handle em `tools/people-order.txt` na posição desejada.
4. Rode `npm run bake-people`.

## Como editar o perfil de uma comunidade

A seção `communities` em `assets/data.js` é **AUTO-GENERATED** — não edite diretamente.

1. Edite `<handle>/community.yaml` (ex: `quilomboaraucaria/community.yaml`).
2. Rode `node tools/bake-communities.mjs` (ou `npm run bake-communities`) para regenerar `assets/data.js`.
3. Bumpe `V` em `assets/bootstrap.js` para invalidar o cache do GitHub Pages.
4. Commit: `refactor(<handle>): atualiza comunidade`.

Para adicionar uma nova comunidade:
1. Crie a pasta `<handle>/` com `index.html` (copie de outro handle).
2. Crie `<handle>/community.yaml` com os campos obrigatórios (`handle`, `type`, `nome`).
3. Adicione o handle em `tools/communities-order.txt` na posição desejada.
4. Rode `npm run bake-communities`.

> **Tip:** `npm run bake` roda todos os bakes em sequência (people + communities + services + missions + solutions + finances).

## Como editar um serviço

> Instruções completas (schema, bake, renderer, how_to_add) em **`servicos/_feature.yaml`**.

A seção `serviceCatalog` em `assets/data.js` é **AUTO-GENERATED** — não edite diretamente.

1. Edite `servicos/<slug>/service.yaml`.
2. Rode `npm run bake-services` para regenerar `assets/data.js`.
3. Bumpe `V` em `assets/bootstrap.js`.
4. Commit: `refactor(servico): atualiza <slug>`.

Para adicionar: siga `how_to_add` em `servicos/_feature.yaml`.

## Como editar uma missão

> Instruções completas (schema, bake, renderer, how_to_add) em **`missoes/_feature.yaml`**.

A seção `missions` em `assets/data.js` é **AUTO-GENERATED** — não edite diretamente.

1. Edite `missoes/<slug>/mission.yaml`.
2. Rode `npm run bake-missions` para regenerar `assets/data.js`.
3. Bumpe `V` em `assets/bootstrap.js`.
4. Commit: `refactor(missao): atualiza <slug>`.

Para adicionar: siga `how_to_add` em `missoes/_feature.yaml`.

## Como editar uma solução/universo

> Instruções completas (schema, bake, renderer, how_to_add) em **`solucoes/_feature.yaml`**.

A seção `solutions` em `assets/data.js` é **AUTO-GENERATED** — não edite diretamente.

1. Edite `solucoes/<handle>/solution.yaml`.
2. Rode `npm run bake-solutions` para regenerar `assets/data.js`.
3. Bumpe `V` em `assets/bootstrap.js`.
4. Commit: `refactor(solucao): atualiza <handle>`.

Para adicionar: siga `how_to_add` em `solucoes/_feature.yaml`.

## Como editar as finanças

O bloco `finances` em `assets/data.js` é **AUTO-GENERATED** — não edite diretamente.

1. Edite `recursos/finances.yaml`.
2. Rode `node tools/bake-finances.mjs` (ou `npm run bake-finances`) para regenerar `assets/data.js`.
3. Bumpe `V` em `assets/bootstrap.js` para invalidar o cache do GitHub Pages.
4. Commit: `refactor(financas): atualiza finances.yaml`.

## Audits (rodar antes de PR)

```
npm run audit              # roda os três abaixo
npm run audit-shells       # cada slug em data.js tem servicos/<slug>/index.html?
npm run audit-consistency  # profile.communities ↔ community.membros consistente?
npm run audit-handles      # toda referência de handle em data.js resolve para perfil existente?
npm run typecheck          # tsc --noEmit (valida src/*.ts contra openapi types)
```

- `audit-shells` previne L-007 (URL referenciada sem shell HTML = 404).
- `audit-consistency` previne o caso Kelly/Matheus (declarados em communities mas não em membros).
- `audit-handles` previne typos em handles e referências a perfis removidos (service.responsavel, citacoes.autor, subMembers, parentHandle, communities, membros, parcerias).
- `typecheck` valida que TS files (`src/`) batem com types do `src/types.ts`.

**`npm run validate-yaml`** — valida todos os YAMLs source-of-truth contra `openapi/artelonga.yaml#/components/schemas/{Person,Community,Service,Mission,Solution,Finances}`. Roda **automaticamente** antes de cada bake (pre-flight). Use direto pra checar sem rodar bake.

Todos exitam com código 1 se gap detectado. Listam exatamente o que está faltando.

## Fluxo co-auto → PR (owner approves)

Política: **agentes não auto-mergeiam**. Cada AL vira PR que owner revisa antes de mergear.

```bash
co-auto --task AL-N           # cria branch local, commita, NÃO push
npm run ship                  # push + abre PR no GitHub (NÃO merge)
# owner revisa em https://github.com/artelonga/ArteLonga/pull/<N>
# owner aprova: gh pr merge <N> --squash --delete-branch
# ou owner rejeita: gh pr close <N>
```

`npm run ship` (`tools/al-ship.mjs`):
- `git push -u origin <branch>` (set upstream se primeira vez).
- Detecta se já existe PR aberta — se sim, mostra URL e sai.
- Caso contrário, abre PR via `gh pr create` com title + body do último commit + checklist de revisão.

Agentes (Claude/co-auto) **não rodam** `gh pr merge`. Owner aprova.

## Pre-commit hook (L-021 prevention)

`.husky/pre-commit` roda `tools/pre-commit-check.mjs` em todo `git commit`. Checa que `assets/data.js` está em sync com os YAMLs source-of-truth (snapshot + bake + compare). Falha com instruções se drift detectado.

**Como ativar (uma vez por clone):**

```bash
npm install
# husky se auto-instala via prepare script
```

**Pra rodar manualmente sem commitar:**

```bash
npm run pre-commit
```

**Em emergência (não recomendado — descumprir o hook é como pular o cinto):**

```bash
git commit --no-verify
```

Lesson: `docs/LESSONS.md#L-021` — Mono incident (bio editada direto em data.js → bake sobrescreveria). Esse hook impede que repita.

## GitHub Actions

### `.github/workflows/bake-state.yml` — STATE.md auto-regen

Roda `node tools/bake-state.mjs` no primeiro dia de cada mês (cron `0 3 1 * *`) e via `workflow_dispatch` (manual). Se `docs/STATE.md` mudou, commita automaticamente com mensagem `chore(state): auto-bake STATE.md`.

**Rodar manualmente:**

```bash
gh workflow run bake-state.yml
```

Útil após mudanças estruturais que tornariam o STATE.md stale antes do próximo ciclo mensal.

## Design system

Princípio: **separar form de content**.

| Layer | Onde vive | O que é |
|---|---|---|
| Form (apresentação) | `assets/{site,components,pages}.css`, futuro `src/components/*.ts` | Como tudo se parece. Reusável. |
| Content (dado) | `<handle>/profile.yaml`, `<handle>/community.yaml`, `data.js` (auto-gen), endpoints `co` | O que é mostrado. Específico. |
| Schema (contrato) | `openapi/artelonga.yaml` | Shape single-source-of-truth. |
| Types | `src/types.ts` | TypeScript espelhando o schema. |
| Showcase | `/design/index.html` | Form em isolamento (sem content real). |

Pra ver os componentes do sistema (cores, buttons, badges, chips, cards, forms), abre `/design/` localmente ou em produção. É noindex/nofollow — só dev.

Quando criar componente novo:
1. Adicionar visual + markup + (se aplicável) TS interface em `/design/index.html`.
2. Adicionar tipos no `src/types.ts` (ou regenerar do openapi quando tivermos `openapi-typescript`).
3. Quando AL-23 ship, implementar em `src/components/<Component>.ts`.

## Convenção de PR

**1 conventional commit por AL.** PRs podem bundlar várias ALs quando isso expedita trabalho — o tracking fica nos commits, não na cardinalidade da PR.

**Commits:**
- Cada AL = pelo menos 1 commit `<tipo>(AL-N): <descrição>`.
- Tipos: `feat` (minor bump), `fix` (patch), `refactor` (patch), `docs` (patch), `chore` (no bump), `test` (patch).
- Multi-commit por AL é OK (`feat(AL-N): part 1`, `feat(AL-N): part 2`) se ajuda review/bisect.

**Branches:**
- `feat/al-N-<slug>` quando AL única na branch.
- `feat/al-N+M-<slug>` ou outro nome quando bundla múltiplas (sem padrão estrito).

**PRs:**
- Title: `<tipo>(AL-N): <título>` ou `<tipo>(AL-N+M): <descrição combinada>` se bundlado.
- Body: lista as ALs cobertas + bullet do entregue por AL. Referencia `work/artelonga/AL-N.md`.
- **Após merge:** marca `status: done` em cada AL-N.md afetada.

**Semver:**
- Bump derivado dos COMMITS, não da PR. `feat: …` em qualquer commit → minor bump no release.
- Multi-feat na PR = um minor bump (não cumulativo).

**Quando preferir split:**
- ALs com áreas de código disjuntas → 1 PR cada (review mais focado).
- Risco de regressão alto → isolar pra rollback granular.

**Quando preferir bundle:**
- ALs pequenas + work já feito junto → não desbundla por dogma.
- Refactor que toca mesma região → menos rebase.

Convenção é guideline, não regra rígida. Princípio: **rastreabilidade vem dos conventional commits**, PRs são unidades de review/deploy.

## Quality gates

Pipeline de qualidade automática: `.github/workflows/quality.yml` roda em todo PR e push.

```bash
npm test            # Playwright smoke + a11y (9 páginas, local com servidor auto-start)
```

### Stack

| Ferramenta | O que verifica |
|---|---|
| **Playwright** (`tests/e2e/smoke.spec.ts`) | Status 200, sem L-002 fallback, sem console errors, h1 presente |
| **@axe-core/playwright** | Zero violações axe critical/serious (WCAG 2.0 A + AA) |
| **Lighthouse CI** (`.lighthouserc.js`) | Performance, SEO, a11y scores + métricas de Core Web Vitals |

### Budget (bloqueia merge se ultrapassar)

| Métrica | Limite |
|---|---|
| LCP | < 2.0s |
| CLS | < 0.1 |
| Lighthouse Performance | ≥ 90 |
| Lighthouse SEO | ≥ 95 |
| Lighthouse Accessibility | ≥ 90 |
| Axe critical/serious violations | 0 |
| Total byte weight | < 500 KB (warn) |

### Ativar branch protection (uma vez, pelo owner)

Em GitHub → Settings → Branches → Branch protection rules → `main`:
- ☑ Require status checks to pass: selecionar `quality`
- ☑ Require branches to be up to date before merging

### Rodar localmente

```bash
npm test                    # inicia servidor automático, roda todos os testes
npx playwright test --ui    # modo interativo com UI do Playwright
npx @lhci/cli autorun       # Lighthouse (requer servidor em localhost:8000)
```

### Artefatos de falha

Em PR com falha, GitHub Action sobe `quality-artifacts` contendo:
- `test-results/` — Playwright traces + screenshots
- Lighthouse report (via temporary-public-storage URL no log)

### Baseline issues conhecidas (a corrigir em PRs separados)

| Regra axe | Impacto | Situação |
|---|---|---|
| `color-contrast` | serious | Site usa cinzas leves (#aaa, #999, #bbb) que não atingem 4.5:1 — desabilitado no smoke test; fix de CSS em PR separado |
