# Espaço ArteLonga — Instruções para Claude / co-auto

## Contexto

Este espaço (`work/artelonga/`) é o board de desenvolvimento do site público
artelonga.com.br (estático, GitHub Pages). Cada arquivo `AL-<n>.md` é uma
user-story com critérios de aceitação em formato GIVEN/WHEN/THEN.

## Stack do site

- HTML/CSS/JS vanilla (sem framework).
- Bootstrap único em `assets/bootstrap.js` carrega CSS + data.js + renderer.js.
- Conteúdo de cada universe (membros, serviços, missões) hoje reside em
  `assets/data.js` hardcoded; backend em `co.artelonga.com.br` lê markdown
  files na pasta raiz como source of truth alternativa.
- Versionamento de assets via `V` em `bootstrap.js` (bumpar em qualquer
  mudança de CSS/JS pra invalidar cache do GitHub Pages).

## Como executar uma tarefa

1. Ler o `AL-<n>.md` integralmente, incluindo `parent` e `module`.
2. Verificar dependências (`blocked_by` se presente) — não executar bloqueada.
3. Implementar **estritamente** o que está nos critérios de aceitação.
4. Bumpar `V` em `assets/bootstrap.js` se mudou CSS/JS (não tocar versões em HTMLs — eles carregam só o bootstrap).
5. Atualizar `CHANGELOG.md` (seção `[Unreleased]`).
6. Commit conventional: `<tipo>(AL-<n>): <descrição>` em PT-BR.
7. Marcar `status: done` no frontmatter da tarefa.

## Mapeamento de tipos → bump

| Tipo do commit | Bump | Exemplo |
|---|---|---|
| `feat` | minor | nova feature → 0.1.0 |
| `fix` | patch | correção de bug → 0.1.1 |
| `refactor` | patch | reorganização → 0.1.2 |
| `docs`/`chore`/`test` | patch |  → 0.1.3 |

## Princípios

- **Estático first.** Site funciona sem o backend `co` rodando. Runtime
  fetches contra `co.artelonga.com.br` são opcionais e devem ter fallback.
- **Sem framework.** Vanilla JS. Não introduzir React/Vue/Svelte.
- **Cuidado com data.js.** É grande (~1000 linhas) e muito do site depende
  dele. Mudanças estruturais devem rodar `node -e "require('./assets/data.js')"`
  pra confirmar que carrega antes de commitar.
- **PR-only pra main.** Nunca push direto sem revisão (regra global do user).
- **Stage explícito.** `git add <files>` específicos, nunca `git add -A`.
