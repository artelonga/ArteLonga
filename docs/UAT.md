# UAT — Arte Longa · 0.11.0

Acceptance criteria para a rodada 0.11 (2026-04-17). Formato **Given / When / Then** — cada caso é verificável a olho no site, na URL indicada.

> Convenção: `✅` significa passou no smoke test local · `⬜` pendente de verificação visual · `❌` regrediu.

---

## 1. Identidade das Soluções

### 1.1 Co — descrição e tagline

**Given** a página `/solucoes/`
**When** o visitante olha o card do Co
**Then**:
- [ ] A tagline lê exatamente **"Rede Social Web"** (não "Rede do Futuro" — esse é o conceito abstrato da Arte Longa).
- [ ] A descrição começa com **"Comunidade."** e segue a ordem:
      `Comunidade. Consciência Coletiva. Colaborar. Compartilhar. Comunicar. Coinventar.`
- [ ] O verbo final é **"Coinventar"** (infinitivo) — não "Coinvente".

**Critério negativo**
- [ ] A descrição **não** contém a forma imperativa "Coinvente".
- [ ] A ordem **não** é a anterior (que começava em "Colaborar" / "Consciência Coletiva").

---

### 1.2 Arte Longa — pergunta-provocação

**Given** a página `/solucoes/`
**When** o visitante olha o card da Arte Longa
**Then**:
- [ ] Aparece a pergunta **"Por que precisamos de uma Rede do Futuro?"** seguida da resposta destacada **"Comunidade."**
- [ ] A resposta "Comunidade." tem peso visual (bold/cor) distinto da pergunta.

**Critério negativo**
- [ ] Nenhuma outra solução do catálogo mostra pergunta/resposta (é campo opcional, exclusivo da Arte Longa por ora).

---

### 1.3 Nenhum card de solução lista serviços agrupados

**Given** `/solucoes/`
**When** o visitante olha qualquer card
**Then**:
- [ ] **Não** há lista de "serviços inclusos" / "bundledServices" no card.
- [ ] As plataformas (Web/Mobile/Desktop) continuam visíveis com dots de status.

**Observação**. A lista de serviços entrará em páginas dedicadas por solução num passo futuro — não no catálogo.

---

### 1.4 "Rede Social" **não** é um serviço

**Given** `/servicos/`
**When** o visitante busca por "rede social"
**Then**:
- [ ] **Nenhum** serviço com esse título existe.
- [ ] O conceito é inferido da composição de serviços associados (Inteligência e Tecnologia, Design, Comunicação).

---

## 2. /parceiros/ — cartão flutuante, não invasivo

### 2.1 Cartão de pessoa — sem serviços inline

**Given** `/parceiros/`
**When** o visitante passa o mouse sobre uma pessoa com serviços (ex.: Yuri, Bruna, Mono)
**Then**:
- [ ] Nenhuma lista de serviços é renderizada **dentro** do cartão hover.
- [ ] Existe um botão **"Ver Serviços"** (ou equivalente).
- [ ] Ao clicar no botão, um popup/popover flutuante aparece listando os serviços **clicáveis** (cada um leva ao respectivo `/servicos/<slug>/`).
- [ ] O popup é **flutuante** (position: absolute / fixed) — **não empurra** o layout da lista abaixo.

**Critério negativo**
- [ ] A lista roster **não** se desloca verticalmente ao abrir o popup.
- [ ] Nenhum parceiro expande inline empurrando os demais.

---

### 2.2 Cartão com ergonomia enxuta

**Given** um cartão hover em `/parceiros/`
**Then**:
- [ ] Tamanho total do cartão menor que a versão anterior.
- [ ] Fonte do conteúdo do cartão visivelmente menor (ainda legível).
- [ ] Bio, foto e CTA presentes; ruído visual reduzido.

---

### 2.3 Cartão de comunidade (QA) — hierarquia clara

