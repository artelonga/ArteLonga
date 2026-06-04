# Hostinger — a Data Analyst work sample

> A deliberately small, honest sample for the Data Analyst role. The point isn't the size of the numbers — it's the **method**: statistical honesty, observed-vs-pending discipline, and turning a one-customer sample into real signal. **Snapshot: 2026-06-04.**

---

## The one number I can actually measure — email open rate

I measured one thing cleanly: did Hostinger's emails to my own inbox get opened.

- **Open rate: 40.3%** — 31 of 77 delivered emails opened.
- **95% confidence interval (Wilson): [30.0%, 51.4%].** Report this one. The normal/Wald interval would be [29.3%, 51.2%]; at n = 77 Wald under-covers, so Wilson is the correct small-sample proportion interval. I keep both so the difference is auditable.
- **The honest limit: this is one recipient — effectively n = 1.** A single inbox cannot separate a 30% from a 51% true open rate; the wide interval says so out loud. I will not read 40.3% as precise.
- **"Sent" is unknowable from the recipient side**, so *delivered* (77) is the baseline and the open rate is **conditional on delivery** — not a delivery rate. The "sent" stage is left null, not guessed.

Why it still matters: even n = 1 surfaces signal — the first-hand product feedback from building on Horizons, and a 24-hour menu-to-domain conversion (below). The method scales the moment the sample does.

---

## The journey, as I'd measure it (a proposal)

A customer's path — from the first email to a site live on its own domain — reads as a funnel. Each stage is a typed event with **one accountable department**, so any drop-off routes to the team that owns it:

| Stage | Events | Department |
|---|---|---|
| **Acquisition** | email sent → delivered → **opened** | Marketing |
| **Engagement** | link click → landing view → signup | Growth → Product |
| **Monetization** | plan picked → payment | Revenue → Finance |
| **Creation** | Horizons prompt → app generated → publish | Product |
| **Go-live** | hosting → domain → DNS → SSL → first HTTPS | Infra → Customer Success |
| **Activation & retention** | activation → renewal / churn | Product → Revenue |

Only the **bold** step (opened) is measured today; the rest is the framework, honestly marked *pending* rather than filled with guesses. The point of the breakdown is cross-functional: it's one shared way for Hostinger to organize **Marketing Impact, activation and retention** — every drop-off becomes a question with a number on it *and* a team to answer it.

---

## Case study — Retro Umarizal: menu → live Hostinger Horizons domain in 24h

| When | What happened |
|---|---|
| **Jun 2** | Retro Umarizal arrives with one asset — a restaurant menu. A new lead. |
| **Jun 2** | A self-hosted staging MVP goes live on a shareable subdomain — no purchase, no DNS for the client to touch. The owner sees a working site within the hour. |
| **Jun 2** | Client approves on the staging URL → buys **retroumarizal.com.br**. Spend follows validation, not before. |
| **Jun 2 → 3** | Rebuilt on **Hostinger Horizons**; the customer compared both and **chose the Horizons build**. |
| **Jun 3** | **retroumarizal.com.br** live on Hostinger Horizons — apex A/AAAA, valid Let's Encrypt cert, TTL 60. Staging retired. |

One run of the expansion thesis: **every partner is a funnel** — go live instantly, validate, graduate to a Hostinger product. Retro is data point #1 — real, dated events, ready to measure as the sample grows.

---

## Why this is a credible sample, not a vanity metric

- **Observed vs pending is always distinct** — a pending stage is never quietly filled with a number.
- **Proportions report Wilson CIs with n shown** — no single small-sample rate is read as a verdict.
- **Construct validity:** a recipient-side open (I actually opened it) is more reliable than sender-side pixel tracking, which Apple Mail Privacy Protection and image-blocking distort.

With this little data, **data integrity isn't a footnote — it *is* the work sample.**
