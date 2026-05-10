---
id: 1
title: "LGPD: migrar perfis de membros de data.js para per-handle YAML"
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
editar um arquivo que mistura dados de 30+ membros + comunidades + negócios,

WHEN movemos cada perfil pra `<handle>/profile.yaml` (YAML puro, um parser,
sem Markdown body), AND adicionamos um build script `tools/bake-people.mjs`
que lê todos os `<handle>/profile.yaml` e regenera a seção `people = [...]`
em `assets/data.js` automaticamente,

THEN cada membro tem ownership claro do próprio diretório (LGPD Art. 18:
acesso, correção, deleção exercíveis via PR no folder dele), AND `data.js`
continua sendo o artefato consumido pelo renderer (zero mudança runtime),
AND o site renderiza identicamente após a migração.

---

## Por que YAML puro (não YAML+MD frontmatter)

YAML+MD (estilo Jekyll) usa `---` pra separar frontmatter de body. **Dois
parsers** (YAML e Markdown), edge cases na linha do `---`, e bio com `---`
literal no texto vira "fim do frontmatter" inesperado. YAML puro evita
tudo isso: bio é apenas mais um campo, multi-linha via literal block
scalar (`|`), preserva newlines + markdown links inline como texto.

Pra prosa simples (parágrafos com links), YAML puro basta. Markdown rich
features (headers, listas, blockquotes) não são usados em bio.

Bonus: alinhado com o backend `co` que já lê `membros/<h>.md` com
frontmatter YAML — convergem pra mesma direção (uma source of truth no
futuro, fora do escopo desse ticket).

## Estado atual

`assets/data.js:26-274` define `const people = [ ... ]` com ~36 entries.
Campos possíveis (não todos obrigatórios):

```js
{
    handle, type, nome, role, tags, pic, birthDate,
    bioTitle, bioCurta, bio,        // texto multi-linha com markdown inline
    citacoes: [{ texto, autor, obra, data, url, autorEmBreve }],
    servicos: [...], subMembers: [...], communities: [...],
    contacts: { tagline, ... }, homeLinks: [...],
    emMemoria, referenceOnly, poems
}
```

Pasta `<handle>/` hoje contém só assets estáticos (imagens, áudio) +
`index.html` que carrega o SDK e renderiza profile via `renderer.js`.

## Estado-alvo

```
<handle>/
├── profile.yaml      # source of truth (NOVO)
├── index.html        # entry point HTML (sem mudança)
└── *.{jpg,png,ogg}   # assets referenciados por pic
```

`assets/data.js` mantido, mas a seção `people` vira:

```js
// AUTO-GENERATED: do not edit by hand. Run `node tools/bake-people.mjs`.
// AUTO-GENERATED:PEOPLE-START
const people = [ /* ... */ ];
// AUTO-GENERATED:PEOPLE-END
```

Demais seções (pricing, location, communities, services, missions,
universos, portfolio) **não mudam**.

## Formato `<handle>/profile.yaml`

```yaml
handle: yuri
type: person                # person | business | reference
nome: Yuri
role: Sementes
tags: [fundador, parceiro]
pic: /yuri/yuri.jpg?v=20260428
birthDate: 1993-06-24T12:30:00-03:00
bioTitle: Terra
bioCurta: "Filho de Kiyoshi e Soninha e fascinado por todos que me inspiram..."
bio: |
  Filho de Kiyoshi e Soninha e fascinado por [todos que me inspiram](/parceiros/#todos)
  Como neurocientista, busco compreender a consciência
  Como ser humano, busco compreender os saberes ancestrais
  Trabalho com desenvolvimento de [tecnologia sustentável](/solucoes/)

  Não haviam nomes quando nossos ancestrais pisaram na Terra
  ...
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
  - texto: "A terceira utilidade..."
    autor: leaoxiii
    obra: "Rerum Novarum: sobre a condição dos operários"
    data: 1891-05-15
    url: "https://www.vatican.va/..."
  - texto: "Pra onde você voaria se fosse livre?"
    autorNome: "Yuri"
    autorEmBreve:
      title: "Capítulo 1: Gênesis"
    data: "2015"
```

**Convenções:**
- bio multi-linha via `|` (literal block scalar) — preserva newlines + indentação interna.
- Strings com aspas duplas pra textos curtos com pontuação especial.
- Campos opcionais omitidos se vazios/falsy.
- `\n\n` em data.js atual vira **linha em branco** no YAML (preserva separação de parágrafos).
- Markdown inline em bio (links, bold) fica como texto literal — renderer já processa isso no runtime.

## Implementação

### Phase 1: Build script `tools/bake-people.mjs`

Node.js, sem deps externas além do parser YAML:
- `js-yaml` (npm install --save-dev). Único parser.
- Sem regex pra frontmatter, sem dois passes, sem MD parser.

