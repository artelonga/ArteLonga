/* yuri/system-graph.js — "System Portfolio" como LINHA DO TEMPO que cresce.
 * Começa só com a ArteLonga (2024). A cada slide (avançar/voltar) o passo seguinte
 * revela o(s) próximo(s) nó(s) em ordem cronológica, com a descrição daquele marco.
 * A rede se monta diante do leitor — nada de tudo-de-uma-vez (que confundia).
 *
 * API: window.SystemGraph.mount(container, { lang }) -> { destroy() }
 * Força + colisão (sem sobreposição), pan/zoom/drag, tooltip com stack + link.
 * Números de dev (último passo) medidos em 2026-06-01 via gh + git. */
(function () {
  "use strict";

  var I18N = {
    "pt-BR": {
      legHub: "co · plataforma", legRoot: "ArteLonga · origem", legUniverse: "universo (jogo)",
      legPartner: "parceria · comunidade", legAuth: "co distribui → cliente", legLink: "sub-universo",
      legInfra: "storage · compute (IaaS)",
      roleHub: "plataforma", roleRoot: "origem · agência", roleService: "cliente",
      roleUniverse: "universo · jogo", rolePartner: "parceria · comunidade", roleInfra: "infra como serviço",
      stack: "stack", open: "visitar ↗", prev: "‹ antes", next: "depois ›",
      hint: "passe o mouse num nó pra revisar · clique pra visitar · avance os slides"
    },
    "en": {
      legHub: "co · platform", legRoot: "ArteLonga · origin", legUniverse: "universe (game)",
      legPartner: "partner · community", legAuth: "co distributes → client", legLink: "sub-universe",
      legInfra: "storage · compute (IaaS)",
      roleHub: "platform", roleRoot: "origin · agency", roleService: "client",
      roleUniverse: "universe · game", rolePartner: "partner · community", roleInfra: "infra as a service",
      stack: "stack", open: "visit ↗", prev: "‹ before", next: "after ›",
      hint: "hover a node to review · click to visit · step through the slides"
    }
  };

  // chart de crescimento — barras de commits, PRs e parceiros (cada universo + parceiro conta como parceiro)
  var CHART = [
    { v: 1291, l: { "pt-BR": "commits", "en": "commits" } },
    { v: 274, l: { "pt-BR": "PRs", "en": "merged PRs" } },
    { v: 7, l: { "pt-BR": "parceiros", "en": "partners" } }
  ];
  var STATS = [
    { n: "7", l: { "pt-BR": "serviços web", "en": "web services" } },
    { n: "7", l: { "pt-BR": "parceiros · universos + parceiros", "en": "partners · universes + partners" } },
    { n: "≈360 mil", l: { "pt-BR": "linhas de código", "en": "lines of code" } },
    { n: "≈3", l: { "pt-BR": "meses: co → rede", "en": "months: co → network" } }
  ];

  function model() {
    // step = passo cronológico em que o nó surge (0 = ArteLonga, 2024)
    var nodes = [
      { id: "arte", label: "ArteLonga", role: "root", step: 0, x: 0, y: 0, url: "https://artelonga.com.br",
        stack: "Vite · Markdown · GitHub Pages",
        desc: { "pt-BR": "A agência: carreira, marca, tecnologia e comunicação. O ponto de partida de tudo.",
                "en": "The agency: career, brand, technology and communication. The starting point of everything." } },
      { id: "quilombo", label: "Quilombo Araucária", role: "service", step: 1, x: -150, y: 60, url: "https://quilomboaraucaria.org",
        stack: "Node · SvelteKit SSR · sharp",
        desc: { "pt-BR": "Oferecemos serviços web pro-bono ao Quilombo Araucária, um espaço comunitário de resistência cultural, social e ambiental na periferia de São Paulo.",
                "en": "We provide pro-bono web services to Quilombo Araucária, a community space for cultural, social and environmental resistance in the periphery of São Paulo." } },
      { id: "co", label: "co", role: "hub", step: 2, x: 0, y: 110, url: "https://co.artelonga.com.br",
        stack: "Rust · Axum · SvelteKit · LiteFS",
        desc: { "pt-BR": "A Arte Longa lança o co: gestão de conteúdo com identidade única e cobrança centralizada de compute e storage — serviços web para pequenos negócios, software livre (GPL).",
                "en": "Arte Longa launches co: content management with one identity and centralized billing for compute and storage — web services for small businesses, free software (GPL)." } },
      { id: "hfs", label: "HFS Associados", role: "partner", step: 2, x: -190, y: 180, url: "https://hfsassociados.com.br/",
        desc: { "pt-BR": "Contabilidade, gestão fiscal e jurídico — parceiro da ArteLonga.",
                "en": "Accounting, tax and legal — ArteLonga's partner firm." } },
      { id: "rfq", label: "rfq", role: "service", step: 3, x: 180, y: 150, url: "https://rfq.artelonga.com.br/health",
        stack: "Rust · Axum",
        desc: { "pt-BR": "Cliente — market making para prediction markets (mercados de previsão), em tempo real.",
                "en": "Client — market making for prediction markets, in real time." } },
      { id: "hedix", label: "Hedix", role: "partner", step: 3, x: 300, y: 200, url: "https://hedix.com.br/",
        desc: { "pt-BR": "Market-making preditivo — parceiro de mercado do rfq.",
                "en": "Predictive market-making — rfq's market-maker partner." } },
      { id: "ygg", label: "yggdrasil", role: "service", step: 4, x: 110, y: 60, url: "https://yggdrasil.artelonga.com.br",
        stack: "Rust · Axum · Godot 4 · WASM",
        desc: { "pt-BR": "Cliente — game engine Godot 4 / WASM, web based: jogos que abrem direto no navegador, sem instalar.",
                "en": "Client — a Godot 4 / WASM game engine, web-based: games that open right in the browser, no install." } },
      { id: "comunicacao", label: "comunicação", role: "service", step: 5, x: -130, y: 200, url: "https://yggdrasil.artelonga.com.br/universos/comunicacao",
        stack: "Rust · Godot 4 · WASM",
        desc: { "pt-BR": "Cliente — universo de comunicação. Abriga mbyá e yorùbá.",
                "en": "Client — communication universe. Home to mbyá and yorùbá." } },
      { id: "mbya", label: "mbyá", role: "universe", step: 5, x: -240, y: 280, url: "https://yggdrasil.artelonga.com.br/universos/comunicacao?id=public-mbya",
        stack: "Godot 4 · WASM",
        desc: { "pt-BR": "Linguagem através da cultura e história — Mbyá Guarani.",
                "en": "Language through culture and history — Mbyá Guarani." } },
      { id: "yoruba", label: "yorùbá", role: "universe", step: 5, x: -90, y: 290, url: "https://yggdrasil.artelonga.com.br/universos/comunicacao?id=public-yoruba",
        stack: "Godot 4 · WASM",
        desc: { "pt-BR": "Linguagem através da cultura e história — Yorùbá.",
                "en": "Language through culture and history — Yorùbá." } },
      { id: "neuroanat", label: "neuroanatomy", role: "universe", step: 4, x: 210, y: 230, url: "https://yggdrasil.artelonga.com.br/static/anatomia/",
        stack: "Godot 4 · WASM",
        desc: { "pt-BR": "Atlas do cérebro — aprenda suas partes brincando.",
                "en": "A brain atlas — learn its parts by playing." } },
      { id: "neuro", label: "neuro", role: "universe", step: 6, x: 230, y: -40, url: "https://neuro.artelonga.com.br",
        stack: "Node (stdlib)",
        desc: { "pt-BR": "Um universo próprio: repositório público e aberto de bibliografia em neurociência, com o Neuro Notebook Brasil.",
                "en": "A universe of its own: a public, open repository of neuroscience bibliography, with Neuro Notebook Brasil." } },
      { id: "nnb", label: "Neuro Notebook", title: "Neuro Notebook Brasil", role: "partner", step: 6, x: 350, y: -110,
        desc: { "pt-BR": "Comunidade de neurociência — parceira do neuro na bibliografia aberta.",
                "en": "Neuroscience community — neuro's partner in the open bibliography." } },
      // Infra as a Service — a abstração que a ArteLonga acaba entregando (via co)
      { id: "storage", label: "storage", role: "infra", step: 2, x: -70, y: 230,
        desc: { "pt-BR": "Storage centralizado: o co guarda os dados de qualquer cliente como serviço.",
                "en": "Centralized storage: co keeps any client's data as a service." } },
      { id: "compute", label: "compute", role: "infra", step: 2, x: 70, y: 230,
        desc: { "pt-BR": "Compute centralizado: o co processa sob demanda como serviço.",
                "en": "Centralized compute: co runs processing on demand, as a service." } }
    ];
    var edges = [
      { a: "quilombo", b: "arte", type: "impacto", rest: 150, label: { "pt-BR": "impacto social", "en": "social impact" } },
      { a: "arte", b: "co", type: "develops", rest: 130, label: { "pt-BR": "desenvolve", "en": "develops" } },
      { a: "arte", b: "hfs", type: "partner", rest: 90 },
      { a: "co", b: "quilombo", type: "auth", rest: 165 },
      { a: "co", b: "rfq", type: "auth", rest: 175 },
      { a: "rfq", b: "hedix", type: "partner", rest: 90 },
      { a: "co", b: "ygg", type: "auth", rest: 165 },
      { a: "co", b: "comunicacao", type: "auth", rest: 170 },
      { a: "comunicacao", b: "mbya", type: "link", rest: 110 },
      { a: "comunicacao", b: "yoruba", type: "link", rest: 110 },
      { a: "ygg", b: "neuroanat", type: "link", rest: 115 },
      { a: "mbya", b: "quilombo", type: "impacto", rest: 140, label: { "pt-BR": "cultura e história", "en": "culture & history" } },
      { a: "yoruba", b: "quilombo", type: "impacto", rest: 150 },
      { a: "co", b: "neuro", type: "auth", rest: 185 },
      { a: "neuro", b: "nnb", type: "partner", rest: 90 },
      { a: "co", b: "storage", type: "infra", rest: 120, label: { "pt-BR": "IaaS", "en": "IaaS" } },
      { a: "co", b: "compute", type: "infra", rest: 120 }
    ];
    var steps = [
      { year: { "pt-BR": "out 2024", "en": "oct 2024" }, title: { "pt-BR": "ArteLonga", "en": "ArteLonga" },
        body: { "pt-BR": "Tudo começa com a agência — carreira, marca, tecnologia e comunicação. O ponto de partida.",
                "en": "It all begins with the agency — career, brand, technology and communication. The starting point." } },
      { year: { "pt-BR": "out 2024", "en": "oct 2024" }, title: { "pt-BR": "Quilombo Araucária", "en": "Quilombo Araucária" },
        body: { "pt-BR": "Oferecemos serviços web pro-bono ao Quilombo Araucária, um espaço comunitário de resistência cultural, social e ambiental na periferia de São Paulo.",
                "en": "We provide pro-bono web services to Quilombo Araucária, a community space for cultural, social and environmental resistance in the periphery of São Paulo." } },
      { year: { "pt-BR": "mar 2026", "en": "mar 2026" }, title: { "pt-BR": "co — a plataforma", "en": "co — the platform" },
        body: { "pt-BR": "A Arte Longa lança o co: gestão de conteúdo com identidade única e cobrança centralizada de compute e storage — serviços web para pequenos negócios, software livre (GPL).",
                "en": "Arte Longa launches co: content management with one identity and centralized billing for compute and storage — web services for small businesses, free software (GPL)." } },
      { year: { "pt-BR": "abr 2026", "en": "apr 2026" }, title: { "pt-BR": "rfq", "en": "rfq" },
        body: { "pt-BR": "Primeiro serviço na nova plataforma: precificação RFQ em tempo real, em parceria com o market-maker Hedix.",
                "en": "First service on the new platform: real-time RFQ pricing, partnered with the Hedix market-maker." } },
      { year: { "pt-BR": "mai 2026", "en": "may 2026" }, title: { "pt-BR": "yggdrasil", "en": "yggdrasil" },
        body: { "pt-BR": "Jogos e experiências como universos que abrem direto no navegador. Junto, o neuroanatomy — atlas do cérebro pra aprender brincando.",
                "en": "Games and experiences as universes that open right in the browser. Alongside it, neuroanatomy — a brain atlas to learn by playing." } },
      { year: { "pt-BR": "mai 2026", "en": "may 2026" }, title: { "pt-BR": "comunicação", "en": "comunicação" },
        body: { "pt-BR": "Dentro do yggdrasil, a comunicação abriga mbyá e yorùbá — linguagem através da cultura e história, ligadas ao Quilombo Araucária.",
                "en": "Inside yggdrasil, comunicação holds mbyá and yorùbá — language through culture and history, tied to Quilombo Araucária." } },
      { year: { "pt-BR": "mai 2026", "en": "may 2026" }, title: { "pt-BR": "neuro", "en": "neuro" },
        body: { "pt-BR": "Um universo próprio: repositório público e aberto de bibliografia em neurociência, em colaboração com o Neuro Notebook Brasil.",
                "en": "A universe of its own: a public, open repository of neuroscience bibliography, with Neuro Notebook Brasil." } },
      { year: { "pt-BR": "2026", "en": "2026" }, title: { "pt-BR": "Parceiros chegam rápido", "en": "Partners arrive fast" },
        body: { "pt-BR": "E os parceiros chegam rápido — cada universo e cada parceiro entra na rede pelo co.",
                "en": "And partners arrive fast — every universe and partner joins the network through co." } },
      { year: { "pt-BR": "hoje", "en": "today" }, title: { "pt-BR": "A rede, hoje", "en": "The network, today" },
        body: { "pt-BR": "Tudo no ar, em São Paulo — e crescendo rápido.",
                "en": "All live, in São Paulo — and growing fast." }, stats: STATS, chart: CHART }
    ];
    return { nodes: nodes, edges: edges, steps: steps };
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
    var m = model(), nodes = m.nodes, edges = m.edges, steps = m.steps;
    var byId = {}; nodes.forEach(function (n) { byId[n.id] = n; n.vx = 0; n.vy = 0; });
    // layout DETERMINÍSTICO (sem física que embola): posições fixas, pré-espaçadas → zero sobreposição
    var POS = {
      arte: [0, -260], hfs: [-210, -245], co: [0, -120], storage: [-80, -25], compute: [80, -25],
      // esquerda: cluster de impacto/cultura (Quilombo + comunicação + mbyá + yorùbá), no sentido anti-horário
      quilombo: [-340, 70], comunicacao: [-250, 215], mbya: [-360, 325], yoruba: [-185, 330],
      // direita/centro: clientes + parceiros
      ygg: [120, 70], neuroanat: [70, 215], rfq: [265, 150], hedix: [340, 275], neuro: [330, -45], nnb: [475, -115]
    };
    nodes.forEach(function (n) { var p = POS[n.id]; if (p) { n.tx = p[0]; n.ty = p[1]; n.x = p[0]; n.y = p[1]; } else { n.tx = n.x; n.ty = n.y; } });
    var maxStep = steps.length - 1;
    var perfNow = (window.performance && performance.now) ? function () { return performance.now(); } : function () { return 0; };
    var POP = 480;

    var cur = 0, stepAt = {};               // passo atual + quando cada passo foi revelado
    stepAt[0] = perfNow();

    container.classList.add("sysgraph");
    container.innerHTML =
      '<div class="sg-canvas-wrap"><canvas></canvas>' +
        '<div class="sg-legend">' +
          '<span><i class="d root"></i>' + esc(T.legRoot) + '</span>' +
          '<span><i class="d hub"></i>' + esc(T.legHub) + '</span>' +
          '<span><i class="d universe"></i>' + esc(T.legUniverse) + '</span>' +
          '<span><i class="d infra"></i>' + esc(T.legInfra) + '</span>' +
          '<span><i class="d partner"></i>' + esc(T.legPartner) + '</span>' +
        '</div>' +
        '<div class="sg-hint">' + esc(T.hint) + '</div>' +
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
    var track = container.querySelector(".sg-track");
    var panel = container.querySelector(".sg-panel");
    var counter = container.querySelector(".sg-counter");

    var cam = { x: 0, y: 0, scale: 1 }, fitUntil = 0;
    var W = 0, H = 0, dpr = 1, hover = null, pinned = null, drag = null, panning = null, downPt = null, moved = false;

    function resize() {
      var r = canvas.parentNode.getBoundingClientRect();
      W = r.width; H = r.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      canvas.style.width = W + "px"; canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function vis(n) { return n.step <= cur; }
    function visE(e) { return vis(byId[e.a]) && vis(byId[e.b]); }
    function toScreen(n) { return { x: W / 2 + (n.x + cam.x) * cam.scale, y: H / 2 + (n.y + cam.y) * cam.scale }; }
    function toWorld(px, py) { return { x: (px - W / 2) / cam.scale - cam.x, y: (py - H / 2) / cam.scale - cam.y }; }
    function radius(n) { return n.role === "hub" ? 26 : n.role === "root" ? 25 : n.role === "infra" ? 20 : n.role === "partner" ? 13 : 18; }
    function easeBack(t) { if (t <= 0) return 0; if (t >= 1) return 1; var c1 = 1.7, c3 = c1 + 1, u = t - 1; return 1 + c3 * u * u * u + c1 * u * u; }

    // ── física (só nós visíveis; sem sobreposição) ──
    var REP = 26000, SPR = 0.04, GRAV = 0.0015, DAMP = 0.86, SEP = 34;
    function step() {              // layout determinístico — cada nó desliza p/ sua posição fixa (sem embolar)
      nodes.filter(vis).forEach(function (n) {
        if (n === drag) return;
        n.x += (n.tx - n.x) * 0.16; n.y += (n.ty - n.y) * 0.16;
      });
    }

    function fit(snap) {
      var v = nodes.filter(vis); if (!v.length) return;
      var minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
      v.forEach(function (n) { var r = radius(n) + 18;
        minX = Math.min(minX, n.x - r); maxX = Math.max(maxX, n.x + r);
        minY = Math.min(minY, n.y - r); maxY = Math.max(maxY, n.y + r + 14); });
      var P = 34, bw = maxX - minX || 1, bh = maxY - minY || 1;
      var ts = Math.max(0.45, Math.min(1.25, Math.min((W - 2 * P) / bw, (H - 2 * P) / bh)));
      var tx = -(minX + maxX) / 2, ty = -(minY + maxY) / 2;
      if (snap) { cam.scale = ts; cam.x = tx; cam.y = ty; }
      else { cam.scale += (ts - cam.scale) * 0.12; cam.x += (tx - cam.x) * 0.12; cam.y += (ty - cam.y) * 0.12; }
    }

    var C = { ink: "#161413", ink3: "#938b85", line: "#cfc8c0", accent: "#9a3b2e", bg2: "#fffdfa", green: "#6dbf8b", greenInk: "#3f7a59", blue: "#3a6ea5", blueBg: "#e7eef7" };
    function connected(id) { var s = {}; edges.forEach(function (e) { if (e.a === id) s[e.b] = 1; if (e.b === id) s[e.a] = 1; }); return s; }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      var hl = hover || pinned, near = hl ? connected(hl.id) : null, now = perfNow();
      function prog(n) { var t = stepAt[n.step]; if (n.step < cur || t == null) return 1; return Math.max(0, Math.min(1, (now - t) / POP)); }
      edges.forEach(function (e) {
        if (!visE(e)) return;
        var al = Math.min(prog(byId[e.a]), prog(byId[e.b])); if (al <= 0) return;
        var a = toScreen(byId[e.a]), b = toScreen(byId[e.b]), on = hl && (e.a === hl.id || e.b === hl.id);
        ctx.globalAlpha = al; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
        if (e.type === "link") { ctx.setLineDash([5, 4]); ctx.strokeStyle = on ? C.accent : "rgba(154,59,46,.5)"; ctx.lineWidth = on ? 2.2 : 1.5; }
        else if (e.type === "partner") { ctx.setLineDash([2, 3]); ctx.strokeStyle = on ? C.ink : "rgba(147,139,133,.7)"; ctx.lineWidth = on ? 2 : 1.3; }
        else if (e.type === "impacto") { ctx.setLineDash([]); ctx.strokeStyle = on ? C.greenInk : C.green; ctx.lineWidth = on ? 2.8 : 2.1; }
        else if (e.type === "develops") { ctx.setLineDash([]); ctx.strokeStyle = on ? C.ink : "#5b5450"; ctx.lineWidth = on ? 3 : 2.4; }
        else if (e.type === "infra") { ctx.setLineDash([]); ctx.strokeStyle = on ? "#274d75" : C.blue; ctx.lineWidth = on ? 3.2 : 2.6; }
        else { ctx.setLineDash([]); ctx.strokeStyle = on ? C.ink : C.line; ctx.lineWidth = on ? 2.2 : 1.5; }
        ctx.stroke(); ctx.setLineDash([]);
        if (e.label && al > 0.85) {
          var txt = e.label[LANG] || e.label.en || "", mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
          ctx.font = "600 10px 'Space Mono', ui-monospace, monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
          var tw = ctx.measureText(txt).width, pw = tw + 12;
          ctx.fillStyle = "rgba(251,249,246,.94)";
          if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(mx - pw / 2, my - 8, pw, 16, 5); ctx.fill(); } else ctx.fillRect(mx - pw / 2, my - 8, pw, 16);
          ctx.fillStyle = e.type === "impacto" ? C.greenInk : e.type === "infra" ? C.blue : C.ink; ctx.fillText(txt, mx, my);
        }
        ctx.globalAlpha = 1;
      });
      ctx.textAlign = "center";
      nodes.filter(vis).forEach(function (n) {
        var pr = prog(n); if (pr <= 0) return;
        var p = toScreen(n), rFull = radius(n) * Math.min(cam.scale, 1.3), r = rFull * easeBack(pr);
        var dim = hl && n !== hl && !(near && near[n.id]), isHL = n === hl;
        ctx.globalAlpha = (dim ? 0.3 : 1) * Math.min(1, pr * 1.5);
        var infra = n.role === "infra";
        ctx.save();
        ctx.shadowColor = infra ? "rgba(58,110,165,.5)" : "rgba(22,20,19,.16)";   // infra = brilho azul (destaque)
        ctx.shadowBlur = infra ? (isHL ? 22 : 16) : (isHL ? 14 : 7); ctx.shadowOffsetY = infra ? 0 : 2;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = n.role === "hub" ? C.accent : n.role === "root" ? C.ink : n.role === "universe" ? "#fbeae6" : n.role === "partner" ? "#f1ede8" : infra ? C.blueBg : C.bg2;
        ctx.fill(); ctx.restore();
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        if (n.role === "hub") { ctx.lineWidth = isHL ? 3 : 2; ctx.strokeStyle = "#7a2e23"; ctx.stroke(); }
        else if (n.role === "root") { ctx.lineWidth = isHL ? 3 : 2; ctx.strokeStyle = "#000"; ctx.stroke(); }
        else if (n.role === "universe") { ctx.lineWidth = isHL ? 3 : 2; ctx.strokeStyle = C.accent; ctx.stroke(); }
        else if (n.role === "partner") { ctx.setLineDash([2, 3]); ctx.lineWidth = isHL ? 2 : 1.4; ctx.strokeStyle = C.ink3; ctx.stroke(); ctx.setLineDash([]); }
        else if (infra) { ctx.lineWidth = isHL ? 3 : 2.4; ctx.strokeStyle = C.blue; ctx.stroke(); }
        else { ctx.lineWidth = isHL ? 2.6 : 1.6; ctx.strokeStyle = C.ink; ctx.stroke(); }
        if (pr > 0.5) {
          ctx.globalAlpha = (dim ? 0.4 : 1) * Math.min(1, (pr - 0.5) * 3);
          var inside = n.role === "hub";   // só o "co" (curto) cabe dentro; ArteLonga e o resto vão embaixo
          ctx.font = (n.role === "hub" || n.role === "root" ? "700 13px" : n.role === "partner" ? "600 11px" : "600 12px") + " 'Space Mono', ui-monospace, monospace";
          ctx.textBaseline = "top";
          if (inside) { ctx.fillStyle = "#fff"; ctx.textBaseline = "middle"; ctx.fillText(n.label, p.x, p.y); }
          else { ctx.fillStyle = n.role === "root" ? C.ink : n.role === "universe" ? C.accent : n.role === "partner" ? C.ink3 : infra ? C.blue : C.ink; ctx.fillText(n.label, p.x, p.y + rFull + 5); }
        }
        ctx.globalAlpha = 1;
      });
    }

    var raf = 0;
    function loop() {
      if (!container.isConnected) { stop(); return; }
      if (!drag) step();
      if (!panning && !drag && perfNow() < fitUntil) fit(false);   // re-enquadra após mudar de passo
      draw();
      raf = window.requestAnimationFrame(loop);
    }

    // ── timeline UI ──
    function yearOf(s) { var y = steps[s].year; return typeof y === "string" ? y : (y[LANG] || y.en); }
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
      var statsHtml = s.stats ? '<div class="sg-stats">' + s.stats.map(function (x) {
        return '<div class="sg-stat"><b>' + esc(x.n) + '</b><span>' + esc(x.l[LANG] || x.l.en) + '</span></div>'; }).join("") + '</div>' : "";
      var chartHtml = "";
      if (s.chart) {
        var mx = Math.max.apply(null, s.chart.map(function (c) { return c.v; }));
        chartHtml = '<div class="sg-chart">' + s.chart.map(function (c) {
          var w = Math.max(7, Math.round(c.v / mx * 100));
          return '<div class="sg-bar"><span class="sg-bl">' + esc(c.l[LANG] || c.l.en) + '</span>' +
            '<span class="sg-btr"><span class="sg-bf" style="width:' + w + '%"></span></span>' +
            '<b class="sg-bv">' + esc(String(c.v).replace(/\B(?=(\d{3})+(?!\d))/g, ".")) + '</b></div>';
        }).join("") + '</div>';
      }
      panel.innerHTML = '<div class="sg-pyear">' + esc(yearOf(cur)) + '</div>' +
        '<h3 class="sg-ptitle">' + esc(s.title[LANG] || s.title.en) + '</h3>' +
        '<p class="sg-pbody">' + esc(s.body[LANG] || s.body.en) + '</p>' + chartHtml + statsHtml;
      panel.style.animation = "none"; void panel.offsetWidth; panel.style.animation = "";   // re-dispara o fade
      counter.textContent = (cur + 1) + " / " + steps.length;
      Array.prototype.forEach.call(track.children, function (b, k) { b.className = "sg-tk" + (k === cur ? " on" : k < cur ? " done" : ""); });
      container.querySelector(".sg-prev").disabled = cur === 0;
      container.querySelector(".sg-next").disabled = cur === maxStep;
      container.querySelector(".sg-ov-prev").disabled = cur === 0;
      container.querySelector(".sg-ov-next").disabled = cur === maxStep;
    }
    function goStep(s) {
      s = Math.max(0, Math.min(maxStep, s)); if (s === cur && stepAt[s] != null) { return; }
      var growing = s > cur;
      cur = s;
      if (stepAt[cur] == null) stepAt[cur] = perfNow();
      else stepAt[cur] = perfNow();           // re-anima ao revisitar
      // semeia posição dos nós recém-visíveis perto de um vizinho já visível
      if (growing) nodes.filter(function (n) { return n.step === cur; }).forEach(function (n) {
        var nb = null; edges.forEach(function (e) { if (e.a === n.id && byId[e.b].step < cur) nb = byId[e.b]; if (e.b === n.id && byId[e.a].step < cur) nb = byId[e.a]; });
        if (nb) { n.x = nb.x + (n.x - nb.x) * 0.25; n.y = nb.y + 40 + (n.y - nb.y) * 0.25; n.vx = n.vy = 0; }
      });
      renderPanel();
      pinned = null; tip.hidden = true;
      fitUntil = perfNow() + 1400;            // re-enquadra a rede que cresceu
    }

    container.querySelector(".sg-prev").onclick = function () { goStep(cur - 1); };
    container.querySelector(".sg-next").onclick = function () { goStep(cur + 1); };
    container.querySelector(".sg-ov-prev").onclick = function () { goStep(cur - 1); };
    container.querySelector(".sg-ov-next").onclick = function () { goStep(cur + 1); };

    // ── hit testing + tooltip ──
    function pick(px, py) { var best = null, bd = 1e9; nodes.filter(vis).forEach(function (n) { var p = toScreen(n), d = Math.hypot(px - p.x, py - p.y); if (d <= radius(n) + 6 && d < bd) { best = n; bd = d; } }); return best; }
    function roleLabel(n) { return n.role === "hub" ? T.roleHub : n.role === "root" ? T.roleRoot : n.role === "infra" ? T.roleInfra : n.role === "universe" ? T.roleUniverse : n.role === "partner" ? T.rolePartner : T.roleService; }
    function showTip(n, px, py, pin) {
      var link = n.url ? '<a href="' + esc(n.url) + '" target="_blank" rel="noopener">' + esc(T.open) + '</a>' : "";
      var stk = n.stack ? '<span class="sg-stack">' + esc(T.stack) + ' · ' + esc(n.stack) + '</span>' : "";
      tip.innerHTML = '<div class="sg-th"><b>' + esc(n.title || n.label) + '</b>' + link + '</div>' +
        '<i class="sg-role sg-role-' + n.role + '">' + esc(roleLabel(n)) + '</i>' +
        '<span>' + esc((n.desc && (n.desc[LANG] || n.desc.en)) || "") + '</span>' + stk;
      tip.hidden = false;
      var tw = tip.offsetWidth, th = tip.offsetHeight;
      tip.style.left = Math.max(6, Math.min(px + 12, W - tw - 6)) + "px";
      tip.style.top = Math.max(6, Math.min(py + 12, H - th - 6)) + "px";
      tip.classList.toggle("pin", !!pin);
    }
    function hideTip() { if (!pinned) { tip.hidden = true; tip.classList.remove("pin"); } }
    function localPt(ev) { var r = canvas.getBoundingClientRect(), t = ev.touches && ev.touches[0]; return { x: (t ? t.clientX : ev.clientX) - r.left, y: (t ? t.clientY : ev.clientY) - r.top }; }

    function onDown(ev) { fitUntil = 0; var pt = localPt(ev); downPt = pt; moved = false; var n = pick(pt.x, pt.y); if (n) { drag = n; drag._w = toWorld(pt.x, pt.y); } else panning = { x: pt.x, y: pt.y, cx: cam.x, cy: cam.y }; }
    function onMove(ev) {
      var pt = localPt(ev); if (downPt && Math.hypot(pt.x - downPt.x, pt.y - downPt.y) > 4) moved = true;
      if (drag) { var w = toWorld(pt.x, pt.y); drag.x += w.x - drag._w.x; drag.y += w.y - drag._w.y; drag._w = w; if (ev.preventDefault) ev.preventDefault(); }
      else if (panning) { cam.x = panning.cx + (pt.x - panning.x) / cam.scale; cam.y = panning.cy + (pt.y - panning.y) / cam.scale; if (ev.preventDefault) ev.preventDefault(); }
      else { var h = pick(pt.x, pt.y); hover = h; canvas.style.cursor = h ? "pointer" : "grab"; if (h && !pinned) showTip(h, pt.x, pt.y, false); else hideTip(); }
    }
    function onUp() {
      if (drag && !moved) { pinned = drag; var p = toScreen(drag); showTip(drag, p.x, p.y, true); if (window.AL_track) try { window.AL_track("sys_graph_node", { id: drag.id }); } catch (e) {} }
      else if (panning && !moved) { if (pinned) { pinned = null; hideTip(); } else goStep(cur + 1); }   // clicar no vazio → avança a história
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

    resize(); renderTrack(); renderPanel();
    for (var k = 0; k < 60; k++) step();    // assenta a ArteLonga sozinha
    fit(true); fitUntil = perfNow() + 900;
    loop();
    return { destroy: stop };
  }

  window.SystemGraph = { mount: mount };
})();
