---
id: 2
title: "Migrar communities de data.js para per-community YAML"
type: user-story
status: done
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

## Critérios de aceitação

- [x] 3 arquivos `<handle>/community.yaml` criados, validados.
- [x] Build script regenera `communities` em `data.js` byte-idêntico
      em runs consecutivos.
- [x] `node -e "require('./assets/data.js')"` passa.
- [x] `AL.communities.length === 3`, `AL.get('quilomboaraucaria')` retorna
      objeto com mesmo shape de antes (membros[], parcerias[] preservados).
- [x] Site renderiza identicamente — comparar `/quilomboaraucaria/`,
      `/parceiros/` antes/depois.
- [x] V bumpado em `bootstrap.js`.
- [x] CHANGELOG atualizado.
- [x] `CLAUDE.md` raiz inclui instruções pra communities.
