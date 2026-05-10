import { esc } from "../lib/esc";
import { siteHeader } from "../components/SiteHeader";
import { siteFooter } from "../components/SiteFooter";
import { ProfileCard } from "../components/ProfileCard";
import { avatarSm } from "../components/ProfileCard";
import { ctaLead, modalContact, wireModal, wirePopover } from "../lib/ui";
import type { Person, Community } from "../types";

type RosterEntity = Person | Community;

export function render(): void {
    const h = (location.hash || "").toLowerCase();
    if (h === "#todos" || h === "#showall") {
        renderParceirosShowAll();
        window.addEventListener("hashchange", render);
        return;
    }
    window.addEventListener("hashchange", render);
    renderParceiros();
}

function renderParceirosShowAll(): void {
    const AL = window.AL;
    const all = AL.people
        .filter(p => !p.referenceOnly)
        .sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "pt-BR"));
    const items = all.map(p => `<li><a href="/${esc(p.handle)}/">${esc(p.nome)}</a></li>`).join("");
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

function renderParceiros(): void {
    const AL = window.AL;
    const roster = AL.roster();

    const rows = roster.map(entity => {
        const isComunidade = entity.type === "community";
        const nameUrl = entity.externalUrl ? entity.externalUrl : `/${entity.handle}/`;
        const nameAttrs = entity.externalUrl ? ` target="_blank" rel="noopener"` : "";
        const verMaisUrl = `/${entity.handle}/`;
        const verMaisLabel = isComunidade ? "Ver Mais →" : "ver mais →";
        const seeMore = entity.muted ? "" : `<a class="see-more" href="${verMaisUrl}">${verMaisLabel}</a>`;
        const socioMark =
            !isComunidade && AL.isSocio(entity.handle)
                ? `<span class="socio-mark" aria-label="sócio">*</span>`
                : "";
        const nameHtml = `<a href="${nameUrl}" class="name"${nameAttrs}>${esc(entity.nome)}${socioMark}</a>`;

        const subHandles = isComunidade
            ? (entity as Community).membros
            : (entity as Person).subMembers;
        const subs = (subHandles ?? []).map(h => AL.get(h)).filter(Boolean) as RosterEntity[];

        const rosterSet = new Set(AL.rosterOrder ?? []);
        const splitSubs = (list: RosterEntity[]): { visible: RosterEntity[]; hidden: RosterEntity[] } => {
            if (!isComunidade) return { visible: list, hidden: [] };
            const visible: RosterEntity[] = [];
            const hidden: RosterEntity[] = [];
            for (const m of list) {
                if (rosterSet.has(m.handle)) hidden.push(m);
                else visible.push(m);
            }
            return { visible, hidden };
        };
        const { visible: subsVisible, hidden: subsHidden } = splitSubs(subs);

        const hiddenBadge = subsHidden.length ? `<li class="membros-badge">+ ${subsHidden.length} membros</li>` : "";
        const membrosHtml =
            subsVisible.length || subsHidden.length
                ? `<ul class="card-membros">${subsVisible.map(m => miniRow(m)).join("")}${hiddenBadge}</ul>`
                : "";

        const svcList =
            !isComunidade && (entity as Person).servicos?.length
                ? ((entity as Person).servicos ?? [])
                : [];
        const svcItems = svcList.length ? expandTitlesForPopover(svcList) : [];
        const servicosBtn = svcItems.length
            ? `<button type="button" class="ver-servicos-btn" aria-expanded="false">Ver serviços (${svcItems.length}) →</button>`
            : isComunidade || entity.muted
            ? ""
            : `<span class="card-missoes-hint">em breve</span>`;
        const servicosPopover = svcItems.length
            ? `<div class="servicos-popover" role="dialog" aria-label="Serviços de ${esc(entity.nome)}">
                <div class="servicos-popover-head">Serviços de ${esc(entity.nome)}</div>
                <ul class="servicos-popover-list">${renderPopoverList(svcItems)}</ul>
               </div>`
            : "";

        const avatar = isComunidade ? "" : avatarSm({ entity: entity as Person });
        const profileBlock = isComunidade
            ? ProfileCard({ entity })
            : `<div class="profile-block">${avatar}${ProfileCard({ entity })}</div>`;

        const liClasses = [
            entity.muted ? "muted" : "",
            entity.emMemoria ? "em-memoria" : "",
            entity.emBreve ? "em-breve" : "",
            !isComunidade ? "" : (entity as Community).sectionBreak ? "section-break" : "",
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

    document.querySelectorAll<HTMLElement>(".roster > li").forEach(li => {
        const role = li.querySelector<HTMLElement>(":scope > .row > .role");
        if (role) role.addEventListener("click", e => { e.stopPropagation(); li.classList.toggle("open"); });
    });
    document.querySelectorAll<HTMLElement>(".mini-row").forEach(row => {
        row.addEventListener("click", e => {
            if ((e.target as Element).closest(".mini-name")) return;
            e.stopPropagation();
            row.classList.toggle("open");
        });
    });
    document.querySelectorAll<HTMLElement>(".membros-more-btn").forEach(btn => {
        const list = btn.previousElementSibling as HTMLElement | null;
        const more = btn.dataset["more"] ?? "0";
        btn.addEventListener("click", e => {
            e.stopPropagation();
            const expanded = list?.classList.toggle("membros-expanded") ?? false;
            btn.textContent = expanded ? "ver menos" : `ver mais (+${more})`;
        });
    });

    wirePopover(".roster > li");
    wireModal("contact-modal", '[data-cta="parceiros"]');
}

// ── Helpers ───────────────────────────────────────────────────────────────

function miniRow(entity: RosterEntity): string {
    const memoriaTag = entity.emMemoria ? ` <span class="mini-memoria">em memória</span>` : "";
    const servicos = !("servicos" in entity && entity.servicos?.length)
        ? ""
        : `<div class="mini-drawer"><ul class="mini-missoes">${(entity.servicos ?? []).map(m => `<li>${esc(m)}</li>`).join("")}</ul></div>`;
    return `<li class="mini-row${entity.emMemoria ? " mini-row-memoria" : ""}">
        <a class="mini-name" href="/${esc(entity.handle)}/">${esc(entity.nome)}</a>${memoriaTag}
        ${servicos}
    </li>`;
}

interface PopoverItem {
    titulo: string;
    slug: string;
    role: "group" | "child" | "item";
}

function expandTitlesForPopover(titles: string[]): PopoverItem[] {
    const AL = window.AL;
    const items: PopoverItem[] = [];
    for (const t of titles) {
        const children = AL.services.filter(s => s.parent === t);
        if (children.length) {
            const parentSvc = AL.serviceByTitle(t);
            items.push({
                titulo: t,
                slug: parentSvc ? (parentSvc.slug ?? AL.slugify(t)) : AL.slugify(t),
                role: "group",
            });
            for (const c of children) {
                items.push({ titulo: c.titulo, slug: c.slug ?? AL.slugify(c.titulo), role: "child" });
            }
        } else {
            const svc = AL.serviceByTitle(t);
            items.push({
                titulo: t,
                slug: svc ? (svc.slug ?? AL.slugify(t)) : AL.slugify(t),
                role: "item",
            });
        }
    }
    return items;
}

function renderPopoverList(items: PopoverItem[]): string {
    return items
        .map(it => {
            const cls = it.role === "group" ? "svc-group" : it.role === "child" ? "svc-child" : "";
            return `<li${cls ? ` class="${cls}"` : ""}><a href="/servicos/${esc(it.slug)}/">${esc(it.titulo)} →</a></li>`;
        })
        .join("");
}
