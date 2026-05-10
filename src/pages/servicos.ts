import { esc } from "../lib/esc";
import { norm } from "../lib/norm";
import { siteHeader } from "../components/SiteHeader";
import { siteFooter } from "../components/SiteFooter";
import { ctaLead, modalContact } from "../lib/ui";

export function render(): void {
    const AL = window.AL;
    const servicos = AL.publicServices();
    const handleToNome = Object.fromEntries(
        [...AL.people, ...AL.communities].map(e => [e.handle, e.nome])
    );
    const respNames = (handles: string[] | undefined): string =>
        (handles ?? []).map(h => handleToNome[h] ?? h).join(", ");

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

    const listEl = document.getElementById("portfolio-list")!;
    const countEl = document.getElementById("count")!;
    const searchEl = document.getElementById("search") as HTMLInputElement;
    const leadModal = document.getElementById("lead-modal")!;

    leadModal.addEventListener("click", e => {
        const target = e.target as Element;
        if (target === leadModal || target.classList.contains("modal-close"))
            leadModal.classList.remove("on");
    });
    document.addEventListener("keydown", e => {
        if (e.key === "Escape") leadModal.classList.remove("on");
    });
    document.querySelector('[data-cta="servicos"]')?.addEventListener("click", () =>
        leadModal.classList.add("on")
    );

    function makeRow(s: (typeof servicos)[number], inChildren = false): string {
        const parent = s.parent ? `<span class="portfolio-parent">${esc(s.parent)} ›</span> ` : "";
        const titulo = inChildren ? esc(s.titulo) : `${parent}${esc(s.titulo)}`;
        const childCount = s.children?.length ?? 0;
        const expandable =
            childCount > 0 && !inChildren ? `<span class="portfolio-expand">+${childCount}</span>` : "";
        const resp = inChildren ? "" : `<div class="portfolio-resp">${esc(respNames(s.responsavel))}</div>`;
        const children =
            !inChildren && s.children?.length
                ? `<ul class="portfolio-children">${s.children
                      .map(ct => {
                          const ch = servicos.find(x => x.titulo === ct);
                          if (!ch) return "";
                          return `<li><a href="/servicos/${esc(ch.slug ?? "")}/" class="portfolio-link child-link"><span>${esc(ch.titulo)}</span></a></li>`;
                      })
                      .join("")}</ul>`
                : "";
        return `<li class="${expandable ? "has-children" : ""}">
            <a href="/servicos/${esc(s.slug ?? "")}/" class="portfolio-link">
                <div class="portfolio-titulo">${titulo}${expandable}</div>
                ${resp}
            </a>
            ${children}
        </li>`;
    }

    function renderList(): void {
        const q = norm(searchEl.value);
        let filtered: typeof servicos;
        if (q) {
            filtered = servicos.filter(
                s =>
                    norm(s.titulo).includes(q) ||
                    norm(respNames(s.responsavel)).includes(q) ||
                    (s.parent ? norm(s.parent).includes(q) : false)
            );
            countEl.textContent = `${filtered.length} de ${servicos.length} serviços`;
        } else {
            filtered = servicos.filter(s => !s.parent);
            countEl.textContent = `${filtered.length} serviços · ${servicos.length - filtered.length} sub-serviços`;
        }
        if (!filtered.length) {
            listEl.innerHTML = `<li class="empty-state">Nenhum serviço encontrado.</li>`;
            return;
        }
        listEl.innerHTML = filtered.map(s => makeRow(s, !!q)).join("");
    }

    const urlQ = new URLSearchParams(location.search).get("q");
    if (urlQ) searchEl.value = urlQ;
    searchEl.addEventListener("input", renderList);
    renderList();
}
