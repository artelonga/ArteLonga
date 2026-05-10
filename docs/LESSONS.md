# Lessons learned

Catálogo append-only de anti-patterns que mordedaram o projeto. Cada entrada
é uma classe de bug, não uma instância. Adicionar entrada quando um fix
ensinou algo generalizável (não trivial, não óbvio). **Não remover
entradas** — esse é o histórico institucional. Se uma lesson ficar obsoleta,
marcar `~~strikethrough~~` + nota em vez de deletar.

Mineradas do histórico de fixes em `git log --grep "^fix\|^refactor"` até 2026-05-10.

---

## L-001: Scripts dinâmicos não bloqueiam DOMContentLoaded

**Anti-pattern:** registrar `DOMContentLoaded` listener em script
carregado via `document.createElement('script')` + `async = false`.

**Why broke:** dynamic scripts não bloqueiam DCL mesmo com async=false
(que só garante ordem entre os dynamic scripts, não vs paint/DCL). Quando
o body é vazio (HTML estático sem conteúdo inline), DCL dispara antes do
script chegar pela rede. Listener registrado tarde demais → nunca executa
→ página em branco silenciosa.

**Mitigação:**
```js
function dispatch() { /* ... */ }
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", dispatch);
} else {
    dispatch();
}
```

**Quando aplicar:** sempre que script for injetado dinamicamente e
precise interagir com DOM já parseado. Especialmente após bootstrap
patterns que fazem `document.head.appendChild(s)`.

**Incident:** `251d7bfe` (2026-05-09) — site inteiro em branco após
refactor de bootstrap (`e2dd5240`).

---

## L-002: Render falha silenciosa em template literal mid-build

**Anti-pattern:** renderer escreve `document.body.innerHTML = \`...\``
no FIM do template. Se algo lança no meio (ex: `entity.handle` undefined
em entry malformada de `data.js`), body nunca recebe o HTML — página em
branco sem sinal nem console error chamativo.

**Mitigação:** wrap dispatcher em try/catch com fallback visível:
```js
try { fn(); } catch (e) {
    console.error("render falhou:", e);
    document.body.innerHTML = `<main class="main"><p>Algo quebrou ao renderizar. <a href="/">voltar</a></p></main>`;
}
```

**Quando aplicar:** todo dispatcher que troca `document.body.innerHTML`.
Especialmente em SPA-style render onde uma data corruption derruba a
página inteira.

**Incident:** `f6d33a35` (defensiva pareada com L-001).

---

## L-003: UI derivada de filtro pipeline tem que atualizar TODA UI

**Anti-pattern:** filtro `applyFilter()` atualiza o output principal
(grid + count text) mas deixa contadores acessórios (chip counts no
faceted UI) com valores stale do render inicial.

**Why broke:** chip "Todos 50" mostrava 50 mesmo quando a busca filtrava
pra 8 — confunde usuário ("se cliquei e tem 50, por que só vejo 8?").

**Mitigação:** TODO derived state vai pro `applyFilter`:
```js
function applyFilter() {
    // ... compute list ...
    grid.innerHTML = list.map(card).join("");
    count.textContent = ...;
    
    // E TAMBÉM:
    chips.forEach(chip => {
        chip.querySelector('.sup-count').textContent = countFor(chip.cat);
    });
}
```

**Quando aplicar:** qualquer UI faceted/filtrada com múltiplos
contadores. Se um contador deriva do mesmo pipeline que outro, ambos
atualizam juntos.

**Incident:** `e58a3653`.

---

## L-004: Help text é symptom de UI ambígua

**Anti-pattern:** adicionar parágrafo explicativo abaixo de um controle
("Clique pra editar. Serviços digitais aparecem em qualquer lugar.").

**Why broke:** usuário não lê. Help text doubles UI noise. "Em qualquer
lugar" é ambíguo — pode ser interpretado como "em qualquer parte da
tela" em vez de "independente de localização".

**Mitigação:**
1. **Conserta a UI primeiro.** Pills com cursor:pointer + estilo claro
   = óbvio que é editável (sem precisar do "Clique pra editar").
