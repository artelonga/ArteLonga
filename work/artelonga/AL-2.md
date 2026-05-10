---
id: 2
title: "Migrar communities de data.js para per-community YAML"
type: user-story
status: todo
priority: medium
labels:
  - refactor
  - content
  - build
  - lgpd
module: data
parent: 1
created_at: 2026-05-10T00:00:00Z
updated_at: 2026-05-10T00:00:00Z
---

GIVEN AL-1 já estabeleceu o pattern de per-handle YAML pra `people` (com
`tools/bake-people.mjs` regenerando o bloco AUTO-GENERATED em `data.js`),
AND `communities` em `data.js:707-763` segue a mesma forma — array de
entries com handle/nome/bio/servicos/membros/parcerias hardcoded num único
arquivo (3 entries hoje: quilomboaraucaria, hfsassociados, hedix), AND
ownership de comunidades também é LGPD-relevante (membros, parcerias,
contribuições nominais),

WHEN movemos cada community pra `<community-handle>/community.yaml`
(mesma convenção YAML puro do AL-1), AND adicionamos build script
`tools/bake-communities.mjs` (ou estende o `bake-people.mjs` existente
pra cobrir também communities), AND marcamos a seção `communities` em
`data.js` como AUTO-GENERATED entre marcadores
`AUTO-GENERATED:COMMUNITIES-START/END`,

THEN cada community owner pode editar/PR seu próprio diretório, AND o
renderer continua consumindo o array `communities` exposto via
`window.AL.communities` sem mudança, AND o site renderiza identicamente.

---

## Estado atual

`assets/data.js:707-763` define `const communities = [ ... ]` com 3 entries:
- `quilomboaraucaria` — community completa com membros[], parcerias[],
  contribuicoes nominais ("yuri faz X", "mono faz Y").
- `hfsassociados` — minimal (contabilidade, sem membros).
- `hedix` — minimal (sem membros).

Campos:
```js
{
    handle, type: "community", nome, role, tags,
    pic, tagline, bio,
    externalUrl, site,
    servicos: [...],            // catálogo de serviços que a community oferece
    membros: [...],             // handles de membros (resolve via AL.get)
    parcerias: [{               // parcerias com Arte Longa ou outras
        de, tipo, descricao,
        contribuicoes: [{ quem, oque }]
    }],
    sectionBreak                // UI hint pro renderer
}
```

Pasta `<community-handle>/` já existe pra `quilomboaraucaria/` (com pic),
provavelmente pras outras também. Confirmar antes de criar.

## Estado-alvo

```
<community-handle>/
├── community.yaml    # source of truth (NOVO)
├── index.html        # entry point HTML (sem mudança se já existir; criar se faltar)
└── *.{png,jpg}       # pic referenciado
```

`assets/data.js` mantém a seção `communities` mas vira AUTO-GENERATED:

```js
// AUTO-GENERATED: do not edit by hand. Run `node tools/bake-communities.mjs`
// (or unified `node tools/bake.mjs` if scripts foram unificados).
// AUTO-GENERATED:COMMUNITIES-START
const communities = [ /* ... */ ];
// AUTO-GENERATED:COMMUNITIES-END
```

Resto do data.js (services, missions, universos, portfolio) **não muda**.

## Formato `<community-handle>/community.yaml`

```yaml
handle: quilomboaraucaria
type: community
nome: Quilombo Araucária
role: Terra
tags: [comunidade, parceiro]
pic: /quilomboaraucaria/quilomboaraucaria.png
tagline: Natureza Viva, Futuro Ancestral
bio: |
  Espaço de resistência ambiental, cultural e social.
externalUrl: https://quilomboaraucaria.org
site: https://quilomboaraucaria.org
servicos:
  - Agrofloresta
  - Compostagem
  - Educação Ambiental
  - Produção de Desfile
  - Futebol e Esporte
membros:
  - antony
  - bia
  - ken
  - quinho
  - tiao
  - veh
  - carlinhos
  - mara-brandao
  - yuri
  - igo
  - joseantonio
  - mono
  - bruna
  - rogerio
  - alzira
  - joao
parcerias:
  - de: artelonga
    tipo: pro-bono
    descricao: |
      Arte Longa construiu a plataforma digital e a comunicação do Quilombo
      Araucária sem cobrar — como contribuição ao impacto ambiental, social
      e cultural.
    contribuicoes:
      - quem: yuri
        oque: |
          Inteligência e Tecnologia · todos os subcomponentes (Desenvolvimento
          Web, API, Dados, Nuvem, Computação, Hardware, Redes, Sistemas,
          Software) + Tráfego e Crescimento
      - quem: mono
        oque: Design · Privacidade e Segurança
      - quem: bruna
        oque: Criação de Conteúdo
      - quem: igo
        oque: Conexões
sectionBreak: true
```

