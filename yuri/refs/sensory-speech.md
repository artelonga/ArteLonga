---
title: Sensory speech — NLP em computadores e processamento de linguagem no cérebro
type: paper
kind: systems
lang: pt-BR
tkey: sensory-speech
category: neurociência
author: yuri
mine: true
created: "2023"
added: 2026-06-12
tags: [nlp, neurociência, sensoryspeech, linguagem, 2023]
significance: 'Quando descrevemos algo, parte da fala é sensorial: textura, peso, cor, temperatura. Quanto, e como medir isso de forma padronizada? Montei o processo que faz essa medição. No caminho, virou também um material de ensino, de Python a modelos de linguagem. Foi em 2023, no começo dos LLMs. Trabalho entre Neurobiologia e Linguística, na Universidade de Chicago.'
media:
  - kind: url
    url: https://neuro.artelonga.com.br/bibliografia?author=yuri
---

Um ensaio de 2023 ligando dois eixos — **como computadores processam linguagem
natural** (NLP) e **como o cérebro processa linguagem** — pela porta de entrada
das *referências sensoriais na fala*. É a aresta entre o
[SensorySpeech](https://github.com/yurisugano/SensorySpeech) (a engenharia) e o
[neuro](https://neuro.artelonga.com.br/bibliografia?author=yuri) (a
neurociência): a própria referência é o vínculo.

## A área sensorial da fala

Na divisão clássica da neurologia da linguagem, a fala tem um polo **motor**
(produção, associado à área de Broca, no lobo frontal) e um polo **sensorial**
ou **receptivo** (compreensão, associado à área de Wernicke, na junção
têmporo-parietal do hemisfério dominante). A lesão do polo sensorial produz a
afasia de Wernicke: fala fluente e gramatical, mas com escolha de palavras
prejudicada e compreensão comprometida — o sinal acústico chega, mas o
mapeamento para significado falha. O modelo de Wernicke–Lichtheim, e mais tarde
o modelo de **dois fluxos** (uma via dorsal para o mapeamento som→articulação e
uma via ventral para o mapeamento som→significado), enquadram a compreensão como
uma cadeia: do sinal acústico, às unidades fonológicas, às representações
lexicais e semânticas.

> [!quote] A questão do SensorySpeech
> Quando alguém descreve um objeto, quanto da fala é *sensorial* — textura,
> peso, temperatura, cor — e como medir isso de forma padronizada na fala
> natural?

## O paralelo com NLP

O pipeline que o SensorySpeech ensina e usa espelha, sem forçar a analogia, essa
cadeia de compreensão:

- **Tokenização e pré-processamento** (limpeza, *case-folding*, remoção de
  *stop words*, *stemming*/lemmatização) — segmentar o sinal contínuo em
  unidades discretas, como a análise fonológica segmenta a fala.
- **POS-tagging e vetorização** — atribuir papel gramatical e representar
  palavras como vetores, um análogo computacional do acesso lexical.
- **Word embeddings** (Word2Vec, transformers) — significado como *posição em um
  espaço*: palavras próximas em uso ficam próximas no vetor. É a versão de
  engenharia da intuição de que o significado de uma palavra é função das suas
  relações — eco distante da via ventral som→significado.
- **Clustering / topic modeling** — agrupar descrições por proximidade
  semântica, isolando a dimensão *sensorial* do resto.

A lição não é que o cérebro "roda" Word2Vec, e sim que tanto a engenharia quanto
a biologia convergem para representar **significado como geometria de relações**.
Word embeddings tornam essa ideia mensurável; a neurociência da área sensorial
da fala mostra onde, no tecido, o mapeamento som→significado pode falhar.

## 2023 — por que importa

O SensorySpeech foi escrito em 2023, nos primeiros dias da popularização dos
LLMs, como material de ensino: uma trilha que leva de *introdução a Python* a
*transformers*, aplicada a um problema real de pesquisa (Neurobiologia ×
Linguística, Universidade de Chicago). Ensinar os conceitos no momento em que o
público começava a usá-los — e ancorá-los numa pergunta de neurociência — é o
que torna esse trabalho um marco pessoal.

O código, a trilha de tutoriais e a análise estão importados, arquivo a arquivo,
num universo co privado (`nlp`) — cada entrada apontando pro
[original no GitHub](https://github.com/yurisugano/SensorySpeech).