**Given** `/parceiros/`, cartão de **Quilombo Araucária**
**Then**:
- [ ] Mostra lista curta de membros únicos (Antony, Bia, Ken, Quinho, Tião, Veh, Carlinhos, Mara Brandão, João).
- [ ] Mostra badge **"+ N membros"** (contagem de membros que já aparecem no roster principal — Yuri, Igo, José Antônio, Mono, Bruna).
- [ ] O badge **não é** botão/link — é apenas um indicador.
- [ ] **Um único** CTA **"Ver Mais →"** abaixo do cartão, levando a `/quilomboaraucaria/`.

**Critério negativo**
- [ ] **Zero** botões de expansão/colapso inline na comunidade (antes havia dois "Ver Mais" confusos).

---

## 3. /quilomboaraucaria/ — página estendida

### 3.1 Perfil completo

**Given** `/quilomboaraucaria/`
**Then**:
- [ ] Header com nome, bio curta, descrição.
- [ ] Lista completa de membros (inclusive os fundadores que moram no roster principal) **e** em-memória (Carlinhos).

---

### 3.2 Seção **Parceria · Arte Longa (pro-bono)**

**Given** `/quilomboaraucaria/`
**Then**:
- [ ] Seção dedicada com título **"Parceria · Arte Longa"** e tag **"pro-bono"**.
- [ ] Texto descritivo explicando a contribuição (plataforma digital + comunicação sem cobrança, em troca de impacto ambiental/social/cultural).
- [ ] Lista discriminada de contribuições:
  - [ ] **Yuri** — Inteligência e Tecnologia · todos os subcomponentes + Tráfego e Crescimento.
  - [ ] **Mono** — Design · Privacidade e Segurança.
  - [ ] **Bruna** — Criação de Conteúdo.
  - [ ] **Igo** — Conexões.
- [ ] Cada nome é link para o perfil da pessoa.

---

## 4. Catálogo de Serviços — renomeações e adições

### 4.1 Conexões (antes "Rede de Parcerias")

**Given** `/servicos/`
**Then**:
- [ ] Existe o serviço **"Conexões"** (responsável: Igo).
- [ ] **Não existe** serviço com título "Rede de Parcerias".
- [ ] Busca por "rede de parcerias" retorna vazio; busca por "conexões" encontra.

---

### 4.2 Tráfego e Crescimento (novo)

**Given** `/servicos/`
**Then**:
- [ ] Existe o serviço **"Tráfego e Crescimento"**.
- [ ] É sub-serviço de **"Inteligência e Tecnologia"** (`parent: "Inteligência e Tecnologia"`).
- [ ] Responsável: **Yuri**.
- [ ] Aparece no drawer do guarda-chuva Inteligência e Tecnologia.

---

### 4.3 Raquel — sem Terapia Comportamental

**Given** `/raquel/`
**Then**:
- [ ] O serviço **"Terapia Comportamental"** **não** consta na lista de Raquel.
- [ ] Os demais serviços legítimos dela continuam.

---

### 4.4 Alinhamento visual do "+N" em serviços com filhos

**Given** `/servicos/` — serviço com filhos (ex.: Inteligência e Tecnologia)
**Then**:
- [ ] O badge **"+N"** não estoura o título nem se sobrepõe a ele.
- [ ] Filhos aparecem em popover **flutuante** (position: absolute), não empurram layout.
- [ ] Fonte menor dentro do popover (consistente com o cartão de parceiros).

---

## 5. João (novo parceiro)

**Given** `/parceiros/` e `/quilomboaraucaria/`
**Then**:
- [ ] João aparece como membro único do Quilombo Araucária.
- [ ] Handle: `joao` · rota `/joao/` retorna 200.
- [ ] Serviço associado: **Saúde Mental**.
- [ ] Aparece na lista curta de membros do cartão QA em `/parceiros/` (não apenas sob "+N").

---

## 6. Em memória → "Legado"

**Given** perfil de pessoa com `emMemoria: true` (ex.: `/carlinhos/`) **ou** `aposentado: true`
**Then**:
- [ ] A seção que listaria serviços é rotulada **"Legado"** (não "Serviços").
- [ ] A hint lê **"serviços prestados · em memória"** (ou "· aposentado", conforme o caso).
- [ ] Os serviços são apenas **visíveis como memória** — **não** aparecem no catálogo `/servicos/`.

