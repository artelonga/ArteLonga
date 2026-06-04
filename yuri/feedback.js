/* yuri/feedback.js — "Fale Conosco": coletor de feedback em TODA página do yuri.
 *
 * Estático/vanilla, self-contained (injeta o próprio CSS). Mostra um botão fixo
 * "Fale Conosco"; ao enviar, grava no localStorage (chave "yuri.feedback") como
 * uma lista pronta pra gráfico: { t (ISO), page, lang, sentiment(-1|0|1), message, contact }.
 *
 * GATHER FROM LOCALHOST: abra qualquer página com "?feedback" pra ver/exportar tudo
 * que foi coletado neste navegador (lista + Exportar JSON + Copiar + Limpar).
 *
 * DEPLOY: setar ENDPOINT pra um POST backend (co/neuro feedback). Vazio = só local.
 * Cada envio tenta o ENDPOINT (se houver) e SEMPRE grava local como backup. */
(function () {
  "use strict";

  // universo do co (palpite pelo hostname; o SERVIDOR da surface tem a palavra final via env)
  function fbSlug() { var h = location.hostname; if (/(^|\.)retroumarizal[.-]/.test(h)) return "retroumarizal"; if (/(^|\.)comunicacao[.-]/.test(h)) return "comunicacao"; return "yuri"; }
  // mesma origem: o servidor da surface RECEBE, LOGA (→ fly logs) e ENCAMINHA pro co. Sem CORS, sem gate.
  var ENDPOINT = "/api/feedback";
  var KEY = "yuri.feedback";

  var PT = document.documentElement.lang !== "en";
  var T = PT ? {
    cta: "Fale Conosco", title: "Fale Conosco", q: "Sua opinião ajuda a melhorar.",
    ph: "O que achou? Sugestões, problemas, ideias…", contact: "email ou contato (opcional)",
    send: "Enviar", thanks: "Obrigado! 🌱", close: "fechar",
    pos: "gostei", neu: "neutro", neg: "não gostei",
    adminTitle: "Feedback coletado", empty: "Nada coletado ainda.",
    exp: "Exportar JSON", copy: "Copiar", clear: "Limpar", copied: "copiado ✓"
  } : {
    cta: "Talk to us", title: "Talk to us", q: "Your feedback helps us improve.",
    ph: "What did you think? Suggestions, issues, ideas…", contact: "email or contact (optional)",
    send: "Send", thanks: "Thank you! 🌱", close: "close",
    pos: "liked", neu: "neutral", neg: "disliked",
    adminTitle: "Collected feedback", empty: "Nothing collected yet.",
    exp: "Export JSON", copy: "Copy", clear: "Clear", copied: "copied ✓"
  };

  function load() { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { return []; } }
  function save(list) { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {} }

  // monta o body do co e ENVIA uma entrada; marca _sent ao confirmar (pra não duplicar)
  function coBody(e) {
    var emo = e.sentiment > 0 ? "👍 " : e.sentiment < 0 ? "👎 " : "😐 ";
    var b = { universe: fbSlug(), kind: "feedback", message: emo + (e.message || "(sem texto)"), entry_path: e.page, sentiment: e.sentiment, lang: e.lang, t: e.t };
    if (e.contact) { if (e.contact.indexOf("@") > 0) b.email = e.contact; else b.name = e.contact; }
    return b;
  }
  function postOne(e, list) {
    if (!ENDPOINT || e._sent) return;
    try {
      fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(coBody(e)) })
        .then(function (r) { if (r && r.ok) { e._sent = true; save(list); } }).catch(function () {});
    } catch (err) {}
  }
  // re-sincroniza qualquer feedback antigo do localStorage (→ fly logs + co) ao carregar a página
  function syncUnsent() { var list = load(); list.forEach(function (e) { postOne(e, list); }); }

  function styles() {
    var css =
      '.fc-fab{position:fixed;right:18px;bottom:18px;z-index:60;font:700 .8rem/1 "Space Mono",ui-monospace,monospace;' +
      'letter-spacing:.02em;cursor:pointer;border:none;border-radius:999px;padding:.6rem 1rem;color:#fff;background:#9a3b2e;' +
      'box-shadow:0 4px 14px rgba(0,0,0,.2)}' +
      '.fc-fab:hover{background:#161413}' +
      '.fc-back{position:fixed;inset:0;z-index:60;background:rgba(22,20,19,.32);display:flex;align-items:flex-end;justify-content:center}' +
      '@media(min-width:600px){.fc-back{align-items:center}}' +
      '.fc-card{background:#fffdfa;width:min(420px,100%);border:1px solid #e7e1da;border-radius:14px 14px 0 0;padding:1.2rem 1.3rem 1.4rem;' +
      'box-shadow:0 -8px 30px rgba(0,0,0,.18);font-family:"Helvetica Neue",Arial,sans-serif}' +
      '@media(min-width:600px){.fc-card{border-radius:14px}}' +
      '.fc-h{display:flex;align-items:baseline;justify-content:space-between}' +
      '.fc-h b{font:700 1.05rem/1.2 "Space Mono",monospace;color:#161413}' +
      '.fc-x{border:none;background:none;font-size:1.3rem;line-height:1;color:#5b5450;cursor:pointer}' +
      '.fc-q{color:#5b5450;font-size:.86rem;margin:.25rem 0 .8rem}' +
      '.fc-sent{display:flex;gap:.5rem;margin-bottom:.7rem}' +
      '.fc-s{flex:1;cursor:pointer;border:1px solid #e7e1da;background:#fff;border-radius:9px;padding:.5rem;font-size:1.3rem;line-height:1;text-align:center}' +
      '.fc-s.on{border-color:#9a3b2e;background:#f7ece9;box-shadow:0 0 0 1px #9a3b2e inset}' +
      '.fc-card textarea,.fc-card input{width:100%;border:1px solid #e7e1da;border-radius:9px;padding:.6rem .7rem;font:inherit;font-size:.9rem;background:#fff}' +
      '.fc-card textarea{min-height:90px;resize:vertical;margin-bottom:.5rem}' +
      '.fc-card input{margin-bottom:.7rem}' +
      '.fc-card textarea:focus,.fc-card input:focus{outline:2px solid #9a3b2e;outline-offset:-1px}' +
      '.fc-send{width:100%;border:none;border-radius:9px;background:#9a3b2e;color:#fff;font:700 .9rem/1 "Space Mono",monospace;padding:.75rem;cursor:pointer}' +
      '.fc-send:hover{background:#161413}' +
      '.fc-done{text-align:center;padding:1.4rem .5rem;font:700 1.05rem/1.4 "Space Mono",monospace;color:#3f7a59}' +
      '.fc-list{max-height:60vh;overflow:auto;margin:.6rem 0;display:flex;flex-direction:column;gap:.5rem}' +
      '.fc-item{border:1px solid #e7e1da;border-radius:9px;padding:.55rem .7rem;font-size:.82rem;color:#161413}' +
      '.fc-item .m{margin-top:.2rem;white-space:pre-wrap}' +
      '.fc-item .meta{font:.62rem/1 "Space Mono",monospace;color:#6f6760;letter-spacing:.03em}' +
      '.fc-tools{display:flex;gap:.5rem;flex-wrap:wrap}' +
      '.fc-tools button{flex:1;border:1px solid #e7e1da;background:#fff;border-radius:8px;padding:.5rem;font:700 .72rem/1 "Space Mono",monospace;cursor:pointer;color:#161413}' +
      '.fc-tools button:hover{border-color:#9a3b2e;color:#9a3b2e}';
    var s = document.createElement("style"); s.textContent = css; document.head.appendChild(s);
  }

  function el(tag, cls, txt) { var n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; }
  function fmt(t) { try { return new Date(t).toLocaleString(); } catch (e) { return t; } }

  function openForm() {
    var back = el("div", "fc-back");
    var card = el("div", "fc-card");
    var sentiment = 0;
    var head = el("div", "fc-h");
    head.appendChild(el("b", null, T.title));
    var x = el("button", "fc-x", "×"); x.setAttribute("aria-label", T.close);
    head.appendChild(x);
    card.appendChild(head);
    card.appendChild(el("p", "fc-q", T.q));

    var sent = el("div", "fc-sent");
    [["👎", -1, T.neg], ["😐", 0, T.neu], ["👍", 1, T.pos]].forEach(function (o) {
      var s = el("button", "fc-s", o[0]); s.type = "button"; s.title = o[2];
      s.onclick = function () { sentiment = o[1]; Array.prototype.forEach.call(sent.children, function (c) { c.classList.remove("on"); }); s.classList.add("on"); };
      sent.appendChild(s);
    });
    card.appendChild(sent);

    var msg = el("textarea"); msg.placeholder = T.ph; msg.setAttribute("aria-label", T.title);
    var contact = el("input"); contact.type = "text"; contact.placeholder = T.contact;
    var send = el("button", "fc-send", T.send); send.type = "button";
    card.appendChild(msg); card.appendChild(contact); card.appendChild(send);

    back.appendChild(card);
    document.body.appendChild(back);
    setTimeout(function () { msg.focus(); }, 30);

    function close() { if (back.parentNode) back.parentNode.removeChild(back); }
    x.onclick = close;
    back.addEventListener("click", function (e) { if (e.target === back) close(); });

    send.onclick = function () {
      var m = msg.value.trim();
      if (!m && sentiment === 0) { msg.focus(); return; }
      var entry = { t: new Date().toISOString(), page: location.pathname + location.search, lang: PT ? "pt-BR" : "en", sentiment: sentiment, message: m, contact: contact.value.trim() };
      var list = load(); list.push(entry); save(list);
      postOne(entry, list);                          // POST same-origin → servidor loga (fly logs) + encaminha pro co
      if (window.AL_track) try { window.AL_track("yuri_feedback", { sentiment: sentiment }); } catch (e) {}
      card.innerHTML = ""; card.appendChild(el("div", "fc-done", T.thanks));
      setTimeout(close, 1100);
    };
  }

  // visão do dono: ?feedback → lista + exportar/copiar/limpar
  function openAdmin() {
    var back = el("div", "fc-back");
    var card = el("div", "fc-card");
    var head = el("div", "fc-h");
    head.appendChild(el("b", null, T.adminTitle + " (" + load().length + ")"));
    var x = el("button", "fc-x", "×"); head.appendChild(x);
    card.appendChild(head);
    var list = load();
    var box = el("div", "fc-list");
    if (!list.length) box.appendChild(el("p", "fc-q", T.empty));
    list.slice().reverse().forEach(function (e) {
      var it = el("div", "fc-item");
      var emo = e.sentiment > 0 ? "👍" : e.sentiment < 0 ? "👎" : "😐";
      it.appendChild(el("div", "meta", emo + "  " + fmt(e.t) + "  ·  " + e.page + (e.contact ? "  ·  " + e.contact : "")));
      if (e.message) it.appendChild(el("div", "m", e.message));
      box.appendChild(it);
    });
    card.appendChild(box);
    var tools = el("div", "fc-tools");
    var bExp = el("button", null, T.exp), bCopy = el("button", null, T.copy), bClr = el("button", null, T.clear);
    bExp.onclick = function () {
      var blob = new Blob([JSON.stringify(load(), null, 2)], { type: "application/json" });
      var a = el("a"); a.href = URL.createObjectURL(blob); a.download = "yuri-feedback.json"; a.click();
    };
    bCopy.onclick = function () { try { navigator.clipboard.writeText(JSON.stringify(load(), null, 2)); bCopy.textContent = T.copied; } catch (e) {} };
    bClr.onclick = function () { if (confirm("Limpar todo o feedback deste navegador?")) { save([]); back.parentNode.removeChild(back); } };
    tools.appendChild(bExp); tools.appendChild(bCopy); tools.appendChild(bClr);
    card.appendChild(tools);
    back.appendChild(card); document.body.appendChild(back);
    function close() { if (back.parentNode) back.parentNode.removeChild(back); }
    x.onclick = close; back.addEventListener("click", function (e) { if (e.target === back) close(); });
  }

  function build() {
    styles();
    var fab = el("button", "fc-fab", T.cta);
    fab.setAttribute("aria-label", T.cta);
    fab.onclick = openForm;
    document.body.appendChild(fab);
    syncUnsent();                                    // re-envia feedback antigo do localStorage (→ fly logs + co)
    if (/[?&]feedback\b/.test(location.search)) openAdmin();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build);
  else build();
})();
