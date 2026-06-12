/* yuri/system-graph.js — duas linhas paralelas que crescem (Sistemas/Web · Dados).
 *
 * Linguagem visual (UM esquema simples, 5 categorias):
 *   • origin       = âncora (ArteLonga / Yuri) — tinta cheia, círculo grande.
 *   • organizacao  = TODA org externa (cliente/parceiro/empregador) — creme, borda tracejada.
 *   • system       = TODO sistema nosso (serviço/universo/plataforma co) — creme, borda sólida.
 *   • lead         = prospecto futuro — creme, borda pontilhada verde.
 *   • work         = publicação/patente (só na faixa Dados) — ponto pequeno.
 *   Ambas as faixas são EIXOS VERTICAIS de tempo (topo→baixo cronológico).
 *   Legenda revela progressivamente: só aparece o que já foi revelado nos slides.
 *
 * API: window.SystemGraph.mount(container, { lang, track, tabs }) -> { destroy() }
 *   tabs:false  → trava a faixa e esconde as abas (usado no modo empilhado A/B). */
(function () {
  "use strict";

  var I18N = {
    "pt-BR": {
      trackWeb: "Sistemas / Web", trackData: "Dados",
      catOrigin: "origem", catSystem: "sistema", catOrg: "organização",
      catLead: "lead (futuro)", catWork: "publicação · patente",
      stack: "stack", open: "visitar ↗", prev: "‹ antes", next: "depois ›",
      total: "total", services: "serviços web", partners: "parceiros",
      growth: "crescimento", commits: "commits", prs: "PRs",
      growthCap: "eixo y: cada série normalizada ao seu próprio máximo (escala arbitrária) — a forma é o sinal; passe o mouse pra ver os números reais.",
      hint: "passe o mouse num nó pra ler · clique pra visitar · clique no vazio (ou ›) pra avançar",
      hintTouch: "toque num nó pra ler · ‹ › pra avançar",
      refs: "referências:"
    },
    "en": {
      trackWeb: "Systems / Web", trackData: "Data",
      catOrigin: "origin", catSystem: "system", catOrg: "organization",
      catLead: "lead (future)", catWork: "publication · patent",
      stack: "stack", open: "visit ↗", prev: "‹ before", next: "after ›",
      total: "total", services: "web services", partners: "partners",
      growth: "growth", commits: "commits", prs: "PRs",
      growthCap: "y-axis: each series normalized to its own max (arbitrary scale) — the shape is the signal; hover to read the real numbers.",
      hint: "hover a node to read · click to visit · click empty (or ›) to advance",
      hintTouch: "tap a node to read · ‹ › to advance",
      refs: "references:"
    }
  };

  // crescimento ao longo do tempo — CUMULATIVO REAL, medido em 2026-06-01 via git/gh
  // (11 repos da rede). Commits: git log por mês. PRs: gh pr list (merged) por mês.
  var GROWTH = {
    // idx = ano*12+mês → eixo PROPORCIONAL ao tempo real (mostra o vão de 2025). c=commits, p=PRs, a=parceiros (cumulativo)
    pts: [
      { l: "out24", idx: 24298, c: 43, p: 1, a: 1 },
      { l: "nov24", idx: 24299, c: 83, p: 1, a: 1 },
      { l: "dez24", idx: 24300, c: 87, p: 1, a: 1 },
      { l: "jan26", idx: 24313, c: 123, p: 1, a: 1 },
      { l: "mar26", idx: 24315, c: 152, p: 1, a: 2 },
      { l: "abr26", idx: 24316, c: 636, p: 39, a: 3 },
      { l: "mai26", idx: 24317, c: 1417, p: 267, a: 3 }
    ],
    proj: { l: "jun26", idx: 24318, c: 2200, p: 495, a: 6 },   // PREVISÃO de junho (ritmo de maio) → segmento tracejado
    labels: ["out24", "jan26", "mar26", "abr26", "mai26", "jun26"],
    markIdx: 24315   // início da curva forte (mar / Q2 2026)
  };
  var COMMITS_TOTAL = "1.473", PRS_TOTAL = "286";
  var SERVICE_LIST = ["co", "web hosting", "comunicação", "yggdrasil", "neuroanatomy", "rfq", "neuro", "hostinger", "yuri"];   // 9 web services (Retro = parceiro, não serviço)
  // orgs/clientes ÚNICOS atuais (quilombo, hfs, hedix, retro) + neuro notebook. Linkam pro artelonga.
  var PARTNER_LIST = [
    { n: "Quilombo Araucária", u: "https://artelonga.com.br/quilomboaraucaria/" },
    { n: "HFS Associados", u: "https://artelonga.com.br/hfsassociados/" },
    { n: "Hedix", u: "https://artelonga.com.br/hedix/" },
    { n: "Retro Umarizal", u: "https://artelonga.com.br/retro-umarizal/" },
    { n: "Neuro Notebook Brasil", u: "https://neuro.artelonga.com.br/" },
    { n: "CCA Projeto Vida", u: "https://voluntarios.com.br/entidade/3257" }
  ];   // 6 organizações/clientes atuais

  // ── faixa SISTEMAS / WEB (eixo vertical de tempo: ArteLonga → Quilombo → co → tudo) ──
  function webModel() {
    var nodes = [
      // âncora (topo)
      { id: "arte", lp: "right", label: "ArteLonga", cat: "origin", step: 0, url: "https://artelonga.com.br",
        repo: "https://github.com/artelonga/home",
        stack: "Vite · Markdown · GitHub Pages",
        desc: { "pt-BR": "Na ArteLonga nós construímos: é a nossa rede de carreira, marca, tecnologia e comunicação, e a origem de tudo que vem depois.",
                "en": "At ArteLonga we build: it's our network for career, brand, technology and communication, and the origin of everything that follows." } },
      // 1º cliente: Quilombo (web hosting), ANTES do co
      { id: "quilombo", lp: "right", label: "Quilombo", title: "Quilombo Araucária", cat: "organizacao", step: 1, url: "https://quilomboaraucaria.org",
        desc: { "pt-BR": "Quilombo Araucária — cliente comunitário e o primeiro site que hospedamos: espaço de resistência cultural, social e ambiental na periferia de São Paulo.",
                "en": "Quilombo Araucária — community client and the first site we hosted: a space of cultural, social and environmental resistance in São Paulo's periphery." } },
      // a plataforma — tudo depois pendura aqui
      { id: "co", lp: "right", label: "co", cat: "system", step: 2, url: "https://co.artelonga.com.br",
        repo: "https://github.com/artelonga/co",
        stack: "Rust · Axum · SvelteKit · LiteFS",
        desc: { "pt-BR": "co — a plataforma que construímos na ArteLonga: uma identidade e uma fatura só, software livre (GPL) pra pequenos negócios. Todo sistema novo nós subimos nela.",
                "en": "co — the platform we build at ArteLonga: one identity, one bill, free software (GPL) for small businesses. Every new system we run on it." } },
      // sistemas (nossos) que sobem no co
      { id: "rfq", label: "rfq", cat: "system", step: 3, url: "https://rfq.artelonga.com.br/health",
        stack: "Rust · Axum",
        desc: { "pt-BR": "rfq — nós somos o market maker: produzimos quotes e servimos uma API de request-for-quote, provendo liquidez pra prediction markets. RFQ é prover liquidez (market making) — o mesmo papel que a Arte Longa tem com serviços.",
                "en": "rfq — we are the market maker: we produce quotes and serve a request-for-quote API, providing liquidity to prediction markets. RFQ is liquidity provision (market making) — the same role Arte Longa plays for services." } },
      { id: "hedix", label: "Hedix", cat: "organizacao", step: 3, url: "https://hedix.com.br/",
        desc: { "pt-BR": "Hedix — o prediction market (o mercado) que atendemos: eles são o mercado, nós provemos a liquidez via rfq.",
                "en": "Hedix — the prediction market (the market) we serve: they are the market, we provide the liquidity via rfq." } },
      { id: "ygg", label: "yggdrasil", cat: "system", step: 4, url: "https://yggdrasil.artelonga.com.br",
        repo: "https://github.com/artelonga/yggdrasil",
        stack: "Rust · Axum · Godot 4 · WASM",
        desc: { "pt-BR": "yggdrasil — nossa game engine Godot 4 / WASM no navegador: jogos que abrem numa aba, sem instalar.",
                "en": "yggdrasil — our web-based Godot 4 / WASM game engine: games that open in a tab, nothing to install." } },
      { id: "comunicacao", label: "comunicação", cat: "system", step: 5, url: "https://yggdrasil.artelonga.com.br/universos/comunicacao",
        stack: "Rust · Godot 4 · WASM",
        desc: { "pt-BR": "comunicação — línguas ancestrais (Mbyá Guarani, Yorùbá) que ensinamos através da cultura e da história, ligadas ao Quilombo Araucária.",
                "en": "comunicação — ancestral languages (Mbyá Guarani, Yorùbá) we teach through culture and history, tied to Quilombo Araucária." } },
      { id: "neuro", label: "neuro", cat: "system", step: 6, url: "https://neuro.artelonga.com.br",
        stack: "Godot 4 · WASM · Node",
        desc: { "pt-BR": "neuro — uma bibliografia de neurociência aberta e o atlas neuroanatomy (cérebro pra aprender brincando) que construímos com o Neuro Notebook Brasil.",
                "en": "neuro — an open neuroscience bibliography and the neuroanatomy atlas (a playable brain) we built with Neuro Notebook Brasil." } },
      { id: "nnb", label: "Neuro Notebook", slabel: "NNB", title: "Neuro Notebook Brasil", cat: "organizacao", step: 6,
        desc: { "pt-BR": "Neuro Notebook Brasil — comunidade de neurociência, nosso parceiro no neuro.",
                "en": "Neuro Notebook Brasil — neuroscience community, our partner on neuro." } },
      // a aresta: o nó entre os dois eixos (neurociência ↔ tecnologia)
      { id: "nlp", lp: "below", label: "nlp", title: "nlp — a aresta neuro↔tech", cat: "system", step: 6, url: "https://yuri.artelonga.com.br/?e=sensory-speech",
        stack: "Python · NLP · SensorySpeech (2023)",
        desc: { "pt-BR": "nlp — o nó entre o eixo da neurociência e o da tecnologia: o SensorySpeech (2023) importado no co, ligando o PLN em máquinas ao processamento de linguagem no cérebro. A aresta É a referência. Universo privado; o link abre o artigo-ponte.",
                "en": "nlp — the node between the neuroscience and technology axes: SensorySpeech (2023) imported into co, linking NLP in machines to language processing in the brain. The edge IS the reference. Private universe; the link opens the bridge article." } },
      { id: "hfs", lp: "left", label: "HFS", title: "HFS Associados", cat: "organizacao", step: 2, url: "https://hfsassociados.com.br/",
        desc: { "pt-BR": "HFS Associados — contabilidade, fiscal e jurídico, nosso parceiro na ArteLonga.",
                "en": "HFS Associados — accounting, tax and legal, our partner at ArteLonga." } },
      // "agora" — clientes atuais que sobem na hora (web hosting as a service)
      { id: "retroum", label: "Retro Umarizal", slabel: "Retro", cat: "organizacao", step: 7, url: "https://retroumarizal.com.br",
        stack: "Hostinger Horizons",
        desc: { "pt-BR": "Retro Umarizal — restaurante, o primeiro cliente que graduamos: validamos num MVP self-hosted (em 24h) e convertemos pro domínio próprio na Hostinger Horizons (retroumarizal.com.br). A nossa prova de que o funil escala.",
                "en": "Retro Umarizal — restaurant, the first customer we graduated: we validated it on a self-hosted MVP (in 24h) and converted it to its own Hostinger Horizons domain (retroumarizal.com.br). Our proof the funnel scales." } },
      { id: "yurisurf", label: "yuri", cat: "system", step: 7, url: "/yuri/",
        repo: "https://github.com/artelonga/ArteLonga",
        desc: { "pt-BR": "yuri — este é o meu portfólio, que servimos como subdomínio no co (vive no universo de conteúdo ArteLonga).",
                "en": "yuri — this is my portfolio, which we serve as a subdomain on co (lives in the ArteLonga content universe)." } },
      { id: "hostinger", label: "hostinger", title: "Hostinger — estudo de caso", cat: "system", step: 7, url: "https://hostinger.artelonga.com.br/",
        desc: { "pt-BR": "Estudo de caso Hostinger — a minha candidatura a Data Analyst, com as estatísticas e insights desta rede. Clique pra abrir.",
                "en": "Hostinger case study — my Data Analyst application, with the stats and insights from this network. Click to open." } },
      { id: "cca", lp: "below", label: "CCA Projeto Vida", slabel: "CCA", title: "CCA Projeto Vida", cat: "organizacao", step: 7, url: "https://voluntarios.com.br/entidade/3257",
        desc: { "pt-BR": "CCA Projeto Vida — assistência social; nosso parceiro desde jun 2026.",
                "en": "CCA Projeto Vida — social assistance; our partner since jun 2026." } },
      // futuro — pilha sobreposta faded = "muito mais" (negócio horizontalmente escalável)
      { id: "lead1", label: "", cat: "lead", ghost: true, step: 7, desc: { "pt-BR": "", "en": "" } },
      { id: "lead2", label: "", cat: "lead", ghost: true, step: 7, desc: { "pt-BR": "", "en": "" } },
      { id: "lead3", label: "[…] + muito mais", title: "muito mais a caminho", cat: "lead", ghost: true, step: 7,
        desc: { "pt-BR": "Muito mais a caminho — cada parceiro nós subimos na hora (MVP self-hosted) e graduamos pra Hostinger. Custo cada vez menor, escala horizontal sem fim.",
                "en": "Much more to come — each partner we take live instantly (a self-hosted MVP) then graduate to Hostinger. Ever-lower cost, endless horizontal scale." } }
    ];
    var edges = [
      { a: "arte", b: "quilombo", type: "partner" },
      { a: "quilombo", b: "co", type: "builds" },
      { a: "co", b: "hfs", type: "partner" },
      { a: "co", b: "rfq", type: "builds" },
      { a: "rfq", b: "hedix", type: "partner" },
      { a: "co", b: "ygg", type: "builds" },
      { a: "co", b: "comunicacao", type: "builds" },
      { a: "comunicacao", b: "quilombo", type: "partner", bow: -430 },
      { a: "co", b: "neuro", type: "builds" },
      { a: "neuro", b: "nnb", type: "partner" },
      { a: "neuro", b: "nlp", type: "iaas", lt: 0.62, label: { "pt-BR": "aresta", "en": "bridge" } },
      { a: "co", b: "retroum", type: "partner" },
      { a: "co", b: "yurisurf", type: "builds" },
      { a: "co", b: "hostinger", type: "builds" },
      { a: "co", b: "cca", type: "partner" }
    ];
    var steps = [
      { year: { "pt-BR": "out 2024", "en": "oct 2024" }, focus: "arte",
        title: { "pt-BR": "ArteLonga", "en": "ArteLonga" },
        body: { "pt-BR": "Na ArteLonga nós construímos: é a nossa rede de carreira, marca, tecnologia e comunicação, e a origem de tudo que vem depois.",
                "en": "At ArteLonga we build: it's our network for career, brand, technology and communication, and the origin of everything that follows." } },
      { year: { "pt-BR": "out 2024", "en": "oct 2024" }, focus: "quilombo",
        title: { "pt-BR": "Quilombo — primeiro cliente", "en": "Quilombo — first client" },
        body: { "pt-BR": "Nosso primeiro trabalho: hospedar e manter o site do Quilombo Araucária, cliente comunitário. É daqui que nasce a nossa ideia da plataforma.",
                "en": "Our first job: hosting and running the site for Quilombo Araucária, a community client. This is where our idea for the platform is born." } },
      { year: { "pt-BR": "mar 2026", "en": "mar 2026" }, focus: "co",
        title: { "pt-BR": "co — a plataforma", "en": "co — the platform" },
        body: { "pt-BR": "co — a plataforma que construímos na ArteLonga: uma identidade e uma fatura só, software livre (GPL) pra pequenos negócios. A partir daqui, todo sistema novo nós subimos nela.",
                "en": "co — the platform we build at ArteLonga: one identity and one bill, free software (GPL) for small businesses. From here on, we run every new system on it." } },
      { year: { "pt-BR": "abr 2026", "en": "apr 2026" }, focus: "rfq",
        title: { "pt-BR": "rfq", "en": "rfq" },
        body: { "pt-BR": "rfq — somos o market maker pra prediction markets: produzimos quotes e servimos uma API de request-for-quote (liquidez), tendo o Hedix como o mercado que atendemos. Nosso primeiro sistema no co.",
                "en": "rfq — we are the market maker for prediction markets: we produce quotes and serve a request-for-quote API (liquidity), with Hedix as the market we serve. Our first system on co." } },
      { year: { "pt-BR": "mai 2026", "en": "may 2026" }, focus: "ygg",
        title: { "pt-BR": "yggdrasil", "en": "yggdrasil" },
        body: { "pt-BR": "yggdrasil — nossa game engine Godot 4 / WASM no navegador: jogos que abrem numa aba, sem instalar.",
                "en": "yggdrasil — our web-based Godot 4 / WASM game engine: games that open in a tab, nothing to install." } },
      { year: { "pt-BR": "jun 2026", "en": "jun 2026" }, focus: "comunicacao",
        title: { "pt-BR": "comunicação", "en": "comunicação" },
        body: { "pt-BR": "comunicação — línguas ancestrais (Mbyá Guarani, Yorùbá) que ensinamos através da cultura e da história, ligadas ao Quilombo Araucária.",
                "en": "comunicação — ancestral languages (Mbyá Guarani, Yorùbá) we teach through culture and history, tied to Quilombo Araucária." } },
      { year: { "pt-BR": "jun 2026", "en": "jun 2026" }, focus: "neuro",
        title: { "pt-BR": "neuro", "en": "neuro" },
        body: { "pt-BR": "neuro — uma bibliografia de neurociência pública e o atlas neuroanatomy que construímos com o Neuro Notebook Brasil.",
                "en": "neuro — a public neuroscience bibliography and the neuroanatomy atlas we built with Neuro Notebook Brasil." } },
      { year: { "pt-BR": "hoje", "en": "today" }, focus: null,
        title: { "pt-BR": "Agora — escala horizontal", "en": "Now — horizontal scale" },
        body: { "pt-BR": "Pra nós, adicionar um cliente é instantâneo: subimos como subdomínio (MVP self-hosted), validamos, e graduamos pra Hostinger. O Retro Umarizal nós já graduamos (retroumarizal.com.br) — e temos muitos mais a caminho. O gráfico mostra o nosso crescimento.",
                "en": "For us, adding a customer is instant: we take it live as a subdomain (a self-hosted MVP), validate, then graduate it to Hostinger. We already graduated Retro Umarizal (retroumarizal.com.br) — and we have many more to come. The chart shows our growth." },
        growth: true }
    ];
    // árvore vertical (org-chart): espinha arte→quilombo→co no centro; sistemas
    // descem do co em linhas por época; parceiros penduram AO LADO do seu sistema.
    var pos = {
      arte: [0, -300],
      quilombo: [0, -220],
      co: [0, -140],
      hfs: [-260, -140],
      rfq: [-150, -40], hedix: [-310, -40],
      ygg: [160, 20],
      comunicacao: [-300, 80],
      neuro: [100, 150], nnb: [365, 150], nlp: [330, 235],
      retroum: [-270, 235], cca: [-85, 235], yurisurf: [45, 235], hostinger: [195, 235],
      lead1: [375, 295], lead2: [391, 308], lead3: [407, 322]
    };
    return { key: "web", nodes: nodes, edges: edges, steps: steps, pos: pos };
  }

  // ── faixa DADOS (2012→) · eixo vertical: Yuri no topo, orgs cronológicas descendo ──
  function dataModel() {
    var nodes = [
      // âncora (topo) — espelha a ArteLonga no web
      { id: "yuri", lp: "right", label: "Yuri", cat: "origin", step: 0, url: "https://github.com/yurisugano",
        desc: { "pt-BR": "Eu sou neurocientista e cientista de dados — a prática que percorre a minha pesquisa, indústria e quant.",
                "en": "I'm a neuroscientist and data scientist — the practice that runs through my research, industry and quant." } },
      // organizações (spine à esquerda) — MESMO esquema das orgs do web
      { id: "ibusp", lp: "left", label: "IB-USP", title: "Instituto de Biociências — USP", cat: "organizacao", step: 0,
        desc: { "pt-BR": "IB-USP — Instituto de Biociências da USP: o meu primeiro nó, a casa acadêmica de onde parti. Aqui nasceu o meu primeiro projeto de dados — a pesquisa de público nos museus — e a origem das minhas visualizações: as figuras em R que publiquei nos artigos saíram daqui.",
                "en": "IB-USP — University of São Paulo's Biosciences Institute: my first node, the academic home I set out from. Where my first data project began — the museum audience research — and the origin of my data visualization: the R figures I published in the papers came from here." } },
      { id: "butantan", lp: "left", label: "Butantan", title: "Instituto Butantan", cat: "organizacao", step: 1, url: "https://bv.fapesp.br/pt/bolsas/134702/origem-e-evolucao-das-serpentes-e-sua-diversificacao-na-regiao-neotropical/",
        desc: { "pt-BR": "Instituto Butantan (2012), onde fui bolsista FAPESP — o meu primeiro cliente de dados: pesquisa de público no Museu Biológico do Butantan e no Museu de Zoologia da USP, aplicando questionários e analisando a variação no número de visitantes pra traçar o perfil do público e avaliar a adequação das exposições de longa e curta duração. Orientação de Erika Hingst-Zaher. Foi aqui que comecei a coletar dados de campo.",
                "en": "Instituto Butantan (2012), where I was a FAPESP scholar — my first data client: audience research at Butantan's Biological Museum and USP's Museum of Zoology, running questionnaires and analyzing visitor-count variation to profile the public and assess how well the long- and short-run exhibitions landed. Advised by Erika Hingst-Zaher. This is where I began collecting field data." } },
      { id: "uchicago", lp: "left", label: "U. Chicago", title: "University of Chicago — Neurobiology", cat: "organizacao", step: 2, url: "https://artelonga.com.br/universidade-de-chicago/",
        desc: { "pt-BR": "University of Chicago (2015–2022) — onde fui Research Assistant em Neurobiologia: eu fiz aquisição, armazenamento e gestão de dados, e compliance HIPAA.",
                "en": "University of Chicago (2015–2022) — where I was a Research Assistant in Neurobiology: I did data acquisition, storage and management, and HIPAA compliance." } },
      { id: "propz", lp: "left", label: "Propz", cat: "organizacao", step: 3, url: "https://rockencantech.com.br/",
        desc: { "pt-BR": "Propz (2023) — onde fiz inteligência analítica para varejo, em escala sobre Apache Spark e Delta Lake.",
                "en": "Propz (2023) — where I did retail analytical intelligence, at scale on Apache Spark and Delta Lake." } },
      { id: "pointset", lp: "left", label: "PointSet", cat: "organizacao", step: 4, url: "https://www.pointset.tech/",
        desc: { "pt-BR": "PointSet (2024–2026) — finanças quantitativas; o meu trabalho de quant, até eu sair da posição em 2026.",
                "en": "PointSet (2024–2026) — quantitative finance; my quant work, until I left the position in 2026." } },
      { id: "co", lp: "left", label: "co", title: "co — ArteLonga", cat: "organizacao", step: 5, url: "https://co.artelonga.com.br",
        desc: { "pt-BR": "co (ArteLonga, 2025→) — a minha organização mais recente: ofereço privacidade e segurança de dados como serviço para pequenos negócios.",
                "en": "co (ArteLonga, 2025→) — my most recent organization: I offer data privacy and security as a service for small businesses." } },
      // sistemas de dados (direita) — alinhados horizontalmente à org que os entregou (cronológico)
      { id: "collect", lp: "right", label: { "en": "data collection", "pt-BR": "coleta de dados" }, title: "Data collection", cat: "system", step: 1,
        stack: "campo · laboratório",
        desc: { "pt-BR": "Coleta de dados — eu adquiri dados de campo e laboratório no Instituto Butantan.",
                "en": "Data collection — I acquired field and lab data at Instituto Butantan." } },
      { id: "dataviz", lp: "right", label: { "en": "data visualization", "pt-BR": "visualização de dados" }, title: "Data visualization", cat: "system", step: 0,
        url: "https://github.com/yurisugano/Dehydration-Behavior-Toads-Analysis", repo: "https://github.com/yurisugano/Dehydration-Behavior-Toads-Analysis", stack: "R · ggplot",
        img: "https://raw.githubusercontent.com/yurisugano/Dehydration-Behavior-Toads-Analysis/main/figures/Fig5_ProportionMoving.png",
        desc: { "pt-BR": "Visualização de dados — figuras que eu gerei em R (ggplot) e publiquei nos artigos, no IB-USP. Deixei o código da análise aberto (ex.: \"behavioral shift in invasive toads\") no GitHub.",
                "en": "Data visualization — figures I generated in R (ggplot) and published in the papers, at IB-USP. I open-sourced the analysis code (e.g. \"behavioral shift in invasive toads\") on GitHub." } },
      { id: "storage", lp: "right", label: { "en": "storage & management", "pt-BR": "armazenamento e gestão" }, title: "Data storage & management", cat: "system", step: 2,
        stack: "SQL · pipelines",
        desc: { "pt-BR": "Armazenamento e gestão de dados — eu modelei, guardei e versionei datasets de pesquisa em escala, na University of Chicago.",
                "en": "Data storage & management — I modeled, stored and versioned research datasets at scale, at the University of Chicago." } },
      { id: "hipaa", lp: "right", label: { "en": "HIPAA compliance", "pt-BR": "conformidade HIPAA" }, title: "HIPAA compliance", cat: "system", step: 2,
        url: "/yuri/uncovering-human-proprioceptive-function-and-malfunction.pdf", stack: "governança · PHI",
        desc: { "pt-BR": "Conformidade HIPAA — eu fiz a governança de dados sensíveis de saúde (PHI) na minha tese de conclusão da University of Chicago, \"Uncovering human proprioceptive function and malfunction\" (2022), com dados proprietários de sujeitos humanos. Clique pra abrir a tese (PDF).",
                "en": "HIPAA compliance — I handled the governance of sensitive health data (PHI) in my University of Chicago senior thesis, \"Uncovering human proprioceptive function and malfunction\" (2022), built on proprietary human-subjects data. Click to open the thesis (PDF)." } },
      { id: "retailint", lp: "right", label: { "en": "retail intelligence", "pt-BR": "inteligência de varejo" }, title: "Inteligência analítica para varejo", cat: "system", step: 3,
        stack: "Apache Spark · Delta Lake",
        desc: { "pt-BR": "Inteligência analítica para varejo — eu fiz analytics em escala sobre Apache Spark e Delta Lake (na Propz).",
                "en": "Retail analytical intelligence — I did analytics at scale on Apache Spark and Delta Lake (at Propz)." } },
      { id: "quant", lp: "right", label: { "en": "quant", "pt-BR": "quant" }, title: "Quant", cat: "system", step: 4, url: "https://rfq.artelonga.com.br/health",
        stack: "Python · quant",
        desc: { "pt-BR": "Quant — eu fiz inteligência quantitativa para finanças, na PointSet; é o meu lado-dados que alimenta o rfq no web.",
                "en": "Quant — I did quantitative intelligence for finance, at PointSet; it's my data side that feeds rfq on the web." } },
      { id: "privsec", lp: "right", label: { "en": "privacy & security", "pt-BR": "privacidade e segurança" }, title: "Data privacy & security", cat: "system", step: 5, url: "https://co.artelonga.com.br",
        stack: "Rust · LiteFS · GPL",
        desc: { "pt-BR": "Privacidade e segurança de dados — o topo do meu espectro: cada cliente é dono dos seus dados, isolados por design, no co (ArteLonga).",
                "en": "Data privacy & security — the top of my spectrum: each client owns their data, isolated by design, on co (ArteLonga)." } },
      // publicações / patente (esquerda, ligadas à University of Chicago) — pontos pequenos
      { id: "bystander", label: "bystander", title: "The Bystander Effect in Rats", cat: "work", step: 2, url: "https://github.com/yurisugano/Bystander-Effect-Rat-Analysis",
        desc: { "pt-BR": "The Bystander Effect in Rats — Science Advances (2020). Eu fiz a análise em R e deixei o código aberto no GitHub.",
                "en": "The Bystander Effect in Rats — Science Advances (2020). I did the analysis in R and open-sourced it on GitHub." } },
      { id: "helping", label: "helping", title: "Helping Is Motivated by Non-Affective Cues in Rats", cat: "work", step: 2, url: "https://github.com/yurisugano/NonAffective-Empathy-Behavior-Rat-Analysis",
        desc: { "pt-BR": "Helping Is Motivated by Non-Affective Cues in Rats (2022). Eu fiz a análise em R/Quarto e deixei o código aberto no GitHub.",
                "en": "Helping Is Motivated by Non-Affective Cues in Rats (2022). I did the analysis in R/Quarto and open-sourced it on GitHub." } },
      { id: "theseo", label: "Theseometer", title: "Theseometer (patente)", cat: "work", step: 2, url: "https://patents.google.com/patent/US11589798B2/en",
        repo: "https://github.com/yurisugano/ProprioSuite",
        img: "https://raw.githubusercontent.com/yurisugano/ProprioSuite/main/data/figures/smoothing_example.png",
        desc: { "pt-BR": "Theseometer — meu instrumento patenteado pra medir propriocepção (US 11.589.798 B2). Eu deixei o processamento de sinal (ProprioSuite) com código aberto no GitHub.",
                "en": "Theseometer — my patented proprioception instrument (US 11,589,798 B2). I open-sourced the signal processing (ProprioSuite) on GitHub." } },
      // a aresta (lado dados): SensorySpeech 2023 → nlp — espelha o web, ligando a pesquisa ao eixo da tecnologia
      { id: "sensoryspeech", lp: "below", label: "SensorySpeech", title: "SensorySpeech (2023)", cat: "system", step: 2, url: "https://github.com/yurisugano/SensorySpeech",
        repo: "https://github.com/yurisugano/SensorySpeech", stack: "Python · NLP · spaCy · transformers",
        desc: { "pt-BR": "SensorySpeech (2023) — colaboração Neurobiologia × Linguística na University of Chicago: NLP pra referências sensoriais na fala natural, e a trilha que ensinou Python→NLP nos primeiros dias dos LLMs. O meu marco de NLP.",
                "en": "SensorySpeech (2023) — a Neurobiology × Linguistics collaboration at the University of Chicago: NLP for sensory references in natural speech, and the trail that taught Python→NLP in the early days of LLMs. My NLP landmark." } },
      { id: "nlp", lp: "right", label: "nlp", title: "nlp — a aresta neuro↔tech", cat: "system", step: 2, url: "https://yuri.artelonga.com.br/?e=sensory-speech",
        stack: "ipynb→co · privado",
        desc: { "pt-BR": "nlp — o nó entre o eixo da neurociência e o da tecnologia: o SensorySpeech importado no co. A aresta É a referência, ligando o PLN em máquinas ao processamento de linguagem no cérebro. Universo privado; o link abre o artigo-ponte.",
                "en": "nlp — the node between the neuroscience and technology axes: SensorySpeech imported into co. The edge IS the reference, linking NLP in machines to language processing in the brain. Private universe; the link opens the bridge article." } }
    ];
    var edges = [
      // spine de organizações (cronológico)
      { a: "yuri", b: "ibusp", type: "partner" },
      { a: "ibusp", b: "butantan", type: "partner" },
      { a: "butantan", b: "uchicago", type: "partner" },
      { a: "uchicago", b: "propz", type: "partner" },
      { a: "propz", b: "pointset", type: "partner" },
      { a: "pointset", b: "co", type: "partner" },
      // org → sistema de dados que entregou
      { a: "butantan", b: "collect", type: "builds" },
      { a: "ibusp", b: "dataviz", type: "builds" },
      { a: "uchicago", b: "storage", type: "builds" },
      { a: "uchicago", b: "hipaa", type: "builds" },
      { a: "propz", b: "retailint", type: "builds" },
      { a: "pointset", b: "quant", type: "builds" },
      { a: "co", b: "privsec", type: "builds" },
      // publicações / patente ← University of Chicago
      { a: "uchicago", b: "bystander", type: "contains" },
      { a: "uchicago", b: "helping", type: "contains" },
      { a: "uchicago", b: "theseo", type: "contains" },
      // a aresta: UChicago constrói o SensorySpeech (2023) → nlp (o nó-ponte pro eixo tech)
      { a: "uchicago", b: "sensoryspeech", type: "builds" },
      { a: "sensoryspeech", b: "nlp", type: "iaas", label: { "pt-BR": "aresta", "en": "bridge" } }
    ];
    var steps = [
      { year: { "pt-BR": "2012 — início", "en": "2012 — start" }, focus: "ibusp",
        title: { "pt-BR": "IB-USP — onde começou", "en": "IB-USP — where it started" },
        body: { "pt-BR": "IB-USP, Instituto de Biociências da USP — a casa acadêmica de onde parti. Aqui nasceu o meu primeiro projeto de dados (a pesquisa de público nos museus) e a origem das minhas visualizações: as figuras em R dos artigos saíram daqui.",
                "en": "IB-USP, University of São Paulo's Biosciences Institute — the academic home I set out from. Where my first data project began (the museum audience research) and the origin of my data visualization: the R figures in the papers came from here." } },
      { year: { "pt-BR": "2012 — FAPESP", "en": "2012 — FAPESP" }, focus: "butantan",
        title: { "pt-BR": "Museus — pesquisa de público", "en": "Museums — audience research" },
        body: { "pt-BR": "Instituto Butantan, onde fui bolsista FAPESP (orientadora Erika Hingst-Zaher) — o meu primeiro projeto de dados: pesquisa de público no Museu Biológico do Butantan e no Museu de Zoologia da USP, com questionários e análise da variação de visitantes pra traçar o perfil do público e avaliar a adequação das exposições. Aqui comecei a coletar dados de campo.",
                "en": "Instituto Butantan, where I was a FAPESP scholar (advised by Erika Hingst-Zaher) — my first data project: audience research at Butantan's Biological Museum and USP's Museum of Zoology, with questionnaires and visitor-count analysis to profile the public and assess the exhibitions. This is where I began collecting field data." } },
      { year: { "pt-BR": "2015–2022", "en": "2015–2022" }, focus: "uchicago",
        title: { "pt-BR": "University of Chicago", "en": "University of Chicago" },
        body: { "pt-BR": "University of Chicago, onde fui Research Assistant em Neurobiologia — eu fiz armazenamento e gestão de dados, e compliance HIPAA para dados sensíveis de saúde. Publiquei três artigos e patenteei um instrumento.",
                "en": "University of Chicago, where I was a Research Assistant in Neurobiology — I did data storage & management, and HIPAA compliance for sensitive health data. I published three papers and patented one instrument." } },
      { year: { "pt-BR": "2023", "en": "2023" }, focus: "propz",
        title: { "pt-BR": "Propz — varejo", "en": "Propz — retail" },
        body: { "pt-BR": "Propz (2023) — eu fiz inteligência analítica para varejo: analytics em escala sobre Apache Spark e Delta Lake.",
                "en": "Propz (2023) — I did retail analytical intelligence: analytics at scale on Apache Spark and Delta Lake." } },
      { year: { "pt-BR": "2024–2026", "en": "2024–2026" }, focus: "pointset",
        title: { "pt-BR": "PointSet — quant", "en": "PointSet — quant" },
        body: { "pt-BR": "PointSet (2024–2026) — quant: eu fiz inteligência quantitativa para finanças, até sair da posição em 2026. É o meu lado-dados que alimenta o rfq no web.",
                "en": "PointSet (2024–2026) — quant: I did quantitative intelligence for finance, until I left the position in 2026. It's my data side that feeds rfq on the web." } },
      { year: { "pt-BR": "2025→", "en": "2025→" }, focus: "co",
        title: { "pt-BR": "co — privacidade & segurança", "en": "co — privacy & security" },
        body: { "pt-BR": "co (ArteLonga) — o topo do meu espectro: eu ofereço privacidade e segurança de dados como serviço, cada cliente dono dos seus dados, isolados por design.",
                "en": "co (ArteLonga) — the top of my spectrum: I offer data privacy and security as a service, each client owning their data, isolated by design." } }
    ];
    // três colunas limpas: publicações (esquerda) ← espinha de orgs (centro) → trilho
    // de sistemas (direita), cada sistema na ALTURA da org que o entregou; o tempo desce.
    var pos = {
      yuri: [-40, -300],
      ibusp: [-40, -220], butantan: [-40, -140], uchicago: [-40, -40],
      propz: [-40, 70], pointset: [-40, 150], co: [-40, 230],
      dataviz: [180, -220], collect: [180, -140],
      storage: [180, -95], hipaa: [180, -40], sensoryspeech: [180, 15],
      retailint: [180, 70], quant: [180, 150], privsec: [180, 230],
      theseo: [-320, -125], bystander: [-320, -72], helping: [-320, -5],
      nlp: [420, 15]
    };
    return { key: "data", nodes: nodes, edges: edges, steps: steps, pos: pos };
  }

  var BUILDERS = { web: webModel, data: dataModel };

  function normalize(m) {
    var byId = {}; m.nodes.forEach(function (n) { byId[n.id] = n; });
    m.steps.forEach(function (s) { if (s.focus && byId[s.focus] && s.body) byId[s.focus].desc = s.body; });
    return m;
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function mount(container, opts) {
    opts = opts || {};
    var LANG = opts.lang === "en" ? "en" : "pt-BR";
    var T = I18N[LANG];
    var showTabs = opts.tabs !== false;
    var perfNow = (window.performance && performance.now) ? function () { return performance.now(); } : function () { return 0; };
    var POP = 480;
    // touch devices não têm hover → tap num nó tem que REVELAR a descrição (pin), não navegar.
    // alvo de toque maior (dedo) + a navegação fica no link "visitar" dentro do tooltip.
    var IS_TOUCH = ("ontouchstart" in window) || (navigator.maxTouchPoints > 0);

    container.classList.add("sysgraph");
    container.innerHTML =
      (showTabs ?
      '<div class="sg-tabs" role="tablist">' +
        '<button class="sg-tab" data-tk="data" type="button" role="tab">' + esc(T.trackData) + '</button>' +
        '<button class="sg-tab" data-tk="web" type="button" role="tab">' + esc(T.trackWeb) + '</button>' +
      '</div>' : '') +
      '<div class="sg-canvas-wrap"><canvas></canvas>' +
        '<div class="sg-legend"></div>' +
        '<div class="sg-hint">' + esc(IS_TOUCH ? T.hintTouch : T.hint) + '</div>' +
        '<div class="sg-tip" hidden></div>' +
        '<button class="sg-ov sg-ov-prev" type="button" aria-label="anterior">‹</button>' +
        '<button class="sg-ov sg-ov-next" type="button" aria-label="próximo">›</button>' +
      '</div>' +
      '<div class="sg-time">' +
        '<div class="sg-track"></div>' +
        '<div class="sg-panel"></div>' +
        '<div class="sg-ctrl"><button class="sg-prev" type="button">' + esc(T.prev) + '</button>' +
          '<span class="sg-counter"></span>' +
          '<button class="sg-next" type="button">' + esc(T.next) + '</button></div>' +
      '</div>';

    var canvas = container.querySelector("canvas");
    var ctx = canvas.getContext("2d");
    var tip = container.querySelector(".sg-tip");
    var legendEl = container.querySelector(".sg-legend");
    var tabsEl = container.querySelector(".sg-tabs");
    var track = container.querySelector(".sg-track");
    var panel = container.querySelector(".sg-panel");
    var counter = container.querySelector(".sg-counter");

    var trackKey = opts.track === "data" ? "data" : "web";
    var m, nodes, edges, steps, byId, POS, maxStep, cur, stepAt, focusNode;
    var cam = { x: 0, y: 0, scale: 1 }, fitUntil = 0;
    var W = 0, H = 0, dpr = 1, hover = null, pinned = null, drag = null, panning = null, downPt = null, moved = false;

    var C = { ink: "#161413", ink2: "#5b5450", ink3: "#9a948d", line: "#d8d1c8", accent: "#9a3b2e", cream: "#fffdfa", lead: "#4f9e6f" };

    function resize() {
      var r = canvas.parentNode.getBoundingClientRect();
      W = r.width; H = r.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      canvas.style.width = W + "px"; canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function labelOf(n) {
      if (n.slabel && cam.scale < 0.45) return n.slabel;   // rótulo curto em zoom pequeno (telas estreitas)
      return (n.label && typeof n.label === "object") ? (n.label[LANG] || n.label.en) : n.label;
    }
    function vis(n) { return n.step <= cur; }
    function visE(e) { return vis(byId[e.a]) && vis(byId[e.b]); }
    function toScreen(n) { return { x: W / 2 + (n.x + cam.x) * cam.scale, y: H / 2 + (n.y + cam.y) * cam.scale }; }
    function toXY(wx, wy) { return { x: W / 2 + (wx + cam.x) * cam.scale, y: H / 2 + (wy + cam.y) * cam.scale }; }
    function toWorld(px, py) { return { x: (px - W / 2) / cam.scale - cam.x, y: (py - H / 2) / cam.scale - cam.y }; }
    function radius(n) {
      return n.cat === "origin" ? 24 : n.cat === "system" ? 17 :
        n.cat === "work" ? 8 : 13;   // organizacao / lead = 13
    }
    // nós têm um PISO de tamanho no zoom-out: sem isso as bordas tracejadas viram rabisco
    function rScale() { return Math.max(0.7, Math.min(cam.scale, 1.3)); }
    function trimPt(p, r, tx, ty) { var dx = tx - p.x, dy = ty - p.y, m = Math.hypot(dx, dy) || 1; return { x: p.x + dx / m * (r + 3), y: p.y + dy / m * (r + 3) }; }
    function bezAt(p0, p1, p2, p3, t) {
      var u = 1 - t;
      return { x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
               y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y };
    }
    // rota de cada aresta: curvas-S com tangentes alinhadas aos eixos (estilo organograma/sankey),
    // aparadas na borda dos círculos — nada atravessa nó, e o leque que sai de um nó lê como leque.
    function edgeGeom(e) {
      var na = byId[e.a], nb = byId[e.b];
      var a = toScreen(na), b = toScreen(nb);
      var ra = radius(na) * rScale(), rb = radius(nb) * rScale();
      var p0, p1, p2, p3, straight = false;
      if (e.bow != null) {   // desvio lateral explícito (rota pela margem)
        p1 = toXY(e.bow, na.y + (nb.y - na.y) * 0.3);
        p2 = toXY(e.bow, na.y + (nb.y - na.y) * 0.7);
        p0 = trimPt(a, ra, p1.x, p1.y); p3 = trimPt(b, rb, p2.x, p2.y);
      } else {
        var dx = b.x - a.x, dy = b.y - a.y;
        if (e.type === "contains" || Math.abs(dx) < 14 || Math.abs(dy) < 14) {
          straight = true; p0 = trimPt(a, ra, b.x, b.y); p3 = trimPt(b, rb, a.x, a.y); p1 = p0; p2 = p3;
        } else if (Math.abs(dy) >= Math.abs(dx)) {   // tangentes verticais (árvore)
          // partida/chegada espalhadas pelo arco do nó (meio-ângulo na direção do alvo):
          // o leque que sai de um hub abre já na origem em vez de virar uma trança de tinta.
          var sy = dy > 0 ? 1 : -1, th = Math.atan2(dx, Math.abs(dy)) * 0.5;
          p0 = { x: a.x + Math.sin(th) * (ra + 3), y: a.y + sy * Math.cos(th) * (ra + 3) };
          p3 = { x: b.x - Math.sin(th) * (rb + 3), y: b.y - sy * Math.cos(th) * (rb + 3) };
          var my = (p0.y + p3.y) / 2; p1 = { x: p0.x, y: my }; p2 = { x: p3.x, y: my };
        } else {                                      // tangentes horizontais (trilho)
          var sx = dx > 0 ? 1 : -1, ph = Math.atan2(dy, Math.abs(dx)) * 0.5;
          p0 = { x: a.x + sx * Math.cos(ph) * (ra + 3), y: a.y + Math.sin(ph) * (ra + 3) };
          p3 = { x: b.x - sx * Math.cos(ph) * (rb + 3), y: b.y - Math.sin(ph) * (rb + 3) };
          var mx = (p0.x + p3.x) / 2; p1 = { x: mx, y: p0.y }; p2 = { x: mx, y: p3.y };
        }
      }
      return { p0: p0, p1: p1, p2: p2, p3: p3, straight: straight };
    }
    function easeBack(t) { if (t <= 0) return 0; if (t >= 1) return 1; var c1 = 1.7, c3 = c1 + 1, u = t - 1; return 1 + c3 * u * u * u + c1 * u * u; }

    function settle() {
      nodes.filter(vis).forEach(function (n) {
        if (n === drag) return;
        n.x += (n.tx - n.x) * 0.16; n.y += (n.ty - n.y) * 0.16;
      });
    }
    function frameTarget() {
      // enquadra a CAIXA dos nós visíveis (com estimativa dos rótulos) — não centra no foco,
      // que desperdiçava metade do canvas quando o foco ficava na borda do grafo.
      // Duas passadas: rótulos NÃO encolhem na mesma proporção do zoom (piso de 0.7),
      // então no zoom-out eles ocupam mais "mundo" do que uma estimativa ingênua diz.
      var v = nodes.filter(vis); if (!v.length) return null;
      function fit(f) {
        var minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
        var hideWork = f > 1.7;   // f grande ⇒ zoom pequeno ⇒ rótulos de publicação ocultos no draw
        v.forEach(function (n) {
          var lblLen = (hideWork && n.cat === "work") ? 0 : String(labelOf(n) || "").length;
          var r = radius(n), lw = (10 + lblLen * 7.4) * f, lp = n.lp || "below";
          var x0 = n.x - r - (lp === "left" ? lw + 7 : 0), x1 = n.x + r + (lp === "right" ? lw + 7 : 0);
          if (lp === "below") { x0 = Math.min(x0, n.x - lw / 2); x1 = Math.max(x1, n.x + lw / 2); }
          var y0 = n.y - r, y1 = n.y + r + (lp === "below" ? 22 * f : 0);
          if (x0 < minX) minX = x0; if (x1 > maxX) maxX = x1;
          if (y0 < minY) minY = y0; if (y1 > maxY) maxY = y1;
        });
        maxY += 34 * f;             // respiro embaixo (a dica de uso sobrepõe a base do canvas)
        if (W < 560) minY -= 64 * f;   // tela estreita: a legenda cobre o topo-esquerda
        var P = 26, bw = Math.max(1, maxX - minX), bh = Math.max(1, maxY - minY);
        var ts = Math.max(0.3, Math.min(1.15, Math.min((W - 2 * P) / bw, (H - 2 * P) / bh)));
        return { scale: ts, x: -(minX + maxX) / 2, y: -(minY + maxY) / 2 };
      }
      var t = fit(1);
      for (var i = 0; i < 3; i++) {   // itera até o fator rótulo/zoom convergir
        var lsc = Math.max(0.7, Math.min(1, t.scale + 0.34));
        t = fit(lsc / t.scale);
      }
      return t;
    }
    function frame(snap) {
      var t = frameTarget(); if (!t) return;
      if (snap) { cam.scale = t.scale; cam.x = t.x; cam.y = t.y; }
      else { cam.scale += (t.scale - cam.scale) * 0.12; cam.x += (t.x - cam.x) * 0.12; cam.y += (t.y - cam.y) * 0.12; }
    }
    function connected(id) { var s = {}; edges.forEach(function (e) { if (e.a === id) s[e.b] = 1; if (e.b === id) s[e.a] = 1; }); return s; }

    function roundRect(x, y, w, h, r) {
      if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
      else { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      var hl = hover || pinned, near = hl ? connected(hl.id) : null, now = perfNow();
      function prog(n) { var t = stepAt[n.step]; if (n.step < cur || t == null) return 1; return Math.max(0, Math.min(1, (now - t) / POP)); }
      // ── arestas (curvas-S aparadas na borda dos nós) ──
      ctx.lineCap = "round";
      edges.forEach(function (e) {
        if (!visE(e)) return;
        var al = Math.min(prog(byId[e.a]), prog(byId[e.b])); if (al <= 0) return;
        var on = hl && (e.a === hl.id || e.b === hl.id);
        var g = edgeGeom(e);
        ctx.globalAlpha = al;
        ctx.beginPath(); ctx.moveTo(g.p0.x, g.p0.y);
        if (g.straight) ctx.lineTo(g.p3.x, g.p3.y);
        else ctx.bezierCurveTo(g.p1.x, g.p1.y, g.p2.x, g.p2.y, g.p3.x, g.p3.y);
        if (e.type === "builds") { ctx.setLineDash([]); ctx.strokeStyle = on ? C.ink : "#6b6058"; ctx.lineWidth = on ? 3 : 2.2; }
        else if (e.type === "iaas") { ctx.setLineDash([]); ctx.strokeStyle = on ? C.accent : "rgba(154,59,46,.75)"; ctx.lineWidth = on ? 2.8 : 2; }
        else if (e.type === "contains") { ctx.setLineDash([]); ctx.strokeStyle = on ? C.ink2 : "#c9c2b8"; ctx.lineWidth = on ? 2 : 1.4; }
        else { ctx.setLineDash([4, 5]); ctx.strokeStyle = on ? C.ink2 : "rgba(154,148,141,.85)"; ctx.lineWidth = on ? 1.8 : 1.3; }  // partner
        ctx.stroke(); ctx.setLineDash([]);
        if (e.label && al > 0.85 && cam.scale >= 0.45) {   // em zoom pequeno a cor da aresta basta
          // rótulo da aresta DESLOCADO na normal da curva (nunca em cima de nó/rótulo)
          var txt = e.label[LANG] || e.label.en || "";
          var lt = e.lt || 0.5;   // posição do rótulo ao longo da curva (0→1), ajustável por aresta
          var mid = g.straight
            ? { x: g.p0.x + (g.p3.x - g.p0.x) * lt, y: g.p0.y + (g.p3.y - g.p0.y) * lt }
            : bezAt(g.p0, g.p1, g.p2, g.p3, lt);
          var ex = g.p3.x - g.p0.x, ey = g.p3.y - g.p0.y, em = Math.hypot(ex, ey) || 1;
          var nx = -ey / em, ny = ex / em; if (ny > 0) { nx = -nx; ny = -ny; }   // normal sempre pro lado de cima
          var elsc = Math.max(0.7, Math.min(1, cam.scale + 0.34));   // pílula encolhe junto com os rótulos
          var mx = mid.x + nx * 14 * elsc, my = mid.y + ny * 14 * elsc;
          ctx.font = "600 " + (10 * elsc).toFixed(1) + "px 'Space Mono', ui-monospace, monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
          var tw = ctx.measureText(txt).width, pw = tw + 12 * elsc, phh = 8 * elsc;
          ctx.fillStyle = "rgba(251,249,246,.95)"; roundRect(mx - pw / 2, my - phh, pw, phh * 2, 5); ctx.fill();
          ctx.strokeStyle = e.type === "iaas" ? "rgba(154,59,46,.4)" : "rgba(154,148,141,.4)"; ctx.lineWidth = 1;
          roundRect(mx - pw / 2, my - phh, pw, phh * 2, 5); ctx.stroke();
          ctx.fillStyle = e.type === "iaas" ? C.accent : C.ink2; ctx.fillText(txt, mx, my);
        }
        ctx.globalAlpha = 1;
      });
      // ── nós ──
      ctx.textAlign = "center";
      nodes.filter(vis).forEach(function (n) {
        var pr = prog(n); if (pr <= 0) return;
        var p = toScreen(n), rFull = radius(n) * rScale(), r = rFull * easeBack(pr);
        var dim = hl && n !== hl && !(near && near[n.id]), isHL = n === hl, cat = n.cat, ghost = n.ghost;
        ctx.globalAlpha = (dim ? 0.3 : 1) * Math.min(1, pr * 1.5) * (ghost ? 0.4 : 1);
        ctx.save();
        ctx.shadowColor = "rgba(22,20,19,.14)"; ctx.shadowBlur = isHL ? 12 : 4; ctx.shadowOffsetY = 1.5;
        // forma + preenchimento — todas as categorias são círculos
        var fill = cat === "origin" ? C.ink : cat === "work" ? C.ink3 : C.cream;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = fill; ctx.fill(); ctx.restore();
        // borda — distingue as 5 categorias; tracejado PROPORCIONAL ao raio (anel lê como anel)
        ctx.lineCap = "butt";
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        if (cat === "origin") { ctx.lineWidth = isHL ? 3 : 2; ctx.strokeStyle = "#000"; ctx.stroke(); }
        else if (cat === "organizacao") {
          var per = 2 * Math.PI * Math.max(r, 1) / 9;
          ctx.setLineDash([per * 0.62, per * 0.38]); ctx.lineWidth = isHL ? 2.4 : 1.8; ctx.strokeStyle = C.ink3; ctx.stroke(); ctx.setLineDash([]);
        }
        else if (cat === "lead") {
          var perl = 2 * Math.PI * Math.max(r, 1) / 12;
          ctx.lineCap = "round"; ctx.setLineDash([0.5, perl]); ctx.lineWidth = isHL ? 2.6 : 2.2; ctx.strokeStyle = C.lead; ctx.stroke(); ctx.setLineDash([]); ctx.lineCap = "butt";
        }
        else if (cat === "work") { ctx.lineWidth = 1; ctx.strokeStyle = C.ink2; ctx.stroke(); }
        else { ctx.lineWidth = isHL ? 2.6 : 1.8; ctx.strokeStyle = C.ink; ctx.stroke(); }   // system (sólido)
        // rótulo — lp: "left" | "right" | "below"(default), sempre com HALO cor-de-papel:
        // mesmo que uma linha passe por baixo, o texto continua legível.
        // em zoom pequeno (telas estreitas) os rótulos das publicações saem — os rótulos
        // não encolhem na proporção do zoom e atropelavam a coluna do spine; o tooltip cobre.
        var workHidden = cat === "work" && cam.scale < 0.45;
        if (!workHidden && ((pr > 0.5 && cat !== "work") || (cat === "work" && pr > 0.7))) {
          ctx.globalAlpha = (dim ? 0.4 : 1) * (ghost ? 0.55 : 1) * Math.min(1, (pr - 0.5) * 3);
          var lsc = Math.max(0.7, Math.min(1, cam.scale + 0.34));   // rótulos encolhem ao dar zoom-out (evita sobreposição)
          var fpx = (cat === "origin" ? 13 : cat === "work" ? 10 : cat === "organizacao" ? 11 : 12) * lsc;
          ctx.font = (cat === "origin" ? "700 " : "600 ") + fpx.toFixed(1) + "px 'Space Mono', ui-monospace, monospace";
          var lp = n.lp || "below", lx, ly;
          if (lp === "left") { ctx.textAlign = "right"; ctx.textBaseline = "middle"; lx = p.x - rFull - 7; ly = p.y; }
          else if (lp === "right") { ctx.textAlign = "left"; ctx.textBaseline = "middle"; lx = p.x + rFull + 7; ly = p.y; }
          else { ctx.textAlign = "center"; ctx.textBaseline = "top"; lx = p.x; ly = p.y + rFull + 5; }
          ctx.strokeStyle = "rgba(251,249,246,.92)"; ctx.lineWidth = 3.5; ctx.lineJoin = "round";
          ctx.strokeText(labelOf(n), lx, ly);
          ctx.fillStyle = cat === "origin" ? C.ink : (cat === "organizacao" || cat === "work") ? C.ink2 : cat === "lead" ? C.lead : C.ink;
          ctx.fillText(labelOf(n), lx, ly);
          ctx.textAlign = "center";
        }
        ctx.globalAlpha = 1;
      });
    }

    var raf = 0;
    function loop() {
      if (!container.isConnected) { stop(); return; }
      if (!drag) settle();
      if (!panning && !drag && perfNow() < fitUntil) frame(false);
      draw();
      raf = window.requestAnimationFrame(loop);
    }

    // ── UI ──
    function yearOf(s) { var y = steps[s].year; return typeof y === "string" ? y : (y[LANG] || y.en); }
    function catLabel(cat) {
      return cat === "origin" ? T.catOrigin : cat === "organizacao" ? T.catOrg :
        cat === "lead" ? T.catLead : cat === "work" ? T.catWork : T.catSystem;
    }
    function renderTabs() {
      if (!tabsEl) return;
      Array.prototype.forEach.call(tabsEl.querySelectorAll(".sg-tab"), function (b) {
        var tk = b.getAttribute("data-tk");
        b.classList.toggle("on", tk === trackKey);
        b.setAttribute("aria-selected", tk === trackKey ? "true" : "false");
        b.onclick = function () { if (tk !== trackKey) loadTrack(tk); };
      });
    }
    // legenda PROGRESSIVA: só categorias já reveladas
    function renderLegend() {
      var seen = {}, order = [];
      nodes.filter(vis).forEach(function (n) { if (!seen[n.cat]) { seen[n.cat] = 1; order.push(n.cat); } });
      var rank = { origin: 0, system: 1, organizacao: 2, work: 3, lead: 4 };
      order.sort(function (a, b) { return rank[a] - rank[b]; });
      var html = order.map(function (cat) {
        return '<span><i class="d ' + cat + '"></i>' + esc(catLabel(cat)) + '</span>';
      }).join("");
      legendEl.innerHTML = html;
    }
    function growthHtml() {
      var w = 320, h = 104, pad = 9, pts = GROWTH.pts, proj = GROWTH.proj;
      var minI = pts[0].idx, span = (proj.idx - minI) || 1;
      // cada série é normalizada ao SEU PRÓPRIO máximo (escala arbitrária 0→1): a FORMA é o sinal,
      // não a magnitude. Assim parceiros (6) e PRs (495) rampam igual — o hover revela os números reais.
      var CMAX = proj.c, PMAX = proj.p, AMAX = proj.a;
      function X(idx) { return pad + (idx - minI) / span * (w - 2 * pad); }
      function Y(v, mx) { return (h - pad) - (v / mx) * (h - 2 * pad - 8); }
      function line(k, mx) { return pts.map(function (m, i) { return (i ? "L" : "M") + X(m.idx).toFixed(1) + " " + Y(m[k], mx).toFixed(1); }).join(" "); }
      function seg(k, mx) { var a = pts[pts.length - 1]; return "M" + X(a.idx).toFixed(1) + " " + Y(a[k], mx).toFixed(1) + " L" + X(proj.idx).toFixed(1) + " " + Y(proj[k], mx).toFixed(1); }
      var gx = X(GROWTH.markIdx).toFixed(1);
      var all = pts.concat([proj]);
      // pontos (marcadores) por série, p/ leitura visual mesmo onde as curvas se cruzam
      function dots(k, mx, color, shape) {
        return all.map(function (m) {
          var x = X(m.idx).toFixed(1), y = Y(m[k], mx).toFixed(1);
          if (shape === "sq") return '<rect x="' + (x - 2.4).toFixed(1) + '" y="' + (y - 2.4).toFixed(1) + '" width="4.8" height="4.8" fill="' + color + '"/>';
          if (shape === "di") return '<path d="M' + x + ' ' + (y - 3) + ' L' + (+x + 3).toFixed(1) + ' ' + y + ' L' + x + ' ' + (+y + 3).toFixed(1) + ' L' + (+x - 3).toFixed(1) + ' ' + y + ' Z" fill="' + color + '"/>';
          return '<circle cx="' + x + '" cy="' + y + '" r="2.6" fill="' + color + '"/>';
        }).join("");
      }
      // colunas de hit invisíveis (uma por ponto no tempo) → revelam os números reais no hover
      var hits = all.map(function (m, i) {
        var x = X(m.idx), prev = i ? X(all[i - 1].idx) : minI, nxt = i < all.length - 1 ? X(all[i + 1].idx) : w;
        var x0 = (i ? (prev + x) / 2 : 0), x1 = (i < all.length - 1 ? (x + nxt) / 2 : w);
        return '<rect class="sg-ghit" x="' + x0.toFixed(1) + '" y="0" width="' + (x1 - x0).toFixed(1) + '" height="' + h + '" fill="transparent"' +
          ' data-l="' + esc(m.l) + '" data-c="' + m.c + '" data-p="' + m.p + '" data-a="' + m.a + '" data-proj="' + (m === proj ? 1 : 0) + '"/>';
      }).join("");
      var svg = '<svg class="sg-growth" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none">' +
        '<line class="sg-gmark" x1="' + gx + '" y1="2" x2="' + gx + '" y2="' + (h - pad) + '"/>' +
        '<line class="sg-gcursor" x1="0" y1="0" x2="0" y2="' + h + '" style="display:none"/>' +
        '<path d="' + line("c", CMAX) + '" fill="none" stroke="#161413" stroke-width="2"/>' +
        '<path d="' + line("p", PMAX) + '" fill="none" stroke="#9a3b2e" stroke-width="2.2" stroke-dasharray="6 3"/>' +
        '<path d="' + line("a", AMAX) + '" fill="none" stroke="#3a6ea5" stroke-width="2.2" stroke-dasharray="1.5 3" stroke-linecap="round"/>' +
        '<path d="' + seg("c", CMAX) + '" fill="none" stroke="#b7b1a9" stroke-width="2" stroke-dasharray="4 3"/>' +
        '<path d="' + seg("p", PMAX) + '" fill="none" stroke="#cdb0aa" stroke-width="2" stroke-dasharray="4 3"/>' +
        '<path d="' + seg("a", AMAX) + '" fill="none" stroke="#a9bdd1" stroke-width="2" stroke-dasharray="4 3"/>' +
        dots("c", CMAX, "#161413", "ci") + dots("p", PMAX, "#9a3b2e", "sq") + dots("a", AMAX, "#3a6ea5", "di") +
        hits +
        '</svg>';
      var axis = '<div class="sg-gaxis">' + GROWTH.labels.map(function (l) {
        var m = all.filter(function (x) { return x.l === l; })[0]; if (!m) return "";
        return '<span style="left:' + (X(m.idx) / w * 100).toFixed(1) + '%">' + esc(l) + (l === proj.l ? "*" : "") + '</span>';
      }).join("") + '</div>';
      var totals = '<div class="sg-gtot">' +
        '<div class="sg-stat"><b>' + COMMITS_TOTAL + '</b><span>' + esc(T.commits) + '</span></div>' +
        '<div class="sg-stat"><b>' + PRS_TOTAL + '</b><span>' + esc(T.prs) + '</span></div>' +
        '<div class="sg-stat hover-list"><b>' + SERVICE_LIST.length + '</b><span>' + esc(T.services) + '</span><i class="sg-names">' + esc(SERVICE_LIST.join(" · ")) + '</i></div>' +
        '<div class="sg-stat hover-list"><b>' + PARTNER_LIST.length + '</b><span>' + esc(T.partners) + '</span><i class="sg-names">' + PARTNER_LIST.map(function (x) { return '<a href="' + esc(x.u) + '" target="_blank" rel="noopener">' + esc(x.n) + '</a>'; }).join(" · ") + '</i></div>' +
        '</div>';
      var leg = '<div class="sg-glegend"><i style="background:#161413"></i>' + esc(T.commits) +
        '<i style="background:#9a3b2e"></i>' + esc(T.prs) +
        '<i style="background:#3a6ea5"></i>' + esc(T.partners) +
        '<i class="sg-iproj"></i><span class="sg-proj">' + (LANG === "pt-BR" ? "junho (previsão)" : "june (forecast)") + '</span></div>';
      var cap = '<div class="sg-gcap">' + esc(T.growthCap) + '</div>';
      return '<div class="sg-growthbox">' + totals +
        '<div class="sg-gwrap"><div class="sg-gtip" hidden></div>' + svg + '</div>' + axis + leg + cap + '</div>';
    }
    // liga o hover do gráfico: cada coluna invisível revela os números REAIS daquele ponto no tempo
    function wireGrowth() {
      var box = panel.querySelector(".sg-growthbox"); if (!box) return;
      var gtip = box.querySelector(".sg-gtip"), svg = box.querySelector(".sg-growth"),
          cursor = box.querySelector(".sg-gcursor"), wrap = box.querySelector(".sg-gwrap");
      if (!gtip || !svg) return;
      function show(rect) {
        var l = rect.getAttribute("data-l"), c = rect.getAttribute("data-c"),
            p = rect.getAttribute("data-p"), a = rect.getAttribute("data-a"),
            proj = rect.getAttribute("data-proj") === "1";
        var label = esc(l) + (proj ? (LANG === "pt-BR" ? " (previsão)" : " (forecast)") : "");
        gtip.innerHTML = '<b>' + label + '</b>' +
          '<span><i style="background:#161413"></i>' + esc(T.commits) + ' <b>' + esc(c) + '</b></span>' +
          '<span><i style="background:#9a3b2e"></i>' + esc(T.prs) + ' <b>' + esc(p) + '</b></span>' +
          '<span><i style="background:#3a6ea5"></i>' + esc(T.partners) + ' <b>' + esc(a) + '</b></span>';
        gtip.hidden = false;
        // posiciona o tooltip perto da coluna (coordenadas do wrap)
        var br = svg.getBoundingClientRect(), wr = wrap.getBoundingClientRect();
        var cx = (+rect.getAttribute("x") + (+rect.getAttribute("width")) / 2) / 320 * br.width;
        var tw = gtip.offsetWidth || 130;
        gtip.style.left = Math.max(2, Math.min(cx - tw / 2, br.width - tw - 2)) + "px";
        if (cursor) { cursor.style.display = ""; var lx = cx / br.width * 320; cursor.setAttribute("x1", lx); cursor.setAttribute("x2", lx); }
      }
      function hide() { gtip.hidden = true; if (cursor) cursor.style.display = "none"; }
      Array.prototype.forEach.call(box.querySelectorAll(".sg-ghit"), function (rect) {
        rect.addEventListener("mouseenter", function () { show(rect); });
        rect.addEventListener("mousemove", function () { show(rect); });
      });
      svg.addEventListener("mouseleave", hide);
    }
    function renderTrack() {
      track.innerHTML = steps.map(function (s, k) {
        return '<button class="sg-tk' + (k === cur ? " on" : k < cur ? " done" : "") + '" data-k="' + k + '" type="button">' +
          '<span class="sg-yr">' + esc(yearOf(k)) + '</span></button>';
      }).join("");
      Array.prototype.forEach.call(track.querySelectorAll(".sg-tk"), function (b) {
        b.onclick = function () { goStep(+b.getAttribute("data-k")); };
      });
    }
    function renderPanel() {
      var s = steps[cur];
      var rs = nodes.filter(function (n) { return n.step === cur && (n.url || n.repo); });   // referências reveladas neste passo
      var refs = rs.length ? '<div class="sg-prefs"><b>' + esc(T.refs) + '</b> ' + rs.map(function (n) {
        var a = [];
        if (n.url) a.push('<a href="' + esc(n.url) + '" target="_blank" rel="noopener">' + esc(labelOf(n)) + ' ↗</a>');
        if (n.repo) a.push('<a href="' + esc(n.repo) + '" target="_blank" rel="noopener">' + (n.url ? 'code' : esc(labelOf(n))) + ' ↗</a>');
        return a.join(" ");
      }).join(' · ') + '</div>' : "";
      panel.innerHTML = '<div class="sg-pyear">' + esc(yearOf(cur)) + '</div>' +
        '<h3 class="sg-ptitle">' + esc(s.title[LANG] || s.title.en) + '</h3>' +
        '<p class="sg-pbody">' + esc(s.body[LANG] || s.body.en) + '</p>' + refs + (s.growth ? growthHtml() : "");
      if (s.growth) wireGrowth();
      panel.style.animation = "none"; void panel.offsetWidth; panel.style.animation = "";
      counter.textContent = (cur + 1) + " / " + steps.length;
      Array.prototype.forEach.call(track.children, function (b, k) { b.className = "sg-tk" + (k === cur ? " on" : k < cur ? " done" : ""); });
      container.querySelector(".sg-prev").disabled = cur === 0;
      container.querySelector(".sg-next").disabled = cur === maxStep;
      container.querySelector(".sg-ov-prev").disabled = cur === 0;
      container.querySelector(".sg-ov-next").disabled = cur === maxStep;
      renderLegend();
    }
    function setFocus() {
      var fid = steps[cur].focus;
      if (fid && byId[fid]) { focusNode = byId[fid]; return; }
      focusNode = nodes.filter(function (n) { return n.step === cur; })[0] || null;
    }
    function goStep(s) {
      s = Math.max(0, Math.min(maxStep, s)); if (s === cur && stepAt[s] != null) return;
      var growing = s > cur;
      cur = s; stepAt[cur] = perfNow();
      if (growing) nodes.filter(function (n) { return n.step === cur; }).forEach(function (n) {
        var nb = null; edges.forEach(function (e) { if (e.a === n.id && byId[e.b].step < cur) nb = byId[e.b]; if (e.b === n.id && byId[e.a].step < cur) nb = byId[e.a]; });
        if (nb) { n.x = nb.x + (n.x - nb.x) * 0.25; n.y = nb.y + 40 + (n.y - nb.y) * 0.25; }
      });
      renderPanel(); pinned = null; tip.hidden = true; setFocus(); fitUntil = perfNow() + 1400;
    }
    function loadTrack(tk) {
      trackKey = tk; m = normalize(BUILDERS[tk]());
      nodes = m.nodes; edges = m.edges; steps = m.steps; POS = m.pos;
      byId = {}; nodes.forEach(function (n) { byId[n.id] = n; });
      nodes.forEach(function (n) { var p = POS[n.id]; if (p) { n.tx = p[0]; n.ty = p[1]; n.x = p[0]; n.y = p[1]; } else { n.tx = n.x = 0; n.ty = n.y = 0; } });
      maxStep = steps.length - 1; cur = 0; stepAt = {}; stepAt[0] = perfNow();
      hover = null; pinned = null; drag = null; panning = null; tip.hidden = true;
      renderTabs(); renderTrack(); renderPanel();
      for (var k = 0; k < 60; k++) settle();
      setFocus(); frame(true); fitUntil = perfNow() + 900;
      if (window.AL_track) try { window.AL_track("sys_graph_track", { track: tk }); } catch (e) {}
    }

    container.querySelector(".sg-prev").onclick = function () { goStep(cur - 1); };
    container.querySelector(".sg-next").onclick = function () { goStep(cur + 1); };
    container.querySelector(".sg-ov-prev").onclick = function () { goStep(cur - 1); };
    container.querySelector(".sg-ov-next").onclick = function () { goStep(cur + 1); };

    function pick(px, py, touch) { var pad = touch ? 16 : 6, best = null, bd = 1e9; nodes.filter(vis).forEach(function (n) { var p = toScreen(n), d = Math.hypot(px - p.x, py - p.y); if (d <= radius(n) + pad && d < bd) { best = n; bd = d; } }); return best; }
    function hostOf(u) { try { return new URL(u, location.href).hostname.replace(/^www\./, ""); } catch (e) { return ""; } }
    function previewHtml(u) {
      if (!u) return "";
      var host = hostOf(u); if (!host) return "";
      var label = host;
      try {   // p/ repos (github/gitlab) referir ao repo: owner/repo — não só o host
        var path = new URL(u, location.href).pathname.replace(/^\/+|\/+$/g, "");
        if (path && /^(github|gitlab)\.com$/.test(host)) label = path.split("/").slice(0, 2).join("/");
      } catch (e) {}
      var fav = "https://www.google.com/s2/favicons?domain=" + encodeURIComponent(host) + "&sz=64";
      return '<a class="sg-prev-card" href="' + esc(u) + '" target="_blank" rel="noopener">' +
        '<img src="' + esc(fav) + '" alt="" width="16" height="16" loading="lazy"/>' +
        '<span class="sg-prev-host">' + esc(label) + '</span></a>';
    }
    function repoHtml(u) {
      if (!u) return "";
      var host = hostOf(u); if (!host) return "";
      var label = host;
      try {   // repos (github/gitlab) → owner/repo, igual ao previewHtml
        var path = new URL(u, location.href).pathname.replace(/^\/+|\/+$/g, "");
        if (path && /^(github|gitlab)\.com$/.test(host)) label = path.split("/").slice(0, 2).join("/");
      } catch (e) {}
      return '<a class="sg-repo" href="' + esc(u) + '" target="_blank" rel="noopener">' +
        (LANG === "pt-BR" ? "código" : "code") + ' ↗ ' + esc(label) + '</a>';
    }
    function showTip(n, px, py, pin) {
      var link = n.url ? '<a href="' + esc(n.url) + '" target="_blank" rel="noopener">' + esc(T.open) + '</a>' : "";
      var stk = n.stack ? '<span class="sg-stack">' + esc(T.stack) + ' · ' + esc(n.stack) + '</span>' : "";
      var fig = n.img ? '<img class="sg-fig" src="' + esc(n.img) + '" alt="" loading="lazy"/>' : "";
      tip.innerHTML = '<div class="sg-th"><b>' + esc(n.title || labelOf(n)) + '</b>' + link + '</div>' +
        '<i class="sg-role sg-role-' + n.cat + '">' + esc(catLabel(n.cat)) + '</i>' + fig +
        '<span>' + esc((n.desc && (n.desc[LANG] || n.desc.en)) || "") + '</span>' + stk + previewHtml(n.url) + repoHtml(n.repo);
      tip.hidden = false;
      var tw = tip.offsetWidth, th = tip.offsetHeight;
      tip.style.left = Math.max(6, Math.min(px + 12, W - tw - 6)) + "px";
      tip.style.top = Math.max(6, Math.min(py + 12, H - th - 6)) + "px";
      tip.classList.toggle("pin", !!pin);
    }
    function hideTip() { if (!pinned) { tip.hidden = true; tip.classList.remove("pin"); } }
    function localPt(ev) { var r = canvas.getBoundingClientRect(), t = ev.touches && ev.touches[0]; return { x: (t ? t.clientX : ev.clientX) - r.left, y: (t ? t.clientY : ev.clientY) - r.top }; }

    function onDown(ev) { fitUntil = 0; var touch = !!(ev.touches); var pt = localPt(ev); downPt = pt; moved = false; var n = pick(pt.x, pt.y, touch); if (n) { drag = n; drag._w = toWorld(pt.x, pt.y); } else panning = { x: pt.x, y: pt.y, cx: cam.x, cy: cam.y }; }
    function onMove(ev) {
      var pt = localPt(ev); if (downPt && Math.hypot(pt.x - downPt.x, pt.y - downPt.y) > 4) moved = true;
      if (drag) { var w = toWorld(pt.x, pt.y); drag.x += w.x - drag._w.x; drag.y += w.y - drag._w.y; drag._w = w; if (ev.preventDefault) ev.preventDefault(); }
      else if (panning) { cam.x = panning.cx + (pt.x - panning.x) / cam.scale; cam.y = panning.cy + (pt.y - panning.y) / cam.scale; if (ev.preventDefault) ev.preventDefault(); }
      else if (!IS_TOUCH) { var h = pick(pt.x, pt.y); hover = h; canvas.style.cursor = h ? "pointer" : "grab"; if (h && !pinned) showTip(h, pt.x, pt.y, false); else hideTip(); }
    }
    function onUp() {
      // tap num nó → PIN (revela a descrição); o link "visitar" dentro do tooltip navega.
      if (drag && !moved) { pinned = drag; var p = toScreen(drag); showTip(drag, p.x, p.y, true); if (window.AL_track) try { window.AL_track("sys_graph_node", { id: drag.id }); } catch (e) {} }
      else if (panning && !moved) {
        if (pinned) { pinned = null; hideTip(); }   // tap no vazio fecha o tooltip aberto
        else if (!IS_TOUCH) goStep(cur + 1);          // no touch, avançar é só pelas setas/controles (tap no vazio não navega)
      }
      drag = null; panning = null; downPt = null;
    }
    function onWheel(ev) { ev.preventDefault(); fitUntil = 0; var pt = localPt(ev), b = toWorld(pt.x, pt.y), f = ev.deltaY < 0 ? 1.12 : 0.89; cam.scale = Math.max(0.4, Math.min(2.4, cam.scale * f)); var a = toWorld(pt.x, pt.y); cam.x += a.x - b.x; cam.y += a.y - b.y; }

    canvas.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
    canvas.addEventListener("mouseleave", function () { hover = null; hideTip(); });
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("touchstart", onDown, { passive: true });
    canvas.addEventListener("touchmove", onMove, { passive: false });
    canvas.addEventListener("touchend", onUp);
    var ro = ("ResizeObserver" in window) ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(canvas.parentNode); else window.addEventListener("resize", resize);

    function stop() { if (raf) window.cancelAnimationFrame(raf); window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); if (ro) ro.disconnect(); else window.removeEventListener("resize", resize); }

    resize();
    loadTrack(trackKey);
    loop();
    return { destroy: stop };
  }

  window.SystemGraph = { mount: mount };
})();