**Critério negativo**
- [ ] Pessoas ativas continuam com rótulo **"Serviços"** e hint "clique para ver no catálogo".
- [ ] Comunidades (vivas) continuam com rótulo **"Missões"**.

---

## 7. /sobre/ — headers limpos

**Given** `/sobre/`
**Then**:
- [ ] Seções **"Empresa"** e **"Contato"** não têm label lateral (antes: "DADOS CADASTRAIS" e "SEDE").
- [ ] Seção **"CNAE"** mantém o label **"classificação oficial"** (útil — não redundante).

---

## 8. Missões do QA — hierarquia plana

**Given** `/solucoes/` — bloco de missões do Quilombo Araucária
**Then**:
- [ ] **Raízes do Futuro** aparece como missão top-level, com subtítulo **"Agrofloresta · horta e compostagem"** (são a mesma entidade, não aninhadas).
- [ ] **GRES Amazônia · escola de samba, futebol feminino e masculino** aparece como missão top-level (irmã de Raízes, não filha).
- [ ] **Reparação Histórica · povos originários** aparece como missão top-level (irmã de Raízes).

**Critério negativo**
- [ ] Nenhum aninhamento "Raízes do Futuro > GRES Amazônia".
- [ ] Nenhum aninhamento "Raízes do Futuro > Reparação Histórica".

---

## 9. Reparação Histórica — citação da Bia

**Given** a missão **Reparação Histórica** em `/solucoes/`
**Then**:
- [ ] O campo `objetivo` lê exatamente:
      **"A reparação à população negra e dos povos originários é urgente, é necessária, é fundamental."**
- [ ] Atribuição **"— Bia"** renderiza como citação abaixo do objetivo.
- [ ] **"Bia"** é link para `/bia/`.

**Padrão reutilizável**. A mesma estrutura (`objetivoAutor` / cite) deve funcionar para qualquer missão ou valor que precise de atribuição.

---

## 10. Missão · Visão · Valores (novo)

**Given** `/sobre/`
**Then**:
- [ ] Seção **"Missão · Visão · Valores"** visível (âncora `#manifesto`).
- [ ] Aparece na sub-nav junto com Empresa / Contato / CNAE.
- [ ] **Missão**. *"Semear sonhos, escrever legados."*
- [ ] **Visão**. *"Trabalho digno."* + referência externa (Rerum Novarum).
- [ ] **Valores**. Lista de 1 item — *"Desenvolvimento sustentável"* + referência externa (ODS/ONU).
- [ ] Tipografia unificada: os três statements (missão, visão, valor-título) no mesmo peso/tamanho/cor.

### 10.1 Padrão de referência em Visão e Valores

**Given** um statement (visão ou valor) com `referencia`
**Then**:
- [ ] Citação visível com título da obra, data e autor.
- [ ] Autor é link para perfil interno (mesmo se for um personagem histórico em-memória).
- [ ] Obra (quando aplicável) é link externo (`target="_blank" rel="noopener"`).

### 10.2 Rerum Novarum · Papa Leão XIII (ancora a Visão)

**Given** a **Visão** que referencia **Rerum Novarum**
**Then**:
- [ ] Exibe **"Rerum Novarum: sobre a condição dos operários, 15 de maio de 1891"**.
- [ ] Link autor **"Papa Leão XIII"** aponta para `/leaoxiii/`.
- [ ] Link da obra aponta para `https://www.vatican.va/content/leo-xiii/pt/encyclicals/documents/hf_l-xiii_enc_15051891_rerum-novarum.html`.

### 10.2.1 Desenvolvimento sustentável · ONU (ancora o valor único)

**Given** o valor **Desenvolvimento sustentável**
**Then**:
- [ ] Exibe **"Objetivos de Desenvolvimento Sustentável, 2015 · ONU"**.
- [ ] Link da obra aponta para `https://brasil.un.org/pt-br/sdgs`.
- [ ] "ONU" renderiza como texto puro (sem perfil interno).

