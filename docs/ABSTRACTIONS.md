# Arte Longa · Abstrações

Modelo conceitual da rede. Conteúdo em markdown, paridade com `quilomboaraucaria.org`
para que tudo seja legível pelo `co-web` quando migrarmos.

## Username (handle)

Toda entidade tem um campo `handle` que funciona como **username único global**.

- É a URL: `/<handle>/` (ex: `/joseantonio/`, `/yuri/`, `/quilomboaraucaria/`)
- É a referência em qualquer relação: `responsavel: [joseantonio]`, `membros: [antony, bia, ...]`
- É o identificador em `data.js`, `AL.get(handle)`, `AL.byHandle[handle]`
- Convenção: minúsculas, sem espaços, sem acentos, sem pontos — `joseantonio` (não `jose-antonio` nem `José`)
- Imutável uma vez publicado (renomear = mudar URL → requer redirect stub em `/<handle-antigo>/`)

Uma entidade pode ter múltiplos atributos de nome:
- `handle` — username (`joseantonio`)
- `nome` — display curto (`José Antônio`)
- `nomeCompleto` — opcional (`José Antônio Corral Dias`)

## Lifecycle flags (status)

Quatro estados de atividade, todos booleanos:

| Flag        | Significado                                   | Exclui do catálogo ativo? | Perfil mostra serviços?       |
|-------------|-----------------------------------------------|---------------------------|-------------------------------|
| (nenhum)    | Ativo                                         | não                       | "Serviços"                    |
| `aposentado`| Retirado da vida profissional                 | sim                       | "Legado"                      |
| `underage`  | Menor de 18 · universo privado parental       | sim                       | oculto (nota parental)        |
| `emMemoria` | Já faleceu · memória preservada como arte     | sim                       | "Serviços" (memorial) · foto b&w |

Abstração universal: qualquer pessoa referenciável (de Sócrates a um avô de parceiro) é um `membro` com handle + flags apropriados. O sistema distingue visualmente mas o shape é o mesmo.

## Hierarquia (recursiva)

```
Universo (Arte Longa, Quilombo Araucária, Hedix — cada um em seu próprio repo)
  └─ Comunidade (recursiva — pode conter comunidades)
       ├─ Missão (comunidade com objetivo explícito, entregável)
       │    └─ Serviço (oferta concreta no catálogo)
       │
       ├─ Membro (pessoa ou sub-comunidade)
       ├─ Relato (post, ensaio, portfolio)
       └─ Evento (encontro, lançamento)
```

**Regra única**: uma Missão é uma Comunidade com campo `objetivo`.
**Regra única**: um Serviço é uma Missão com campo `preco`/`cnae` ou que esteja
no catálogo público (vendável).

Tudo é recursivo: uma comunidade pode conter comunidades.

## Tipos (paridade com `quilomboaraucaria.org`)

| Tipo         | Descrição                                                | QA? |
|--------------|----------------------------------------------------------|-----|
| `membro`     | Indivíduo                                                | ✓   |
| `comunidade` | Agrupamento (inclui empresas, coletivos, quilombos, universos) | (implícito em QA) |
| `missao`     | Comunidade com objetivo (ex: Raízes do Futuro)           | ✓   |
| `servico`    | Oferta concreta no catálogo                              | (novo) |
| `solucao`    | Pacote de serviços em plataforma (Co, Yggdrasil, etc)    | (novo) |
| `relato`     | Post, ensaio, portfolio                                  | ✓   |
| `evento`     | Encontro, lançamento, data                               | ✓   |
| `pagina`     | Página estática (sobre, proximos-passos, recursos)       | ✓   |

## Convenções de arquivo

```
/membros/<handle>.md                       # pessoa
/comunidades/<handle>.md                   # comunidade (flat)
/comunidades/<handle>/                     # ou aninhada quando a comunidade é complexa
    index.md                                #   overview
    missoes/<slug>.md                       #   missões próprias
    membros/<handle>.md                     #   membros próprios (opcional, ou by reference)
/missoes/<slug>.md                         # missão top-level (universo Arte Longa)
/servicos/<slug>.md                        # serviço (catálogo)
/solucoes/<slug>.md                        # solução (bundle)
/relatos/<autor>/<slug>.md                 # relato (post, ensaio, portfolio)
/eventos/<slug>.md                         # evento
/modelos/<tipo>.md                         # templates
```

### Exemplo · membro (`/membros/yuri.md`)
```yaml
---
type: membro
nome: Yuri
slug: yuri
role: Sementes
servicos: [Escrita, Interpretação e Tradução, Desenvolvimento Web, ...]  # áreas que entrega
birthDate: 1993-06-24T12:30:00-03:00
tags: [fundador, parceiro]
publicado: true
---
```

### Exemplo · missao (`/comunidades/quilomboaraucaria/missoes/raizes-do-futuro.md`)
```yaml
---
type: missao
nome: Raízes do Futuro
slug: raizes-do-futuro
objetivo: Projeto educacional — formação e cultura enraizadas na terra.
comunidade: quilomboaraucaria
attachments:
  - label: Projeto (PDF)
    url: /servicos/raizes-do-futuro/projeto.pdf
    kind: pdf
publicado: true
---
```

