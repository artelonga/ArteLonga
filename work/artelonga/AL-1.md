---
id: 1
title: "LGPD: migrar perfis de membros de data.js para per-handle markdown"
type: user-story
status: todo
priority: high
labels:
  - refactor
  - lgpd
  - content
  - build
module: data
created_at: 2026-05-10T00:00:00Z
updated_at: 2026-05-10T00:00:00Z
---

GIVEN os dados ricos de cada membro (bio, citações, sub-members, serviços,
foto, função) hoje vivem em `assets/data.js` num array `people = [...]` de
~750 linhas hardcoded, AND essa estrutura impede que cada membro tenha
controle direto sobre seu próprio conteúdo (acesso, edição, deleção pra
exercer direitos LGPD), AND mexer no perfil de uma pessoa hoje significa
editar um arquivo que mistura dados de 28+ membros + comunidades + negócios,

WHEN movemos cada perfil pra `<handle>/index.md` (frontmatter pra campos
estruturados + corpo markdown pra bio/citações), AND adicionamos um build
script `tools/bake-people.mjs` que lê todos os `<handle>/index.md` e
regenera a seção `people = [...]` em `assets/data.js` automaticamente,

THEN cada membro pode editar/excluir seu próprio diretório (jurisdição
clara — direito de acesso e portabilidade LGPD Art. 18), AND o `data.js`
continua sendo o artefato consumido pelo renderer (zero mudança na lógica
de runtime), AND o board público (artelonga.com.br) renderiza identicamente
ao estado atual após a migração.

---

## Estado atual

`assets/data.js:26-274` define `const people = [ ... ]` com 36 entries.
Cada entry pode ter os seguintes campos (não todos obrigatórios):

```js
{
    handle: "yuri", type: "person" | "business" | "reference",
    nome: "Yuri", role: "Sementes",
    tags: ["fundador", "parceiro"],
    pic: "/yuri/yuri.jpg?v=20260428",
    birthDate: "1993-06-24T12:30:00-03:00",
    bioTitle: "Terra",
    bioCurta: "...",
    bio: "...",         // multi-linha com markdown inline
    citacoes: [{ texto, autor, obra, data, url }],
    servicos: ["Inteligência e Tecnologia", ...],
    subMembers: ["kiyoshi", "soninha"],
    communities: ["quilomboaraucaria"],
    contacts: { tagline, ... },
    homeLinks: [...],
    emMemoria: true,
    referenceOnly: true,
    poems: [...]
}
```

Pasta `<handle>/` hoje contém só assets estáticos (imagens, áudio) +
`index.html` que carrega o SDK e renderiza o profile via
`renderer.js:renderProfile()`.

Backend `co` lê `membros/<handle>.md` (frontmatter mínimo) via API mas
o frontend ignora — duplicação de fontes da verdade.

## Estado-alvo

Para cada membro com handle `<h>`:

- `<h>/index.md` — fonte da verdade. Frontmatter pra campos estruturados,
  corpo markdown pra bio + bioCurta + citações.
- `<h>/index.html` — entry point HTML (já existe, sem mudança).
- `<h>/*.{jpg,png,ogg}` — assets estáticos referenciados pelo `pic`.
- `membros/<h>.md` — pode ser deletado OU virar symlink/stub que aponta
  pra `<h>/index.md` (decidir na implementação; symlink quebra GH Pages).

`assets/data.js` continua existindo mas a seção `people` vira:

```js
// AUTO-GENERATED: do not edit by hand. Run `node tools/bake-people.mjs`.
// AUTO-GENERATED:PEOPLE-START
const people = [ /* generated from <handle>/index.md files */ ];
// AUTO-GENERATED:PEOPLE-END
```

Demais seções (pricing, location, communities, services, missions,
universos, portfolio) **NÃO mudam** — ficam inalteradas em data.js.

## Formato do `<handle>/index.md`

```yaml
---
handle: yuri
type: person                # person | business | reference
nome: Yuri
role: Sementes
tags: [fundador, parceiro]
pic: /yuri/yuri.jpg?v=20260428
birthDate: 1993-06-24T12:30:00-03:00
bioTitle: Terra
bioCurta: "Filho de Kiyoshi e Soninha..."
servicos:
  - "Escrita, Interpretação e Tradução"
  - "Ensino, Formação e Liderança"
  - "Inteligência e Tecnologia"
subMembers: [kiyoshi, soninha]
communities: [quilomboaraucaria]   # omit se vazio
contacts:
  tagline: "..."
homeLinks:
  - { label: "Site", url: "..." }
emMemoria: false                   # omit se false
referenceOnly: false               # omit se false
citacoes:
  - texto: "..."
    autor: leaoxiii
    obra: "Rerum Novarum: sobre a condição dos operários"
    data: 1891-05-15
    url: "https://www.vatican.va/..."
---

[Filho de Kiyoshi e Soninha](/parceiros/#todos) e fascinado por todos que me inspiram.
Como neurocientista, busco compreender a consciência.
Como ser humano, busco compreender os saberes ancestrais.
Trabalho com desenvolvimento de [tecnologia sustentável](/solucoes/).

Não haviam nomes quando nossos ancestrais pisaram na Terra...

(corpo markdown vira o campo `bio`)
```

