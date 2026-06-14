# Upgrade de universe — path → surface CNAME (runbook reproduzível)

Como promover uma **universe** servida como **path no apex** (`artelonga.com.br/user/`)
pra **surface própria num CNAME** (`user.artelonga.com.br`), **sem perder
observabilidade nem partir a série temporal**. Princípio (universos **recursivos /
fractais** — a mesma unidade em qualquer escala, sem "sub"): uma universe aninhada
promove pra surface sem fricção, continua sendo a mesma universe (mesma chave,
histórico, changelog, analytics) e passa a **ser dona do próprio estado**.

Worked example ao longo do doc: **user** (`handle=user`, app `artelonga-user`,
host `user.artelonga.com.br`). Troque `user`/`artelonga-user`/o host pelos seus.

> Pré-requisitos: `fly` autenticado (`fly auth whoami`), acesso ao DNS em
> **Hostinger** (registrar do `artelonga.com.br`), repo clonado, conteúdo da
> universe já em `<handle>/` com um `index.html` servível na raiz da surface.

---

## Visão geral (o que muda)

| | Antes (path) | Depois (surface CNAME) |
|---|---|---|
| URL | `artelonga.com.br/user/` | `user.artelonga.com.br` |
| Servidor | GH Pages (apex) | `tools/surfaces-server.mjs` num app Fly |
| Telemetria | co (rico) | **universe-owned** (NDJSON local, à paridade — geo/retenção/timeseries/conversões/aquisição) |
| Fonte da verdade | `telemetry_events` no co | `/data/telemetry-<handle>.jsonl` na surface |

A continuidade tem 3 partes, todas cobertas abaixo: **série** (backfill), **identidade**
(`al_vid` no cookie apex), **capacidade** (surface já está à paridade — ver
`telemetry-surfaces.md`).

---

## Passo a passo

### 1. Conteúdo servível na raiz da surface

A surface serve `SURFACE` (ex. `/user/`) na raiz `/`. Os HTML usam caminhos
absolutos `/user/*`, então só `/` é mapeado pro `index.html` da surface; o resto
serve o arquivo direto. Garanta que `<handle>/index.html` existe e carrega o
beacon de telemetria + feedback:

```html
<script src="/user/telemetry.js?v=YYYYMMDDx" defer></script>
<script src="/user/feedback.js?v=YYYYMMDDx" defer></script>
```

### 2. Registrar a surface no deploy tooling

Adicione a entrada em `tools/deploy-surface.mjs` (`SURFACES`) e crie o toml:

```js
// tools/deploy-surface.mjs → SURFACES
<handle>: {
  server: "tools/surfaces-server.mjs",
  env: { SURFACE: "/<handle>/", FEEDBACK_UNIVERSE: "<handle>" },
  config: "deploy/surfaces/<handle>.toml", dockerfile: "deploy/surfaces/Dockerfile",
  expect: ["<string única do index>", "feedback.js", "</html>"]   // smoke check pré-deploy
}
```

`deploy/surfaces/<handle>.toml` (copie de `deploy/surfaces/user.toml`):

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

> O `Dockerfile` (`deploy/surfaces/Dockerfile`) já copia `tools/surfaces-server.mjs`
> + `user/` — então o reader de geo e os binários `user/geo/ip{4,6}-country.bin`
> vão junto. Nada a mudar aqui.

### 3. Criar o app Fly + volume durável + deploy

Da raiz do repo (valores reais do user como exemplo):

```bash
fly apps create artelonga-<handle>
fly volumes create tele --region gru --size 1 --app artelonga-<handle> --yes   # NDJSON durável em /data
node tools/deploy-surface.mjs <handle>        # smoke check local (health, strings) → fly deploy --remote-only --ha=false
```

`deploy-surface.mjs` sobe o server local, valida `/api/health`, `/` e as strings
`expect` (e ausência de fallback L-002) **antes** de deployar. Falhou o smoke →
deploy abortado.

### 4. Certificado + DNS (CNAME na Hostinger)

```bash
fly certs add <handle>.artelonga.com.br --app artelonga-<handle>   # mostra o alvo do CNAME
```

No DNS da **Hostinger**, crie o registro que o comando indicou:

```
CNAME   <handle>   artelonga-<handle>.fly.dev.
```

Aguarde a emissão (`fly certs show <handle>.artelonga.com.br --app artelonga-<handle>`
→ `Status: Issued`). No user: cert **Issued** (Fly-managed), IPs `v6 dedicado`
+ `v4 compartilhado` — o Fly cuida disso ao adicionar o cert.

### 5. Continuidade de telemetria (Option C)

1. **Identidade — já automática.** O `al_vid` vive em cookie no **apex
   `.artelonga.com.br`** (ver `telemetry-surfaces.md §5`), então o mesmo visitante
   atravessa `artelonga.com.br/<handle>/` → `<handle>.artelonga.com.br` sem virar
   "novo". O `telemetry.js` da surface lê esse cookie primeiro. Nada a fazer.
2. **Backfill da série.** Exporte o histórico pré-cutover do co e role pra série
   diária sob `universe=<handle>`:

   ```bash
   # marca o cutover
   T=$(date -u +%Y-%m-%dT%H:%M:%SZ)
   # exporta eventos /<handle>/* do co (auth admin) → rollup diário keyed by universe
   curl -H "Authorization: Bearer $CO_TOKEN" \
     "https://co.artelonga.com.br/api/v1/admin/telemetry/export?path_prefix=/<handle>/&until=$T"
   ```
   (A metade co — ingest de rollup por universe — é o follow-up rastreado em
   `telemetry-surfaces.md §3`. Até lá o histórico fica legível via o dashboard do
   apex; a surface começa a série nova do cutover.)
3. **Rollups novos.** A surface emite rollups diários consentidos (sem PII) keyed
   by `universe=<handle>` — mesma key path↔CNAME, então a série não tem corte.

### 6. Redirecionar o path antigo (evita fragmentar)

Pra `/<handle>/` no apex não competir com a surface no analytics da rede,
redirecione 301 o path antigo pro CNAME (GH Pages: meta-refresh/redirect no
`<handle>/index.html` do apex, ou regra de redirect). Assim todo tráfego novo
pousa na surface e a atribuição fica limpa.

---

## Checklist de verificação (reproduzível)

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

Dashboard: `https://<handle>.artelonga.com.br/analytics` deve mostrar os 8 cards
(pageviews, visitantes, recorrentes, sessões, rejeição, tempo ativo, conversões,
países), gráfico de tempo (meses no eixo, hover, clique filtra), geo, conversões e
aquisição.

---

## Rollback

- **Reverter pro path:** remova o redirect do passo 6; o apex volta a servir
  `/<handle>/` direto. O CNAME pode coexistir (sem tráfego) ou ser removido
  (`fly certs remove <host>` + apagar o CNAME na Hostinger).
- **Derrubar a surface:** `fly apps destroy artelonga-<handle>` (apaga o volume e os
  dados de telemetria locais — exporte antes se quiser preservar).
- **Sem perda de identidade:** como o `al_vid` é do apex, voltar pro path não quebra
  os visitantes recorrentes.

---

## Referências

- `docs/telemetry-surfaces.md` — endpoints da surface, binário geo, **Option C** e
  schema de rollup. Este runbook é o §3 daquele doc, expandido e executável.
- `tools/deploy-surface.mjs` — gate de smoke check + deploy.
- `deploy/surfaces/*.toml` — configs reais (user, hostinger, comunicacao).