### 10.3 Papa Leão XIII — entidade "reference"

**Given** a entidade `leaoxiii`
**Then**:
- [ ] `emMemoria: true`.
- [ ] Flag `referenceOnly: true` marca como referência histórica.
- [ ] Perfil `/leaoxiii/` retorna 200 — mostra apenas nome, datas e link externo (minimalista).

**Critérios negativos (o que é NÃO visível)**
- [ ] **Não** aparece em `/parceiros/` (nem lista curta, nem badge "+N").
- [ ] **Não** aparece em `/servicos/` (sem serviços prestados).
- [ ] **Não** aparece em `/solucoes/` (sem missões).
- [ ] **Não** aparece em nenhum roster de comunidade.
- [ ] Só é acessível via link direto (do valor que o cita) ou pela URL `/leaoxiii/`.

---

## 11. Bundles das soluções digitais

### 11.1 Co — ownership

**Given** a definição do Co (`bundledServices` no data.js)
**Then**:
- [ ] Inclui: **Inteligência e Tecnologia, Design, Gestão Executiva, Gestão Operacional, Privacidade e Segurança**.
- [ ] Yuri responde por todos os sub-serviços de Inteligência e Tecnologia + Gestão Executiva + Gestão Operacional.
- [ ] Design no Co é co-responsabilidade de Luke e Yuri.
- [ ] Privacidade e Segurança: Mono.

### 11.2 Yggdrasil — ownership

**Given** a definição do Yggdrasil
**Then**:
- [ ] Inclui: **Inteligência e Tecnologia, Design, Produção Musical**.
- [ ] Design: **Luke** (solo — não compartilhado).
- [ ] Inteligência e Tecnologia: Yuri.
- [ ] Produção Musical: responsável apropriado (Luke/Aime).

> Nota. A visualização destes bundles **não** aparece em `/solucoes/` (item 1.3); ficarão em páginas dedicadas de cada solução numa rodada futura.

---

## 12. Coerência de linguagem

**Given** qualquer texto novo escrito nesta rodada
**Then**:
- [ ] Segue o tom editorial do site: enxuto, sem jargão, PT-BR, verbos claros.
- [ ] Sem redundância. Sem floreios de marketing.
- [ ] Termos técnicos em inglês quando padrão de mercado; domínio em português.

---

## Smoke test — roteiro curto (≤ 5 min)

1. `/solucoes/` → Co lê "Rede Social Web" + "Comunidade. Consciência Coletiva. Colaborar. Compartilhar. Comunicar. Coinventar." · Arte Longa pergunta "Por que precisamos de uma Rede do Futuro?" → "Comunidade." · nenhum card mostra lista de bundled services.
2. `/parceiros/` → hover Yuri → cartão pequeno, sem serviços inline, botão "Ver Serviços" abre popover flutuante · layout **não** se mexe · QA tem lista curta + "+N membros" (não botão) + único "Ver Mais →" indo para `/quilomboaraucaria/`.
3. `/quilomboaraucaria/` → seção "Parceria · Arte Longa (pro-bono)" lista Yuri/Mono/Bruna/Igo com links clicáveis.
4. `/servicos/` → busca "rede de parcerias" = vazio · "conexões" = achado · "tráfego" = achado · "terapia comportamental" = vazio · Inteligência e Tecnologia tem popover flutuante com filhos.
5. `/carlinhos/` → seção rotulada **"Legado"**.
6. `/sobre/` → Empresa e Contato sem labels laterais · nova seção "Missão · Visão · Valores" com valor citando Rerum Novarum → link autor `/leaoxiii/` + link externo Vatican.
7. `/leaoxiii/` → página minimalista; buscar "leão" em `/parceiros/` retorna vazio.
8. `/joao/` → 200; João visível no QA em `/parceiros/`.
9. `/bia/` → acessível via citação em Reparação Histórica (`/solucoes/`).

Quando todos os itens acima passarem, bumpar cache-buster e taggear `0.11.0`.
