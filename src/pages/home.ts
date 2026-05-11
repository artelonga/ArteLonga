import { esc } from "../lib/esc";
import { norm } from "../lib/norm";
import { ANGLICISM_MAP } from "../lib/anglicism";
import { siteHeader } from "../components/SiteHeader";
import { siteFooter } from "../components/SiteFooter";
import { ServiceCard } from "../components/ServiceCard";
import { FilterChip } from "../components/FilterChip";
import { SearchInput } from "../components/SearchInput";
import { LocationInput } from "../components/LocationInput";
import { EmptyState } from "../components/EmptyState";
import type { Service } from "../types";
import { setPageSEO, OG_DEFAULT_IMAGE } from "../lib/seo";

const SUPERCATS: Array<{ id: string; label: string; titles: string[] }> = [
    { id: "eventos", label: "Eventos", titles: [
        "Filmagem de Festas e Eventos", "Fotografia", "Produção Musical",
        "Alimentação e Bebidas", "Hambúrguer Artesanal", "Piloto de Drone",
        "Atriz", "Cantora", "Modelo", "Dança e Expressão Corporal",
        "Artes Visuais", "Criação de Conteúdo", "Comunicação Visual",
        "Produção de Desfile", "Produção de Eventos",
    ]},
    { id: "digital", label: "Digital", titles: [
        "Inteligência e Tecnologia", "Desenvolvimento Web",
        "Desenvolvimento de Software", "Desenvolvimento de API",
        "Automação de Processos", "Privacidade e Segurança", "Comunicação Visual",
        "Marketing Digital", "Tráfego e Crescimento", "Design",
        "Experiência de Usuário (UI/UX)", "Criação de Conteúdo",
        "Consultoria em TI", "Nuvem", "Computação",
        "Dados e Armazenamento", "Hardware", "Sistemas Operacionais", "Redes",
    ]},
    { id: "educacao", label: "Educação", titles: [
        "Alfabetização", "Reforço Escolar", "Ensino, Formação e Liderança",
        "Mentoria Espiritual", "Educação Ambiental", "Tradução",
    ]},
    { id: "bem-estar", label: "Bem-estar", titles: [
        "Acompanhamento Nutricional", "Saúde Mental",
        "Terapia Comportamental", "Meditação", "Autocuidado",
        "Cuidado com o Idoso",
    ]},
    { id: "casa", label: "Casa", titles: [
        "Drywall e Bioconstrução", "Murais e Fachadas", "Grafite",
        "Agrofloresta", "Compostagem",
    ]},
    { id: "gestao", label: "Gestão", titles: [
        "Gestão Executiva", "Gestão Operacional", "Gestão de Logística", "Gestão de Vendas",
        "Gestão Contábil", "Gestão Fiscal", "Gestão Financeira", "Gestão Administrativa",
        "Consultoria Jurídica", "Auditoria", "Marketing Digital", "Design",
        "Tecnologia", "Inteligência e Tecnologia", "Inteligência de Previsão",
        "Automação de Processos", "Conexões", "Rede de Parcerias", "Rede de Talentos",
    ]},
    { id: "negocios", label: "Negócios", titles: [
        "Gestão Administrativa", "Gestão Contábil", "Gestão Executiva",
        "Gestão Financeira", "Gestão Fiscal", "Gestão Operacional",
        "Auditoria", "Automação de Processos",
        "Consultoria Jurídica", "Consultoria em Moda",
        "Rede de Parcerias", "Rede de Talentos", "Conexões",
        "Inteligência de Previsão", "Market Making Preditivo",
    ]},
    { id: "alimentacao", label: "Alimentação", titles: [
        "Alimentação e Bebidas", "Hambúrguer Artesanal", "Tortas Salgadas da Veh",
    ]},
    { id: "audiovisual", label: "Audiovisual", titles: [
        "Fotografia", "Piloto de Drone", "Produção Musical", "Filmagem de Festas e Eventos",
        "Escrita, Interpretação e Tradução", "Tradução", "Atriz", "Cantora",
        "Modelo", "Criação de Conteúdo", "Poeta",
    ]},
];

const BASE_URL = "https://artelonga.com.br";

