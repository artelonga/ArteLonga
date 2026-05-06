# Arte Longa · Schema e Contratos

Schema atual implementado em `assets/data.js`. Esta é a **fonte da verdade da
implementação** (vs `ABSTRACTIONS.md` que tem visão arquitetural mais ampla
e aspiracional). Quando os dois divergirem, este doc reflete o código.

Três tipos de dado primitivo + um conceito derivado:

1. **Parceiro** — pessoa ou comunidade
2. **Serviço** — entrada do catálogo
3. **Portfolio** — derivado: intersecção parceiro × serviço

## 1. Parceiro

Pessoas e comunidades compartilham handle space. Distinguem por `type`.

### `type: "person"` · pessoa

```ts
{
  handle: string,                    // único · usado em URL e refs
  type: "person",
  nome: string,                      // display
  nomeCompleto?: string,
  role?: string,                     // ex: "Psicologia Clínica"
  tags?: string[],                   // ["parceiro", "fundador", "familia", ...]
  pic?: string | null,
  bio?: string,
  bioCurta?: string,

  // Serviços que oferece (refs no catálogo, exato match em titulo)
  servicos?: string[],

  // Pertencimento
  communities?: string[],            // handles de comunidades
  subMembers?: string[],             // handles de pessoas sob esta (família)
  parentHandle?: string,             // handle da pessoa pai/mãe

  // Pricing override
  hourlyRate?: number,               // default 100 (DEFAULT_HOURLY_RATE)

  // Canal direto
  contacts?: {
    whatsapp?: string,               // E.164 sem +
    whatsappDisplay?: string,        // formatado pra UI
    instagram?: string,              // handle sem @
    tagline?: string                 // frase pessoal
  },

  // Geografia (sem filtro ativo · futuro)
  location?: string,                 // ex: "Cangaíba · São Paulo · SP"

  // Lifecycle (mutuamente exclusivos quando setados)
  aposentado?: true,                 // legado
  underage?: true,                   // menor · privado parental
  emMemoria?: true,                  // já partiu
  referenceOnly?: true,              // citação histórica · não aparece em rosters

  birthDate?: string,                // ISO
  deathDate?: string,
}
```

### `type: "community"` · comunidade

```ts
{
  handle, type: "community", nome,
  externalUrl?: string,              // site próprio
  pic?: string | null,
  bio?: string,
  membros?: string[],                // handles
  servicos?: string[],
  communities?: string[],            // sub-comunidades (recursivo)
  ...lifecycle flags
}
```

## 2. Serviço

Definido em `serviceCatalog` (array). É a fonte de verdade pra cada serviço.

```ts
{
  titulo: string,                    // único · usado como ref (não slug)
  parent?: string,                   // titulo do serviço-pai (sub-serviço)

  // Quem entrega (auto-derivado de people/community.servicos[])
  implicitResponsavel?: string[],    // handles que ganham auto

  // Apresentação
  paraQuem?: string,                 // 2-3 palavras

  // Pricing
  hoursLow?: number,                 // estimativa
  hoursHigh?: number,
  unit?: string,                     // "sessão", "torta", "palavra", ...
  recurring?: boolean,               // true = mensal

  // Planos nomeados (override do hoursLow/High)
  planos?: Array<{
    label?: string,                  // se ausente e tem hours, gera "Xh"
    hours?: number,                  // sem hours = "Sob demanda" (CTA)
    unit?: string
  }>,

  // Compliance / fiscal
  cnae?: Array<{ c: string, d: string }>,
  cnaeNovo?: boolean,                // CNAE proposto · não no CNPJ ainda

  // Visibilidade
  hidden?: boolean,                  // entradas privadas (família · em memória)
}
```

### Constantes pricing

```ts
DEFAULT_HOURLY_RATE = 100            // R$/h da rede
```

### Derivações (em `services` array)

Após `deriveServices()`:

- `slug` = `slugify(titulo)`
- `responsavel` = `implicitResponsavel ∪ {pessoas/comunidades que listam este titulo em .servicos}`
- `children` = títulos cujo `parent === this.titulo`
- `cnae` = `def.cnae || null`

