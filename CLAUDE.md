---
type: doc
title: CLAUDE.md
---

# ArteLonga

Agência de gestão de carreira, marca e produto, tecnologia e comunicação.
Site público em [artelonga.com.br](https://artelonga.com.br).

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
2. Rode `node tools/bake-people.mjs` para regenerar `assets/data.js`.
3. Bumpe `V` em `assets/bootstrap.js` para invalidar o cache do GitHub Pages.
4. Commit: `refactor(<handle>): atualiza perfil`.

Para adicionar um novo membro:
1. Crie a pasta `<handle>/` com `index.html` (copie de outro membro).
2. Crie `<handle>/profile.yaml` com os campos obrigatórios (`handle`, `type`, `nome`).
3. Adicione o handle em `tools/people-order.txt` na posição desejada.
4. Rode `node tools/bake-people.mjs`.

## Como editar o perfil de uma comunidade

A seção `communities` em `assets/data.js` é **AUTO-GENERATED** — não edite diretamente.

1. Edite `<handle>/community.yaml` (ex: `quilomboaraucaria/community.yaml`).
2. Rode `node tools/bake-communities.mjs` para regenerar `assets/data.js`.
3. Bumpe `V` em `assets/bootstrap.js` para invalidar o cache do GitHub Pages.
4. Commit: `refactor(<handle>): atualiza comunidade`.

Para adicionar uma nova comunidade:
1. Crie a pasta `<handle>/` com `index.html` (copie de outro handle).
2. Crie `<handle>/community.yaml` com os campos obrigatórios (`handle`, `type`, `nome`).
3. Adicione o handle em `tools/communities-order.txt` na posição desejada.
4. Rode `node tools/bake-communities.mjs`.
