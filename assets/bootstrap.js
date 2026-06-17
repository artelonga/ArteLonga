// Single point of asset loading.
//
// Why: até PR #36 cada HTML carregava versão própria pra cada CSS/JS,
// o que forçava bump em ~150 arquivos toda vez que um asset compartilhado
// mudava. Acopla forma a conteúdo. Aqui, todos os HTMLs apenas linkam
// /assets/bootstrap.js — quando um asset muda, basta bumpar V abaixo.
//
// Cache: bootstrap.js em si NÃO leva ?v=. Confiamos no Cache-Control
// padrão do GitHub Pages (~10 min) — atualizações se propagam sozinhas
// dentro dessa janela. O preço é até 10min de delay; o ganho é não
// reescrever 150 arquivos pra mudar uma vírgula.
//
// Ordem: CSS first (blocking, paint-relevant), depois scripts.
// Scripts usam async=false pra executar na ordem de inserção no DOM
// (data files definem window.AL.*; data.core.js consome e exporta; renderer.js renderiza).
// defer não funciona em script dinâmico — async=false é o equivalente correto.
//
// Per-page loading: bootstrap runs in <head> before <body> is parsed, so
// data-page attribute on <body> is not readable here. URL path is used to
// select the minimal data modules for each known page type. Unknown paths
// fall back to loading all modules (safe for profile, poem, essay pages).
(function () {
    var V = "20260617a";
    var head = document.head;

    ["site.css", "components.css", "pages.css"].forEach(function (name) {
        var link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "/assets/" + name + "?v=" + V;
        head.appendChild(link);
    });

    // ── Per-page data module selection ───────────────────────────────────────
    var DATA = {
        people:      "data.people.js",
        communities: "data.communities.js",
        services:    "data.services.js",
        solutions:   "data.solutions.js",
        missions:    "data.missions.js",
        finances:    "data.finances.js"
    };
    var ALL = [DATA.people, DATA.communities, DATA.services, DATA.solutions, DATA.missions, DATA.finances];

    var p = window.location.pathname.replace(/\/index\.html$/, "/");
    var segs = p.split("/").filter(Boolean);
    var dataFiles;

    if (p === "/" || p === "") {
        // home: people + communities + services + finances (no solutions/missions/poems)
        dataFiles = [DATA.people, DATA.communities, DATA.services, DATA.finances];
    } else if (p === "/parceiros/") {
        // parceiros: people + communities + finances (isSocio, roster)
        dataFiles = [DATA.people, DATA.communities, DATA.finances];
    } else if (p === "/servicos/") {
        // servicos catalog: people + communities + services
        dataFiles = [DATA.people, DATA.communities, DATA.services];
    } else if (segs[0] === "servicos" && segs.length >= 2) {
        // service detail: people + communities + services + finances (pricing)
        dataFiles = [DATA.people, DATA.communities, DATA.services, DATA.finances];
    } else if (p === "/solucoes/") {
        // solucoes: only solutions
        dataFiles = [DATA.solutions];
    } else if (p === "/recursos/") {
        // recursos: finances + people (nomeOf handles)
        dataFiles = [DATA.people, DATA.finances];
    } else if (p === "/contato/") {
        // contato: no data needed
        dataFiles = [];
    } else if (segs[0] === "missoes" && segs.length >= 2) {
        // missao detail: people + communities + services + missions
        dataFiles = [DATA.people, DATA.communities, DATA.services, DATA.missions];
    } else if (segs.length >= 2 && ["servicos", "missoes", "solucoes", "parceiros",
                                    "recursos", "contato", "design"].indexOf(segs[0]) === -1) {
        // poem or essay page (/<handle>/<slug>/) — only needs people (poems are in people module)
        dataFiles = [DATA.people];
    } else {
        // default: all modules (profile pages, sobre, etc.)
        dataFiles = ALL;
    }

    ["analytics.js"].concat(dataFiles, ["data.core.js", "renderer.js"]).forEach(function (name) {
        var s = document.createElement("script");
        s.src = "/assets/" + name + "?v=" + V;
        s.async = false;
        head.appendChild(s);
    });
})();
