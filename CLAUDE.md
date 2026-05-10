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
| `CHANGELOG.md` | Histórico narrativo por release com o "why" | Quando precisar contexto histórico |
| `work/artelonga/AL-N.md` | **Backlog co-auto** — tasks abertas (todo) + done retroativas | Pegar próximo trabalho |
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

> **Tip:** `npm run bake` roda os dois bakes em sequência (people + communities).
