---
title: AWS — uma introdução pela experiência
lang: pt-BR
author: yuri
draft: false
tags: [tecnologia, aws, cloud, infraestrutura]
---

# AWS — uma introdução pela experiência

> Esta não é uma lista de serviços decorada da documentação. É o que aprendi
> operando uma plataforma de dados em tempo real na AWS — desde a coleta via
> WebSocket até o data lake consultável — por cerca de **US$ 155/mês**. Foco em
> ferramentas, decisões, custos e *postmortems*. Os detalhes de negócio ficam de
> fora; o que interessa aqui são as **lições que se transferem** para qualquer
> projeto na nuvem.

A AWS tem mais de 200 serviços. Ninguém usa 200. O segredo de uma boa
arquitetura não é conhecer todos — é saber **qual serviço resolve o quê, e
quando o custo de adicioná-lo passa a valer a pena**. Quase toda decisão abaixo
foi tomada escrevendo um *threshold* (um limiar objetivo) antes de migrar.

Leia como um tutorial: cada seção abaixo é uma decisão que você também vai enfrentar.

## Em resumo

- **A AWS não recompensa conhecer mais serviços — recompensa saber qual NÃO usar ainda**, com um limiar objetivo escrito *antes* de migrar.
- **S3 como fonte da verdade** torna banco e *streaming* opcionais (só se um consumidor exigir).
- **O custo escala com os requisitos, mas é estimável de antemão — sem surpresa.** Esta plataforma de dados real custou ~US$ 150/mês no teto de alta demanda; a maioria das cargas, muito menos.
- **Operação madura vence o serviço da moda**: 100% IaC, observabilidade em camadas, IAM *least-privilege*, e *postmortems* que viram regra.
- Os números de migração mais abaixo (DynamoDB→S3, −95%) são **um estudo de caso** — dependem dos requisitos de latência de cada caso, não são uma régua universal.

## 1. O mapa mental — a caixa de ferramentas

Penso na AWS em quatro camadas. Para cada problema, escolho o serviço *gerenciado*
mais simples até que um limiar concreto force a troca.

| Camada | Serviço | Para quê serve | Quando usei / evitei |
|---|---|---|---|
| **Compute** | **ECS + Fargate** | Rodar containers sem gerenciar máquina | Padrão para tudo. Zero manutenção de SO, auto-recovery, *startup* ~30s |
| | EC2 | Máquina virtual crua | Evitei — só compensa acima de ~20 *tasks* fixas ou com GPU |
| | Lambda | Função sob evento, sem servidor | Tarefas agendadas (reconciliação, compliance) via EventBridge |
| | EKS | Kubernetes gerenciado | Nunca justificado nessa escala — complexidade demais |
| **Storage** | **S3** | Object storage, a "fonte da verdade" | Coração de tudo. Durabilidade de 11 noves |
| | ECR | Registro de imagens Docker | Imagens dos coletores, com *lifecycle policy* |
| | DynamoDB | Banco NoSQL chave-valor | Migrei a maior parte para S3 (ver §3). Mantive só tabelas minúsculas e quentes |
| **Dados** | **Glue** | ETL serverless (Spark gerenciado) | ETL diário JSON → Parquet |
| | **Athena** | SQL sobre arquivos no S3 | Consulta o data lake, paga por byte lido |
| | EMR | Cluster Spark/Hadoop cru | Documentei, não usei — só vence acima de ~100 GB/dia |
| | MSK | Kafka gerenciado | Avaliei e recusei (ver §3) — Redpanda self-hosted no lugar |
| **Operações** | **CloudWatch** | Logs, métricas, alarmes, dashboards | Observabilidade inteira |
| | Secrets Manager | Credenciais e chaves | Segredos de API, rotação |
| | IAM | Permissões (quem pode o quê) | *Least privilege* — a fonte de metade dos bugs sutis (§5) |
| | EventBridge | Agendador / barramento de eventos | Cron de ETL, pipelines de compliance |

A intuição que ficou: **comece serverless e gerenciado, suba de degrau só com
um número na mão.** Fargate até ~20 *tasks*; Glue até ~100 GB/dia; DynamoDB
on-demand para tabelas pequenas. Escrever o limiar transforma "acho que está
caro" numa decisão objetiva.

## 2. O padrão que se repete — data lake sobre S3

A arquitetura que mais aprendi a confiar é simples e barata:

```
Coletores (Fargate) ──► S3 raw (JSON gzip) ──► Glue ETL diário ──► S3 processed (Parquet)
                                                                          │
                                                       Athena / DuckDB / Polars (consulta)
```

