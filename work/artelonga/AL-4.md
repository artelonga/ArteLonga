---
id: 4
title: "/contato/ persiste leads no co backend (substituir mailto)"
type: user-story
status: done
priority: high
labels:
  - feat
  - ticketing
  - lead
  - lgpd
module: contato
created_at: 2026-05-10T00:00:00Z
updated_at: 2026-05-10T20:43:41.967453+00:00
---

GIVEN o form de `/contato/` hoje (`contato/index.html:365`) usa `mailto:`
pra submissão (abre cliente de email do usuário, manda pra
`rede@artelonga.com.br`), AND essa abordagem (a) falha em mobile sem
cliente de email configurado, (b) não persiste leads em formato
queryable, (c) não tem schema (status, assignee, prioridade), (d) não
permite dedup ou histórico, (e) não converte naturalmente em AL-tasks
quando o lead vira projeto,

WHEN substituímos o `mailto:` por POST pra `co.artelonga.com.br/api/v1/leads`
(novo endpoint, ver task CO-N pareada), AND o admin (yuri) tem
visibilidade em `/admin/leads` no co (fila + filtros + notes + status
machine), AND leads que viram projetos podem ser **promoted** pra
`AL-N.md` task,

THEN nenhum lead é perdido (mesmo em mobile sem mail client), AND a
fila de leads é queryable (status, data, sócio assignado), AND o fluxo
end-to-end (submissão → triage → assignment → close → promoção) tem
mental model de ticketing limpo.

---

## Estado atual

`contato/index.html:335-368`:

```js
form.addEventListener("submit", e => {
    e.preventDefault();
    // ... extract fields ...
    const mailto = `mailto:rede@artelonga.com.br?subject=${...}&body=${...}`;
    window.location.href = mailto;
    form.querySelector(".ct-submit").textContent = "Enviado ✓";
});
```

URL params suportados:
- `?servico=X` — serviço de origem (pré-preenche contexto)
- `?parceiro=Y` — parceiro de origem (idem)

Esses params já viram contexto na mensagem.

## Comparação com alternativas (sumário)

Revisei OSS ticketing systems (Plane, Zammad, OSTicket, Freescout,
Tickety, GLPI). Pra o volume atual da Arte Longa (presumivelmente <50
leads/mês), todos são overkill. Custom no `co` backend reusa SQLite +
admin auth + dashboard pattern (CO-105) com setup de ~1 dia. Mantém
ecosystem coeso e permite promoção lead→AL.

## Implementação

### Phase 1: Backend (CO-task pareada)

Criar `CO-N` no `~/projects/co/work/co/` (esse ticket lista como
prerequisito):
- Migration: tabela `leads` (schema na seção abaixo).
- POST `/api/v1/leads` — valida payload, insere, dispara email
  notification pra `rede@artelonga.com.br`.
- GET `/api/v1/admin/leads?status=...&since=...` — admin-only.
- PATCH `/api/v1/admin/leads/:id` — update status/assignee/notes.
- Static admin page `/admin/leads.html` (mesmo padrão de
  `/admin/dashboard`).

Schema:

```sql
CREATE TABLE leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    nome TEXT,
    email TEXT,
    telefone TEXT,
    mensagem TEXT NOT NULL,
    servico_titulo TEXT,
    parceiro_handle TEXT,
    status TEXT NOT NULL DEFAULT 'new',
    priority TEXT DEFAULT 'normal',
    assignee_handle TEXT,
    notes TEXT,
    closed_reason TEXT,
    promoted_to_al INTEGER,
    ip_hash TEXT,                          -- daily-salt hash, mesmo padrão de telemetry
    user_agent TEXT
);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_leads_assignee ON leads(assignee_handle);
```

### Phase 2: Frontend (esse ticket)

Substituir o `mailto:` por POST:

