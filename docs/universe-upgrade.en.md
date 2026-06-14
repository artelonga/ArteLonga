# Universe upgrade — path → CNAME surface (reproducible runbook)

How to promote a **universe** served as a **path on the apex** (`artelonga.com.br/user/`)
to its **own surface on a CNAME** (`user.artelonga.com.br`), **without losing
observability or breaking the time series**. Principle (**recursive / fractal**
universes — the same unit at any scale, no "sub"): a nested universe promotes to a
surface frictionlessly, stays the same universe (same key, history, changelog,
analytics) and becomes the **owner of its own state**.

Worked example throughout the doc: **user** (`handle=user`, app `artelonga-user`,
host `user.artelonga.com.br`). Swap `user`/`artelonga-user`/the host for your own.

> Prerequisites: `fly` authenticated (`fly auth whoami`), DNS access on
> **Hostinger** (registrar of `artelonga.com.br`), repo cloned, universe content
> already in `<handle>/` with a servable `index.html` at the root of the surface.

---

## Overview (what changes)

| | Before (path) | After (CNAME surface) |
|---|---|---|
| URL | `artelonga.com.br/user/` | `user.artelonga.com.br` |
| Server | GH Pages (apex) | `tools/surfaces-server.mjs` on a Fly app |
| Telemetry | co (rich) | **universe-owned** (local NDJSON, at parity — geo/retention/timeseries/conversions/acquisition) |
| Source of truth | `telemetry_events` in co | `/data/telemetry-<handle>.jsonl` on the surface |

Continuity has 3 parts, all covered below: **series** (backfill), **identity**
(`al_vid` in the apex cookie), **capability** (the surface is already at parity — see
`telemetry-surfaces.md`).

---

## Step by step

### 1. Servable content at the root of the surface

The surface serves `SURFACE` (e.g. `/user/`) at the root `/`. The HTML uses absolute
paths `/user/*`, so only `/` is mapped to the surface's `index.html`; everything else
serves the file directly. Make sure `<handle>/index.html` exists and loads the
telemetry + feedback beacon:

```html
<script src="/user/telemetry.js?v=YYYYMMDDx" defer></script>
<script src="/user/feedback.js?v=YYYYMMDDx" defer></script>
```

### 2. Register the surface in the deploy tooling

Add the entry in `tools/deploy-surface.mjs` (`SURFACES`) and create the toml:

```js
// tools/deploy-surface.mjs → SURFACES
<handle>: {
  server: "tools/surfaces-server.mjs",
  env: { SURFACE: "/<handle>/", FEEDBACK_UNIVERSE: "<handle>" },
  config: "deploy/surfaces/<handle>.toml", dockerfile: "deploy/surfaces/Dockerfile",
  expect: ["<string única do index>", "feedback.js", "</html>"]   // smoke check pré-deploy
}
```

`deploy/surfaces/<handle>.toml` (copy from `deploy/surfaces/user.toml`):

```toml
app = "artelonga-<handle>"
primary_region = "gru"
[env]
  SURFACE = "/<handle>/"
  FEEDBACK_UNIVERSE = "<handle>"
  TELEMETRY_DIR = "/data"
  TELEMETRY_DURABLE = "1"
  SIBLINGS = ""                       # URLs de surfaces irmãs da MESMA universe (agregação)
[[mounts]]
  source = "tele"
  destination = "/data"
[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = "stop"         # dorme quando ocioso; auto-starta no request
  auto_start_machines = true
  min_machines_running = 0
[[vm]]
  size = "shared-cpu-1x"
  memory = "256mb"
```

> The `Dockerfile` (`deploy/surfaces/Dockerfile`) already copies `tools/surfaces-server.mjs`
> + `user/` — so the geo reader and the `user/geo/ip{4,6}-country.bin` binaries
> go along with it. Nothing to change here.

### 3. Create the Fly app + durable volume + deploy

From the repo root (real user values as an example):

```bash
fly apps create artelonga-<handle>
fly volumes create tele --region gru --size 1 --app artelonga-<handle> --yes   # NDJSON durável em /data
node tools/deploy-surface.mjs <handle>        # smoke check local (health, strings) → fly deploy --remote-only --ha=false
```

`deploy-surface.mjs` brings up the local server, validates `/api/health`, `/` and the
`expect` strings (and the absence of an L-002 fallback) **before** deploying. If the
smoke check fails → deploy aborted.

### 4. Certificate + DNS (CNAME on Hostinger)

```bash
fly certs add <handle>.artelonga.com.br --app artelonga-<handle>   # mostra o alvo do CNAME
```

