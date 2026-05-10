---
id: 3
title: "Memory system: docs/LESSONS.md + docs/STATE.md + CLAUDE.md lições"
type: user-story
status: todo
priority: high
labels:
  - docs
  - process
  - onboarding
  - memory
module: docs
created_at: 2026-05-10T00:00:00Z
updated_at: 2026-05-10T00:00:00Z
---

GIVEN o repo tem 30+ commits `fix|feat|refactor` que ensinaram lições
generalizáveis (DCL race, silent render fail, copy noise, hardcoded
multi-tenant, etc), AND essas lições só vivem hoje implícitas em
CHANGELOG.md (495 linhas) + commit messages, AND um dev novo (ou agente
co-auto futuro) precisa ler centenas de commits pra entender padrões
estabelecidos, AND **vamos repetir os mesmos bugs** se não codificarmos
o aprendizado em formato consultável,

WHEN criamos `docs/LESSONS.md` (catálogo append-only de anti-patterns
extraídos do histórico de fixes), `docs/STATE.md` (snapshot
auto-gerado do estado do projeto), AND adicionamos uma section
"Lições críticas" em `CLAUDE.md` com as 5-7 lessons mais load-bearing
inline pra contexto rápido de agente,

THEN um dev/agente novo abre `CLAUDE.md` → vê stack + as 7 lessons
críticas; abre `docs/LESSONS.md` → catálogo completo com código de
mitigação por classe de bug; abre `docs/STATE.md` → "o que existe hoje";
abre `work/artelonga/` → "o que está aberto pra fazer". 4 docs, 4
camadas mentais, sem ler 30 commits.

---

## Estado atual

- `CHANGELOG.md` — 495 linhas de narrativa por release. Rico mas não
  consultável por classe de bug.
- `CLAUDE.md` — 93 linhas: stack, slug, content types, convenções,
  "como editar perfil". Não tem lições.
- `docs/` — temáticas (ABSTRACTIONS, SCHEMA, UAT, oportunidade-tese,
  proximos-passos-tese, analytics-api). Sem LESSONS, sem STATE.
- Histórico: ~30 commits relevantes em `git log --grep "^fix\|^feat\|^refactor"`.

## Estado-alvo

```
docs/
├── LESSONS.md                  # NOVO — append-only, anti-patterns
├── STATE.md                    # NOVO — auto-gerado de CHANGELOG
├── ABSTRACTIONS.md             # existente
├── SCHEMA.md                   # existente
├── UAT.md                      # existente
├── analytics-api.md            # existente
├── oportunidade-tese.md        # existente
└── proximos-passos-tese.md     # existente

CLAUDE.md                       # atualizado — section "Lições críticas"

tools/
├── bake-people.mjs             # existente
├── bake-communities.mjs        # existente
└── bake-state.mjs              # NOVO — gera STATE.md
```

## `docs/LESSONS.md` — formato

```markdown
# Lessons learned

Catálogo append-only de anti-patterns que mordedaram o projeto. Cada
entrada é uma classe de bug, não uma instância. Adicionar entrada
quando um fix ensinou algo generalizável (não trivial, não óbvio).
**Não remover entradas** — esse é o histórico institucional.

## L-001: Scripts dinâmicos não bloqueiam DOMContentLoaded

**Anti-pattern:** registrar `DOMContentLoaded` listener em script
carregado via `document.createElement('script')` + `async = false`.

**Why broke:** dynamic scripts não bloqueiam DCL mesmo com async=false.
Quando o body é vazio (HTML estático sem conteúdo inline), DCL dispara
antes do script chegar pela rede. Listener registrado tarde demais →
nunca executa → página em branco silenciosa.

**Mitigação:**
\`\`\`js
function dispatch() { /* ... */ }
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", dispatch);
} else {
    dispatch();
}
\`\`\`

**Quando aplicar:** sempre que o script for injetado dinamicamente e
precise interagir com DOM já parseado.

**Incident:** `251d7bfe` (2026-05-09) — site inteiro em branco após
refactor de bootstrap.

---

## L-002: Render falha silenciosa em template literal mid-build

**Anti-pattern:** renderer escreve `document.body.innerHTML = \`...\``
no FIM do template. Se algo lança no meio (ex: `entity.handle` undefined
em entry malformada), body nunca recebe o HTML — página em branco sem
sinal.

**Mitigação:** wrap dispatcher em try/catch com fallback visível:
\`\`\`js
try { fn(); } catch (e) {
    console.error("render falhou:", e);
    document.body.innerHTML = \`<main><p>Algo quebrou. <a href="/">voltar</a></p></main>\`;
}
\`\`\`

**Quando aplicar:** todo dispatcher que troca document.body.innerHTML.

**Incident:** `f6d33a35`.

---
```

E assim por diante. **Seedear com L-001 a L-012** (vide análise no
chat de 2026-05-10 ou minerar de novo de `git log --grep "^fix"`).

## `docs/STATE.md` — formato

Auto-gerado por `tools/bake-state.mjs`. Sections:

```markdown
# Estado do projeto · <auto-gerado YYYY-MM-DD>

## O que isso é

Arte Longa — agência de carreira/produto/tech/comunicação. Site público
estático em GitHub Pages. Marketplace de serviços focado no contratante.

## Stack

- HTML/CSS/JS vanilla. Bootstrap único em `assets/bootstrap.js` carrega
  CSS + data.js + renderer.js.
- Backend `co.artelonga.com.br` opcional (auth + analytics).
- Conteúdo em YAML por handle (`<handle>/profile.yaml`,
  `<handle>/community.yaml`); rest hardcoded em data.js (em migração).

## Última release

(extrair de CHANGELOG.md primeira section abaixo de [Unreleased])

## Recentes feats (últimos 30 dias)

(parsear `git log --since="30 days ago" --grep "^feat"`)

## Recentes fixes (últimos 30 dias)

(parsear `git log --since="30 days ago" --grep "^fix"`)

## Backlog aberto

(listar `work/artelonga/AL-*.md` com `status: todo`)

## Como contribuir

1. Pegue um AL- aberto, ou abra um.
2. Leia `CLAUDE.md` (raiz) + `docs/LESSONS.md` antes de codar.
3. PR pra main (regra global PR-only).
```

## CLAUDE.md additions

Adicionar section após "Convenções":

```markdown
## Lições críticas (consulte antes de codar)

Catálogo completo em `docs/LESSONS.md`. As load-bearing:

1. **L-001 — DCL race em script dinâmico.** Use `document.readyState` check.
2. **L-002 — Render fail silencioso.** Try/catch em todo dispatcher de body.innerHTML.
3. **L-003 — UI derivada de filtro deve atualizar toda.** Não só o output principal.
4. **L-004 — Copy ajuda compensa UI ruim.** Conserta UI primeiro.
5. **L-007 — URL sem shell HTML = 404.** Audit cross-coverage em toda mudança de catalog.
6. **L-008 — Termos de domínio são trabalho técnico.** Precisão > brevidade.
7. **L-009 — Dado multi-tenant em arquivo único viola LGPD.** Folder per owner.

Adicionar entrada nova em `docs/LESSONS.md` quando um fix ensinar algo
generalizável.
```

## `tools/bake-state.mjs`

Node.js, sem deps externas:

1. Lê `CHANGELOG.md`, extrai primeira section de release (não [Unreleased]).
2. Roda `git log --since="30 days ago" --grep="^feat"` e `^fix`,
   formata como bullet list.
3. Lista `work/artelonga/AL-*.md` filtrando `status: todo|in_progress`.
4. Escreve `docs/STATE.md` com header `auto-gerado YYYY-MM-DD`.
5. Determinístico se rodado no mesmo dia (timestamp dentro de 24h
   gera mesmo output exceto pela data).

## Implementação

### Phase 1: LESSONS.md seed

Criar `docs/LESSONS.md` com L-001 a L-012 (vide análise inline no
ticket; ou minerar `git log --grep "^fix"` últimos 90 dias e extrair).

Validate: pelo menos 10 lessons, cada uma com pattern/why/mitigação/incident.

### Phase 2: bake-state.mjs

Cria o script. Roda. Gera `docs/STATE.md`. Verifica que parseia (Markdown OK).

### Phase 3: CLAUDE.md update

Adiciona section "Lições críticas" após "Convenções". Linka pra
`docs/LESSONS.md`.

### Phase 4: Documenta a manutenção

Adiciona em CLAUDE.md (ou em `docs/LESSONS.md` mesmo, no header):

```
Quando adicionar entrada em LESSONS.md:
- Commit fix que ensinou algo generalizável → nova entrada antes do PR.
- Sintaxe: L-NNN, próximo número livre.
- Não remover entradas.
```

## Critérios de aceitação

- [ ] `docs/LESSONS.md` existe com pelo menos 10 entries no formato
      pattern/why/mitigation/when/incident.
- [ ] `docs/STATE.md` existe, gerado por `tools/bake-state.mjs`.
- [ ] `tools/bake-state.mjs` roda sem erro, produz output válido em
      runs consecutivos no mesmo dia.
- [ ] `CLAUDE.md` tem section "Lições críticas" com 5-7 lessons inline +
      link pra LESSONS.md.
- [ ] `CHANGELOG.md` tem entry sob [Unreleased] documentando o memory system.
- [ ] V bumpado em `bootstrap.js` (mesmo que mudança seja só docs, mantém
      convenção pra invalidar cache de dev).

## Out of scope

- AL-4 (periodic STATE refresh via /schedule) — separado.
- AL-5 (`/dev/` página HTML pública) — separado.
- Mining ML automatizado de lessons (manual seed por enquanto).
- PR template enforcement (boa adição mas separado).

## Notas

- **LESSONS.md é append-only.** Ainda que uma lesson fique obsoleta,
  marcar como `~~strikethrough~~` + nota em vez de deletar. Histórico
  institucional > limpeza.
- **STATE.md é auto-gerado.** Não editar à mão; rodar `tools/bake-state.mjs`.
- **Inline as 7 mais críticas em CLAUDE.md** porque agent context tem cap;
  agente não vai sempre fetchar LESSONS.md inteiro.
- **Separation of concerns:** LESSONS = anti-patterns generalizáveis;
  CHANGELOG = narrativa por release; STATE = snapshot atual; AL- =
  forward-looking. Cada um com lifecycle distinto.

## Related

- AL-1, AL-2 — também aplicaram "separar content de form" pra dados.
- Esse ticket aplica o mesmo princípio pra **conhecimento** sobre o
  projeto (lessons separadas do CHANGELOG narrativo, STATE separado
  do código que descreve).
- `CHANGELOG.md` — fonte primária pra STATE.md.
- `git log --grep "^fix"` — fonte primária pra LESSONS.md.
