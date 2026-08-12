# ArteLonga as Infrastructure-as-a-Service — static universes on GitHub Pages

Migration plan: turn ArteLonga from **N per-universe Fly apps** into a **static
hosting substrate** — each universe served free via GitHub Pages, with a single
shared self-hosted sink for the only dynamic bits (first-party telemetry +
feedback). Public, AGPL, guarded by the `secure-publish` gate. **No Cloudflare.**

> Status: plan for review. Prereq met: the `secure-publish` gate is live (#95).
> Gating order: gitleaks history scan → add AGPL `LICENSE` → make public → migrate.

## 1. The vision

Adding a universe becomes: **a folder/repo + a DNS entry + a telemetry key — zero servers.**

```
Pages (free, CDN)                         one shared self-hosted sink
─────────────────                         ──────────────────────────
artelonga.com.br        (apex, monorepo)  ┐
yuri.artelonga.com.br   (static)          ├─ beacon → POST /api/v1/telemetry
neuro.artelonga.com.br  (static)          │         + feedback, keyed by universe
…                                          ┘         (one server for ALL universes)
```

## 2. Current state (what we migrate from)

`deploy/domains.yaml` (production):

| Surface | Host today | Why it's a server |
|---|---|---|
| `artelonga.com.br` (apex) | **GitHub Pages** (whole repo) | already static ✅ |
| `yuri`, `neuro`, `hostinger`, `retroumarizal` | **Fly app each** | first-party telemetry + feedback to a durable volume |
| `comunicacao` | Fly (iframe → yggdrasil) | dynamic; out of scope |

So today every universe runs its own Fly app **mostly to serve static content** — the only genuinely dynamic part is the in-house analytics + feedback (the "zero third parties" story the portfolio sells: ≈690 visitors/mo, ~1,800 events).

## 3. Two sub-problems

### 3a. Subdomain → static content, without Cloudflare

GitHub Pages serves **one custom domain per repo**. So a subdomain can't CNAME to a *path* on the apex site. Two viable shapes (choose per universe):

- **(A) Per-universe Pages repo** ⭐ — each universe is its own repo with Pages enabled, a `CNAME` file = `<u>.artelonga.com.br`, and DNS `CNAME <u> → <owner>.github.io`. Subdomain URL preserved, fully static, no proxy. (`yuri-portfolio` already exists — just switch Fly → Pages.) Each repo carries its own AGPL `LICENSE` (clean for ownership moves, §6).
- **(B) Monorepo path + redirect** — `artelonga.com.br/<u>/` is the canonical static path; `<u>.artelonga.com.br` is a 301 redirect (registrar URL-forward, or a 2-line redirect repo with the subdomain's `CNAME`). Path is the real URL; lightest weight.

**Recommendation:** (A) for first-class universes (own repo, own subdomain, own AGPL license); (B) for sub-surfaces like `hostinger` that are just a path under another universe.

### 3b. The dynamic bit: one shared telemetry + feedback sink

Don't lose the in-house analytics. Collapse **N per-universe backends → one shared sink**, keyed by universe — exactly the model in [`co/docs/telemetry-per-universe.md`](../../co/docs/telemetry-per-universe.md):

- One small server (a single Fly app, or co-web itself) exposes `POST /api/v1/telemetry` + a feedback endpoint, partitioned by `universe`.
- Each static page beacons to it (a few lines of JS; the `feedback.js`/analytics already present, repointed from per-app to the shared URL).
- Net: the privacy/"zero third parties" story is intact, on **1** server instead of N.

## 4. Migration recipe (per universe) — `yuri` first

1. **Pages-ify** the universe repo (`yuri-portfolio`): enable GitHub Pages (branch `main`, root), add a `CNAME` file = `yuri.artelonga.com.br`.
2. **Repoint the dynamic JS** (analytics + `feedback.js`) at the shared sink, with `universe=yuri`.
3. **DNS cutover:** change the `yuri` record `CNAME yuri → artelonga-yuri.fly.dev` → `CNAME yuri → <owner>.github.io`. Wait for the Pages TLS cert.
4. **Verify** the live subdomain serves the static site and that telemetry/feedback reach the shared sink.
5. **Retire** the Fly app: `fly apps destroy artelonga-yuri` (only after the subdomain is confirmed on Pages).
6. **Update `deploy/domains.yaml`:** `host: github-pages`, note the migration.

Repeat for `neuro`, `hostinger` (path/redirect), etc. `comunicacao` (iframe→yggdrasil) and `co` stay dynamic — they're real apps, not static.

## 5. Generalize — the IaaS recipe

> New universe = repo (or `/u` folder) + Pages + `CNAME` + DNS + telemetry key.

- `deploy/domains.yaml` stays the registry of universe ↔ host ↔ surface (the source of truth/audit).
- One shared sink serves every universe's analytics/feedback.
- Cost: from *N Fly machines* → *Pages (free) + 1 sink*.

## 6. Public + AGPL + compliance (the included test suite)

The repos go public under **AGPL-3.0**. Compliance is enforced *in-repo*, deterministically:

- **`secure-publish` is the free-software compliance test suite** (`tools/secure-publish.mjs`, AGPL): pre-commit/pre-push block secrets + sensitive files from the public remote; `secure:status` is the live staging review; `secure:audit` scans history. It is a **deterministic, repo-included test** — runnable by anyone, anywhere.
- **`gitleaks detect`** complements it for an exhaustive one-time history *content* sweep before flipping visibility.
- **Account-wide extension:** the same checks run across every repo in an account (the `artelonga` org **and** the `yurisugano` personal account) via a CI/cron that asserts, per repo: (a) no secrets in tree or history, (b) a `LICENSE` present and **AGPL**, (c) SPDX headers where applicable.
- **Ownership-transfer compliance:** AGPL is copyleft — conveying a copy (e.g. moving a repo `artelonga → yurisugano`) **must keep it AGPL** and keep source available (AGPL §10 *no further restrictions*, §13 network use). Because the compliance test asserts the AGPL `LICENSE` + headers persist, a transfer stays compliant **by construction** — the test fails if AGPL is dropped. Licensing itself (adding the `LICENSE` + headers + the license-presence check) lands **after** this review + the gitleaks pass.

## 7. Trade-offs & constraints

- **Pages:** one custom domain per repo (→ per-universe repos or redirects); soft size/bandwidth limits; static only. Fine for these content sites.
- **Anything dynamic stays off Pages:** telemetry/feedback (→ shared sink), the `co` board, yggdrasil iframes. Don't try to Pages-ify `co`/`comunicacao`.
- **DNS cutover:** brief propagation + cert issuance; keep the Fly app until Pages is verified, then destroy.
- **Durable telemetry data:** the per-app Fly volumes hold historical events — export/merge into the shared sink before destroying the apps, or accept a clean cut.

## 8. Sequence

1. ✅ `secure-publish` gate in place (#95).
2. ▶ `gitleaks detect` on each repo → fix any findings.
3. Add AGPL `LICENSE` (+ SPDX headers) + a license-presence check in `secure-publish`.
4. Make repos public.
5. Migrate `yuri` (recipe §4); stand up the shared telemetry/feedback sink.
6. Migrate remaining static universes; retire their Fly apps.
7. Account-wide compliance CI (secrets + AGPL retention) across `artelonga` + `yurisugano`.
