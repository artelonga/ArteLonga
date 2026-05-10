---
id: 6
title: "Try/catch no dispatcher pra evitar blank page silencioso"
type: task
status: done
priority: high
labels: [fix, render, defensive, retroactive]
module: renderer
created_at: 2026-05-09T00:00:00Z
updated_at: 2026-05-09T00:00:00Z
commit: f6d33a35
lesson: L-002
parent: 5
---

GIVEN renderers escrevem `document.body.innerHTML = \`...\`` no FIM
de cada template literal, AND se algo lança no meio (ex: entry
malformada em `AL.people` sem `.handle`), o body NUNCA recebe HTML
e a página fica em branco sem console error chamativo,

WHEN envolvemos o dispatcher do renderer em try/catch com fallback
visível (`<main><p>Algo quebrou. <a href="/">voltar</a></p></main>`),

THEN qualquer throw mid-template vira mensagem visível pro usuário +
log no console em vez de blank page silenciosa. Bug noticeable e
recuperável (link de volta).

## Critérios de aceitação

- [x] `assets/renderer.js` tem try/catch envolvendo o dispatch.
- [x] Catch registra erro no console + escreve fallback HTML visível no body.
- [x] Não regride caminho normal (renderers existentes continuam funcionando).

Lesson: `docs/LESSONS.md#L-002`. Commit: `f6d33a35`. Defensiva pareada com AL-5 (DCL fix).