export function render(): void {
    setPageSEO({
        title: "Arte Longa — Semeando Sonhos",
        description: "Arte Longa — agência de gestão de carreira, marca e produto, tecnologia e comunicação.",
        url: "/",
        jsonLd: [
            {
                "@context": "https://schema.org",
                "@type": "WebSite",
                "name": "Arte Longa",
                "url": BASE_URL,
            },
            {
                "@context": "https://schema.org",
                "@type": "Organization",
                "name": "Arte Longa",
                "url": BASE_URL,
                "logo": OG_DEFAULT_IMAGE,
                "description": "Arte Longa — agência de gestão de carreira, marca e produto, tecnologia e comunicação.",
            },
        ],
    });

    const AL = window.AL;
    const servicos = AL.publicServices();
    const handleToNome = Object.fromEntries(
        [...AL.people, ...AL.communities].map(e => [e.handle, e.nome])
    );
    const respNames = (handles: string[] | undefined): string =>
        (handles ?? []).map(h => handleToNome[h] ?? h).join(", ");
    const topo = servicos.filter(s => !s.parent);

    const byTitulo = new Map(servicos.map(s => [s.titulo, s]));
    const indexed = servicos.map(s => ({
        s,
        blob: norm([s.titulo, s.parent ?? "", respNames(s.responsavel)].join(" ")),
    }));

    const cats = SUPERCATS.map(c => ({
        ...c,
        items: c.titles.map(t => byTitulo.get(t)).filter((s): s is Service => s !== undefined),
    })).filter(c => c.items.length);

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
                ${cats.map(c => FilterChip({ id: c.id, label: c.label, count: c.items.length })).join("")}
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
                hidden: true,
            })}

            <p class="market-all"><a href="/servicos/">Rede completa →</a></p>
        </main>
        ${siteFooter()}
    `;

    const input = document.getElementById("market-q") as HTMLInputElement;
    const grid = document.getElementById("market-grid")!;
    const count = document.getElementById("market-count")!;
    const emptyEl = document.querySelector<HTMLElement>(".market-empty");
    const chipsBox = document.getElementById("sup-cats")!;
    const alOnly = document.getElementById("al-only") as HTMLInputElement | null;
    const locFields: Record<string, HTMLInputElement> = {};
    for (const f of ["estado", "cidade", "bairro"]) {
        const el = document.getElementById("loc-" + f) as HTMLInputElement | null;
        if (el) locFields[f] = el;
    }

    let activeCat = "";
    let locDebounce: ReturnType<typeof setTimeout> | undefined;

    const locOptsByField: Record<string, string[]> = {
        estado: locOpts.estados,
        cidade: locOpts.cidades,
        bairro: locOpts.bairros,
    };

    function normLoc(s: string): string {
        return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
    }

    function renderDropdown(field: string): void {
        const el = locFields[field];
        const dd = document.getElementById("dd-" + field) as HTMLElement | null;
        if (!el || !dd) return;
        const q = normLoc(el.value);
        const opts = locOptsByField[field] ?? [];
        const list = opts.filter(v => !q || normLoc(v).includes(q));
        if (!list.length) { dd.hidden = true; dd.innerHTML = ""; return; }
        dd.innerHTML = list.map(v => `<li role="option" data-val="${esc(v)}">${esc(v)}</li>`).join("");
        dd.hidden = false;
    }

    function closeAllDropdowns(): void {
        document.querySelectorAll<HTMLElement>(".loc-dropdown").forEach(d => { d.hidden = true; });
    }

    function locFilter(list: Service[]): Service[] {
        return list.filter(s => {
            if (s.digital) return true;
            return (s.responsavel ?? []).some(h => {
                if (AL.isInactive(h)) return false;
                return AL.locationMatches(h, activeFilters);
            });
        });
    }

    function alOnlyFilter(list: Service[]): Service[] {
        if (!alOnly?.checked) return list;
        return list.filter(s =>
            (s.responsavel ?? []).some(h => !AL.isInactive(h) && AL.isSocio(h))
        );
    }

    function applyFilter(): void {
        const q = norm(input.value.trim());
        const tokens = q ? q.split(/\s+/).filter(Boolean) : [];

        let list: Service[];
        if (tokens.length) {
            list = indexed
                .filter(({ blob }) =>
                    tokens.every(t => {
                        if (blob.includes(t)) return true;
                        const syns = ANGLICISM_MAP[t];
                        return syns ? syns.some(s => blob.includes(s)) : false;
                    })
                )
                .map(x => x.s);
        } else if (activeCat) {
            const cat = cats.find(c => c.id === activeCat);
            list = cat ? cat.items : [];
        } else {
            list = topo;
        }

        list = locFilter(list);
        list = alOnlyFilter(list);

        grid.innerHTML = list
            .map(s => ServiceCard({ service: s, respNames: respNames(s.responsavel), faixa: AL.computeFaixaPreco(s) }))
            .join("");

        const inputVal = input.value.trim();
        if (tokens.length) {
            count.textContent = `${list.length} resultado${list.length === 1 ? "" : "s"} para "${inputVal}"`;
        } else if (activeCat) {
            const cat = cats.find(c => c.id === activeCat);
            count.textContent = `${list.length} em ${cat?.label ?? activeCat}`;
        } else {
            count.textContent = `${list.length} serviços`;
        }
        if (emptyEl) emptyEl.hidden = list.length !== 0;

        const matching = tokens.length
            ? new Set(
                  indexed
                      .filter(({ blob }) =>
                          tokens.every(t => {
                              if (blob.includes(t)) return true;
                              const syns = ANGLICISM_MAP[t];
                              return syns ? syns.some(s => blob.includes(s)) : false;
                          })
                      )
                      .map(x => x.s.titulo)
              )
            : null;
        const countFor = (items: Service[]): number => {
            const filtered = matching ? items.filter(s => matching.has(s.titulo)) : items;
            return alOnlyFilter(locFilter(filtered)).length;
        };
        const allChipCount = chipsBox.querySelector<HTMLElement>('.sup-chip[data-cat=""] .sup-count');
        if (allChipCount) allChipCount.textContent = String(countFor(topo));
        cats.forEach(cat => {
            const el = chipsBox.querySelector<HTMLElement>(`.sup-chip[data-cat="${cat.id}"] .sup-count`);
            if (el) el.textContent = String(countFor(cat.items));
        });
    }

    input.addEventListener("input", applyFilter);
    alOnly?.addEventListener("change", applyFilter);

    chipsBox.addEventListener("click", e => {
        const btn = (e.target as Element).closest<HTMLElement>(".sup-chip");
        if (!btn) return;
        chipsBox.querySelectorAll<HTMLElement>(".sup-chip").forEach(b => {
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
        const dd = document.getElementById("dd-" + field) as HTMLElement | null;
        if (!el || !dd) continue;

        el.addEventListener("focus", () => {
            if (!touchedFields[field as keyof typeof touchedFields]) el.select();
            renderDropdown(field);
        });
        el.addEventListener("input", () => {
            el.classList.remove("is-default");
            touchedFields[field as keyof typeof touchedFields] = true;
            activeFilters[field as keyof typeof activeFilters] = el.value.trim();
            renderDropdown(field);
            clearTimeout(locDebounce);
            locDebounce = setTimeout(applyFilter, 120);
        });
        el.addEventListener("blur", () => {
            setTimeout(() => { dd.hidden = true; }, 120);
        });
        el.addEventListener("keydown", e => {
            if ((e as KeyboardEvent).key === "Escape") { dd.hidden = true; el.blur(); }
        });
        dd.addEventListener("mousedown", e => {
            const li = (e.target as Element).closest<HTMLElement>("li[data-val]");
            if (!li) return;
            e.preventDefault();
            el.value = li.dataset["val"] ?? "";
            el.classList.remove("is-default");
            touchedFields[field as keyof typeof touchedFields] = true;
            activeFilters[field as keyof typeof activeFilters] = el.value.trim();
            dd.hidden = true;
            applyFilter();
        });
    }

    document.addEventListener("click", e => {
        if (!(e.target as Element).closest(".market-loc-field")) closeAllDropdowns();
    });

    applyFilter();
    input.focus();
}
