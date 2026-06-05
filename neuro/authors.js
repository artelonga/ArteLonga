/* neuro/authors.js — registro CANÔNICO de autores (METADADO, não forma).
 *
 * Problema: o mesmo autor aparece em várias formas — "VIEIRA SUGANO, Yuri Yukio"
 * (ABNT), "yuri" (handle), "Yuri", "Vieira Sugano". Sem identidade canônica,
 * filtrar/consultar por autor não funciona ("yuri" ≠ "VIEIRA SUGANO, …").
 *
 * Este é o metadado UNIFICADO: resolve qualquer variante pra UMA identidade, então
 * a base (neuro/references.js) vira consultável por autor — "publicações onde yuri
 * é autor", "autor contém havlik". CONTEÚDO = `people`; FORMA = as funções.
 *
 * A maioria dos autores é AUTO-DERIVADA do sobrenome ABNT (id = slug do sobrenome),
 * então só precisa registrar explicitamente quem tem VARIANTES/handle (ex. yuri).
 */
window.NeuroAuthors = (function () {
  "use strict";

  function deburr(s) { return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  function norm(s) { return deburr(s).toLowerCase().replace(/[.,]/g, "").replace(/\s+/g, " ").trim(); }
  // sobrenome canônico de "SOBRENOME, Nome" (ABNT) ou de uma query → normalizado
  function abntSurname(a) { return norm((String(a).split(",")[0] || a)); }

  // Autores com VARIANTES explícitas. id estável; aliases = todas as formas vistas.
  // (Os demais autores não precisam estar aqui — auto-derivam do sobrenome.)
  var people = [
    {
      id: "yuri", handle: "yuri",
      display: "Yuri Yukio Vieira Sugano", abnt: "VIEIRA SUGANO, Yuri Yukio",
      aliases: ["yuri", "Yuri", "Vieira Sugano", "Sugano", "Vieira Sugano, Y. Y.",
        "Yuri Vieira Sugano", "VIEIRA SUGANO, Yuri Yukio", "Yuri Yukio Vieira Sugano"]
    },
    { id: "havlik", display: "John L. Havlik", abnt: "HAVLIK, John L.", aliases: ["Havlik", "John Havlik"] },
    { id: "mason", display: "Peggy Mason", abnt: "MASON, Peggy", aliases: ["Mason", "Peggy Mason"] },
    { id: "madelaire", display: "Carla B. Madelaire", abnt: "MADELAIRE, Carla B.", aliases: ["Madelaire"] }
  ];

  // índice: forma-normalizada → id (aliases, display, abnt, handle, e o sobrenome ABNT)
  var idx = {}, byId = {};
  people.forEach(function (p) {
    byId[p.id] = p;
    [p.id, p.display, p.abnt, p.handle].concat(p.aliases || []).forEach(function (a) { if (a) idx[norm(a)] = p.id; });
    if (p.abnt) idx[abntSurname(p.abnt)] = p.id;   // sobrenome também resolve
  });

  // resolve qualquer string (query OU autor ABNT) → id canônico.
  // Não-registrados auto-derivam: id = slug do sobrenome (havlik, mason, …).
  function resolve(s) {
    if (!s) return null;
    var n = norm(s);
    if (idx[n]) return idx[n];
    var sn = abntSurname(s);
    if (idx[sn]) return idx[sn];
    return sn ? sn.replace(/\s+/g, "-") : null;
  }
  function idOf(abnt) { return resolve(abnt); }          // id de um autor ABNT da base

  // quebra uma string em fragmentos-autor (p/ strings COMBINADAS tipo
  // "Havlik, Vieira Sugano et al." — cada pessoa resolve separada).
  function frags(s) {
    return String(s).split(/,|;|&| e | and |\bet al\.?/i).map(function (x) { return x.trim(); }).filter(Boolean);
  }
  // a query casa com este autor/string? resolve a string inteira (autor ABNT limpo),
  // senão cada fragmento (string combinada), senão fallback "contém" (substring).
  function match(s, query) {
    if (!s || !query) return false;
    var qid = resolve(query);
    if (resolve(s) === qid) return true;
    var parts = frags(s);
    for (var i = 0; i < parts.length; i++) { if (resolve(parts[i]) === qid) return true; }
    return norm(s).indexOf(norm(query)) !== -1;          // "havlik" em "HAVLIK, John L."
  }
  function displayOf(id) { return byId[id] ? byId[id].display : id; }
  function all() { return people.slice(); }

  return { resolve: resolve, idOf: idOf, match: match, displayOf: displayOf, all: all, norm: norm };
})();
