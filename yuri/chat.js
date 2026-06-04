/* yuri/chat.js — floating chat widget for the garden.
 *
 * Garden-native (this repo), NOT co's modules/assistant.js: that widget does a
 * RELATIVE fetch('/api/v1/chat/:slug') and derives the slug from the path, so it
 * can't be embedded on artelonga.com.br/yuri (different origin, wrong slug). This
 * widget POSTs the ABSOLUTE co endpoint for the public `artelonga` universe.
 * CORS is already open to https://artelonga.com.br (verified).
 *
 * GATE: disabled until co has a reachable non-Claude chat provider. Today co's
 * AiProvider points at http://localhost:11434 (Ollama) on its Fly machine, which
 * isn't running there → every request returns `event: error`. Flip ENABLED to
 * true (and bump V in bootstrap.js) once a provider answers. Until then the
 * launcher button is not rendered, so no console errors leak into CI.
 *
 * SSE contract (co-web/src/integrations/chat_routes.rs):
 *   event: token        data: {"text":"word "}
 *   event: tool_start   data: {...}
 *   event: tool_result  data: {...}
 *   event: done         data: {}
 *   event: error        data: {"message":"..."}
 */
(function () {
  "use strict";

  var ENABLED = false; // ← co provider down; see header note
  var ENDPOINT = "https://co.artelonga.com.br/api/v1/chat/artelonga";
  var HKEY = "yuri-chat-history";
  var MAX = 20; // user+assistant turns kept in sessionStorage

  if (!ENABLED) return;

  function loadHist() {
    try { return JSON.parse(sessionStorage.getItem(HKEY) || "[]"); }
    catch (e) { return []; }
  }
  function saveHist(h) {
    try { sessionStorage.setItem(HKEY, JSON.stringify(h.slice(-MAX))); }
    catch (e) { /* full */ }
  }

  var hist = loadHist();
  var open = false, busy = false;
  var els = {};

  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }

  function build() {
    var btn = el("button", "chat-fab", "?");
    btn.setAttribute("aria-label", "Conversar / chat");
    btn.addEventListener("click", toggle);

    var panel = el("div", "chat-panel");
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Chat");
    panel.hidden = true;

    var head = el("div", "chat-head");
    head.appendChild(el("span", "chat-title", "perguntar à rede"));
    var x = el("button", "chat-x", "×");
    x.setAttribute("aria-label", "fechar");
    x.addEventListener("click", toggle);
    head.appendChild(x);

    var log = el("div", "chat-log");
    var form = el("form", "chat-form");
    var input = el("input", "chat-input");
    input.type = "text";
    input.placeholder = "ex: quais serviços a arte longa oferece?";
    input.setAttribute("aria-label", "mensagem");
    var send = el("button", "chat-send", "→");
    send.type = "submit";
    form.appendChild(input);
    form.appendChild(send);
    form.addEventListener("submit", onSubmit);

    panel.appendChild(head);
    panel.appendChild(log);
    panel.appendChild(form);

    document.body.appendChild(btn);
    document.body.appendChild(panel);
    els = { btn: btn, panel: panel, log: log, input: input };

    hist.forEach(function (m) { addBubble(m.role, m.content); });
  }

  function toggle() {
    open = !open;
    els.panel.hidden = !open;
    els.btn.classList.toggle("on", open);
    if (open) els.input.focus();
  }

  function addBubble(role, text) {
    var b = el("div", "chat-msg chat-" + role, text);
    els.log.appendChild(b);
    els.log.scrollTop = els.log.scrollHeight;
    return b;
  }

  function onSubmit(e) {
    e.preventDefault();
    if (busy) return;
    var msg = els.input.value.trim();
    if (!msg) return;
    els.input.value = "";
    addBubble("user", msg);
    hist.push({ role: "user", content: msg });
    saveHist(hist);
    stream(msg);
  }

  function stream(msg) {
    busy = true;
    var out = addBubble("assistant", "");
    var acc = "";
    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg })
    }).then(function (resp) {
      if (!resp.ok || !resp.body) throw new Error("HTTP " + resp.status);
      var reader = resp.body.getReader();
      var dec = new TextDecoder();
      var buf = "";
      function pump() {
        return reader.read().then(function (r) {
          if (r.done) return finish();
          buf += dec.decode(r.value, { stream: true });
          var parts = buf.split("\n\n");
          buf = parts.pop();
          parts.forEach(function (block) {
            var ev = "message", data = "";
            block.split("\n").forEach(function (line) {
              if (line.indexOf("event:") === 0) ev = line.slice(6).trim();
              else if (line.indexOf("data:") === 0) data += line.slice(5).trim();
            });
            if (!data) return;
            var d;
            try { d = JSON.parse(data); } catch (e) { return; }
            if (ev === "token" && d.text) { acc += d.text; out.textContent = acc; els.log.scrollTop = els.log.scrollHeight; }
            else if (ev === "error") { acc += (acc ? "\n\n" : "") + "⚠ " + (d.message || "erro"); out.textContent = acc; }
          });
          return pump();
        });
      }
      return pump();
    }).catch(function (err) {
      out.textContent = "⚠ " + err.message;
    }).then(finish);
    function finish() {
      if (busy) {
        busy = false;
        if (acc) { hist.push({ role: "assistant", content: acc }); saveHist(hist); }
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
