---
title: Lateral Movement
type: project
kind: systems
lang: pt-BR
tkey: lateral-movement
category: dados
author: yuri
mine: true
added: 2026-06-16
tags: [rust, dados, segurança]
significance: 'Movimento lateral é quando um invasor entra numa rede e passa de um computador para outro. Detectar isso por software exige exemplos rotulados: quais eventos foram ataque e quais foram normais. Preparo esses exemplos a partir de uma base pública de registros de rede. São dezenas de gigabytes. Marco cada evento e organizo no formato do treino.'
resumo: 'Preparação em Rust de uma base de rede para detectar movimento lateral. Dezenas de gigabytes rotulados.'
media:
  - kind: url
    url: https://github.com/yurisugano/Data-Processing-Lateral-Movement-Detection
---

Movimento lateral é quando um invasor já entrou numa rede e passa de um computador para outro, procurando o que quer. Para um programa aprender a detectar isso, ele precisa de exemplos. Cada evento de rede precisa estar marcado: ataque ou uso normal.

Trabalho com uma base pública conhecida, de um laboratório americano. São dezenas de gigabytes. Marco os eventos e os organizo no formato que o treino usa, sem estourar a memória. Fiz em Rust por causa do volume e da velocidade. É a etapa menos visível e a que decide se o resto funciona.
