import { esc } from "../lib/esc";
import { siteHeader } from "../components/SiteHeader";
import { siteFooter } from "../components/SiteFooter";
import type { Service, Person, Community, FaixaPreco, FaixaPlano } from "../types";

const EXEMPLOS: Record<string, Array<{ name: string; url: string }>> = {
    "Desenvolvimento Web": [{ name: "Quilombo Araucária", url: "/quilomboaraucaria/" }],
    "Design": [{ name: "Quilombo Araucária", url: "/quilomboaraucaria/" }],
    "Desenvolvimento de API": [{ name: "Quilombo Araucária", url: "/quilomboaraucaria/" }],
    "Privacidade e Segurança": [{ name: "Quilombo Araucária", url: "/quilomboaraucaria/" }],
    "Criação de Conteúdo": [{ name: "Quilombo Araucária", url: "/relatos/" }],
};

type ServiceProvider = Person | Community;

export function render(): void {
    const slug = document.body.dataset["slug"] ?? "";
    const AL = window.AL;
    const s = AL.serviceBySlug(slug);
    if (!s) {
        document.body.innerHTML = `<main class="main"><p>Serviço não encontrado.</p><a class="back" href="/">← voltar</a></main>`;
        return;
    }

    document.title = `${s.nome ?? s.titulo} — Serviços — Arte Longa`;

    const respEntities: ServiceProvider[] = (s.responsavel ?? [])
        .map(h => AL.get(h))
        .filter((e): e is ServiceProvider => e !== undefined && e.type !== "solution");

    const respLinks = respEntities
        .map(e => {
            const url = e.externalUrl ? e.externalUrl : `/${e.handle}/`;
            const attr = e.externalUrl ? ` target="_blank" rel="noopener"` : "";
            return `<a href="${url}"${attr}>${esc(e.nome)}</a>`;
        })
        .join(", ");

    const faixa = AL.computeFaixaPreco(s);
    const metaHtml = buildMetaHtml(s, faixa);
    const formulaHtml = faixa.formula ? `<div class="svc-formula">${esc(faixa.formula)}</div>` : "";
    const planosHtml = buildPlanosHtml(faixa.planos);

    const related = AL.relatedServices(s.titulo);
    const relHtml = related.length
        ? `<ul class="service-related">${related
              .map(r => `<li><a href="/servicos/${esc(r.slug ?? "")}/">${esc(r.titulo)}</a></li>`)
              .join("")}</ul>`
        : "";

    const descText = s.descNossa ?? s.summary;
    const summaryHtml = descText ? `<p class="service-summary">${esc(descText)}</p>` : "";
    const attachmentsHtml = buildAttachmentsHtml(s);

    const respAtivos = respEntities.filter(p => !AL.isInactive(p.handle));
    const fallbackCtUrl = `/contato/?servico=${encodeURIComponent(s.titulo)}`;
    const provedoresHtml = respAtivos.length
        ? `<div class="provedores">${respAtivos.map(p => provedorCard(p, s)).join("")}</div>`
        : `<p class="svc-cta"><a class="svc-cta-btn" href="${fallbackCtUrl}">Falar conosco →</a></p>`;

    const allServices = AL.publicServices();
    const childServices = (s.children ?? [])
        .map(t => allServices.find(x => x.titulo === t))
        .filter((c): c is Service => c !== undefined);
    const subServicosHtml = childServices.length
        ? `<div class="section-header"><h2>Sub-serviços</h2><span class="label">${childServices.length} variantes</span></div>
           <ul class="svc-children">${childServices.map(c => childCard(c)).join("")}</ul>`
        : "";

    const exemplos = EXEMPLOS[s.titulo] ?? [];
    const exemplosHtml = exemplos.length
        ? `<ul class="svc-exemplos">${exemplos.map(e => `<li><a href="${esc(e.url)}">${esc(e.name)} →</a></li>`).join("")}</ul>`
        : `<p class="svc-exemplos-empty">Em breve.</p>`;

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

function buildMetaHtml(s: Service, faixa: FaixaPreco): string {
    const parts: string[] = [];
    if (s.paraQuem) parts.push(`<span class="svc-meta-chunk">${esc(s.paraQuem)}</span>`);
    if (faixa.preco && !faixa.planos) {
        parts.push(`<span class="svc-meta-chunk svc-meta-price">${esc(faixa.preco)}</span>`);
    }
    return parts.length
        ? `<div class="svc-meta">${parts.join(`<span class="svc-meta-sep">·</span>`)}</div>`
        : "";
}

function buildPlanosHtml(planos: FaixaPlano[] | undefined): string {
    if (!planos) return "";
    return `<ul class="svc-planos">${planos
        .map(p => {
            const cls = p.consult ? "is-consult" : "";
            const formulaText = p.formula ?? "orçamento personalizado";
            return `<li class="${cls}">
                <div class="svc-plano-label">${esc(p.label)}</div>
                <div class="svc-plano-preco">${esc(p.preco)}</div>
                <div class="svc-plano-formula">${esc(formulaText)}</div>
            </li>`;
        })
        .join("")}</ul>`;
}

function buildAttachmentsHtml(s: Service): string {
    if (!s.attachments?.length) return "";
    return `<div class="section-header"><h2>Material</h2><span class="label">download</span></div>
       <ul class="service-attachments">${s.attachments
           .map(a => `<li><a href="${esc(a.url)}" target="_blank" rel="noopener" class="attachment-link">
             <span class="att-kind">${esc((a.kind ?? "arquivo").toUpperCase())}</span>
             <span class="att-label">${esc(a.label)}</span>
             <span class="att-arrow">baixar →</span>
           </a></li>`)
           .join("")}</ul>`;
}

function provedorCard(p: ServiceProvider, s: Service): string {
    const AL = window.AL;
    const url = p.externalUrl ? p.externalUrl : `/${p.handle}/`;
    const c = ("contacts" in p ? p.contacts : undefined) ?? {};
    const role = p.role ? `<div class="provedor-role">${esc(p.role)}</div>` : "";
    const tag = c.tagline ? `<p class="provedor-tagline">${esc(c.tagline)}</p>` : "";

    const actions: string[] = [];
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

    if (!AL.isInactive(p.handle)) {
        // check passes
    }

    return `<div class="provedor-card">
        <div class="provedor-head">
            <a class="provedor-nome" href="${url}">${esc(p.nome)}</a>
            ${role}
        </div>
        ${tag}
        <div class="provedor-actions">${actions.join("")}</div>
    </div>`;
}

function childCard(c: Service): string {
    const AL = window.AL;
    const f = AL.computeFaixaPreco(c);
    const respList = (c.responsavel ?? [])
        .map(h => {
            const e = AL.get(h);
            return e ? esc(e.nome) : esc(h);
        })
        .join(", ");
    const precoLine = f.preco
        ? `<span class="svc-child-preco">${esc(f.preco)}</span>`
        : f.planos
        ? `<span class="svc-child-preco">${f.planos.length} planos</span>`
        : "";
    return `<li>
        <a href="/servicos/${esc(c.slug ?? "")}/" class="svc-child-link">
            <span class="svc-child-titulo">${esc(c.titulo)}</span>
            ${c.paraQuem ? `<span class="svc-child-meta">${esc(c.paraQuem)}</span>` : ""}
            ${precoLine}
            <span class="svc-child-resp">${respList}</span>
        </a>
    </li>`;
}

function svgWhatsApp(): string {
    return `<svg class="svc-cta-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M20.52 3.48A11.94 11.94 0 0 0 12.06 0C5.5 0 .15 5.34.15 11.91c0 2.1.55 4.15 1.6 5.96L0 24l6.27-1.65a11.9 11.9 0 0 0 5.79 1.5h.01c6.56 0 11.91-5.34 11.91-11.91 0-3.18-1.24-6.17-3.46-8.46zM12.06 21.7h-.01a9.8 9.8 0 0 1-5-1.37l-.36-.21-3.72.98 1-3.62-.24-.37a9.78 9.78 0 1 1 18.13-5.2c0 5.4-4.4 9.79-9.8 9.79zm5.36-7.32c-.29-.15-1.74-.86-2-.96-.27-.1-.46-.15-.66.15-.19.29-.76.96-.93 1.16-.17.19-.34.22-.63.07-.29-.15-1.24-.46-2.36-1.46-.87-.78-1.46-1.74-1.63-2.03-.17-.29-.02-.45.13-.6.13-.13.29-.34.43-.51.15-.17.19-.29.29-.48.1-.19.05-.36-.02-.51-.07-.15-.66-1.6-.91-2.18-.24-.57-.48-.49-.66-.5h-.56c-.19 0-.5.07-.77.36-.27.29-1.02 1-1.02 2.43 0 1.43 1.05 2.81 1.2 3 .15.19 2.07 3.16 5.01 4.43.7.3 1.25.48 1.68.62.7.22 1.34.19 1.85.12.56-.08 1.74-.71 1.99-1.4.24-.69.24-1.27.17-1.4-.07-.13-.27-.21-.56-.36z"/></svg>`;
}

function svgInstagram(): string {
    return `<svg class="svc-cta-icon" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.05.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.05.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.05-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.05-.36 2.23-.41 1.27-.06 1.65-.07 4.85-.07M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.3-1.46.71-2.13 1.38S.93 3.35.63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.3.79.71 1.46 1.38 2.13.67.67 1.34 1.08 2.13 1.38.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56.79-.3 1.46-.71 2.13-1.38.67-.67 1.08-1.34 1.38-2.13.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91-.3-.79-.71-1.46-1.38-2.13C21.32 1.32 20.65.91 19.86.61c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32zm0 10.16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z"/></svg>`;
}
