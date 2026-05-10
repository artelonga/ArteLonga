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
// (data.js define window.AL; renderer.js consome). defer não funciona
// em script dinâmico — async=false é o equivalente correto.
(function () {
    var V = "20260510d";
    var head = document.head;

    ["site.css", "components.css", "pages.css"].forEach(function (name) {
        var link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "/assets/" + name + "?v=" + V;
        head.appendChild(link);
    });

    ["analytics.js", "data.js", "renderer.js"].forEach(function (name) {
        var s = document.createElement("script");
        s.src = "/assets/" + name + "?v=" + V;
        s.async = false;
        head.appendChild(s);
    });
})();