Lê:
1. Glob `*/profile.yaml` na raiz do repo.
2. Parse YAML → objeto JS.
3. Validate shape (campos obrigatórios, tipos esperados).
4. Ordena pela ordem do data.js atual (preserva ordem; `tools/people-order.txt` opcional).

Escreve:
- Substitui o bloco entre `// AUTO-GENERATED:PEOPLE-START` e
  `// AUTO-GENERATED:PEOPLE-END` em `assets/data.js`.
- JSON-like output formatado (2-space indent, trailing comma).
- Roda `node -e "require('./assets/data.js')"` pra validar parse.

Saída determinística: mesmo input → byte-idêntico output.

### Phase 2: Migração inicial — `tools/extract-people.mjs`

One-shot, descartável: lê `data.js` atual, gera 30+ arquivos
`<handle>/profile.yaml`. Roda uma vez, deleta depois.

Para cada `<handle>` ainda sem pasta (ex: `joao`, `kiyoshi`,
`soninha`, `kelly`, `matheus`), criar a pasta + `index.html` (template
padrão) + `profile.yaml`.

Bio: converter `\n\n` em linhas em branco no `|` block scalar. Strings
com aspas duplas em frontmatter. Citações com texto longo idem.

### Phase 3: Wire ao build

- Adicionar `tools/bake-people.mjs` ao fluxo de commit:
  - Pre-commit hook (opcional, via `package.json` scripts ou husky).
  - GH Action `.github/workflows/bake-people.yml` que roda em PRs e
    falha se `data.js` está dessincronizado de algum `<handle>/profile.yaml`.
- Documentar em `CLAUDE.md` raiz: "pra editar perfil de membro,
  edite `<handle>/profile.yaml` e rode `node tools/bake-people.mjs`."

### Phase 4: Limpeza

- Marcar a seção legada de `people` em `data.js` como AUTO-GENERATED.
- `membros/<h>.md` (frontmatter mínimo do backend) pode coexistir
  ou ser removido — decidir depois (não bloqueia esse ticket).

## Critérios de aceitação

- [ ] Cada membro listado hoje em `data.js` tem um `<handle>/profile.yaml`
      correspondente, validado contra o shape esperado.
- [ ] `tools/bake-people.mjs` existe, é determinístico, e regenera a seção
      `people` de `data.js` byte-idêntica em runs consecutivos.
- [ ] Após rodar o bake, `node -e "require('./assets/data.js')"` passa sem erro.
- [ ] `AL.people.length` e `AL.get('<handle>')` retornam os mesmos valores
      antes e depois da migração (snapshot test).
- [ ] Site renderiza identicamente — comparar `/`, `/parceiros/`, `/yuri/`,
      `/alice/`, `/joao/` antes/depois.
- [ ] V em `bootstrap.js` é bumpado.
- [ ] `CHANGELOG.md` documenta a mudança.
- [ ] `CLAUDE.md` raiz inclui instruções de "como editar perfil".

## Out of scope

- Migrar `services` array pra per-service YAML — separado, abrir AL-2 se desejado.
- Migrar `communities` array — idem.
- Migrar `missions` / `universos` / `portfolio` — idem.
- Backend integration: fazer o `co` consumir `<handle>/profile.yaml` ao
  invés de `membros/<h>.md`. Pode-se manter os dois ou unificar depois.
- Authoring tools (CMS, web editor). Por ora editar via PR no Git.
- Auto re-bake em dev server.

## Notas de implementação

- **Bio multi-linha:** YAML literal block scalar (`|`) preserva newlines.
  Indentação interna preservada; cuidado com indentação base (typically
  2 espaços abaixo de `bio:`).
- **Markdown inline em bio:** `[text](url)` fica como texto literal no
  YAML. Renderer já processa esses no runtime (linkify).
- **Citações com texto longo:** usar `texto: |` se passar de uma linha,
  ou string com aspas se for short.
- **`autorEmBreve: { title: "..." }`:** YAML inline mapping ou bloco —
  ambos válidos.
- **Yuri tem bio gigante (~50 linhas):** YAML literal scalar lida
  perfeitamente, sem perda.
- **Business entries** (ex: `retro-umarizal` com `type: "business"`):
  mesmo schema, com `externalUrl` em vez de `pic` — tudo OK em YAML.
- **Reference entries** (`leaoxiii` com `referenceOnly: true`): mesma
  pasta + profile.yaml, com `referenceOnly: true` no topo.

## Related

- `assets/data.js:26-274` — fonte atual de `people`.
- `assets/renderer.js:renderProfile` — consumer.
- `membros/<handle>.md` — backend's separate source (não impactado).
- `_universe.yaml` — schema do universe artelonga.
