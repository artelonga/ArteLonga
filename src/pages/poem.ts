import { esc } from "../lib/esc";
import { siteHeader } from "../components/SiteHeader";
import { siteFooter } from "../components/SiteFooter";
import { setPageSEO } from "../lib/seo";

export function render(): void {
    const slug = document.body.dataset["slug"] ?? "";
    const AL = window.AL;
    const poem = AL.poemBySlug(slug);
    if (!poem) {
        document.body.innerHTML = `<main class="main"><p>Poema não encontrado.</p><a class="back" href="/">← voltar</a></main>`;
        return;
    }
    const author = poem.autor ? AL.get(poem.autor) : undefined;
    document.title = `${poem.titulo}${author ? " — " + author.nome : ""} — Arte Longa`;

    const BASE_URL = "https://artelonga.com.br";
    setPageSEO({
        title: `${poem.titulo}${author ? " — " + author.nome : ""} — Arte Longa`,
        url: author ? `/${author.handle}/${slug}/` : `/`,
        jsonLd: {
            "@context": "https://schema.org",
            "@type": "CreativeWork",
            "name": poem.titulo,
            ...(author
                ? { "author": { "@type": "Person", "name": author.nome, "url": `${BASE_URL}/${author.handle}/` } }
                : {}),
        },
    });
    const stanzasHtml = poem.stanzas
        .map(stz => `<p class="poem-stanza">${stz.map(esc).join("<br>")}</p>`)
        .join("");
    const authorLine = author
        ? `<div class="poem-author">por <a href="/${esc(author.handle)}/">${esc(author.nome)}</a></div>`
        : "";
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
