/* neuro/parse.js — camada de CONTEÚDO.
 *
 * Lê /neuro/timeline.md e devolve uma lista de eventos estruturados.
 * As três formas (/neuro1, /neuro2, /neuro3) consomem ISTO — nenhuma delas
 * conhece o markdown cru. Trocar a fonte = mexer só aqui.
 *
 * Espelha a convenção de wiki-link do repo (src/lib/markdown.ts): [[slug|label]].
 */
(function (global) {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // slug determinístico a partir de "ANO · Título" → "ano-titulo-kebab"
  function slugify(year, title) {
    var base = year + "-" + title;
    return base.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  // markdown inline → HTML. ![alt](src) vira imagem, [[slug|label]] link interno
  // (data-jump), [txt](url) externo abre em nova aba, *txt* vira ênfase.
  function mdInline(s) {
    return esc(s)
      // {galeria: <base> | <rótulo>} → botão que abre a galeria com consentimento (gallery.js)
      .replace(/\{galeria:\s*([^|}]+?)\s*(?:\|\s*([^}]+?)\s*)?\}/g, function (_, base, label) {
        return '<button type="button" class="neuro-gallery" data-base="' + base.trim() + '">' +
          (label ? label.trim() : "Ver galeria") + "</button>";
      })
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, function (_, alt, src) {
        return '<img class="al-img" src="' + esc(src.trim()) + '" alt="' + esc(alt.trim()) + '" loading="lazy">';
      })
      .replace(/\[@([A-Za-z0-9_:-]+)(?:\s*\|\s*([^\]]+))?\]/g, function (_, key, loc) {
        // citação ABNT inline (autor-data). NÃO é link: clicar/hover abre o popover
        // da referência (com o link para a fonte dentro). references.js cuida disso.
        var k = key.trim();
        return '<span class="neuro-cite" tabindex="0" role="button" data-cite="' + esc(k) + '"' +
          (loc ? ' data-loc="' + esc(loc.trim()) + '"' : "") + '>[' + esc(k) + "]</span>";
      })
      .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, function (_, target, label) {
        var t = (target || "").trim();
        var l = (label != null ? label : target).trim();
        return '<a href="#' + esc(t) + '" class="neuro-jump" data-jump="' + esc(t) + '">' + l + "</a>";
      })
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, function (_, text, url) {
        var href = url.replace(/&amp;/g, "&");
        var external = /^https?:\/\//.test(href);
        return '<a href="' + esc(href) + '"' + (external ? ' target="_blank" rel="noopener"' : "") + ">" + text + "</a>";
      })
      .replace(/\*([^*\n]+)\*/g, "<em>$1</em>");
  }

  // markdown de bloco → HTML. Reconhece: lista de bullets (- item), imagem
  // sozinha (vira <figure> com legenda) e parágrafo normal.
  function mdBlock(s) {
    var blocks = String(s || "").split(/\n\s*\n/).map(function (b) { return b.trim(); }).filter(Boolean);
    return blocks.map(function (b) {
      var lines = b.split("\n");
      // lista discreta, baixa ênfase: "Ensino:/Cadernos:/Áreas: item · item · item"
      var syl = b.match(/^(Ensino|Cadernos|Áreas):\s*([\s\S]+)$/i);
      if (syl) {
        var items = syl[2].replace(/\.\s*$/, "").split("·")
          .map(function (x) { return x.trim(); }).filter(Boolean);
        return '<div class="al-syllabus al-syl-inline"><span class="al-syl-h">' + esc(syl[1]) + '</span>' +
          '<ul>' + items.map(function (it) { return "<li>" + mdInline(it) + "</li>"; }).join("") +
          "</ul></div>";
      }
      if (lines.every(function (l) { return /^\s*-\s+/.test(l); })) {
        return '<ul class="al-list">' + lines.map(function (l) {
          return "<li>" + mdInline(l.replace(/^\s*-\s+/, "")) + "</li>";
        }).join("") + "</ul>";
      }
      var im = b.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      if (im) {
        var cap = im[1].trim();
        return '<figure class="al-fig"><img class="al-img" src="' + esc(im[2].trim()) +
          '" alt="' + esc(cap) + '" loading="lazy">' +
          (cap ? '<figcaption>' + esc(cap) + "</figcaption>" : "") + "</figure>";
      }
      return "<p>" + mdInline(b).replace(/\n/g, " ") + "</p>";
    }).join("");
  }

  function parse(md) {
    // título do documento (primeira linha # ...), opcional
    var docTitle = "";
    var mTitle = md.match(/^\s*#\s+(.+)$/m);
    if (mTitle) docTitle = mTitle[1].trim();

    // remove comentários HTML
    md = md.replace(/<!--[\s\S]*?-->/g, "");

    var events = [];
    // divide em seções "## ..."
    var sections = md.split(/^##\s+/m).slice(1);
    sections.forEach(function (sec) {
      var nl = sec.indexOf("\n");
      var header = (nl === -1 ? sec : sec.slice(0, nl)).trim();
      var rest = nl === -1 ? "" : sec.slice(nl + 1);

      // {lado: esq|dir}
      var side = "auto";
      var mSide = header.match(/\{\s*lado\s*:\s*(esq|dir)\s*\}/i);
      if (mSide) side = mSide[1].toLowerCase() === "dir" ? "dir" : "esq";
      header = header.replace(/\{[^}]*\}/g, "").trim();

      // "ANO · Título"  (separador · — ou - como fallback)
      var year = "", title = header;
      var mHead = header.match(/^(\d{3,4})\s*[·\-—]\s*(.+)$/);
      if (mHead) { year = mHead[1]; title = mHead[2].trim(); }

      // teaser = linhas iniciais começando com ">"
      var lines = rest.split("\n");
      var teaserLines = [];
      var i = 0;
      while (i < lines.length && /^\s*>/.test(lines[i])) {
        teaserLines.push(lines[i].replace(/^\s*>\s?/, ""));
        i++;
      }
      var teaser = teaserLines.join(" ").trim();
      var body = lines.slice(i).join("\n").trim();

      // primeira imagem do corpo vira thumbnail do marco (removida do corpo
      // pra não duplicar). Imagens seguintes seguem como <figure> no corpo.
      var image = null;
      var imgMatch = body.match(/!\[([^\]]*)\]\(([^)]+)\)/);
      if (imgMatch) {
        image = { alt: imgMatch[1].trim(), src: imgMatch[2].trim() };
        body = body.replace(imgMatch[0], "").replace(/\n{3,}/g, "\n\n").trim();
      }

      events.push({
        id: slugify(year || String(events.length), title),
        year: year,
        title: title,
        side: side,
        teaser: teaser,
        teaserHtml: mdInline(teaser),
        image: image,
        bodyHtml: mdBlock(body),
        hasBody: !!body
      });
    });

    // resolve side "auto" alternando esq/dir
    var k = 0;
    events.forEach(function (e) {
      if (e.side === "auto") { e.side = k % 2 === 0 ? "esq" : "dir"; }
      k++;
    });

    return { title: docTitle, events: events };
  }

  function load(url) {
    return fetch(url || "/neuro/timeline.md", { cache: "no-cache" })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status + " ao carregar " + url);
        return r.text();
      })
      .then(parse);
  }

  global.NeuroTimeline = { parse: parse, load: load, mdInline: mdInline, slugify: slugify, esc: esc };
})(window);
