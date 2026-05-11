const BASE_URL = "https://artelonga.com.br";
export const OG_DEFAULT_IMAGE = `${BASE_URL}/assets/og-default.png`;

export interface SEOOptions {
    title: string;
    description?: string;
    url: string;
    ogImage?: string;
    ogType?: string;
    jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

function appendSeoEl(tag: string, attrs: Record<string, string>, text?: string): void {
    const el = document.createElement(tag);
    el.setAttribute("data-seo", "1");
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    if (text !== undefined) el.textContent = text;
    document.head.appendChild(el);
}

export function setPageSEO(opts: SEOOptions): void {
    const { title, description, url, ogImage = OG_DEFAULT_IMAGE, ogType = "website", jsonLd } = opts;
    const canonical = url.startsWith("http") ? url : `${BASE_URL}${url}`;

    document.head.querySelectorAll("[data-seo]").forEach(el => el.remove());

    appendSeoEl("link", { rel: "canonical", href: canonical });

    const og: [string, string][] = [
        ["og:title", title],
        ["og:url", canonical],
        ["og:type", ogType],
        ["og:image", ogImage],
        ["og:site_name", "Arte Longa"],
    ];
    if (description) og.push(["og:description", description]);
    for (const [property, content] of og) {
        appendSeoEl("meta", { property, content });
    }

    if (description) {
        appendSeoEl("meta", { name: "description", content: description });
    }

    const tw: [string, string][] = [
        ["twitter:card", "summary_large_image"],
        ["twitter:title", title],
        ["twitter:image", ogImage],
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
