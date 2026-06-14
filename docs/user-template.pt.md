---
title: O modelo /user
group: publico
---

# O modelo `/user`

Em toda a documentação, **`user`** é o espaço de exemplo — o seu. Onde você lê
`/user/` ou `user.artelonga.com.br`, troque `user` pelo seu handle. É um modelo,
não uma pessoa: serve igual pra um restaurante, uma comunidade ou você.

## O que é um `/user`

Um `/user` é um **espaço de conteúdo que você possui** na rede. O conteúdo são
arquivos de texto simples (markdown + frontmatter); tudo o mais deriva deles:

```
/user/                     → o seu espaço na rede (servido pelo co)
  ├─ entradas (.md)        → o conteúdo: texto + frontmatter, que você possui
  ├─ site                  → derivado das entradas
  ├─ quadro                → as tarefas
  └─ wiki                  → as notas ligadas entre si
user.artelonga.com.br      → o mesmo /user, graduado pro domínio próprio
```

Você é dono dos arquivos: exporte e leve embora quando quiser. Banco, índice e
site são derivados — nunca um portão.

## O ciclo de vida

```
artelonga.com.br/user/   ──promover──►   user.artelonga.com.br
   (path na rede,                          (domínio próprio,
    custo marginal ≈ zero)                  observabilidade contínua)
```

1. Você entra como `/user` na rede compartilhada (na hora, custo marginal ≈ zero).
2. Valida com conteúdo e números próprios (telemetria first-party).
3. **Gradua** pro domínio próprio quando fizer sentido — sem perder histórico.

## O template, em arquivos

- **`deploy/surfaces/user.toml`** — a configuração da surface. Copie pra
  `deploy/surfaces/<seu-handle>.toml` e troque `user` pelo seu handle.
- Runbook completo da promoção: [universe-upgrade](./universe-upgrade.html).
- A tese por trás (custo marginal ≈ zero, soberania): [intelligence-as-a-service](./intelligence-as-a-service.html).

> Regra da casa: nos docs, exemplos usam sempre `/user` — nunca um handle
> pessoal. `user` é o template; você é o `user`.
