# Changelog

All notable changes to Arte Longa. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [semver](https://semver.org/) (pre-1.0 — breaking changes can happen on minor bumps).

Each release links to a *why* (the pain or opportunity it addresses) so a reader 6 months from now can reconstruct the thinking.

---

## [Unreleased]

### Added
- **Marcador de sócio** em `/parceiros/` — asterisco discreto (`.socio-mark`) ao lado do nome de cada pessoa que recebe pro-labore. Fonte única: `finances.custos[socios].breakdown` → exposto como `AL.isSocio(handle)`. Legenda abaixo do roster: *"* sócio · sempre em expansão"* — símbolo + insinuação de crescimento contínuo.

### Changed
- **Roster** `/parceiros/` — Marina sobe para cima de Karina (ordem de sócios e parceiros mais alinhada com a realidade da rede).
- **Manifesto** enxuto. Missão: *"Semear sonhos, escrever legados."* Visão: *"Trabalho digno."* (agora com `referencia`, mesma estrutura dos valores) ancorada em *Rerum Novarum · Leão XIII*. Valores reduzidos de 5 para 1: **Desenvolvimento sustentável**, ancorado nos *Objetivos de Desenvolvimento Sustentável · ONU, 2015* — especificidades vivem no link.
- **`manifesto.visao`** passa de `string` para `{ texto, referencia? }`. Render em `/sobre/` isola `refHtml()` e aplica em visão + valores. Shim em tempo de render aceita string legada (`typeof m.visao === "string"`) para tolerar cache antigo.
- **Tipografia unificada** do manifesto: `.valor-titulo` e `.valor-texto` agora herdam o mesmo tamanho/peso/cor das frases de missão e visão (`0.95rem`, `400`, `#333`) — os três statements leem em pé de igualdade. Valor sem `texto` não renderiza o wrapper vazio; a referência ancora direto sob o título.
- **Rerum Novarum** recebe subtítulo completo: *"Rerum Novarum: sobre a condição dos operários"* (acentos e cedilha corretos). UAT §10.2 atualizada + §10.2.1 adicionada cobrindo o valor ODS/ONU.
- Cache-buster `?v=20260505` em `/sobre/` (manifesto) e `/parceiros/` (data.js, renderer.js, pages.css para o novo `.socio-mark`).

### Fixed
- **`.socio-mark` invisível em `/parceiros/`**. Causa: o span ficava como terceiro filho de `.row` (flex, `justify-content: space-between`) — o asterisco ia pro meio da linha, longe do nome. Correção: mover o span pra dentro do `<a class="name">`. Cache-buster `?v=20260506` em `/parceiros/` (renderer.js, data.js).

## [0.11.0] — 2026-04-19

**Why**. Duas frentes convergindo. **(1) Narrativa**: Co ganhou identidade própria ("Rede Social Web") distinta do slogan abstrato da Arte Longa ("Rede do Futuro"), e a Arte Longa passou a se posicionar por uma pergunta — *"Por que precisamos de uma Rede do Futuro?" → Comunidade.* A descrição do Co virou uma cadência em C: *Comunidade. Consciência Coletiva. Colaborar. Compartilhar. Comunicar. Coinventar.* **(2) Ergonomia**: o `/parceiros/` estava distraindo — cartões expandindo inline empurravam o layout inteiro. Migramos para popover flutuante, cartão menor, e serviços atrás de um botão "Ver Serviços" (revelação progressiva em vez de ruído de base). Mesma cura no `/servicos/` para o drawer de filhos do guarda-chuva (Inteligência e Tecnologia). Bônus: atribuição de autoria (Bia na Reparação Histórica) virou padrão reutilizável para citações.

### Added
- **Solução · pergunta/resposta** (`solution.pergunta` + `respostaChave`). Arte Longa: *"Por que precisamos de uma Rede do Futuro?" / "Comunidade."*
- **Tráfego e Crescimento** (sub-serviço de Inteligência e Tecnologia, Yuri) — antes contemplado como "Analytics e Growth" no rascunho 0.7 e removido; agora volta com nome português.
- **João** (`joao`) — parceiro do Quilombo Araucária · Saúde Mental.
- **Parcerias pro-bono** como estrutura de dados (`community.parcerias: [{ de, tipo, descricao, contribuicoes }]`). QA renderiza "Parceria · Arte Longa (pro-bono)" com contribuições discriminadas por pessoa.
- **Atribuição de autoria** (`mission.objetivoAutor`). Reparação Histórica cita Bia — *"A reparação à população negra e dos povos originários é urgente, é necessária, é fundamental."*
- **Missão · Visão · Valores** em `/sobre/` (âncora `#manifesto`). Valores podem carregar `referencia` (obra + data + autor-link).
- **Entidade de referência** — flag `referenceOnly: true` marca pessoas históricas (citáveis mas fora de parceiros/serviços/soluções). Primeiro caso: **Papa Leão XIII** (`leaoxiii`, em memória, *Rerum Novarum · 15 de maio de 1891*).
- **Conexões** (novo título para "Rede de Parcerias" · Igo) — termo mais enxuto e consistente com a linguagem do site.

### Changed
- **Co · tagline** → `Rede Social Web` (antes: "Rede do Futuro" — devolvido ao conceito guarda-chuva da Arte Longa).
- **Co · descrição** → `Comunidade. Consciência Coletiva. Colaborar. Compartilhar. Comunicar. Coinventar.` (Coinventar no infinitivo).
- **Co · bundledServices** → Inteligência e Tecnologia, Design, Gestão Executiva, Gestão Operacional, Privacidade e Segurança. Design agora co-ownership Luke + Yuri.
- **Yggdrasil · bundledServices** → Inteligência e Tecnologia, Design, Produção Musical (Design solo Luke).
- **/parceiros/** — cartões hover encolheram; serviços saíram do corpo do cartão para trás do botão "Ver Serviços" (popover flutuante, `position: absolute`, sem deslocar layout).
- **/parceiros/ comunidades** — lista curta + badge não-clicável `+ N membros` + único CTA `Ver Mais →` apontando para o perfil interno (`/quilomboaraucaria/`). Antes havia dois "Ver Mais" confusos.
- **/servicos/ filhos** — drawer de sub-serviços virou popover flutuante (mesmo padrão dos parceiros). "+N" não estoura mais o título.
- **/solucoes/** — cards não listam mais `bundledServices` (ficará em páginas dedicadas por solução no próximo passo).
- **em memória / aposentado** — rótulo "Serviços" no perfil substituído por **Legado** (hint: "serviços prestados · em memória" / "· aposentado").
- **QA missões** achatadas: Raízes do Futuro = Agrofloresta (mesma entidade, subtítulo "Agrofloresta · horta e compostagem"); GRES Amazônia e Reparação Histórica promovidas a top-level (irmãs, não filhas).
- **/sobre/** — removidos labels laterais redundantes "DADOS CADASTRAIS" e "SEDE". "classificação oficial" (CNAE) mantido por ser informativo.
- Cache-buster `?v=20260430`.

### Removed
- Raquel: `Terapia Comportamental` (não faz parte do escopo dela).
- Serviço `Rede Social` — não existe como item de catálogo; inferido da composição (IT + Design + Comunicação).

### Schema
`AL.version` → `2.1`:
- `solution.pergunta` / `solution.respostaChave` (ambos opcionais).
- `mission.objetivoAutor` (handle de pessoa).
- `community.parcerias[]` com `{de, tipo, descricao, contribuicoes[{quem, oque}]}`.
- `person.referenceOnly` (booleano, exclui de rosters/catálogos).
- `pagina.valores[]` com `{titulo, texto, referencia?:{obra, data, autor, url}}`.

---

## [0.10.0] — 2026-04-18

**Why**. O catálogo estava achatado: "Inteligência e Tecnologia" aparecia como um único serviço, enquanto suas sub-especialidades (Cloud, Network, API Development) eram irmãs soltas sem contexto. Queríamos que um visitante visse o guarda-chuva e, ao passar o mouse, descobrisse os filhos — mesmo padrão do roster de parceiros. Também separamos conceitualmente **serviços** (oferta comercial) de **missões** (projetos de comunidades, outputs de universos): Raízes do Futuro agora vive em Soluções, não no catálogo.

### Added
- **Hierarquia de serviços** (`parent` / `children`). Parents renderizam com hover-drawer revelando filhos, como os perfis no roster. Filhos também buscáveis na raiz via search.
- **Novos sub-serviços de Inteligência e Tecnologia** (Yuri · R$ 100/h): Desenvolvimento de Software, Hardware, Sistemas Operacionais. Mais: Desenvolvimento de API, Nuvem, Computação, Dados e Armazenamento, Redes, Desenvolvimento Web — todos `parent: "Inteligência e Tecnologia"`.
- **Missões** como entidade de primeira classe (`AL.missions`). Cada missão: `comunidade`, `objetivo`, `subMissions?`, `envolvidos?`, `attachments?`.
- **Seção "Missões"** em `/solucoes/`: agrupada por universo. ArteLonga em nível 0 (sem header). QA com header próprio e árvore:
  - Raízes do Futuro (com PDF do projeto)
    - Agrofloresta · horta e compostagem
    - GRES Amazônia · escola de samba, futebol feminino e masculino
    - Reparação Histórica · povos originários (envolve Rogério e Alzira)
- ArteLonga missão: Eventos e Espaços de Saberes.
- Lookups: `AL.missionBySlug`, `AL.missionsOfCommunity`, `AL.subMissionsOf`, `AL.topLevelMissions`.

### Changed
- **Casing padronizado** (Title Case PT): Gestão Administrativa · Gestão Financeira · Rede de Parcerias · Comunicação Visual · Criação de Conteúdo · Marketing Digital · Experiência de Usuário (UI/UX) · Acompanhamento Nutricional · Cuidado com o Idoso · Reforço Escolar.
- **Kayra**: `Modelo` → `Stylist, Moda e Passarela`.
- **Mono**: `Privacidade e segurança digital` → `Privacidade e Segurança`.
- **Yuri TI subs rename**: Cloud → Nuvem · Compute → Computação · Network → Redes · Data e Storage → Dados e Armazenamento · API Development → Desenvolvimento de API · Analytics e Growth → removido.
- **QA**: `servicos` agora vazio. Os 3 projetos foram promovidos a missões.
- **Rogério/Alzira**: `Resistência dos Povos Originários` removida dos serviços — agora são `envolvidos` na missão "Reparação Histórica".
- `/servicos/` subtitle: "Serviços são compostos em Soluções." (enxuto).
- Por padrão `/servicos/` mostra só top-level (40 itens). Busca achata toda a árvore (49 totais).
- Solutions bundles atualizados; QA mantém só Desenvolvimento Web, Artes Visuais, Grafite, Murais e Fachadas (projetos virariam missões).

### Removed
- Stubs obsoletos: `/servicos/{data-e-storage,cloud,compute,network,api-development,analytics-e-growth,modelo,privacidade-e-seguranca-digital,raizes-do-futuro,desenvolvimento-sustentavel,resistencia-dos-povos-originarios}/`.
- PDF `projeto.pdf` movido de `/servicos/raizes-do-futuro/` para `/missoes/raizes-do-futuro/`.

### Schema
`AL.version` → `2.0` (adiciona `missions` com `parentMission`/`subMissions` e `parent` no catálogo de serviços).

---

## [0.9.0] — 2026-04-18

**Why**. Rede social genuína precisa honrar quem já passou. Criamos a abstração universal `emMemoria` — qualquer pessoa (de Sócrates a um avô da família) é representada como `membro` na mesma estrutura, com esse flag dizendo "honra, mas não conta como ativa". Também ajustamos a lista de membros das comunidades: todos são mostrados, com "ver mais" escondendo os já visíveis no roster principal para evitar redundância.

### Added
- Carlinhos · Guardião · Distribuição de Frutas (em memória, 60 anos · 1965–2025). Último da lista expandida de QA.
- `/carlinhos/` — página de perfil com contador estático.
- Comunidades com "ver mais (+N)" para membros que já aparecem no roster principal (+ em-memória ao final).
- Documentado: em_memoria é filtro universal — serviços de quem passou não entram no catálogo, mas o perfil e os serviços prestados em vida permanecem visíveis como arte/memória.

### Changed
- QA membros agora incluem fundadores (Yuri, Igo, José, Mono, Bruna) + Carlinhos. Inicialmente só os únicos (Antony, Bia, Ken, Quinho, Tião, Veh) aparecem; "ver mais" revela os outros.

### Refactored (continuação do 0.8.0)
- Campo `missoes` em pessoas/comunidades renomeado para `servicos` em toda `data.js`.
- `/missoes/*.md` reclassificados: 49 arquivos movidos para `/servicos/*.md` com `type: servico`.
- `/missoes/` agora reservado exclusivamente para missões (comunidades com objetivo) — no momento vazio no top-level (existe apenas em `/comunidades/<h>/missoes/`).
- Renderer: rótulos data-driven — pessoa mostra "Serviços", comunidade mostra "Missões".

## [0.8.0] — 2026-04-18

**Why**. Até aqui o site foi construído com conteúdo hardcoded. Para escalar como rede social com conteúdo editável de usuários (posts, ensaios, portfolio) precisamos de abstrações claras e um pipeline markdown-first — compatível com o `co-web` quando migrarmos.

### Added
- `docs/ABSTRACTIONS.md` — modelo conceitual (`membro · comunidade · missao · servico · solucao · relato · evento · pagina`), alinhado ao schema do `quilomboaraucaria.org`.
- Hierarquia recursiva: comunidade contém comunidades; missão = comunidade com `objetivo`; serviço = missão vendável no catálogo.
- `/comunidades/quilomboaraucaria/` como diretório aninhado (overview + 3 missões: Raízes do Futuro, Resistência dos Povos Originários, Desenvolvimento Sustentável). Detalhe completo vive em quilomboaraucaria.org.
- `/relatos/<autor>/<slug>.md` — primeiro ensaio (Yuri · "Abstrações da rede").
- `/eventos/` — diretório vazio pronto para eventos.

### Changed
- `/schema.yaml` v2 — tipos em português com paridade QA (`membro`, `comunidade`, `missao`, `servico`, `solucao`, `relato`, `evento`, `pagina`).

### Deprecated
- `type: content` → `type: relato` (mais preciso e alinhado a QA).
- Campo `missoes: []` em pessoas/comunidades será renomeado para `servicos: []` no próximo patch — eram serviços todo esse tempo.

---

## [0.7.0] — 2026-04-18

**Why**. Uma rede sustentável precisa modelo financeiro transparente. Criamos `/recursos/` para mostrar publicamente gastos, receita projetada e gap em relação à meta.

### Added
- `/recursos/` — página pública (unlinked, noindex) com modelo de negócio detalhado.
- `AL.finances` em `data.js`: 6 gastos recorrentes (total R$ 25.000/mês) + receita potencial Q2 2026 (R$ 66.000 vs meta R$ 75.000).
- Receita recorrente, rampa (Hedix MM: 1k/5k/10k), projetos (3 sites estáticos + 1 dinâmico + traduções + consultoria avulsa), pro-bono (QA portfolio).
- 6 serviços de Consultoria em TI (Yuri): Data e Storage, Compute, Cloud, Network, Analytics e Growth, API Development.

### Changed
- Rebalanceamento de gastos: contabilidade coberta pela receita de API Development Hedix; coworking e armazenamento/computação explicitados separadamente.

---

## [0.6.0] — 2026-04-17

**Why**. Cada nova edição de conteúdo estava tocando 3+ arquivos. A página ficou lenta de manter. Refatoramos para um único ponto de verdade (`data.js`) + renderer compartilhado (`renderer.js`) + CSS componentizado, cortando 90% da duplicação.

### Refactored
- `/assets/data.js` — entidades tipadas (people, communities, services, solutions) com índices e lookups (`AL.get`, `AL.roster`, `AL.publicServices`, etc).
- `/assets/renderer.js` — componentes puros (`avatarSm`, `bioCard`, `counter`, `missaoLink`, `miniRow`, `platformItem`, `ctaLead`, `modalContact`) + dispatchers por `body[data-page]`.
- CSS dividido em `site.css` (base), `components.css` (reutilizáveis) e `pages.css` (específicos).
- Páginas reduzidas a stubs de ~15 linhas que carregam `data + renderer`.

### Added
- `/servicos/<slug>/` — 46+ páginas de detalhe geradas por script, cada uma com CNAE oficial, soluções que usam, e serviços relacionados.
- Filtro `?q=<termo>` no catálogo (vem de clique em missão no perfil).

### Changed
- Serviços deixam de abrir modal; abrem página dedicada (bookmarkável, indexável).

### Removed
- `/assets/profile.js` e `/assets/profile.css` (substituídos pelos componentes).

---

## [0.5.0] — 2026-04-17

**Why**. Roster precisava respirar: pessoas queriam exibir bio, foto, idade. Também faltava visibilidade para família (em memória) e futuro (filhos dos membros).

### Added
- Contadores de idade inline no perfil, com precisão automática pelo formato do `birthDate` (segundo, minuto, hora, dia).
- Contador estático para `emMemoria: true` (Soninha · 1961—2025 · 63 anos).
- Fotos: Bruna, Karina, Kayra, José Antônio.
- Sub-membros: Kiyoshi (Shin) e Soninha sob Yuri; Alicia sob Bruna; John sob Aime.
- Novos parceiros: Rogério (Xeramoi) e Alzira (Xejaryi) com Mentoria Espiritual e Resistência dos Povos Originários (compartilhado com QA).
- Produtos: Co (Gestão Coletiva), Quilombo Araucária, Arte Longa (recursivo), Yggdrasil (jun/2026).

### Changed
- Aime vira comunidade (com John como sub-membro) e volta ao estado `em breve` (muted).
- Luck → Luke (novo bio RPG, `/luck/` redireciona para `/luke/`).

---

## [0.4.0] — 2026-04-17

**Why**. Primeira versão funcional do site: ter um lugar para apresentar parceiros, serviços e soluções, com contato. Repo privado bloqueava GH Pages — tornado público para ativar deploy.

### Added
- Home com 3 links (Parceiros, Serviços, Soluções) + Sobre e Próximos Passos como CTA secundário.
- `/parceiros/` — roster editorial com hover cards, avatares, sub-membros aninhados.
- `/servicos/` — catálogo com busca e filtros por função e responsável.
- `/solucoes/` — soluções digitais com Web/Mobile status (dots pulsantes).
- `/sobre/` — dados cadastrais completos (CNPJ 56.975.561/0001-60, 39 CNAEs).
- `/proximos-passos/` — roadmap público Q2 2026.
- Lead magnets: "Seja um parceiro", "Anuncie seus serviços", "Construa soluções".
- Modal de contato com `rede@artelonga.com.br` (não-mailto, seleção manual).

### Changed
- `parceiros e clientes` → `parceiros` (unificação).
- 11 perfis individuais + 4 comunidades (Arte Longa, QA, HFS, Hedix).

### Deploy
- Repo tornado público; GH Pages ativado.
- `.nojekyll` adicionado (Jekyll falhava em `modelos/*.md` com templates Obsidian).
- CNAME transferido de `artelonga/home` para `artelonga/ArteLonga`.

### Security
- `.gitignore` endurecido: bloqueia `*.pptx`, `*.xlsx`, `*.docx`, `.obsidian/`, etc.

---

## [0.3.0] — 2026-04-15

**Why**. Primeiro passo real: listar os fundadores no universo Arte Longa com perfis públicos.

### Added
- 5 fundadores no roster: Yuri (Semeador), Igo (Resistência), José (Recursos), Mono (Segurança), Bruna (Comunicação).
- Perfis individuais em `/<handle>/`.
- `/membros/*.md`, `/missoes/*.md`, `/comunidades/*.md` como fonte de verdade inicial.

### Changed
- Compatibilidade de schema com quilomboaraucaria (mesmos frontmatter fields).

---

## [0.2.0] — 2026-03-27

**Why**. Substituir a home estática por algo editorial, com identidade.

### Changed
- Refactor editorial — tipografia tight, single-flow, elements minimalistas.
- Logo top-left, "semeando sonhos" top-right.

---

## [0.1.0] — 2026-03-24

### Added
- Primeira home (`index.html` em construção) + logo.
- CNAME para `artelonga.com.br`.

---

## Convenções

### Commits

Conventional commits com escopo. Exemplos:

```
feat(parceiros): adiciona Rogério e Alzira abaixo de Raquel
fix(profile): contador de idade em anos/meses/dias, minutos em movimento
refactor(site): arquitetura escalável — data.js + renderer.js + component CSS
chore(cache): bump ?v=20260423 para forçar recache
chore(pages): adiciona .nojekyll para desabilitar Jekyll
docs(abstractions): modelo alinhado com quilomboaraucaria.org
```

Tipos aceitos: `feat`, `fix`, `docs`, `refactor`, `chore`, `test`, `style`.

### Semver (pre-1.0)

- **MINOR** (`0.x.0`) — nova feature ou mudança estrutural significativa
- **PATCH** (`0.x.y`) — fix, docs, chore, pequenos refactors

Pós-1.0 seguiremos semver estrito (MAJOR para quebras).

### Changelog

- Toda release tem `### Why` (a dor ou oportunidade endereçada).
- Agrupamento padrão Keep-a-Changelog: `Added` · `Changed` · `Deprecated` · `Removed` · `Fixed` · `Security` · `Deploy`.
- Ordem cronológica reversa (mais recente no topo).
- Data em formato `YYYY-MM-DD`.
