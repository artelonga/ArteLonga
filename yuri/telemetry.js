/* yuri/telemetry.js — telemetria de ACESSO + INTERAÇÃO + RETENÇÃO (GA-like), first-party.
 *
 * Princípio: a universe é dona da sua telemetria. Envia pra /api/track (estado
 * local da surface) — NÃO vai pro co (só feedback consentido é broadcastado).
 * Privacidade: respeita Do-Not-Track; sem PII; sem terceiros. País é resolvido
 * no servidor (IP nunca persistido). Ver docs/telemetry-surfaces.md.
 *
 * Coleta: pageview (load) · interaction (clique, outbound marcado) · page_end
 * (dwell — ms ativos) · goal (conversão). Identidade: al_vid persistente
 * (localStorage + cookie no apex .artelonga.com.br, PONTE com o cliente do apex)
 * pra distinguir visitante novo/recorrente; al.sid por aba (sessão). */
(function () {
  var dnt = navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack;
  if (dnt === "1" || dnt === "yes") return;                 // respeita DNT
  var EP = "/api/track";

  // ── identidade ────────────────────────────────────────────────────────────
  function getCookie(name) {
    try { var m = document.cookie.match("(?:^|; )" + name + "=([^;]*)"); return m ? decodeURIComponent(m[1]) : null; }
    catch (e) { return null; }
  }
  function setCookie(name, val) {
    try {
      var apex = /(^|\.)artelonga\.com\.br$/.test(location.hostname);
      document.cookie = name + "=" + encodeURIComponent(val) + "; path=/; max-age=63072000; samesite=lax" +
        (location.protocol === "https:" ? "; secure" : "") + (apex ? "; domain=.artelonga.com.br" : "");
    } catch (e) {}
  }
  function rid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 10); }
  // al_vid: cookie do apex primeiro (ponte cross-subdomínio), senão localStorage, senão cria.
  function vid() {
    var v = getCookie("al_vid");
    try { if (!v) v = localStorage.getItem("al.vid"); } catch (e) {}
    if (!v) v = rid();
    try { localStorage.setItem("al.vid", v); } catch (e) {}
    setCookie("al_vid", v);
    return v;
  }
  // al.sid: sessão por aba (sessionStorage).
  function sid() {
    try {
      var k = "al.sid", v = sessionStorage.getItem(k);
      if (!v) { v = rid(); sessionStorage.setItem(k, v); }
      return v;
    } catch (e) { return null; }
  }
  var VID = vid(), SID = sid();

  function send(ev) {
    try {
      ev.session = SID; ev.vid = VID;
      ev.t = new Date().toISOString();
      ev.page = location.pathname + location.search;
      ev.lang = (document.documentElement.lang || navigator.language || "").slice(0, 5);
      var body = JSON.stringify(ev);
      if (navigator.sendBeacon) navigator.sendBeacon(EP, new Blob([body], { type: "application/json" }));
      else fetch(EP, { method: "POST", headers: { "Content-Type": "application/json" }, body: body, keepalive: true });
    } catch (e) {}
  }

  // ── acesso: pageview no carregamento ───────────────────────────────────────
  send({ kind: "pageview", referrer: document.referrer || null, vw: window.innerWidth || null });

  // ── retenção: dwell (ms ativos) via page_end. Conta só tempo visível; manda o
  // delta desde o último envio (visibilitychange/pagehide) — sem dupla contagem.
  var activeMs = 0, sentMs = 0, lastTs = Date.now(), visible = (document.visibilityState !== "hidden");
  function accrue() { var now = Date.now(); if (visible) activeMs += now - lastTs; lastTs = now; }
  function flushEnd() { accrue(); var d = activeMs - sentMs; if (d <= 0) return; sentMs = activeMs; send({ kind: "page_end", dur: d }); }
  document.addEventListener("visibilitychange", function () {
    accrue();
    if (document.visibilityState === "hidden") { visible = false; flushEnd(); }
    else { visible = true; lastTs = Date.now(); }
  });
  window.addEventListener("pagehide", flushEnd);

  // ── conversões: regras built-in (sem precisar editar HTML) + [data-goal] ────
  function goalFor(a, href) {
    if (a.getAttribute("data-goal")) return a.getAttribute("data-goal");
    if (/\/resume\//.test(href) || /\.pdf($|\?)/.test(href)) return "resume";
    if (/^mailto:/.test(href) || /^tel:/.test(href) || /wa\.me|whatsapp/.test(href)) return "contato";
    if (/github\.com/.test(href)) return "github";
    if (/linkedin\.com/.test(href)) return "linkedin";
    return null;
  }

  // ── interação: cliques em links (outbound = sai do host atual) + goal ───────
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest && e.target.closest("a[href], [data-goal]");
    if (!a) return;
    var href = a.getAttribute("href") || "";
    if (href && href.charAt(0) === "#") return;               // âncora interna: ignora
    if (href) {
      var outbound = /^https?:\/\//.test(href) && a.hostname !== location.hostname;
      send({ kind: "interaction", action: "click", target: href, outbound: outbound });
    }
    var g = goalFor(a, href);
    if (g) send({ kind: "goal", goal: g, target: href || null });
  }, true);
})();
