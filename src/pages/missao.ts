import { esc } from "../lib/esc";
import { siteHeader } from "../components/SiteHeader";
import { siteFooter } from "../components/SiteFooter";
import { setPageSEO } from "../lib/seo";
import type { Mission, Service } from "../types";

// Página de uma missão (/missoes/<handle>/, data-page="missao"). Lê window.AL.missions.
// Reusa classes da página de serviço (service-*) pra herdar o estilo existente.
export function render(): void {
    const slug = document.body.dataset["slug"] ?? "";
    const AL = window.AL;
    const m: Mission | undefined = AL.missions.find(x => x.handle === slug);
    if (!m) {
        document.body.innerHTML = `${siteHeader()}<main class="main"><p>Missão não encontrada.</p><a class="back" href="/">← voltar pra home</a></main>${siteFooter()}`;
        return;
    }

    document.title = `${m.nome} — Missão — Arte Longa`;
    const desc = m.objetivo ?? m.subtitle;
    setPageSEO({
        title: `${m.nome} — Arte Longa`,
        ...(desc ? { description: desc } : {}),
        url: `/missoes/${m.handle}/`,
    });

    const com = m.comunidade ? AL.get(m.comunidade) : undefined;
    const autor = m.objetivoAutor ? AL.get(m.objetivoAutor) : undefined;

    const servicos: Service[] = (m.servicos ?? [])
        .map(t => AL.serviceByTitle(t))
        .filter((s): s is Service => s !== undefined);
    const subMissions = AL.subMissionsOf(m.handle);

    const subtitleHtml = m.subtitle ? `<p class="service-summary">${esc(m.subtitle)}</p>` : "";
    const comHtml = com
        ? `<div class="service-resp">Comunidade: <a href="/${esc(com.handle)}/">${esc(com.nome)}</a>${autor ? ` · por <a href="/${esc(autor.handle)}/">${esc(autor.nome)}</a>` : ""}</div>`
        : (autor ? `<div class="service-resp">Por <a href="/${esc(autor.handle)}/">${esc(autor.nome)}</a></div>` : "");
    const objetivoHtml = m.objetivo ? `<p class="service-summary"><strong>Objetivo.</strong> ${esc(m.objetivo)}</p>` : "";
    const tagsHtml = (m.tags ?? []).length
        ? `<div class="svc-meta">${(m.tags ?? []).map(t => `<span class="svc-meta-chunk">${esc(t)}</span>`).join(`<span class="svc-meta-sep">·</span>`)}</div>`
        : "";
    const servicosHtml = servicos.length
        ? `<div class="section-header"><h2>Serviços</h2><span class="label">o que esta missão mobiliza</span></div>
           <ul class="service-related">${servicos.map(s => `<li><a href="/servicos/${esc(s.slug ?? "")}/">${esc(s.titulo)}</a></li>`).join("")}</ul>`
        : "";
    const subHtml = subMissions.length
        ? `<div class="section-header"><h2>Sub-missões</h2><span class="label">${subMissions.length}</span></div>
           <ul class="service-related">${subMissions.map(s => `<li><a href="/missoes/${esc(s.handle)}/">${esc(s.nome)}</a></li>`).join("")}</ul>`
        : "";
    const ctaUrl = `/contato/?missao=${encodeURIComponent(m.nome)}`;

    document.body.innerHTML = `
        ${siteHeader()}
        <main class="main">
            <div class="service-crumb"><a href="/parceiros/">← Rede</a>${com ? ` · <a href="/${esc(com.handle)}/">${esc(com.nome)}</a>` : ""}</div>
            <h1 class="service-title">${esc(m.nome)}</h1>
            ${tagsHtml}
            ${subtitleHtml}
            ${comHtml}
            ${objetivoHtml}
            ${servicosHtml}
            ${subHtml}
            <p class="svc-cta"><a class="svc-cta-btn" href="${ctaUrl}">Falar conosco →</a></p>
            <a class="back" href="/">← voltar pra home</a>
        </main>
        ${siteFooter()}
    `;
}
