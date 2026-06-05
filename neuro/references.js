/* neuro/references.js — citações + lista de referências ABNT (NBR 6023/10520).
 *
 * CONTEÚDO: o array `items` é a lista de referências (a editar).
 * FORMA: o resto formata em ABNT, monta a lista (só as citadas, alfabética) no
 * fim da página e troca cada [@chave] do corpo pelo rótulo autor-data.
 *
 * Metadados conferidos nas fontes originais (Frontiers, Crossref, Google Patents).
 * Campos por tipo:
 *   article/preprint: authors[], year, title, container, place?, volume?, number?,
 *                     articleNo?, pages?, url?, access?
 *   patent:           authors[] (inventores), year, title, assignee, number, filing, grant, url?
 *   thesis:           authors[], year, title, subtitle?, thesisType, degree, institution, place, url?, note?
 *   book/web:         authors[], year, title, subtitle?, edition?, place?, publisher?, url?, access?
 */
window.NeuroCite = (function () {
  "use strict";

  var items = [
    { key: "fapesp", type: "grant",
      authors: ["VIEIRA SUGANO, Yuri Yukio"], year: "2012",
      title: "Origem e evolução das serpentes e sua diversificação na Região Neotropical",
      supervisor: "Erika Hingst-Zaher", modality: "Bolsa de Iniciação Científica (FAPESP)",
      institution: "Instituto Butantan", place: "São Paulo",
      url: "https://bv.fapesp.br/pt/bolsas/134702/origem-e-evolucao-das-serpentes-e-sua-diversificacao-na-regiao-neotropical/",
      access: "28 maio 2026" },

    { key: "frontiers2016", type: "article",
      authors: ["BEN-AMI BARTAL, Inbal", "SHAN, Haozhe", "MOLASKY, Nora M. R.",
                "MURRAY, Teresa M.", "WILLIAMS, Jasper Z.", "DECETY, Jean", "MASON, Peggy"],
      year: "2016", title: "Anxiolytic treatment impairs helping behavior in rats",
      container: "Frontiers in Psychology", place: "Lausanne", volume: "7", articleNo: "art. 850",
      url: "https://doi.org/10.3389/fpsyg.2016.00850", access: "28 maio 2026" },

    { key: "sciadv2020", type: "article",
      authors: ["HAVLIK, John L.", "VIEIRA SUGANO, Yuri Yukio", "JACOBI, Maura Clement",
                "KUKREJA, Rahul R.", "JACOBI, John H. Clement", "MASON, Peggy"],
      year: "2020", title: "The bystander effect in rats",
      container: "Science Advances", volume: "6", number: "28", articleNo: "eabb4205",
      url: "https://doi.org/10.1126/sciadv.abb4205", access: "28 maio 2026" },

    { key: "madelaire2020", type: "article",
      authors: ["MADELAIRE, Carla B.", "VIEIRA SUGANO, Yuri Yukio"], year: "2020",
      title: "Challenges of dehydration in invasive toads",
      container: "Behavioral Ecology and Sociobiology",
      url: "https://www.jstor.org/stable/48727773" },

    { key: "patent", type: "patent",
      authors: ["MASON, Peggy", "VIEIRA SUGANO, Yuri Yukio", "HILVERT, Austin", "RILEY, Ashley"],
      year: "2023", title: "Theseometer for measuring proprioception performance",
      assignee: "University of Chicago", number: "US 11.589.798 B2",
      filing: "9 dez. 2019", grant: "28 fev. 2023",
      url: "https://patents.google.com/patent/US11589798B2/en" },

    { key: "biorxiv2022", type: "preprint",
      authors: ["VIEIRA SUGANO, Yuri Yukio", "SHAN, Haozhe", "MOLASKY, Nora M. R.", "MASON, Peggy"],
      year: "2022", title: "Helping can be driven by non-affective cues in rat",
      container: "bioRxiv",
      url: "https://doi.org/10.1101/2022.07.01.498150", access: "28 maio 2026" },

    { key: "tese", type: "thesis",
      authors: ["VIEIRA SUGANO, Yuri Yukio"], year: "2022",
      title: "Uncovering human proprioceptive function and malfunction",
      thesisType: "Senior thesis", degree: "Bachelor of Science in Neuroscience",
      institution: "University of Chicago", place: "Chicago",
      url: "/yuri/uncovering-human-proprioceptive-function-and-malfunction.pdf",
      access: "28 maio 2026" },

    // Bibliografia — obras consultadas, não citadas no texto (entram em "Bibliografia").
    { key: "kandel2013", type: "book",
      authors: ["KANDEL, Eric R.", "SCHWARTZ, James H.", "JESSELL, Thomas M.",
                "SIEGELBAUM, Steven A.", "HUDSPETH, A. J."], year: "2013",
      title: "Principles of neural science", edition: "5. ed.",
      place: "New York", publisher: "McGraw-Hill" },

    { key: "bear2016", type: "book",
      authors: ["BEAR, Mark F.", "CONNORS, Barry W.", "PARADISO, Michael A."], year: "2016",
      title: "Neuroscience", subtitle: "exploring the brain", edition: "4. ed.",
      place: "Philadelphia", publisher: "Wolters Kluwer" },

    { key: "masoncoursera", type: "course",
      authors: ["MASON, Peggy"], year: "2014",
      title: "Understanding the brain", subtitle: "the neurobiology of everyday life",
      platform: "Coursera", institution: "University of Chicago",
      url: "https://www.coursera.org/learn/neurobiology", access: "29 maio 2026" },

    { key: "eagleman2015", type: "video",
      authors: ["EAGLEMAN, David"], year: "2015",
      title: "The brain with David Eagleman", broadcaster: "PBS", medium: "Série documental",
      url: "https://www.youtube.com/watch?v=A6Zk2r3m5Fk", access: "29 maio 2026",
      also: { label: "site oficial (PT)", url: "https://eagleman.com/television/the-brain-pbs/" } },

    // Cadernos de PLN (Google Colab) — repo ObjectEllicitationNLP.
    { key: "colab1", type: "notebook", authors: ["VIEIRA SUGANO, Yuri Yukio"], year: "2023", yearTag: "a",
      title: "NLP I", platform: "Caderno Google Colab",
      url: "https://colab.research.google.com/drive/1KhWSaZ8PQgVelkrOFH1GqT4PPd5xRFqu", access: "29 maio 2026" },
    { key: "colab2", type: "notebook", authors: ["VIEIRA SUGANO, Yuri Yukio"], year: "2023", yearTag: "b",
      title: "Intro to NLP II", platform: "Caderno Google Colab",
      url: "https://colab.research.google.com/drive/171Ga5f0Ny1qXmMCjXO4slnBdFDwmAMij", access: "29 maio 2026" },
    { key: "colab3", type: "notebook", authors: ["VIEIRA SUGANO, Yuri Yukio"], year: "2023", yearTag: "c",
      title: "Clustering and Dimensionality Reduction", platform: "Caderno Google Colab",
      url: "https://colab.research.google.com/drive/1cb_O31Dq_wrzpoelVrhKKZcxgq504oN3", access: "29 maio 2026" },
    { key: "colab4", type: "notebook", authors: ["VIEIRA SUGANO, Yuri Yukio"], year: "2023", yearTag: "d",
      title: "Topic Modeling", platform: "Caderno Google Colab",
      url: "https://colab.research.google.com/drive/18xklFkuLHdatL_7M7gXZGISnJjypEiJs", access: "29 maio 2026" },
  ];

  // ---- forma (ABNT) ----
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  var map = {};
  items.forEach(function (r) { map[r.key] = r; });

  function surname(a) { return (a.split(",")[0] || a).trim().toUpperCase(); }

  // (SOBRENOME, ano) — 2-3 autores: "; "; >3: "et al."
  function inlineLabel(ref, loc) {
    var s = ref.authors.map(surname);
    var who = s.length > 3 ? s[0] + " et al." : s.join("; ");
    return "(" + who + ", " + ref.year + (ref.yearTag || "") + (loc ? ", " + loc : "") + ")";
  }

  function authorsFull(ref) { return ref.authors.join("; "); }

  // Title Case — capitaliza títulos (preposições/artigos minúsculos, exceto a 1ª palavra; siglas preservadas)
  var SMALL = { a:1, an:1, and:1, as:1, at:1, but:1, by:1, for:1, from:1, in:1, into:1, nor:1, of:1, on:1, onto:1, or:1, over:1, the:1, to:1, via:1, with:1,
    e:1, o:1, os:1, de:1, da:1, "do":1, das:1, dos:1, em:1, na:1, no:1, nas:1, nos:1, para:1, por:1, com:1, sua:1, seu:1, à:1, ao:1 };
  function titleCase(s) {
    var first = true;
    return String(s == null ? "" : s).split(/(\s+|-)/).map(function (w) {
      if (/^\s+$/.test(w) || w === "-") return w;
      if (/[A-Z0-9]{2,}/.test(w) && w === w.toUpperCase()) { first = false; return w; }   // sigla
      var lw = w.toLowerCase(), out = (!first && SMALL[lw]) ? lw : (w.charAt(0).toUpperCase() + w.slice(1));
      first = false; return out;
    }).join("");
  }
  // título: capitalizado e LINKADO (só o título carrega o link, nunca o autor)
  function titleEl(ref) {
    var t = esc(titleCase(ref.title));
    return ref.url ? '<a href="' + esc(ref.url) + '" target="_blank" rel="noopener">' + t + "</a>" : t;
  }

  function fullHtml(ref) {
    var out = esc(authorsFull(ref)) + ". ";
    if (ref.type === "article" || ref.type === "preprint") {
      out += titleEl(ref) + ". ";                       // título do artigo: sem destaque
      out += "<em>" + esc(ref.container) + "</em>";        // periódico/fonte: destacado
      if (ref.place) out += ", " + esc(ref.place);
      if (ref.volume) out += ", v. " + esc(ref.volume);
      if (ref.number) out += ", n. " + esc(ref.number);
      if (ref.articleNo) out += ", " + esc(ref.articleNo);
      if (ref.pages) out += ", p. " + esc(ref.pages);
      out += ", " + esc(ref.year) + ".";
    } else if (ref.type === "patent") {
      out += "<strong>" + titleEl(ref) + "</strong>. ";
      if (ref.assignee) out += "Depositante: " + esc(ref.assignee) + ". ";
      if (ref.number) out += esc(ref.number) + ". ";
      if (ref.filing) out += "Depósito: " + esc(ref.filing) + ". ";
      if (ref.grant) out += "Concessão: " + esc(ref.grant) + ".";
    } else if (ref.type === "thesis") {
      out += "<strong>" + titleEl(ref) + "</strong>";
      if (ref.subtitle) out += ": " + esc(ref.subtitle);
      out += ". " + esc(ref.year) + ". ";
      out += esc(ref.thesisType || "Tese");
      if (ref.degree) out += " (" + esc(ref.degree) + ")";
      out += " – " + esc(ref.institution) + ", " + esc(ref.place) + ", " + esc(ref.year) + ".";
      if (ref.note) out += " " + esc(ref.note) + ".";
    } else if (ref.type === "grant") {
      out += "<strong>" + titleEl(ref) + "</strong>. ";
      if (ref.supervisor) out += "Orient.: " + esc(ref.supervisor) + ". ";
      out += esc(ref.year) + ". ";
      out += esc(ref.modality || "Projeto de pesquisa") + " – " +
        esc(ref.institution) + ", " + esc(ref.place) + ", " + esc(ref.year) + ".";
    } else if (ref.type === "course") {
      out += "<strong>" + titleEl(ref) + "</strong>";
      if (ref.subtitle) out += ": " + esc(ref.subtitle);
      out += ". ";
      out += [ref.platform, ref.institution].filter(Boolean).map(esc).join("; ") + ". ";
      out += "Curso online" + (ref.year ? ", " + esc(ref.year) : "") + ".";
    } else if (ref.type === "notebook") {
      out += "<strong>" + titleEl(ref) + "</strong>. ";
      out += esc(ref.platform || "Caderno Google Colab");
      out += ", " + esc(ref.year) + (ref.yearTag || "") + ".";
    } else if (ref.type === "video") {
      out += "<strong>" + titleEl(ref) + "</strong>. ";
      if (ref.broadcaster) out += esc(ref.broadcaster) + ", ";
      out += esc(ref.year) + ". " + esc(ref.medium || "Vídeo") + ".";
    } else {                                              // book / web
      out += "<strong>" + titleEl(ref) + "</strong>";
      if (ref.subtitle) out += ": " + esc(ref.subtitle);
      out += ". ";
      if (ref.edition) out += esc(ref.edition) + " ";
      if (ref.place) out += esc(ref.place) + ": ";
      if (ref.publisher) out += esc(ref.publisher) + ", ";
      out += esc(ref.year) + ".";
    }
    if (ref.also) {
      out += ' Ver também: <a href="' + esc(ref.also.url) + '" target="_blank" rel="noopener">' +
        esc(ref.also.label) + "</a>.";
    }
    return out;
  }

  function sorted(keys, byDate) {
    var list = keys ? items.filter(function (r) { return keys.indexOf(r.key) !== -1; }) : items.slice();
    return list.sort(function (x, y) {
      if (byDate) {                                          // mais recente primeiro
        if (x.year !== y.year) return x.year < y.year ? 1 : -1;
        return authorsFull(x).toUpperCase() < authorsFull(y).toUpperCase() ? -1 : 1;
      }
      var ax = authorsFull(x).toUpperCase(), ay = authorsFull(y).toUpperCase();
      if (ax < ay) return -1; if (ax > ay) return 1;
      return (x.year < y.year ? -1 : x.year > y.year ? 1 : 0);
    });
  }

  function usedKeys(root) {
    var seen = [];
    (root || document).querySelectorAll(".neuro-cite[data-cite]").forEach(function (a) {
      var k = a.getAttribute("data-cite");
      if (map[k] && seen.indexOf(k) === -1) seen.push(k);
    });
    return seen;
  }

  function listHtml(keys, byDate) {
    return '<ul class="ref-list">' + sorted(keys, byDate).map(function (r) {
      return '<li id="ref-' + esc(r.key) + '">' + fullHtml(r) + "</li>";
    }).join("") + "</ul>";
  }

  function hydrate(root) {
    (root || document).querySelectorAll(".neuro-cite[data-cite]").forEach(function (a) {
      var r = map[a.getAttribute("data-cite")];
      if (r) a.textContent = inlineLabel(r, a.getAttribute("data-loc"));
      else { a.textContent = "[ref?]"; a.classList.add("neuro-cite-missing"); }
    });
  }

  // ícone de ajuda explicando referências × bibliografia
  var HELP =
    '<span class="ref-help" tabindex="0" role="note"' +
    ' aria-label="Referências são obras citadas no texto; bibliografia são obras consultadas, não necessariamente citadas.">?' +
    '<span class="ref-tip"><b>Referências</b> — obras citadas no texto.<br>' +
    '<b>Bibliografia</b> — obras consultadas, não necessariamente citadas.</span></span>';

  // ?author=<termo> — filtra a bibliografia pelas obras de um autor (ex. ?author=yuri).
  // Casa o termo (sem acento, minúsculo) contra qualquer autor da referência.
  var AUTHOR_Q = "";
  try { AUTHOR_Q = (new URLSearchParams(location.search).get("author") || "").trim().toLowerCase(); } catch (e) {}
  function deburr(s) { return s.normalize ? s.normalize("NFD").replace(/[\u0300-\u036f]/g, "") : s; }
  function byAuthor(q) {
    if (window.NeuroAuthors) {   // resolve variantes (yuri = "VIEIRA SUGANO, …" = "Yuri" = "Vieira Sugano")
      return items.filter(function (r) {
        return (r.authors || []).some(function (a) { return window.NeuroAuthors.match(a, q); });
      }).map(function (r) { return r.key; });
    }
    var qq = deburr(String(q).toLowerCase());   // fallback substring (sem authors.js)
    return items.filter(function (r) {
      return (r.authors || []).some(function (a) { return deburr(a.toLowerCase()).indexOf(qq) !== -1; });
    }).map(function (r) { return r.key; });
  }
  // autores únicos da base resolvidos pra identidade canônica (p/ UI de filtro/consulta)
  function authors() {
    var seen = {}, out = [];
    items.forEach(function (r) {
      (r.authors || []).forEach(function (a) {
        var id = window.NeuroAuthors ? window.NeuroAuthors.idOf(a) : a;
        if (!seen[id]) { seen[id] = 1; out.push({ id: id, display: window.NeuroAuthors ? window.NeuroAuthors.displayOf(id) : a }); }
      });
    });
    return out;
  }

  function sectionHtml() {
    // visão filtrada por autor (link de currículo etc.) — só as obras desse autor
    if (AUTHOR_Q) {
      var mine = byAuthor(AUTHOR_Q);
      if (!mine.length) return "";
      var who = AUTHOR_Q.charAt(0).toUpperCase() + AUTHOR_Q.slice(1);
      return '<div class="ref-top"><h2>Bibliografia · ' + esc(who) + '</h2>' + HELP + "</div>" +
        '<p class="ref-filter">Filtrado por autor: <b>' + esc(who) + '</b> · <a href="?">ver bibliografia completa</a></p>' +
        listHtml(mine);
    }
    var cited = usedKeys(document);
    var citedSet = {}; cited.forEach(function (k) { citedSet[k] = 1; });
    var biblio = items.filter(function (r) { return !citedSet[r.key]; }).map(function (r) { return r.key; });
    if (!cited.length && !biblio.length) return "";
    var html = '<div class="ref-top"><h2>Referências &amp; bibliografia</h2>' + HELP + "</div>";
    if (cited.length) html += '<h3 class="ref-sub">Referências</h3>' + listHtml(cited);
    if (biblio.length) html += '<h3 class="ref-sub">Bibliografia</h3>' + listHtml(biblio);
    return html;
  }

  // insere a seção logo após `afterEl`
  function mount(afterEl) {
    if (!afterEl || document.getElementById("referencias")) return;
    var html = sectionHtml();
    if (!html) return;
    var sec = document.createElement("section");
    sec.className = "ref-section"; sec.id = "referencias";
    sec.innerHTML = html;
    afterEl.parentNode.insertBefore(sec, afterEl.nextSibling);
  }

  // insere a seção dentro de `container` (ex.: um slide específico da apresentação)
  function mountInto(container) {
    if (!container || document.getElementById("referencias")) return;
    var html = sectionHtml();
    if (!html) return;
    var sec = document.createElement("section");
    sec.className = "ref-section"; sec.id = "referencias";
    sec.innerHTML = html;
    container.appendChild(sec);
  }

  // ── popover da referência ──────────────────────────────────────────────
  // REGRA GLOBAL: clicar numa citação NUNCA abre a fonte direto. Hover dá uma
  // prévia; clique FIXA o popover (que contém o link "Disponível em:" pra fonte).
  // O link externo só abre quando o usuário clica nele, dentro do popover.
  var pop = null, pinned = null, hideT = null;
  function ensurePop() {
    if (pop) return pop;
    pop = document.createElement("div");
    pop.className = "neuro-cite-pop";
    pop.setAttribute("role", "tooltip");
    document.body.appendChild(pop);
    pop.addEventListener("mouseenter", function () { clearTimeout(hideT); });
    pop.addEventListener("mouseleave", function () { if (!pinned) hide(); });
    return pop;
  }
  // posiciona no espaço LOCAL do body (compensa o zoom da apresentação)
  function place(anchor) {
    var zoom = parseFloat(getComputedStyle(document.body).zoom) || 1;
    var br = document.body.getBoundingClientRect(), r = anchor.getBoundingClientRect();
    pop.style.display = "block"; pop.style.top = "-9999px";
    var ph = pop.offsetHeight, pw = pop.offsetWidth;
    var ll = (r.left - br.left) / zoom, lt = (r.top - br.top) / zoom, lb = (r.bottom - br.top) / zoom;
    var maxLeft = (window.innerWidth / zoom) - pw - 10;
    pop.style.left = Math.max(8, Math.min(ll, maxLeft)) + "px";
    var above = lt - ph - 8, below = lb + 8;
    pop.style.top = (above > 8 ? above : below) + "px";
  }
  function show(anchor, pin) {
    var r = map[anchor.getAttribute("data-cite")];
    if (!r) return;
    ensurePop().innerHTML = fullHtml(r);
    pop.classList.toggle("pinned", !!pin);
    place(anchor);
  }
  function hide() { hideT = setTimeout(function () { if (pop && !pinned) pop.style.display = "none"; }, 140); }

  document.addEventListener("mouseover", function (e) {
    var c = e.target.closest(".neuro-cite"); if (!c) return;
    clearTimeout(hideT); if (!pinned) show(c, false);
  });
  document.addEventListener("mouseout", function (e) {
    var c = e.target.closest(".neuro-cite"); if (!c) return; hide();
  });
  document.addEventListener("click", function (e) {
    var c = e.target.closest(".neuro-cite");
    if (c) { e.preventDefault(); pinned = c; show(c, true); if (window.AL_track) AL_track("neuro_cite", { ref: c.getAttribute("data-cite") }); return; }
    if (pop && !e.target.closest(".neuro-cite-pop")) { pinned = null; pop.style.display = "none"; }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && pop) { pinned = null; pop.style.display = "none"; }
    var c = e.target.closest && e.target.closest(".neuro-cite");
    if (c && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); pinned = c; show(c, true); }
  });

  // componente composável: lista de bibliografia (toda, ou filtrada por autor)
  function bibliographyHtml(authorQ, byDate) {
    var keys = authorQ ? byAuthor(authorQ) : items.map(function (r) { return r.key; });
    return listHtml(keys, byDate !== false);   // bibliografia: por data (mais recente primeiro) por padrão
  }

  return { items: items, hydrate: hydrate, mount: mount, mountInto: mountInto,
           listHtml: listHtml, usedKeys: usedKeys, inlineLabel: inlineLabel, fullHtml: fullHtml,
           byAuthor: byAuthor, authors: authors, bibliographyHtml: bibliographyHtml };
})();
