---
title: Technical Portfolio
type: portfolio
kind: systems
lang: en
tkey: portfolio
category: systems
author: yuri
mine: true
added: 2026-06-01
tags: [rust, node, fly.io, infra]
---

Two parallel tracks tell this story above — switch between them and step through. One is **mine**; the other is **ours**.

**Data — my path.** A decade of working with data as it grew: field and lab collection in research, then HIPAA-grade storage and management of human-subjects data, three published papers and a patent, retail analytics at scale, and quant. One landmark sits on this path: [SensorySpeech](https://github.com/yurisugano/SensorySpeech) (2023) — a Neurobiology × Linguistics collaboration at the University of Chicago that taught Python and NLP, from tokenization to word embeddings and transformers, while applying them to research on sensory references in natural speech. Teaching those concepts in the early days of LLM adoption, anchored to a real neuroscience question, is what makes it a marker; the bridge between NLP in computers and language processing in the brain is written up in [sensory-speech](https://yuri.artelonga.com.br/?e=sensory-speech), with the repository imported file by file into a private co universe. That arc is personal — it lives on [github.com/yurisugano](https://github.com/yurisugano) — and it continues at ArteLonga: first-party analytics across the network — Google-Analytics-grade depth, zero third parties (≈690 monthly visitors, ~1,800 events, 9 countries). How it works: [telemetry & analytics](https://artelonga.com.br/docs/telemetry-surfaces.html); two data case studies sit alongside — a real-time data platform on [AWS](https://artelonga.com.br/yuri/aws/) and a customer-side [Hostinger funnel study](https://artelonga.com.br/yuri/hostinger/).

**Systems / Web — our network, ArteLonga.** ArteLonga is a collective: a network for career, brand, technology and communication. What we build is **scalable intelligence** — every system is built with a partner, runs on the network's shared infrastructure, and makes the next one cheaper to ship. Three projects, as technical notes:

- **artelonga** — partners: [Retro Umarizal](https://retroumarizal.com.br), [Quilombo Araucária](https://quilomboaraucaria.org), GRCS Amazônia. The platform itself, **co**: each partner's site, board and wiki in one place, stored as plain text files the partner owns — the database, index and site are all derived from the files, so a partner can leave with their data at any time. Rust/Axum backend, REST + WebSocket API with real-time sync, JWT auth, one isolated SQLite shard per partner with LiteFS replication; SvelteKit frontend. A new partner goes live in minutes as a self-hosted subdomain, validates, then graduates to a domain of their own — Retro Umarizal already did. The model extends to any use case — even miguel, one person's universe owning project universes like mse, ships on the same API; each connection expands the network into the next niche.
- **rfq** — partner: Hedix, a prediction-market exchange. Market-making intelligence as an API: a Rust/Axum + Tokio service that prices requests-for-quote and returns firm, auto-accept quotes in a single low-latency call — idempotent by client order id, API-key auth, OpenAPI/Swagger documented, with separate staging and production environments.
- **Neuro Notebook Brasil** — partner: Peggy Mason, University of Chicago Neurobiology. A collaborative neuroscience bibliography: Node backend with a feedback and registration API over SQLite; the bibliography, author network, timeline and gallery render client-side from structured data.

Our code lives at [github.com/artelonga](https://github.com/artelonga).

What the network is *for*: putting privacy-respecting software and a real web presence within reach of the small businesses and communities that big platforms price out.
