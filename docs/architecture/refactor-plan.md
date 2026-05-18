# ArteLonga — Refactor Plan (Gap Analysis vs Seven Principles)

Audit date: 2026-05-13. Highest existing AL ID: **AL-50**. New IDs proposed below start at **AL-51**.

This is an **audit, not a refactor**. No code was changed. Priorities are P1 (do soon), P2 (worth doing), P3 (cosmetic / nice-to-have).

---

## Principle scorecard

| # | Principle | Score | One-liner |
|---|---|---|---|
| 1 | Composition over inheritance | **Good** | TS components in `src/components/` are pure functions returning HTML strings — no classes, no inheritance |
| 2 | Single responsibility | **Mixed** | `src/pages/` is clean; `assets/data.js` (3372 lines) and `assets/renderer.js` (1875 lines) mix many concerns; `contato/index.html` is a 484-line monolith |
| 3 | Static typing | **Mixed** | `src/` is fully TS-strict; the 3 critical runtime JS files (`analytics.js`, `al-signup.js`, `bootstrap.js`) and `contato/` inline script are vanilla JS |
| 4 | Reduced coupling | **Mixed** | Member ↔ Service ↔ Community cross-refs go through string handles audited by `tools/audit-handles.mjs`; but `data.js` is a single global `window.AL` shared mutably across all pages |
| 5 | Segregated state | **Weak** | `al_vid`, `al_sid`, `al_optout`, `al_evq_v1`, `al_utm` live in `localStorage`/`sessionStorage`/cookie with no central registry; `window.AL` is a global; contact-form state lives in DOM only |
| 6 | Folders encapsulate features | **Strong (owner-first)** | One folder per owner (`yuri/`, `quilomboaraucaria/`) — correct per LGPD (L-009, AL-1). Cross-cutting pages (`servicos/`, `solucoes/`) are flat slug dirs |
| 7 | Event-driven where signals matter | **Weak** | Contact-form submit → POST `/leads` is fire-and-forget, no telemetry event correlating "lead submitted"; analytics tracks clicks but **does not** emit a `lead_submit` or `signup_complete` event |

---

## Gaps & proposed tasks (ordered by priority)

### P1 — Do soon

#### AL-51 — Emit funnel events for lead + signup

- **Principle:** #7 Event-driven where signals matter
- **Scope:** In `contato/index.html` inline script and `assets/al-signup.js`, call `window.AL_track('lead_submit', {servico, parceiro, channel})` on successful POST, and `lead_submit_failed` on the catch branch. In `al-signup.js`, emit `signup_request`, `signup_verify_success`, `signup_verify_failed`, `signup_google_start`.
- **Acceptance:**
  - Each of the 6 events emitted exactly once per user action.
  - Events appear in `co`'s `telemetry/events` table.
  - No-op when `AL_track` is undefined (analytics opt-out / DNT).
  - Playwright test asserts `window.AL_track` was called with expected name+props.
- **Blast radius:** Low. Add-only. Both forms have fallback paths that already swallow errors.
- **Priority rationale:** Funnel attribution is the whole point of self-hosted analytics. Today we have impressions but no conversion signal — can't compute lead conversion rate or signup completion rate.

#### AL-52 — Extract `contato/index.html` script + critical CSS into shared files

- **Principle:** #2 Single responsibility, #3 Static typing
- **Scope:** Move the 250-line inlined CSS in `contato/index.html` into `assets/pages.css` under a `.contato-*` namespace. Move the 120-line inline `<script>` into `src/pages/contato.ts` and wire via `data-page="contato"` in the dispatcher. Keep one inlined fallback rule to prevent the documented CLS, but trim from 250 lines to ~15 (just `body { padding-bottom }` and `.site-footer { position: fixed }`).
- **Acceptance:**
  - `/contato/` renders with identical layout (visual regression via Playwright screenshot).
  - No CLS regression in Lighthouse CI (CLS < 0.1 holds).
  - File `contato/index.html` ≤ 30 lines.
  - Inline script removed; logic lives in `src/pages/contato.ts`, typed against `Lead` interface in `src/types.ts`.
  - Form submission emits AL-51 events.