2. **Indicador no resultado > caveat preventivo.** Badge "online" no
   card explica naturalmente por que serviço fora da região aparece.
3. **Se ainda precisar de copy, seja preciso.** "Digital ignora
   localização" > "aparece em qualquer lugar".

**Quando aplicar:** toda vez que adicionar `<p class="..-help">`.
Pergunte: "a UI sozinha comunica isso?". Se sim, não adicione texto.

**Incidents:** `29bb0e40`, `37d4ba80`, `a46fdd8f`.

---

## L-005: Math/formulas internas não pertencem na UI do usuário

**Anti-pattern:** mostrar fórmula técnica direto no card ("R$ 0.005/palavra").

**Why broke:** ilegível pro contratante. "Quanto custa?" não é
respondida por uma fórmula.

**Mitigação:** traduz pra texto humano:
- "Tarifa-base R$ 100/h"
- "Sob consulta"
- "A partir de R$ 1.000"

A fórmula fica nos internals do `computeFaixaPreco` em data.js;
renderer mostra só o output humano.

**Quando aplicar:** sempre que tentar exibir um cálculo pro usuário.

**Incidents:** `1b6fea8a`, `e7eb082e`.

---

## L-006: Browser non-determinism em widgets nativos

**Anti-pattern:** usar `<datalist>` pra autocomplete em forms.

**Why broke:** comportamento de autofill varia entre Chrome/Safari/Firefox
+ entre plataformas (mobile/desktop). Sometimes triggers browser
auto-suggest history; sometimes shows datalist; sometimes nothing. Sem
controle.

**Mitigação:** custom dropdown JS quando comportamento importa:
```html
<input id="loc-estado" autocomplete="off" data-field="estado">
<ul class="loc-dropdown" id="dd-estado" hidden role="listbox"></ul>
```
JS popula dropdown em focus/input com filter contra dataset known.

**Quando aplicar:** form fields onde precisa controlar exatamente o que
usuário vê. Especialmente em busca/filtro.

**Incident:** `9f65ee7a` (e variants).

---

## L-007: URL referenciada sem shell HTML correspondente = 404

**Anti-pattern:** renderer gera `<a href="/servicos/X/">` mas
`servicos/X/index.html` não existe → 404 do GitHub Pages.

**Why broke:** `data.js` adiciona service novo, mas o "static shell"
HTML que o GH Pages serve nesse path tem que ser criado separadamente.
Esquece e usuário clica → erro.

**Mitigação:**
1. **Coverage audit em toda mudança de catálogo.** Script que compara
   URLs geradas pelo renderer vs shell HTML files que existem; falha
   se gap.
2. **Convenção:** ao adicionar `service` em data.js, criar
   `servicos/<slug>/index.html` no MESMO commit.
3. **Long-term:** auto-gerar shells via build script.

**Quando aplicar:** qualquer mudança em `data.js` que adiciona slugs
referenciáveis (services, communities, members).

**Incidents:** `2f5593ab` (6 service shells), `4f84585b` (21 page
titles "U<handle>" — outro bug de propagation cross-shell).

---

## L-008: Termos de domínio são trabalho técnico

**Anti-pattern:** usar palavras "próximas" sem precisão. "Sob demanda"
vs "Sob consulta", "Interpretação" vs "Tradução", "Estúdios" sem
contexto.

**Why broke:**
- "Sob demanda" sugere "disponível quando precisar"; "Sob consulta"
  sugere "preço varia, peça orçamento". Diferentes UX expectations.
- "Tradução" = texto escrito EN→PT; "Interpretação" = oral live
  EN↔PT. Confundir vende serviço errado.

**Mitigação:** glossário inline no doc + revisão de copy por alguém
que conhece o domínio. Não ship copy de domínio sem verificar.

**Quando aplicar:** qualquer copy que toca terminologia de serviço,
contrato, ou processo.

**Incidents:** `1f3c7059` ("Sob consulta"), `e6765060`
(Interpretação vs Tradução).

---

## L-009: Dado multi-tenant em arquivo único viola LGPD

**Anti-pattern:** array `people = [...]` com 30+ entries hardcoded em
`assets/data.js`. Yuri + Mara + Carlinhos + ... todos no mesmo arquivo.

