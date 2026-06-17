/* relations-graph.js — grafo único do portfólio: "de onde vim → o que fiz → como se conectam".
 * Âncoras (lugares/épocas) fixas numa espinha cronológica; peças (entradas) penduradas
 * na âncora onde nasceram (força-dirigido, âncoras fixas) + relações `related` entre peças.
 * SVG, peças clicáveis (?e=slug), cor por tema. Determinístico. window.RelationsGraph.mount(el,{lang}). */
(function () {
  var COLORS = {
    sistemas: "#9a3b2e", tecnologia: "#9a3b2e", dados: "#c0612e",
    "neurociência": "#2e6b6b", biologia: "#2e6b6b", social: "#5f7a34", metodologia: "#6a6a6a"
  };
  // espinha cronológica; cada âncora lista as peças (tkeys) nascidas ali. aws aparece em Propz E PointSet.
  var ANCHORS = [
    { id: "usp", label: { "pt-BR": "USP · Butantan", en: "USP · Butantan" }, era: "2012",
      desc: { "pt-BR": "Onde comecei: pesquisa de público nos museus (USP/Butantan, FAPESP) e a origem da minha visualização de dados.", en: "Where I began: museum audience research (USP/Butantan, FAPESP) and the origin of my data visualization." },
      pieces: ["dehydration-toads", "pesquisa-quilombo"] },
    { id: "uchicago", label: { "pt-BR": "U. Chicago", en: "U. Chicago" }, era: "2015–22",
      desc: { "pt-BR": "Neurobiologia: três artigos, uma patente, a tese, e o cuidado com dados sensíveis de saúde.", en: "Neurobiology: three papers, a patent, the thesis, and care with sensitive health data." },
      pieces: ["proprioception-thesis", "theseometer-patent", "propriosuite", "bystander-rats", "helping-rats", "sensory-speech", "fitts-game", "neuro"] },
    { id: "propz", label: { "pt-BR": "Propz", en: "Propz" }, era: "2023",
      desc: { "pt-BR": "Inteligência analítica para varejo, em escala sobre Apache Spark e Delta Lake (na AWS).", en: "Retail analytical intelligence at scale on Apache Spark and Delta Lake (on AWS)." },
      pieces: ["aws"] },
    { id: "pointset", label: { "pt-BR": "PointSet", en: "PointSet" }, era: "2024–26",
      desc: { "pt-BR": "Finanças quantitativas: dados de mercado em tempo real, na AWS.", en: "Quantitative finance: real-time market data, on AWS." },
      pieces: ["aws"] },   // lateral-movement saiu daqui: é projeto paralelo (entra como satélite via related)
    { id: "co", label: { "pt-BR": "co · ArteLonga", en: "co · ArteLonga" }, era: "2025→",
      desc: { "pt-BR": "A plataforma: privacidade e segurança de dados como serviço para pequenos negócios.", en: "The platform: data privacy and security as a service for small businesses." },
      pieces: ["intelligence-as-a-service", "telemetria", "domains", "use-cases", "user-template", "hostinger", "scrum-delivery", "lead-acquisition"] }
  ];
  var T = { "pt-BR": { title: "De onde vim → o que fiz", hint: "clique numa peça" },
            en: { title: "From where I came → what I made", hint: "click a piece" } };
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
  function lab(o, lang){return (o && typeof o === "object") ? (o[lang] || o["pt-BR"] || o.en) : o;}

  function mount(el, opts) {
    opts = opts || {};
    fetch("/yuri/entries.json", { cache: "no-cache" })
      .then(function (r) { return r.json(); }).then(function (d) { render(el, d.entries || [], opts); })
      .catch(function () {});
    return { destroy: function () { el.innerHTML = ""; } };
  }

  function render(el, entries, opts) {
    var lang = opts.lang || "pt-BR", L = T[lang] || T["pt-BR"];
    var byk = {}; entries.forEach(function (e) { var k = e.tkey || e.slug; if (!byk[k] || e.lang === lang) byk[k] = e; });

    var W = 980, pad = 70, anchorY = 92, topGap = 60, rowH = 36;
    // swimlane: cada âncora é uma coluna; suas peças empilham embaixo (legível, sem sobreposição)
    var nodes = [], idx = {};
    ANCHORS.forEach(function (A, i) {
      var x = pad + (ANCHORS.length === 1 ? 0 : i * (W - 2 * pad) / (ANCHORS.length - 1));
      A._x = x; idx[A.id] = nodes.length;
      nodes.push({ id: A.id, anchor: true, x: x, y: anchorY, label: lab(A.label, lang), era: A.era, desc: lab(A.desc, lang) });
    });
    var placed = {}, maxRows = 0;   // cada peça na 1ª âncora que a lista
    ANCHORS.forEach(function (A) {
      A._cols = []; A.pieces.forEach(function (tk) { if (placed[tk] || !byk[tk]) return; placed[tk] = A.id; A._cols.push(tk); });
      if (A._cols.length > maxRows) maxRows = A._cols.length;
    });
    ANCHORS.forEach(function (A) {
      A._cols.forEach(function (tk, j) {
        var e = byk[tk]; idx[tk] = nodes.length;
        nodes.push({ id: tk, anchor: false, slug: e.slug, cat: e.category, e: e,
          label: (e.title || tk).replace(/ —.*$/, "").slice(0, 22),
          x: A._x + ((j % 2) * 2 - 1) * 7, y: anchorY + topGap + j * rowH });
      });
    });
    var H = anchorY + topGap + maxRows * rowH + 24;
    // peças "side" (projeto paralelo): aparecem em related mas sem âncora → satélite do vizinho
    Object.keys(placed).forEach(function (host) {
      var he = byk[host]; if (!he || !he.related) return;
      he.related.forEach(function (t) {
        if (placed[t] || idx[t] != null || !byk[t]) return;
        var base = nodes[idx[host]], e = byk[t]; idx[t] = nodes.length; placed[t] = host;
        nodes.push({ id: t, anchor: false, side: true, slug: e.slug, cat: e.category, e: e,
          label: (e.title || t).replace(/ —.*$/, "").slice(0, 22),
          x: Math.max(46, base.x - 66), y: base.y + 32 });
      });
    });

    // arestas: espinha (âncora-âncora) · âncora→peça (aws liga Propz E PointSet) · related (peça↔peça)
    var edges = [], seen = {};
    for (var i = 0; i < ANCHORS.length - 1; i++) edges.push({ a: idx[ANCHORS[i].id], b: idx[ANCHORS[i + 1].id], kind: "spine" });
    ANCHORS.forEach(function (A) { A.pieces.forEach(function (tk) { if (idx[tk] != null) edges.push({ a: idx[A.id], b: idx[tk], kind: "made" }); }); });
    Object.keys(placed).forEach(function (tk) {
      var e = byk[tk]; if (!e || !e.related) return;
      e.related.forEach(function (t) { if (idx[t] == null || nodes[idx[t]].anchor) return;
        var key = [tk, t].sort().join("|"); if (seen[key]) return; seen[key] = 1;
        edges.push({ a: idx[tk], b: idx[t], kind: "rel" }); });
    });

    function line(e) {
      var cls = e.kind === "spine" ? "rg-spine" : (e.kind === "rel" ? "rg-edge rg-rel" : "rg-edge");
      return '<line x1="' + nodes[e.a].x.toFixed(1) + '" y1="' + nodes[e.a].y.toFixed(1) +
        '" x2="' + nodes[e.b].x.toFixed(1) + '" y2="' + nodes[e.b].y.toFixed(1) + '" class="' + cls + '"/>';
    }
    var L1 = edges.filter(function (e) { return e.kind !== "spine"; }).map(line).join("");
    var spine = edges.filter(function (e) { return e.kind === "spine"; }).map(line).join("");
    var dots = nodes.map(function (n) {
      if (n.anchor) {
        return '<g class="rg-anchor" data-id="' + esc(n.id) + '">' +
          '<circle cx="' + n.x.toFixed(1) + '" cy="' + n.y.toFixed(1) + '" r="18" fill="transparent"/>' +
          '<circle cx="' + n.x.toFixed(1) + '" cy="' + n.y.toFixed(1) + '" r="9" fill="#161413"/>' +
          '<text x="' + n.x.toFixed(1) + '" y="' + (n.y - 16).toFixed(1) + '" class="rg-alabel">' + esc(n.label) + '</text>' +
          '<text x="' + n.x.toFixed(1) + '" y="' + (n.y - 30).toFixed(1) + '" class="rg-era">' + esc(n.era) + '</text></g>';
      }
      var col = COLORS[n.cat] || "#6a6a6a", r = n.side ? 5 : 6;
      return '<a href="?e=' + encodeURIComponent(n.slug) + '" class="rg-node" data-id="' + esc(n.id) + '">' +
        '<circle cx="' + n.x.toFixed(1) + '" cy="' + n.y.toFixed(1) + '" r="15" fill="transparent"/>' +
        '<circle cx="' + n.x.toFixed(1) + '" cy="' + n.y.toFixed(1) + '" r="' + r + '" fill="' + col + '"' + (n.side ? ' stroke="#fff" stroke-width="1.5"' : '') + '/>' +
        '<text x="' + n.x.toFixed(1) + '" y="' + (n.y + 16).toFixed(1) + '" class="rg-label">' + esc(n.label) + '</text></a>';
    }).join("");
    el.innerHTML =
      '<div class="rg-head"><span class="rg-title">' + esc(L.title) + '</span><span class="rg-hint">' + esc(L.hint) + '</span></div>' +
      '<svg viewBox="0 0 ' + W + ' ' + H + '" class="rg-svg" role="img" aria-label="' + esc(L.title) + '">' +
      spine + L1 + dots + '</svg>';

    // hover: tooltip com título + abstract + thumbnail (quando há) + serviços (AWS)
    var tip = document.createElement("div"); tip.className = "rg-tip"; tip.hidden = true; el.appendChild(tip);
    var NODES = {}; nodes.forEach(function (n) { NODES[n.id] = n; });
    function plain(s) { return String(s || "").replace(/\*\*/g, ""); }
    function tipHtml(n) {
      if (n.anchor) return '<strong>' + esc(n.label) + '</strong> <span class="rg-tera">' + esc(n.era) + '</span><p>' + esc(n.desc) + '</p>';
      var e = n.e || {}, h = '<strong>' + esc(e.title || n.label) + '</strong>' + (n.side ? ' <span class="rg-tera">' + (lang === "pt-BR" ? "projeto paralelo" : "side project") + '</span>' : '');
      if (e.image) h += '<img src="' + esc(e.image) + '" alt="" loading="lazy">';
      if (e.abstract) h += '<p>' + esc(plain(e.abstract)) + '</p>'; else if (e.significance) h += '<p>' + esc(e.significance) + '</p>';
      if (e.services && e.services.length) h += '<div class="rg-svc"><span>' + (lang === "pt-BR" ? "serviços:" : "services:") + '</span> ' + e.services.map(esc).join(" · ") + '</div>';
      return h;
    }
    el.querySelectorAll("[data-id]").forEach(function (g) {
      var n = NODES[g.getAttribute("data-id")]; if (!n) return;
      g.addEventListener("mouseenter", function () { tip.innerHTML = tipHtml(n); tip.hidden = false; });
      g.addEventListener("mouseleave", function () { tip.hidden = true; });
    });
    el.addEventListener("mousemove", function (ev) {
      if (tip.hidden) return;
      var r = el.getBoundingClientRect(), x = ev.clientX - r.left + 16, y = ev.clientY - r.top + 16;
      if (x + 270 > el.clientWidth) x = ev.clientX - r.left - 282;
      tip.style.left = Math.max(4, x) + "px"; tip.style.top = y + "px";
    });
  }

  window.RelationsGraph = { mount: mount };
})();
