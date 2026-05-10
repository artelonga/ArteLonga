---
id: 7
title: "Chip counts atualizam ao filtrar por nome"
type: task
status: done
priority: medium
labels: [fix, ui, home, retroactive]
module: renderer
created_at: 2026-05-09T00:00:00Z
updated_at: 2026-05-09T00:00:00Z
commit: e58a3653
lesson: L-003
---

GIVEN o filtro do home (`applyFilter`) atualizava `grid.innerHTML` e
`count.textContent` mas os contadores nos chips de supercategoria
(`<span class="sup-count">`) eram setados uma vez no render inicial e
nunca mais tocados, AND quando usuário digitava "design", "Todos 50"
continuava mostrando 50 mesmo com só 8 matching,

WHEN computamos um Set de títulos matching uma vez (reusando o
`indexed` array), AND atualizamos cada `.sup-count` no fim de
`applyFilter` aplicando o pipeline completo (search ∩ loc ∩ alOnly)
por categoria,

THEN cada chip mostra count que reflete a intersecção da sua
categoria com os filtros ativos.

## Critérios de aceitação

- [x] `applyFilter` atualiza chip counts além do grid + count text.
- [x] Chip "Todos" reflete total intersected.
- [x] Chips de categoria refletem intersected da categoria com search/loc/alOnly.
- [x] Performance OK (recompute em cada keystroke, ~50 services × 6 chips < 1ms).

Lesson: `docs/LESSONS.md#L-003`. Commit: `e58a3653`.
