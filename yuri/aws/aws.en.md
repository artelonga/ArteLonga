---
title: AWS — an introduction through experience
lang: en
author: yuri
draft: false
tags: [tecnologia, aws, cloud, infraestrutura]
---

# AWS — an introduction through experience

> This is not a service list memorized from the docs. It's what I learned
> operating a real-time data platform on AWS — from WebSocket collection to a
> queryable data lake — for about **US$ 155/month**. The focus is tools,
> decisions, costs, and *postmortems*. Business specifics are left out; what
> matters here are the **lessons that transfer** to any cloud project.

AWS has 200+ services. Nobody uses 200. The secret to good architecture isn't
knowing all of them — it's knowing **which service solves what, and when the cost
of adding it starts to pay off**. Almost every decision below was made by writing
down a *threshold* (an objective limit) *before* migrating.

## 1. The mental map — the toolbox

I think of AWS in four layers. For each problem, I pick the simplest *managed*
service until a concrete threshold forces a change.

| Layer | Service | What it's for | When I used / avoided it |
|---|---|---|---|
| **Compute** | **ECS + Fargate** | Run containers without managing a machine | Default for everything. Zero OS maintenance, auto-recovery, ~30s startup |
| | EC2 | Raw virtual machine | Avoided — only worth it above ~20 steady tasks or with GPU |
| | Lambda | Event-driven function, serverless | Scheduled jobs (reconciliation, compliance) via EventBridge |
| | EKS | Managed Kubernetes | Never justified at this scale — too much complexity |
| **Storage** | **S3** | Object storage, the "source of truth" | The heart of everything. 11 nines of durability |
| | ECR | Docker image registry | Collector images, with a lifecycle policy |
| | DynamoDB | Key-value NoSQL database | Migrated most of it to S3 (see §3). Kept only tiny, hot tables |
| **Data** | **Glue** | Serverless ETL (managed Spark) | Daily JSON → Parquet ETL |
| | **Athena** | SQL over files in S3 | Queries the data lake, pays per byte scanned |
| | EMR | Raw Spark/Hadoop cluster | Documented, didn't use — only wins above ~100 GB/day |
| | MSK | Managed Kafka | Evaluated and declined (see §3) — self-hosted Redpanda instead |
| **Operations** | **CloudWatch** | Logs, metrics, alarms, dashboards | All observability |
| | Secrets Manager | Credentials and keys | API secrets, rotation |
| | IAM | Permissions (who can do what) | Least privilege — the source of half the subtle bugs (§5) |
| | EventBridge | Scheduler / event bus | ETL cron, compliance pipelines |

The intuition that stuck: **start serverless and managed; climb a rung only with
a number in hand.** Fargate up to ~20 tasks; Glue up to ~100 GB/day; DynamoDB
on-demand for small tables. Writing the threshold turns "I think this is
expensive" into an objective decision.

## 2. The recurring pattern — an S3 data lake

The architecture I came to trust most is simple and cheap:

```
Collectors (Fargate) ──► S3 raw (JSON gzip) ──► daily Glue ETL ──► S3 processed (Parquet)
                                                                          │
                                                       Athena / DuckDB / Polars (query)
```

- **S3 as the single source of truth (SSOT).** If durable storage already gives
  you 11 nines, any database or streaming layer becomes **optional** — justified
  by *consumers*, not by habit.
- **Parquet + Snappy** instead of JSON: ~70-80% smaller, columnar, with predicate
  pushdown. A 100M-record query dropped from 120s (JSON) to 15s (Parquet).
- **Partition by date** (`year=/month=/day=/`): Athena skips irrelevant
  partitions and you pay only for the bytes you actually read.

Adding a new source becomes just one Terraform entry — not rebuilding
infrastructure.

## 3. The hard decisions (trade-offs)

Architecture is the art of **deferring and justifying expensive commitments**.
Four decisions worth the deliberation:

**Fargate vs EC2.** For this workload, EC2 was only ~13-20% cheaper — but cost 8+
configuration steps (auto scaling group, patching, metrics agent, auto-recovery)
versus 2 for Fargate. Valuing my time at US$ 50/h, EC2 only starts to pay off
above ~20 steady tasks. **Lesson: human operating cost is real cost.**

**Glue vs EMR.** Glue is serverless and vanishes when the job ends. EMR (a raw
cluster) only wins above ~100 GB/day or jobs over 1h — there it's 50-70% cheaper,
even more with Spot. **My rule:** only migrate if the alternative is >30% cheaper.

**MSK vs Redpanda vs direct-S3.** Managed Kafka (MSK) cost ~US$ 480-550/month for
a 3-broker HA cluster, versus ~US$ 18 for the current approach. Since durability
was *already solved by S3*, Kafka was only justified by multiple real-time
consumers. The solution: a **transport abstraction layer** (`TRANSPORT_TYPE`)
that lets you swap S3 ↔ Redpanda ↔ MSK by config. **Lesson: abstract what you
haven't decided yet.**

**DynamoDB → S3 + Parquet.** A 322 GB / 226M-item table cost US$ 80.58/month in
storage alone. Migrated to S3+Parquet: ~US$ 4/month (**~95% savings**). Two
golden lessons:

- **The native tool beats a hand-rolled script:** `export-table-to-point-in-time`
  took **13 minutes** versus an estimated **~157 hours** of scan + pagination.
  Always look for the native bulk export before iterating by hand.
- **Safe migration pattern:** export → verify counts match → run in parallel for
  30 days → only then delete.

## 4. Cost — where the money actually leaks

The wrong instinct is to optimize CPU. The real leaks are elsewhere:

- **Storage lifecycle is the biggest lever.** S3 transitions on its own: STANDARD
  (US$ 0.023/GB) → STANDARD_IA after 30d (-45%) → GLACIER after 90d (-83%) →
  DEEP_ARCHIVE after 365d. Configure it on day 1.
- **In Athena you pay per byte scanned.** Partitioning + filtering in `WHERE` +
  selecting only the needed columns took a query from 1.8 TB → 50 MB, from US$ 10
  to US$ 0.0003. Use approximate aggregations (`APPROX_PERCENTILE`).
- **Request cost is real.** A collector writing 4 files/min even while idle
  generated ~170k PUTs/month. Raising the flush interval from 5s → 60s cut it to
  ~1 file/min. **Batch your writes — the flush interval is a deliberate cost knob.**
- **Network transfer (NAT egress) can exceed compute.** In one case, US$ 58/month
  of egress versus US$ 18 of Fargate. Optimizing CPU there would be pointless.
- **Compression compounds:** gzip on JSON (70-90%) then Parquet/Snappy (another
  ~70%) cut both storage *and* query cost at once.

## 5. Postmortems — the war stories

This is where the real learning lives. Generalized cases:

**The circuit breaker that became a permanent outage.** A task restarted
(suspected OOM) and came up with stale state during warmup. Within ~300ms it
accumulated 10 consecutive rejections and the circuit breaker (threshold = 10)
latched **permanently**, requiring a manual restart. **Lesson: breakers must
tolerate startup noise — a warmup grace period keeps a transient hiccup from
becoming a hard outage.**

**IAM too tight, silent failure.** The service emitted metrics under one namespace
(from a hardcoded default that ignored the env var), but the IAM policy only
allowed a different exact namespace → `PutMetricData` silently denied, no metrics
exactly during an incident. **Lesson: keep IAM and app config in sync, and prefer
prefix conditions over exact match.**

**The config that wasn't applied.** Kafka topics created with 1 partition despite
the config asking for 12 — auto-create silently overrode the intent, killing
parallelism and building a 323k-message backlog. **Lesson: verify the config was
actually *applied* at runtime.**

**The scheduled job failing silently.** A reconciliation task errored every 5
minutes (`No module named ...`) because the module was never included in the
image. Nobody noticed for days. **Lesson: scheduled jobs fail quietly — give every
cron/EventBridge its own alarm.**

**A security group with `0.0.0.0/0`.** Caught in review before apply. **Lesson:
always review default-permissive SG rules before shipping.**

## 6. Day-to-day operations

- **Everything in IaC (Terraform).** Reusable per-service modules, per-environment
  deployments. A "source map" pattern generates all per-source resources (IAM, log
  groups, alarms, widgets) from a single variable.
- **Structured JSON logs** (Rust `tracing`, Python `structlog`) so CloudWatch
  Insights queries work on typed fields. Watch for the "split-brain": if part of
  the code logs JSON and part uses f-strings, filters silently match nothing.
- **Containers:** multi-stage build, non-root user, pinned versions. A Rust image
  ~30 MB vs Python ~500 MB — it matters for ECR storage and cold start.
- **Layered monitoring:** metric filters over logs → custom metrics → per-source
  alarms → a composite alarm firing to SNS → Slack + PagerDuty.
- **Security / credentials:** Secrets Manager + per-source IAM. Sandbox modes get
  an **empty** secret ARN, so IAM *physically* blocks access to real credentials
  (defense in depth). Never log auth headers — only key IDs and the outcome.

## 7. The principles that remain

If I had to distill it all into a few lines for someone starting on AWS:

1. **S3 as the source of truth simplifies everything else.** Database and
   streaming layers are optional until a consumer demands them.
2. **Pick serverless/managed until a concrete threshold forces a change** — and
   write that threshold first, so the decision to migrate is objective.
3. **Storage classes + lifecycle are the biggest cost ROI.** Turn it on day 1.
4. **In analytics you pay per byte read** — partition, filter, select only what's needed.
5. **Watch request count and egress, not just storage and compute.**
6. **A native bulk tool beats a hand-rolled script** (700x faster, in my case).
7. **Least-privilege IAM bites when config drifts** — keep them in sync, use prefixes.
8. **Verify the config was actually applied** at runtime.
9. **Circuit breakers must tolerate warmup.**
10. **Scheduled jobs fail silently** — give them their own alarms.
11. **The same code for streaming and batch** beats reconciling two implementations.
12. **An abstraction layer lets you defer expensive architecture commitments.**

> AWS doesn't reward knowing more services. It rewards knowing **which one not to
> use yet** — and having the number to prove it.
