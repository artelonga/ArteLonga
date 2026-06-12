---
title: Portfólio Técnico
type: portfolio
kind: systems
lang: pt-BR
tkey: portfolio
category: systems
author: yuri
mine: true
added: 2026-06-01
tags: [rust, node, fly.io, infra]
---

Duas faixas paralelas contam esta história acima — troque entre elas e avance. Uma é **minha**; a outra é **nossa**.

**Dados — o meu caminho.** Uma década trabalhando com dados conforme eles cresciam: coleta de campo e laboratório na pesquisa, depois armazenamento e gestão de dados sensíveis de saúde com governança HIPAA, três artigos publicados e uma patente, analytics de varejo em escala, e quant. Um marco fica nesse caminho: o [SensorySpeech](https://github.com/yurisugano/SensorySpeech) (2023) — uma colaboração entre Neurobiologia e Linguística na Universidade de Chicago que ensinou Python e PLN, de tokenização a word embeddings e transformers, aplicando a pesquisa sobre referências sensoriais na fala natural. Ensinar esses conceitos nos primeiros dias da adoção dos LLMs, ancorado numa pergunta real de neurociência, é o que faz dele um marco; a ponte entre PLN em computadores e o processamento de linguagem no cérebro está em [sensory-speech](https://yuri.artelonga.com.br/?e=sensory-speech), com o repositório importado arquivo a arquivo num universo co privado. Esse arco é pessoal — vive em [github.com/yurisugano](https://github.com/yurisugano) — e continua na ArteLonga: analytics first-party em toda a rede (≈690 visitantes/mês, ≈1.800 eventos, 9 países), com geo embarcado, retenção e conversões, sem terceiros.

**Sistemas / Web — a nossa rede, ArteLonga.** A ArteLonga é um coletivo: uma rede de carreira, marca, tecnologia e comunicação. O que construímos é **inteligência escalável** — cada sistema nasce com um parceiro, roda na infraestrutura compartilhada da rede, e barateia o próximo. Três projetos, como notas técnicas:

- **artelonga** — parceiros: [Retro Umarizal](https://retroumarizal.com.br), [Quilombo Araucária](https://quilomboaraucaria.org), GRCS Amazônia. A plataforma em si, o **co**: site, quadro e jardim de cada parceiro num lugar só, guardados como arquivos de texto simples que o parceiro possui — banco, índice e site derivam dos arquivos, então o parceiro pode sair levando os dados quando quiser. Backend Rust/Axum, API REST + WebSocket com sync em tempo real, auth JWT, um shard SQLite isolado por parceiro com replicação LiteFS; frontend SvelteKit. Um parceiro novo entra no ar em minutos como subdomínio self-hosted, valida, e gradua pro domínio próprio — o Retro Umarizal já graduou. O modelo se estende a qualquer caso de uso — até o miguel, universo de uma pessoa só com universos de projeto como o mse, sobe na mesma API; cada conexão expande a rede para o próximo nicho.
- **rfq** — parceiro: Hedix, uma exchange de prediction markets. Inteligência de market making como API: serviço Rust/Axum + Tokio que precifica requests-for-quote e devolve cotações firmes, auto-accept, em uma única chamada de baixa latência — idempotente por client order id, auth API-key, documentado com OpenAPI/Swagger, com ambientes separados de staging e produção.
- **Neuro Notebook Brasil** — parceiro: Peggy Mason, Neurobiologia da Universidade de Chicago. Bibliografia colaborativa de neurociência: backend Node com API de feedback e registro sobre SQLite; bibliografia, rede de autores, linha do tempo e galeria renderizam no cliente a partir de dados estruturados.

O nosso código vive em [github.com/artelonga](https://github.com/artelonga).

Pra que a rede existe: colocar software que respeita privacidade e uma presença web de verdade ao alcance dos pequenos negócios e comunidades que as grandes plataformas deixam de fora.
