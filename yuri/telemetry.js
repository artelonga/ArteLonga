/* yuri/telemetry.js — telemetria de ACESSO + INTERAÇÃO (GA-like), first-party.
 *
 * Princípio: a universe é dona da sua telemetria. Envia pra /api/track (estado
 * local da surface) — NÃO vai pro co (só feedback consentido é broadcastado).
 * Privacidade: sem cookies (sessão em sessionStorage, por aba), sem PII, sem
 * terceiros. Respeita Do-Not-Track. Pageview no load + cliques (outbound marcado). */
(function () {
  var dnt = navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack;
  if (dnt === "1" || dnt === "yes") return;                 // respeita DNT
  var EP = "/api/track";

  function sid() {
    try {
      var k = "al.sid", v = sessionStorage.getItem(k);
      if (!v) { v = Date.now().toString(36) + Math.random().toString(36).slice(2, 8); sessionStorage.setItem(k, v); }
      return v;
    } catch (e) { return null; }
  }
  function send(ev) {
    try {
      ev.session = sid();
      ev.t = new Date().toISOString();
      ev.page = location.pathname + location.search;
      ev.lang = (document.documentElement.lang || navigator.language || "").slice(0, 5);
      var body = JSON.stringify(ev);
      if (navigator.sendBeacon) navigator.sendBeacon(EP, new Blob([body], { type: "application/json" }));
      else fetch(EP, { method: "POST", headers: { "Content-Type": "application/json" }, body: body, keepalive: true });
    } catch (e) {}
  }

  // acesso: pageview no carregamento
  send({ kind: "pageview", referrer: document.referrer || null, vw: window.innerWidth || null });

  // interação: cliques em links (outbound = sai do host atual)
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest && e.target.closest("a[href]");
    if (!a) return;
    var href = a.getAttribute("href") || "";
    if (!href || href.charAt(0) === "#") return;              // âncora interna: ignora
    var outbound = /^https?:\/\//.test(href) && a.hostname !== location.hostname;
    send({ kind: "interaction", action: "click", target: href, outbound: outbound });
  }, true);
})();
