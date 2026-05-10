import { esc } from "../lib/esc";
import type { Service, FaixaPreco } from "../types";

export interface ServiceCardProps {
    service: Service;
    respNames: string;
    faixa: FaixaPreco;
}

export function ServiceCard(props: ServiceCardProps): string {
    const { service: s, respNames, faixa } = props;

    let precoHtml = "";
    if (faixa.planos) {
        precoHtml = `<ul class="market-card-planos">${faixa.planos
            .map(p => {
                const cls = p.consult ? "is-consult" : "";
                return `<li class="${cls}">
                    <span class="plano-label">${esc(p.label)}</span>
                    <span class="plano-preco">${esc(p.preco)}</span>
                </li>`;
            })
            .join("")}</ul>`;
    } else if (faixa.preco) {
        const priceCls = faixa.consult ? "market-card-price is-consult" : "market-card-price";
        precoHtml =
            `<div class="${priceCls}">${esc(faixa.preco)}</div>` +
            (faixa.formula ? `<div class="market-card-formula">${esc(faixa.formula)}</div>` : "");
    }

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
