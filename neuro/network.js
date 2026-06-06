/* neuro/network.js — grafo orgânico de conexões.
 *
 * Dados e lógica de negócio do grafo neuro. Rendering, física e câmera
 * delegados ao co_graph (https://co.artelonga.com.br/lib/co-graph.js).
 *
 * MODE "open"   → tudo já aberto.
 * MODE "guided" → progressivo, com anel + "＋n" indicando que há mais. */
(function () {
  "use strict";
  var el = document.querySelector("[data-network]");
  if (!el) return;
  if (!window.co_graph) { console.warn("co_graph não carregado"); return; }
  var NC = window.NeuroCite;
  var refByKey = {}; if (NC && NC.items) NC.items.forEach(function (r) { refByKey[r.key] = r; });
  var MODE = window.NEURO_NET_MODE === "guided" ? "guided" : "open";

  // ── Dados declarativos (inalterados) ────────────────────────────────────────
  var FIELDS = [
    { id: "filosofia",    label: "Filosofia",             summary: "Mente, consciência e o que é decidir.", refs: ["sciadv2020"] },
    { id: "matematica",   label: "Matemática",            summary: "Modelos dos circuitos e do comportamento.", refs: [] },
    { id: "fisica",       label: "Física",                summary: "Sinais e dinâmica da atividade neural.", refs: [] },
    { id: "linguistica",  label: "Linguística",           summary: "Como o cérebro produz e entende linguagem.", refs: [] },
    { id: "compcs",       label: "Ciência computacional", summary: "Computação, dados e aprendizado de máquina.", refs: [] },
    { id: "biologia",     label: "Biologia",              summary: "O cérebro como órgão vivo e evoluído.", refs: ["fapesp", "frontiers2016", "biorxiv2022"] },
    { id: "quimica",      label: "Química",               summary: "A base molecular do comportamento.", refs: [] },
    { id: "farmacologia", label: "Farmacologia",          summary: "Drogas que mudam o comportamento.", refs: ["frontiers2016"] },
    { id: "psiquiatria",  label: "Psiquiatria",           summary: "Quando o cérebro social adoece.", refs: [] },
  ];
  var RESEARCH = [
    { id: "r1", label: "NLP I",           summary: "Introdução ao processamento de linguagem natural.", refKey: "colab1" },
    { id: "r2", label: "NLP II",          summary: "Introdução ao PLN (parte II).", refKey: "colab2" },
    { id: "r3", label: "Clustering / DR", summary: "Agrupamento e redução de dimensionalidade.", refKey: "colab3" },
    { id: "r4", label: "Topic Modeling",  summary: "Modelagem de tópicos.", refKey: "colab4" },
  ];
  var COURSES = [
    { id: "k1", label: "Fundamental Neuroscience",        summary: "Fundamentos do sistema nervoso (2018)." },
    { id: "k2", label: "Structure of the Nervous System", summary: "Anatomia dos circuitos neurais (2020)." },
    { id: "k3", label: "Workings of the Human Brain",     summary: "Como o cérebro humano funciona (2022)." },
    { id: "k4", label: "Core Biology",                    summary: "Biologia essencial (2021)." },
    { id: "k5", label: "From Fossils to Fermi's Paradox", summary: "Da origem da vida à vida no cosmos (2021)." },
  ];
  var SUMMARY = {
    neuro:   "A neurociência e os campos que ela conecta.",
    exp2022: "Assistente de Pesquisa (2022): pesquisa e ensino em neurociência afetiva e cognitiva.",
  };
  var childrenOf = {};
  childrenOf.neuro = FIELDS.map(function (f) { return { id: f.id, label: f.label, kind: "field", summary: f.summary }; })
    .concat([{ id: "exp2022", label: "Pesquisa", kind: "exp", summary: SUMMARY.exp2022 }]);
  FIELDS.forEach(function (f) {
    childrenOf[f.id] = f.refs.map(function (k) {
      var r = refByKey[k];
      return { id: f.id + ":" + k, label: r && NC ? NC.inlineLabel(r).replace(/[()]/g, "") : k, kind: "ref", refKey: k, summary: r ? r.title : k };
    });
  });
  childrenOf.exp2022 = [
    { id: "branch_dl",     label: "Deep Learning", kind: "branch", summary: "Aprendizado profundo e PLN." },
    { id: "branch_ensino", label: "Ensino",        kind: "branch", summary: "Disciplinas que ensinei." },
  ];
  childrenOf.branch_dl     = RESEARCH.map(function (r) { return { id: r.id, label: r.label, kind: "research", refKey: r.refKey, summary: r.summary }; });
  childrenOf.branch_ensino = COURSES.map(function (c)  { return { id: c.id, label: c.label, kind: "course",   summary: c.summary }; });
  var CROSS = [
    { from: "branch_dl", to: "compcs" },
    { from: "r2",        to: "linguistica" },
  ];

  // ── Cores por tipo ───────────────────────────────────────────────────────────
  var COL = { root: "#e8eaed", field: "#aeb6bd", exp: "#e0a96d", branch: "#d2b48c", research: "#7fa7d6", course: "#8fcf9b", ref: "#aab2ba" };

  // ── Estado do grafo ─────────────────────────────────────────────────────────
  var nodes = [], links = [], byId = {}, expanded = {};

  function addNode(n) {
    if (n.x == null) n.x = 0;
    if (n.y == null) n.y = 0;
    nodes.push(n);
    byId[n.id] = n;
    return n;
  }

  function hiddenCount(id) {
    var ch = childrenOf[id];
    if (!ch || expanded[id]) return 0;
    return ch.filter(function (c) { return !byId[c.id]; }).length;
  }

  function expand(node) {
    var ch = childrenOf[node.id];
    if (!ch || expanded[node.id]) return false;
    expanded[node.id] = true;
    var base = node.parent
      ? Math.atan2(node.y - node.parent.y, node.x - node.parent.x)
      : (node.kind === "root" ? null : Math.atan2(node.y, node.x));
    var fresh = ch.filter(function (c) { return !byId[c.id]; });
    var m = fresh.length, idx = 0;
    ch.forEach(function (c) {
      if (byId[c.id]) { links.push({ a: node, b: byId[c.id] }); return; }
      var ang;
      if (base === null) ang = (idx / Math.max(1, m)) * Math.PI * 2;
      else { var spread = Math.PI * 0.85; ang = base - spread / 2 + spread * (m === 1 ? 0.5 : idx / (m - 1)); }
      idx++;
      var R = 64 + node.r;
      addNode({
        id: c.id, label: c.label, kind: c.kind, summary: c.summary,
        refKey: c.refKey, parent: node,
        r: c.kind === "exp" ? 16 : c.kind === "branch" ? 11 : c.kind === "field" ? 12 : 7,
        x: node.x + Math.cos(ang) * R, y: node.y + Math.sin(ang) * R,
      });
      links.push({ a: node, b: byId[c.id] });
    });
    return true;
  }

  addNode({ id: "neuro", label: "Neurociência", kind: "root", r: 22, fixed: true, x: 0, y: 0, summary: SUMMARY.neuro });
  if (MODE === "open") {
    var ch = true, g = 0;
    while (ch && g++ < 8) { ch = false; nodes.slice().forEach(function (n) { if (childrenOf[n.id] && !expanded[n.id]) { expand(n); ch = true; } }); }
  }

  // ── DOM ─────────────────────────────────────────────────────────────────────
  el.innerHTML =
    '<div class="net-stage">' +
      '<div class="net-legend"><b>scroll</b> aproximar · <b>arraste</b> mover · <b>clique</b> ' + (MODE === "guided" ? "abrir/ver" : "ver") + '</div>' +
      '<button class="net-btn" type="button">Restaurar vista</button>' +
      '<div class="net-tip"></div>' +
      '<div class="net-info"><button class="net-info-x" aria-label="Fechar">×</button><div class="net-info-body"></div></div>' +
    '</div>';
  var stage = el.querySelector(".net-stage");
  var tip   = el.querySelector(".net-tip");
  var info  = el.querySelector(".net-info");
  var infoBody = el.querySelector(".net-info-body");
  el.querySelector(".net-info-x").addEventListener("click", function () { info.classList.remove("show"); });

  // ── Conexões colaborativas ───────────────────────────────────────────────────
  var uedges = [];
  var POST = window.NEURO_FORM_ENDPOINT || "/api/feedback";
  var LIST = POST.replace(/\/feedback$/, "/feedback.json");
  var UID = "";
  try { UID = localStorage.getItem("al_neuro_uid") || ""; } catch (e) {}
  if (!UID) { UID = "u" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36); try { localStorage.setItem("al_neuro_uid", UID); } catch (e) {} }

  function loadEdges() {
    fetch(LIST, { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (d && d.wall) {
          uedges = d.wall
            .filter(function (w) { return w.kind === "edge" && w.from && w.to; })
            .map(function (w) { return { from: w.from, to: w.to, label: w.msg || "", when: w.when }; });
          if (handle) handle.update(buildGraphData());
        }
      })
      .catch(function () {});
  }

  function createConnection(fromNode, toNode) {
    var when = new Date().toISOString();
    if (window.AL_track) AL_track("neuro_mapa_conexao", { from: fromNode.id, to: toNode.id });
    uedges.push({ from: fromNode.id, to: toNode.id, label: "", when: when });
    var note = "";
    try { note = window.prompt("Conexão: " + fromNode.label + " → " + toNode.label + "\nReferência ou nota (opcional):") || ""; } catch (e) {}
    uedges[uedges.length - 1].label = note;
    fetch(POST, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "edge", section: "graph", from: fromNode.id, to: toNode.id, fromLabel: fromNode.label, toLabel: toNode.label, msg: note, nome: "anônimo", uid: UID, when: when }),
    })
      .catch(function () {})
      .then(function () { loadEdges(); });
    if (handle) handle.update(buildGraphData());
  }

  // ── Painel de info ──────────────────────────────────────────────────────────
  function openInfo(nodeData) {
    var html;
    if ((nodeData.kind === "ref" || nodeData.kind === "research") && nodeData.refKey && refByKey[nodeData.refKey] && NC) {
      html = NC.fullHtml(refByKey[nodeData.refKey]);
    } else {
      html = "<strong>" + (nodeData.label || "") + "</strong>" + (nodeData.summary ? "<br>" + nodeData.summary : "");
    }
    infoBody.innerHTML = html;
    info.classList.add("show");
  }

  // ── Converter estado do grafo → formato co_graph ─────────────────────────────
  function buildGraphData() {
    var gNodes = nodes.map(function (n) {
      return {
        id: n.id, label: n.label, color: COL[n.kind] || "#aaa", size: n.r || 8,
        fixed: !!n.fixed, x: n.x, y: n.y,
        // metadados neuro passados como dados extras (não renderizados pelo co_graph)
        kind: n.kind, summary: n.summary, refKey: n.refKey,
      };
    });
    var gEdges = links.map(function (l) {
      return { source: l.a.id, target: l.b.id, kind: "tree" };
    });
    // Conexões transversais (pontilhadas)
    CROSS.forEach(function (c) {
      if (byId[c.from] && byId[c.to]) {
        gEdges.push({ source: c.from, target: c.to, kind: "cross", color: "rgba(120,200,200,0.5)" });
      }
    });
    // Conexões colaborativas
    uedges.forEach(function (u) {
      if (byId[u.from] && byId[u.to]) {
        gEdges.push({ source: u.from, target: u.to, kind: "collaborative", color: "rgba(192,57,43,0.65)", label: u.label || undefined });
      }
    });
    return { nodes: gNodes, edges: gEdges };
  }

  // ── Inicializar co_graph ─────────────────────────────────────────────────────
  var handle = co_graph.render(stage, {
    data: buildGraphData(),
    layout: "force",
    onNodeClick: function (node) {
      if (window.AL_track) AL_track("neuro_mapa_no", { id: node.id, kind: node.kind });
      if (MODE === "guided" && hiddenCount(node.id)) {
        expand(byId[node.id]);
        handle.update(buildGraphData());
        handle.fit(true);
        return;
      }
      openInfo(node);
      handle.fit(true);
    },
    onNodeHover: function (node) {
      if (node) {
        var sp = handle.worldToScreen(byId[node.id] ? byId[node.id].x : 0, byId[node.id] ? byId[node.id].y : 0);
        tip.style.left = (sp[0] + 10) + "px";
        tip.style.top  = (sp[1] - 30) + "px";
        tip.textContent = node.summary || node.label;
        tip.classList.add("show");
      } else {
        tip.classList.remove("show");
      }
    },
    onConnectionEnd: function (fromNode, toNode) {
      createConnection(byId[fromNode.id], byId[toNode.id]);
    },
  });

  // Botão "Restaurar vista" delega ao handle
  var restoreBtn = el.querySelector(".net-btn");
  restoreBtn.addEventListener("pointerdown", function (e) { e.stopPropagation(); });
  restoreBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    if (window.AL_track) AL_track("neuro_mapa_restaurar", {});
    handle.fit(true);
  });

  loadEdges();
  setInterval(loadEdges, 10000);
})();
