---
title: Processo como Serviço
type: projeto
draft: true            # ainda RASCUNHO — não publicado (noindex; preview pro lead/parceiro)
status: draft
lead: yuri
reference: scrum        # scrum é REFERÊNCIA (não parceiro)
case: miguel            # miguel é o PARCEIRO do exemplo
partners: []
created: 2026-06-05
updated: 2026-06-17
attachments:
  - 2020-Scrum-Guide-US.pdf
# referências ESTRUTURADAS (dado, não só texto) — entram na base artelonga/co como
# entries do tipo `ref`, queryáveis por autor/título (mesmo padrão de neuro/references.js).
references:
  - key: scrum-guide-2020
    title: "The Scrum Guide (2020)"
    authors: "Schwaber, K.; Sutherland, J."
    year: 2020
    url: "https://scrumguides.org/"
    attachment: "2020-Scrum-Guide-US.pdf"
  - key: agile-manifesto-2001
    title: "Manifesto for Agile Software Development"
    authors: "Beck, K. et al."
    year: 2001
    url: "https://agilemanifesto.org/"
  - key: takeuchi-nonaka-1986
    title: "The New New Product Development Game"
    authors: "Takeuchi, H.; Nonaka, I."
    year: 1986
    container: "Harvard Business Review"
    url: "https://hbr.org/1986/01/the-new-new-product-development-game"
  - key: scrum-org
    title: "Scrum.org — Home of Scrum"
    url: "https://www.scrum.org/"
license: "The Scrum Guide © 2020 Ken Schwaber & Jeff Sutherland — Attribution ShareAlike"
---

# Processo como Serviço

A ArteLonga não oferece Scrum. Oferece **processo** — o ritmo que transforma uma
conversa solta num legado publicado e vivo. Scrum é a **referência** que dá
vocabulário a esse ritmo; o serviço é colocá-lo pra rodar no **seu universo**.

> **Scrum é referência. Miguel é parceiro.** Essa é a distinção que organiza esta
> página: de um lado a teoria (a referência, com seu guia anexo); do outro a
> prática — um universo real nascendo. A teoria explica; o parceiro acontece.

## De lead a universo (o serviço, na prática)

