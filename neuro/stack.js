/* neuro/stack.js — comportamento compartilhado das formas em COLUNA ÚNICA
   (A, A1, A2, A3). Renderiza a MESMA estrutura de DOM pra todas; o que muda
   entre elas é só o CSS de cada página. Clique expande inline; [[links]]
   internos pulam e abrem o marco-alvo. */
(function () {
  "use strict";
  var NT = window.NeuroTimeline;
  var mount = document.getElementById("tl");
  if (!NT || !mount) return;

  NT.load("/neuro/timeline.md").then(function (data) {
    var titleEl = document.getElementById("doc-title");
    if (data.title && titleEl) titleEl.textContent = data.title;

    mount.innerHTML = data.events.map(function (e) {
      return '' +
        '<article class="ev ' + e.side + '" id="' + e.id + '">' +
          '<span class="node"></span>' +
          '<div class="card" data-card>' +
            '<div class="year">' + NT.esc(e.year) + '</div>' +
            '<h3>' + NT.esc(e.title) + '</h3>' +
            '<div class="teaser">' + e.teaserHtml + '</div>' +
            (e.hasBody ? '<div class="body">' + e.bodyHtml + '</div>' +
                         '<div class="more" data-more>+ ler mais</div>' : '') +
          '</div>' +
        '</article>';
    }).join("");

    function setOpen(ev, open) {
      ev.classList.toggle("open", open);
      var more = ev.querySelector("[data-more]");
      if (more) more.textContent = open ? "− fechar" : "+ ler mais";
    }

    mount.addEventListener("click", function (e) {
      var jump = e.target.closest(".neuro-jump");
      if (jump) {
        e.preventDefault();
        var target = document.getElementById(jump.getAttribute("data-jump"));
        if (target) {
          setOpen(target, true);
          target.scrollIntoView({ behavior: "smooth", block: "center" });
          target.classList.remove("neuro-flash"); void target.offsetWidth;
          target.classList.add("neuro-flash");
        }
        return;
      }
      var card = e.target.closest("[data-card]");
      if (!card) return;
      var ev = card.closest(".ev");
      setOpen(ev, !ev.classList.contains("open"));
    });
  }).catch(function (err) {
    mount.innerHTML = '<div class="neuro-loading">falhou ao carregar: ' + err.message + "</div>";
  });
})();
