/* Arte Longa · finances data module
 * AUTO-GENERATED: do not edit by hand. Run `node tools/bake-finances.mjs`.
 */
(function (global) {
    "use strict";
    global.AL = global.AL || {};
    // AUTO-GENERATED:FINANCES-START
    global.AL.finances =     {
      "currency": "BRL",
      "quarter": "Q2 2026",
      "metaMensal": 25000,
      "metaQ2": 75000,
      "custos": [
        {
          "key": "socios",
          "label": "Sócios · pro labore",
          "value": 12000,
          "detail": "6 pessoas × R$ 2.000",
          "breakdown": [
            {
              "label": "Yuri",
              "value": 2000,
              "handle": "yuri"
            },
            {
              "label": "Igo",
              "value": 2000,
              "handle": "igo"
            },
            {
              "label": "José Antônio",
              "value": 2000,
              "handle": "joseantonio"
            },
            {
              "label": "Mono",
              "value": 2000,
              "handle": "mono"
            },
            {
              "label": "Luke",
              "value": 2000,
              "handle": "luke"
            },
            {
              "label": "Marina",
              "value": 2000,
              "handle": "marina"
            }
          ]
        },
        {
          "key": "contabilidade",
          "label": "Contabilidade",
          "value": 1612,
          "detail": "1 salário mínimo · coberto pela receita de API Development (Hedix)"
        },
        {
          "key": "operacional",
          "label": "Despesas operacionais",
          "value": 1388,
          "breakdown": [
            {
              "label": "Produtos",
              "value": 500
            },
            {
              "label": "Serviços",
              "value": 888
            }
          ]
        },
        {
          "key": "coworking",
          "label": "Coworking · escritório",
          "value": 3000
        },
        {
          "key": "infra",
          "label": "Armazenamento e computação",
          "value": 2000
        },
        {
          "key": "impacto",
          "label": "Impacto ambiental, social e cultural",
          "value": 3000,
          "detail": "investimento ativo em rede — também via trabalho pro-bono"
        },
        {
          "key": "reserva",
          "label": "Reserva · imprevistos",
          "value": 2000,
          "detail": "buffer pra variações de receita e custos"
        }
      ],
      "receita": {
        "recorrenteMensal": [
          {
            "label": "Desenvolvimento de API",
            "client": "Hedix",
            "detail": "16,12 h/mês × R$ 100/h — cobre a contabilidade",
            "responsavel": "yuri",
            "mensal": 1612,
            "solucoes": [
              "hedix-solution"
            ]
          },
          {
            "label": "Consultoria em TI (outros clientes)",
            "detail": "23,88 h/mês × R$ 100/h (40h/mês total, menos Hedix)",
            "responsavel": "yuri",
            "mensal": 2388,
            "solucoes": [
              "co",
              "yggdrasil",
              "quilomboaraucaria-solution"
            ]
          },
          {
            "label": "Criação de Conteúdo",
            "detail": "1 job fixo / mês",
            "responsavel": "bruna",
            "mensal": 1000,
            "solucoes": [
              "artelonga"
            ]
          }
        ],
        "rampa": [
          {
            "label": "Market Making (Hedix)",
            "client": "Hedix",
            "detail": "prediction markets — rampa de crescimento",
            "responsavel": "yuri",
            "meses": [
              {
                "mes": "abril",
                "value": 1000
              },
              {
                "mes": "maio",
                "value": 5000
              },
              {
                "mes": "junho",
                "value": 10000
              }
            ],
            "solucoes": [
              "hedix-solution"
            ]
          }
        ],
        "projetos": [
          {
            "label": "Website estático",
            "detail": "3 × R$ 5.000",
            "unitValue": 5000,
            "unidades": 3,
            "responsavel": "yuri",
            "solucoes": [
              "artelonga"
            ]
          },
          {
            "label": "Website dinâmico",
            "detail": "1 projeto",
            "unitValue": 15000,
            "unidades": 1,
            "responsavel": "yuri",
            "solucoes": [
              "co",
              "quilomboaraucaria-solution"
            ]
          },
          {
            "label": "Interpretação",
            "detail": "2 jobs × R$ 2.000/dia (live · simultânea)",
            "unitValue": 2000,
            "unidades": 2,
            "responsavel": "yuri"
          },
          {
            "label": "Consultoria avulsa",
            "detail": "10 h × R$ 100/h (no trimestre)",
            "unitValue": 100,
            "unidades": 10,
            "responsavel": "yuri"
          },
          {
            "label": "Serviços",
            "detail": "90 h × R$ 100/h · outros sócios (no trimestre)",
            "unitValue": 100,
            "unidades": 90
          }
        ],
        "proBono": [
          {
            "label": "Desenvolvimento Web — Quilombo Araucária",
            "detail": "portfolio institucional · impacto social, ambiental e cultural",
            "responsavel": "yuri",
            "solucoes": [
              "quilomboaraucaria-solution"
            ]
          }
        ]
      }
    };
    // AUTO-GENERATED:FINANCES-END
})(typeof window !== "undefined" ? window : globalThis);
