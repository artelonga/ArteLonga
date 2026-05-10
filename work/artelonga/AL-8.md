---
id: 8
title: "Enxugar help text + badge online (UI > caveats)"
type: task
status: done
priority: medium
labels: [refactor, ui, copy, retroactive]
module: renderer
created_at: 2026-05-09T00:00:00Z
updated_at: 2026-05-09T00:00:00Z
commits: [37d4ba80, 29bb0e40, a46fdd8f]
lesson: L-004
---

GIVEN a home tinha 4 textos de ajuda compensando UI ambígua —
`market-loc-help` ("Clique pra editar. Serviços digitais aparecem em
qualquer lugar."), `market-hint` ("Filtre por categoria ou comece a
digitar."), `toggle-help` listando sócios, e o caveat sobre
serviços digitais — todos noise pro usuário,

WHEN (a) removemos `toggle-help` (lista de sócios acoplava copy ao
roster), (b) reescrevemos `market-loc-help` pra "Clique pra editar.
Serviços digitais ignoram localização", depois pra só "Clique pra
editar.", (c) removemos `market-hint` redundante, (d) adicionamos
badge `online` no card pra serviços digitais (substitui o caveat
textual),

THEN cards comunicam visualmente o que precisava de texto antes; a
home tem ~3 strings de ajuda a menos; o motivo de um serviço aparecer
fora da região filtrada fica óbvio (badge online).

## Critérios de aceitação

- [x] `<span class="toggle-help">` removido + CSS órfã limpa.
- [x] `market-loc-help` reescrito pra "Clique pra editar." (curto).
- [x] `market-hint` removido + CSS órfã limpa.
- [x] Badge `.market-card-online` adicionado pra `s.digital`.
- [x] Cards mostram pílula cinza-clara ao lado do título quando digital.
- [x] V bumpado em `bootstrap.js` em cada commit.

Lesson: `docs/LESSONS.md#L-004`. Commits: `37d4ba80`, `29bb0e40`, `a46fdd8f`.
