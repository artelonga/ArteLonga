//#region src/components/Badge.ts
function Badge(props) {
	return `<span class="${props.tone === "online" ? "market-card-online" : props.tone === "counter" ? "market-card-children" : "badge-muted"}">${props.label}</span>`;
}
//#endregion
//#region src/lib/esc.ts
var ESC_MAP = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"\"": "&quot;",
	"'": "&#39;"
};
function esc(s) {
	return String(s ?? "").replace(/[&<>"']/g, (c) => ESC_MAP[c] ?? c);
}
//#endregion
//#region src/components/Button.ts
function Button(props) {
	const { label, variant = "primary", as: elem = "button", href, arrow, dataCta } = props;
	const text = arrow ? `${esc(label)} →` : esc(label);
	if (elem === "a") return `<a class="${variant === "primary" ? "cta-button" : "cta-secondary"}" href="${esc(href ?? "#")}">${text}</a>`;
	if (dataCta) return `<button type="button" class="cta-button" data-cta="${esc(dataCta)}">${text}</button>`;
	return `<button type="button" class="${variant === "primary" ? "ct-submit" : "cta-secondary"}">${text}</button>`;
}
//#endregion
//#region src/components/FilterChip.ts
function FilterChip(props) {
	const { id, label, count, active } = props;
	const cls = active ? "sup-chip is-active" : "sup-chip";
	const pressed = active ? "true" : "false";
	return `<button type="button" class="${cls}" data-cat="${esc(id)}" aria-pressed="${pressed}">
        ${esc(label)} <span class="sup-count">${count}</span>
    </button>`;
}
//#endregion
//#region src/components/ToggleChip.ts
function ToggleChip(props) {
	const { id, label, checked } = props;
	return `<label class="toggle-chip">
        <input type="checkbox" id="${esc(id)}"${checked ? " checked" : ""}>
        <span>${esc(label)}</span>
    </label>`;
}
//#endregion
//#region src/components/EmptyState.ts
function EmptyState(props) {
	const { message, ctaHref, ctaLabel, hidden } = props;
	const cta = ctaHref && ctaLabel ? ` <a href="${esc(ctaHref)}">${esc(ctaLabel)}</a>` : "";
	return `<p class="market-empty"${hidden ? " hidden" : ""}>${esc(message)}${cta}</p>`;
}
//#endregion
//#region src/components/ServiceCard.ts
function ServiceCard(props) {
	const { service: s, respNames, faixa } = props;
	let precoHtml = "";
	if (faixa.planos) precoHtml = `<ul class="market-card-planos">${faixa.planos.map((p) => {
		return `<li class="${p.consult ? "is-consult" : ""}">
                    <span class="plano-label">${esc(p.label)}</span>
                    <span class="plano-preco">${esc(p.preco)}</span>
                </li>`;
	}).join("")}</ul>`;
	else if (faixa.preco) precoHtml = `<div class="${faixa.consult ? "market-card-price is-consult" : "market-card-price"}">${esc(faixa.preco)}</div>` + (faixa.formula ? `<div class="market-card-formula">${esc(faixa.formula)}</div>` : "");
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
//#endregion
//#region src/showcase.ts
function mount(selector, html) {
	document.querySelectorAll(`[data-showcase="${selector}"]`).forEach((el) => {
		el.innerHTML = html;
	});
}
document.addEventListener("DOMContentLoaded", () => {
	mount("badge-online", Badge({
		tone: "online",
		label: "online"
	}));
	mount("badge-counter", Badge({
		tone: "counter",
		label: "+11"
	}));
	mount("button-primary", Button({
		label: "Enviar",
		variant: "primary",
		arrow: true
	}));
	mount("button-secondary", Button({
		label: "Para parceiros",
		variant: "secondary",
		as: "a",
		href: "/faca-parte/",
		arrow: true
	}));
	mount("filter-chips", FilterChip({
		id: "",
		label: "Todos",
		count: 12,
		active: true
	}) + FilterChip({
		id: "digital",
		label: "Digital",
		count: 8
	}) + FilterChip({
		id: "bem-estar",
		label: "Bem-estar",
		count: 5
	}));
	mount("toggle-chip", ToggleChip({
		id: "al-only-showcase",
		label: "Prestados pela Arte Longa"
	}));
	mount("empty-state", EmptyState({
		message: "Nenhum resultado por aqui.",
		ctaHref: "/contato/",
		ctaLabel: "Entre em contato para encontrarmos uma solução →"
	}));
	mount("service-card-hours", ServiceCard({
		service: {
			titulo: "Desenvolvimento Web",
			slug: "desenvolvimento-web",
			digital: true,
			responsavel: []
		},
		respNames: "Yuri",
		faixa: {
			preco: "R$ 4.000 — R$ 20.000",
			formula: "Tarifa-base R$ 100/h"
		}
	}));
	mount("service-card-planos", ServiceCard({
		service: {
			titulo: "Mentoria Espiritual",
			slug: "mentoria-espiritual",
			digital: true,
			responsavel: []
		},
		respNames: "Aime",
		faixa: { planos: [
			{
				label: "Sessão avulsa",
				preco: "R$ 100"
			},
			{
				label: "Semanal",
				preco: "R$ 400/mês"
			},
			{
				label: "Mensal",
				preco: "Sob consulta",
				consult: true
			}
		] }
	}));
	mount("service-card-consult", ServiceCard({
		service: {
			titulo: "Babá",
			slug: "baba",
			responsavel: []
		},
		respNames: "Kelly",
		faixa: {
			preco: "Sob consulta",
			consult: true
		}
	}));
});
//#endregion