In the **Hostinger** DNS, create the record the command indicated:

```
CNAME   <handle>   artelonga-<handle>.fly.dev.
```

Wait for issuance (`fly certs show <handle>.artelonga.com.br --app artelonga-<handle>`
→ `Status: Issued`). For user: cert **Issued** (Fly-managed), IPs `dedicated v6`
+ `shared v4` — Fly handles this when you add the cert.

### 5. Telemetry continuity (Option C)

1. **Identity — already automatic.** The `al_vid` lives in a cookie on the **apex
   `.artelonga.com.br`** (see `telemetry-surfaces.md §5`), so the same visitor
   crosses `artelonga.com.br/<handle>/` → `<handle>.artelonga.com.br` without becoming
   "new". The surface's `telemetry.js` reads that cookie first. Nothing to do.
2. **Backfill of the series.** Export the pre-cutover history from co and roll it into
   the daily series under `universe=<handle>`:

   ```bash
   # marca o cutover
   T=$(date -u +%Y-%m-%dT%H:%M:%SZ)
   # exporta eventos /<handle>/* do co (auth admin) → rollup diário keyed by universe
   curl -H "Authorization: Bearer $CO_TOKEN" \
     "https://co.artelonga.com.br/api/v1/admin/telemetry/export?path_prefix=/<handle>/&until=$T"
   ```
   (The co half — rollup ingest per universe — is the follow-up tracked in
   `telemetry-surfaces.md §3`. Until then the history stays readable via the apex
   dashboard; the surface starts the new series from the cutover.)
3. **New rollups.** The surface emits consented daily rollups (no PII) keyed
   by `universe=<handle>` — same key path↔CNAME, so the series has no break.

### 6. Redirect the old path (avoids fragmenting)

So that `/<handle>/` on the apex does not compete with the surface in the network's
analytics, 301-redirect the old path to the CNAME (GH Pages: meta-refresh/redirect in
the apex's `<handle>/index.html`, or a redirect rule). That way all new traffic lands
on the surface and attribution stays clean.

---

## Verification checklist (reproducible)

```bash
H=<handle>.artelonga.com.br
# 1. surface no ar + estática
curl -s https://$H/api/health                      # {"ok":true,"surface":"/<handle>/",...}
curl -s -o /dev/null -w "%{http_code}\n" https://$H/   # 200

# 2. telemetria à paridade (schema novo servido)
curl -s https://$H/api/telemetry | python3 -c "import sys,json;d=json.load(sys.stdin);print('keys',sorted(d));assert all(k in d for k in('timeseries','retention','geo','conversions','acquisition'))"

# 3. geo resolve (v4 E v6) — força cada família
curl -4 -s -o /dev/null -X POST https://$H/api/track -H 'content-type: application/json' -d '{"kind":"pageview","vid":"vchk4","session":"vchk4","page":"/__chk4"}'
curl -6 -s -o /dev/null -X POST https://$H/api/track -H 'content-type: application/json' -d '{"kind":"pageview","vid":"vchk6","session":"vchk6","page":"/__chk6"}' || true
curl -s https://$H/api/telemetry | python3 -c "import sys,json;d=json.load(sys.stdin);print('geo',[(g['country'],g['n']) for g in d['geo']])"

# 4. cert emitido
fly certs show $H --app artelonga-<handle> | grep -i status   # Issued

# 5. durabilidade (sobrevive ao auto-stop)
curl -s https://$H/api/telemetry | python3 -c "import sys,json;print('durable',json.load(sys.stdin)['durable'])"  # True
```

Dashboard: `https://<handle>.artelonga.com.br/analytics` should show the 8 cards
(pageviews, visitors, returning, sessions, bounce, active time, conversions,
countries), the time chart (months on the axis, hover, click filters), geo, conversions
and acquisition.

---

## Rollback

- **Revert to the path:** remove the redirect from step 6; the apex goes back to serving
  `/<handle>/` directly. The CNAME can coexist (with no traffic) or be removed
  (`fly certs remove <host>` + delete the CNAME on Hostinger).
- **Tear down the surface:** `fly apps destroy artelonga-<handle>` (deletes the volume and
  the local telemetry data — export beforehand if you want to preserve it).
- **No identity loss:** since `al_vid` belongs to the apex, going back to the path does not
  break returning visitors.

---

## References

- `docs/telemetry-surfaces.md` — surface endpoints, geo binary, **Option C** and
  rollup schema. This runbook is §3 of that doc, expanded and executable.
- `tools/deploy-surface.mjs` — smoke check gate + deploy.
- `deploy/surfaces/*.toml` — real configs (user, hostinger, comunicacao).
