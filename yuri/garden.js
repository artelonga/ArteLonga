/* yuri/site/garden.js — índice pessoal estático. Carrega entries.json, consulta por
   data/tipo/categoria/autor/busca, e renderiza entradas (callout [!quote], embed de
   YouTube, transclusão ![[slug]], notas de caderno). Sem dependências.

   AL-61: índice dividido em duas seções por `kind` (Sistemas / Criativo), intro = tagline,
   UI bilíngue pt-BR/en (toggle em ?lang= + localStorage) e seleção de conteúdo por
   `lang` com fallback dentro do grupo de tradução `tkey`. Poemas preservam quebras. */
(function () {
  "use strict";
  var APP, DATA = [], BY = {};

  // ── i18n (chrome da UI; o conteúdo vem dos entries) ──
  var STR = {
    "pt-BR": { systems:"Portfólio Técnico", creative:"Criativo", search:"buscar…",
      cat:"categoria", type:"tipo", author:"autor", index:"← índice",
      count:function(n){return n+" entrada"+(n===1?"":"s");},
      notfound:"Entrada não encontrada.", empty:"nada por aqui ainda.",
      loadfail:"Falha ao carregar o índice.", nav_portfolio:"Portfólio", nav_resume:"Currículo",
      sub:"índice · dias · referências · notas",
      intro:"Alquimista. Conduzindo o futuro da tecnologia a partir da ancestralidade. Escrevendo inteligência biológica e de máquina. Pela livre expressão de ser." },
    "en": { systems:"Technical Portfolio", creative:"Creative", search:"search…",
      cat:"category", type:"type", author:"author", index:"← index",
      count:function(n){return n+" "+(n===1?"entry":"entries");},
      notfound:"Entry not found.", empty:"nothing here yet.",
      loadfail:"Failed to load the index.", nav_portfolio:"Portfolio", nav_resume:"Résumé",
      sub:"index · days · references · notes",
      intro:"Alchemist. Steering the future of technology from ancestrality. Writing biological and machine intelligence. For the free expression of being." }
  };
  var LANGS = ["pt-BR", "en"];
  function getLang(){
    var p = new URL(location.href).searchParams.get("lang");
    if (p && STR[p]) { try{localStorage.setItem("yuri.lang",p);}catch(e){} return p; }
    var s; try{ s = localStorage.getItem("yuri.lang"); }catch(e){}
    return (s && STR[s]) ? s : "pt-BR";
  }
  var LANG = getLang();
  function L(){ return STR[LANG]; }
  // rótulos de tipo localizados — segue o idioma do site; o valor cru continua sendo a chave de filtro
  var TYPE_LABELS = {
    page:{ "pt-BR":"portfólio", en:"portfolio" }, project:{ "pt-BR":"projeto", en:"project" },
    paper:{ "pt-BR":"artigo", en:"paper" }, portfolio:{ "pt-BR":"portfólio", en:"portfolio" },
    ref:{ "pt-BR":"referência", en:"reference" }, nota:{ "pt-BR":"nota", en:"note" },
    song:{ "pt-BR":"música", en:"song" }, poem:{ "pt-BR":"poema", en:"poem" },
    dia:{ "pt-BR":"diário", en:"journal" }, url:{ "pt-BR":"link", en:"link" },
    video:{ "pt-BR":"vídeo", en:"video" }, resume:{ "pt-BR":"currículo", en:"résumé" },
    tese:{ "pt-BR":"tese", en:"thesis" }, patente:{ "pt-BR":"patente", en:"patent" }
  };
  function typeLabel(t){ var m = TYPE_LABELS[t]; return (m && m[LANG]) ? m[LANG] : t; }
  // rótulos de categoria localizados (mesma ideia: valor cru = chave de filtro, label segue o idioma)
  var CAT_LABELS = {
    sistemas:{ "pt-BR":"sistemas", en:"systems" }, systems:{ "pt-BR":"sistemas", en:"systems" },
    dados:{ "pt-BR":"dados", en:"data" }, "neurociência":{ "pt-BR":"neurociência", en:"neuroscience" },
    tecnologia:{ "pt-BR":"tecnologia", en:"technology" }, "publicação":{ "pt-BR":"publicação", en:"publication" },
    tese:{ "pt-BR":"tese", en:"thesis" }, patente:{ "pt-BR":"patente", en:"patent" },
    metodologia:{ "pt-BR":"metodologia", en:"methodology" }, "citação":{ "pt-BR":"citação", en:"quote" },
    escrita:{ "pt-BR":"escrita", en:"writing" }, music:{ "pt-BR":"música", en:"music" },
    biologia:{ "pt-BR":"biologia", en:"biology" }, social:{ "pt-BR":"social", en:"social" }
  };
  function catLabel(c){ var m = CAT_LABELS[c]; return (m && m[LANG]) ? m[LANG] : c; }
  function setLang(l){
    if (!STR[l] || l===LANG) return;
    LANG = l; try{ localStorage.setItem("yuri.lang", l); }catch(e){}
    var u = new URL(location.href); u.searchParams.set("lang", l); history.replaceState(null,"",u);
    applyChrome(); route();
  }
  // aplica strings da UI no shell (header/nav/title) — ids opcionais, degrada se ausentes
  function applyChrome(){
    document.documentElement.lang = LANG;
    var sub = document.querySelector(".site-head .sub"); if (sub) sub.textContent = L().sub;
    var np = document.getElementById("nav-portfolio"); if (np && np.childNodes[0]) np.childNodes[0].nodeValue = L().nav_portfolio;
    var nr = document.getElementById("nav-resume");
    if (nr){ if(nr.childNodes[0]) nr.childNodes[0].nodeValue = L().nav_resume + " ";
      nr.setAttribute("href", LANG==="pt-BR" ? "/yuri/resume/pt/" : "/yuri/resume/"); }   // résumé bilíngue existente
    renderLangToggle();
  }
  function renderLangToggle(){
    var box = document.getElementById("langtoggle"); if (!box) return;
    box.innerHTML = "";
    LANGS.forEach(function(l){
      var b = document.createElement("button");
      b.className = "lang" + (l===LANG ? " on" : ""); b.type = "button";
      b.textContent = (l==="pt-BR" ? "PT" : "EN");
      b.setAttribute("aria-pressed", l===LANG ? "true" : "false");
      b.onclick = function(){ setLang(l); };
      box.appendChild(b);
    });
  }

  function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
  function ytId(u){var m=String(u||"").match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{6,})/);return m?m[1]:null;}

  // título de um link: usa m.title se houver; senão deriva um rótulo legível do alvo
  // (nunca mostra a URL crua). Default = "título do alvo"; o autor pode sobrepor via title:.
  function hostOf(u){try{return new URL(u,location.origin).hostname.replace(/^www\./,"");}catch(e){return u;}}
  function linkTitle(m){
    if(m.title)return m.title;
    var u=m.url||"";
    var gh=u.match(/github\.com\/[^/]+\/([^/?#]+)/);if(gh)return gh[1]+" · GitHub";
    if(/doi\.org/.test(u))return "Artigo (DOI)";
    if(/patents\.google/.test(u))return "Patente (Google Patents)";
    if(/jstor\.org/.test(u))return "Artigo (JSTOR)";
    if(/\.pdf($|[?#])/i.test(u))return "PDF";
    if(/youtu\.?be/.test(u))return "Vídeo (YouTube)";
    return hostOf(u);
  }
  function mediaHtml(media){
    return (media||[]).map(function(m){
      if(m.kind==="youtube"){var id=ytId(m.url);if(id)return '<div class="media"><div class="yt"><iframe src="https://www.youtube.com/embed/'+esc(id)+'" title="YouTube" allow="encrypted-media;picture-in-picture" allowfullscreen loading="lazy"></iframe></div></div>';}
      if(m.kind==="mp3")return '<div class="media"><audio controls src="'+esc(m.url)+'"></audio></div>';
      return '<div class="media ext"><a href="'+esc(m.url)+'" target="_blank" rel="noopener">'+esc(linkTitle(m))+' ↗</a></div>';
    }).join("");
  }

  // markdown → html (sub-set). Callout [!quote], heading, lista, blockquote, parágrafo, inline.
  function inline(s){
    return esc(s)
      .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,function(_,t,l){return '<a href="?e='+encodeURIComponent(t.trim())+'">'+esc((l||t).trim())+'</a>';})
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g,function(_,t,u){var ext=/^https?:/.test(u);return '<a href="'+esc(u)+'"'+(ext?' target="_blank" rel="noopener"':'')+'>'+esc(t)+'</a>';})
      .replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>").replace(/\*([^*\n]+)\*/g,"<em>$1</em>");
  }
  // poemas: preserva quebras de linha. Estrofes separadas por linha em branco.
  function renderPoem(body){
    return body.replace(/^---\n[\s\S]*?\n---\n?/, "").trim().split(/\n\s*\n/).map(function(st){
      return '<p class="stanza">'+st.split("\n").map(function(l){return inline(l);}).join("<br>")+'</p>';
    }).join("\n");
  }
  // renderiza o corpo; resolve ![[slug]] de forma assíncrona (transclusão)
  function renderBody(body){
    var lines=body.split("\n"),out=[],i=0,embeds=[];
    while(i<lines.length){
      var ln=lines[i];
      var cq=ln.match(/^>\s*\[!(\w+)\]\s*(.*)$/);
      if(cq){var title=cq[2].trim(),buf=[];i++;while(i<lines.length&&/^>/.test(lines[i])){buf.push(lines[i].replace(/^>\s?/,""));i++;}
        out.push('<div class="callout">'+(title?'<div class="ttl">'+inline(title)+'</div>':'')+'<div class="q">'+esc(buf.join("\n"))+'</div></div>');continue;}
      if(/^>/.test(ln)){var b=[];while(i<lines.length&&/^>/.test(lines[i])){b.push(lines[i].replace(/^>\s?/,""));i++;}out.push('<blockquote>'+inline(b.join(" "))+'</blockquote>');continue;}
      var em=ln.match(/^!\[\[([^\]]+)\]\]\s*$/);
      if(em){var key="__EMB"+embeds.length+"__";embeds.push(em[1].trim());out.push(key);i++;continue;}
      var h=ln.match(/^(#{1,3})\s+(.*)$/);
      if(h){out.push("<h"+h[1].length+">"+inline(h[2])+"</h"+h[1].length+">");i++;continue;}
      if(/^---+\s*$/.test(ln)){out.push("<hr>");i++;continue;}                       // regra horizontal
      if(/^\s*-\s+/.test(ln)){var items=[];while(i<lines.length&&/^\s*-\s+/.test(lines[i])){items.push("<li>"+inline(lines[i].replace(/^\s*-\s+/,""))+"</li>");i++;}out.push("<ul>"+items.join("")+"</ul>");continue;}
      // tabela GFM: linha | a | b | seguida de separador | --- | --- |
      if(/^\|.*\|\s*$/.test(ln)&&i+1<lines.length&&/^\|[\s:|-]+\|\s*$/.test(lines[i+1])){
        var hdr=ln,rws=[];i+=2;
        while(i<lines.length&&/^\|.*\|\s*$/.test(lines[i])){rws.push(lines[i]);i++;}
        var cels=function(r){return r.replace(/^\s*\||\|\s*$/g,"").split("|").map(function(c){return inline(c.trim());});};
        var thead="<tr>"+cels(hdr).map(function(c){return "<th>"+c+"</th>";}).join("")+"</tr>";
        var tbody=rws.map(function(r){return "<tr>"+cels(r).map(function(c){return "<td>"+c+"</td>";}).join("")+"</tr>";}).join("");
        out.push('<table class="tbl"><thead>'+thead+"</thead><tbody>"+tbody+"</tbody></table>");continue;
      }
      if(ln.trim()===""){i++;continue;}
      var para=[lines[i]];i++;                                                        // consome a linha atual (evita loop em '-')
      while(i<lines.length&&lines[i].trim()!==""&&!/^>|^#{1,3}\s|^!\[\[|^---+\s*$|^\s*-\s+/.test(lines[i])){para.push(lines[i]);i++;}
      out.push("<p>"+inline(para.join(" "))+"</p>");
    }
    return { html: out.join("\n"), embeds: embeds };
  }

  function fetchBody(path){
    return fetch(path,{cache:"no-cache"}).then(function(r){return r.ok?r.text():"";}).then(function(t){
      var m=t.match(/^---\n[\s\S]*?\n---\n?([\s\S]*)$/);return m?m[1]:t;});
  }

  // ── seleção por idioma com fallback dentro do grupo `tkey` ──
  // agrupa entries por tkey; escolhe a variante no idioma atual, senão a primeira (fallback).
  function langSelect(list){
    var groups = {}, order = [];
    list.forEach(function(e){ var k=e.tkey||e.slug; if(!groups[k]){groups[k]=[];order.push(k);} groups[k].push(e); });
    return order.map(function(k){
      var g = groups[k];
      var hit = g.filter(function(e){ return e.lang===LANG; })[0];
      return hit || g[0];                       // fallback: mostra o que existir
    });
  }
  // resolve uma entry para a variante no idioma atual (nav/links profundos/transclusão)
  function resolveLang(e){
    if(!e) return e;
    var sibs = DATA.filter(function(x){ return (x.tkey||x.slug)===(e.tkey||e.slug); });
    return sibs.filter(function(x){ return x.lang===LANG; })[0] || e;
  }

  // ── view de uma entrada ──
  function renderEntry(slug){
    var e=resolveLang(BY[slug]);
    if(!e){APP.innerHTML='<p class="empty">'+L().notfound+' <a href="?">'+L().index+'</a></p>';return;}
    fetchBody(e.path).then(function(body){
      if(e.type==="poem"){
        var pm=[]; pm.push(e.type); if(e.author)pm.push(e.author); if(e.created)pm.push(e.created);
        APP.innerHTML='<article class="entry poem"><div class="crumb"><a href="?">'+L().index+'</a></div>'+
          '<div class="meta">'+pm.map(esc).join('<span>·</span> ')+'</div>'+
          '<h1 class="title">'+esc(e.title)+'</h1>'+
          '<div class="body poembody">'+renderPoem(body)+'</div></article>';
        document.title=e.title+" — Yuri";
        return;
      }
      var r=renderBody(body);
      // resolve transclusões
      Promise.all(r.embeds.map(function(s){var t=resolveLang(BY[s]);if(!t)return Promise.resolve('<div class="embed">'+esc(s)+' (não encontrada)</div>');
        return fetchBody(t.path).then(function(b){var rr=renderBody(b);return '<div class="embed"><div class="eh"><a href="?e='+encodeURIComponent(t.slug)+'">'+esc(t.title)+(t.author?" — "+esc(t.author):"")+' ↗</a></div>'+mediaHtml(t.media)+rr.html+'</div>';});
      })).then(function(rendered){
        var html=r.html;rendered.forEach(function(h,idx){html=html.replace("__EMB"+idx+"__",h);});
        var meta=[];meta.push(typeLabel(e.type));if(e.category)meta.push(L().cat+": "+catLabel(e.category));if(e.author)meta.push(e.author);
        if(e.created)meta.push(e.created);if(e.added&&e.added!==e.created)meta.push("add "+e.added);
        if(e.type==="nota"&&(e.caderno||e.pagina!=null))meta.push("caderno "+(e.caderno||"?")+(e.pagina!=null?" · p."+e.pagina:""));
        // portfolio: as duas linhas do tempo vivas acima do texto (banner Hostinger vive em /yuri/hostinger/)
        // tabs (padrão) ou empilhado A/B (?layout=stacked ou window.YURI_STACKED) — duas linhas de uma vez
        // rodapé "Relacionados": liga peças da mesma linha de trabalho (campo related = tkeys)
        var relMap={};DATA.forEach(function(x){if(!relMap[x.tkey])relMap[x.tkey]=x;});
        var relHtml="";
        if(e.related&&e.related.length){
          var rl=e.related.map(function(tkk){var t=resolveLang(relMap[tkk]);return t?'<a href="?e='+encodeURIComponent(t.slug)+'">'+esc(t.title)+'</a>':'';}).filter(Boolean).join("");
          if(rl)relHtml='<nav class="related"><span class="rl">'+(LANG==="pt-BR"?"Relacionados":"Related")+'</span>'+rl+'</nav>';
        }
        var graph="", ghlinks="", stacked=false;
        if(e.type==="portfolio"){
          stacked = (new URL(location.href).searchParams.get("layout")==="stacked") || window.YURI_STACKED===true;
          graph = '<div class="relgraph" id="relgraph"></div>';   // grafo único: carreira (âncoras) + peças + relações
          // dois GitHubs no topo, reforçando o split: pessoal (Dados) · rede (Sistemas/Web)
          var gl=(LANG==="pt-BR")
            ? {lead:"github:", me:"(eu · Dados)", net:"(a rede · Sistemas)"}
            : {lead:"github:", me:"(me · Data)", net:"(the network · Systems)"};
          ghlinks='<div class="gh-links">'+
            '<span class="gh-lead">'+esc(gl.lead)+'</span>'+
            '<a class="gh-link gh-me" href="https://github.com/yurisugano" target="_blank" rel="noopener">yurisugano <span>'+esc(gl.me)+'</span></a>'+
            '<span class="gh-sep">·</span>'+
            '<a class="gh-link gh-net" href="https://github.com/artelonga" target="_blank" rel="noopener">artelonga <span>'+esc(gl.net)+'</span></a>'+
            '</div>';
        }
        APP.innerHTML='<article class="entry"><div class="crumb"><a href="?">'+L().index+'</a></div>'+
          '<div class="meta">'+meta.map(esc).join('<span>·</span> ')+'</div>'+
          '<h1 class="title">'+esc(e.title)+'</h1>'+
          (e.abstract?'<div class="abstract">'+inline(e.abstract)+'</div>':(e.significance?'<p class="sig">'+esc(e.significance)+'</p>':''))+
          (e.tech&&e.tech.length?'<div class="techtags">'+e.tech.map(function(t){return '<span class="tt">'+esc(t)+'</span>';}).join("")+'</div>':'')+
          ghlinks+graph+mediaHtml(e.media)+'<div class="body">'+html+'</div>'+relHtml+'</article>';
        document.title=e.title+" — Yuri";
        if(e.type==="portfolio"&&window.RelationsGraph){var rg=document.getElementById("relgraph");if(rg)window.RelationsGraph.mount(rg,{lang:LANG});}
      });
    });
  }

  // ── índice + filtros (duas seções: técnico / criativo) ──
  var state={type:null,category:null,author:null,q:"",tech:{}};
  // grupos de tech-stack: o grupo aparece colapsado (ex.: "AWS"); clicar seleciona todos os
  // serviços presentes; o ▸ expande pra escolher um ou poucos. Só mostra membros presentes nos dados.
  var TECH_GROUPS={};   // serviços AWS saíram do filtro da home → agora no hover do nó AWS no grafo
  var techExpanded={};
  var techLabel=(LANG==="pt-BR")?"stack":"stack";
  function uniqTech(){var s={};visible().forEach(function(e){(e.tech||[]).forEach(function(t){if(t)s[t]=1;});});return Object.keys(s).sort();}
  function techSelected(){return Object.keys(state.tech);}
  // ordem do índice: ?sort=pop (importância curada, campo pop) | ?sort=random (estável na sessão) | default (data desc)
  var SORT=(new URL(location.href)).searchParams.get("sort");
  var RAND={};
  function randRank(e){var k=e.slug;if(RAND[k]==null)RAND[k]=Math.random();return RAND[k];}
  function byDateDesc(a,b){return String(b.added||b.date||b.created||"").localeCompare(String(a.added||a.date||a.created||""));}
  function sortMode(arr){
    if(SORT==="random")return arr.slice().sort(function(a,b){return randRank(a)-randRank(b);});
    if(SORT==="date")return arr.slice().sort(byDateDesc);  // ordem antiga (data desc)
    return arr.slice().sort(function(a,b){return (b.pop||0)-(a.pop||0)||byDateDesc(a,b);});  // padrão: popularidade
  }
  function visible(){ return langSelect(DATA); }   // base já reduzida ao idioma (com fallback)
  function uniq(key){var s={};visible().forEach(function(e){var v=e[key];if(v)s[v]=1;});return Object.keys(s).sort();}
  // autores CANÔNICOS presentes (resolve variantes via neuro/authors.js: yuri =
  // "Vieira Sugano" = "Yuri"). Sem authors.js, cai pros strings crus.
  function authorList(){
    if(!window.NeuroAuthors)return uniq("author").map(function(a){return {id:a,label:a};});
    var seen={},out=[];
    visible().forEach(function(e){ if(!e.author)return;
      e.author.split(/,|;|&| e | and |\bet al\.?/i).map(function(x){return x.trim();}).filter(Boolean).forEach(function(frag){
        var id=window.NeuroAuthors.resolve(frag); if(!id||seen[id])return; seen[id]=1;
        var disp=window.NeuroAuthors.displayOf(id); out.push({id:id,label:(disp&&disp!==id)?disp:frag});
      });
    });
    return out.sort(function(a,b){return a.label<b.label?-1:1;});
  }
  function matches(e){
    if(state.type&&e.type!==state.type)return false;
    if(state.category&&e.category!==state.category)return false;
    if(state.author){ if(window.NeuroAuthors){ if(!window.NeuroAuthors.match(e.author||"",state.author))return false; } else if(e.author!==state.author)return false; }
    var tk=techSelected();
    if(tk.length){var et=e.tech||[];if(!tk.some(function(t){return et.indexOf(t)>=0;}))return false;}
    if(state.q){var hay=(e.title+" "+(e.author||"")+" "+(e.snippet||"")+" "+(e.tags||[]).join(" ")+" "+(e.tech||[]).join(" ")).toLowerCase();if(hay.indexOf(state.q.toLowerCase())===-1)return false;}
    return true;
  }
  function chip(label,active,on){var b=document.createElement("button");b.className="chip"+(active?" on":"")+(on==="cat"?" cat":"");b.textContent=label;return b;}
  function cardHtml(e){
    var mk=(e.media||[]).map(function(m){return '<span>'+esc(linkTitle(m))+'</span>';}).join("");
    return '<a class="card" href="?e='+encodeURIComponent(e.slug)+'">'+
      '<div class="ct"><span class="t">'+esc(typeLabel(e.type))+'</span>'+(e.category?'<span class="cat">'+esc(catLabel(e.category))+'</span>':'')+'</div>'+
      '<h3>'+esc(e.title)+'</h3>'+
      (e.author?'<div class="by">'+esc(e.author)+(e.created?" · "+esc(e.created):"")+'</div>':(e.date?'<div class="by">'+esc(e.date)+'</div>':''))+
      (e.significance?'<div class="sig">'+esc(e.significance)+'</div>':'')+
      (e.snippet?'<div class="snip">'+esc(e.snippet)+'</div>':'')+
      (mk?'<div class="mk">'+mk+'</div>':'')+'</a>';
  }
  function renderIndex(){
    APP.innerHTML="";
    var intro=document.createElement("section");intro.className="intro";
    intro.innerHTML='<p class="introtxt">'+esc(L().intro)+'</p>';
    APP.appendChild(intro);
    var f=document.createElement("div");f.className="filters";
    var cats=uniq("category");
    if(cats.length){var cg=document.createElement("div");cg.className="grp";cg.innerHTML='<span class="flabel">'+esc(L().cat)+'</span>';
      cats.forEach(function(c){var b=chip(catLabel(c),state.category===c,"cat");b.onclick=function(){state.category=state.category===c?null:c;renderList();};cg.appendChild(b);});f.appendChild(cg);}
    // tech-stack: grupo (AWS) colapsado → clicar seleciona tudo; ▸ expande p/ escolher um ou poucos
    var techAll=uniqTech();
    if(techAll.length){
      var th=document.createElement("div");th.className="grp grp-tech";th.innerHTML='<span class="flabel">'+esc(techLabel)+'</span>';
      var grouped={};
      Object.keys(TECH_GROUPS).forEach(function(g){
        var mem=TECH_GROUPS[g].filter(function(t){return techAll.indexOf(t)>=0;});
        if(!mem.length)return; mem.forEach(function(t){grouped[t]=1;});
        var wrap=document.createElement("span");wrap.className="techgroup"+(techExpanded[g]?" open":"");
        var allSel=mem.every(function(t){return state.tech[t];});
        var pb=chip(g+" ("+mem.length+")",allSel);pb.classList.add("parent");
        pb.onclick=function(){var on=mem.every(function(t){return state.tech[t];});mem.forEach(function(t){if(on)delete state.tech[t];else state.tech[t]=1;});renderIndex();};
        var ex=document.createElement("button");ex.type="button";ex.className="techexp";ex.textContent=techExpanded[g]?"▾":"▸";
        ex.onclick=function(){techExpanded[g]=!techExpanded[g];renderIndex();};
        wrap.appendChild(pb);wrap.appendChild(ex);
        if(techExpanded[g])mem.forEach(function(t){var cb=chip(t,!!state.tech[t]);cb.classList.add("child");cb.onclick=function(){if(state.tech[t])delete state.tech[t];else state.tech[t]=1;renderIndex();};wrap.appendChild(cb);});
        th.appendChild(wrap);
      });
      techAll.filter(function(t){return !grouped[t];}).forEach(function(t){var cb=chip(t,!!state.tech[t]);cb.classList.add("tech");cb.onclick=function(){if(state.tech[t])delete state.tech[t];else state.tech[t]=1;renderIndex();};th.appendChild(cb);});
      f.appendChild(th);
    }
    var types=uniq("type");var tg=document.createElement("div");tg.className="grp";tg.innerHTML='<span class="flabel">'+esc(L().type)+'</span>';
    types.forEach(function(t){var b=chip(typeLabel(t),state.type===t);b.onclick=function(){state.type=state.type===t?null:t;renderList();};tg.appendChild(b);});f.appendChild(tg);
    var authors=authorList();if(authors.length){var ag=document.createElement("div");ag.className="grp";ag.innerHTML='<span class="flabel">'+esc(L().author)+'</span>';
      authors.forEach(function(a){var b=chip(a.label,state.author===a.id);b.onclick=function(){state.author=state.author===a.id?null:a.id;renderList();};ag.appendChild(b);});f.appendChild(ag);}
    var q=document.createElement("input");q.className="q";q.placeholder=L().search;q.value=state.q;q.oninput=function(){state.q=q.value;renderList();};f.appendChild(q);
    APP.appendChild(f);
    var sections=document.createElement("div");sections.className="sections";APP.appendChild(sections);
    function renderList(){
      var l=visible().filter(matches);
      sections.innerHTML="";
      [["systems",L().systems],["creative",L().creative]].forEach(function(pair){
        var group=sortMode(l.filter(function(e){return (e.kind||"creative")===pair[0];}));
        if(!group.length)return;
        var sec=document.createElement("section");sec.className="section section-"+pair[0];
        sec.innerHTML='<h2 class="kind">'+esc(pair[1])+' <span class="n">'+L().count(group.length)+'</span></h2>'+
          '<div class="grid">'+group.map(cardHtml).join("")+'</div>';
        sections.appendChild(sec);
      });
      if(!sections.children.length){sections.innerHTML='<div class="empty">'+L().empty+'</div>';}
    }
    renderList();
  }

  function route(){
    var u=new URL(location.href);
    var e=u.searchParams.get("e");
    if(!e){var seg=location.pathname.split("/").filter(Boolean).pop();if(seg&&BY[seg])e=seg;}  // /2026-05-31 quando houver fallback
    if(e&&BY[e])renderEntry(e);else renderIndex();  // home = índice (layout artelonga); o portfólio fica linkado no topnav
  }

  // ── fonte de conteúdo (CO-merge) ──────────────────────────────────────────
  // Fonte da verdade futura: o universo yuri no co (vault Obsidian → co). Por ora,
  // tenta o co (entries publicadas) e, em qualquer falha (401/CORS/rede), cai no
  // estático /yuri/entries.json. Quando o co expor anon-published + CORS, ativa só.
  var CO_ENTRIES = "https://co.artelonga.com.br/api/v1/universes/yuri/entries?published=true";
  function mapCo(payload){                      // best-effort: aceita {entries:[]} ou []
    var arr = Array.isArray(payload) ? payload : (payload && payload.entries) || [];
    return arr.map(function(e){
      if(!e || !(e.slug || e.id)) return null;
      return { slug:e.slug||e.id, type:e.type||"ref", kind:e.kind||"creative",
        lang:e.lang||"pt-BR", tkey:e.tkey||e.slug||e.id, category:e.category||null,
        title:e.title||e.titulo||e.slug, author:e.author||e.autor||null,
        created:e.created||null, added:e.added||e.date||null, date:e.date||null,
        tags:e.tags||[], media:e.media||[], snippet:e.snippet||"",
        path:e.path||null, body:e.body||null, _co:true };
    }).filter(Boolean);
  }
  var CO_ENABLED = false;   // ligar quando o co expor anon-published + CORS (evita erro CORS no console até lá)
  function loadEntries(){
    var staticP = fetch("/yuri/entries.json",{cache:"no-cache"}).then(function(r){return r.json();}).then(function(d){return d.entries||[];});
    if(!CO_ENABLED) return staticP;
    return staticP.then(function(base){
      return fetch(CO_ENTRIES,{mode:"cors"}).then(function(r){return r.ok?r.json():null;}).then(function(co){
        var ce = co ? mapCo(co) : [];
        if(!ce.length) return base;
        var bySlug={}; base.forEach(function(e){bySlug[e.slug]=e;});       // co acrescenta/atualiza por slug
        ce.forEach(function(e){bySlug[e.slug]=e;});
        return Object.keys(bySlug).map(function(k){return bySlug[k];});
      }).catch(function(){ return base; });                                 // co indisponível → estático
    });
  }

  document.addEventListener("DOMContentLoaded",function(){
    APP=document.getElementById("app");
    // Superfície standalone (yuri.artelonga.com.br) serve só /yuri/* — qualquer link
    // root-relative pra outra seção (/parceiros/, /comunidades/…) 404a. Reescreve esses
    // pra URL absoluta de artelonga.com.br (preserva #fragment). No site principal, no-op.
    if(location.hostname!=="artelonga.com.br"){
      var absify=function(){
        var as=APP.querySelectorAll('a[href^="/"]:not([href^="/yuri/"])');
        for(var i=0;i<as.length;i++){
          var h=as[i].getAttribute("href");
          if(/^\/\//.test(h))continue;                         // protocol-relative: deixa
          as[i].setAttribute("href","https://artelonga.com.br"+h);
        }
      };
      new MutationObserver(absify).observe(APP,{childList:true,subtree:true});
    }
    applyChrome();
    loadEntries().then(function(entries){
      DATA=entries;DATA.forEach(function(e){BY[e.slug]=e;});route();
    }).catch(function(){APP.innerHTML='<p class="empty">'+L().loadfail+'</p>';});
  });
})();