- **S3 como fonte única da verdade (SSOT).** Se o armazenamento durável já te dá
  11 noves de durabilidade, qualquer camada de banco ou *streaming* passa a ser
  **opcional** — só se justifica por *consumidores*, não por hábito.
- **Parquet + Snappy** no lugar de JSON: ~70-80% menor, colunar, com *predicate
  pushdown*. Uma consulta de 100M de registros caiu de 120s (JSON) para 15s (Parquet).
- **Partição por data** (`year=/month=/day=/`): o Athena pula partições
  irrelevantes e você paga só pelos bytes que realmente leu.

Adicionar uma fonte nova vira só registrar uma entrada no Terraform — não
reconstruir infraestrutura.

## 3. As decisões difíceis (trade-offs)

Arquitetura é a arte de **adiar e justificar compromissos caros**. Quatro
decisões que valeram a reflexão:

**Fargate vs EC2.** Para esse workload, EC2 era só ~13-20% mais barato — mas
custava 8+ passos de configuração (auto scaling group, *patching*, agente de
métricas, auto-recovery) contra 2 do Fargate. Valorizando meu tempo a US$ 50/h,
EC2 só passa a compensar acima de ~20 *tasks* em regime constante. **Lição:
custo de operação humana é custo real.**

**Glue vs EMR.** Glue é serverless e some quando o *job* termina. EMR (cluster
cru) só vence acima de ~100 GB/dia ou *jobs* de mais de 1h — aí fica 50-70% mais
barato, ainda mais com Spot. **Regra que adotei:** só migro se a alternativa for
>30% mais barata.

**MSK vs Redpanda vs S3-direto.** Kafka gerenciado (MSK) custava ~US$ 480-550/mês
para um cluster HA de 3 brokers, contra ~US$ 18 da abordagem atual. Como a
durabilidade *já estava resolvida pelo S3*, o Kafka só se justificava por ter
múltiplos consumidores em tempo real. Solução: uma **camada de abstração de
transporte** (`TRANSPORT_TYPE`) que deixa trocar S3 ↔ Redpanda ↔ MSK por
configuração. **Lição: abstraia o que você ainda não decidiu.**

**DynamoDB → S3 + Parquet — por que NÃO manter o DynamoDB.** A pergunta não foi
"como economizar", foi *"esse dado precisa de leitura por chave em
milissegundos?"*. Neste caso, **não**: os requisitos de latência do usuário não
exigiam acesso *single-digit ms* — as consultas eram analíticas, por faixa. Sem
essa exigência, o DynamoDB era custo sem benefício. Uma tabela de 322 GB / 226M
itens custava US$ 80,58/mês só de armazenamento; em S3+Parquet, ~US$ 4/mês
(**−95%**, ~157h de scan artesanal → **13 min** de export nativo). **Num cenário
onde a latência exigisse acesso por chave em ms, o DynamoDB se justificaria — e
pagaríamos os ~95% a mais conscientemente.** A lição não é "S3 é mais barato", é
**casar o serviço ao requisito real**. Dois aprendizados de ouro:

- **Ferramenta nativa vence script artesanal:** `export-table-to-point-in-time`
  levou **13 minutos** contra **~157 horas** estimadas de *scan* + paginação.
  Sempre procure o *bulk export* nativo antes de iterar na mão.
- **Padrão de migração segura:** exportar → verificar que as contagens batem →
  rodar em paralelo por 30 dias → só então deletar.

## 4. Custo — onde o dinheiro realmente vaza

O instinto errado é otimizar CPU. Os verdadeiros vazamentos estão em outro lugar:

- **Lifecycle de storage é a maior alavanca.** S3 transiciona sozinho:
  STANDARD (US$ 0,023/GB) → STANDARD_IA após 30d (-45%) → GLACIER após 90d
  (-83%) → DEEP_ARCHIVE após 365d. Configure no dia 1.
- **No Athena você paga por byte escaneado.** Particionar + filtrar no `WHERE` +
  selecionar só as colunas necessárias derrubou uma consulta de 1,8 TB → 50 MB,
  de US$ 10 para US$ 0,0003. Use agregações aproximadas (`APPROX_PERCENTILE`).
- **Custo de *request* é real.** Um coletor escrevendo 4 arquivos/min mesmo
  ocioso gerava ~170 mil PUTs/mês. Subir o intervalo de *flush* de 5s → 60s
  cortou para ~1 arquivo/min. **Agrupe suas escritas — o intervalo de flush é um
  botão de custo deliberado.**