```js
form.addEventListener("submit", async e => {
    e.preventDefault();
    const submit = form.querySelector(".ct-submit");
    submit.disabled = true;
    submit.textContent = "Enviando…";
    try {
        const payload = {
            nome: form.nome.value.trim(),
            email: form.email.value.trim(),
            telefone: form.telefone.value.trim(),
            mensagem: form.mensagem.value.trim(),
            servico_titulo: getQueryParam("servico") || null,
            parceiro_handle: getQueryParam("parceiro") || null,
        };
        const r = await fetch("https://co.artelonga.com.br/api/v1/leads", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            credentials: "omit",
            mode: "cors"
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        submit.textContent = "Enviado ✓";
        form.classList.add("is-sent");
    } catch (err) {
        console.error("submit failed:", err);
        submit.textContent = "Falhou — tente de novo";
        submit.disabled = false;
        // Fallback: oferece mailto como recuperação
        showMailtoFallback();
    }
});
```

### Phase 3: Fallback graceful

Se o POST falhar (network, CORS, downtime do `co`), oferecer link
`mailto:` como fallback visível — não perder o lead.

### Phase 4: LGPD

- IP hash (daily salt, mesmo padrão de `co/telemetry.rs:hash_ip_daily`).
- Retenção: 24 meses (review com legal). Hard delete script
  `tools/lgpd-delete-lead.mjs <id>` no `co` repo.
- Privacy notice no form: "Seus dados são armazenados em SQLite no
  servidor co.artelonga.com.br por até 24 meses. Direitos LGPD: peça
  acesso/correção/deleção em rede@artelonga.com.br."

### Phase 5: Promoção lead → AL-task

CLI helper (script `tools/promote-lead.mjs <lead-id>`) que:
1. Lê o lead via API.
2. Cria `work/artelonga/AL-N.md` com frontmatter pré-populado:
   - `title` = derivado de `mensagem` (primeira linha ou tagline).
   - `priority` = lead.priority.
   - corpo: GIVEN/WHEN/THEN template + transcript da mensagem.
3. Chama PATCH `/api/v1/admin/leads/:id` setando `promoted_to_al = N`.

Out of scope desse ticket — fica como AL-5 ou nota de followup.

## Critérios de aceitação

- [ ] CO-N (backend) está done — endpoint `POST /api/v1/leads` aceita
      payload, persiste em `leads`, dispara email notification.
- [ ] `/contato/` form posta pro endpoint em vez de `mailto:`.
- [ ] Submissão bem-sucedida → button mostra "Enviado ✓".
- [ ] Submissão com falha de network → button mostra fallback +
      oferece `mailto:` como recuperação.
- [ ] Privacy notice visível antes do submit.
- [ ] Admin (yuri) consegue ver fila em `co.artelonga.com.br/admin/leads`
      (verificação manual).
- [ ] Lead criado tem `created_at`, `status='new'`, `ip_hash` populado.
- [ ] V bumpado em `bootstrap.js`.
- [ ] CHANGELOG entry sob [Unreleased].

## Out of scope

- Promoção lead → AL-task (Phase 5) — futuro AL.
- Customer-facing public status page (lead vê próprio status via link
  com token) — futuro se demand justificar.
- SLA tracking — não há SLA definido.
- Tags / custom fields — adicionar quando volume justificar.
- Webhook integration (Slack, Discord) — não há canal hoje.
- Migração de leads históricos (zero leads persistidos hoje, nada a migrar).

## Notas

- **Comparação OSS:** Plane/Zammad/OSTicket revisados. Custom em `co`
  é apropriado pro volume atual (presumido <50 leads/mês). Re-avaliar
  se volume passar de 200/mês ou se requerimentos crescer
  (multi-tenant, SLA, integration ecosystem).
- **Mental model = ticketing.** Mesmo sendo custom, semântica é de
  ticket: status state machine (new → triaged → in_progress → closed),
  assignee, priority, notes histórico.
- **Conversão pra AL- task** é o end-game — leads que viram projetos
  ganham AL-N e o original é arquivado com `promoted_to_al = N`.
  Mantém leads no leads, projetos no AL-, com link.

## Related

- CO-N (a criar) — backend endpoint + admin page. Prerequisito.
- AL-3 — memory system (lições gerais; esse aplica princípio
  "separar content de form" pra leads).
- `contato/index.html:335-368` — código atual do submit.
- `assets/renderer.js:1599` — geração de URL de contato com
  `?servico=X&parceiro=Y` (preservar).
