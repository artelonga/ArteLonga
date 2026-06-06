/* neuro/zigzag.js — motor compartilhado das formas em ZIGZAG (AZ e filhos).
   Renderiza a MESMA estrutura de cartão pra todas; o que muda entre AZ1/AZ2/AZ3
   é só o CSS (tipografia/expressão). Duas colunas densas junto ao eixo central,
   com defasagem; clique expande inline; imagens viram thumbnail + <figure> no
   corpo; [[links]] internos pulam e abrem o alvo. Uma lista cronológica única
   (mobile lê de cima a baixo). */
(function () {
  "use strict";
  var NT = window.NeuroTimeline;
  var cols = document.querySelector(".cols");
  var left = document.getElementById("col-left");
  var right = document.getElementById("col-right");
  if (!NT || !cols || !left || !right) return;

  var mq = window.matchMedia("(min-width: 721px)");
  var cards = [];

  function makeCard(e) {
    var el = document.createElement("article");
    el.className = "card s-" + e.side + (e.image ? " has-thumb" : "");
    el.id = e.id;
    el.setAttribute("data-card", "");
    el.setAttribute("data-year", e.year);
    el.innerHTML =
      (e.image ? '<div class="al-thumb"><img class="al-img" src="' + NT.esc(e.image.src) +
                 '" alt="' + NT.esc(e.image.alt) + '" loading="lazy"></div>' : "") +
      '<div class="yr">' + NT.esc(e.year) + '</div>' +
      '<h3>' + NT.esc(e.title) + '</h3>' +
      '<div class="teaser">' + e.teaserHtml + '</div>' +
      (e.hasBody ? '<div class="body">' + e.bodyHtml + '</div>' : "");
    return el;
  }

  var PX_PER_YEAR = 124;  // eixo proporcional: px por ano. Folga p/ o card 2022 (com cadernos) num gap de 2 anos.
  var PAD_TOP = 8;

  function layout() {
    var desktop = mq.matches;
    left.innerHTML = ""; right.innerHTML = "";
    cols.classList.toggle("mobile", !desktop);
    cols.classList.toggle("axis", desktop);
    var tl = document.getElementById("tl");

    if (desktop) {
      // eixo do tempo: posição vertical ∝ ano (anos equidistantes)
      var ys = cards.map(function (el) { return parseInt(el.getAttribute("data-year"), 10); });
      var min = Math.min.apply(null, ys), max = Math.max.apply(null, ys);
      cards.forEach(function (el) {
        left.appendChild(el);                 // canvas único; posição é absoluta (rel. a .tl)
        var y = parseInt(el.getAttribute("data-year"), 10);
        el.style.top = (PAD_TOP + (y - min) * PX_PER_YEAR) + "px";
      });
      tl.style.minHeight = (PAD_TOP + (max - min) * PX_PER_YEAR + 200) + "px";
    } else {
      // mobile: coluna única em fluxo, ordem cronológica
      tl.style.minHeight = "";
      cards.forEach(function (el) { el.style.top = ""; left.appendChild(el); });
    }
  }

  NT.load(window.NEURO_TL_SRC || "/neuro/timeline.md").then(function (data) {
    var titleEl = document.getElementById("doc-title");
    if (data.title && titleEl) titleEl.textContent = data.title;
    cards = data.events.map(makeCard);
    layout();
    if (mq.addEventListener) mq.addEventListener("change", layout);
    else if (mq.addListener) mq.addListener(layout);

    // citações ABNT: troca [@chave] pelo rótulo e monta a lista.
    // Se houver #refs-slot (apresentação), monta lá; senão, após a timeline.
    if (window.NeuroCite) {
      window.NeuroCite.hydrate(cols);
      var slot = document.getElementById("refs-slot");
      if (slot) window.NeuroCite.mountInto(slot);
      else window.NeuroCite.mount(document.getElementById("tl"));
    }

    // sem expand/collapse: corpo sempre visível. Só links internos pulam+piscam.
    cols.addEventListener("click", function (e) {
      var jump = e.target.closest(".neuro-jump");
      if (!jump) return;
      e.preventDefault();
      var target = document.getElementById(jump.getAttribute("data-jump"));
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        target.classList.remove("neuro-flash"); void target.offsetWidth;
        target.classList.add("neuro-flash");
      }
    });
  }).catch(function (err) {
    left.innerHTML = '<div class="neuro-loading">falhou ao carregar: ' + err.message + "</div>";
  });
})();
