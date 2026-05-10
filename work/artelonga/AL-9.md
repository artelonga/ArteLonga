---
id: 9
title: "Traduzir math interna pra texto humano em preços"
type: task
status: done
priority: medium
labels: [fix, copy, pricing, retroactive]
module: data
created_at: 2026-05-08T00:00:00Z
updated_at: 2026-05-08T00:00:00Z
commits: [1b6fea8a, e7eb082e]
lesson: L-005
---

GIVEN cards de serviço mostravam fórmulas internas direto pro cliente
(ex: "R$ 0.005/palavra"), AND essa fórmula é ilegível pra contratante
("Quanto custa traduzir 5 páginas?"), AND per-unit (palavra) tinha
regras de cálculo inconsistentes entre sócio e não-sócio,

WHEN substituímos a exibição da fórmula por texto humano
("Tarifa-base R$ 100/h"), AND padronizamos per-unit (palavra) pra
usar a rate da rede ignorando a non-sócio rule (que era para a
métrica horária),

THEN cliente vê um número humano + contexto. Cálculo permanece nos
internals (`computeFaixaPreco`), só a apresentação muda.

## Critérios de aceitação

- [x] Cards mostram "Tarifa-base R$ 100/h" no lugar de fórmula por palavra.
- [x] `computeFaixaPreco` aplica rate da rede pra per-unit (sem fallback non-sócio).
- [x] Casos de "Sob consulta" preservados quando hours não computados.

Lesson: `docs/LESSONS.md#L-005`. Commits: `1b6fea8a`, `e7eb082e`.
