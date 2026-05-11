import type { Person, PortfolioEssay } from "../types";
import { esc } from "../lib/esc";
import { mdInline } from "../lib/markdown";
import { siteHeader } from "../components/SiteHeader";
import { siteFooter } from "../components/SiteFooter";
import { setPageSEO } from "../lib/seo";

export function render(): void {
    const handle = document.body.dataset["handle"] ?? "";
    const slug = document.body.dataset["slug"] ?? "";
    const AL = window.AL;
    const raw = handle ? AL.get(handle) : undefined;
    const person = raw && "portfolio" in raw ? (raw as Person) : undefined;
    const essay = person?.portfolio?.find(
        (item): item is PortfolioEssay => item.kind === "essay" && item.slug === slug
    );
    if (!essay) {
        document.body.innerHTML = `<main class="main"><p>Ensaio não encontrado.</p><a class="back" href="/">← voltar</a></main>`;
        return;
    }
    const backHref = person ? `/${esc(person.handle)}/` : "/";
    const backLabel = person ? `← voltar a ${esc(person.nome)}` : "← voltar";
    document.title = `${essay.titulo}${person ? " — " + person.nome : ""} — Arte Longa`;

    const BASE_URL = "https://artelonga.com.br";
    const essayDesc = essay.body ? essay.body.replace(/\n/g, " ").slice(0, 200) : undefined;
    setPageSEO({
        title: `${essay.titulo}${person ? " — " + person.nome : ""} — Arte Longa`,
        ...(essayDesc ? { description: essayDesc } : {}),
        url: person ? `/${person.handle}/${slug}/` : `/`,
        jsonLd: {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": essay.titulo,
            ...(person
                ? { "author": { "@type": "Person", "name": person.nome, "url": `${BASE_URL}/${person.handle}/` } }
                : {}),
            "publisher": { "@type": "Organization", "name": "Arte Longa", "url": BASE_URL },
        },
    });
    const bodyHtml = essay.body ? `<div class="essay-body">${mdInline(essay.body)}</div>` : "";
    document.body.innerHTML = `
        ${siteHeader()}
        <main class="main poem-page">
            <h1 class="poem-title">${esc(essay.titulo)}</h1>
            ${person ? `<div class="poem-author">por <a href="${backHref}">${esc(person.nome)}</a></div>` : ""}
            ${bodyHtml}
            <a class="back" href="${backHref}">${backLabel}</a>
        </main>
        ${siteFooter()}
    `;
}