### Função de pricing

`AL.computeFaixaPreco(s)` retorna:

```ts
{
  planos: Array<{ label, preco, formula, consult }> | null,
  preco: string | null,              // "R$ 4.000 – R$ 20.000" ou "Sob consulta"
  formula: string | null,            // "40-200h × R$ 100/h"
  consult: boolean                   // true = sem preço, mostrar CTA
}
```

Regras (ordem):

1. `s.planos` → array de planos computados (CTA `Sob demanda` quando sem hours)
2. Sem `hoursLow/High` → `Sob consulta`
3. Algum responsável **não-sócio** → `Sob consulta`
4. Sócios + hours → tarifa horária `R$ X/h` + linha `~A-Bh estimadas`

## 3. Portfolio (conceito derivado)

**Não tem tipo próprio no schema.** Portfolio = intersecção `parceiro × serviço`,
gerada em runtime a partir de `parceiro.servicos[]`.

Cada entry de portfolio:

```ts
{
  parceiro: handle,
  parceiroNome: string,
  servico: titulo,                   // exato no catálogo
  servicoSlug: slug,
  servicoUrl: "/servicos/<slug>/"
}
```

### API derivada (proposta)

```ts
AL.portfolioOf(parceiroHandle): PortfolioEntry[]
// Todos os serviços que essa pessoa/comunidade oferece.

AL.portfolioFor(servicoTitulo): PortfolioEntry[]
// Todos os parceiros que entregam este serviço.

AL.portfolio(): PortfolioEntry[]
// Catálogo completo de instâncias parceiro×serviço.
```

Hoje implementado implicitamente: `AL.serviceByTitle(t).responsavel` retorna
handles dos parceiros. Falta o oposto formalizado (`portfolioOf`).

## API · `window.AL`

Atual em `data.js`:

```js
// Índices
people, communities, services, solutions, missions, poems
rosterOrder, finances, manifesto

// Lookups
get(handle)
byHandle
roster()                             // ordem editorial /parceiros/
publicServices()                     // catálogo filtrado (sem hidden, sem inativos)
serviceBySlug(slug)
serviceByTitle(titulo)
poemBySlug(slug)
poemsByAuthor(handle)

// Relacionamentos
membersOf(comunidadeHandle, opts)
subMembersOf(personHandle)
bundledServices(solutionHandle)
solutionsUsingService(titulo)
relatedServices(titulo)              // serviços que coabitam soluções
missionBySlug, missionsOfCommunity, subMissionsOf, missionsUsingService, topLevelMissions

// Lifecycle
isInactive(handle)                   // emMemoria || aposentado || underage
isEmMemoria(handle)
isSocio(handle)                      // dado o breakdown de finances.custos.socios

// Pricing
DEFAULT_HOURLY_RATE                  // 100
rateOf(handle)                       // person.hourlyRate || default
computeFaixaPreco(s)                 // { planos, preco, formula, consult }

// Utils
slugify(str)
serviceCatalog                       // raw, sem derivações
```

## URL contracts

Static shells geradas pra cada handle de pessoa, comunidade e cada slug de
serviço. Renderer dispatcha por `body[data-page]`:

| Path                     | data-page    | data-handle | data-slug |
|--------------------------|--------------|-------------|-----------|
| `/`                      | home         | —           | —         |
| `/servicos/`             | servicos     | —           | —         |
| `/servicos/<slug>/`      | service      | —           | <slug>    |
| `/parceiros/`            | parceiros    | —           | —         |
| `/<handle>/`             | profile      | <handle>    | —         |
| `/recursos/`             | recursos     | —           | —         |
| `/solucoes/`             | solucoes     | —           | —         |

Páginas estáticas sem renderer:
`/sobre/`, `/oportunidade/`, `/proximos-passos/`, `/faca-parte/`.

## Sócios

`AL.isSocio(handle)` lê de `finances.custos[key=socios].breakdown`. Só sócios
têm preço calculado em `R$ X/h` (default 100); não-sócios mostram `Sob consulta`
até definirem `planos` próprios.

Sócios atuais: yuri, igo, joseantonio, mono, luke, marina.