**Convenção:** se o corpo markdown estiver vazio, `bio = ""`. `bioCurta`
fica no frontmatter (curto, single-line). Citações longas com texto
multi-linha podem usar YAML literal block scalar (`|`) ou ficar como
markdown blockquote no corpo (decidir na implementação — preferir
frontmatter pra dados estruturados).

## Implementação

### Phase 1: Build script (`tools/bake-people.mjs`)

Script Node.js (não precisa de deps externas, usa só `fs`, `path`,
`yaml` já presente OU regex simples pra frontmatter).

Lê:
1. Todos os subdiretórios da raiz que tenham `<handle>/index.md`.
2. Parseia frontmatter YAML + corpo markdown.
3. Mapeia campos pro shape do array `people`.
4. Ordena pela ordem do data.js atual (preserva order pra evitar diff
   desnecessário) — pode usar um arquivo `tools/people-order.txt` se
   precisar.

Escreve:
- Substitui o bloco entre `// AUTO-GENERATED:PEOPLE-START` e
  `// AUTO-GENERATED:PEOPLE-END` em `assets/data.js`.
- Roda `node -e "require('./assets/data.js')"` no final pra validar.

Saída deve ser estável (mesmo input → byte-idêntico output).

### Phase 2: Migração inicial

Script auxiliar `tools/extract-people.mjs` (one-shot, descartável) que
faz o caminho inverso: lê o `data.js` atual, gera 28+ arquivos
`<handle>/index.md` com o conteúdo correspondente. Roda uma vez e é
deletado.

Para cada `<handle>` ainda sem pasta (ex: `joao`, `kiyoshi`,
`soninha`), criar a pasta + `index.html` (template padrão) +
`index.md` (gerado).

### Phase 3: Wire ao build

- Adicionar `tools/bake-people.mjs` ao fluxo de commit:
  - Pre-commit hook (opcional, via `package.json` scripts ou husky).
  - GH Action `.github/workflows/bake-people.yml` que roda em PRs e
    falha se `data.js` está dessincronizado de algum `<handle>/index.md`.
- Documentar em `CLAUDE.md` raiz: "pra editar perfil de membro,
  edite `<handle>/index.md` e rode `node tools/bake-people.mjs`."

### Phase 4: Limpeza

- Marcar a seção legada de `people` em `data.js` como
  AUTO-GENERATED (substitui pelo output do bake).
- `membros/<h>.md` (frontmatter mínimo do backend) pode coexistir
  ou ser removido — decidir depois (não bloqueia esse ticket).

## Critérios de aceitação

- [ ] Cada membro listado hoje em `data.js` tem um `<handle>/index.md`
      correspondente com frontmatter completo + corpo markdown (se houver bio).
- [ ] `tools/bake-people.mjs` existe, é determinístico, e regenera a seção
      `people` de `data.js` byte-idêntica em runs consecutivos.
- [ ] Após rodar o bake, `node -e "require('./assets/data.js')"` passa sem erro.
- [ ] `AL.people.length` e `AL.get('<handle>')` retornam os mesmos valores
      antes e depois da migração (verificável por snapshot test).
- [ ] Site renderiza identicamente — comparar `/`, `/parceiros/`, `/yuri/`,
      `/alice/`, `/joao/` antes/depois (manual ou via screenshot diff).
- [ ] V em `bootstrap.js` é bumpado.
- [ ] `CHANGELOG.md` documenta a mudança.
- [ ] `CLAUDE.md` raiz inclui instruções de "como editar perfil".

## Out of scope

- Migrar `services` array pra per-service markdown — separado, AL-2 talvez.
- Migrar `communities` array — idem.
- Migrar `missions` / `universos` / `portfolio` — idem.
- Backend integration: fazer o `co` consumir `<handle>/index.md` ao invés
  de `membros/<h>.md`. Pode-se manter os dois ou unificar depois.
- Authoring tools (CMS, web editor) — fora do escopo. Por enquanto editar
  via PR no Git é suficiente.
- Auto-detect de mudanças locais e re-bake automático no dev server.

## Notas de implementação

- **Bio multi-linha com markdown inline:** preservar quebras de linha e
  links exatamente como estão no `data.js` atual. Atenção a
  `\n\n` (parágrafos), `[text](url)` (links), e citações inline.
- **Citações com `autorEmBreve: { title: "Capítulo 1: Gênesis" }`:**
  campo opcional, preserva no frontmatter.
- **Yuri tem bio gigante (~50 linhas):** verificar que YAML literal block
  scalar (`bio: |`) ou markdown body lida com isso sem perda.
- **Business entries** (ex: `retro-umarizal` com `type: "business"`):
  mesmo padrão. `externalUrl` em vez de pic é OK.
- **Reference entries** (ex: `leaoxiii` com `referenceOnly: true`):
  podem ser people do tipo `person` mas com flag — preservar.

## Related

- `assets/data.js:26-274` — fonte atual de `people`.
- `assets/renderer.js:renderProfile` — consumer.
- `membros/<handle>.md` — backend's separate source (não impactado nesse ticket).
- `_universe.yaml` — schema do universe artelonga (verificar que `membro`
  como content_type continua válido).