- **Blast radius:** Medium — contact form is a revenue surface. Must screenshot-test.
- **Priority rationale:** This is the only page that breaks the "shells ≤ 15 lines" architecture and the only critical JS that isn't TS. Same fix removes both gaps.

#### AL-53 — Centralize storage keys and namespacing

- **Principle:** #5 Segregated state
- **Scope:** Create `src/lib/storage.ts` exporting typed wrappers `vid()`, `sid()`, `optOut()`, `utm()`, `eventQueue()`, etc. — one module owns all `al_*` keys. `analytics.js` keeps its own copy (can't import TS from vanilla IIFE) but the key list lives in a `src/lib/storage-keys.ts` const referenced by build-time test.
- **Acceptance:**
  - All reads/writes of `al_vid`/`al_sid`/`al_optout`/`al_evq_v1`/`al_utm` go through one of: (a) the new `storage.ts` (from TS), or (b) the constants block in `analytics.js`.
  - Audit script `tools/audit-storage-keys.mjs` greps for hard-coded keys outside those two files; fails CI if any.
  - No behavioral change.
- **Blast radius:** Low. Pure refactor.
- **Priority rationale:** Today, adding a new storage key means grep-and-pray. Two existing key drifts already happened (the comment "Migration: drop pre-v1 queue" at `analytics.js:115` documents one).

---

### P2 — Worth doing

#### AL-54 — Split `assets/data.js` into per-collection modules

- **Principle:** #2 Single responsibility, #4 Reduced coupling
- **Scope:** Today `data.js` exports `window.AL` containing 8+ collections. Split into `data.people.js`, `data.communities.js`, `data.services.js`, `data.missions.js`, `data.solutions.js`, `data.finances.js`, `data.portfolio.js`, `data.popularity.js` — `bootstrap.js` injects only the ones the current `data-page` needs (or all of them, with HTTP/2 multiplexing they're free). Pages get smaller bundles.
- **Acceptance:**
  - `window.AL` API surface unchanged (combined at runtime from modules).
  - Pages load only what they read (per matrix in `as-is.md`).
  - Total transfer for `/` drops below previous baseline (Lighthouse byte budget verifies).
  - All bake scripts updated to write to per-collection files.
- **Blast radius:** Medium — touches every bake script + bootstrap. Mitigation: keep the combined `data.js` as a transitional shim that re-exports from the new files.
- **Priority rationale:** 3372 lines in one file is unreadable in PR review. Splitting also opens the door to lazy-loading on profile pages (only need `people` + maybe the one profile's services).

#### AL-55 — OpenAPI codegen for `src/types.ts`

- **Principle:** #3 Static typing, #4 Reduced coupling
- **Scope:** Add `openapi-typescript` devDep. `npm run gen-types` produces `src/types.gen.ts`. Replace hand-mirrored `src/types.ts` with a re-export from the generated file (or delete entirely, importing from `src/types.gen.ts`).
- **Acceptance:**
  - `tsc --noEmit` passes against generated types.
  - Hand-written `src/types.ts` removed or reduced to UI-only types not in the OpenAPI.
  - `npm run gen-types` is part of `npm run bake`.
  - Pre-commit hook checks `types.gen.ts` is in sync with `openapi/artelonga.yaml`.
- **Blast radius:** Low — types only, no runtime change.
- **Priority rationale:** Already on the CLAUDE.md TODO list ("ou regenerar do openapi quando tivermos openapi-typescript"). Eliminates a known drift surface.

#### AL-56 — Migrate `analytics.js` and `al-signup.js` to TypeScript

- **Principle:** #3 Static typing
- **Scope:** Move both files into `src/runtime/` as TS, compile to `assets/analytics.js` and `assets/al-signup.js` via the same Vite config (or a sibling config). Type the public APIs (`window.AL_track`, `window.AL_experiments.variant`, `window.AL_analytics.info`, etc.) into a `src/runtime/types.ts` that's also imported from page code.
- **Acceptance:**
  - Both files produced by build, behavior unchanged.
  - `window.AL_track` and `window.AL_analytics` typed in `src/types.ts` so pages get autocomplete.
  - All existing analytics test scenarios pass (DNT, opt-out, batching, beacon on pagehide).
- **Blast radius:** Medium — analytics is load-bearing for the entire telemetry pipeline. Mitigation: snapshot the compiled output before/after and diff for behavioral equivalence.
- **Priority rationale:** These two are the largest vanilla-JS files left after AL-22. Once typed, AL-53 becomes trivial.

#### AL-57 — Backlink index + reverse-reference data

- **Principle:** #4 Reduced coupling (in the sense of *making coupling explicit*)
- **Scope:** Today `audit-handles.mjs` walks forward references (service.responsavel, citacoes.autor, communities, parcerias, etc.). Add a `tools/bake-backlinks.mjs` that produces `assets/backlinks.json`: for each handle, list every entry that references it. Render a "Mencionado em" section on profile pages.
- **Acceptance:**
  - `backlinks.json` regenerated on every bake.
  - Profile pages render up to N backlinks under a collapsible.
  - Schema for backlink entry in OpenAPI.
- **Blast radius:** Low. Add-only.
- **Priority rationale:** Wikilink-style backlinks are mentioned in the prompt's principle 4. The forward graph already exists; reverse is one bake away.

---

### P3 — Cosmetic / nice-to-have

#### AL-58 — Replace inline `<style>` blocks in `entrar/index.html` and `faca-parte/index.html`

- **Principle:** #2 Single responsibility
- **Scope:** Same treatment as AL-52 for the two other pages that ship inline styles. Inline blocks are smaller than `contato/`, so risk is lower.
- **Acceptance:** Both shells ≤ 30 lines; styles moved to `pages.css` under `.entrar-*` and `.fp-*` namespaces.
- **Blast radius:** Low.
- **Priority rationale:** Consistency only — the AL-52 fix could be the template for these.

#### AL-59 — Folder-level feature manifests

- **Principle:** #6 Folders encapsulate features
- **Scope:** Add a `_feature.yaml` (optional) per cross-cutting folder (`servicos/`, `solucoes/`, `missoes/`) declaring: the OpenAPI schema this folder's entries conform to, the bake script that targets it, the page renderer that consumes it. Today this knowledge is implicit (spread across CLAUDE.md sections).
- **Acceptance:** Three folder manifests; CLAUDE.md regenerated from them; new "add a `<thing>`" instructions discoverable by reading `<folder>/_feature.yaml`.
- **Blast radius:** Trivial. Docs only.
- **Priority rationale:** Onboarding cost. Currently a contributor must read 250+ lines of CLAUDE.md to add a new service.

#### AL-60 — Remove `dist/showcase.js` from the repo

- **Principle:** #2 Single responsibility (deploy artifact vs source)
- **Scope:** `dist/showcase.js` is a Vite build artifact used only by `/design/`. Move out of the deploy path or build on demand. Today it's committed and served.
- **Acceptance:** `dist/` in `.gitignore`; `/design/` either omitted from production or built into `assets/` like `renderer.js`.
- **Blast radius:** Trivial.
- **Priority rationale:** Tidiness. `/design/` is `noindex,nofollow` anyway.

---

## What's already good (no action needed)

- **AL-1 / AL-2** correctly extracted owner data into per-handle YAML. LGPD principle (L-009) preserved by folder layout.
- **AL-13** centralized asset loading. Single `V` bump invalidates everything.
- **AL-17** pre-commit hook prevents `data.js` drift (L-021 mitigation).
- **AL-44** quality CI: Playwright + axe + Lighthouse on every PR.
- **Composition** of `src/components/` is exemplary: pure functions, no classes, no inheritance hierarchy. Don't refactor.
- **Privacy gate** in `analytics.js` (DNT, opt-out, webdriver detection) is thorough and tested.
- **OpenAPI** as source of truth is in place; AL-55 just closes the codegen gap.

---

## Summary by priority

| Priority | Tasks | Rough scope |
|---|---|---|
| P1 | AL-51, AL-52, AL-53 | ~2-4 days each; total ~1.5 weeks |
| P2 | AL-54, AL-55, AL-56, AL-57 | ~3-5 days each; total ~3 weeks |
| P3 | AL-58, AL-59, AL-60 | ~0.5-1 day each |

**Recommended first ship:** AL-51 (funnel events) + AL-53 (storage keys) bundled into one PR. Both are additive, both unblock measurement, total ~3 days.
