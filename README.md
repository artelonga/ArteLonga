# Arte Longa

Agência de gestão de carreira, marca e produto, tecnologia e comunicação.
Site público: **[artelonga.com.br](https://artelonga.com.br)**.

Este repositório é o **universo de conteúdo** público do coletivo — perfis de membros, comunidades parceiras, serviços, missões, eventos, jardim editorial. É também o site estático que renderiza esse conteúdo. Sem build no caminho crítico de deploy: GitHub Pages serve direto do `main`.

---

## Rodar localmente

Site é estático; basta servir os arquivos.

```bash
python3 -m http.server 8000
# ou:  npx serve .
```

Acessa em `http://localhost:8000`. Mudanças em arquivos = hard reload no browser (sem hot reload — é vanilla JS no caminho de render).

Pra trabalhar no design system (`/design/`) ou nos componentes TS (`src/`):

```bash
npm install
npm run dev          # Vite dev server (porta 5173)
npm run typecheck    # tsc --noEmit
npm test             # Playwright smoke + a11y (9 páginas)
npm run audit        # audit-shells + audit-consistency + audit-handles
```

## Deploy

**`main` → produção automática.** GitHub Pages republica em ~1min após push. CDN (Fastly) tem TTL ~10min — propagação completa dentro disso. Bumpar `V` em `assets/bootstrap.js` invalida assets versionados imediatamente.

Sem CI build step. Bakes de `assets/data.js` (people, communities, services, missions, solutions, finances) rodam opt-in via `npm run bake-*` — exigidos quando se edita os YAMLs source-of-truth. Pre-commit hook (`tools/pre-commit-check.mjs`) bloqueia commits que driftam `data.js` dos YAMLs.

## Mapa de documentação

Para entrar no projeto, leia nessa ordem:

| Doc | O que é | Quando consultar |
|---|---|---|
| [`docs/STATE.md`](docs/STATE.md) | **Snapshot do projeto agora** — stack, 4 fases narradas, backlog aberto, princípios | Onboarding em 10min |
| [`docs/LESSONS.md`](docs/LESSONS.md) | **Catálogo append-only de anti-patterns** mineradas dos fixes históricos (L-001..L-021) | Antes de começar qualquer trabalho |
| [`docs/SCHEMA.md`](docs/SCHEMA.md) | Spec dos YAMLs source-of-truth (Person, Community, Service…) | Quando mexer em data layer |
| [`docs/analytics-api.md`](docs/analytics-api.md) | Wire contract do endpoint de telemetria | Quando mexer em analytics |
| [`docs/ABSTRACTIONS.md`](docs/ABSTRACTIONS.md) | Modelos mentais por trás do código | Quando refatorar |
| [`docs/UAT.md`](docs/UAT.md) | Checklist de aceitação manual | Antes de release |
| [`openapi/artelonga.yaml`](openapi/artelonga.yaml) | Schema OpenAPI — single source of truth pras shapes | Quando mexer em data layer |
| [`src/types.ts`](src/types.ts) | TypeScript types espelhando o schema | Quando escrever TS |
| [`CHANGELOG.md`](CHANGELOG.md) | Histórico narrativo por release com o "why" | Quando precisar contexto histórico |
| [`work/artelonga/AL-N.md`](work/artelonga/) | **Backlog co-auto** — tasks abertas (todo) + done retroativas | Pegar próximo trabalho |
| [`CLAUDE.md`](CLAUDE.md) | Stack, conventions, V bumping, como editar (carregado pelo agente) | Sempre |

## Universe

- **Slug**: `artelonga`
- **API base**: `/api/v1/universes/artelonga` (servido por [`artelonga/co`](https://github.com/artelonga/co))
- **Viewer**: `/co/artelonga`
- **Visibility**: public

## Stack

Vanilla JS no runtime (zero framework no caminho de render). TS + Vite só para `/design/` e migração progressiva de componentes (`src/`). YAMLs source-of-truth, baked para `data.js`. GitHub Pages como CDN. Backend de identidade e API (`co.artelonga.com.br`) em [`artelonga/co`](https://github.com/artelonga/co) (Rust + Axum, deployado em Fly.io).

## Quality gates

Toda PR roda `.github/workflows/quality.yml`:

- **Playwright** smoke (status 200, h1 presente, sem console errors em 9 páginas)
- **@axe-core/playwright** (WCAG 2.0 A + AA, zero violações critical/serious)
- **Lighthouse CI** (LCP < 2.0s, CLS < 0.1, Performance ≥ 90, SEO ≥ 95, A11y ≥ 90)

Detalhe da budget e como rodar local: `CLAUDE.md#quality-gates`.

## Contribuir

PRs bem-vindos. Convenção:

- **1 conventional commit por AL** (`feat(AL-N): …`, `fix(AL-N): …`).
- **Branches**: `feat/al-N-<slug>`.
- **Only stage files you changed**: `git add file1 file2` (nunca `git add -A`).
- **Never force push to `main`**; nunca `--no-verify` no commit (pre-commit hook é load-bearing — vide L-021).

Detalhes em `CLAUDE.md#convenção-de-pr`.