**Why broke:** se Mara solicita exercer direito LGPD (acesso, correção,
deleção), você não consegue dar acesso ao "folder dela" porque ela
não tem um. Edita um arquivo que mistura dados de outros 29.

**Mitigação:** folder per owner. `<handle>/profile.yaml` é a source of
truth; build script `tools/bake-people.mjs` regenera o array
AUTO-GENERATED em `data.js`. Cada owner edita só o próprio folder.

**Quando aplicar:** qualquer dado multi-tenant onde tenants são
people-or-orgs sob LGPD/GDPR. Communities, services com
implicitResponsavel, missions, etc.

**Incidents:** AL-1 (people), AL-2 (communities). A aplicar: services,
missions, leads.

---

## L-010: YAML+MD frontmatter tem boundary edge case

**Anti-pattern:** convenção Jekyll-like — `---\nfrontmatter\n---\nbody markdown`.
Dois parsers no mesmo arquivo separados por delimiter `---`.

**Why broke:** se body markdown tem `---` literal (separator horizontal
markdown), parser de frontmatter fecha precoce. Edge case raro mas
real. Plus: dois schemas pra documentar, dois parsers pra manter.

**Mitigação:** YAML puro com bio em literal block scalar:
```yaml
bio: |
  Filho de Kiyoshi e Soninha...
  Como neurocientista, busco compreender a consciência.
```
Um parser, sem boundary.

**Quando aplicar:** qualquer file format pra config/data com prosa
multi-linha. Resista à tentação de Jekyll-like se você não precisa de
markdown rich (headers, lists, blockquotes).

**Incident:** AL-1 spec revision (a vs b option).

---

## L-011: Bumpar versão em N HTMLs duplica trabalho proporcional ao site

**Anti-pattern:** cada `<handle>/index.html` tinha próprio
`<link href="site.css?v=20260417">` + `<script src="renderer.js?v=20260417">`.
150 arquivos × 4 referências cada = 600 entries pra atualizar a cada
asset change.

**Why broke:** mudar uma vírgula em CSS exigia re-bumpar V em 600 lugares
ou aceitar que alguns clients ficassem com cache stale.

**Mitigação:** `assets/bootstrap.js` é o único `<script>` em cada HTML
shell. Carrega CSS + data.js + renderer.js dinamicamente com `?v=V`.
Bumpa V uma vez no bootstrap → todos os assets re-fetchados.
GH Pages cache-control de bootstrap.js (~10min) propaga sozinho.

**Quando aplicar:** qualquer site com N páginas estáticas + assets
compartilhados. Single point of truth pra cache busting é vital.

**Incident:** `e2dd5240` — `refactor: centralizar carregamento de
assets via /assets/bootstrap.js`.

---

## L-012: Vendoring vs runtime CDN — quando vendoring vence

**Anti-pattern (proposto e rejeitado):** hospedar SDK central em
`co.artelonga.com.br/sdk/analytics.js` e cada universe carregar dali.

**Why broke (mental experiment):** se `co` cair, TODOS os universes
quebram analytics simultaneamente. Acoplamento de fragilidade
catastrófico — A tem 2 nines, B tem 2 nines, mas combined uptime é 4
nines worse. Plus: CSP allowlist em cada universe, SRI hash, etc.

**Mitigação:** vendoring — cada universe tem cópia local de
`analytics.js` em seus próprios `assets/`. Bumps coordenados via PR
cross-repo (raros).

**Quando aplicar:** qualquer SDK/lib compartilhada entre N sites
independentes. Vendoring vence runtime-loading sempre que A cair não
deve cascatear em B.

**Incident:** discussão CO-181 (rejected). Direção: SDK canonical em
`co/sdk/`, cada universe vendora.

---

## L-013: Refactor de data centralizado vence proliferação de templates

**Anti-pattern (estado pré-Fase 2):** cada `<handle>/index.html` tinha
próprio markup completo (header, footer, bio, fotos). 50+ arquivos
duplicando structure.

