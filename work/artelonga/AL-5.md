---
id: 5
title: "Fix DCL race em script dinâmico (renderer não rodava)"
type: task
status: done
priority: high
labels: [fix, render, retroactive]
module: bootstrap
created_at: 2026-05-09T00:00:00Z
updated_at: 2026-05-09T00:00:00Z
commit: 251d7bfe
lesson: L-001
---

GIVEN o `bootstrap.js` injeta `data.js` + `renderer.js` como dynamic
scripts com `async = false`, AND scripts dinâmicos NÃO bloqueiam
DOMContentLoaded (mesmo com async=false), AND o `body` é praticamente
vazio (sem conteúdo inline) → DCL disparava antes do renderer.js
chegar pela rede,

WHEN trocamos o registro `addEventListener("DOMContentLoaded", dispatch)`
incondicional por um check de `readyState`,

THEN renderer dispatcher executa em ambos os casos: se DCL ainda não
disparou, registra listener; se já disparou, dispatcha imediato.
Site deixa de ficar em branco silenciosamente.

## Critérios de aceitação

- [x] `assets/renderer.js` tem `if (document.readyState === "loading")` antes do listener.
- [x] Site renderiza após hard reload (cache busted).
- [x] V bumpado em `bootstrap.js`.

Lesson: `docs/LESSONS.md#L-001`. Commit: `251d7bfe`.
