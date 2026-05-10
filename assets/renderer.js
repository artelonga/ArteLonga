(function() {
	//#region \0rolldown/runtime.js
	var __defProp = Object.defineProperty;
	var __esmMin = (fn, res) => () => (fn && (res = fn(fn = 0)), res);
	var __exportAll = (all, no_symbols) => {
		let target = {};
		for (var name in all) __defProp(target, name, {
			get: all[name],
			enumerable: true
		});
		if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
		return target;
	};
	//#endregion
	//#region src/lib/esc.ts
	function esc(s) {
		return String(s ?? "").replace(/[&<>"']/g, (c) => ESC_MAP[c] ?? c);
	}
	var ESC_MAP;
	var init_esc = __esmMin((() => {
		ESC_MAP = {
			"&": "&amp;",
			"<": "&lt;",
			">": "&gt;",
			"\"": "&quot;",
			"'": "&#39;"
		};
	}));
	//#endregion
	//#region src/lib/norm.ts
	function norm(s) {
		return String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
	}
	var init_norm = __esmMin((() => {}));
	//#endregion
	//#region src/lib/anglicism.ts
	var ANGLICISM_MAP;
	var init_anglicism = __esmMin((() => {
		ANGLICISM_MAP = {
			cloud: ["nuvem"],
			web: [
				"site",
				"página",
				"pagina",
				"internet"
			],
			software: ["sistema", "programa"],
			data: ["dados"],
			database: ["banco", "dados"],
			storage: ["armazenamento"],
			network: ["rede", "redes"],
			hardware: [
				"máquina",
				"maquina",
				"computador"
			],
			security: ["segurança", "seguranca"],
			privacy: ["privacidade"],
			design: ["design"],
			marketing: ["marketing"],
			branding: ["marca"],
			ux: [
				"experiência",
				"experiencia",
				"usuário",
				"usuario"
			],
			ui: ["interface"],
			api: [
				"api",
				"integração",
				"integracao"
			],
			dev: ["desenvolvimento", "desenvolvedor"],
			developer: ["desenvolvedor", "desenvolvimento"],
			code: [
				"código",
				"codigo",
				"desenvolvimento"
			],
			frontend: [
				"front",
				"interface",
				"web"
			],
			backend: [
				"back",
				"api",
				"servidor"
			],
			fullstack: ["desenvolvimento"],
			saas: [
				"software",
				"sistema",
				"nuvem"
			],
			ai: [
				"inteligência",
				"inteligencia",
				"ia"
			],
			ml: [
				"inteligência",
				"inteligencia",
				"ia"
			],
			analytics: [
				"análise",
				"analise",
				"dados"
			],
			audit: ["auditoria"],
			consulting: ["consultoria"],
			automation: ["automação", "automacao"],
			drone: ["drone", "piloto"],
			photography: ["fotografia", "foto"],
			video: [
				"vídeo",
				"video",
				"filmagem"
			],
			music: [
				"música",
				"musica",
				"produção"
			],
			event: ["evento", "festa"],
			wedding: ["casamento", "evento"],
			burger: ["hambúrguer", "hamburguer"],
			food: [
				"alimentação",
				"alimentacao",
				"comida"
			],
			yoga: ["yoga"],
			meditation: ["meditação", "meditacao"],
			therapy: ["terapia", "psicologia"],
			counseling: ["psicologia", "terapia"],
			psychology: ["psicologia"],
			nutrition: [
				"nutrição",
				"nutricao",
				"nutricional"
			],
			elder: ["idoso", "cuidado"],
			elderly: ["idoso", "cuidado"],
			school: ["ensino", "escolar"],
			tutoring: [
				"reforço",
				"reforco",
				"ensino"
			],
			education: [
				"educação",
				"educacao",
				"ensino"
			],
			translate: ["tradução", "traducao"],
			translation: ["tradução", "traducao"],
			writing: ["escrita"],
			content: ["conteúdo", "conteudo"],
			fashion: ["moda", "stylist"],
			stylist: ["stylist", "moda"],
			drywall: [
				"drywall",
				"construção",
				"construcao"
			],
			construction: ["construção", "construcao"],
			agriculture: ["agro", "agrofloresta"],
			compost: ["compostagem"],
			art: ["arte", "artes"],
			graffiti: ["grafite"],
			mural: ["mural", "fachada"]
		};
	}));
	//#endregion
	//#region src/components/SiteHeader.ts
	function siteHeader() {
		return `<header class="site-header">
        <div class="site-header-inner">
            <a class="site-brand" href="/"><img src="/logo-al.png" alt="Arte Longa"></a>
            <a class="site-cta-parceiros" href="/faca-parte/">Para parceiros →</a>
        </div>
    </header>`;
	}
	var init_SiteHeader = __esmMin((() => {}));
	//#endregion
	//#region src/components/SiteFooter.ts
	function siteFooter() {
		return `<footer class="site-footer">
        <div class="site-footer-inner">
            <a href="/parceiros/">Parceiros</a>
            <span class="sep">·</span>
            <a href="/sobre/">Sobre</a>
            <span class="sep">·</span>
            <a href="/proximos-passos/">Próximos passos</a>
        </div>
    </footer>`;
	}
	var init_SiteFooter = __esmMin((() => {}));
	//#endregion
	//#region src/components/ServiceCard.ts
	function ServiceCard(props) {
		const { service: s, respNames, faixa } = props;
		let precoHtml = "";
		if (faixa.planos) precoHtml = `<ul class="market-card-planos">${faixa.planos.map((p) => {
			return `<li class="${p.consult ? "is-consult" : ""}">
                    <span class="plano-label">${esc(p.label)}</span>
                    <span class="plano-preco">${esc(p.preco)}</span>
                </li>`;
		}).join("")}</ul>`;
		else if (faixa.preco) precoHtml = `<div class="${faixa.consult ? "market-card-price is-consult" : "market-card-price"}">${esc(faixa.preco)}</div>` + (faixa.formula ? `<div class="market-card-formula">${esc(faixa.formula)}</div>` : "");
		const childCount = s.children?.length ?? 0;
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
	var init_ServiceCard = __esmMin((() => {
		init_esc();
	}));
	//#endregion
	//#region src/components/FilterChip.ts
	function FilterChip(props) {
		const { id, label, count, active } = props;
		const cls = active ? "sup-chip is-active" : "sup-chip";
		const pressed = active ? "true" : "false";
		return `<button type="button" class="${cls}" data-cat="${esc(id)}" aria-pressed="${pressed}">
        ${esc(label)} <span class="sup-count">${count}</span>
    </button>`;
	}
	var init_FilterChip = __esmMin((() => {
		init_esc();
	}));
	//#endregion
	//#region src/components/SearchInput.ts
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
	var init_SearchInput = __esmMin((() => {
		init_esc();
	}));
	//#endregion
	//#region src/components/LocationInput.ts
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
	var init_LocationInput = __esmMin((() => {
		init_esc();
	}));
	//#endregion
	//#region src/components/EmptyState.ts
	function EmptyState(props) {
		const { message, ctaHref, ctaLabel, hidden } = props;
		const cta = ctaHref && ctaLabel ? ` <a href="${esc(ctaHref)}">${esc(ctaLabel)}</a>` : "";
		return `<p class="market-empty"${hidden ? " hidden" : ""}>${esc(message)}${cta}</p>`;
	}
	var init_EmptyState = __esmMin((() => {
		init_esc();
	}));
	//#endregion
	//#region src/pages/home.ts
	var home_exports = /* @__PURE__ */ __exportAll({ render: () => render$7 });
	function render$7() {
		const AL = window.AL;
		const servicos = AL.publicServices();
		const handleToNome = Object.fromEntries([...AL.people, ...AL.communities].map((e) => [e.handle, e.nome]));
		const respNames = (handles) => (handles ?? []).map((h) => handleToNome[h] ?? h).join(", ");
		const topo = servicos.filter((s) => !s.parent);
		const byTitulo = new Map(servicos.map((s) => [s.titulo, s]));
		const indexed = servicos.map((s) => ({
			s,
			blob: norm([
				s.titulo,
				s.parent ?? "",
				respNames(s.responsavel)
			].join(" "))
		}));
		const cats = SUPERCATS.map((c) => ({
			...c,
			items: c.titles.map((t) => byTitulo.get(t)).filter((s) => s !== void 0)
		})).filter((c) => c.items.length);
		const locOpts = AL.locationSuggestions();
		const defLoc = AL.DEFAULT_LOCATION;
		let activeFilters = {
			estado: defLoc.estado,
			cidade: defLoc.cidade,
			bairro: defLoc.bairro
		};
		let touchedFields = {
			estado: false,
			cidade: false,
			bairro: false
		};
		document.body.innerHTML = `
        ${siteHeader()}
        <main class="main market-main">
            <section class="market-hero">
                <h1 class="market-h1">Serviços</h1>
                <p class="market-sub">Profissionais e produtos da rede, conectados ao que você precisa.</p>

                ${SearchInput({
			id: "market-q",
			name: "q",
			placeholder: "Descreva o que precisa…"
		})}

                ${LocationInput({
			estado: defLoc.estado,
			cidade: defLoc.cidade,
			bairro: defLoc.bairro
		})}
            </section>

            <div class="sup-cats" id="sup-cats">
                ${FilterChip({
			id: "",
			label: "Todos",
			count: topo.length,
			active: true
		})}
                ${cats.map((c) => FilterChip({
			id: c.id,
			label: c.label,
			count: c.items.length
		})).join("")}
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
			ctaLabel: "Entre em contato para encontrarmos uma solução →",
			hidden: true
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
		for (const f of [
			"estado",
			"cidade",
			"bairro"
		]) {
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
			const list = (locOptsByField[field] ?? []).filter((v) => !q || normLoc(v).includes(q));
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
			if (!alOnly?.checked) return list;
			return list.filter((s) => (s.responsavel ?? []).some((h) => !AL.isInactive(h) && AL.isSocio(h)));
		}
		function applyFilter() {
			const q = norm(input.value.trim());
			const tokens = q ? q.split(/\s+/).filter(Boolean) : [];
			let list;
			if (tokens.length) list = indexed.filter(({ blob }) => tokens.every((t) => {
				if (blob.includes(t)) return true;
				const syns = ANGLICISM_MAP[t];
				return syns ? syns.some((s) => blob.includes(s)) : false;
			})).map((x) => x.s);
			else if (activeCat) {
				const cat = cats.find((c) => c.id === activeCat);
				list = cat ? cat.items : [];
			} else list = topo;
			list = locFilter(list);
			list = alOnlyFilter(list);
			grid.innerHTML = list.map((s) => ServiceCard({
				service: s,
				respNames: respNames(s.responsavel),
				faixa: AL.computeFaixaPreco(s)
			})).join("");
			const inputVal = input.value.trim();
			if (tokens.length) count.textContent = `${list.length} resultado${list.length === 1 ? "" : "s"} para "${inputVal}"`;
			else if (activeCat) {
				const cat = cats.find((c) => c.id === activeCat);
				count.textContent = `${list.length} em ${cat?.label ?? activeCat}`;
			} else count.textContent = `${list.length} serviços`;
			if (emptyEl) emptyEl.hidden = list.length !== 0;
			const matching = tokens.length ? new Set(indexed.filter(({ blob }) => tokens.every((t) => {
				if (blob.includes(t)) return true;
				const syns = ANGLICISM_MAP[t];
				return syns ? syns.some((s) => blob.includes(s)) : false;
			})).map((x) => x.s.titulo)) : null;
			const countFor = (items) => {
				return alOnlyFilter(locFilter(matching ? items.filter((s) => matching.has(s.titulo)) : items)).length;
			};
			const allChipCount = chipsBox.querySelector(".sup-chip[data-cat=\"\"] .sup-count");
			if (allChipCount) allChipCount.textContent = String(countFor(topo));
			cats.forEach((cat) => {
				const el = chipsBox.querySelector(`.sup-chip[data-cat="${cat.id}"] .sup-count`);
				if (el) el.textContent = String(countFor(cat.items));
			});
		}
		input.addEventListener("input", applyFilter);
		alOnly?.addEventListener("change", applyFilter);
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
		for (const field of [
			"estado",
			"cidade",
			"bairro"
		]) {
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
	}
	var SUPERCATS;
	var init_home = __esmMin((() => {
		init_esc();
		init_norm();
		init_anglicism();
		init_SiteHeader();
		init_SiteFooter();
		init_ServiceCard();
		init_FilterChip();
		init_SearchInput();
		init_LocationInput();
		init_EmptyState();
		SUPERCATS = [
			{
				id: "eventos",
				label: "Eventos",
				titles: [
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
				]
			},
			{
				id: "digital",
				label: "Digital",
				titles: [
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
				]
			},
			{
				id: "educacao",
				label: "Educação",
				titles: [
					"Alfabetização",
					"Reforço Escolar",
					"Ensino, Formação e Liderança",
					"Mentoria Espiritual",
					"Educação Ambiental",
					"Tradução"
				]
			},
			{
				id: "bem-estar",
				label: "Bem-estar",
				titles: [
					"Acompanhamento Nutricional",
					"Saúde Mental",
					"Terapia Comportamental",
					"Meditação",
					"Autocuidado",
					"Cuidado com o Idoso"
				]
			},
			{
				id: "casa",
				label: "Casa",
				titles: [
					"Drywall e Bioconstrução",
					"Murais e Fachadas",
					"Grafite",
					"Agrofloresta",
					"Compostagem"
				]
			},
			{
				id: "gestao",
				label: "Gestão",
				titles: [
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
				]
			},
			{
				id: "negocios",
				label: "Negócios",
				titles: [
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
				]
			},
			{
				id: "alimentacao",
				label: "Alimentação",
				titles: [
					"Alimentação e Bebidas",
					"Hambúrguer Artesanal",
					"Tortas Salgadas da Veh"
				]
			},
			{
				id: "audiovisual",
				label: "Audiovisual",
				titles: [
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
				]
			}
		];
	}));
	//#endregion
	//#region src/components/ProfileCard.ts
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
		return `<div class="avatar-sm">${entity.pic ? `<img src="${esc(entity.pic)}" alt="${esc(entity.nome)}">` : esc(initial(entity.nome))}</div>`;
	}
	function avatarLg(entity) {
		return `<div class="avatar avatar-lg">${entity.pic ? `<img src="${esc(entity.pic)}" alt="${esc(entity.nome)}">` : esc(initial(entity.nome))}</div>`;
	}
	function initial(s) {
		return (s ?? "?").trim()[0]?.toUpperCase() ?? "?";
	}
	var init_ProfileCard = __esmMin((() => {
		init_esc();
	}));
	//#endregion
	//#region src/lib/ui.ts
	function ctaLead(copy, btnLabel) {
		return `<div class="lead-magnet">
    <h3>${esc(copy.title)}</h3>
    <p>${esc(copy.body)}</p>
    <button type="button" class="cta-button" data-cta="${esc(copy.id)}">${esc(btnLabel)}</button>
  </div>`;
	}
	function modalContact(id, labelText) {
		return `<div class="modal-overlay" id="${id}" role="dialog" aria-modal="true">
    <div class="modal-card" style="text-align:center;">
      ${labelText ? `<div class="modal-servico-nome">${esc(labelText)}</div>` : ""}
      <div class="modal-contact-label">Escreva para</div>
      <div class="modal-email">${REDE_EMAIL$1}</div>
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
			if (!target.closest(".servicos-popover") && !target.closest(".ver-servicos-btn")) closeAll();
		});
		document.addEventListener("keydown", (e) => {
			if (e.key === "Escape") closeAll();
		});
	}
	var REDE_EMAIL$1;
	var init_ui = __esmMin((() => {
		init_esc();
		REDE_EMAIL$1 = "rede@artelonga.com.br";
	}));
	//#endregion
	//#region src/pages/parceiros.ts
	var parceiros_exports = /* @__PURE__ */ __exportAll({ render: () => render$6 });
	function render$6() {
		const h = (location.hash || "").toLowerCase();
		if (h === "#todos" || h === "#showall") {
			renderParceirosShowAll();
			window.addEventListener("hashchange", render$6);
			return;
		}
		window.addEventListener("hashchange", render$6);
		renderParceiros();
	}
	function renderParceirosShowAll() {
		const all = window.AL.people.filter((p) => !p.referenceOnly).sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "pt-BR"));
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
		const rows = AL.roster().map((entity) => {
			const isComunidade = entity.type === "community";
			const nameUrl = entity.externalUrl ? entity.externalUrl : `/${entity.handle}/`;
			const nameAttrs = entity.externalUrl ? ` target="_blank" rel="noopener"` : "";
			const verMaisUrl = `/${entity.handle}/`;
			const verMaisLabel = isComunidade ? "Ver Mais →" : "ver mais →";
			const seeMore = entity.muted ? "" : `<a class="see-more" href="${verMaisUrl}">${verMaisLabel}</a>`;
			const socioMark = !isComunidade && AL.isSocio(entity.handle) ? `<span class="socio-mark" aria-label="sócio">*</span>` : "";
			const nameHtml = `<a href="${nameUrl}" class="name"${nameAttrs}>${esc(entity.nome)}${socioMark}</a>`;
			const subs = ((isComunidade ? entity.membros : entity.subMembers) ?? []).map((h) => AL.get(h)).filter(Boolean);
			const rosterSet = new Set(AL.rosterOrder ?? []);
			const splitSubs = (list) => {
				if (!isComunidade) return {
					visible: list,
					hidden: []
				};
				const visible = [];
				const hidden = [];
				for (const m of list) if (rosterSet.has(m.handle)) hidden.push(m);
				else visible.push(m);
				return {
					visible,
					hidden
				};
			};
			const { visible: subsVisible, hidden: subsHidden } = splitSubs(subs);
			const hiddenBadge = subsHidden.length ? `<li class="membros-badge">+ ${subsHidden.length} membros</li>` : "";
			const membrosHtml = subsVisible.length || subsHidden.length ? `<ul class="card-membros">${subsVisible.map((m) => miniRow(m)).join("")}${hiddenBadge}</ul>` : "";
			const svcList = !isComunidade && entity.servicos?.length ? entity.servicos ?? [] : [];
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
            ${ctaLead({
			title: "Participe",
			body: "Faça parte da rede.",
			id: "parceiros"
		}, "Entrar →")}
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
				btn.textContent = list?.classList.toggle("membros-expanded") ?? false ? "ver menos" : `ver mais (+${more})`;
			});
		});
		wirePopover(".roster > li");
		wireModal("contact-modal", "[data-cta=\"parceiros\"]");
	}
	function miniRow(entity) {
		const memoriaTag = entity.emMemoria ? ` <span class="mini-memoria">em memória</span>` : "";
		const servicos = !("servicos" in entity && entity.servicos?.length) ? "" : `<div class="mini-drawer"><ul class="mini-missoes">${(entity.servicos ?? []).map((m) => `<li>${esc(m)}</li>`).join("")}</ul></div>`;
		return `<li class="mini-row${entity.emMemoria ? " mini-row-memoria" : ""}">
        <a class="mini-name" href="/${esc(entity.handle)}/">${esc(entity.nome)}</a>${memoriaTag}
        ${servicos}
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
				for (const c of children) items.push({
					titulo: c.titulo,
					slug: c.slug ?? AL.slugify(c.titulo),
					role: "child"
				});
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
	var init_parceiros = __esmMin((() => {
		init_esc();
		init_SiteHeader();
		init_SiteFooter();
		init_ProfileCard();
		init_ui();
	}));
	//#endregion
	//#region src/pages/servicos.ts
	var servicos_exports = /* @__PURE__ */ __exportAll({ render: () => render$5 });
	function render$5() {
		const AL = window.AL;
		const servicos = AL.publicServices();
		const handleToNome = Object.fromEntries([...AL.people, ...AL.communities].map((e) => [e.handle, e.nome]));
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

            ${ctaLead({
			title: "Anuncie",
			body: "Participe da Rede.",
			id: "servicos"
		}, "Entrar →")}

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
			if (target === leadModal || target.classList.contains("modal-close")) leadModal.classList.remove("on");
		});
		document.addEventListener("keydown", (e) => {
			if (e.key === "Escape") leadModal.classList.remove("on");
		});
		document.querySelector("[data-cta=\"servicos\"]")?.addEventListener("click", () => leadModal.classList.add("on"));
		function makeRow(s, inChildren = false) {
			const parent = s.parent ? `<span class="portfolio-parent">${esc(s.parent)} ›</span> ` : "";
			const titulo = inChildren ? esc(s.titulo) : `${parent}${esc(s.titulo)}`;
			const childCount = s.children?.length ?? 0;
			const expandable = childCount > 0 && !inChildren ? `<span class="portfolio-expand">+${childCount}</span>` : "";
			const resp = inChildren ? "" : `<div class="portfolio-resp">${esc(respNames(s.responsavel))}</div>`;
			const children = !inChildren && s.children?.length ? `<ul class="portfolio-children">${s.children.map((ct) => {
				const ch = servicos.find((x) => x.titulo === ct);
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
				filtered = servicos.filter((s) => norm(s.titulo).includes(q) || norm(respNames(s.responsavel)).includes(q) || (s.parent ? norm(s.parent).includes(q) : false));
				countEl.textContent = `${filtered.length} de ${servicos.length} serviços`;
			} else {
				filtered = servicos.filter((s) => !s.parent);
				countEl.textContent = `${filtered.length} serviços · ${servicos.length - filtered.length} sub-serviços`;
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
	var init_servicos = __esmMin((() => {
		init_esc();
		init_norm();
		init_SiteHeader();
		init_SiteFooter();
		init_ui();
	}));
	//#endregion
	//#region src/pages/solucoes.ts
	var solucoes_exports = /* @__PURE__ */ __exportAll({ render: () => render$4 });
	function render$4() {
		const AL = window.AL;
		const renderRow = (s) => {
			const urlAttrs = s.internalLink !== false && (s.url ?? "").startsWith("/") ? "" : ` target="_blank" rel="noopener"`;
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

            ${ctaLead({
			title: "Construa um Universo",
			body: "Da ideia ao lançamento.",
			id: "solucoes"
		}, "Compartilhe →")}

            <a class="back" href="/">← voltar</a>
        </main>
        ${modalContact("contact-modal", "")}
    `;
		wireModal("contact-modal", "[data-cta=\"solucoes\"]");
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
	var init_solucoes = __esmMin((() => {
		init_esc();
		init_SiteHeader();
		init_ui();
	}));
	//#endregion
	//#region src/pages/recursos.ts
	var recursos_exports = /* @__PURE__ */ __exportAll({ render: () => render$3 });
	function render$3() {
		const AL = window.AL;
		const f = AL.finances;
		const fmt = (n) => n.toLocaleString("pt-BR", {
			style: "currency",
			currency: "BRL",
			minimumFractionDigits: 2
		});
		const short = (n) => n.toLocaleString("pt-BR", {
			style: "currency",
			currency: "BRL",
			maximumFractionDigits: 0
		});
		const nomeOf = (h) => {
			const p = AL.get(h);
			return p ? p.nome : h;
		};
		const solucoesLinks = (handles) => {
			if (!handles?.length) return "";
			const links = handles.map((h) => {
				const s = AL.get(h);
				if (!s) return null;
				return `<a class="fin-sol-link" href="/solucoes/#${esc(s.handle)}">${esc(s.nome)}</a>`;
			}).filter((l) => l !== null);
			return links.length ? `<div class="fin-solucoes">exemplo em: ${links.join(" · ")}</div>` : "";
		};
		const totalCustos = f.custos.reduce((a, c) => a + c.value, 0);
		const custosHtml = f.custos.map((c) => {
			const breakdownHtml = c.breakdown ? `<div class="fin-sub-breakdown">${c.breakdown.map((b) => `<div class="sub-line"><span>${esc(b.label)}${b.handle ? ` <a class="sub-link" href="/${esc(b.handle)}/">↗</a>` : ""}</span><span>${fmt(b.value)}</span></div>`).join("")}</div>` : "";
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
            <div class="fin-sub-breakdown">${r.meses.map((m) => `<div class="sub-line"><span>${esc(m.mes)}</span><span>${fmt(m.value)}</span></div>`).join("")}</div>
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
	var init_recursos = __esmMin((() => {
		init_esc();
		init_SiteHeader();
		init_SiteFooter();
	}));
	//#endregion
	//#region src/lib/markdown.ts
	function mdInline(s) {
		return esc(s).replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, label, title) => {
			return `<a href="#" class="al-em-breve" data-modal-title="${title ?? label}">${label}</a>`;
		}).replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
			const href = url.replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, "\"");
			return `<a href="${href}"${/^https?:\/\//.test(href) ? " target=\"_blank\" rel=\"noopener\"" : ""}>${text}</a>`;
		}).replace(/\*([^*\n]+)\*/g, "<em>$1</em>");
	}
	var init_markdown = __esmMin((() => {
		init_esc();
	}));
	//#endregion
	//#region src/pages/profile.ts
	var profile_exports = /* @__PURE__ */ __exportAll({ render: () => render$2 });
	function render$2() {
		const handle = document.body.dataset["handle"] ?? "";
		const raw = window.AL.get(handle);
		if (!raw) {
			document.body.innerHTML = `<main class="main"><p>Perfil não encontrado.</p></main>`;
			return;
		}
		let p;
		if (raw.type === "solution") {
			const sol = raw;
			const fullBio = (sol.desc ?? "") + (sol.descLong ? "\n\n" + sol.descLong : "");
			const siteUrl = sol.externalUrl ?? (typeof sol.url === "string" && /^https?:\/\//.test(sol.url) ? sol.url : void 0);
			const servicos = sol.bundledServices === "*" ? [] : sol.bundledServices ?? [];
			const emBreve = sol.platforms ? sol.platforms.every((pl) => pl.status === "wip") : false;
			const solProfile = {
				handle: sol.handle,
				type: sol.type,
				nome: sol.nome,
				bio: fullBio,
				servicos,
				emBreve
			};
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
		const legadoCase = p.aposentado ?? p.emMemoria;
		const servicoLabel = isCommunity ? "Missões" : legadoCase ? "Legado" : "Serviços";
		const servicoHint = isCommunity ? "comunidade oferece via serviços" : p.emMemoria ? "serviços prestados · em memória" : p.aposentado ? "serviços prestados · aposentado" : "clique para ver no catálogo";
		const missoesHtml = p.underage || !p.servicos?.length ? "" : `<section class="section missoes-section">
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
		const avatarHtml = avatarLg({
			type: p.type !== "community" ? "person" : "community",
			nome: p.nome,
			pic: p.pic
		});
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
	}
	function missaoLink(titulo) {
		return `<a class="missao-link" href="/servicos/?q=${encodeURIComponent(titulo)}">${esc(titulo)} <span class="missao-arrow">→ serviços</span></a>`;
	}
	function bioFull(bio) {
		if (!bio) return `<p class="profile-bio empty">Biografia em breve.</p>`;
		return bio.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean).map((block) => {
			const lines = block.split("\n");
			if (lines.every((l) => /^>\s?/.test(l))) return `<blockquote class="profile-bio profile-bio-quote">${mdInline(lines.map((l) => l.replace(/^>\s?/, "")).join("\n")).replace(/\n/g, "<br>")}</blockquote>`;
			return `<p class="profile-bio">${mdInline(block).replace(/\n/g, "<br>")}</p>`;
		}).join("");
	}
	function makeCounter(p) {
		if (!p.birthDate) return {
			html: "",
			tick: null
		};
		if (p.emMemoria) {
			if (!p.deathDate) return {
				html: "",
				tick: null
			};
			const birth = new Date(p.birthDate);
			const death = new Date(p.deathDate);
			return {
				html: `<div class="profile-counter-static">${Math.floor((death.getTime() - birth.getTime()) / (365.25 * 24 * 3600 * 1e3))} anos · ${birth.getFullYear()}—${death.getFullYear()} · em memória</div>`,
				tick: null
			};
		}
		const birthDate = p.birthDate;
		return {
			html: `<div class="profile-counter" data-birth="${esc(birthDate)}"></div>`,
			tick: () => tickCounter(birthDate)
		};
	}
	function tickCounter(birthStr) {
		const precision = (() => {
			if (!birthStr.includes("T")) return "day";
			const colons = ((birthStr.split("T")[1] ?? "").replace(/[Z+-].*$/, "").match(/:/g) ?? []).length;
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
			const parts = [
				`${y} anos`,
				plural(mo, "mês", "meses"),
				plural(d, "dia", "dias")
			];
			if (precision === "second") parts.push(`${String(h).padStart(2, "0")}h${String(mi).padStart(2, "0")}m${String(se).padStart(2, "0")}s`);
			else if (precision === "minute") parts.push(`${String(h).padStart(2, "0")}h${String(mi).padStart(2, "0")}`);
			else if (precision === "hour") parts.push(`${h}h`);
			el.textContent = parts.join(" · ");
		};
		renderAge();
		setInterval(renderAge, precision === "second" ? 1e3 : 6e4);
	}
	function buildEssaysHtml(p) {
		if (!p.essays?.length) return "";
		const allPending = p.essays.every((e) => !e.short && !e.long && !e.titulo);
		const items = p.essays.map((e, i) => {
			return `<li>
                <span class="essay-num">${String(i + 1).padStart(2, "0")}</span>
                <span class="essay-titulo">${e.titulo ? esc(e.titulo) : `<span class="essay-pending">(título em breve)</span>`}</span>
                <span class="essay-formats">${e.short ? `<a href="${esc(e.short)}">curto</a>` : `<span class="essay-pending">curto</span>`} · ${e.long ? `<a href="${esc(e.long)}">longo</a>` : `<span class="essay-pending">longo</span>`}</span>
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
		return `<section class="section poemas-section">
        <h2>Poemas</h2>
        <ul class="poemas-list">${authorPoems.map((pm) => `<li><a href="/${esc(p.handle)}/${esc(pm.slug)}/">${esc(pm.titulo)} →</a></li>`).join("")}</ul>
    </section>`;
	}
	function buildCitacoesHtml(p) {
		if (!p.citacoes?.length) return "";
		const AL = window.AL;
		return `<section class="section citacoes-section"><h2>Citações</h2>${p.citacoes.map((c) => {
			let autorHtml = "";
			const autorEntity = c.autor ? AL.get(c.autor) : void 0;
			if (autorEntity) autorHtml = `<a href="/${esc(autorEntity.handle)}/">${esc(autorEntity.nome)}</a>`;
			else if (c.autorEmBreve) autorHtml = `<a href="#" class="al-em-breve" data-modal-title="${esc(c.autorEmBreve.title)}">${esc(c.autorNome ?? c.autorEmBreve.title)}</a>`;
			else if (c.autorNome) autorHtml = esc(c.autorNome);
			const obraHtml = c.url ? `<a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.obra ?? c.url)}</a>` : c.obra ? esc(c.obra) : "";
			const parts = [
				autorHtml,
				obraHtml,
				c.data ? esc(c.data) : ""
			].filter(Boolean);
			return `<blockquote class="citacao">
                <p class="citacao-texto">${mdInline(c.texto)}</p>
                <footer class="citacao-attrib">— ${parts.join(", ")}</footer>
            </blockquote>`;
		}).join("")}</section>`;
	}
	function buildHomeLinksHtml(p) {
		if (!p.homeLinks?.length) return "";
		return `<section class="section home-links-section">
        <h2>Navegação</h2>
        <ul class="home-links-list">${p.homeLinks.map((l) => `<li><a href="${esc(l.url)}">${esc(l.label)}</a></li>`).join("")}</ul>
    </section>`;
	}
	function buildMembrosHtml(p) {
		const AL = window.AL;
		const subHandles = p.type === "community" ? p.membros : p.subMembers;
		if (!subHandles?.length) return "";
		return `<section class="section">
        <h2>Membros</h2>
        <ul>${subHandles.map((h) => AL.get(h)).filter(Boolean).map((s) => `<li><a href="/${esc(s.handle)}/">${esc(s.nome)}</a></li>`).join("")}</ul>
    </section>`;
	}
	function buildComunidadesHtml(p) {
		if (!p.communities?.length) return "";
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
		if (p.site) return `<section class="section"><h2>Contato e Parcerias</h2><ul><li><a href="${esc(p.site)}" target="_blank" rel="noopener">${esc(p.site)}</a></li></ul></section>`;
		return `<section class="section"><h2>Contato e Parcerias</h2><ul><li><span class="email-display">${REDE_EMAIL}</span></li></ul></section>`;
	}
	function buildParceriasHtml(p) {
		if (!p.parcerias?.length) return "";
		const AL = window.AL;
		return p.parcerias.map((par) => {
			const parceiro = AL.get(par.de);
			const nomeP = parceiro ? parceiro.nome : par.de;
			const contribs = (par.contribuicoes ?? []).map((c) => {
				const quem = AL.get(c.quem);
				return `<li><strong>${quem ? `<a href="/${esc(c.quem)}/">${esc(quem.nome)}</a>` : esc(c.quem)}</strong> — ${esc(c.oque)}</li>`;
			}).join("");
			return `<section class="section parceria-section">
                <h2>Parceria · ${esc(nomeP)} <span class="section-hint">${esc(par.tipo)}</span></h2>
                <p class="parceria-desc">${esc(par.descricao ?? "")}</p>
                <ul class="parceria-contribs">${contribs}</ul>
            </section>`;
		}).join("");
	}
	var REDE_EMAIL;
	var init_profile = __esmMin((() => {
		init_esc();
		init_markdown();
		init_ProfileCard();
		init_SiteHeader();
		init_SiteFooter();
		REDE_EMAIL = "rede@artelonga.com.br";
	}));
	//#endregion
	//#region src/pages/service.ts
	var service_exports = /* @__PURE__ */ __exportAll({ render: () => render$1 });
	function render$1() {
		const slug = document.body.dataset["slug"] ?? "";
		const AL = window.AL;
		const s = AL.serviceBySlug(slug);
		if (!s) {
			document.body.innerHTML = `<main class="main"><p>Serviço não encontrado.</p><a class="back" href="/">← voltar</a></main>`;
			return;
		}
		document.title = `${s.nome ?? s.titulo} — Serviços — Arte Longa`;
		const respEntities = (s.responsavel ?? []).map((h) => AL.get(h)).filter((e) => e !== void 0 && e.type !== "solution");
		const respLinks = respEntities.map((e) => {
			return `<a href="${e.externalUrl ? e.externalUrl : `/${e.handle}/`}"${e.externalUrl ? ` target="_blank" rel="noopener"` : ""}>${esc(e.nome)}</a>`;
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
		if (faixa.preco && !faixa.planos) parts.push(`<span class="svc-meta-chunk svc-meta-price">${esc(faixa.preco)}</span>`);
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
		if (!s.attachments?.length) return "";
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
		if (!AL.isInactive(p.handle)) {}
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
	var EXEMPLOS;
	var init_service = __esmMin((() => {
		init_esc();
		init_SiteHeader();
		init_SiteFooter();
		EXEMPLOS = {
			"Desenvolvimento Web": [{
				name: "Quilombo Araucária",
				url: "/quilomboaraucaria/"
			}],
			"Design": [{
				name: "Quilombo Araucária",
				url: "/quilomboaraucaria/"
			}],
			"Desenvolvimento de API": [{
				name: "Quilombo Araucária",
				url: "/quilomboaraucaria/"
			}],
			"Privacidade e Segurança": [{
				name: "Quilombo Araucária",
				url: "/quilomboaraucaria/"
			}],
			"Criação de Conteúdo": [{
				name: "Quilombo Araucária",
				url: "/relatos/"
			}]
		};
	}));
	//#endregion
	//#region src/pages/poem.ts
	var poem_exports = /* @__PURE__ */ __exportAll({ render: () => render });
	function render() {
		const slug = document.body.dataset["slug"] ?? "";
		const AL = window.AL;
		const poem = AL.poemBySlug(slug);
		if (!poem) {
			document.body.innerHTML = `<main class="main"><p>Poema não encontrado.</p><a class="back" href="/">← voltar</a></main>`;
			return;
		}
		const author = poem.autor ? AL.get(poem.autor) : void 0;
		document.title = `${poem.titulo}${author ? " — " + author.nome : ""} — Arte Longa`;
		const stanzasHtml = poem.stanzas.map((stz) => `<p class="poem-stanza">${stz.map(esc).join("<br>")}</p>`).join("");
		const authorLine = author ? `<div class="poem-author">por <a href="/${esc(author.handle)}/">${esc(author.nome)}</a></div>` : "";
		const backHref = author ? `/${esc(author.handle)}/` : "/";
		const backLabel = author ? `← voltar a ${esc(author.nome)}` : "← voltar";
		document.body.innerHTML = `
        ${siteHeader()}
        <main class="main poem-page">
            <h1 class="poem-title">${esc(poem.titulo)}</h1>
            ${authorLine}
            <div class="poem-body">${stanzasHtml}</div>
            <a class="back" href="${backHref}">${backLabel}</a>
        </main>
        ${siteFooter()}
    `;
	}
	var init_poem = __esmMin((() => {
		init_esc();
		init_SiteHeader();
		init_SiteFooter();
	}));
	//#endregion
	//#region src/dispatcher.ts
	var pageMap = {
		home: () => Promise.resolve().then(() => (init_home(), home_exports)),
		parceiros: () => Promise.resolve().then(() => (init_parceiros(), parceiros_exports)),
		servicos: () => Promise.resolve().then(() => (init_servicos(), servicos_exports)),
		solucoes: () => Promise.resolve().then(() => (init_solucoes(), solucoes_exports)),
		recursos: () => Promise.resolve().then(() => (init_recursos(), recursos_exports)),
		profile: () => Promise.resolve().then(() => (init_profile(), profile_exports)),
		service: () => Promise.resolve().then(() => (init_service(), service_exports)),
		poem: () => Promise.resolve().then(() => (init_poem(), poem_exports))
	};
	function dispatch() {
		const page = document.body.dataset["page"];
		const fn = page !== void 0 ? pageMap[page] : void 0;
		if (!fn) {
			if (page !== void 0) console.warn(`No renderer for page: ${page}`);
			return;
		}
		(async () => {
			try {
				(await fn()).render();
			} catch (e) {
				console.error("render falhou:", e);
				document.body.innerHTML = `<main class="main"><p>Algo quebrou. <a href="/">voltar</a></p></main>`;
			}
		})();
	}
	if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", dispatch);
	else dispatch();
	//#endregion
})();
