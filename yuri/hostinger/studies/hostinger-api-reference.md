# Hostinger API — Reference & Product Mapping

**Base URL:** `https://developers.hostinger.com`
**Auth:** `Authorization: Bearer <HOSTINGER_TOKEN>` (hPanel → API → API tokens)
**Status:** beta (`v1`, ~0.0.100). Confirm shapes against the
[live reference](https://developers.hostinger.com/) / Postman collection before relying on them.
**Source of route list:** [hostinger/api-php-sdk](https://github.com/hostinger/api-php-sdk)
(+ [api-mcp-server](https://github.com/hostinger/api-mcp-server)).

> Test subject for our experiments: **`quilomboaraucaria.org`** — Hostinger-registered
> (Registrar: HOSTINGER operations UAB, created 2025-10-03), apex on **Fly.io**
> (`66.241.125.48`), mail on **Hostinger** (`mx1/mx2`), and SPF authorizes
> **`_spf.reach.hostinger.com`** (Hostinger Reach). `artelonga.com.br` is a shared
> domain and is NOT used for write tests.

---

## 1. DNS Zone — `/api/dns/v1/zones/{domain}`

| Method | Path | SDK op | Use |
|---|---|---|---|
| GET | `/zones/{domain}` | `getDNSRecordsV1` | read current zone |
| PUT | `/zones/{domain}` | `updateDNSRecordsV1` | upsert records (`overwrite` flag) |
| DELETE | `/zones/{domain}` | `deleteDNSRecordsV1` | delete records by name+type |
| POST | `/zones/{domain}/validate` | `validateDNSRecordsV1` | **dry-run validate before applying** |
| POST | `/zones/{domain}/reset` | `resetDNSRecordsV1` | reset to defaults |

## 2. DNS Snapshot — `/api/dns/v1/snapshots/{domain}`

| Method | Path | SDK op | Use |
|---|---|---|---|
| GET | `/snapshots/{domain}` | `getDNSSnapshotListV1` | list zone snapshots |
| GET | `/snapshots/{domain}/{id}` | `getDNSSnapshotV1` | read one snapshot |
| POST | `/snapshots/{domain}/{id}/restore` | `restoreDNSSnapshotV1` | **roll back the zone** |

## 3. Domains — `/api/domains/v1`

| Method | Path | SDK op |
|---|---|---|
| POST | `/availability` | `checkDomainAvailabilityV1` |
| GET | `/portfolio` | `getDomainListV1` |
| POST | `/portfolio` | `purchaseNewDomainV1` |
| GET | `/portfolio/{domain}` | `getDomainDetailsV1` |
| PUT | `/portfolio/{domain}/nameservers` | `updateDomainNameserversV1` |
| PUT/DELETE | `/portfolio/{domain}/domain-lock` | enable/disable lock |
| PUT/DELETE | `/portfolio/{domain}/privacy-protection` | enable/disable WHOIS privacy |
| POST/GET/DELETE | `/forwarding[/{domain}]` | domain forwarding |
| GET/POST/DELETE | `/whois[...]` | WHOIS contact profiles |

## 4. Reach (email marketing contacts) — `/api/reach/v1/contacts`

| Method | Path | SDK op |
|---|---|---|
| GET | `/contacts` | `listContactsV1` |
| POST | `/contacts` | `createANewContactV1` |
| GET | `/contacts/groups` | `listContactGroupsV1` |
| DELETE | `/contacts/{uuid}` | `deleteAContactV1` |

## 5. Billing — `/api/billing/v1`

| Method | Path | SDK op |
|---|---|---|
| GET | `/catalog` | `getCatalogItemListV1` |
| POST | `/orders` | `createServiceOrderV1` |
| GET | `/subscriptions` | `getSubscriptionListV1` |
| DELETE | `/subscriptions/{id}` | `cancelSubscriptionV1` |
| PATCH/DELETE | `/subscriptions/{id}/auto-renewal/...` | enable/disable auto-renew |
| GET/POST/DELETE | `/payment-methods[...]` | payment methods |

## 6. VPS — `/api/vps/v1` (abridged)

Full VM lifecycle: `virtual-machines` (purchase/setup/start/stop/restart/recreate,
metrics, hostname, nameservers, passwords), **Docker Manager**
(`/docker/...` create/start/stop/logs/containers), **Firewall** (`/firewall/...`),
**Snapshots/Backups**, **PTR records**, **Public keys**, **Post-install scripts**,
**Malware scanner (Monarx)**, **Recovery mode**, **Data centers**, **OS templates**.

---

## Product mapping — which routes power which ArteLonga product

| Our product / feature | Hostinger routes | What it enables |
|---|---|---|
| **`co` — publish a universe to a custom domain** | DNS Zone `PUT` + `validate`; DNS Snapshot (restore) | When a user attaches a domain to their universe, `co` validates then writes the CNAME/A; snapshot first → safe rollback. The propagation test directly characterizes this UX. |
| **`co` — "buy a domain while creating a universe"** | Domains `availability` → `purchaseNewDomainV1` → `nameservers` | One-flow: check name, purchase, point NS — no leaving the product. |
| **`co` — privacy/security defaults** | Domains `privacy-protection`, `domain-lock`; DNS `validate` | Turn on WHOIS privacy + registrar lock by default (addresses our DNSSEC/privacy findings). |
| **`assinatura` (subscribe to a universe) → newsletter** | Reach `contacts` (create/list/groups) | Sync universe subscribers into a Reach contact group; the "marketing email" use case sends to that group. |
| **Paid subscriptions / monetized universes** | Billing `subscriptions`, `catalog`, `orders` | Manage plan state, auto-renewal, cancellations programmatically. |
| **Self-hosting `co` on Hostinger (instead of Fly.io)** | VPS `virtual-machines` + Docker Manager + Firewall + Snapshots | Deploy the Axum container, lock down ports, snapshot before deploys. |
| **Redirects (e.g. apex → www, old universes)** | Domains `forwarding` | Declarative forwarding without running a redirector. |
| **Instant prototype surface (subdomain → domain)** | DNS Zone `validate`+`PUT` (CNAME, low TTL); later Domains `availability`→`purchaseNewDomainV1`→`nameservers` | Bring a universe/partner live on `<name>.<zone>` in seconds for user testing; buy a real domain only after approval. "Web hosting as a service" → "domain as a service". See [§ Prototype surfaces](#prototype-surfaces--subdomain-now-domain-after-approval). |

---

## Prototype surfaces — subdomain now, domain after approval

**Pattern (web hosting as a service):** every new universe or partner goes live
*immediately* as a subdomain CNAME pointing at the platform host — no purchase to
wait on, no DNS for the client to manage. The fast loop (deploy → share a URL →
user-test → iterate) runs entirely on the subdomain. Only **after the client
approves** do we buy a dedicated domain and re-point. The surface is born portable.

**Lifecycle**

1. **Spin up (seconds).** `validate` → snapshot → `PUT` a `CNAME` for `<name>` →
   the platform host (`<app>.fly.dev` for Fly, `artelonga.github.io` for Pages),
   **TTL 60–300 s**. Authoritative push is sub-second (0.169 s measured — see
   `dns-hostinger-findings.md`); a brand-new name can lag up to the **600 s
   negative-cache window** the first time it is queried.
2. **User-test.** Share `https://<name>.<zone>`. Iterate by *deploying* (push to
   Fly) — the CNAME alias is stable, so DNS never changes. The low TTL keeps any
   re-point cheap.
3. **Approve → own a domain.** `availability` → `purchaseNewDomainV1` →
   `nameservers` (or keep DNS here: apex `A`/ALIAS + `www` CNAME). Re-point or
   forward the prototype subdomain; retire it once the domain is canonical.

**Planned MVP surfaces** (bring online as low-TTL CNAMEs):

| Surface | Target | Note |
|---|---|---|
| `yuri` | GitHub Pages (`artelonga.github.io`) or Fly | projection of the yuri portfolio |
| `comunicacao-pt` / `-yo` / `-mbya` | Fly (`yggdrasil-artelonga.fly.dev`) | comunicação universe variants (pt / Yorùbá / Mbyá) |
| partner prototypes (e.g. `retro-burger`) | Fly (`co-artelonga.fly.dev`) or the universe's host | one CNAME per client; buy their domain after approval |

### A vs CNAME — the rule for prototypes

> **Subdomain on a PaaS (Fly / Pages / Vercel) → CNAME. Apex, or a host whose IP you own (VPS) → A/AAAA.**

For rapid-iteration surfaces the deciding factor isn't performance — it's **who owns
the IP**. If the platform owns it, CNAME so its DNS can move the backend without you
touching the zone; a low TTL then cuts over instantly. Pin an `A` only where you must:

| Surface | Runs on | Record | Why |
|---|---|---|---|
| `<name>` prototype | Fly / Pages | **CNAME → host**, TTL 60–300 | zero-touch redeploys; portable; self-healing (platform anycast/failover) |
| `www` | GitHub Pages | CNAME → `artelonga.github.io` | per GitHub docs — already correct |
| apex `artelonga.com.br` | GitHub Pages | **A** `185.199.108–111.153` | apex cannot be a CNAME (RFC 1034) |
| self-hosted (VPS, static IP) | Hostinger VPS | **A → your IP** | you own the IP; a CNAME would be pointless indirection |

`rfq` / `yggdrasil` are today **A → Fly anycast IP**; the portable form is
`CNAME → <app>.fly.dev` (then re-issue TLS: `flyctl certs add <host>`). Migrate when
convenient — staged, low TTL, no rush.

**Caveats**
- **A CNAME can't coexist** with other records at the same name (RFC 1034). If a
  surface also needs `MX`/`TXT` (it sends email), use `A` + those records instead.
- **One CNAME → one target** — not a per-user A/B randomizer (DNS buckets per
  *resolver*, not per user). Bucket experiments at the edge/app; keep DNS a boring
  pointer.

### ⚠️ Which zones the API can actually write

This recipe is **API-automatable only on Hostinger-registered zones**:

| Zone | API writes? | How to add a prototype subdomain |
|---|---|---|
| `quilomboaraucaria.org` | ✅ yes | the `validate → snapshot → PUT` recipe below |
| **`artelonga.com.br`** | ❌ **`403 "Customer does not own"`** — Registro.br is the registrar; Hostinger only hosts the zone | **hPanel (or Registro.br) by hand** — the API path does not work here (README §9) |

So `*.artelonga.com.br` MVP surfaces (`yuri`, `comunicacao-*`, partners) are added
**in hPanel today**, not via this API. To make them API-driven, either move
`artelonga.com.br` DNS to a programmable registrar, or stand prototypes up under
`*.quilomboaraucaria.org` (API-writable) until then.

### Recipe — create a prototype CNAME (API-writable zone)

```bash
# env: HOSTINGER_TOKEN set; DOMAIN must be Hostinger-registered (e.g. quilomboaraucaria.org)
DOMAIN=quilomboaraucaria.org
NAME=retro-burger                       # → retro-burger.<DOMAIN>
TARGET=co-artelonga.fly.dev             # platform host (NOT the bare IP)
BASE=https://developers.hostinger.com/api/dns/v1
PAYLOAD=$(printf '{"overwrite":false,"zone":[{"name":"%s","type":"CNAME","ttl":60,"records":[{"content":"%s"}]}]}' "$NAME" "$TARGET")

curl -s     "$BASE/snapshots/$DOMAIN"          -H "Authorization: Bearer $HOSTINGER_TOKEN" | head -c 200; echo   # 1. snapshot = rollback point
curl -s -X POST "$BASE/zones/$DOMAIN/validate" -H "Authorization: Bearer $HOSTINGER_TOKEN" -H 'Content-Type: application/json' -d "$PAYLOAD" -w '\nvalidate %{http_code}\n'  # 2. dry-run
curl -s -X PUT  "$BASE/zones/$DOMAIN"          -H "Authorization: Bearer $HOSTINGER_TOKEN" -H 'Content-Type: application/json' -d "$PAYLOAD" -w '\nput %{http_code}\n'        # 3. apply
# then issue TLS for the new hostname:  flyctl certs add retro-burger.$DOMAIN
```

Mirrors `create-and-measure.sh`: snapshot → `validateDNSRecordsV1` →
`updateDNSRecordsV1`, with `overwrite:false` so the rest of the zone is untouched.
Roll back with `restoreDNSSnapshotV1` if the change misbehaves.

### Upgrade — buy the client's domain after approval

```bash
BASE=https://developers.hostinger.com/api/domains/v1
curl -s -X POST "$BASE/availability" -H "Authorization: Bearer $HOSTINGER_TOKEN" \
  -H 'Content-Type: application/json' -d '{"domain":"retroburger.com.br"}'
# available → purchaseNewDomainV1 → nameservers (or apex A + www CNAME here) → re-point/forward the prototype subdomain → retire it
```

---

## Safety & rigor notes for using these in products

- **Always `validate` before `update`** on DNS — the dry-run endpoint exists; use it.
- **Snapshot before mutate.** `getDNSSnapshotListV1` → mutate → `restoreDNSSnapshotV1`
  on failure. Our test scripts now do this.
- **`overwrite:false`** adds/updates without nuking the zone; `overwrite:true` and
  `reset` are destructive — gate behind explicit confirmation in any product flow.
- **Idempotency / rate limits.** API is beta with stated rate limiting; treat writes
  as at-least-once, make product calls idempotent (key on name+type), and back off on 429.
- **Token scope.** A single bearer token spans DNS + Domains + Billing + VPS — i.e.
  it can *purchase* and *cancel*. Scope tokens minimally and never commit them
  (`.hostinger.env` is gitignored).