**Why broke:** mudar layout exigia editar dezenas de arquivos
manualmente. Inconsistência inevitable; copy-paste introduzia typos
("U<handle>" como title em 21 perfis — `4f84585b`).

**Mitigação:** centraliza em data.js + renderer.js + componentes CSS.
HTML shells viram entry points de 11 linhas. Adicionar/editar dado é
1 lugar; render é 1 lugar.

**Quando aplicar:** qualquer site com >10 páginas que compartilham
estrutura. SPA-style render bate static templates.

**Incident:** `eaf2bc2d` (Fase 2 marco).

---

## L-014: Pricing model precisa stable contract (não shift no UI)

**Anti-pattern:** múltiplas iterações rápidas de pricing model
(flat → horas × taxa → planos → consult → hybrid) com cada change
visível pro cliente atual.

**Why broke:** cliente que viu "Sob demanda" semana passada e "R$ 100/h"
hoje fica confuso. Pricing é parte do contrato.

**Mitigação:**
1. **Itera em data layer, freeze ao publicar.** Mudanças de pricing
   model em PR fechado, não cascade no main.
2. **Histórico documentado.** `docs/precificacao.md` (ou CHANGELOG
   section) descreve o modelo vigente; mudança = release note explícita.
3. **Pre-commit hook** valida que toda entry tem pricing válido antes
   de aceitar.

**Quando aplicar:** qualquer schema-de-contrato (pricing, planos,
políticas) com cliente em fluxo de decisão.

**Incidents:** `bd8246cc`, `3a8e6df6`, `b5745494`, `1b4497a8`,
`432ef82f`, `1f3c7059`.

---

## L-015: GitHub Pages quirks que quebram builds silenciosamente

**Anti-pattern:** assumir que GH Pages serve qualquer estrutura de
arquivos como-está.

**Why broke:**
- GH Pages **roda Jekyll por default**, processa frontmatter+layouts.
  Arquivos com `---` no início somem se não tiver `_config.yml`. Solução:
  `.nojekyll` na raiz.
- GH Pages cache (Fastly) tem TTL de ~10min. Update visível só após
  propagation.
- Trailing slash matter: `/sobre/` vs `/sobre` — comportamento
  diferente; canonical é trailing slash sempre.

**Mitigação:** `.nojekyll` é mandatório. `?v=X` query string pra busting
cache. Toda URL gerada com trailing slash.

**Quando aplicar:** ao iniciar deploy em GH Pages ou ao debugar 404s.

**Incidents:** `2ec6dbf4` (.nojekyll), `c96b33d1` (cache versioning).

---

## L-016: Reverter quando categorização piora UX

**Anti-pattern:** agrupar items por categoria sempre é "melhor".

**Why broke:** ShowAll page com items agrupados em categorias gerou
fricção (usuário tinha que clicar pra expandir cada). Lista plana
alfabética era superior pra esse caso.

**Mitigação:** medir/observar antes de assumir que estrutura é melhora.
"Show all" implica plano; categorização é trade-off explícito.

**Quando aplicar:** todo refactor de UI que adiciona indireção/cliques.

**Incident:** `890870b4` (`revert(showall): volta pra lista plana
alfabética, sem categorias`).

---

## L-017: Faltar copy em estado vazio = página parece bug

**Anti-pattern:** filter retorna 0 resultados → grid fica vazio sem
mensagem.

**Why broke:** usuário não sabe se filtrou demais ou se site quebrou.

**Mitigação:** empty state explícito + CTA de recuperação:
```html
<p class="market-empty" id="market-empty" hidden>
    Nenhum resultado por aqui.
    <a href="/contato/">Entre em contato para encontrarmos uma solução →</a>
</p>
```

**Quando aplicar:** todo grid/lista filtrável.

**Incident:** vários ao longo do desenvolvimento; convenção
estabelecida na Fase 4.

---

## L-018: Mailto não é submit confiável

**Anti-pattern:** form submit que faz `window.location.href = "mailto:..."`.

**Why broke:**
- Mobile sem mail client default → click não faz nada. Lead perdido
  silenciosamente.
- Sem persistência. Email é caixa-preta.
- Sem schema (status, assignee, prioridade).
- Sem dedup.

