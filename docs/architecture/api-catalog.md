# ArteLonga — API Catalog (Consumer Side)

Audit date: 2026-05-13.

This repo **does not expose** any API of its own (it is a static site). Everything here is a **consumer-side contract** — what the browser-side code calls. The corresponding **producer** is `artelonga/co` (`co.artelonga.com.br`).

---

## 1. Outbound HTTPS — `co.artelonga.com.br`

All calls below use CORS. The shared cookie domain is `.artelonga.com.br`, so a single `al_vid` (analytics visitor ID) and the session cookie (after auth) are visible across `artelonga.com.br` ↔ `co.artelonga.com.br`.

### 1.1 Leads (contact form)

| Field | Value |
|---|---|
| Caller | `contato/index.html` (inline IIFE in `<script>`, lines ~420–470) |
| Method, URL | `POST https://co.artelonga.com.br/api/v1/leads` |
| Triggered by | Form submit on `/contato/?servico=<title>&parceiro=<handle>` |
| Credentials | `omit` |
| Mode | `cors` |
| Headers | `Content-Type: application/json` |
| Request body | `{ nome, email\|null, telefone\|null, mensagem, servico_titulo\|null, parceiro_handle\|null }` |
| Success behavior | `<div.ct-success>` shown; submit button locked to "Enviado ✓" |
| Failure behavior | Build `mailto:rede@artelonga.com.br?…` fallback link, show `<div.ct-fallback>` |
| Privacy notice | Inline copy: "Seus dados são armazenados em servidor seguro por até 24 meses. Direitos LGPD: acesso, correção ou deleção em `rede@artelonga.com.br`." |

### 1.2 Telemetry (every page + interaction)

| Field | Value |
|---|---|
| Caller | `assets/analytics.js` |
| Method, URL | `POST https://co.artelonga.com.br/api/v1/telemetry/events` |
| Triggered by | `page_view` on load; `page_end` on `pagehide`/`visibilitychange:hidden` (via `navigator.sendBeacon`); delegated click handlers for `mailto:`, `tel:`, `wa.me`, `*.pdf`, outbound, in-section, profile, CTA; `scroll_depth` milestones at 25/50/75/100%; `js_error` and `js_promise_rejection` (capped at 20/page); custom events via `window.AL_track(name, props)`. |
| Credentials | `omit` |
| Mode | `cors` |
| Headers | `Content-Type: application/json` |
| Request body | `{ schema: 1, batch: [Event, …] }` where `Event = { s, site, name, sid, vid, ts, tz, path, query, ref, vw, vh, lang, ua_brand, utm, experiments, props }` |
| Batching | Up to 20 events, flushed every 5s; `MAX_QUEUE` 1000 in `localStorage`; exponential backoff up to 60s |
| Resilience | `localStorage` queue survives reloads; `sendBeacon` on pagehide; `keepalive: true` |
| Privacy gate | Skipped entirely if DNT enabled, `window.AL_optout === true`, `localStorage.al_optout === '1'`, cookie `al_optout=1`, OR `navigator.webdriver` / Playwright UA detected |
| Wire contract spec | `docs/analytics-api.md` |

### 1.3 Auth — email magic code (AL-50 signup)

| Field | Value |
|---|---|
| Caller | `assets/al-signup.js` (loaded only on `/faca-parte/`) |
| Method, URL | `POST https://co.artelonga.com.br/api/v1/auth/onboard-with-email` |
| Credentials | `include` |
| Body | `{ email, origin: 'artelonga' }` |
| Success | Reveals code-entry UI, focuses `<input #al-code>`, starts 60s resend cooldown |
| Failure | Shows `#al-signup-error` |

| Field | Value |
|---|---|
| Method, URL | `POST https://co.artelonga.com.br/api/v1/auth/onboard-with-email/verify` |
| Credentials | `include` |
| Body | `{ email, code }` |
| Success | Backend sets session cookie on `.artelonga.com.br`; client redirects to `/` |
| Failure | Shows `#al-verify-error` |

### 1.4 Auth — Google OAuth (AL-50 signup)

| Field | Value |
|---|---|
| Caller | `assets/al-signup.js` button handler |
| Method, URL | `GET https://co.artelonga.com.br/api/v1/auth/google/start?origin=artelonga&return_to=<encoded />` |
| How | Full-page redirect via `window.location.href = …` (not `fetch`) |
| Post-flow | Backend completes OAuth and redirects back to `return_to`; session cookie set on `.artelonga.com.br` |

### 1.5 Auth — session probe

Called on **every page load** (via `SiteHeader` → compiled into `renderer.js`):

| Field | Value |
|---|---|
| Method, URL | `GET https://co.artelonga.com.br/api/v1/auth/me` |
| Credentials | `include` |
| Use | If 200 → render user badge with display name in header; if 401/network error → render "Entrar" link instead |
| Failure mode | Silent — header still renders |

Also called on `/faca-parte/` load to short-circuit signup if user already logged in (`al-signup.js` IIFE at bottom).

### 1.6 Auth — logout

| Field | Value |
|---|---|
| Caller | `SiteHeader` (logout button in user-menu dropdown) |
| Method, URL | `POST https://co.artelonga.com.br/api/v1/auth/logout` |
| Credentials | `include` |
| Failure | `.catch(() => {})` swallowed; UI still reloads |

---