Campos opcionais omitidos se vazios/falsy (mesma convenção do profile.yaml).

## Implementação

### Decisão: script novo OU estender `bake-people.mjs`?

Recomendo **estender**, renomeando pra `tools/bake.mjs` que cobre múltiplos
content types. Reduz duplicação. Mas se ficar mais simples manter
`bake-people.mjs` + `bake-communities.mjs` separados, tudo bem — saída
final é igual.

Se estender, expor um modo subcomando:
```
node tools/bake.mjs people
node tools/bake.mjs communities
node tools/bake.mjs all       # default
```

### Phase 1: Build script

Lê:
1. Glob `*/community.yaml` na raiz.
2. Parse YAML → objeto JS.
3. Validate shape mínimo (`handle`, `type === "community"`, `nome`).
4. Ordena pela ordem do data.js atual (`tools/communities-order.txt`
   opcional, ou simplesmente alfabético — só 3 entries, ordem importa
   pouco; preservar ordem original pra evitar diff).

Escreve:
- Substitui o bloco entre `AUTO-GENERATED:COMMUNITIES-START/END`.
- Output formatado igual ao bake-people (2-space indent, trailing comma).
- Roda `node -e "require('./assets/data.js')"` pra validar.

Determinístico: mesmo input → byte-idêntico output.

### Phase 2: Migração inicial

Script auxiliar one-shot ou edição manual (só 3 entries):
- Cria `quilomboaraucaria/community.yaml`, `hfsassociados/community.yaml`,
  `hedix/community.yaml`.
- Cria pastas + `index.html` se não existirem (template padrão).

### Phase 3: Wire ao build

- Adicionar `bake.mjs communities` (ou bake-communities.mjs) ao mesmo
  fluxo de pre-commit / GH Action que AL-1 estabelece.
- Atualizar `CLAUDE.md` raiz: instruções de "como editar perfil de
  comunidade" parallel ao "como editar perfil de membro".

### Phase 4: Limpeza

- Substituir `communities` em data.js pelo bloco AUTO-GENERATED.

## Critérios de aceitação

- [ ] 3 arquivos `<handle>/community.yaml` criados, validados.
- [ ] Build script regenera `communities` em `data.js` byte-idêntico
      em runs consecutivos.
- [ ] `node -e "require('./assets/data.js')"` passa.
- [ ] `AL.communities.length === 3`, `AL.get('quilomboaraucaria')` retorna
      objeto com mesmo shape de antes (membros[], parcerias[] preservados).
- [ ] Site renderiza identicamente — comparar `/quilomboaraucaria/`,
      `/parceiros/` antes/depois.
- [ ] V bumpado em `bootstrap.js`.
- [ ] CHANGELOG atualizado.
- [ ] `CLAUDE.md` raiz inclui instruções pra communities.

## Out of scope

- Migrar `services` (50 entries) — abrir AL-3 se desejado.
- Migrar `missions` / `universos` / `portfolio` — separados.
- Backend integration: `co` consumir `community.yaml` em vez de listar
  via API.

## Notas

- Quilomboaraucaria tem array `membros` longo (16 handles) — todos já
  existem em `<handle>/profile.yaml` após AL-1. Validar que cada handle
  ali resolve via `AL.get(handle)` no runtime (sanity check no bake).
- `parcerias[].contribuicoes[].oque` pode ser texto longo — usar literal
  block scalar (`|`) quando passar de uma linha.
- `pic: null` em hedix e hfsassociados → omitir o campo no YAML, não
  setar como `null` literal. O bake re-adiciona como `pic: null` no
  data.js só se a renderização precisar — checar comportamento atual.

## Related

- AL-1 — pattern estabelecido pra people.
- `assets/data.js:707-763` — fonte atual de `communities`.
- `assets/renderer.js` — consumer (renderProfile pra community type,
  renderParceiros, etc).
