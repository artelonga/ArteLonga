# yuri.artelonga.com.br — modelo de conteúdo

Índice pessoal de Yuri. Tudo é **markdown com frontmatter** (compatível com Obsidian;
degradável em Jekyll — `> [!quote]` vira blockquote comum). O índice em `/` consulta as
entradas por **data, tipo, categoria, autor** e qualquer campo do frontmatter.

## Pastas
- `dias/AAAA-MM-DD.md` — **notas diárias**. `published: true|false` (rota `/2026-05-31`).
- `refs/<slug>.md` — **referências/fontes**: songs, poems, pages, urls, videos… minhas ou externas.
- `notas/<slug>.md` — **notas** (caderno físico) — ver abaixo.
- (futuro) changelog — todos os git edits entram aqui.

## Frontmatter comum
```yaml
type: song | poem | page | url | video | nota | dia   # tipo específico
category: music | escrita | leitura | ...             # CATEGORIA guarda-chuva (centraliza queries)
title: Grace Kelly
author: Mika            # autor externo, ou "yuri"
mine: false             # true = escrito/produzido por mim
created: 2007           # data da obra (frouxa: ano ou ISO)
added: 2026-05-31       # quando entrou aqui
tags: [pop]
```

## Tipos recursivos + categoria
Um `type` específico (ex.: `song`) pode **conter outros tipos** como mídia associada —
um vídeo no YouTube, uma faixa no Spotify, um mp3 cru:
```yaml
media:
  - kind: youtube
    url: https://www.youtube.com/watch?v=...
  - kind: spotify
    url: https://open.spotify.com/track/...
  - kind: mp3
    url: /yuri/media/x.mp3
```
A `category` (ex.: **music**) centraliza a consulta: pedir `category=music` traz todas as
entradas de música independente da mídia; dá pra **sub-filtrar** por tipo de mídia (tem
youtube? tem spotify?). Assim "music" é a query única sobre todas as mídias.

## Citação (Obsidian + Jekyll)
```markdown
> [!quote] Título — Autor
> linha 1
> linha 2
```
Renderiza como bloco de citação estilizado; em Obsidian é um callout; em markdown puro
continua um blockquote legível.

## Transclusão (embed)
`![[grace-kelly]]` numa nota do dia incorpora aquela referência inteira (mídia + citação).

## notas — abstração nova (caderno físico)
`type: nota`. São **notas em um caderno físico**; o markdown descreve/transcreve o que está
na fonte física. Metadados:
```yaml
type: nota
author: yuri
mine: true
data: 2026-05-20        # opcional
caderno: caderno-01     # localização — id do caderno
pagina: 42              # localização — página
```
Corpo = transcrição/descrição em markdown do material bruto. (Notas entram depois.)

## Como regenerar o índice
Editou/adicionou um `.md`? Rode `node tools/bake-yuri.mjs` → gera `yuri/site/entries.json`.