- **Transferência de rede (NAT egress) pode passar o compute.** Num caso,
  US$ 58/mês de egress contra US$ 18 de Fargate. Otimizar CPU ali seria inútil.
- **Compressão compõe:** gzip no JSON (70-90%) e depois Parquet/Snappy (mais
  ~70%) reduzem armazenamento *e* custo de consulta ao mesmo tempo.

## 5. Postmortems — as histórias de guerra

Aqui mora o aprendizado de verdade. Casos generalizados:

**O circuit breaker que virou apagão permanente.** Uma *task* reiniciou
(suspeita de OOM) e subiu com estado defasado durante o *warmup*. Em ~300ms
acumulou 10 rejeições consecutivas e o *circuit breaker* (limiar = 10) travou
**de forma permanente**, exigindo reinício manual. **Lição: breakers precisam
tolerar o ruído de inicialização — um período de graça no *warmup* evita que um
soluço transitório vire uma queda definitiva.**

**IAM apertado demais, falha silenciosa.** O serviço emitia métricas sob um
*namespace* (vindo de um default hardcoded que ignorava a env var), mas a
política IAM só permitia outro *namespace* exato → `PutMetricData` negado em
silêncio, sem métricas justo durante um incidente. **Lição: mantenha IAM e
configuração da aplicação em sincronia, e prefira condições por prefixo a *match*
exato.**

**A configuração que não foi aplicada.** Tópicos Kafka criados com 1 partição
apesar da config pedir 12 — o *auto-create* sobrescreveu silenciosamente a
intenção, matando o paralelismo e criando um *backlog* de 323 mil mensagens.
**Lição: verifique que a config realmente *foi aplicada* no runtime.**

**O job agendado que falhava em silêncio.** Uma tarefa de reconciliação saía com
erro a cada 5 minutos (`No module named ...`) porque o módulo nunca foi incluído
na imagem. Ninguém percebeu por dias. **Lição: tarefas agendadas falham caladas —
dê a cada cron/EventBridge o seu próprio alarme.**

**Security group com `0.0.0.0/0`.** Pego em *review* antes do apply. **Lição:
revise sempre as regras default-permissivas de SG antes de subir.**

## 6. Operação no dia a dia

- **Tudo em IaC (Terraform).** Módulos reutilizáveis por serviço, deployments por
  ambiente. Um padrão de "*source map*" gera todos os recursos por fonte (IAM,
  log groups, alarmes, widgets) a partir de uma variável.
- **Logs estruturados em JSON** (Rust `tracing`, Python `structlog`) para que as
  *queries* do CloudWatch Insights funcionem em campos tipados. Cuidado com o
  "split-brain": se parte do código loga JSON e parte usa f-string, os filtros
  passam a casar com nada, silenciosamente.
- **Containers:** *multi-stage build*, usuário não-root, versões fixadas. Imagem
  Rust ~30 MB vs Python ~500 MB — importa para storage no ECR e *cold start*.
- **Monitoramento em camadas:** *metric filters* sobre logs → métricas custom →
  alarmes por fonte → um *composite alarm* que dispara para SNS → Slack + PagerDuty.
- **Segurança / credenciais:** Secrets Manager + IAM por fonte. Modos de *sandbox*
  recebem um ARN de segredo **vazio**, de forma que o IAM *fisicamente* bloqueia o
  acesso a credenciais reais (defesa em profundidade). Nunca logue *headers* de
  auth — só IDs de chave e o resultado.

## 7. Princípios (o que fica)

Destilando, para quem está começando:

1. **S3 como fonte da verdade** simplifica o resto — banco e streaming são opcionais até um consumidor exigir.
2. **Serverless/gerenciado até um limiar concreto** que você escreve *antes* de migrar.
3. **Custo mora em storage lifecycle, bytes lidos, request count e egress** — não na CPU.
4. **Ferramenta nativa de bulk vence script artesanal** (700× no meu caso).
5. **IAM least-privilege + config em sincronia** — e verifique que a config foi *aplicada* no runtime.
6. **Resiliência: circuit breakers toleram o warmup; todo cron tem alarme próprio** (falha calada mata).
7. **Abstraia o que ainda não decidiu** — uma camada de transporte adia compromissos caros.

> A AWS não recompensa quem conhece mais serviços. Recompensa quem sabe **qual
> não usar ainda** — e tem o número na mão para provar.
