---
title: Scrum
type: projeto
draft: true            # ainda RASCUNHO — não publicado (noindex; só revisão do lead)
status: draft
lead: yuri
partners: []
created: 2026-06-05
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

# Scrum

Scrum é um framework leve que ajuda pessoas, times e organizações a gerar valor
através de soluções adaptativas pra problemas complexos. Não é um processo nem uma
técnica fechada — é um *frame* dentro do qual você emprega práticas próprias.

> O guia oficial (2020), em inglês, está anexo a esta pasta:
> [[2020-Scrum-Guide-US.pdf]]. Uma **tradução pt-BR** entra aqui como segundo anexo
> — e é exatamente por causa de anexos como esse que este conteúdo deixou de ser um
> arquivo solto e virou uma **pasta**.

## Por que na ArteLonga

ArteLonga gere carreira, marca, produto, tecnologia e comunicação — trabalho
intrinsecamente iterativo e incerto. Scrum dá o ritmo (Sprints), os papéis e a
transparência pra entregar valor cedo e ajustar com feedback, em vez de apostar tudo
num plano grande de uma vez só.

## Os três pilares (controle empírico)

- **Transparência** — o trabalho e o processo são visíveis a quem faz e a quem recebe.
- **Inspeção** — artefatos e progresso são checados com frequência.
- **Adaptação** — ao detectar desvio, ajusta-se o quanto antes.

## Papéis (Scrum Team)

- **Product Owner** — maximiza o valor do produto; dono do Product Backlog.
- **Scrum Master** — serve ao time; cuida de que o Scrum seja entendido e praticado.
- **Developers** — quem cria o Incremento a cada Sprint.

## Eventos

- **Sprint** — o contêiner de todos os outros (≤ 1 mês).
- **Sprint Planning** — o que e como nesta Sprint.
- **Daily Scrum** — sincronização diária de 15 min.
- **Sprint Review** — inspeciona o Incremento com stakeholders.
- **Sprint Retrospective** — inspeciona o *processo*; melhora a próxima Sprint.

## Artefatos (cada um com um compromisso)

- **Product Backlog** → Meta do Produto.
- **Sprint Backlog** → Meta da Sprint.
- **Increment** → Definition of Done.

## Referências

Referências estruturadas — entram na **base artelonga/co** como conteúdo
queryável por autor/título (mesmo padrão da [bibliografia neuro](/neuro/bibliografia.html)),
parte do upgrade da base de conhecimento. Todos os links:

- **The Scrum Guide (2020)** — Schwaber, K.; Sutherland, J. — [scrumguides.org](https://scrumguides.org/) · guia oficial anexo nesta pasta: [[2020-Scrum-Guide-US.pdf]]
- **Manifesto for Agile Software Development (2001)** — Beck, K. *et al.* — [agilemanifesto.org](https://agilemanifesto.org/)
- **The New New Product Development Game (1986)** — Takeuchi, H.; Nonaka, I. — *Harvard Business Review* — [hbr.org](https://hbr.org/1986/01/the-new-new-product-development-game) — origem do termo *scrum* em desenvolvimento de produto.
- **Scrum.org — Home of Scrum** — [scrum.org](https://www.scrum.org/)

---

## Ciclo deste conteúdo — *draft → folder → partner*

Este material demonstra o ciclo de vida de conteúdo da ArteLonga:

1. **Draft** — nasceu como um rascunho (`scrum.md`), um arquivo só.
2. **Folder (lead)** — ganhou **anexo** (o guia PDF + tradução pt-BR), então virou uma
   **pasta** com um **lead** responsável (yuri). Um `.md` não segura anexos; a pasta
   sim, e fica **portável** — pronta pra virar superfície própria.
3. **Partner** — pode receber um **parceiro** convidado (um Scrum Master externo, um
   cliente) com acesso de leitura/colaboração.

Publica hoje em `artelonga.com.br/scrum`; quando crescer, **promove** pra superfície
própria em `scrum.artelonga.com.br` — o mesmo runbook de
[universe-upgrade](../docs/universe-upgrade.md), sem perder estado nem histórico.
