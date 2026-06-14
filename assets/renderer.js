(function() {
  "use strict";
  const pageMap = {
    home: () => Promise.resolve().then(() => home),
    parceiros: () => Promise.resolve().then(() => parceiros),
    servicos: () => Promise.resolve().then(() => servicos),
    solucoes: () => Promise.resolve().then(() => solucoes),
    recursos: () => Promise.resolve().then(() => recursos),
    infra: () => Promise.resolve().then(() => infra),
    profile: () => Promise.resolve().then(() => profile),
    service: () => Promise.resolve().then(() => service),
    poem: () => Promise.resolve().then(() => poem),
    essay: () => Promise.resolve().then(() => essay),
    contato: () => Promise.resolve().then(() => contato),
    entrar: () => Promise.resolve().then(() => entrar),
    "faca-parte": () => Promise.resolve().then(() => facaParte)
  };
  function dispatch() {
    const page = document.body.dataset["page"];
    const fn = page !== void 0 ? pageMap[page] : void 0;
    if (!fn) {
      if (page !== void 0) console.warn(`No renderer for page: ${page}`);
      return;
    }
    void (async () => {
      try {
        const mod = await fn();
        mod.render();
      } catch (e) {
        console.error("render falhou:", e);
        document.body.innerHTML = `<main class="main"><p>Algo quebrou. <a href="/">voltar</a></p></main>`;
      }
    })();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", dispatch);
  } else {
    dispatch();
  }
  const ESC_MAP = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  };
  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ESC_MAP[c] ?? c);
  }
  function norm(s) {
    return String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }
  const ANGLICISM_MAP = {
    cloud: ["nuvem"],
    web: ["site", "página", "pagina", "internet"],
    software: ["sistema", "programa"],
    data: ["dados"],
    database: ["banco", "dados"],
    storage: ["armazenamento"],
    network: ["rede", "redes"],
    hardware: ["máquina", "maquina", "computador"],
    security: ["segurança", "seguranca"],
    privacy: ["privacidade"],
    design: ["design"],
    marketing: ["marketing"],
    branding: ["marca"],
    ux: ["experiência", "experiencia", "usuário", "usuario"],
    ui: ["interface"],
    api: ["api", "integração", "integracao"],
    dev: ["desenvolvimento", "desenvolvedor"],
    developer: ["desenvolvedor", "desenvolvimento"],
    code: ["código", "codigo", "desenvolvimento"],
    frontend: ["front", "interface", "web"],
    backend: ["back", "api", "servidor"],
    fullstack: ["desenvolvimento"],
    saas: ["software", "sistema", "nuvem"],
    ai: ["inteligência", "inteligencia", "ia"],
    ml: ["inteligência", "inteligencia", "ia"],
    analytics: ["análise", "analise", "dados"],
    audit: ["auditoria"],
    consulting: ["consultoria"],
    automation: ["automação", "automacao"],
    drone: ["drone", "piloto"],
    photography: ["fotografia", "foto"],
    video: ["vídeo", "video", "filmagem"],
    music: ["música", "musica", "produção"],
    event: ["evento", "festa"],
    wedding: ["casamento", "evento"],
    burger: ["hambúrguer", "hamburguer"],
    food: ["alimentação", "alimentacao", "comida"],
    yoga: ["yoga"],
    meditation: ["meditação", "meditacao"],
    therapy: ["terapia", "psicologia"],
    counseling: ["psicologia", "terapia"],
    psychology: ["psicologia"],
    nutrition: ["nutrição", "nutricao", "nutricional"],
    elder: ["idoso", "cuidado"],
    elderly: ["idoso", "cuidado"],
    school: ["ensino", "escolar"],
    tutoring: ["reforço", "reforco", "ensino"],
    education: ["educação", "educacao", "ensino"],
    translate: ["tradução", "traducao"],
    translation: ["tradução", "traducao"],
    writing: ["escrita"],
    content: ["conteúdo", "conteudo"],
    fashion: ["moda", "stylist"],
    stylist: ["stylist", "moda"],
    drywall: ["drywall", "construção", "construcao"],
    construction: ["construção", "construcao"],
    agriculture: ["agro", "agrofloresta"],
    compost: ["compostagem"],
    art: ["arte", "artes"],
    graffiti: ["grafite"],
    mural: ["mural", "fachada"]
  };
  const CO_BASE$1 = "https://co.artelonga.com.br";
  function siteHeader() {
    return `<header class="site-header">
        <div class="site-header-inner">
            <a class="site-brand" href="/"><img src="/logo-al.png" alt="Arte Longa" width="58" height="36"></a>
            <div class="site-header-nav">
                <span id="al-header-auth"></span>
                <a class="site-cta-parceiros" href="/faca-parte/">Para parceiros →</a>
            </div>
        </div>
    </header>`;
  }
  async function initHeaderAuth() {
    var _a;
    const el = document.getElementById("al-header-auth");
    if (!el) return;
    try {
      const r = await fetch(`${CO_BASE$1}/api/v1/auth/me`, { credentials: "include" });
      if (r.ok) {
        const user = await r.json();
        const name = user.display_name || user.email || "você";
        el.innerHTML = `<span class="al-auth-greeting">Olá, ${esc(name)}</span><button class="al-auth-logout" type="button" id="al-logout-btn">Sair</button>`;
        (_a = document.getElementById("al-logout-btn")) == null ? void 0 : _a.addEventListener("click", async () => {
          await fetch(`${CO_BASE$1}/api/v1/auth/logout`, { method: "POST", credentials: "include" }).catch(() => {
          });
          window.location.reload();
        });
      } else {
        el.innerHTML = `<a class="site-cta-entrar" href="/entrar/">Entrar →</a>`;
      }
    } catch (_) {
      el.innerHTML = `<a class="site-cta-entrar" href="/entrar/">Entrar →</a>`;
    }
  }
  function siteFooter() {
    return `<footer class="site-footer">
        <div class="site-footer-inner">
            <a href="/parceiros/">Parceiros</a>
            <span class="sep" aria-hidden="true">·</span>
            <a href="/sobre/">Sobre</a>
            <span class="sep" aria-hidden="true">·</span>
            <a href="/proximos-passos/">Próximos passos</a>
        </div>
    </footer>`;
  }
  function ServiceCard(props) {
    var _a;
    const { service: s, respNames, faixa } = props;
    let precoHtml = "";
    if (faixa.planos) {
      precoHtml = `<ul class="market-card-planos">${faixa.planos.map((p) => {
        const cls = p.consult ? "is-consult" : "";
        return `<li class="${cls}">
                    <span class="plano-label">${esc(p.label)}</span>
                    <span class="plano-preco">${esc(p.preco)}</span>
                </li>`;
      }).join("")}</ul>`;
    } else if (faixa.preco) {
      const priceCls = faixa.consult ? "market-card-price is-consult" : "market-card-price";
      precoHtml = `<div class="${priceCls}">${esc(faixa.preco)}</div>` + (faixa.formula ? `<div class="market-card-formula">${esc(faixa.formula)}</div>` : "");
    }
    const childCount = ((_a = s.children) == null ? void 0 : _a.length) ?? 0;
    const childrenBadge = childCount ? ` <span class="market-card-children">+${childCount}</span>` : "";
    const onlineBadge = s.digital ? ` <span class="market-card-online">online</span>` : "";
    const titleHtml = `${esc(s.titulo)}${childrenBadge}${onlineBadge}`;
    return `
        <li class="market-card">
            <a href="/servicos/${esc(s.slug ?? "")}/" class="market-card-link">
                <div class="market-card-titulo">${titleHtml}</div>
                ${precoHtml}
                <div class="market-card-resp">${esc(respNames)}</div>
            </a>
        </li>`;
  }
  function FilterChip(props) {
    const { id, label, count, active } = props;
    const cls = active ? "sup-chip is-active" : "sup-chip";
    const pressed = active ? "true" : "false";
    return `<button type="button" class="${cls}" data-cat="${esc(id)}" aria-pressed="${pressed}">
        ${esc(label)} <span class="sup-count">${count}</span>
    </button>`;
  }
  function SearchInput(props) {
    const { id, name = "q", placeholder = "Buscar…" } = props;
    return `<form class="market-search" role="search" autocomplete="off"
          onsubmit="event.preventDefault(); return false;">
        <input type="search" name="${esc(name)}" id="${esc(id)}"
               placeholder="${esc(placeholder)}"
               autocomplete="off"
               aria-label="${esc(placeholder)}">
    </form>`;
  }
  function LocationInput(props) {
    const { estado, cidade, bairro } = props;
    return `<div class="market-loc">
        <span class="market-loc-field" id="loc-estado-wrap">
            <input type="text" id="loc-estado" class="market-loc-input is-default"
                   value="${esc(estado)}" autocomplete="off" spellcheck="false"
                   placeholder="Estado" aria-label="Estado"
                   aria-autocomplete="list" aria-controls="dd-estado" data-field="estado">
            <ul class="loc-dropdown" id="dd-estado" hidden role="listbox"></ul>
        </span>
        <span class="market-loc-field">
            <input type="text" id="loc-cidade" class="market-loc-input is-default"
                   value="${esc(cidade)}" autocomplete="off" spellcheck="false"
                   placeholder="Cidade" aria-label="Cidade"
                   aria-autocomplete="list" aria-controls="dd-cidade" data-field="cidade">
            <ul class="loc-dropdown" id="dd-cidade" hidden role="listbox"></ul>
        </span>
        <span class="market-loc-field">
            <input type="text" id="loc-bairro" class="market-loc-input is-default"
                   value="${esc(bairro)}" autocomplete="off" spellcheck="false"
                   placeholder="Bairro" aria-label="Bairro"
                   aria-autocomplete="list" aria-controls="dd-bairro" data-field="bairro">
            <ul class="loc-dropdown" id="dd-bairro" hidden role="listbox"></ul>
        </span>
    </div>
    <p class="market-loc-help">Clique pra editar.</p>`;
  }
  function EmptyState(props) {
    const { message, ctaHref, ctaLabel } = props;
    const cta = ctaHref && ctaLabel ? ` <a href="${esc(ctaHref)}">${esc(ctaLabel)}</a>` : "";
    return `<p class="market-empty"${" hidden"}>${esc(message)}${cta}</p>`;
  }
  const BASE_URL$1 = "https://artelonga.com.br";
  const OG_DEFAULT_IMAGE = `${BASE_URL$1}/assets/og-default.png`;
  function appendSeoEl(tag, attrs, text) {
    const el = document.createElement(tag);
    el.setAttribute("data-seo", "1");
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    if (text !== void 0) el.textContent = text;
    document.head.appendChild(el);
  }
  function setPageSEO(opts) {
    const { title, description, url, ogImage = OG_DEFAULT_IMAGE, ogType = "website", jsonLd } = opts;
    const canonical = url.startsWith("http") ? url : `${BASE_URL$1}${url}`;
    document.head.querySelectorAll("[data-seo]").forEach((el) => el.remove());
    appendSeoEl("link", { rel: "canonical", href: canonical });
    const og = [
      ["og:title", title],
      ["og:url", canonical],
      ["og:type", ogType],
      ["og:image", ogImage],
      ["og:site_name", "Arte Longa"]
    ];
    if (description) og.push(["og:description", description]);
    for (const [property, content] of og) {
      appendSeoEl("meta", { property, content });
    }
    if (description) {
      appendSeoEl("meta", { name: "description", content: description });
    }
    const tw = [
      ["twitter:card", "summary_large_image"],
      ["twitter:title", title],
      ["twitter:image", ogImage]
    ];
    if (description) tw.push(["twitter:description", description]);
    for (const [name, content] of tw) {
      appendSeoEl("meta", { name, content });
    }
    if (jsonLd) {
      const schemas = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      for (const schema of schemas) {
        appendSeoEl("script", { type: "application/ld+json" }, JSON.stringify(schema));
      }
    }
  }
  const SUPERCATS = [
    { id: "eventos", label: "Eventos", titles: [
      "Filmagem de Festas e Eventos",
      "Fotografia",
      "Produção Musical",
      "Alimentação e Bebidas",
      "Hambúrguer Artesanal",
      "Piloto de Drone",
      "Atriz",
      "Cantora",
      "Modelo",
      "Dança e Expressão Corporal",
      "Artes Visuais",
      "Criação de Conteúdo",
      "Comunicação Visual",
      "Produção de Desfile",
      "Produção de Eventos"
    ] },
    { id: "digital", label: "Digital", titles: [
      "Inteligência e Tecnologia",
      "Desenvolvimento Web",
      "Desenvolvimento de Software",
      "Desenvolvimento de API",
      "Automação de Processos",
      "Privacidade e Segurança",
      "Comunicação Visual",
      "Marketing Digital",
      "Tráfego e Crescimento",
      "Design",
      "Experiência de Usuário (UI/UX)",
      "Criação de Conteúdo",
      "Consultoria em TI",
      "Nuvem",
      "Computação",
      "Dados e Armazenamento",
      "Hardware",
      "Sistemas Operacionais",
      "Redes"
    ] },
    { id: "educacao", label: "Educação", titles: [
      "Alfabetização",
      "Reforço Escolar",
      "Ensino, Formação e Liderança",
      "Mentoria Espiritual",
      "Educação Ambiental",
      "Tradução"
    ] },
    { id: "bem-estar", label: "Bem-estar", titles: [
      "Acompanhamento Nutricional",
      "Saúde Mental",
      "Terapia Comportamental",
      "Meditação",
      "Autocuidado",
      "Cuidado com o Idoso"
    ] },
    { id: "casa", label: "Casa", titles: [
      "Drywall e Bioconstrução",
      "Murais e Fachadas",
      "Grafite",
      "Agrofloresta",
      "Compostagem"
    ] },
    { id: "gestao", label: "Gestão", titles: [
      "Gestão Executiva",
      "Gestão Operacional",
      "Gestão de Logística",
      "Gestão de Vendas",
      "Gestão Contábil",
      "Gestão Fiscal",
      "Gestão Financeira",
      "Gestão Administrativa",
      "Consultoria Jurídica",
      "Auditoria",
      "Marketing Digital",
      "Design",
      "Tecnologia",
      "Inteligência e Tecnologia",
      "Inteligência de Previsão",
      "Automação de Processos",
      "Conexões",
      "Rede de Parcerias",
      "Rede de Talentos"
    ] },
    { id: "negocios", label: "Negócios", titles: [
      "Gestão Administrativa",
      "Gestão Contábil",
      "Gestão Executiva",
      "Gestão Financeira",
      "Gestão Fiscal",
      "Gestão Operacional",
      "Auditoria",
      "Automação de Processos",
      "Consultoria Jurídica",
      "Consultoria em Moda",
      "Rede de Parcerias",
      "Rede de Talentos",
      "Conexões",
      "Inteligência de Previsão",
      "Market Making Preditivo"
    ] },
    { id: "alimentacao", label: "Alimentação", titles: [
      "Alimentação e Bebidas",
      "Hambúrguer Artesanal",
      "Tortas Salgadas da Veh"
    ] },
    { id: "audiovisual", label: "Audiovisual", titles: [
      "Fotografia",
      "Piloto de Drone",
      "Produção Musical",
      "Filmagem de Festas e Eventos",
      "Escrita, Interpretação e Tradução",
      "Tradução",
      "Atriz",
      "Cantora",
      "Modelo",
      "Criação de Conteúdo",
      "Poeta"
    ] }
  ];
  const BASE_URL = "https://artelonga.com.br";
  async function render$c() {
    setPageSEO({
      title: "Arte Longa — Semeando Sonhos",
      description: "Arte Longa — agência de gestão de carreira, marca e produto, tecnologia e comunicação.",
      url: "/",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Arte Longa",
          "url": BASE_URL
        },
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "Arte Longa",
          "url": BASE_URL,
          "logo": OG_DEFAULT_IMAGE,
          "description": "Arte Longa — agência de gestão de carreira, marca e produto, tecnologia e comunicação."
        }
      ]
    });
    const AL = window.AL;
    const servicos2 = AL.publicServices();
    const handleToNome = Object.fromEntries(
      [...AL.people, ...AL.communities].map((e) => [e.handle, e.nome])
    );
    const respNames = (handles) => (handles ?? []).map((h) => handleToNome[h] ?? h).join(", ");
    const popularity = await fetch("/assets/popularity.json").then((r) => r.ok ? r.json() : { items: [] }).catch(() => ({ items: [] }));
    const byPath = new Map(
      (popularity.items ?? []).map((i) => [i.path, i.views])
    );
    const topo = servicos2.filter((s) => !s.parent).sort((a, b) => {
      const va = byPath.get(`/servicos/${a.slug}/`) ?? 0;
      const vb = byPath.get(`/servicos/${b.slug}/`) ?? 0;
      if (va !== vb) return vb - va;
      return a.titulo.localeCompare(b.titulo, "pt-BR");
    });
    const byTitulo = new Map(servicos2.map((s) => [s.titulo, s]));
    const indexed = servicos2.map((s) => ({
      s,
      blob: norm([s.titulo, s.parent ?? "", respNames(s.responsavel)].join(" "))
    }));
    const cats = SUPERCATS.map((c) => ({
      ...c,
      items: c.titles.map((t) => byTitulo.get(t)).filter((s) => s !== void 0)
    })).filter((c) => c.items.length);
    const locOpts = AL.locationSuggestions();
    const defLoc = AL.DEFAULT_LOCATION;
    let activeFilters = { estado: defLoc.estado, cidade: defLoc.cidade, bairro: defLoc.bairro };
    let touchedFields = { estado: false, cidade: false, bairro: false };
    document.body.innerHTML = `
        ${siteHeader()}
        <main class="main market-main">
            <section class="market-hero">
                <h1 class="market-h1">Serviços</h1>
                <p class="market-sub">Profissionais e produtos da rede, conectados ao que você precisa.</p>

                ${SearchInput({ id: "market-q", name: "q", placeholder: "Descreva o que precisa…" })}

                ${LocationInput({ estado: defLoc.estado, cidade: defLoc.cidade, bairro: defLoc.bairro })}
            </section>

            <div class="sup-cats" id="sup-cats">
                ${FilterChip({ id: "", label: "Todos", count: topo.length, active: true })}
                ${cats.map((c) => FilterChip({ id: c.id, label: c.label, count: c.items.length })).join("")}
            </div>

            <div class="market-toggle">
                <label class="toggle-chip">
                    <input type="checkbox" id="al-only">
                    <span>Prestados pela Arte Longa</span>
                </label>
            </div>

            <div class="market-count" id="market-count"></div>
            <ul class="market-grid" id="market-grid"></ul>

            ${EmptyState({
      message: "Nenhum resultado por aqui.",
      ctaHref: "/contato/",
      ctaLabel: "Entre em contato para encontrarmos uma solução →"
    })}

            <p class="market-all"><a href="/servicos/">Rede completa →</a></p>
        </main>
        ${siteFooter()}
    `;
    const input = document.getElementById("market-q");
    const grid = document.getElementById("market-grid");
    const count = document.getElementById("market-count");
    const emptyEl = document.querySelector(".market-empty");
    const chipsBox = document.getElementById("sup-cats");
    const alOnly = document.getElementById("al-only");
    const locFields = {};
    for (const f of ["estado", "cidade", "bairro"]) {
      const el = document.getElementById("loc-" + f);
      if (el) locFields[f] = el;
    }
    let activeCat = "";
    let locDebounce;
    const locOptsByField = {
      estado: locOpts.estados,
      cidade: locOpts.cidades,
      bairro: locOpts.bairros
    };
    function normLoc(s) {
      return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
    }
    function renderDropdown(field) {
      const el = locFields[field];
      const dd = document.getElementById("dd-" + field);
      if (!el || !dd) return;
      const q = normLoc(el.value);
      const opts = locOptsByField[field] ?? [];
      const list = opts.filter((v) => !q || normLoc(v).includes(q));
      if (!list.length) {
        dd.hidden = true;
        dd.innerHTML = "";
        return;
      }
      dd.innerHTML = list.map((v) => `<li role="option" data-val="${esc(v)}">${esc(v)}</li>`).join("");
      dd.hidden = false;
    }
    function closeAllDropdowns() {
      document.querySelectorAll(".loc-dropdown").forEach((d) => {
        d.hidden = true;
      });
    }
    function locFilter(list) {
      return list.filter((s) => {
        if (s.digital) return true;
        return (s.responsavel ?? []).some((h) => {
          if (AL.isInactive(h)) return false;
          return AL.locationMatches(h, activeFilters);
        });
      });
    }
    function alOnlyFilter(list) {
      if (!(alOnly == null ? void 0 : alOnly.checked)) return list;
      return list.filter(
        (s) => (s.responsavel ?? []).some((h) => !AL.isInactive(h) && AL.isSocio(h))
      );
    }
    function applyFilter() {
      const q = norm(input.value.trim());
      const tokens = q ? q.split(/\s+/).filter(Boolean) : [];
      let list;
      if (tokens.length) {
        list = indexed.filter(
          ({ blob }) => tokens.every((t) => {
            if (blob.includes(t)) return true;
            const syns = ANGLICISM_MAP[t];
            return syns ? syns.some((s) => blob.includes(s)) : false;
          })
        ).map((x) => x.s);
      } else if (activeCat) {
        const cat = cats.find((c) => c.id === activeCat);
        list = cat ? cat.items : [];
      } else {
        list = topo;
      }
      list = locFilter(list);
      list = alOnlyFilter(list);
      grid.innerHTML = list.map((s) => ServiceCard({ service: s, respNames: respNames(s.responsavel), faixa: AL.computeFaixaPreco(s) })).join("");
      const inputVal = input.value.trim();
      if (tokens.length) {
        count.textContent = `${list.length} resultado${list.length === 1 ? "" : "s"} para "${inputVal}"`;
      } else if (activeCat) {
        const cat = cats.find((c) => c.id === activeCat);
        count.textContent = `${list.length} em ${(cat == null ? void 0 : cat.label) ?? activeCat}`;
      } else {
        count.textContent = `${list.length} serviços`;
      }
      if (emptyEl) emptyEl.hidden = list.length !== 0;
      const matching = tokens.length ? new Set(
        indexed.filter(
          ({ blob }) => tokens.every((t) => {
            if (blob.includes(t)) return true;
            const syns = ANGLICISM_MAP[t];
            return syns ? syns.some((s) => blob.includes(s)) : false;
          })
        ).map((x) => x.s.titulo)
      ) : null;
      const countFor = (items) => {
        const filtered = matching ? items.filter((s) => matching.has(s.titulo)) : items;
        return alOnlyFilter(locFilter(filtered)).length;
      };
      const allChipCount = chipsBox.querySelector('.sup-chip[data-cat=""] .sup-count');
      if (allChipCount) allChipCount.textContent = String(countFor(topo));
      cats.forEach((cat) => {
        const el = chipsBox.querySelector(`.sup-chip[data-cat="${cat.id}"] .sup-count`);
        if (el) el.textContent = String(countFor(cat.items));
      });
    }
    input.addEventListener("input", applyFilter);
    alOnly == null ? void 0 : alOnly.addEventListener("change", applyFilter);
    chipsBox.addEventListener("click", (e) => {
      const btn = e.target.closest(".sup-chip");
      if (!btn) return;
      chipsBox.querySelectorAll(".sup-chip").forEach((b) => {
        b.classList.remove("is-active");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("is-active");
      btn.setAttribute("aria-pressed", "true");
      activeCat = btn.dataset["cat"] ?? "";
      input.value = "";
      applyFilter();
      input.focus();
    });
    for (const field of ["estado", "cidade", "bairro"]) {
      const el = locFields[field];
      const dd = document.getElementById("dd-" + field);
      if (!el || !dd) continue;
      el.addEventListener("focus", () => {
        if (!touchedFields[field]) el.select();
        renderDropdown(field);
      });
      el.addEventListener("input", () => {
        el.classList.remove("is-default");
        touchedFields[field] = true;
        activeFilters[field] = el.value.trim();
        renderDropdown(field);
        clearTimeout(locDebounce);
        locDebounce = setTimeout(applyFilter, 120);
      });
      el.addEventListener("blur", () => {
        setTimeout(() => {
          dd.hidden = true;
        }, 120);
      });
      el.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          dd.hidden = true;
          el.blur();
        }
      });
      dd.addEventListener("mousedown", (e) => {
        const li = e.target.closest("li[data-val]");
        if (!li) return;
        e.preventDefault();
        el.value = li.dataset["val"] ?? "";
        el.classList.remove("is-default");
        touchedFields[field] = true;
        activeFilters[field] = el.value.trim();
        dd.hidden = true;
        applyFilter();
      });
    }
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".market-loc-field")) closeAllDropdowns();
    });
    applyFilter();
    input.focus();
    void initHeaderAuth();
  }
  const home = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    render: render$c
  }, Symbol.toStringTag, { value: "Module" }));
  function ProfileCard(props) {
    const e = props.entity;
    const text = e.type !== "community" ? e.bioCurta ?? e.bio : e.bio;
    const firstPara = text ? text.split(/\n\s*\n/)[0] : void 0;
    if (firstPara) return `<p class="card-bio">${esc(firstPara)}</p>`;
    return `<p class="card-bio empty">Biografia em breve.</p>`;
  }
  function avatarSm(props) {
    const { entity } = props;
    if (entity.type === "community") return "";
    const inner = entity.pic ? `<img src="${esc(entity.pic)}" alt="${esc(entity.nome)}">` : esc(initial(entity.nome));
    return `<div class="avatar-sm">${inner}</div>`;
  }
  function avatarLg(entity) {
    const inner = entity.pic ? `<img src="${esc(entity.pic)}" alt="${esc(entity.nome)}">` : esc(initial(entity.nome));
    return `<div class="avatar avatar-lg">${inner}</div>`;
  }
  function initial(s) {
    var _a;
    return ((_a = (s ?? "?").trim()[0]) == null ? void 0 : _a.toUpperCase()) ?? "?";
  }
  const REDE_EMAIL$3 = "rede@artelonga.com.br";
  function ctaLead(copy, btnLabel) {
    return `<div class="lead-magnet">
    <h3>${esc(copy.title)}</h3>
    <p>${esc(copy.body)}</p>
    <button type="button" class="cta-button" data-cta="${esc(copy.id)}">${esc(btnLabel)}</button>
  </div>`;
  }
  function modalContact(id, labelText) {
    const label = labelText ? `<div class="modal-servico-nome">${esc(labelText)}</div>` : "";
    return `<div class="modal-overlay" id="${id}" role="dialog" aria-modal="true">
    <div class="modal-card" style="text-align:center;">
      ${label}
      <div class="modal-contact-label">Escreva para</div>
      <div class="modal-email">${REDE_EMAIL$3}</div>
      <button class="modal-close" type="button">Fechar</button>
    </div>
  </div>`;
  }
  function wireModal(modalId, triggerSelector) {
    const m = document.getElementById(modalId);
    if (!m) return;
    document.querySelectorAll(triggerSelector).forEach((t) => {
      t.addEventListener("click", () => m.classList.add("on"));
    });
    m.addEventListener("click", (e) => {
      const target = e.target;
      if (target === m || target.classList.contains("modal-close")) m.classList.remove("on");
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") m.classList.remove("on");
    });
  }
  function wirePopover(hostSelector) {
    const getOpen = () => document.querySelectorAll(hostSelector + ".servicos-open");
    const closeAll = () => {
      getOpen().forEach((h) => {
        h.classList.remove("servicos-open");
        const btn = h.querySelector(".ver-servicos-btn");
        if (btn) btn.setAttribute("aria-expanded", "false");
      });
    };
    document.querySelectorAll(hostSelector + " .ver-servicos-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const host = btn.closest(hostSelector);
        if (!host) return;
        const wasOpen = host.classList.contains("servicos-open");
        closeAll();
        if (!wasOpen) {
          host.classList.add("servicos-open");
          btn.setAttribute("aria-expanded", "true");
        }
      });
    });
    document.addEventListener("click", (e) => {
      const target = e.target;
      if (!target.closest(".servicos-popover") && !target.closest(".ver-servicos-btn")) {
        closeAll();
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeAll();
    });
  }
  function render$b() {
    setPageSEO({
      title: "Parceiros — Arte Longa",
      description: "Conheça os profissionais e comunidades parceiras da rede Arte Longa.",
      url: "/parceiros/"
    });
    const h = (location.hash || "").toLowerCase();
    if (h === "#todos" || h === "#showall") {
      renderParceirosShowAll();
      window.addEventListener("hashchange", render$b);
      return;
    }
    window.addEventListener("hashchange", render$b);
    renderParceiros();
  }
  function renderParceirosShowAll() {
    const AL = window.AL;
    const all = AL.people.filter((p) => !p.referenceOnly).sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "pt-BR"));
    const items = all.map((p) => `<li><a href="/${esc(p.handle)}/">${esc(p.nome)}</a></li>`).join("");
    document.body.innerHTML = `
        ${siteHeader()}
        <main class="main">
            <h1 class="statement">Todos</h1>
            <p class="show-all-intro">${all.length} caminhos…</p>
            <ul class="roster-all">${items}</ul>
            <p class="show-all-toggle"><a href="/parceiros/">← papéis e serviços</a></p>
            <a class="back" href="/">← voltar</a>
        </main>
        ${siteFooter()}
    `;
  }
  function renderParceiros() {
    const AL = window.AL;
    const roster = AL.roster();
    const rows = roster.map((entity) => {
      var _a;
      const isComunidade = entity.type === "community";
      const nameUrl = entity.externalUrl ? entity.externalUrl : `/${entity.handle}/`;
      const nameAttrs = entity.externalUrl ? ` target="_blank" rel="noopener"` : "";
      const verMaisUrl = `/${entity.handle}/`;
      const verMaisLabel = isComunidade ? "Ver Mais →" : "ver mais →";
      const seeMore = entity.muted ? "" : `<a class="see-more" href="${verMaisUrl}">${verMaisLabel}</a>`;
      const socioMark = !isComunidade && AL.isSocio(entity.handle) ? `<span class="socio-mark" aria-label="sócio">*</span>` : "";
      const nameHtml = `<a href="${nameUrl}" class="name"${nameAttrs}>${esc(entity.nome)}${socioMark}</a>`;
      const subHandles = isComunidade ? entity.membros : entity.subMembers;
      const subs = (subHandles ?? []).map((h) => AL.get(h)).filter(Boolean);
      const rosterSet = new Set(AL.rosterOrder ?? []);
      const splitSubs = (list) => {
        if (!isComunidade) return { visible: list, hidden: [] };
        const visible = [];
        const hidden = [];
        for (const m of list) {
          if (rosterSet.has(m.handle)) hidden.push(m);
          else visible.push(m);
        }
        return { visible, hidden };
      };
      const { visible: subsVisible, hidden: subsHidden } = splitSubs(subs);
      const hiddenBadge = subsHidden.length ? `<li class="membros-badge">+ ${subsHidden.length} membros</li>` : "";
      const membrosHtml = subsVisible.length || subsHidden.length ? `<ul class="card-membros">${subsVisible.map((m) => miniRow(m)).join("")}${hiddenBadge}</ul>` : "";
      const svcList = !isComunidade && ((_a = entity.servicos) == null ? void 0 : _a.length) ? entity.servicos ?? [] : [];
      const svcItems = svcList.length ? expandTitlesForPopover(svcList) : [];
      const servicosBtn = svcItems.length ? `<button type="button" class="ver-servicos-btn" aria-expanded="false">Ver serviços (${svcItems.length}) →</button>` : isComunidade || entity.muted ? "" : `<span class="card-missoes-hint">em breve</span>`;
      const servicosPopover = svcItems.length ? `<div class="servicos-popover" role="dialog" aria-label="Serviços de ${esc(entity.nome)}">
                <div class="servicos-popover-head">Serviços de ${esc(entity.nome)}</div>
                <ul class="servicos-popover-list">${renderPopoverList(svcItems)}</ul>
               </div>` : "";
      const avatar = isComunidade ? "" : avatarSm({ entity });
      const profileBlock = isComunidade ? ProfileCard({ entity }) : `<div class="profile-block">${avatar}${ProfileCard({ entity })}</div>`;
      const liClasses = [
        entity.muted ? "muted" : "",
        entity.emMemoria ? "em-memoria" : "",
        entity.emBreve ? "em-breve" : "",
        !isComunidade ? "" : entity.sectionBreak ? "section-break" : ""
      ].filter(Boolean).join(" ");
      return `<li${liClasses ? ` class="${liClasses}"` : ""}>
            <div class="row">${nameHtml}<span class="role">${esc(entity.role ?? "")}</span></div>
            <div class="card"><div class="card-inner">
                <div class="card-left">${profileBlock}${membrosHtml}${seeMore}</div>
                <div class="card-right">${servicosBtn}${servicosPopover}</div>
            </div></div>
        </li>`;
    }).join("");
    document.body.innerHTML = `
        ${siteHeader()}
        <main class="main">
            <h1 class="statement">Arte Longa é:</h1>
            <p class="page-summary">Quem entrega na rede.</p>
            <ul class="roster">${rows}</ul>
            <p class="socio-legend"><span class="socio-mark">*</span> sócio · sempre em expansão</p>
            <div class="coda"><span class="when">01.04.2026</span></div>
            ${ctaLead({ title: "Participe", body: "Faça parte da rede.", id: "parceiros" }, "Entrar →")}
            <a class="back" href="/">← voltar</a>
        </main>
        ${siteFooter()}
        ${modalContact("contact-modal", "Bem-vindo à rede")}
    `;
    document.querySelectorAll(".roster > li").forEach((li) => {
      const role = li.querySelector(":scope > .row > .role");
      if (role) role.addEventListener("click", (e) => {
        e.stopPropagation();
        li.classList.toggle("open");
      });
    });
    document.querySelectorAll(".mini-row").forEach((row) => {
      row.addEventListener("click", (e) => {
        if (e.target.closest(".mini-name")) return;
        e.stopPropagation();
        row.classList.toggle("open");
      });
    });
    document.querySelectorAll(".membros-more-btn").forEach((btn) => {
      const list = btn.previousElementSibling;
      const more = btn.dataset["more"] ?? "0";
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const expanded = (list == null ? void 0 : list.classList.toggle("membros-expanded")) ?? false;
        btn.textContent = expanded ? "ver menos" : `ver mais (+${more})`;
      });
    });
    wirePopover(".roster > li");
    wireModal("contact-modal", '[data-cta="parceiros"]');
  }
  function miniRow(entity) {
    var _a;
    const memoriaTag = entity.emMemoria ? ` <span class="mini-memoria">em memória</span>` : "";
    const servicos2 = !("servicos" in entity && ((_a = entity.servicos) == null ? void 0 : _a.length)) ? "" : `<div class="mini-drawer"><ul class="mini-missoes">${(entity.servicos ?? []).map((m) => `<li>${esc(m)}</li>`).join("")}</ul></div>`;
    return `<li class="mini-row${entity.emMemoria ? " mini-row-memoria" : ""}">
        <a class="mini-name" href="/${esc(entity.handle)}/">${esc(entity.nome)}</a>${memoriaTag}
        ${servicos2}
    </li>`;
  }
  function expandTitlesForPopover(titles) {
    const AL = window.AL;
    const items = [];
    for (const t of titles) {
      const children = AL.services.filter((s) => s.parent === t);
      if (children.length) {
        const parentSvc = AL.serviceByTitle(t);
        items.push({
          titulo: t,
          slug: parentSvc ? parentSvc.slug ?? AL.slugify(t) : AL.slugify(t),
          role: "group"
        });
        for (const c of children) {
          items.push({ titulo: c.titulo, slug: c.slug ?? AL.slugify(c.titulo), role: "child" });
        }
      } else {
        const svc = AL.serviceByTitle(t);
        items.push({
          titulo: t,
          slug: svc ? svc.slug ?? AL.slugify(t) : AL.slugify(t),
          role: "item"
        });
      }
    }
    return items;
  }
  function renderPopoverList(items) {
    return items.map((it) => {
      const cls = it.role === "group" ? "svc-group" : it.role === "child" ? "svc-child" : "";
      return `<li${cls ? ` class="${cls}"` : ""}><a href="/servicos/${esc(it.slug)}/">${esc(it.titulo)} →</a></li>`;
    }).join("");
  }
  const parceiros = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    render: render$b
  }, Symbol.toStringTag, { value: "Module" }));
  function render$a() {
    var _a;
    setPageSEO({
      title: "Serviços — Arte Longa",
      description: "Catálogo completo de serviços da rede Arte Longa.",
      url: "/servicos/"
    });
    const AL = window.AL;
    const servicos2 = AL.publicServices();
    const handleToNome = Object.fromEntries(
      [...AL.people, ...AL.communities].map((e) => [e.handle, e.nome])
    );
    const respNames = (handles) => (handles ?? []).map((h) => handleToNome[h] ?? h).join(", ");
    document.body.innerHTML = `
        ${siteHeader()}
        <main class="main">
            <h1 class="page-title">Serviços</h1>
            <div class="page-subtitle">Arte Longa · rede completa</div>

            <div class="section-header"><h2>Rede</h2><span class="label">clique para abrir · hover revela sub-serviços</span></div>
            <div class="controls"><input type="search" id="search" placeholder="Buscar serviço…" autocomplete="off"></div>
            <div class="count" id="count"></div>
            <ul class="portfolio-list" id="portfolio-list"></ul>

            ${ctaLead({ title: "Anuncie", body: "Participe da Rede.", id: "servicos" }, "Entrar →")}

            <a class="back" href="/">← voltar</a>
        </main>
        ${siteFooter()}
        ${modalContact("lead-modal", "Anuncie com a Arte Longa")}
    `;
    const listEl = document.getElementById("portfolio-list");
    const countEl = document.getElementById("count");
    const searchEl = document.getElementById("search");
    const leadModal = document.getElementById("lead-modal");
    leadModal.addEventListener("click", (e) => {
      const target = e.target;
      if (target === leadModal || target.classList.contains("modal-close"))
        leadModal.classList.remove("on");
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") leadModal.classList.remove("on");
    });
    (_a = document.querySelector('[data-cta="servicos"]')) == null ? void 0 : _a.addEventListener(
      "click",
      () => leadModal.classList.add("on")
    );
    function makeRow(s, inChildren = false) {
      var _a2, _b;
      const parent = s.parent ? `<span class="portfolio-parent">${esc(s.parent)} ›</span> ` : "";
      const titulo = inChildren ? esc(s.titulo) : `${parent}${esc(s.titulo)}`;
      const childCount = ((_a2 = s.children) == null ? void 0 : _a2.length) ?? 0;
      const expandable = childCount > 0 && !inChildren ? `<span class="portfolio-expand">+${childCount}</span>` : "";
      const resp = inChildren ? "" : `<div class="portfolio-resp">${esc(respNames(s.responsavel))}</div>`;
      const children = !inChildren && ((_b = s.children) == null ? void 0 : _b.length) ? `<ul class="portfolio-children">${s.children.map((ct) => {
        const ch = servicos2.find((x) => x.titulo === ct);
        if (!ch) return "";
        return `<li><a href="/servicos/${esc(ch.slug ?? "")}/" class="portfolio-link child-link"><span>${esc(ch.titulo)}</span></a></li>`;
      }).join("")}</ul>` : "";
      return `<li class="${expandable ? "has-children" : ""}">
            <a href="/servicos/${esc(s.slug ?? "")}/" class="portfolio-link">
                <div class="portfolio-titulo">${titulo}${expandable}</div>
                ${resp}
            </a>
            ${children}
        </li>`;
    }
    function renderList() {
      const q = norm(searchEl.value);
      let filtered;
      if (q) {
        filtered = servicos2.filter(
          (s) => norm(s.titulo).includes(q) || norm(respNames(s.responsavel)).includes(q) || (s.parent ? norm(s.parent).includes(q) : false)
        );
        countEl.textContent = `${filtered.length} de ${servicos2.length} serviços`;
      } else {
        filtered = servicos2.filter((s) => !s.parent);
        countEl.textContent = `${filtered.length} serviços · ${servicos2.length - filtered.length} sub-serviços`;
      }
      if (!filtered.length) {
        listEl.innerHTML = `<li class="empty-state">Nenhum serviço encontrado.</li>`;
        return;
      }
      listEl.innerHTML = filtered.map((s) => makeRow(s, !!q)).join("");
    }
    const urlQ = new URLSearchParams(location.search).get("q");
    if (urlQ) searchEl.value = urlQ;
    searchEl.addEventListener("input", renderList);
    renderList();
  }
  const servicos = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    render: render$a
  }, Symbol.toStringTag, { value: "Module" }));
  function render$9() {
    setPageSEO({
      title: "Soluções — Arte Longa",
      description: "Universos e soluções desenvolvidas pela Arte Longa.",
      url: "/solucoes/"
    });
    const AL = window.AL;
    const renderRow = (s) => {
      const internal = s.internalLink !== false && (s.url ?? "").startsWith("/");
      const urlAttrs = internal ? "" : ` target="_blank" rel="noopener"`;
      const meta = s.urlLabel ? `<span class="universo-meta">${esc(s.urlLabel)}</span>` : "";
      return `<li class="universo-row">
            <a class="universo-link" href="${esc(s.url ?? "#")}"${urlAttrs}>
                <span class="universo-nome">${esc(s.nome)}</span>
                <span class="universo-objetivo">${esc(s.tagline ?? "")}</span>
                ${meta}
                <span class="universo-arrow">→</span>
            </a>
        </li>`;
    };
    const ativos = AL.solutions.filter((s) => s.universo && s.lifecycle === "active");
    const futuros = AL.solutions.filter((s) => s.universo && s.lifecycle === "futuro");
    const parcerias = AL.solutions.filter((s) => !s.universo);
    const sectionHtml = (title, list) => list.length ? `<div class="section-header"><h2>${esc(title)}</h2></div>
               <ul class="universos-catalog">${list.map(renderRow).join("")}</ul>` : "";
    document.body.innerHTML = `
        ${siteHeader()}
        <main class="main">
            <h1 class="page-title">Soluções</h1>
            <div class="page-subtitle">Arte Longa</div>

            ${sectionHtml("Ativos", ativos)}
            ${sectionHtml("Futuro", futuros)}
            ${sectionHtml("Parcerias", parcerias)}

            ${universosDiagram()}

            ${ctaLead({ title: "Construa um Universo", body: "Da ideia ao lançamento.", id: "solucoes" }, "Compartilhe →")}

            <a class="back" href="/">← voltar</a>
        </main>
        ${modalContact("contact-modal", "")}
    `;
    wireModal("contact-modal", '[data-cta="solucoes"]');
  }
  function universosDiagram() {
    return `<section class="universos-diagram-section">
        <h2 class="solucoes-section-title">Arquitetura</h2>
        <p class="intro universos-diagram-intro">Uma identidade, vários Universos conectados em tempo real.</p>
        <svg class="universos-diagram" viewBox="0 0 720 340" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Você → identidade única → Universos conectados em tempo real">

          <!-- VOCÊ -->
          <g transform="translate(60,170)">
            <circle r="22" fill="#fff" stroke="#222" stroke-width="2"/>
            <circle cx="-7" cy="-4" r="2.2" fill="#222"/>
            <circle cx="7"  cy="-4" r="2.2" fill="#222"/>
            <path d="M -9 6 Q 0 15 9 6" fill="none" stroke="#222" stroke-width="2" stroke-linecap="round"/>
            <text y="48" text-anchor="middle" font-size="11" fill="#666" letter-spacing="0.1em">VOCÊ</text>
          </g>

          <line x1="84" y1="170" x2="206" y2="170" stroke="#222" stroke-width="1.5"/>

          <g transform="translate(238,170)">
            <circle r="30" fill="#fff" stroke="#222" stroke-width="2"/>
            <circle cy="-8" r="7.5" fill="#222"/>
            <path d="M -13 14 C -13 4 -6 0 0 0 C 6 0 13 4 13 14 Z" fill="#222"/>
            <text y="55" text-anchor="middle" font-size="11" fill="#666" letter-spacing="0.1em">IDENTIDADE</text>
          </g>

          <line x1="268" y1="170" x2="440" y2="60"  stroke="#222" stroke-width="1" opacity="0.45"/>
          <line x1="268" y1="170" x2="520" y2="120" stroke="#222" stroke-width="1" opacity="0.45"/>
          <line x1="268" y1="170" x2="560" y2="200" stroke="#222" stroke-width="1" opacity="0.45"/>
          <line x1="268" y1="170" x2="520" y2="260" stroke="#222" stroke-width="1" opacity="0.45"/>
          <line x1="268" y1="170" x2="440" y2="290" stroke="#222" stroke-width="1" opacity="0.45"/>

          <g class="ud-mesh">
            <line class="ud-pulse" x1="440" y1="60"  x2="520" y2="120" stroke="#888" stroke-width="1"/>
            <line class="ud-pulse" x1="520" y1="120" x2="560" y2="200" stroke="#888" stroke-width="1"/>
            <line class="ud-pulse" x1="560" y1="200" x2="520" y2="260" stroke="#888" stroke-width="1"/>
            <line class="ud-pulse" x1="520" y1="260" x2="440" y2="290" stroke="#888" stroke-width="1"/>
            <line class="ud-pulse" x1="440" y1="60"  x2="440" y2="290" stroke="#888" stroke-width="1"/>
            <line class="ud-pulse" x1="440" y1="60"  x2="560" y2="200" stroke="#888" stroke-width="1"/>
            <line class="ud-pulse" x1="440" y1="290" x2="560" y2="200" stroke="#888" stroke-width="1"/>
            <line class="ud-pulse" x1="520" y1="120" x2="520" y2="260" stroke="#888" stroke-width="1"/>
          </g>

          <circle cx="440" cy="60"  r="22" fill="#fff" stroke="#222" stroke-width="1.5"/>
          <circle cx="520" cy="120" r="22" fill="#fff" stroke="#222" stroke-width="1.5"/>
          <circle cx="560" cy="200" r="22" fill="#fff" stroke="#222" stroke-width="1.5"/>
          <circle cx="520" cy="260" r="22" fill="#fff" stroke="#222" stroke-width="1.5"/>
          <circle cx="440" cy="290" r="22" fill="#fff" stroke="#222" stroke-width="1.5"/>

          <text x="500" y="325" text-anchor="middle" font-size="11" fill="#666" letter-spacing="0.1em">UNIVERSOS · CONEXÃO EM TEMPO REAL</text>
        </svg>
    </section>`;
  }
  const solucoes = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    render: render$9
  }, Symbol.toStringTag, { value: "Module" }));
  function render$8() {
    setPageSEO({
      title: "Recursos — Arte Longa",
      description: "Transparência financeira: receita, custos e metas da Arte Longa.",
      url: "/recursos/"
    });
    const AL = window.AL;
    const f = AL.finances;
    const fmt = (n) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
    const short = (n) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
    const nomeOf = (h) => {
      const p = AL.get(h);
      return p ? p.nome : h;
    };
    const solucoesLinks = (handles) => {
      if (!(handles == null ? void 0 : handles.length)) return "";
      const links = handles.map((h) => {
        const s = AL.get(h);
        if (!s) return null;
        return `<a class="fin-sol-link" href="/solucoes/#${esc(s.handle)}">${esc(s.nome)}</a>`;
      }).filter((l) => l !== null);
      return links.length ? `<div class="fin-solucoes">exemplo em: ${links.join(" · ")}</div>` : "";
    };
    const totalCustos = f.custos.reduce((a, c) => a + c.value, 0);
    const custosHtml = f.custos.map((c) => {
      const breakdownHtml = c.breakdown ? `<div class="fin-sub-breakdown">${c.breakdown.map(
        (b) => `<div class="sub-line"><span>${esc(b.label)}${b.handle ? ` <a class="sub-link" href="/${esc(b.handle)}/">↗</a>` : ""}</span><span>${fmt(b.value)}</span></div>`
      ).join("")}</div>` : "";
      const detailHtml = c.detail ? `<div class="fin-detail">${esc(c.detail)}</div>` : "";
      return `<li class="fin-item">
            <div class="fin-head">
                <div class="fin-label">${esc(c.label)}</div>
                <div class="fin-value">${fmt(c.value)}</div>
            </div>
            ${detailHtml}${breakdownHtml}
        </li>`;
    }).join("");
    const recorrenteMensalTotal = f.receita.recorrenteMensal.reduce((a, r) => a + r.mensal, 0);
    const recorrenteQ2 = recorrenteMensalTotal * 3;
    const rampaQ2 = f.receita.rampa.reduce((a, r) => a + r.meses.reduce((b, m) => b + m.value, 0), 0);
    const projetosQ2 = f.receita.projetos.reduce((a, p) => a + p.unitValue * p.unidades, 0);
    const totalReceitaQ2 = recorrenteQ2 + rampaQ2 + projetosQ2;
    const percentMeta = Math.round(totalReceitaQ2 / f.metaQ2 * 100);
    const gap = f.metaQ2 - totalReceitaQ2;
    const recorrenteHtml = f.receita.recorrenteMensal.map((r) => `
        <li class="fin-item">
            <div class="fin-head">
                <div class="fin-label">${esc(r.label)}${r.client ? ` <span class="client-tag">cliente: ${esc(r.client)}</span>` : ""}</div>
                <div class="fin-value">${fmt(r.mensal)}<span class="fin-unit">/mês</span></div>
            </div>
            <div class="fin-detail">${esc(r.detail)} · por <a href="/${esc(r.responsavel)}/">${esc(nomeOf(r.responsavel))}</a></div>
            ${solucoesLinks(r.solucoes)}
        </li>
    `).join("");
    const rampaHtml = f.receita.rampa.map((r) => `
        <li class="fin-item">
            <div class="fin-head">
                <div class="fin-label">${esc(r.label)}${r.client ? ` <span class="client-tag">cliente: ${esc(r.client)}</span>` : ""}</div>
                <div class="fin-value">${fmt(r.meses.reduce((a, m) => a + m.value, 0))}<span class="fin-unit"> · Q2</span></div>
            </div>
            <div class="fin-detail">${esc(r.detail)} · por <a href="/${esc(r.responsavel)}/">${esc(nomeOf(r.responsavel))}</a></div>
            <div class="fin-sub-breakdown">${r.meses.map(
      (m) => `<div class="sub-line"><span>${esc(m.mes)}</span><span>${fmt(m.value)}</span></div>`
    ).join("")}</div>
            ${solucoesLinks(r.solucoes)}
        </li>
    `).join("");
    const projetosHtml = f.receita.projetos.map((p) => {
      const total = p.unitValue * p.unidades;
      const byHtml = p.responsavel ? ` · por <a href="/${esc(p.responsavel)}/">${esc(nomeOf(p.responsavel))}</a>` : "";
      return `<li class="fin-item">
                <div class="fin-head">
                    <div class="fin-label">${esc(p.label)}</div>
                    <div class="fin-value">${fmt(total)}</div>
                </div>
                <div class="fin-detail">${esc(p.detail)}${byHtml}</div>
                ${solucoesLinks(p.solucoes)}
            </li>`;
    }).join("");
    const proBonoHtml = f.receita.proBono.map((p) => `
        <li class="fin-item pro-bono">
            <div class="fin-head">
                <div class="fin-label">${esc(p.label)}</div>
                <div class="fin-value pro-bono-tag">pro-bono</div>
            </div>
            <div class="fin-detail">${esc(p.detail)} · por <a href="/${esc(p.responsavel)}/">${esc(nomeOf(p.responsavel))}</a></div>
            ${solucoesLinks(p.solucoes)}
        </li>
    `).join("");
    document.body.innerHTML = `
        ${siteHeader()}
        <main class="main">
            <h1 class="page-title">Recursos</h1>
            <div class="page-subtitle">Transparência financeira · receita, custos e meta trimestral · ${esc(f.quarter)}</div>

            <p class="intro">Como a rede se sustenta. Em ${esc(f.quarter)} projetamos <strong>${fmt(totalReceitaQ2)}</strong> de receita — suficiente para cobrir os <strong>${fmt(totalCustos * 3)}</strong> de custos operacionais e dedicar o trimestre a teste, validação e melhoria. Esta página é pública e atualizada em tempo real.</p>

            <div class="section-header"><h2>Resumo</h2><span class="label">${esc(f.quarter)}</span></div>
            <div class="fin-goal-grid fin-goal-grid-3">
                <div class="fin-goal">
                    <div class="fin-goal-label">Custos · ${esc(f.quarter)}</div>
                    <div class="fin-goal-value">${short(totalCustos * 3)}</div>
                    <div class="fin-goal-note">${short(totalCustos)}/mês × 3</div>
                </div>
                <div class="fin-goal">
                    <div class="fin-goal-label">Meta · ${esc(f.quarter)}</div>
                    <div class="fin-goal-value">${short(f.metaQ2)}</div>
                    <div class="fin-goal-note">receita objetivo</div>
                </div>
                <div class="fin-goal highlighted">
                    <div class="fin-goal-label">Receita projetada</div>
                    <div class="fin-goal-value">${short(totalReceitaQ2)}</div>
                    <div class="fin-goal-note">${percentMeta}% da meta · gap ${gap > 0 ? short(gap) : "zero"}</div>
                </div>
            </div>

            <div class="fin-breakdown-summary">
                <div class="sum-line"><span>Recorrente × 3</span><span>${fmt(recorrenteQ2)}</span></div>
                <div class="sum-line"><span>Rampa (Hedix MM)</span><span>${fmt(rampaQ2)}</span></div>
                <div class="sum-line"><span>Projetos</span><span>${fmt(projetosQ2)}</span></div>
                <div class="sum-line sum-total"><span>Total projetado</span><span>${fmt(totalReceitaQ2)}</span></div>
            </div>

            <div class="section-header"><h2>Gastos recorrentes</h2><span class="label">o que mantemos por mês</span></div>
            <p class="intro-short">Custo fixo da operação. Pro labore dos sócios, contabilidade, coworking e infraestrutura.</p>
            <ul class="fin-list">${custosHtml}</ul>
            <div class="fin-total">
                <span class="fin-total-label">Total mensal</span>
                <span class="fin-total-value">${fmt(totalCustos)}</span>
            </div>
            <div class="fin-total-secondary">
                <span>× 3 · ${esc(f.quarter)}</span>
                <span>${fmt(totalCustos * 3)}</span>
            </div>

            <div class="section-header"><h2>Receita garantida</h2><span class="label">recorrente · mensal</span></div>
            <p class="intro-short">Contratos fixos que entram todo mês. Baseline previsível.</p>
            <ul class="fin-list">${recorrenteHtml}</ul>
            <div class="fin-subtotal">
                <span>Subtotal recorrente · mensal</span>
                <span>${fmt(recorrenteMensalTotal)}</span>
            </div>
            <div class="fin-subtotal">
                <span>Subtotal recorrente · ${esc(f.quarter)} (× 3)</span>
                <span>${fmt(recorrenteQ2)}</span>
            </div>

            <div class="section-header"><h2>Receita em rampa</h2><span class="label">crescimento mês a mês</span></div>
            <p class="intro-short">Receita ramping up — começa pequena e cresce a cada mês.</p>
            <ul class="fin-list">${rampaHtml}</ul>
            <div class="fin-subtotal">
                <span>Subtotal rampa · ${esc(f.quarter)}</span>
                <span>${fmt(rampaQ2)}</span>
            </div>

            <div class="section-header"><h2>Receita pontual</h2><span class="label">projetos · one-off no trimestre</span></div>
            <p class="intro-short">Projetos avulsos. Acontecem uma vez no trimestre.</p>
            <ul class="fin-list">${projetosHtml}</ul>
            <div class="fin-subtotal">
                <span>Subtotal projetos · ${esc(f.quarter)}</span>
                <span>${fmt(projetosQ2)}</span>
            </div>

            <div class="section-header"><h2>Pro-bono</h2><span class="label">impacto · não entra na receita</span></div>
            <p class="intro-short">Trabalho que fazemos sem cobrar. Parte do impacto social, ambiental e cultural.</p>
            <ul class="fin-list">${proBonoHtml}</ul>

            <p class="fin-footnote">
                Consulte também <a href="/sobre/">Sobre</a> (dados cadastrais), <a href="/proximos-passos/">Próximos Passos</a> (metas) e <a href="/servicos/">Serviços</a> (catálogo).
            </p>

            <p class="proximos-link-bottom">
                <a href="/proximos-passos/">Próximos Passos →</a>
            </p>

            <a class="back" href="/">← voltar</a>
        </main>
        ${siteFooter()}
    `;
  }
  const recursos = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    render: render$8
  }, Symbol.toStringTag, { value: "Module" }));
  const INFRA_COST = { value: 2e3, label: "Armazenamento e computação" };
  const PRICE_BANDS = [
    {
      faixa: "≈ US$0/mês",
      titulo: "Site ocioso",
      desc: "Subdomínio que desliga sozinho quando ocioso e só consome ao receber tráfego.",
      exemplo: "Retro Umarizal — site e cardápio em domínio próprio, sem mensalidade de plataforma."
    },
    {
      faixa: "~US$4/mês",
      titulo: "Rede compartilhada",
      desc: "A rede inteira do co roda numa máquina compartilhada. Custo marginal por novo site ≈ zero.",
      exemplo: "co — site, quadro e wiki de cada parceiro num lugar só, com sincronização em tempo real."
    },
    {
      faixa: "~US$150/mês",
      titulo: "Dedicado · alta demanda",
      desc: "Quando um caso de uso cresce além da computação compartilhada, migra pra um serviço dedicado.",
      exemplo: "Plataforma de dados em tempo real na AWS — repositório de dados sobre S3, custo estimável por cliente."
    }
  ];
  const DEPLOYS = [
    { app: "co-artelonga", serve: "co — sites (site, quadro e wiki)", runtime: "Rust · Axum", vm: "shared-cpu-1x · 512 MB", estado: "running", host: "Fly · gru", dominio: "co.artelonga.com.br" },
    { app: "yggdrasil-artelonga", serve: "Yggdrasil — mundos digitais 2D", runtime: "Rust · Axum", vm: "shared-cpu-1x · 512 MB", estado: "running", host: "Fly · gru", dominio: "yggdrasil.artelonga.com.br" },
    { app: "artelonga-neuro", serve: "Neuro — bibliografia de neurociência", runtime: "Node 22", vm: "shared-cpu-1x · 256 MB", estado: "running", host: "Fly · gru", dominio: "neuro.artelonga.com.br" },
    { app: "artelonga-yuri", serve: "yuri — site publicado (inclui estudo AWS)", runtime: "Node · estático", vm: "shared-cpu-1x · 256 MB", estado: "running", host: "Fly · gru", dominio: "yuri.artelonga.com.br" },
    { app: "artelonga-retro", serve: "Retro Umarizal — site e cardápio (graduado)", runtime: "Node · estático", vm: "shared-cpu-1x · 256 MB", estado: "running", host: "Fly · gru", dominio: "retroumarizal.com.br" },
    { app: "quilombo-araucaria", serve: "Quilombo Araucária — plataforma comunitária", runtime: "Node · SvelteKit", vm: "shared-cpu-1x · 2048 MB", estado: "running", host: "Fly · gru", dominio: "quilomboaraucaria.org" },
    { app: "rfq", serve: "RFQ Gateway — cotações (Hedix)", runtime: "Rust · Axum", vm: "shared-cpu-1x · 256 MB", estado: "running", host: "Fly · gru", dominio: "rfq.artelonga.com.br" },
    { app: "artelonga.com.br", serve: "Site público (este) — conteúdo da rede", runtime: "estático", vm: "—", estado: "running", host: "GitHub Pages" }
  ];
  const PIPELINE = [
    { num: "①", nome: "Aquisição", eventos: "e0–e2 · envio → entrega → abertura", owner: "Marketing", nota: "Abertura observada 40,3% (n=77, Wilson)." },
    { num: "②", nome: "Engajamento", eventos: "e3–e6 · clique → página → cadastro", owner: "Crescimento / Produto", nota: "Visita ao painel e início de cadastro." },
    { num: "③", nome: "Monetização", eventos: "e7–e8 · plano → pagamento", owner: "Receita / Finanças", nota: "Escolha de plano e autorização de pagamento." },
    { num: "④", nome: "Criação (Horizons)", eventos: "e9–e11 · pedido → app → publicar", owner: "Produto", nota: "Geração do site e publicação." },
    { num: "⑤", nome: "Entrada no ar (infra)", eventos: "e12–e18 · hospedagem → domínio → DNS → HTTPS", owner: "Infra / DNS", marca: "infra", nota: "Onde a infra entra: hospedagem, domínio, DNS (propagação 0,169 s) e certificado HTTPS." },
    { num: "⑥", nome: "Ativação & retenção", eventos: "e19–e20 · ativação → renovação/cancelamento", owner: "Produto / Receita", marca: "scale", nota: "Cada site vira uma fonte de contato — escala horizontal de funis." }
  ];
  const AWS_STUDY = {
    urlPt: "/yuri/aws/",
    urlEn: "/yuri/aws/en/",
    metricas: [
      "−95% de custo de armazenamento (DynamoDB → S3/Parquet)",
      "varredura 157 h → 13 min",
      "~US$150/mês por cliente de alta demanda"
    ]
  };
  function deployRow(d) {
    const estadoLabel = d.estado === "running" ? "ativo" : d.estado === "staging" ? "homologação" : "estacionado";
    return `<tr>
        <td class="infra-app">${esc(d.app)}${d.dominio ? `<span class="infra-dom">${esc(d.dominio)}</span>` : ""}</td>
        <td>${esc(d.serve)}</td>
        <td>${esc(d.runtime)}</td>
        <td>${esc(d.vm)}</td>
        <td>${esc(d.host)}</td>
        <td><span class="infra-state infra-state-${esc(d.estado)}">${esc(estadoLabel)}</span></td>
    </tr>`;
  }
  function priceCard(p) {
    return `<div class="infra-price-card">
        <div class="infra-price-faixa">${esc(p.faixa)}</div>
        <div class="infra-price-titulo">${esc(p.titulo)}</div>
        <p class="infra-price-desc">${esc(p.desc)}</p>
        <p class="infra-price-ex">${esc(p.exemplo)}</p>
    </div>`;
  }
  function pipelineStep(s) {
    const cls = s.marca ? ` is-${s.marca}` : "";
    const tag = s.marca === "infra" ? `<span class="infra-step-tag">infra</span>` : s.marca === "scale" ? `<span class="infra-step-tag is-scale">escala</span>` : "";
    return `<li class="infra-step${cls}">
        <div class="infra-step-head"><span class="infra-step-num">${esc(s.num)}</span>${tag}</div>
        <div class="infra-step-nome">${esc(s.nome)}</div>
        <div class="infra-step-ev">${esc(s.eventos)}</div>
        <div class="infra-step-owner">${esc(s.owner)}</div>
        <p class="infra-step-nota">${esc(s.nota)}</p>
    </li>`;
  }
  function render$7() {
    document.title = "Infraestrutura — Arte Longa";
    setPageSEO({
      title: "Infraestrutura — Arte Longa",
      description: "A infraestrutura da rede: o que está no ar, preço por caso de uso, o fluxo do contato à escala e quando migrar pra um serviço dedicado.",
      url: "/infra/"
    });
    const costFmt = INFRA_COST.value.toLocaleString("pt-BR");
    document.body.innerHTML = `
        ${siteHeader()}
        <main class="main infra-main">
            <h1 class="infra-title">Infraestrutura</h1>
            <p class="infra-lede">A <strong>infraestrutura da rede</strong> — o que está no ar, quanto custa por caso de uso,
                e como um parceiro vai <strong>do contato à escala</strong> sobre ela. Computação em Fly (região <code>gru</code>, São Paulo),
                DNS na Hostinger, site público em GitHub Pages. Orçamento de infra: <strong>R$&nbsp;${esc(costFmt)}/mês</strong>
                (${esc(INFRA_COST.label.toLowerCase())}).</p>

            <section class="infra-section">
                <h2 class="infra-h2">No ar &amp; preço por caso de uso</h2>
                <p class="infra-section-lede">Os serviços no ar hoje e a faixa de preço de cada caso de uso —
                    de um subdomínio que dorme (≈US$0) à rede compartilhada (~US$4), até um cliente dedicado de alta demanda (~US$150).
                    O ponto-chave: <strong>o custo marginal de cada novo site na rede compartilhada ≈ zero</strong>.</p>

                <div class="infra-prices">
                    ${PRICE_BANDS.map(priceCard).join("")}
                </div>

                <div class="infra-table-wrap">
                    <table class="infra-table">
                        <thead><tr>
                            <th>App</th><th>O que serve</th><th>Tecnologia</th><th>Máquina</th><th>Onde roda</th><th>Estado</th>
                        </tr></thead>
                        <tbody>${DEPLOYS.map(deployRow).join("")}</tbody>
                    </table>
                </div>
            </section>

            <section class="infra-section">
                <h2 class="infra-h2">Fluxo: do contato à escala</h2>
                <p class="infra-section-lede">A jornada de <em>“recebeu um email”</em> a <em>“site no ar em domínio próprio sobre HTTPS”</em>,
                    modelada como 21 eventos (<code>e0</code>–<code>e20</code>) em seis estágios, cada um com um time responsável.
                    A <strong class="infra-mark-infra">infra entra na entrada no ar</strong> (⑤);
                    a <strong class="infra-mark-scale">escala</strong> acontece quando cada site vira uma nova fonte de contato (⑥).</p>
                <ol class="infra-pipeline">
                    ${PIPELINE.map(pipelineStep).join("")}
                </ol>
            </section>

            <section class="infra-section infra-scale">
                <h2 class="infra-h2">Escalabilidade · quando trocar de serviço</h2>
                <p class="infra-section-lede">Quando um caso de uso cresce além do conjunto de ferramentas compartilhado, escalamos —
                    e, no limite, migramos pra um serviço dedicado. O estudo de caso da <strong>AWS</strong> mostra
                    como e quando fazer isso.</p>
                <div class="infra-scale-box">
                    <ul class="infra-scale-metrics">
                        ${AWS_STUDY.metricas.map((m) => `<li>${esc(m)}</li>`).join("")}
                    </ul>
                    <p class="infra-scale-cta">
                        <a class="infra-scale-link" href="${esc(AWS_STUDY.urlPt)}">Ler o estudo de caso AWS →</a>
                        <a class="infra-scale-link-alt" href="${esc(AWS_STUDY.urlEn)}">(English version)</a>
                    </p>
                </div>
            </section>

            <a class="back" href="/">← voltar ao início</a>
        </main>
        ${siteFooter()}
    `;
  }
  const infra = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    render: render$7
  }, Symbol.toStringTag, { value: "Module" }));
  function mdInline(s) {
    return esc(s).replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, label, title) => {
      const t = title ?? label;
      return `<a href="#" class="al-em-breve" data-modal-title="${t}">${label}</a>`;
    }).replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
      const href = url.replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"');
      const external = /^https?:\/\//.test(href);
      return `<a href="${href}"${external ? ' target="_blank" rel="noopener"' : ""}>${text}</a>`;
    }).replace(/\*([^*\n]+)\*/g, "<em>$1</em>");
  }
  const REDE_EMAIL$2 = "rede@artelonga.com.br";
  async function render$6() {
    var _a;
    const handle = document.body.dataset["handle"] ?? "";
    const AL = window.AL;
    const raw = AL.get(handle);
    if (!raw) {
      document.body.innerHTML = `<main class="main"><p>Perfil não encontrado.</p></main>`;
      return;
    }
    let p;
    if (raw.type === "solution") {
      const sol = raw;
      const fullBio = (sol.desc ?? "") + (sol.descLong ? "\n\n" + sol.descLong : "");
      const siteUrl = sol.externalUrl ?? (typeof sol.url === "string" && /^https?:\/\//.test(sol.url) ? sol.url : void 0);
      const servicos2 = sol.bundledServices === "*" ? [] : sol.bundledServices ?? [];
      const emBreve = sol.platforms ? sol.platforms.every((pl) => pl.status === "wip") : false;
      const solProfile = { handle: sol.handle, type: sol.type, nome: sol.nome, bio: fullBio, servicos: servicos2, emBreve };
      if (sol.tagline !== void 0) solProfile.role = sol.tagline;
      if (siteUrl !== void 0) solProfile.site = siteUrl;
      p = solProfile;
    } else {
      const entity = raw;
      p = entity;
      const computedSite = entity.type !== "community" ? entity.site ?? entity.externalUrl : entity.site ?? entity.externalUrl;
      if (computedSite !== void 0) p.site = computedSite;
    }
    document.title = `${p.nome} — Arte Longa`;
    document.body.classList.toggle("em-memoria-profile", !!p.emMemoria);
    const { html: counterHtml, tick: tickFn } = makeCounter(p);
    const bioHtmlOut = bioFull(p.bio);
    const bioHiddenHtml = p.bioHidden ? `<details class="profile-bio-hidden"><summary>[...]</summary><p>${esc(p.bioHidden)}</p></details>` : "";
    const bioAudioHtml = p.bioAudio ? `<div class="profile-bio-audio">
            <button type="button" class="bio-audio-btn" aria-label="Tocar bio em áudio" data-state="paused">
                <span class="bio-audio-icon" aria-hidden="true"></span>
                <span class="bio-audio-label">Ouvir</span>
            </button>
            <audio class="bio-audio-el" preload="metadata" src="${esc(p.bioAudio)}"></audio>
        </div>` : "";
    const emBreveNote = p.emBreve ? `<div class="em-breve-note">Perfil em breve.</div>` : "";
    const emMemoriaNote = p.emMemoria ? `<div class="em-memoria-note"><em>em memória</em></div>` : "";
    const underageNote = p.underage ? `<div class="em-memoria-note"><em>perfil sob responsabilidade parental</em></div>` : "";
    const isCommunity = p.type === "community";
    const BASE_URL2 = "https://artelonga.com.br";
    const ogImage = p.pic ? p.pic.startsWith("http") ? p.pic : `${BASE_URL2}${p.pic}` : OG_DEFAULT_IMAGE;
    const bioDesc = p.bio ? p.bio.replace(/\n/g, " ").slice(0, 200) : void 0;
    setPageSEO({
      title: `${p.nome} — Arte Longa`,
      ...bioDesc ? { description: bioDesc } : {},
      url: `/${p.handle}/`,
      ogImage,
      ogType: "profile",
      jsonLd: isCommunity ? {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": p.nome,
        "url": `${BASE_URL2}/${p.handle}/`,
        ...ogImage !== OG_DEFAULT_IMAGE ? { "logo": ogImage } : {}
      } : {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": p.nome,
        "url": `${BASE_URL2}/${p.handle}/`,
        "image": ogImage,
        ...p.role ? { "jobTitle": p.role } : {},
        "worksFor": { "@type": "Organization", "name": "Arte Longa", "url": BASE_URL2 }
      }
    });
    const legadoCase = p.aposentado ?? p.emMemoria;
    const servicoLabel = isCommunity ? "Missões" : legadoCase ? "Legado" : "Serviços";
    const servicoHint = isCommunity ? "comunidade oferece via serviços" : p.emMemoria ? "serviços prestados · em memória" : p.aposentado ? "serviços prestados · aposentado" : "clique para ver no catálogo";
    const missoesHtml = p.underage || !((_a = p.servicos) == null ? void 0 : _a.length) ? "" : `<section class="section missoes-section">
                 <h2>${servicoLabel} <span class="section-hint">${servicoHint}</span></h2>
                 <ul>${p.servicos.map((m) => `<li>${missaoLink(m)}</li>`).join("")}</ul>
               </section>`;
    const essaysHtml = buildEssaysHtml(p);
    const poemasHtml = buildPoemasHtml(p);
    const citacoesHtml = buildCitacoesHtml(p);
    const homeLinksHtml = buildHomeLinksHtml(p);
    const membrosHtml = buildMembrosHtml(p);
    const comunidadesHtml = buildComunidadesHtml(p);
    const contactHtml = buildContactHtml(p);
    const parceriasHtml = buildParceriasHtml(p);
    const avatarHtml = avatarLg({ type: p.type !== "community" ? "person" : "community", nome: p.nome, pic: p.pic });
    document.body.innerHTML = `
        ${siteHeader()}
        <main class="main">
            <div class="profile-hero">
                ${avatarHtml}
                <div>
                    <h1 class="profile-name">${esc(p.nome)}</h1>
                    ${p.role ? `<div class="profile-role">${esc(p.role)}</div>` : ""}
                    ${counterHtml}
                    ${p.bioTitle ? `<h2 class="profile-bio-title">${esc(p.bioTitle)}</h2>` : ""}
                    ${bioHiddenHtml}
                    ${bioAudioHtml}
                    ${bioHtmlOut}
                </div>
            </div>
            ${emBreveNote}
            ${emMemoriaNote}
            ${underageNote}
            ${homeLinksHtml}
            ${missoesHtml}
            ${citacoesHtml}
            ${poemasHtml}
            ${essaysHtml}
            ${membrosHtml}
            ${parceriasHtml}
            ${comunidadesHtml}
            ${contactHtml}
            <a class="back" href="/">← voltar</a>
        </main>
        ${siteFooter()}
    `;
    if (tickFn) tickFn();
    void injectBacklinks(handle);
  }
  const BACKLINKS_MAX = 10;
  async function injectBacklinks(handle) {
    let entries;
    try {
      const resp = await fetch("/assets/backlinks.json");
      if (!resp.ok) return;
      const data = await resp.json();
      entries = data[handle] ?? [];
    } catch {
      return;
    }
    if (!entries.length) return;
    const html = buildBacklinksHtml(entries);
    const back = document.querySelector("a.back");
    if (back) back.insertAdjacentHTML("beforebegin", html);
  }
  function backlinksUrl(e) {
    if (e.type === "service") return `/servicos/${esc(e.from)}/`;
    if (e.type === "mission") return `/missoes/${esc(e.from)}/`;
    return `/${esc(e.from)}/`;
  }
  function backlinkTypeLabel(type) {
    const map = {
      service: "serviço",
      person: "pessoa",
      community: "comunidade",
      mission: "missão",
      solution: "solução"
    };
    return map[type] ?? type;
  }
  function buildBacklinksHtml(entries) {
    const visible = entries.slice(0, BACKLINKS_MAX);
    const items = visible.map((e) => {
      const label = backlinkTypeLabel(e.type);
      return `<li><a href="${backlinksUrl(e)}">${esc(e.nome)}</a> <span class="section-hint">${label}</span></li>`;
    }).join("");
    const extra = entries.length > BACKLINKS_MAX ? ` <span class="section-hint">+${entries.length - BACKLINKS_MAX} mais</span>` : "";
    const count = entries.length;
    return `<section class="section backlinks-section">
        <details class="backlinks-details">
            <summary>Mencionado em <strong>${count}</strong> referência${count !== 1 ? "s" : ""}${extra}</summary>
            <ul class="backlinks-list">${items}</ul>
        </details>
    </section>`;
  }
  function missaoLink(titulo) {
    return `<a class="missao-link" href="/servicos/?q=${encodeURIComponent(titulo)}">${esc(titulo)} <span class="missao-arrow">→ serviços</span></a>`;
  }
  function bioFull(bio) {
    if (!bio) return `<p class="profile-bio empty">Biografia em breve.</p>`;
    const blocks = bio.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
    return blocks.map((block) => {
      const lines = block.split("\n");
      if (lines.every((l) => /^>\s?/.test(l))) {
        const inner = lines.map((l) => l.replace(/^>\s?/, "")).join("\n");
        return `<blockquote class="profile-bio profile-bio-quote">${mdInline(inner).replace(/\n/g, "<br>")}</blockquote>`;
      }
      return `<p class="profile-bio">${mdInline(block).replace(/\n/g, "<br>")}</p>`;
    }).join("");
  }
  function makeCounter(p) {
    if (!p.birthDate) return { html: "", tick: null };
    if (p.emMemoria) {
      if (!p.deathDate) return { html: "", tick: null };
      const birth = new Date(p.birthDate);
      const death = new Date(p.deathDate);
      const years = Math.floor((death.getTime() - birth.getTime()) / (365.25 * 24 * 3600 * 1e3));
      return {
        html: `<div class="profile-counter-static">${years} anos · ${birth.getFullYear()}—${death.getFullYear()} · em memória</div>`,
        tick: null
      };
    }
    const birthDate = p.birthDate;
    const html = `<div class="profile-counter" data-birth="${esc(birthDate)}"></div>`;
    return { html, tick: () => tickCounter(birthDate) };
  }
  function tickCounter(birthStr) {
    const precision = (() => {
      if (!birthStr.includes("T")) return "day";
      const t = (birthStr.split("T")[1] ?? "").replace(/[Z+-].*$/, "");
      const colons = (t.match(/:/g) ?? []).length;
      return colons >= 2 ? "second" : colons === 1 ? "minute" : "hour";
    })();
    const birth = new Date(birthStr);
    const el = document.querySelector(`.profile-counter[data-birth="${CSS.escape(birthStr)}"]`);
    if (!el) return;
    const renderAge = () => {
      const now = /* @__PURE__ */ new Date();
      let y = now.getFullYear() - birth.getFullYear();
      let mo = now.getMonth() - birth.getMonth();
      let d = now.getDate() - birth.getDate();
      let h = now.getHours() - birth.getHours();
      let mi = now.getMinutes() - birth.getMinutes();
      let se = now.getSeconds() - birth.getSeconds();
      if (se < 0) {
        se += 60;
        mi -= 1;
      }
      if (mi < 0) {
        mi += 60;
        h -= 1;
      }
      if (h < 0) {
        h += 24;
        d -= 1;
      }
      if (d < 0) {
        const pm = new Date(now.getFullYear(), now.getMonth(), 0);
        d += pm.getDate();
        mo -= 1;
      }
      if (mo < 0) {
        mo += 12;
        y -= 1;
      }
      const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
      const parts = [`${y} anos`, plural(mo, "mês", "meses"), plural(d, "dia", "dias")];
      if (precision === "second")
        parts.push(`${String(h).padStart(2, "0")}h${String(mi).padStart(2, "0")}m${String(se).padStart(2, "0")}s`);
      else if (precision === "minute")
        parts.push(`${String(h).padStart(2, "0")}h${String(mi).padStart(2, "0")}`);
      else if (precision === "hour")
        parts.push(`${h}h`);
      el.textContent = parts.join(" · ");
    };
    renderAge();
    setInterval(renderAge, precision === "second" ? 1e3 : 6e4);
  }
  function buildEssaysHtml(p) {
    var _a;
    if (!((_a = p.essays) == null ? void 0 : _a.length)) return "";
    const allPending = p.essays.every((e) => !e.short && !e.long && !e.titulo);
    const items = p.essays.map((e, i) => {
      const num = String(i + 1).padStart(2, "0");
      const tituloHtml = e.titulo ? esc(e.titulo) : `<span class="essay-pending">(título em breve)</span>`;
      const shortHtml = e.short ? `<a href="${esc(e.short)}">curto</a>` : `<span class="essay-pending">curto</span>`;
      const longHtml = e.long ? `<a href="${esc(e.long)}">longo</a>` : `<span class="essay-pending">longo</span>`;
      return `<li>
                <span class="essay-num">${num}</span>
                <span class="essay-titulo">${tituloHtml}</span>
                <span class="essay-formats">${shortHtml} · ${longHtml}</span>
            </li>`;
    }).join("");
    return `<section class="section essays-section">
        <h2>${esc(p.essaysTitle ?? "Ensaios")} <span class="section-hint">${allPending ? "em breve" : "curto e longo"}</span></h2>
        <ul class="essays-list">${items}</ul>
    </section>`;
  }
  function buildPoemasHtml(p) {
    const AL = window.AL;
    const authorPoems = AL.poemsByAuthor ? AL.poemsByAuthor(p.handle) : [];
    if (!authorPoems.length) return "";
    const items = authorPoems.map((pm) => `<li><a href="/${esc(p.handle)}/${esc(pm.slug)}/">${esc(pm.titulo)} →</a></li>`).join("");
    return `<section class="section poemas-section">
        <h2>Poemas</h2>
        <ul class="poemas-list">${items}</ul>
    </section>`;
  }
  function buildCitacoesHtml(p) {
    var _a;
    if (!((_a = p.citacoes) == null ? void 0 : _a.length)) return "";
    const AL = window.AL;
    const items = p.citacoes.map((c) => {
      let autorHtml = "";
      const autorEntity = c.autor ? AL.get(c.autor) : void 0;
      if (autorEntity) {
        autorHtml = `<a href="/${esc(autorEntity.handle)}/">${esc(autorEntity.nome)}</a>`;
      } else if (c.autorEmBreve) {
        autorHtml = `<a href="#" class="al-em-breve" data-modal-title="${esc(c.autorEmBreve.title)}">${esc(c.autorNome ?? c.autorEmBreve.title)}</a>`;
      } else if (c.autorNome) {
        autorHtml = esc(c.autorNome);
      }
      const obraHtml = c.url ? `<a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.obra ?? c.url)}</a>` : c.obra ? esc(c.obra) : "";
      const parts = [autorHtml, obraHtml, c.data ? esc(c.data) : ""].filter(Boolean);
      return `<blockquote class="citacao">
                <p class="citacao-texto">${mdInline(c.texto)}</p>
                <footer class="citacao-attrib">— ${parts.join(", ")}</footer>
            </blockquote>`;
    }).join("");
    return `<section class="section citacoes-section"><h2>Citações</h2>${items}</section>`;
  }
  function buildHomeLinksHtml(p) {
    var _a;
    if (!((_a = p.homeLinks) == null ? void 0 : _a.length)) return "";
    return `<section class="section home-links-section">
        <h2>Navegação</h2>
        <ul class="home-links-list">${p.homeLinks.map((l) => `<li><a href="${esc(l.url)}">${esc(l.label)}</a></li>`).join("")}</ul>
    </section>`;
  }
  function buildMembrosHtml(p) {
    const AL = window.AL;
    const subHandles = p.type === "community" ? p.membros : p.subMembers;
    if (!(subHandles == null ? void 0 : subHandles.length)) return "";
    const subs = subHandles.map((h) => AL.get(h)).filter(Boolean);
    return `<section class="section">
        <h2>Membros</h2>
        <ul>${subs.map((s) => `<li><a href="/${esc(s.handle)}/">${esc(s.nome)}</a></li>`).join("")}</ul>
    </section>`;
  }
  function buildComunidadesHtml(p) {
    var _a;
    if (!((_a = p.communities) == null ? void 0 : _a.length)) return "";
    const AL = window.AL;
    return `<section class="section">
        <h2>Comunidades</h2>
        <ul>${p.communities.map((h) => {
      const c = AL.get(h);
      return c ? `<li><a href="/${esc(c.handle)}/">${esc(c.nome)}</a></li>` : "";
    }).join("")}</ul>
    </section>`;
  }
  function buildContactHtml(p) {
    if (p.referenceOnly) return "";
    if (p.site) {
      return `<section class="section"><h2>Contato e Parcerias</h2><ul><li><a href="${esc(p.site)}" target="_blank" rel="noopener">${esc(p.site)}</a></li></ul></section>`;
    }
    return `<section class="section"><h2>Contato e Parcerias</h2><ul><li><span class="email-display">${REDE_EMAIL$2}</span></li></ul></section>`;
  }
  function buildParceriasHtml(p) {
    var _a;
    if (!((_a = p.parcerias) == null ? void 0 : _a.length)) return "";
    const AL = window.AL;
    return p.parcerias.map((par) => {
      const parceiro = AL.get(par.de);
      const nomeP = parceiro ? parceiro.nome : par.de;
      const contribs = (par.contribuicoes ?? []).map((c) => {
        const quem = AL.get(c.quem);
        const link = quem ? `<a href="/${esc(c.quem)}/">${esc(quem.nome)}</a>` : esc(c.quem);
        return `<li><strong>${link}</strong> — ${esc(c.oque)}</li>`;
      }).join("");
      return `<section class="section parceria-section">
                <h2>Parceria · ${esc(nomeP)} <span class="section-hint">${esc(par.tipo)}</span></h2>
                <p class="parceria-desc">${esc(par.descricao ?? "")}</p>
                <ul class="parceria-contribs">${contribs}</ul>
            </section>`;
    }).join("");
  }
  const profile = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    render: render$6
  }, Symbol.toStringTag, { value: "Module" }));
  const EXEMPLOS = {
    "Desenvolvimento Web": [{ name: "Quilombo Araucária", url: "/quilomboaraucaria/" }],
    "Design": [{ name: "Quilombo Araucária", url: "/quilomboaraucaria/" }],
    "Desenvolvimento de API": [{ name: "Quilombo Araucária", url: "/quilomboaraucaria/" }],
    "Privacidade e Segurança": [{ name: "Quilombo Araucária", url: "/quilomboaraucaria/" }],
    "Criação de Conteúdo": [{ name: "Quilombo Araucária", url: "/relatos/" }]
  };
  function render$5() {
    const slug = document.body.dataset["slug"] ?? "";
    const AL = window.AL;
    const s = AL.serviceBySlug(slug);
    if (!s) {
      document.body.innerHTML = `<main class="main"><p>Serviço não encontrado.</p><a class="back" href="/">← voltar</a></main>`;
      return;
    }
    document.title = `${s.nome ?? s.titulo} — Serviços — Arte Longa`;
    const BASE_URL2 = "https://artelonga.com.br";
    const desc = s.descNossa ?? s.summary;
    setPageSEO({
      title: `${s.nome ?? s.titulo} — Arte Longa`,
      ...desc ? { description: desc } : {},
      url: `/servicos/${s.slug ?? ""}/`,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "Service",
        "name": s.titulo,
        ...desc ? { "description": desc } : {},
        "provider": {
          "@type": "Organization",
          "name": "Arte Longa",
          "url": BASE_URL2
        },
        "areaServed": "Brasil",
        "serviceType": s.titulo
      }
    });
    const respEntities = (s.responsavel ?? []).map((h) => AL.get(h)).filter((e) => e !== void 0 && e.type !== "solution");
    const respLinks = respEntities.map((e) => {
      const url = e.externalUrl ? e.externalUrl : `/${e.handle}/`;
      const attr = e.externalUrl ? ` target="_blank" rel="noopener"` : "";
      return `<a href="${url}"${attr}>${esc(e.nome)}</a>`;
    }).join(", ");
    const faixa = AL.computeFaixaPreco(s);
    const metaHtml = buildMetaHtml(s, faixa);
    const formulaHtml = faixa.formula ? `<div class="svc-formula">${esc(faixa.formula)}</div>` : "";
    const planosHtml = buildPlanosHtml(faixa.planos);
    const related = AL.relatedServices(s.titulo);
    const relHtml = related.length ? `<ul class="service-related">${related.map((r) => `<li><a href="/servicos/${esc(r.slug ?? "")}/">${esc(r.titulo)}</a></li>`).join("")}</ul>` : "";
    const descText = s.descNossa ?? s.summary;
    const summaryHtml = descText ? `<p class="service-summary">${esc(descText)}</p>` : "";
    const attachmentsHtml = buildAttachmentsHtml(s);
    const respAtivos = respEntities.filter((p) => !AL.isInactive(p.handle));
    const fallbackCtUrl = `/contato/?servico=${encodeURIComponent(s.titulo)}`;
    const provedoresHtml = respAtivos.length ? `<div class="provedores">${respAtivos.map((p) => provedorCard(p, s)).join("")}</div>` : `<p class="svc-cta"><a class="svc-cta-btn" href="${fallbackCtUrl}">Falar conosco →</a></p>`;
    const allServices = AL.publicServices();
    const childServices = (s.children ?? []).map((t) => allServices.find((x) => x.titulo === t)).filter((c) => c !== void 0);
    const subServicosHtml = childServices.length ? `<div class="section-header"><h2>Sub-serviços</h2><span class="label">${childServices.length} variantes</span></div>
           <ul class="svc-children">${childServices.map((c) => childCard(c)).join("")}</ul>` : "";
    const exemplos = EXEMPLOS[s.titulo] ?? [];
    const exemplosHtml = exemplos.length ? `<ul class="svc-exemplos">${exemplos.map((e) => `<li><a href="${esc(e.url)}">${esc(e.name)} →</a></li>`).join("")}</ul>` : `<p class="svc-exemplos-empty">Em breve.</p>`;
    document.body.innerHTML = `
        ${siteHeader()}
        <main class="main">
            <div class="service-crumb"><a href="/servicos/">← Rede</a></div>
            <h1 class="service-title">${esc(s.titulo)}</h1>
            ${metaHtml}
            ${formulaHtml}
            ${planosHtml}
            <div class="service-resp">Por ${respLinks}</div>
            ${summaryHtml}
            ${attachmentsHtml}
            ${provedoresHtml}
            ${subServicosHtml}
            <div class="section-header"><h2>Exemplos</h2><span class="label">trabalhos da rede</span></div>
            ${exemplosHtml}
            ${related.length ? `<div class="section-header"><h2>Veja também</h2><span class="label">serviços relacionados</span></div>${relHtml}` : ""}
            <a class="back" href="/">← voltar pra home</a>
        </main>
        ${siteFooter()}
    `;
  }
  function buildMetaHtml(s, faixa) {
    const parts = [];
    if (s.paraQuem) parts.push(`<span class="svc-meta-chunk">${esc(s.paraQuem)}</span>`);
    if (faixa.preco && !faixa.planos) {
      parts.push(`<span class="svc-meta-chunk svc-meta-price">${esc(faixa.preco)}</span>`);
    }
    return parts.length ? `<div class="svc-meta">${parts.join(`<span class="svc-meta-sep">·</span>`)}</div>` : "";
  }
  function buildPlanosHtml(planos) {
    if (!planos) return "";
    return `<ul class="svc-planos">${planos.map((p) => {
      const cls = p.consult ? "is-consult" : "";
      const formulaText = p.formula ?? "orçamento personalizado";
      return `<li class="${cls}">
                <div class="svc-plano-label">${esc(p.label)}</div>
                <div class="svc-plano-preco">${esc(p.preco)}</div>
                <div class="svc-plano-formula">${esc(formulaText)}</div>
            </li>`;
    }).join("")}</ul>`;
  }
  function buildAttachmentsHtml(s) {
    var _a;
    if (!((_a = s.attachments) == null ? void 0 : _a.length)) return "";
    return `<div class="section-header"><h2>Material</h2><span class="label">download</span></div>
       <ul class="service-attachments">${s.attachments.map((a) => `<li><a href="${esc(a.url)}" target="_blank" rel="noopener" class="attachment-link">
             <span class="att-kind">${esc((a.kind ?? "arquivo").toUpperCase())}</span>
             <span class="att-label">${esc(a.label)}</span>
             <span class="att-arrow">baixar →</span>
           </a></li>`).join("")}</ul>`;
  }
  function provedorCard(p, s) {
    const AL = window.AL;
    const url = p.externalUrl ? p.externalUrl : `/${p.handle}/`;
    const c = ("contacts" in p ? p.contacts : void 0) ?? {};
    const role = p.role ? `<div class="provedor-role">${esc(p.role)}</div>` : "";
    const tag = c.tagline ? `<p class="provedor-tagline">${esc(c.tagline)}</p>` : "";
    const actions = [];
    if (c.whatsapp) {
      const waUrl = `https://wa.me/${esc(c.whatsapp)}?text=${encodeURIComponent("Olá " + p.nome + ", vim pelo serviço " + s.titulo + ".")}`;
      const display = c.whatsappDisplay ? esc(c.whatsappDisplay) : "WhatsApp";
      actions.push(`<a class="svc-cta-btn svc-cta-wa" href="${waUrl}" target="_blank" rel="noopener">
            ${svgWhatsApp()}<span>WhatsApp ${display}</span>
        </a>`);
    }
    if (c.instagram) {
      const igUrl = `https://instagram.com/${esc(c.instagram)}`;
      actions.push(`<a class="provedor-ig" href="${igUrl}" target="_blank" rel="noopener">
            ${svgInstagram()}<span>@${esc(c.instagram)}</span>
        </a>`);
    }
    if (!c.whatsapp) {
      const ctUrl = `/contato/?servico=${encodeURIComponent(s.titulo)}&parceiro=${encodeURIComponent(p.nome)}`;
      actions.unshift(`<a class="svc-cta-btn" href="${ctUrl}">Falar conosco →</a>`);
    }
    if (!AL.isInactive(p.handle)) ;
    return `<div class="provedor-card">
        <div class="provedor-head">
            <a class="provedor-nome" href="${url}">${esc(p.nome)}</a>
            ${role}
        </div>
        ${tag}
        <div class="provedor-actions">${actions.join("")}</div>
    </div>`;
  }
  function childCard(c) {
    const AL = window.AL;
    const f = AL.computeFaixaPreco(c);
    const respList = (c.responsavel ?? []).map((h) => {
      const e = AL.get(h);
      return e ? esc(e.nome) : esc(h);
    }).join(", ");
    const precoLine = f.preco ? `<span class="svc-child-preco">${esc(f.preco)}</span>` : f.planos ? `<span class="svc-child-preco">${f.planos.length} planos</span>` : "";
    return `<li>
        <a href="/servicos/${esc(c.slug ?? "")}/" class="svc-child-link">
            <span class="svc-child-titulo">${esc(c.titulo)}</span>
            ${c.paraQuem ? `<span class="svc-child-meta">${esc(c.paraQuem)}</span>` : ""}
            ${precoLine}
            <span class="svc-child-resp">${respList}</span>
        </a>
    </li>`;
  }
  function svgWhatsApp() {
    return `<svg class="svc-cta-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M20.52 3.48A11.94 11.94 0 0 0 12.06 0C5.5 0 .15 5.34.15 11.91c0 2.1.55 4.15 1.6 5.96L0 24l6.27-1.65a11.9 11.9 0 0 0 5.79 1.5h.01c6.56 0 11.91-5.34 11.91-11.91 0-3.18-1.24-6.17-3.46-8.46zM12.06 21.7h-.01a9.8 9.8 0 0 1-5-1.37l-.36-.21-3.72.98 1-3.62-.24-.37a9.78 9.78 0 1 1 18.13-5.2c0 5.4-4.4 9.79-9.8 9.79zm5.36-7.32c-.29-.15-1.74-.86-2-.96-.27-.1-.46-.15-.66.15-.19.29-.76.96-.93 1.16-.17.19-.34.22-.63.07-.29-.15-1.24-.46-2.36-1.46-.87-.78-1.46-1.74-1.63-2.03-.17-.29-.02-.45.13-.6.13-.13.29-.34.43-.51.15-.17.19-.29.29-.48.1-.19.05-.36-.02-.51-.07-.15-.66-1.6-.91-2.18-.24-.57-.48-.49-.66-.5h-.56c-.19 0-.5.07-.77.36-.27.29-1.02 1-1.02 2.43 0 1.43 1.05 2.81 1.2 3 .15.19 2.07 3.16 5.01 4.43.7.3 1.25.48 1.68.62.7.22 1.34.19 1.85.12.56-.08 1.74-.71 1.99-1.4.24-.69.24-1.27.17-1.4-.07-.13-.27-.21-.56-.36z"/></svg>`;
  }
  function svgInstagram() {
    return `<svg class="svc-cta-icon" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.05.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.05.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.05-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.05-.36 2.23-.41 1.27-.06 1.65-.07 4.85-.07M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.3-1.46.71-2.13 1.38S.93 3.35.63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.3.79.71 1.46 1.38 2.13.67.67 1.34 1.08 2.13 1.38.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56.79-.3 1.46-.71 2.13-1.38.67-.67 1.08-1.34 1.38-2.13.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91-.3-.79-.71-1.46-1.38-2.13C21.32 1.32 20.65.91 19.86.61c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32zm0 10.16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z"/></svg>`;
  }
  const service = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    render: render$5
  }, Symbol.toStringTag, { value: "Module" }));
  function render$4() {
    const slug = document.body.dataset["slug"] ?? "";
    const AL = window.AL;
    const poem2 = AL.poemBySlug(slug);
    if (!poem2) {
      document.body.innerHTML = `<main class="main"><p>Poema não encontrado.</p><a class="back" href="/">← voltar</a></main>`;
      return;
    }
    const author = poem2.autor ? AL.get(poem2.autor) : void 0;
    document.title = `${poem2.titulo}${author ? " — " + author.nome : ""} — Arte Longa`;
    const BASE_URL2 = "https://artelonga.com.br";
    setPageSEO({
      title: `${poem2.titulo}${author ? " — " + author.nome : ""} — Arte Longa`,
      url: author ? `/${author.handle}/${slug}/` : `/`,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        "name": poem2.titulo,
        ...author ? { "author": { "@type": "Person", "name": author.nome, "url": `${BASE_URL2}/${author.handle}/` } } : {}
      }
    });
    const stanzasHtml = poem2.stanzas.map((stz) => `<p class="poem-stanza">${stz.map(esc).join("<br>")}</p>`).join("");
    const authorLine = author ? `<div class="poem-author">por <a href="/${esc(author.handle)}/">${esc(author.nome)}</a></div>` : "";
    const backHref = author ? `/${esc(author.handle)}/` : "/";
    const backLabel = author ? `← voltar a ${esc(author.nome)}` : "← voltar";
    document.body.innerHTML = `
        ${siteHeader()}
        <main class="main poem-page">
            <h1 class="poem-title">${esc(poem2.titulo)}</h1>
            ${authorLine}
            <div class="poem-body">${stanzasHtml}</div>
            <a class="back" href="${backHref}">${backLabel}</a>
        </main>
        ${siteFooter()}
    `;
  }
  const poem = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    render: render$4
  }, Symbol.toStringTag, { value: "Module" }));
  function render$3() {
    var _a;
    const handle = document.body.dataset["handle"] ?? "";
    const slug = document.body.dataset["slug"] ?? "";
    const AL = window.AL;
    const raw = handle ? AL.get(handle) : void 0;
    const person = raw && "portfolio" in raw ? raw : void 0;
    const essay2 = (_a = person == null ? void 0 : person.portfolio) == null ? void 0 : _a.find(
      (item) => item.kind === "essay" && item.slug === slug
    );
    if (!essay2) {
      document.body.innerHTML = `<main class="main"><p>Ensaio não encontrado.</p><a class="back" href="/">← voltar</a></main>`;
      return;
    }
    const backHref = person ? `/${esc(person.handle)}/` : "/";
    const backLabel = person ? `← voltar a ${esc(person.nome)}` : "← voltar";
    document.title = `${essay2.titulo}${person ? " — " + person.nome : ""} — Arte Longa`;
    const BASE_URL2 = "https://artelonga.com.br";
    const essayDesc = essay2.body ? essay2.body.replace(/\n/g, " ").slice(0, 200) : void 0;
    setPageSEO({
      title: `${essay2.titulo}${person ? " — " + person.nome : ""} — Arte Longa`,
      ...essayDesc ? { description: essayDesc } : {},
      url: person ? `/${person.handle}/${slug}/` : `/`,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": essay2.titulo,
        ...person ? { "author": { "@type": "Person", "name": person.nome, "url": `${BASE_URL2}/${person.handle}/` } } : {},
        "publisher": { "@type": "Organization", "name": "Arte Longa", "url": BASE_URL2 }
      }
    });
    const bodyHtml = essay2.body ? `<div class="essay-body">${mdInline(essay2.body)}</div>` : "";
    document.body.innerHTML = `
        ${siteHeader()}
        <main class="main poem-page">
            <h1 class="poem-title">${esc(essay2.titulo)}</h1>
            ${person ? `<div class="poem-author">por <a href="${backHref}">${esc(person.nome)}</a></div>` : ""}
            ${bodyHtml}
            <a class="back" href="${backHref}">${backLabel}</a>
        </main>
        ${siteFooter()}
    `;
  }
  const essay = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    render: render$3
  }, Symbol.toStringTag, { value: "Module" }));
  const CO_LEADS_URL = "https://co.artelonga.com.br/api/v1/leads";
  const REDE_EMAIL$1 = "rede@artelonga.com.br";
  function render$2() {
    const params = new URLSearchParams(location.search);
    const servico = (params.get("servico") ?? "").trim();
    const parceiro = (params.get("parceiro") ?? "").trim();
    const ctxHtml = servico ? `<div class="ct-context" id="ct-context">
                <strong id="ct-context-title">Sobre ${esc(servico)}</strong>${parceiro ? `<span id="ct-context-detail"> · com ${esc(parceiro)}</span>` : ""}
           </div>` : `<div class="ct-context is-hidden" id="ct-context"></div>`;
    const defaultPlaceholder = servico ? `Descreva o que precisa de ${esc(servico)}…` : "Descreva a demanda, contexto, prazo se houver…";
    document.body.innerHTML = `
        ${siteHeader()}
        <main class="main">
            <div class="ct-wrap">
                <h1 class="ct-h1">Descreva o seu problema.</h1>
                <p class="ct-tagline">Encontramos a solução.</p>
                ${ctxHtml}
                <form class="ct-form" id="contato-form" novalidate>
                    <input type="hidden" id="ct-servico-hidden" name="servico_ref" value="${esc(servico)}">
                    <input type="hidden" id="ct-parceiro-hidden" name="parceiro_ref" value="${esc(parceiro)}">
                    <div class="ct-field">
                        <label for="ct-nome">Nome</label>
                        <input type="text" id="ct-nome" name="nome" required autocomplete="name">
                    </div>
                    <div class="ct-field">
                        <label for="ct-precisa">O que você precisa</label>
                        <textarea id="ct-precisa" name="precisa" placeholder="${defaultPlaceholder}" required></textarea>
                    </div>
                    <div class="ct-field">
                        <label>Onde acontece</label>
                        <div class="ct-modo-pills" role="radiogroup" aria-label="Modo">
                            <label><input type="radio" name="modo" value="fisico" checked><span>Físico</span></label>
                            <label><input type="radio" name="modo" value="digital"><span>Digital</span></label>
                        </div>
                        <div class="ct-loc-grid" id="ct-loc-grid">
                            <input type="text" id="ct-estado" name="estado" placeholder="Estado" autocomplete="address-level1">
                            <input type="text" id="ct-cidade" name="cidade" placeholder="Cidade" autocomplete="address-level2">
                            <input type="text" id="ct-bairro" name="bairro" placeholder="Bairro" autocomplete="address-level3">
                        </div>
                    </div>
                    <div class="ct-field">
                        <label>Como prefere ser contatado</label>
                        <div class="ct-radio-group">
                            <label><input type="radio" name="canal" value="email" required><span>Email</span></label>
                            <label><input type="radio" name="canal" value="whatsapp" required><span>WhatsApp</span></label>
                            <label><input type="radio" name="canal" value="outro" required><span>Outro</span></label>
                        </div>
                    </div>
                    <div class="ct-field">
                        <label for="ct-contato">Contato</label>
                        <input type="text" id="ct-contato" name="contato" placeholder="Email, WhatsApp ou link" required>
                    </div>
                    <p class="ct-privacy">Seus dados são armazenados em servidor seguro por até 24 meses. Direitos LGPD: acesso, correção ou deleção em <a href="mailto:${esc(REDE_EMAIL$1)}">${esc(REDE_EMAIL$1)}</a>.</p>
                    <button type="submit" class="ct-submit">Enviar →</button>
                    <div class="ct-fallback" id="ct-fallback">
                        Falha na conexão. <a href="#" id="ct-fallback-link">Clique aqui para enviar por email</a>.
                    </div>
                    <div class="ct-success" id="ct-success">
                        <strong>Recebemos.</strong> Em até 48h alguém da rede entra em contato pelo canal que você passou.
                    </div>
                </form>
                <a class="back" href="/">← voltar</a>
            </div>
        </main>
        ${siteFooter()}
    `;
    wireForm$1(servico, parceiro);
  }
  function wireForm$1(servico, parceiro) {
    const locGrid = document.getElementById("ct-loc-grid");
    document.querySelectorAll('input[name="modo"]').forEach((r) => {
      r.addEventListener("change", () => {
        if (!locGrid) return;
        locGrid.classList.toggle("is-hidden", r.value === "digital" && r.checked);
      });
    });
    const form = document.getElementById("contato-form");
    const successEl = document.getElementById("ct-success");
    const fallbackDiv = document.getElementById("ct-fallback");
    const fallbackLink = document.getElementById("ct-fallback-link");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      void submitForm(form, servico, parceiro, successEl, fallbackDiv, fallbackLink);
    });
  }
  async function submitForm(form, servico, parceiro, successEl, fallbackDiv, fallbackLink) {
    var _a, _b;
    const d = new FormData(form);
    const get = (k) => (d.get(k) ?? "").trim();
    const nome = get("nome");
    const precisaVal = get("precisa");
    const canal = get("canal");
    const contato2 = get("contato");
    if (!nome || !precisaVal || !canal || !contato2) {
      form.reportValidity();
      return;
    }
    const submit = form.querySelector(".ct-submit");
    if (submit) {
      submit.disabled = true;
      submit.textContent = "Enviando…";
    }
    if (fallbackDiv) fallbackDiv.classList.remove("on");
    const canalLabel = canal === "email" ? "Email" : canal === "whatsapp" ? "WhatsApp" : "Outro";
    const modo = get("modo") || "fisico";
    const localLabel = modo === "digital" ? "Digital" : `Físico · ${get("bairro") || "—"} · ${get("cidade") || "—"} · ${get("estado") || "—"}`;
    const mensagem = [
      `Demanda: ${precisaVal}`,
      `Local: ${localLabel}`,
      `Canal preferido: ${canalLabel}`,
      `Contato: ${contato2}`
    ].join("\n");
    const payload = {
      nome: nome || null,
      email: canal === "email" ? contato2 : null,
      telefone: canal === "whatsapp" ? contato2 : null,
      mensagem,
      servico_titulo: servico || null,
      parceiro_handle: parceiro || null
    };
    try {
      const r = await fetch(CO_LEADS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "omit",
        mode: "cors"
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      (_a = window.AL_track) == null ? void 0 : _a.call(window, "lead_submit", { servico: servico || null, parceiro: parceiro || null, channel: canal });
      if (submit) submit.textContent = "Enviado ✓";
      if (successEl) successEl.classList.add("on");
    } catch (err) {
      (_b = window.AL_track) == null ? void 0 : _b.call(window, "lead_submit_failed", { servico: servico || null, parceiro: parceiro || null, channel: canal });
      console.error("lead submit failed:", err);
      if (submit) {
        submit.textContent = "Falhou — tente de novo";
        submit.disabled = false;
      }
      if (fallbackLink) fallbackLink.href = buildMailto(servico, parceiro, nome, precisaVal, localLabel, canalLabel, contato2);
      if (fallbackDiv) fallbackDiv.classList.add("on");
    }
  }
  function buildMailto(servico, parceiro, nome, precisa, localLabel, canalLabel, contato2) {
    const subject = servico ? `Demanda · ${servico} · ${nome}` : `Demanda · ${nome}`;
    const body = [
      `Nome: ${nome}`,
      servico ? `Serviço de interesse: ${servico}` : "",
      parceiro ? `Parceiro de interesse: ${parceiro}` : "",
      `Demanda: ${precisa}`,
      `Local: ${localLabel}`,
      `Canal preferido: ${canalLabel}`,
      `Contato: ${contato2}`
    ].filter(Boolean).join("\n");
    return `mailto:${REDE_EMAIL$1}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }
  const contato = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    render: render$2
  }, Symbol.toStringTag, { value: "Module" }));
  const CO_BASE = "https://co.artelonga.com.br";
  function render$1() {
    document.body.innerHTML = `
        ${siteHeader()}
        <main class="main">
            <div class="entrar-wrap">
                <div id="al-email-step">
                    <h1 class="entrar-h1">Entrar<br>ou Cadastrar</h1>
                    <p class="entrar-sub">Acesse sua conta ou crie uma com o seu email.</p>
                    <form class="fp-form" id="al-signup" novalidate>
                        <p class="fp-form-title">Continue com seu email</p>
                        <div class="fp-field">
                            <label for="email">Email</label>
                            <input type="email" id="email" name="email"
                                   placeholder="email@exemplo.com"
                                   autocomplete="email" required>
                        </div>
                        <button type="submit" class="fp-submit">Continuar →</button>
                        <div id="al-signup-error" class="entrar-error" hidden></div>
                        <div class="entrar-divider" aria-hidden="true">ou</div>
                        <button type="button" class="entrar-google-btn" id="al-google-btn">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            Entrar com Google
                        </button>
                    </form>
                </div>
                <div id="al-code-step" hidden>
                    <div class="fp-form">
                        <p class="fp-form-title">Verifique seu email</p>
                        <p class="fp-form-sub">
                            Enviamos um código de 6 dígitos para
                            <span class="entrar-code-target" id="al-code-target"></span>.
                        </p>
                        <form id="al-verify-form" novalidate>
                            <div class="fp-field">
                                <label for="al-code">Código</label>
                                <input type="text" id="al-code" name="code"
                                       placeholder="000000"
                                       autocomplete="one-time-code"
                                       inputmode="numeric"
                                       maxlength="6" required>
                            </div>
                            <button type="submit" id="al-verify-btn" class="fp-submit">
                                Confirmar →
                            </button>
                            <div id="al-verify-error" class="entrar-error" hidden></div>
                        </form>
                        <div class="entrar-actions">
                            <button type="button" id="al-resend" disabled>Reenviar</button>
                            <span class="entrar-sep" aria-hidden="true">·</span>
                            <button type="button" id="al-edit-email">Editar email</button>
                        </div>
                    </div>
                </div>
                <a class="back" href="/">← voltar</a>
            </div>
        </main>
        ${siteFooter()}
    `;
    checkAuth();
    wireSignup();
  }
  function checkAuth() {
    void (async () => {
      try {
        const r = await fetch(`${CO_BASE}/api/v1/auth/me`, { credentials: "include" });
        if (r.ok) window.location.href = "/";
      } catch {
      }
    })();
  }
  function wireSignup() {
    var _a, _b, _c;
    const form = document.getElementById("al-signup");
    const codeStep = document.getElementById("al-code-step");
    const emailStep = document.getElementById("al-email-step");
    const errEl = document.getElementById("al-signup-error");
    const resendBtn = document.getElementById("al-resend");
    let _email = "";
    let _resendCooldown = null;
    function startResendCooldown() {
      if (!resendBtn) return;
      let secs = 60;
      resendBtn.disabled = true;
      resendBtn.textContent = `Reenviar (${secs}s)`;
      _resendCooldown = setInterval(() => {
        secs -= 1;
        if (secs <= 0) {
          if (_resendCooldown !== null) clearInterval(_resendCooldown);
          resendBtn.disabled = false;
          resendBtn.textContent = "Reenviar";
        } else {
          resendBtn.textContent = `Reenviar (${secs}s)`;
        }
      }, 1e3);
    }
    form == null ? void 0 : form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!errEl) return;
      errEl.hidden = true;
      const emailInput = form.email;
      const email = emailInput.value.trim();
      if (!email.includes("@")) {
        errEl.textContent = "Email inválido";
        errEl.hidden = false;
        return;
      }
      const btn = form.querySelector("button[type=submit]");
      if (!btn) return;
      btn.disabled = true;
      btn.textContent = "Enviando…";
      try {
        const r = await fetch(`${CO_BASE}/api/v1/auth/onboard-with-email`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, origin: "artelonga" })
        });
        if (!r.ok) throw new Error("send failed");
        _email = email;
        track("signup_request", {});
        if (emailStep) emailStep.hidden = true;
        if (codeStep) codeStep.hidden = false;
        const codeTarget = document.getElementById("al-code-target");
        if (codeTarget) codeTarget.textContent = email;
        const codeInput = document.getElementById("al-code");
        if (codeInput instanceof HTMLInputElement) codeInput.focus();
        startResendCooldown();
      } catch {
        errEl.textContent = "Não foi possível enviar. Tente novamente.";
        errEl.hidden = false;
      } finally {
        btn.disabled = false;
        btn.textContent = "Continuar →";
      }
    });
    (_a = document.getElementById("al-verify-form")) == null ? void 0 : _a.addEventListener("submit", async (e) => {
      e.preventDefault();
      const codeInput = document.getElementById("al-code");
      if (!codeInput) return;
      const code = codeInput.value.trim();
      if (code.length !== 6) return;
      const btn = document.getElementById("al-verify-btn");
      if (!btn) return;
      btn.disabled = true;
      btn.textContent = "Verificando…";
      try {
        const r = await fetch(`${CO_BASE}/api/v1/auth/onboard-with-email/verify`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: _email, code })
        });
        if (!r.ok) throw new Error("verify failed");
        track("signup_verify_success", {});
        window.location.href = "/";
      } catch {
        track("signup_verify_failed", {});
        const errEl2 = document.getElementById("al-verify-error");
        if (errEl2) {
          errEl2.textContent = "Código inválido ou expirado.";
          errEl2.hidden = false;
        }
      } finally {
        btn.disabled = false;
        btn.textContent = "Confirmar →";
      }
    });
    (_b = document.getElementById("al-edit-email")) == null ? void 0 : _b.addEventListener("click", () => {
      if (codeStep) codeStep.hidden = true;
      if (emailStep) emailStep.hidden = false;
    });
    resendBtn == null ? void 0 : resendBtn.addEventListener("click", () => {
      if (resendBtn.disabled) return;
      form == null ? void 0 : form.dispatchEvent(new Event("submit"));
    });
    (_c = document.getElementById("al-google-btn")) == null ? void 0 : _c.addEventListener("click", () => {
      track("signup_google_start", {});
      const returnTo = encodeURIComponent(window.location.origin + "/");
      window.location.href = `${CO_BASE}/api/v1/auth/google/start?origin=artelonga&return_to=${returnTo}`;
    });
  }
  function track(name, props) {
    if (typeof window.AL_track === "function") window.AL_track(name, props ?? {});
  }
  const entrar = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    render: render$1
  }, Symbol.toStringTag, { value: "Module" }));
  const REDE_EMAIL = "rede@artelonga.com.br";
  function render() {
    document.body.innerHTML = `
        ${siteHeader()}
        <main class="main">
            <div class="fp-wrap">
                <div>
                    <h1 class="fp-h1">Para parceiros.</h1>
                    <p class="fp-tagline">Te acompanhamos desde o primeiro cliente. Até onde quiser.</p>
                    <p class="fp-loc">Rede de prestadores · Brasil</p>
                </div>

                <section class="fp-how">
                    <h2>Como funciona</h2>
                    <div class="fp-how-grid">
                        <div class="fp-how-tile">
                            <div class="fp-how-num">01</div>
                            <div class="fp-how-titulo">Seu canal direto</div>
                            <div class="fp-how-desc">Cliente fala com você no seu WhatsApp e Instagram. Você decide como se comunicar.</div>
                        </div>
                        <div class="fp-how-tile">
                            <div class="fp-how-num">02</div>
                            <div class="fp-how-titulo">Cobrança flexível</div>
                            <div class="fp-how-desc">Autonomia na negociação. Tarifa-base R$ 100/h é padrão da rede; você define a sua.</div>
                        </div>
                        <div class="fp-how-tile">
                            <div class="fp-how-num">03</div>
                            <div class="fp-how-titulo">Planejem em conjunto</div>
                            <div class="fp-how-desc">Sob demanda · Semanal · Mensal. Quando o volume varia, marca como Sob consulta e fala direto com o cliente.</div>
                        </div>
                        <div class="fp-how-tile">
                            <div class="fp-how-num">04</div>
                            <div class="fp-how-titulo">Catálogo e portfolio</div>
                            <div class="fp-how-desc">Por você, para quem. Clareza durante a busca.</div>
                        </div>
                        <div class="fp-how-tile">
                            <div class="fp-how-num">05</div>
                            <div class="fp-how-titulo">Gestão Arte Longa</div>
                            <div class="fp-how-desc">Executivo, Operacional, Logística, Vendas, Contabilidade, Jurídico, Financeiro, Marketing, Design, Tecnologia, Inteligência — preço especial para parceiros.</div>
                        </div>
                    </div>
                </section>

                <form class="fp-form" id="parceiro-form" novalidate>
                    <div class="fp-form-title">Faça parte da rede</div>
                    <p class="fp-form-sub">
                        O que você faz? Entramos em contato para alinhar o seu lugar na rede.
                    </p>

                    <div class="fp-field">
                        <label for="fp-nome">Nome ou nome artístico</label>
                        <input type="text" id="fp-nome" name="nome" required autocomplete="name">
                    </div>

                    <div class="fp-field">
                        <label for="fp-servico">O que você faz</label>
                        <input type="text" id="fp-servico" name="servico" placeholder="Ex.: Piloto de drone, fotografia, psicologia clínica…" required>
                    </div>

                    <div class="fp-field">
                        <label>Onde você atende</label>
                        <div class="fp-loc-grid">
                            <input type="text" id="fp-estado" name="estado" placeholder="Estado" autocomplete="address-level1" required>
                            <input type="text" id="fp-cidade" name="cidade" placeholder="Cidade" autocomplete="address-level2" required>
                            <input type="text" id="fp-bairro" name="bairro" placeholder="Bairro" autocomplete="address-level3" required>
                        </div>
                    </div>

                    <div class="fp-field">
                        <label>Situação fiscal</label>
                        <div class="fp-radio-group">
                            <label>
                                <input type="radio" name="cnpj" value="possuo" required>
                                <span class="fp-radio-text">
                                    Possuo CNPJ
                                    <span class="fp-radio-sub">MEI · ME · etc.</span>
                                </span>
                            </label>
                            <label>
                                <input type="radio" name="cnpj" value="preciso" required>
                                <span class="fp-radio-text">
                                    Preciso de um CNPJ
                                    <span class="fp-radio-sub">A gente te orienta</span>
                                </span>
                            </label>
                        </div>
                    </div>

                    <div class="fp-field">
                        <label>Como prefere ser contatado</label>
                        <div class="fp-radio-group fp-radio-group-3">
                            <label>
                                <input type="radio" name="canal" value="email" required>
                                <span class="fp-radio-text">Email</span>
                            </label>
                            <label>
                                <input type="radio" name="canal" value="whatsapp" required>
                                <span class="fp-radio-text">WhatsApp</span>
                            </label>
                            <label>
                                <input type="radio" name="canal" value="outro" required>
                                <span class="fp-radio-text">Outro</span>
                            </label>
                        </div>
                    </div>

                    <div class="fp-field">
                        <label for="fp-contato">Contato</label>
                        <input type="text" id="fp-contato" name="contato" placeholder="Email, WhatsApp, ou link" required>
                    </div>

                    <div class="fp-field">
                        <label for="fp-msg">Algo mais que queira contar (opcional)</label>
                        <textarea id="fp-msg" name="mensagem" placeholder="Frase de apresentação, link de portfólio, agenda, qualquer coisa…"></textarea>
                    </div>

                    <button type="submit" class="fp-submit">Faça parte da rede →</button>

                    <div class="fp-success" id="fp-success">
                        <strong>Recebemos.</strong> Vamos entrar em contato pra alinhar seu lugar na rede.
                    </div>
                </form>

                <section class="fp-caminho">
                    <h2>Caminho para sociedade</h2>
                    <p class="fp-caminho-lead">
                        Quem entrega valor consistente vira sócio. Sócio tem
                        <strong>participação nos lucros</strong> e
                        <strong>poder decisório</strong> na gestão da rede,
                        além de pro-labore mensal.
                    </p>

                    <h3 class="fp-sub">Direitos do sócio</h3>
                    <dl class="fp-direitos">
                        <dt>Participação nos lucros</dt>
                        <dd>Distribuída proporcionalmente entre sócios ao fim do exercício.</dd>
                        <dt>Poder decisório</dt>
                        <dd>Voz e voto nas decisões estratégicas, financeiras e de admissão de novos sócios.</dd>
                    </dl>

                    <h3 class="fp-sub">Composição da remuneração mensal</h3>
                    <p class="fp-caminho-lead">
                        Pra dar dimensão: um parceiro típico trabalha cerca de
                        32h/sem × 4 = <strong>128h/mês a R$ 100/h =
                        R$ 12.800 mensais</strong>, distribuídos em quatro frentes.
                    </p>
                    <dl class="fp-breakdown">
                        <dt>R$ 2.000</dt>
                        <dd>Pessoal <span>renda direta</span></dd>
                        <dt>R$ 3.000</dt>
                        <dd>Benefícios <span>autocuidado e família</span></dd>
                        <dt>R$ 5.000</dt>
                        <dd>Impacto <span>social, ambiental e cultural</span></dd>
                        <dt>R$ 2.800</dt>
                        <dd>Reserva <span>folgas, férias e flexibilidade</span></dd>
                    </dl>
                    <p class="fp-caminho-note">
                        A composição é flexível e ajusta ao momento de cada parceiro.
                        Sociedade não é requisito — você pode atuar pela rede sem nunca
                        se tornar sócio.
                    </p>
                </section>

                <a class="back" href="/">← voltar</a>
            </div>
        </main>
        ${siteFooter()}
    `;
    wireForm();
  }
  function wireForm() {
    const form = document.getElementById("parceiro-form");
    const success = document.getElementById("fp-success");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const get = (k) => (data.get(k) ?? "").trim();
      const nome = get("nome");
      const servico = get("servico");
      const estado = get("estado");
      const cidade = get("cidade");
      const bairro = get("bairro");
      const cnpj = get("cnpj");
      const canal = get("canal");
      const contato2 = get("contato");
      const msg = get("mensagem");
      if (!nome || !servico || !estado || !cidade || !bairro || !cnpj || !canal || !contato2) {
        form.reportValidity();
        return;
      }
      const cnpjLabel = cnpj === "possuo" ? "Possuo CNPJ (MEI · ME · etc.)" : "Preciso de um CNPJ";
      const canalLabel = canal === "email" ? "Email" : canal === "whatsapp" ? "WhatsApp" : "Outro";
      const subject = `Faça parte da rede · ${nome}`;
      const body = [
        `Nome: ${nome}`,
        `Serviço: ${servico}`,
        `Local: ${bairro} · ${cidade} · ${estado}`,
        `Situação fiscal: ${cnpjLabel}`,
        `Canal preferido: ${canalLabel}`,
        `Contato: ${contato2}`,
        msg ? `
Mensagem:
${msg}` : ""
      ].filter(Boolean).join("\n");
      const mailto = `mailto:${REDE_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailto;
      if (success) success.classList.add("on");
      const btn = form.querySelector(".fp-submit");
      if (btn) btn.textContent = "Enviado ✓";
    });
  }
  const facaParte = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    render
  }, Symbol.toStringTag, { value: "Module" }));
})();