### Exemplo · servico (`/servicos/desenvolvimento-web.md`)
```yaml
---
type: servico
titulo: Desenvolvimento Web
slug: desenvolvimento-web
responsavel: [yuri]
cnae:
  - { c: "6201-5/02", d: "Web design" }
  - { c: "6202-3/00", d: "Desenvolvimento e licenciamento de software customizável" }
preco: R$ 100/h
publicado: true
---
```

### Exemplo · relato (`/relatos/yuri/2026-04-18-abstracoes.md`)
```yaml
---
type: relato
subtype: ensaio                # ensaio | post | portfolio | nota
nome: Abstrações da rede
slug: abstracoes-da-rede
autor: yuri
comunidade: artelonga
data: 2026-04-18
tags: [arquitetura]
publicado: true
---

# Abstrações da rede
...
```

## Sobre Quilombo Araucária (nested)

No `artelonga` repo, QA é um **resumo** — o site completo com missões, relatos,
membros detalhados e eventos vive em [quilomboaraucaria.org](https://quilomboaraucaria.org)
(próprio repo, próprio `co-web`).

```
/comunidades/quilomboaraucaria/
    index.md                               # overview curto
    missoes/
        raizes-do-futuro.md                # (espelho) pleno em quilomboaraucaria.org
        resistencia-dos-povos-originarios.md
        desenvolvimento-sustentavel.md
```

Arte Longa mostra só o suficiente para apresentar a parceria — a fonte canônica
dos detalhes fica em `quilomboaraucaria.org`.

## API · `window.AL`

Index em memória (gerado do markdown). Shape final:

```js
AL.membros                        // array de pessoas
AL.comunidades                    // agrupamentos (inclui nested)
AL.missoes                        // missões (comunidades com objetivo)
AL.servicos                       // catálogo
AL.solucoes                       // soluções (bundles)
AL.relatos                        // posts/ensaios/portfolio
AL.eventos                        // eventos
AL.paginas                        // páginas estáticas
AL.finances                       // modelo de negócio

// Lookups
AL.get(handle)                    // qualquer entidade
AL.byHandle[handle]
AL.roster()                       // ordem editorial /parceiros/
AL.publicServices()               // catálogo filtrado
AL.membrosDe(comunidadeHandle)
AL.subMembrosDe(membroHandle)
AL.missoesDe(comunidadeHandle)
AL.servicosDe(missaoHandle)
AL.relatosDe(autorHandle)
AL.relatosEm(comunidadeHandle)
AL.eventosEm(comunidadeHandle)
AL.servicoBySlug(slug)
AL.missaoBySlug(slug)
AL.relatoBySlug(autor, slug)
AL.solucaoBySlug(slug)
AL.bundledServicos(solucaoHandle)
AL.solucoesUsandoServico(titulo)
AL.servicosRelacionados(titulo)
AL.slugify(str)
```

## Pipeline

```
/membros/*.md         ─┐
/comunidades/**/*.md  ─┤
/missoes/*.md         ─┤
/servicos/*.md        ─┼─►  build.mjs  ─►  /assets/data.js  ─►  renderer.js  ─►  DOM
/solucoes/*.md        ─┤
/relatos/**/*.md      ─┤
/eventos/*.md         ─┘
```

- **Editar** = editar markdown + `node build.mjs` (ou pre-commit hook)
- **Adicionar relato** = criar `/relatos/<autor>/<slug>.md` + rebuild
- **Assinar** (subscription) = o próprio repo público no GitHub. `Watch → All activity` notifica cada commit.

## Compatibilidade com `co-web`

Quando migrarmos:
- `content-import.ts` do `co-web` lê os mesmos arquivos markdown.
- Popula SQLite com mesmos índices.
- Serve via SvelteKit com rotas equivalentes ao que renderizamos hoje.
- Ganha auth, posts dinâmicos, subscrições in-app, API HTTP.

Durante o período estático, `build.mjs` é a ponte.

## Roadmap

- [x] Index com shape definitivo (`window.AL`) + renderer funcional
- [x] `/docs/ABSTRACTIONS.md` com modelo aprovado
- [x] `/schema.yaml` v2 (tipos alinhados a QA)
- [ ] Reclassificar: `missoes/*.md` que são serviços → `servicos/*.md`
- [ ] Reservar `/missoes/` para missões de verdade (objetivo explícito)
- [ ] Pessoa.servicos em vez de pessoa.missoes (field rename)
- [ ] Comunidade aninhada: `/comunidades/<handle>/` como dir
- [ ] `/relatos/<autor>/<slug>.md` — primeiro ensaio (este, sobre abstrações)
- [ ] Página `/relatos/` (listagem) + `/relatos/<autor>/<slug>/` (detalhe)
- [ ] `build.mjs` lê markdown → gera `data.js`
- [ ] Migrar dados hardcoded em `data.js` para markdown
- [ ] Migração para `co-web` quando precisar de dinâmico
