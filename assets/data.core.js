/* Arte Longa · core runtime
 *
 * Reads per-collection data from window.AL.* (set by per-collection modules),
 * derives services, and exports all functions on window.AL.
 * Must load AFTER the required per-collection data files for the current page.
 */
(function (global) {
    "use strict";

    const AL = (global.AL = global.AL || {});

    // ─── PRICING ─────────────────────────────────────────────────────────────
    // Default rate da rede. Cada pessoa pode ter `hourlyRate` próprio (override).
    const DEFAULT_HOURLY_RATE = 100;

    // ─── LOCATION ────────────────────────────────────────────────────────────
    // Localização padrão da rede (Jardim Umarizal). Pessoas sem `location`
    // herdam isso. Rodney tem location próprio (Cangaíba). Schema:
    //   location: { estado, cidade, bairro }   ← preferido
    //   location: "Bairro · Cidade · UF"       ← legado, parseado em runtime
    const DEFAULT_LOCATION = Object.freeze({
        estado: "SP", cidade: "São Paulo", bairro: "Jardim Umarizal"
    });

    // ─── COLLECTION REFS ─────────────────────────────────────────────────────
    // Per-collection files must have run before this module.
    // Missing collections default to empty (page didn't load that module).
    const people = AL.people || [];
    const communities = AL.communities || [];
    const serviceCatalog = AL.serviceCatalog || [];
    const solutions = AL.solutions || [];
    const missions = AL.missions || [];
    const poems = AL.poems || [];
    const finances = AL.finances || {};

    // ─── INDEXES / LOOKUPS ───────────────────────────────────────────────────
    const all = [...people, ...communities, ...solutions, ...missions];
    const byHandle = Object.fromEntries(all.map(e => [e.handle, e]));

    function get(handle) { return byHandle[handle]; }

    function isEmMemoria(handle) {
        const e = get(handle);
        return !!(e && e.emMemoria);
    }

    // Qualquer status que tire a pessoa do catálogo ativo de serviços:
    // em memória (já passou), aposentado (serviços vão para legado),
    // underage (menor de 18, universo privado sob responsabilidade da mãe/pai).
    function isInactive(handle) {
        const e = get(handle);
        return !!(e && (e.emMemoria || e.aposentado || e.underage));
    }

    function slugify(s) {
        return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
            .replace(/\(.*?\)/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
    }

    // ─── SERVICES ────────────────────────────────────────────────────────────
    // serviceCatalog é a FONTE ÚNICA de cada serviço. Deriva responsáveis
    // a partir de people/communities.servicos. Se o catálogo não foi carregado
    // para esta página, retorna vazio sem emitir warnings.
    function deriveServices() {
        if (!serviceCatalog.length) return [];
        const byTitle = new Map();
        // Seed from canonical catalog (inclui implicitResponsavel)
        for (const def of serviceCatalog) {
            byTitle.set(def.titulo, {
                ...def,
                slug: slugify(def.titulo),
                responsavel: def.implicitResponsavel ? [...def.implicitResponsavel] : [],
                cnae: def.cnae || null
            });
        }
        // Auto-derive responsáveis a partir de people/communities.servicos
        const allPeopleCommunities = [...people, ...communities];
        for (const e of allPeopleCommunities) {
            for (const titulo of (e.servicos || [])) {
                if (!byTitle.has(titulo)) {
                    console.warn(`[AL] Serviço "${titulo}" usado por ${e.handle} não está em serviceCatalog — adicionando entry temporária`);
                    byTitle.set(titulo, { titulo, slug: slugify(titulo), responsavel: [], cnae: null });
                }
                const existing = byTitle.get(titulo);
                if (!existing.responsavel.includes(e.handle)) {
                    existing.responsavel.push(e.handle);
                }
            }
        }
        // Symmetric lookup: children arrays anexados ao parent
        const result = Array.from(byTitle.values());
        for (const s of result) {
            s.children = result.filter(x => x.parent === s.titulo).map(x => x.titulo);
        }
        return result.sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR"));
    }
    const services = deriveServices();

    function publicServices() {
        return services.filter(s => {
            if (s.hidden) return false;
            if (s.responsavel.some(h => isInactive(h))) return false;
            return true;
        });
    }

    // ─── PORTFOLIO ────────────────────────────────────────────────────────────
    // Conceito derivado: entry = intersecção parceiro × serviço.
    // Não tem tipo próprio no schema — é gerado em runtime a partir de
    // service.responsavel. Documentado em docs/SCHEMA.md.
    function portfolioEntry(parceiroHandle, servico) {
        const p = get(parceiroHandle);
        return {
            parceiro: parceiroHandle,
            parceiroNome: p ? p.nome : parceiroHandle,
            servico: servico.titulo,
            servicoSlug: servico.slug,
            servicoUrl: `/servicos/${servico.slug}/`
        };
    }
    function portfolioOf(parceiroHandle) {
        return services
            .filter(s => !s.hidden && s.responsavel.includes(parceiroHandle))
            .map(s => portfolioEntry(parceiroHandle, s));
    }
    function portfolioFor(servicoTitulo) {
        const s = services.find(x => x.titulo === servicoTitulo);
        if (!s || s.hidden) return [];
        return s.responsavel
            .filter(h => !isInactive(h))
            .map(h => portfolioEntry(h, s));
    }
    function portfolio() {
        const out = [];
        for (const s of services) {
            if (s.hidden) continue;
            for (const h of s.responsavel) {
                if (isInactive(h)) continue;
                out.push(portfolioEntry(h, s));
            }
        }
        return out;
    }

    // ─── LOCATION HELPERS ────────────────────────────────────────────────────
    // Normaliza a location do parceiro pra { estado, cidade, bairro }.
    // Aceita object structured, string legada ("Bairro · Cidade · UF") ou nada
    // (cai no DEFAULT_LOCATION = SP · São Paulo · Jardim Umarizal).
    function locationOf(handle) {
        const e = get(handle);
        if (!e || !e.location) return DEFAULT_LOCATION;
        const loc = e.location;
        if (typeof loc === "string") {
            const parts = loc.split(/\s*·\s*/);
            return {
                estado: parts[2] || DEFAULT_LOCATION.estado,
                cidade: parts[1] || DEFAULT_LOCATION.cidade,
                bairro: parts[0] || DEFAULT_LOCATION.bairro
            };
        }
        return {
            estado: loc.estado || DEFAULT_LOCATION.estado,
            cidade: loc.cidade || DEFAULT_LOCATION.cidade,
            bairro: loc.bairro || DEFAULT_LOCATION.bairro
        };
    }

    // Hierarquia de locations disponíveis: { estado: { cidade: Set<bairro> } }.
    // Usado pra popular os selects cascateados na home.
    function availableLocations() {
        const tree = new Map();
        const allPeopleCommunities = [...people, ...communities];
        for (const e of allPeopleCommunities) {
            if (isInactive(e.handle)) continue;
            // Só aparece em filtro quem tem serviço ativo público.
            const hasPublic = services.some(s =>
                !s.hidden && s.responsavel.includes(e.handle) &&
                !s.responsavel.some(h => isInactive(h))
            );
            if (!hasPublic) continue;
            const loc = locationOf(e.handle);
            if (!tree.has(loc.estado)) tree.set(loc.estado, new Map());
            const cm = tree.get(loc.estado);
            if (!cm.has(loc.cidade)) cm.set(loc.cidade, new Set());
            if (loc.bairro) cm.get(loc.cidade).add(loc.bairro);
        }
        return tree;
    }

    // Match independente em cada nível (estado, cidade, bairro). Substring
    // case-insensitive sem acento. Vazio = nível ignorado.
    function _normLoc(s) {
        return String(s || "").toLowerCase().normalize("NFD")
            .replace(/[̀-ͯ]/g, "").trim();
    }
    function locationMatches(handleOrLoc, filters) {
        const f = filters || {};
        const loc = (typeof handleOrLoc === "string") ? locationOf(handleOrLoc) : handleOrLoc;
        if (f.estado && !_normLoc(loc.estado).includes(_normLoc(f.estado))) return false;
        if (f.cidade && !_normLoc(loc.cidade).includes(_normLoc(f.cidade))) return false;
        if (f.bairro && !_normLoc(loc.bairro).includes(_normLoc(f.bairro))) return false;
        return true;
    }

    // Filtra serviços por { estado, cidade, bairro }. Strings vazias ignoradas.
    // Serviços com `digital: true` ignoram filtro (entrega remota).
    function servicesIn(filters) {
        return publicServices().filter(s => {
            if (s.digital) return true;
            return s.responsavel.some(h => {
                if (isInactive(h)) return false;
                return locationMatches(h, filters);
            });
        });
    }

    // Sugestões por nível pro datalist de cada input.
    // Retorna { estados, cidades, bairros } — cada um array de strings únicas
    // do que existe na DB (excluindo inativos).
    function locationSuggestions() {
        const estados = new Set();
        const cidades = new Set();
        const bairros = new Set();
        const allPeopleCommunities = [...people, ...communities];
        for (const e of allPeopleCommunities) {
            if (isInactive(e.handle)) continue;
            const hasPublic = services.some(s =>
                !s.hidden && s.responsavel.includes(e.handle) &&
                !s.responsavel.some(h => isInactive(h))
            );
            if (!hasPublic) continue;
            const loc = locationOf(e.handle);
            if (loc.estado) estados.add(loc.estado);
            if (loc.cidade) cidades.add(loc.cidade);
            if (loc.bairro) bairros.add(loc.bairro);
        }
        return {
            estados: [...estados].sort(),
            cidades: [...cidades].sort(),
            bairros: [...bairros].sort()
        };
    }

    // Pricing — sempre hours × rate. Para produtos (torta, hambúrguer, palavra),
    // hoursLow/hoursHigh expressam horas POR UNIDADE (ex: 8h por batch de 10
    // tortas → 0.8h/torta × R$ 100/h = R$ 80/torta).
    // Sem hoursLow/hoursHigh → "Sob consulta" + CTA de contato.
    // Retorna { preco, formula, consult } pra render exibir tudo na cara —
    // cliente vê preço e a conta que o gerou.
    function rateOf(handle) {
        const e = get(handle);
        return (e && typeof e.hourlyRate === "number") ? e.hourlyRate : DEFAULT_HOURLY_RATE;
    }
    function fmtBR(n) {
        const opts = n < 1
            ? { minimumFractionDigits: 2, maximumFractionDigits: 2 }
            : { maximumFractionDigits: 0 };
        return "R$ " + n.toLocaleString("pt-BR", opts);
    }
    function fmtHours(n) {
        return Number.isInteger(n) ? `${n}` : `${n}`.replace(".", ",");
    }
    function computeFaixaPreco(s) {
        const ativos = (s.responsavel || []).filter(h => !isInactive(h));
        const rates = ativos.length ? ativos.map(rateOf) : [DEFAULT_HOURLY_RATE];
        const minRate = Math.min(...rates);
        const maxRate = Math.max(...rates);

        const ratePart = (minRate === maxRate)
            ? `${fmtBR(minRate)}/h`
            : `${fmtBR(minRate)}–${fmtBR(maxRate)}/h`;

        // Modo planos. Padrão da rede:
        //   { hours: N }              → label "Nh", preço hours × rate (flat fee)
        //   { label: "Semanal" }      → "Sob consulta" (volume varia, fala-se direto)
        //   { label: "Mensal"  }      → "Sob consulta"
        //   { label: "Sob demanda" }  → "Sob consulta"
        // Regra geral: plano com `hours` → label horária + preço computado;
        // sem `hours` → label livre + preço "Sob consulta".
        if (s.planos && s.planos.length) {
            const planos = s.planos.map(p => {
                if (typeof p.hours === "number") {
                    const hoursPart = `${fmtHours(p.hours)}h`;
                    const low  = p.hours * minRate;
                    const high = p.hours * maxRate;
                    const unitSuffix = p.unit ? `/${p.unit}` : "";
                    const preco = (low === high)
                        ? `${fmtBR(low)}${unitSuffix}`
                        : `${fmtBR(low)} – ${fmtBR(high)}${unitSuffix}`;
                    const formula = `${hoursPart} × ${ratePart}`;
                    return { label: p.label || hoursPart, preco, formula, consult: false };
                }
                return { label: p.label, preco: "Sob consulta", formula: null, consult: true };
            });
            return { planos, preco: null, formula: null, consult: false };
        }

        // Sem horas → Sob consulta.
        if (!s.hoursLow || !s.hoursHigh) {
            return { planos: null, preco: "Sob consulta", formula: null, consult: true };
        }

        // Per-unit pricing (palavra, torta, sessão, etc.) usa rate da rede e
        // mostra o total computado — não respeita non-sócio rule, porque
        // preço por unidade é padrão da rede, não negociado individualmente.
        const isPerUnit = !!s.unit && !s.recurring && s.unit !== "hora";
        if (isPerUnit) {
            const useRate = DEFAULT_HOURLY_RATE;
            const low  = s.hoursLow  * useRate;
            const high = s.hoursHigh * useRate;
            const unitSuffix = `/${s.unit}`;
            const preco = (low === high)
                ? `${fmtBR(low)}${unitSuffix}`
                : `${fmtBR(low)} – ${fmtBR(high)}${unitSuffix}`;
            // Pra unidades sub-hora (palavra, torta), a fórmula "0,003h por palavra"
            // confunde — esconde, deixa só o preço falar. Pra unidades >= 1h
            // (sessão, aula, consulta, diária, oficina), mostra a base.
            const formula = (s.hoursHigh < 1)
                ? `Tarifa-base R$ ${useRate}/h`
                : (s.hoursLow === s.hoursHigh
                    ? `${fmtHours(s.hoursLow)}h por ${s.unit} × R$ ${useRate}/h`
                    : `${fmtHours(s.hoursLow)}–${fmtHours(s.hoursHigh)}h por ${s.unit} × R$ ${useRate}/h`);
            return { planos: null, preco, formula, consult: false };
        }

        // Não-sócios em serviço por projeto → Sob consulta + canal direto.
        if (ativos.length && ativos.some(h => !isSocio(h))) {
            return { planos: null, preco: "Sob consulta", formula: null, consult: true };
        }

        // Sócios em serviço one-time → mostra a tarifa horária flat (R$ 100/h).
        // Total fica sob demanda, calculado conforme escopo do trabalho.
        const hoursPart = (s.hoursLow === s.hoursHigh)
            ? `~${fmtHours(s.hoursLow)}h estimadas`
            : `~${fmtHours(s.hoursLow)}–${fmtHours(s.hoursHigh)}h estimadas`;
        return { planos: null, preco: ratePart, formula: hoursPart, consult: false };
    }

    // Roster = what shows on /parceiros/ (top-level people + communities in this order)
    // Order is explicit (the editorial layout).
    const rosterOrder = [
        "yuri", "igo", "joseantonio", "mono",
        "luke", "marina", "karina", "kayra", "aime",
        "syl", "raquel", "alice", "ramona", "denise", "rogerio", "alzira", "miguel", "joao",
        "rodney",
        "bruna",
        "quilomboaraucaria", "hfsassociados", "hedix",
        "retro-umarizal"
    ];
    function roster() {
        // referenceOnly entities (citadas em Valores, mas fora do catálogo público)
        // nunca entram no roster. Defesa extra caso alguém adicione ao rosterOrder.
        return rosterOrder.map(h => get(h)).filter(e => e && !e.referenceOnly);
    }

    // Members in a community (full entities, em_memoria excluded by default).
    // referenceOnly fica sempre de fora (entidades de citação não pertencem a comunidades).
    function membersOf(communityHandle, { includeEmMemoria = false } = {}) {
        const c = get(communityHandle);
        if (!c || !c.membros) return [];
        return c.membros
            .map(h => get(h))
            .filter(m => m && !m.referenceOnly && (includeEmMemoria || !m.emMemoria));
    }

    // Sub-members of a person (like Alicia under Bruna, John under Aime)
    function subMembersOf(personHandle) {
        const p = get(personHandle);
        if (!p || !p.subMembers) return [];
        return p.subMembers.map(h => get(h)).filter(Boolean);
    }

    // Services resolved for a solution
    function bundledServices(solutionHandle) {
        const s = get(solutionHandle);
        if (!s) return [];
        if (s.bundledServices === "*") return publicServices();
        const map = Object.fromEntries(services.map(x => [x.titulo, x]));
        return s.bundledServices.map(t => map[t]).filter(Boolean);
    }

    function solutionsUsingService(titulo) {
        return solutions.filter(sol =>
            sol.bundledServices === "*" ||
            (Array.isArray(sol.bundledServices) && sol.bundledServices.includes(titulo))
        );
    }

    // Given a service title, find other services commonly bundled alongside (in solutions)
    function relatedServices(titulo) {
        const sols = solutionsUsingService(titulo).filter(s => s.bundledServices !== "*");
        const counts = new Map();
        for (const sol of sols) {
            for (const other of sol.bundledServices) {
                if (other !== titulo) counts.set(other, (counts.get(other) || 0) + 1);
            }
        }
        return [...counts.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([t]) => services.find(s => s.titulo === t))
            .filter(Boolean);
    }

    function serviceBySlug(slug) { return services.find(s => s.slug === slug); }
    function serviceByTitle(titulo) { return services.find(s => s.titulo === titulo); }

    // ─── POEMS ───────────────────────────────────────────────────────────────
    function poemBySlug(slug) { return poems.find(p => p.slug === slug); }
    function poemsByAuthor(handle) { return poems.filter(p => p.autor === handle); }

    // ─── MISSIONS ────────────────────────────────────────────────────────────
    function missionBySlug(slug) { return missions.find(m => m.handle === slug); }
    function topLevelMissions() { return missions.filter(m => !m.parentMission); }
    function missionsOfCommunity(handle) { return missions.filter(m => m.comunidade === handle && !m.parentMission); }
    function subMissionsOf(missionHandle) { return missions.filter(m => m.parentMission === missionHandle); }
    // Reverse index: quais missões usam este serviço?
    function missionsUsingService(titulo) {
        return missions.filter(m => (m.servicos || []).includes(titulo));
    }

    // Validação cruzada: todo mission.servicos[title] precisa existir no serviceCatalog.
    // Só roda se ambos os módulos foram carregados para esta página.
    if (serviceCatalog.length) {
        for (const m of missions) {
            for (const titulo of (m.servicos || [])) {
                if (!services.find(s => s.titulo === titulo)) {
                    console.warn(`[AL] Missão "${m.handle}" referencia serviço "${titulo}" inexistente no serviceCatalog`);
                }
            }
        }
    }

    // ─── MANIFESTO (Missão · Visão · Valores) ────────────────────────────────
    // Referência externa segue o padrão { obra, data, autor (handle), url }.
    // `autor` resolve para um perfil interno via AL.get — permite citar
    // pessoas históricas (referenceOnly: true) sem expô-las nos rosters.
    const manifesto = {
        missao: "Conectar parceiros a seus clientes.",
        visao: "Rede social profissional.",
        valores: [
            {
                titulo: "Semear sonhos, escrever legados.",
                texto: ""
            },
            {
                titulo: "Trabalho digno.",
                texto: "",
                referencia: {
                    obra: "Rerum Novarum: sobre a condição dos operários",
                    data: "15 de maio de 1891",
                    autor: "leaoxiii",
                    url: "https://www.vatican.va/content/leo-xiii/pt/encyclicals/documents/hf_l-xiii_enc_15051891_rerum-novarum.html"
                }
            },
            {
                titulo: "",
                texto: "Contribuir para a Agenda 2030 dos Objetivos de Desenvolvimento Sustentável.",
                referencia: {
                    obra: "Objetivos de Desenvolvimento Sustentável",
                    data: "2015",
                    autor: "ONU",
                    url: "https://brasil.un.org/pt-br/sdgs"
                }
            }
        ]
    };

    // ─── SÓCIOS ──────────────────────────────────────────────────────────────
    // Fonte única: o breakdown de `custos.socios` em finances.
    // Quem recebe pro-labore é sócio. Ponto.
    const socioCusto = (finances.custos || []).find(c => c.key === "socios");
    const socioHandles = new Set(
        ((socioCusto && socioCusto.breakdown) || [])
            .map(b => b.handle)
            .filter(Boolean)
    );
    function isSocio(handle) { return socioHandles.has(handle); }

    // ─── EXPORT ──────────────────────────────────────────────────────────────
    Object.assign(AL, {
        version: "2.1",
        people, communities, services, solutions, missions, poems, rosterOrder, finances, manifesto,
        get, byHandle, isEmMemoria, isInactive, isSocio,
        rateOf, computeFaixaPreco, DEFAULT_HOURLY_RATE,
        DEFAULT_LOCATION, locationOf, availableLocations, servicesIn, locationMatches, locationSuggestions,
        portfolio, portfolioOf, portfolioFor,
        publicServices, roster, membersOf, subMembersOf, bundledServices,
        serviceCatalog, slugify,
        serviceBySlug, serviceByTitle, solutionsUsingService, relatedServices,
        missionBySlug, topLevelMissions, missionsOfCommunity, subMissionsOf, missionsUsingService,
        poemBySlug, poemsByAuthor
    });

})(typeof window !== "undefined" ? window : globalThis);
