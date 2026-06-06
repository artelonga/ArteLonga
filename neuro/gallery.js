/* neuro/gallery.js — galeria sensível: porta de consentimento + slideshow.
 *
 * FORMA aqui; CONTEÚDO no manifesto (<base>/manifest.json): título, aviso,
 * disclaimer e legendas das fotos vêm dos dados, não do código.
 *
 * Gatilho: parse.js renderiza {galeria: <base> | <rótulo>} como
 *   <button class="neuro-gallery" data-base="<base>">rótulo</button>
 * Clique → carrega o manifesto → aviso de conteúdo (fins educacionais, peças
 * anatômicas humanas, Illinois Anatomical Gift Association) → ao aceitar, abre
 * o slideshow. Consentimento pedido a CADA abertura (conteúdo sensível). */
(function () {
  "use strict";

  var DEF = {
    title: "Galeria",
    warning: "As imagens a seguir podem conter conteúdo sensível.",
    disclaimer: "",
    footer: ""
  };

  function consent(c, onAccept) {
    var ov = document.createElement("div");
    ov.className = "gal-ov gal-consent";
    ov.innerHTML =
      '<div class="gal-card" role="dialog" aria-modal="true">' +
        '<div class="gal-badge">Aviso de conteúdo sensível</div>' +
        '<h3></h3><p class="gal-warn"></p>' +
        (c.disclaimer ? '<p class="gal-fine"></p>' : "") +
        '<div class="gal-actions">' +
          '<button class="gal-cancel" type="button">Cancelar</button>' +
          '<button class="gal-accept" type="button">Aceito, continuar</button>' +
        '</div>' +
      '</div>';
    // textContent (não innerHTML) — conteúdo vem dos dados
    ov.querySelector("h3").textContent = c.title || DEF.title;
    ov.querySelector(".gal-warn").textContent = c.warning || DEF.warning;
    if (c.disclaimer) ov.querySelector(".gal-fine").textContent = c.disclaimer;
    document.body.appendChild(ov);
    function close() { ov.remove(); }
    ov.addEventListener("click", function (e) { if (e.target === ov) close(); });
    ov.querySelector(".gal-cancel").addEventListener("click", close);
    ov.querySelector(".gal-accept").addEventListener("click", function () { close(); onAccept(); });
  }

  function slideshow(base, m) {
    var items = m.items || [];
    if (!items.length) return;
    var i = 0;
    var ov = document.createElement("div");
    ov.className = "gal-ov gal-show";
    ov.innerHTML =
      '<button class="gal-close" aria-label="Fechar">×</button>' +
      '<button class="gal-nav gal-prev" aria-label="Anterior">‹</button>' +
      '<div class="gal-stage"><img class="gal-img" alt=""><div class="gal-cap"></div></div>' +
      '<button class="gal-nav gal-next" aria-label="Próxima">›</button>' +
      '<div class="gal-foot"><span class="gal-count"></span><span class="gal-disc"></span></div>';
    document.body.appendChild(ov);
    var img = ov.querySelector(".gal-img"), cap = ov.querySelector(".gal-cap"),
        count = ov.querySelector(".gal-count"), disc = ov.querySelector(".gal-disc");
    var footer = (m.consent && m.consent.footer) || "";
    disc.textContent = footer ? " · " + footer : "";
    function show() {
      var it = items[i];
      img.src = base + "/" + it.src;
      cap.textContent = it.label || "";
      count.textContent = (i + 1) + " / " + items.length;
    }
    function go(d) { i = (i + d + items.length) % items.length; show(); }
    function close() { ov.remove(); document.removeEventListener("keydown", key); }
    function key(e) {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
    }
    ov.querySelector(".gal-prev").addEventListener("click", function () { go(-1); });
    ov.querySelector(".gal-next").addEventListener("click", function () { go(1); });
    ov.querySelector(".gal-close").addEventListener("click", close);
    document.addEventListener("keydown", key);
    show();
  }

  function notice(msg) {
    var ov = document.createElement("div");
    ov.className = "gal-ov gal-consent";
    ov.innerHTML = '<div class="gal-card"><p></p>' +
      '<div class="gal-actions"><button class="gal-cancel" type="button">Fechar</button></div></div>';
    ov.querySelector("p").textContent = msg;
    document.body.appendChild(ov);
    var close = function () { ov.remove(); };
    ov.addEventListener("click", function (e) { if (e.target === ov) close(); });
    ov.querySelector(".gal-cancel").addEventListener("click", close);
  }

  document.addEventListener("click", function (e) {
    var t = e.target.closest(".neuro-gallery");
    if (!t) return;
    e.preventDefault();
    var base = t.getAttribute("data-base");
    if (!base) return;
    fetch(base + "/manifest.json", { cache: "no-cache" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (m) {
        if (!m || !m.items || !m.items.length) { notice("Galeria indisponível no momento."); return; }
        if (window.AL_track) AL_track("neuro_galeria_aviso", {});
        consent(m.consent || {}, function () { if (window.AL_track) AL_track("neuro_galeria_abrir", {}); slideshow(base, m); });
      })
      .catch(function () { notice("Não foi possível carregar a galeria."); });
  });
})();
