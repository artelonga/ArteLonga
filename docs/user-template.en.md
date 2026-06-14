---
title: The /user template
group: publico
---

# The `/user` template

Across the docs, **`user`** is the example space — yours. Wherever you read
`/user/` or `user.artelonga.com.br`, swap `user` for your handle. It's a template,
not a person: it works the same for a restaurant, a community, or you.

## What a `/user` is

A `/user` is a **content space you own** on the network. The content is plain-text
files (markdown + frontmatter); everything else derives from them:

```
/user/                     → your space on the network (served by co)
  ├─ entries (.md)         → the content: text + frontmatter, owned by you
  ├─ site                  → derived from the entries
  ├─ board                 → the tasks
  └─ wiki                  → the linked notes
user.artelonga.com.br      → the same /user, graduated to its own domain
```

You own the files: export and walk away anytime. Database, index and site are
derived — never a gate.

## The lifecycle

```
artelonga.com.br/user/   ──graduate──►   user.artelonga.com.br
   (path on the network,                  (own domain,
    marginal cost ≈ zero)                  continuous observability)
```

1. You go live as `/user` on the shared network (instantly, marginal cost ≈ zero).
2. You validate with your own content and numbers (first-party telemetry).
3. You **graduate** to your own domain when it makes sense — with no loss of history.

## The template, in files

- **`deploy/surfaces/user.toml`** — the surface config. Copy it to
  `deploy/surfaces/<your-handle>.toml` and swap `user` for your handle.
- Full promotion runbook: [universe-upgrade](./universe-upgrade.en.html).
- The thesis behind it (marginal cost ≈ zero, sovereignty): [intelligence-as-a-service](./intelligence-as-a-service.en.html).

> House rule: in the docs, examples always use `/user` — never a personal handle.
> `user` is the template; you are the `user`.