[Miguel](https://miguel.artelonga.com.br) é um lead que virou universo. O caminho
é o mesmo pra qualquer parceiro, e cada passo só acontece quando o anterior pede:

1. **Arquivo.** Começa com um arquivo de texto — uma conversa, uma intenção. Nada
   de infraestrutura ainda.
2. **Pasta.** Ganha anexos e companhia, então vira **pasta** portável, com um lead
   responsável. Um arquivo solto não segura anexo; a pasta sim.
3. **Publicação.** A pasta vira superfície publicada — **estática por padrão**.
   Rápida, barata, sem servidor pra manter.
4. **Dinamismo sob demanda.** Só quando o conteúdo pede (um calendário, um backend),
   liga-se a parte dinâmica — e **escala a zero por padrão**: parado, custo marginal
   perto de zero; sob uso, sobe sozinho.
5. **Domínio público.** Fly é **staging**: testamos o comportamento *real* lá
   primeiro e, quando aprova, publicamos o **mesmo** deploy trocando o DNS — sem
   refazer nada. Veja em [miguel.artelonga.com.br](https://miguel.artelonga.com.br).

## Como o trabalho entra: tarefas co-auto

Pedido de funcionalidade vira **tarefa co-auto** dentro do universo do parceiro,
com prefixo próprio. Miguel usa **`MG-`** — os códigos se intercalam (`MG-1`,
`MG-2`, …) e podem ser distribuídos entre os projetos do parceiro. O resultado de
cada tarefa fica **linkado pelo site**: tarefa → entrada → superfície.

O quadro do Miguel mostra a **distribuição de feito** — o mesmo padrão de uma
lista de *onboarding* checada (como a do projeto **Alpha Scholars**, um dos seus
universos):

- ✅ `MG-4` — Renomear Off Scholars → Alpha Scholars
- ✅ `MG-6` — Estudo Minecraft → síntese em App Agro / experiência
- ✅ `MG-8` — MSE = objetivo de graduação; descrição do App Agro
- ◻︎ `MG-1` — Missões e objetivos mensuráveis dos 3 projetos
- ◻︎ `MG-9` — Domínio `miguel.artelonga.com.br` — `baseUrl` ✓; cert pendente

## Release: quinta-feira, 15h

Ritmo fixo, como uma Sprint: **tudo que foi mergeado / aprovado até quinta-feira
às 15h entra no ar**. Previsível pro parceiro e pra nós — sem fila aberta, sem
"quando der".

## Preview primeiro, compromisso depois

Esta página **é** um preview — e o fluxo inverte a ordem de costume:

1. **Publica.** O deploy de preview vai pro ar (Fly staging) **antes** de qualquer
   commit.
2. **Miguel aprova.** Revisa o comportamento real, comenta, pede ajuste.
3. **Commit / PR.** Só então a gente commita e abre o PR.

O **compromisso vem depois do deploy**: como o preview já está no ar, qualquer
mudança, comentário ou feedback pode ser incorporado — desde que enviado **até as
15h**. Você vê funcionando antes de assinar embaixo.

---

## Referência: Scrum

Scrum é um framework leve que ajuda pessoas, times e organizações a gerar valor
através de soluções adaptativas pra problemas complexos. Não é um processo fechado
nem uma técnica — é um *frame* dentro do qual se empregam práticas próprias. É a
**referência** que nomeia o ritmo do serviço acima.

> O guia oficial (2020), em inglês, está anexo a esta pasta:
> [[2020-Scrum-Guide-US.pdf]]. Uma **tradução pt-BR** entra aqui como segundo anexo
> — e é por causa de anexos como esse que este conteúdo deixou de ser um arquivo
> solto e virou uma **pasta** (o passo 2 acima, acontecendo com a própria página).

### Os três pilares (controle empírico)

- **Transparência** — o trabalho e o processo são visíveis a quem faz e a quem recebe.
- **Inspeção** — artefatos e progresso são checados com frequência.
- **Adaptação** — ao detectar desvio, ajusta-se o quanto antes.

### Papéis (Scrum Team)

- **Product Owner** — maximiza o valor do produto; dono do Product Backlog.
- **Scrum Master** — serve ao time; cuida de que o Scrum seja entendido e praticado.
- **Developers** — quem cria o Incremento a cada Sprint.

### Eventos

- **Sprint** — o contêiner de todos os outros (≤ 1 mês).
- **Sprint Planning** — o que e como nesta Sprint.
- **Daily Scrum** — sincronização diária de 15 min.
- **Sprint Review** — inspeciona o Incremento com stakeholders.
- **Sprint Retrospective** — inspeciona o *processo*; melhora a próxima Sprint.

### Artefatos (cada um com um compromisso)

- **Product Backlog** → Meta do Produto.
- **Sprint Backlog** → Meta da Sprint.
- **Increment** → Definition of Done.

## Referências (estruturadas)

Entram na **base artelonga/co** como conteúdo queryável por autor/título (mesmo
padrão da [bibliografia neuro](/neuro/bibliografia.html)), parte do upgrade da base
de conhecimento. Todos os links:

- **The Scrum Guide (2020)** — Schwaber, K.; Sutherland, J. — [scrumguides.org](https://scrumguides.org/) · guia oficial anexo nesta pasta: [[2020-Scrum-Guide-US.pdf]]
- **Manifesto for Agile Software Development (2001)** — Beck, K. *et al.* — [agilemanifesto.org](https://agilemanifesto.org/)
- **The New New Product Development Game (1986)** — Takeuchi, H.; Nonaka, I. — *Harvard Business Review* — [hbr.org](https://hbr.org/1986/01/the-new-new-product-development-game) — origem do termo *scrum* em desenvolvimento de produto.
- **Scrum.org — Home of Scrum** — [scrum.org](https://www.scrum.org/)