**Mitigação:** POST pra backend com persistência. Mailto pode ficar
como fallback em caso de network error mas nunca como primário.

**Quando aplicar:** todo form de contato/lead/feedback.

**Incident:** `/contato/` original; AL-4/CO-183 a corrigir.

---

## L-019: Dados pessoais (LGPD) não vivem em arquivos versionados sem
política de retenção

**Anti-pattern:** committar leads ou form submissions diretamente em
arquivos do repo (issues automáticas, JSON em /leads/, etc).

**Why broke:**
- Histórico Git é imutável. Direito de deleção LGPD impossível sem
  rewriting history.
- Repo público (mesmo se private repo, Git history vaza por backup,
  forks, etc).
- Sem retenção automática.

**Mitigação:** dados pessoais em DB com retention policy + IP hashing.
Repo Git só pra dados estruturais (perfis públicos consentidos).

**Quando aplicar:** qualquer entrada de usuário que não seja perfil
público intencional.

**Incident:** decisão de design AL-4 (não armazenar leads em
markdown).

---

## L-020: Over-engineering por antecipação de uso futuro

**Anti-pattern:** projetar pra 5 universes quando só artelonga existe.
"Se um dia precisarmos de quilombo + redearte..."

**Why broke:** complexidade real (multi-universe parameterization,
config explosion, dual allowlists) por benefício hipotético.

**Mitigação:** YAGNI. Hardcode `'artelonga'` quando só existe artelonga.
Quando o segundo universe aparecer, refator pra parameterizar é
barato (string find/replace).

**Quando aplicar:** todo design proposal. Se há 1 client real, não
projete pra N.

**Incident:** discussão CO-177..180 inicial (multi-universe demais);
correção a artelonga-only (2026-05-09).

---

## L-021: Edição direta em arquivo AUTO-GENERATED é silenciosamente sobrescrita

**Anti-pattern:** editar `assets/data.js` entre marcadores
`AUTO-GENERATED:*-START/END` quando há source YAML correspondente
(`<handle>/profile.yaml`, `<handle>/community.yaml`).

**Why broke:** commit `80808b40` editou bio do Mono diretamente em
data.js (~1700 chars). Bake subsequente sobrescreve o bloco com output
regenerado dos YAMLs (que tinham bio vazia) — conteúdo perdido sem
alerta. Resolveu mergear PR #40 manualmente: mover bio pro YAML,
re-bake, commit.

**Mitigação imediata (manual):** mover content pro YAML correspondente,
rodar `npm run bake`, commit.

**Mitigação preventiva (shipped em AL-17):**
- `tools/pre-commit-check.mjs` — snapshot data.js, roda bake, compara
  bytes. Falha exit 1 se drift.
- `.husky/pre-commit` — wira ao git via husky (`npm install` ativa via
  prepare script).
- Mensagem de erro instrui exatamente o que fazer.

**Quando aplicar:** sempre. Hook deve estar ativo em todo dev
environment. CI check é backup.

**Incident:** `80808b40` (Mono bio inline em data.js, 2026-05-10);
resolvido em PR #40 + AL-17.

---

## Convenção de manutenção

- Adicionar entrada em LESSONS.md quando commit `fix:` ou `refactor:`
  ensinou algo generalizável (não trivial, não óbvio).
- Sintaxe: L-NNN, próximo número livre (atualmente 22).
- Não remover entradas. Marcar `~~strikethrough~~` + nota se obsoleta.
- PR template (futuro) pode incluir checkbox "L-NNN adicionada".

## Categorias (cross-reference rápido)

- **Render robustness:** L-001, L-002
- **State derivation:** L-003
- **Copy/UX:** L-004, L-005, L-008, L-016, L-017
- **Coverage audit:** L-007, L-013
- **Format separation:** L-009, L-010
- **Versioning/cache:** L-011, L-015
- **Browser quirks:** L-006
- **Architecture decoupling:** L-012, L-013
- **Persistence/LGPD:** L-018, L-019, L-021
- **Pricing/contract stability:** L-014
- **Scope/YAGNI:** L-020
- **Auto-generated drift:** L-021
