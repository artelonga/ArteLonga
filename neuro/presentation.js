/* neuro/presentation.js — apresentação /2026-05-29.
   (1) A/B testing: define data-variant no <body> (?v=a|b, senão sorteia e persiste).
   (2) Form de feedback (nome obrigatório, email/dúvida opcionais) — captura local
       por ora; backend depois (ver assets/al-signup do site). */
(function () {
  "use strict";

  // ── A/B/C: cada variante é uma tese de design (ver presentation-variants.css) ──
  // Dois eixos de revisão num único ?v=:
  //   CONTEÚDO → 1a (factual) · 1b (narrativo) — mesma forma neutra, conteúdo varia.
  //   FORMA    → 2–5 — mesmo conteúdo (1a), tema visual varia; conceito "mural primeiro".
  // versão única (sem A/B): mapa guiado — subnós só aparecem ao clicar no pai.
  var VARIANTS = {
    "1": { name: "Mapa guiado", netMode: "guided", theme: "a", src: "/neuro/timeline.md" }
  };
  var DEFAULT = "1";
  var KEY = "al_ab_20260529";
  var v = (new URLSearchParams(location.search).get("v") || "").toLowerCase();
  if (!VARIANTS[v]) {
    try { v = localStorage.getItem(KEY); } catch (e) { v = null; }
    if (!VARIANTS[v]) v = DEFAULT;
  }
  try { localStorage.setItem(KEY, v); } catch (e) {}
  var V = VARIANTS[v];
  window.NEURO_TL_SRC = V.src;                          // zigzag.js lê isto p/ escolher o conteúdo
  window.NEURO_NET_MODE = V.netMode;                    // network.js lê isto p/ o modo do mapa
  document.body.setAttribute("data-variant", V.theme);  // CSS tematiza por theme
  document.body.setAttribute("data-vkey", v);
  var tag = document.getElementById("p-variant-tag");
  if (tag) tag.style.display = "none";   // sem A/B — etiqueta oculta

  // ── conceito "mural primeiro, email depois" (variantes de forma 2–5) ──
  if (V.concept) {
    document.body.setAttribute("data-concept", "board");
    var hero = document.querySelector(".p-hero");
    if (hero) {
      var cl = document.createElement("p");
      cl.className = "concept-lede";
      cl.textContent = "Mural coletivo do encontro: escreva, leia o que escreveram — e deixe seu email só no fim, se quiser acompanhar.";
      var anchor = hero.querySelector(".p-date");
      if (anchor) anchor.insertAdjacentElement("afterend", cl); else hero.appendChild(cl);
    }
    // convite de email tardio: surge ao rolar, dispensável
    var bar = document.createElement("div");
    bar.className = "concept-invite";
    bar.innerHTML = '<span>Curtindo? Deixe seu email no fim para acompanhar o Neuro Notebook.</span>' +
      '<a class="ci-go" href="#s5">deixar email →</a>' +
      '<button class="ci-x" type="button" aria-label="Fechar">×</button>';
    document.body.appendChild(bar);
    var dismissed = false;
    bar.querySelector(".ci-x").addEventListener("click", function () { dismissed = true; bar.classList.remove("show"); });
    bar.querySelector(".ci-go").addEventListener("click", function () { bar.classList.remove("show"); });
    window.addEventListener("scroll", function () {
      if (dismissed) return;
      var y = window.scrollY || document.documentElement.scrollTop || 0;
      bar.classList.toggle("show", y > window.innerHeight * 1.3);
    }, { passive: true });
  }

  // ── contribuições colaborativas por seção (post-its) ──
  function esc(s) { return String(s == null ? "" : s).replace(/[<>&"]/g, function (c) {
    return { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c]; }); }

  var POST = window.NEURO_FORM_ENDPOINT || "/api/feedback";
  var LIST = POST.replace(/\/feedback$/, "/feedback.json");
  var DEL = POST.replace(/\/feedback$/, "/feedback/delete");
  var EDIT = POST.replace(/\/feedback$/, "/feedback/edit");
  var UP = POST.replace(/\/feedback$/, "/upload");
  var REG = POST.replace(/\/feedback$/, "/register");
  var NK = "al_neuro_nome", EK = "al_neuro_email", MK = "al_neuro_mine", UK = "al_neuro_uid";

  // ID anônimo estável por navegador: marca toda contribuição pra que, SE a pessoa
  // se registrar no fim ("qual seu nome?"), dê pra retroligar as respostas dela.
  function uid() {
    var u; try { u = localStorage.getItem(UK); } catch (e) {}
    if (!u) {
      u = "u" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      try { localStorage.setItem(UK, u); } catch (e) {}
    }
    return u;
  }
  var nome = function () { try { return localStorage.getItem(NK) || ""; } catch (e) { return ""; } };
  var email = function () { try { return localStorage.getItem(EK) || ""; } catch (e) { return ""; } };
  var author = function () { return nome() || "anônimo"; };   // exibido até registrar
  function mine() { try { return JSON.parse(localStorage.getItem(MK) || "[]"); } catch (e) { return []; } }
  function addMine(w) { try { var a = mine(); a.push(w); localStorage.setItem(MK, JSON.stringify(a.slice(-200))); } catch (e) {} }
  function isMine(w) { return mine().indexOf(w) !== -1; }
  function hasContributed() { return mine().length > 0; }   // mural abre após a 1ª contribuição

  var expanded = {};   // when → bool (preserva expansão entre re-renders)
  var cache = [];      // todas as contribuições (do servidor)
  var blocks = [];     // {section, wallEl, countEl, kind}

  // formata a contribuição: post-it normal, ou cartão de referência (com link)
  function cardHtml(it) {
    var key = it.when || (it.nome + it.msg);
    var acts = isMine(key)
      ? '<span class="postit-acts"><button class="postit-edit" data-edit="' + esc(key) + '">editar</button>' +
        '<button class="postit-del" data-del="' + esc(key) + '">apagar</button></span>' : "";
    var link = it.url ? '<a class="postit-link" href="' + esc(it.url) + '" target="_blank" rel="noopener">' +
                 (it.kind === "video" ? "▶ vídeo" : it.kind === "pdf" ? "PDF ↗" : "abrir ↗") + "</a>" : "";
    return '<article class="postit' + (expanded[key] ? " is-open" : "") + '" data-key="' + esc(key) + '" tabindex="0">' +
      '<div class="postit-msg">' + esc(it.msg).replace(/\n/g, "<br>") + '</div>' +
      (link ? '<div class="postit-extra">' + link + "</div>" : "") +
      '<div class="postit-by">— ' + esc(it.nome || "anônimo") + acts + "</div></article>";
  }
  function renderBlock(b) {
    var list = cache.filter(function (it) { return (it.section || "geral") === b.section; });
    // mural sempre visível para todos (logados ou não) — sem trava de "contribua para ver"
    b.wallEl.innerHTML = list.slice().reverse().map(cardHtml).join("") ||
      '<p class="collab-empty">' + (b.kind === "ref" ? "Nenhuma referência ainda — comece a bibliografia coletiva."
                                                      : "Nenhuma expressão ainda — seja a primeira.") + "</p>";
  }
  function renderAll() { blocks.forEach(renderBlock); }
  function load() {
    fetch(LIST, { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { if (d && d.wall) { cache = d.wall; renderAll(); } })
      .catch(function () {});
  }
  function sendDelete(key) {
    fetch(DEL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ when: key }) })
      .catch(function () {})
      .then(function () { load(); });
  }
  function sendEdit(key, msg) {
    fetch(EDIT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ when: key, msg: msg }) })
      .catch(function () {}).then(function () { load(); });
  }
  function startEdit(el, key) {
    var it = cache.filter(function (x) { return (x.when || (x.nome + x.msg)) === key; })[0];
    el.classList.add("editing");
    el.innerHTML = '<textarea class="postit-edit-ta"></textarea>' +
      '<div class="postit-by"><span class="postit-acts">' +
      '<button class="postit-save" data-save="' + esc(key) + '">salvar</button>' +
      '<button class="postit-cancel" data-cancel="1">cancelar</button></span></div>';
    var ta = el.querySelector("textarea"); ta.value = it ? it.msg : ""; ta.focus();
  }
  // clique global: expandir · editar/apagar (próprias) · salvar/cancelar edição
  document.addEventListener("click", function (e) {
    var d = e.target.closest("[data-del]");
    if (d) { e.stopPropagation(); if (confirm("Apagar esta contribuição?")) sendDelete(d.getAttribute("data-del")); return; }
    var ed = e.target.closest("[data-edit]");
    if (ed) { e.stopPropagation(); startEdit(ed.closest(".postit"), ed.getAttribute("data-edit")); return; }
    var sv = e.target.closest("[data-save]");
    if (sv) { e.stopPropagation(); var ta = sv.closest(".postit").querySelector("textarea");
      var m = (ta.value || "").trim(); if (!m) { ta.focus(); return; } sendEdit(sv.getAttribute("data-save"), m); return; }
    var cn = e.target.closest("[data-cancel]");
    if (cn) { e.stopPropagation(); load(); return; }
    var p = e.target.closest(".postit"); if (!p || p.classList.contains("editing")) return;
    var k = p.getAttribute("data-key");
    expanded[k] = !p.classList.contains("is-open");
    p.classList.toggle("is-open");
    if (expanded[k] && window.AL_track) AL_track("neuro_postit_expand", {});
  });

  function mountCollab(el) {
    var section = el.getAttribute("data-collab") || "geral";
    var cta = el.getAttribute("data-cta") || "Expresse o que você pensa.";
    el.innerHTML =
      '<form class="collab-compose" novalidate>' +
        '<div class="p-field"><label>' + cta + '</label><textarea name="msg" required></textarea></div>' +
        '<button class="p-submit" type="submit">Postar</button>' +
      "</form>" +
      '<div class="collab-wall"></div>';

    var form = el.querySelector(".collab-compose");
    var b = { section: section, kind: "msg", wallEl: el.querySelector(".collab-wall") };
    blocks.push(b);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = (form.msg.value || "").trim();
      if (!msg) { form.msg.focus(); return; }
      if (window.AL_track) AL_track("neuro_contribuir", { section: section });
      var when = new Date().toISOString();
      var entry = { nome: author(), uid: uid(), email: email(), msg: msg, section: section, variant: v, when: when };
      var btn = form.querySelector(".p-submit");
      if (btn) { btn.disabled = true; btn.textContent = "Postando…"; }
      fetch(POST, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(entry) })
        .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
        .then(function (d) { addMine((d && d.when) || when); })
        .catch(function () {})
        .then(function () { form.msg.value = ""; if (btn) { btn.disabled = false; btn.textContent = "Postar"; } load(); });
    });
  }

  // ── bibliografia coletiva: contribuição de referências (link / pdf / vídeo) ──
  var NEW_OBJ_KEY = "al_neuro_newobj";
  function mountRefs(el) {
    var section = el.getAttribute("data-refs") || "ref";
    el.innerHTML =
      '<div class="refbox-intro">' +
        '<h3>Contribua</h3>' +
        '<p>Quais são as suas referências em neurociência? Artigo, livro, vídeo, curso.</p>' +
        '<button class="p-submit refbox-open" type="button">Adicionar referência</button>' +
      '</div>' +
      '<div class="collab-head" style="margin-top:1.6rem">Bibliografia coletiva</div>' +
      '<div class="collab-wall"></div>';

    var b = { section: section, kind: "ref", wallEl: el.querySelector(".collab-wall") };
    blocks.push(b);
    el.querySelector(".refbox-open").addEventListener("click", function () { if (window.AL_track) AL_track("neuro_ref_add_open", {}); openRefModal(section); });
  }

  function openRefModal(section) {
    var firstTime = false;
    try { firstTime = !localStorage.getItem(NEW_OBJ_KEY); localStorage.setItem(NEW_OBJ_KEY, "1"); } catch (e) {}
    var ov = document.createElement("div");
    ov.className = "modal-ov";
    ov.innerHTML =
      '<div class="modal" role="dialog" aria-modal="true">' +
        '<button class="modal-x" aria-label="Fechar">×</button>' +
        '<div class="modal-badge">Novo objetivo</div>' +
        '<h3 class="modal-title">Bibliografia coletiva para o Neuro Notebook Brasil</h3>' +
        '<form class="modal-form" novalidate>' +
          '<div class="p-field"><label>Referência <span class="opt">(título, autor, por que importa)</span></label><textarea name="msg" required></textarea></div>' +
          '<div class="p-field"><label>Tipo</label>' +
            '<div class="seg"><label><input type="radio" name="kind" value="link" checked> link</label>' +
            '<label><input type="radio" name="kind" value="video"> vídeo (YouTube)</label>' +
            '<label><input type="radio" name="kind" value="pdf"> PDF (upload)</label></div></div>' +
          '<div class="p-field kind-url"><label>Link</label><input name="url" type="url" placeholder="https://…"></div>' +
          '<div class="p-field kind-file" hidden><label>Arquivo PDF</label><input name="file" type="file" accept="application/pdf"></div>' +
          '<div class="modal-actions"><button class="p-submit" type="submit">Enviar referência</button></div>' +
        '</form>' +
      '</div>';
    document.body.appendChild(ov);
    if (!firstTime) ov.querySelector(".modal-badge").textContent = "Bibliografia coletiva";

    var form = ov.querySelector(".modal-form");
    var urlWrap = form.querySelector(".kind-url"), fileWrap = form.querySelector(".kind-file");
    form.querySelectorAll('input[name="kind"]').forEach(function (r) {
      r.addEventListener("change", function () {
        var k = form.querySelector('input[name="kind"]:checked').value;
        urlWrap.hidden = (k === "pdf"); fileWrap.hidden = (k !== "pdf");
      });
    });
    function close() { ov.remove(); }
    ov.addEventListener("click", function (e) { if (e.target === ov) close(); });
    ov.querySelector(".modal-x").addEventListener("click", close);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = (form.msg.value || "").trim();
      if (!msg) { form.msg.focus(); return; }
      var kind = form.querySelector('input[name="kind"]:checked').value;
      var btn = form.querySelector(".p-submit");
      if (btn) { btn.disabled = true; btn.textContent = "Enviando…"; }

      function finish(url) {
        var when = new Date().toISOString();
        var entry = { nome: author(), uid: uid(), email: email(), msg: msg, url: url || "", kind: kind,
                      section: section, variant: v, when: when };
        fetch(POST, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(entry) })
          .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
          .then(function (d) { addMine((d && d.when) || when); })
          .catch(function () {})
          .then(function () { close(); load(); });
      }

      if (kind === "pdf" && form.file.files[0]) {
        var f = form.file.files[0];
        fetch(UP, { method: "POST", headers: { "Content-Type": f.type || "application/pdf",
                    "X-Filename": encodeURIComponent(f.name) }, body: f })
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (d) { finish(d && d.url); })
          .catch(function () { finish(""); });
      } else {
        finish((form.url.value || "").trim());
      }
    });
  }

  // ── registro opcional no fim: associa o nome ao uid e retroliga as respostas ──
  function mountRegister(el) {
    function render() {
      if (nome()) {
        el.innerHTML = '<p class="reg-done">Respostas salvas como <b>' + esc(nome()) +
          '</b>. <button class="reg-edit" type="button">trocar nome</button></p>';
        el.querySelector(".reg-edit").addEventListener("click", showForm);
      } else { showForm(); }
    }
    function showForm() {
      el.innerHTML =
        '<form class="reg-form" novalidate>' +
          '<div class="p-field"><label>Para salvar as respostas, qual seu nome?</label>' +
            '<input name="nome" autocomplete="name" value="' + esc(nome()) + '"></div>' +
          '<div class="p-field"><label>E-mail <span class="opt">(opcional)</span></label>' +
            '<input name="email" type="email" value="' + esc(email()) + '"></div>' +
          '<button class="p-submit" type="submit">Salvar respostas</button>' +
        "</form>";
      el.querySelector(".reg-form").addEventListener("submit", function (e) {
        e.preventDefault();
        var f = e.target, nv = (f.nome.value || "").trim();
        if (!nv) { f.nome.focus(); return; }
        if (window.AL_track) AL_track("neuro_register", {});
        try { localStorage.setItem(NK, nv); localStorage.setItem(EK, (f.email.value || "").trim()); } catch (er) {}
        var btn = f.querySelector(".p-submit"); if (btn) { btn.disabled = true; btn.textContent = "Salvando…"; }
        fetch(REG, { method: "POST", headers: { "Content-Type": "application/json" },
                     body: JSON.stringify({ uid: uid(), nome: nv, email: email() }) })
          .catch(function () {})
          .then(function () { render(); load(); });   // load() puxa nomes retroligados
      });
    }
    render();
  }

  document.querySelectorAll("[data-collab]").forEach(mountCollab);
  document.querySelectorAll("[data-refs]").forEach(mountRefs);
  document.querySelectorAll("[data-register]").forEach(mountRegister);
  load();
  setInterval(load, 15000);   // ao vivo durante o encontro
})();