## 2. Outbound — same-origin (`artelonga.com.br`)

### 2.1 Popularity ranking (home page)

| Field | Value |
|---|---|
| Caller | `src/pages/home.ts` |
| Method, URL | `GET /assets/popularity.json` |
| Failure mode | `.catch(() => ({ items: [] }))` — graceful empty state |
| Producer | Hand-maintained file (no bake script seen); used to order partner cards on `/` |

---

## 3. Outbound — third-party deeplinks (`<a href>`, no `fetch`)

No JS is invoked for these — they are anchor clicks. Analytics intercepts them via a delegated `click` listener and emits `click_whatsapp`, `click_outbound`, `click_email`, `click_tel`, `click_pdf` events.

| Destination pattern | Used for | Source |
|---|---|---|
| `https://wa.me/<phone>?text=…` | Member-specific WhatsApp deeplink with prefilled text | `renderer.js` (service detail page) |
| `https://instagram.com/<handle>` | Member Instagram | `renderer.js` (profile / service) |
| `mailto:rede@artelonga.com.br` | LGPD contact, contact-form fallback | inline `contato/index.html`, footer |
| `https://quilomboaraucaria.org`, `https://hedix.com.br`, `https://hfsassociados.com.br`, `https://jacdias.com.br` | Partner community & business sites | `assets/data.js` (`externalUrl`, `site`, bio markdown) |
| `https://www.vatican.va/…rerum-novarum…` | Reference link in member bio (José Antônio) | `assets/data.js` bio markdown |
| `https://brasil.un.org/pt-br/sdgs` | SDG reference | `assets/data.js` citação |
| `https://co.artelonga.com.br/` | Universe viewer deeplink (`/co/artelonga`) | `assets/data.js` solution `externalUrl` |

---

## 4. Third-party SDKs / fonts / analytics

**None.** This is one of the most notable properties of this site:

- No Google Analytics / GTM.
- No Google Fonts (`font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif` — system stack).
- No Facebook pixel, no Hotjar, no Intercom, no Sentry, no CDN-hosted libraries.
- No iframes anywhere in the repo (grep returns zero `<iframe>` tags outside `node_modules/`).
- No service worker.
- No `link rel="preconnect"` to any third-party origin.

The favicon, Open Graph image, and logo are served from the same origin.

---

## 5. Resources fetched at load time (every page)

Triggered by `assets/bootstrap.js` for **every shell HTML**:

| URL | Type | Versioned? | Cache |
|---|---|---|---|
| `/assets/site.css?v=<V>` | CSS link | ✅ | aggressive on hash, but no real hash — relies on `?v=` bump |
| `/assets/components.css?v=<V>` | CSS link | ✅ | same |
| `/assets/pages.css?v=<V>` | CSS link | ✅ | same |
| `/assets/analytics.js?v=<V>` | script (async=false, runs first) | ✅ | same |
| `/assets/data.js?v=<V>` | script (async=false) | ✅ | same |
| `/assets/renderer.js?v=<V>` | script (async=false) | ✅ | same |
| `/assets/bootstrap.js` itself | script | **❌** | Default GitHub Pages cache (~10min) — deliberate trade-off so a single `V` bump invalidates everything downstream |

Plus per-page assets:
- `/assets/favicon*.png`, `/assets/favicon.ico`, `/assets/apple-touch-icon.png` — branding.
- `/logo-al.png` — header logo.
- `/<handle>/<handle>.jpg` — per-profile avatar (loaded by `ProfileCard` when on a profile page).
- `/assets/popularity.json` — only on home page (`src/pages/home.ts`).
- `/assets/og-default.png` — referenced by `seo.ts` for Open Graph fallback.

---

## 6. Consumer-side contract summary

If `co.artelonga.com.br` changes any of the following, **this site breaks silently** (or shows a fallback):

| Producer change | Effect on this site |
|---|---|
| `POST /api/v1/leads` request schema | Contact form shows `mailto:` fallback (graceful) |
| `POST /api/v1/leads` response status ≠ 2xx | Same — `mailto:` fallback |
| `POST /api/v1/telemetry/events` rejects schema 1 | Events stay queued in `localStorage`, retry with backoff up to 60s, eventually drop oldest at MAX_QUEUE=1000 (silent) |
| `GET /api/v1/auth/me` removed or moved | Header user badge breaks; falls back to "Entrar" link (graceful) |
| `POST /api/v1/auth/onboard-with-email/verify` schema | `/faca-parte/` flow fails with generic error |
| `GET /api/v1/auth/google/start` removed | Google button on `/faca-parte/` does a hard redirect to a 404 |
| Cookie domain stops being `.artelonga.com.br` | Cross-subdomain `al_vid` threading breaks (analytics still works, just no cross-domain identity) |

There is **no version negotiation** — every call hardcodes `/api/v1/…`. There is **no client-side OpenAPI consumed** (the `openapi/artelonga.yaml` here describes content shapes, not the `co` API).

---

## 7. What's missing from this catalog (good signals)

- No webhooks consumed.
- No WebSocket / SSE.
- No CRDT / collaborative editing on this site (lives in `co`'s viewer at `/co/artelonga`).
- No Stripe / payment integration.
- No outbound to `quilomboaraucaria` API even though Quilombo is a partner community.
- No CMS — content is YAML in the repo, baked at commit time.
