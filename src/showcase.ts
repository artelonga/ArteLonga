import { Badge } from "./components/Badge";
import { Button } from "./components/Button";
import { FilterChip } from "./components/FilterChip";
import { ToggleChip } from "./components/ToggleChip";
import { EmptyState } from "./components/EmptyState";
import { ServiceCard } from "./components/ServiceCard";
import type { Service } from "./types";

function mount(selector: string, html: string): void {
    document.querySelectorAll<HTMLElement>(`[data-showcase="${selector}"]`).forEach(el => {
        el.innerHTML = html;
    });
}

document.addEventListener("DOMContentLoaded", () => {
    mount("badge-online", Badge({ tone: "online", label: "online" }));
    mount("badge-counter", Badge({ tone: "counter", label: "+11" }));

    mount("button-primary", Button({ label: "Enviar", variant: "primary", arrow: true }));
    mount(
        "button-secondary",
        Button({ label: "Para parceiros", variant: "secondary", as: "a", href: "/faca-parte/", arrow: true })
    );

    mount(
        "filter-chips",
        FilterChip({ id: "", label: "Todos", count: 12, active: true }) +
            FilterChip({ id: "digital", label: "Digital", count: 8 }) +
            FilterChip({ id: "bem-estar", label: "Bem-estar", count: 5 })
    );

    mount("toggle-chip", ToggleChip({ id: "al-only-showcase", label: "Prestados pela Arte Longa" }));

    mount(
        "empty-state",
        EmptyState({
            message: "Nenhum resultado por aqui.",
            ctaHref: "/contato/",
            ctaLabel: "Entre em contato para encontrarmos uma solução →",
        })
    );

    const fakeHours: Service = {
        titulo: "Desenvolvimento Web",
        slug: "desenvolvimento-web",
        digital: true,
        recurring: false,
        cnaeNovo: false,
        hidden: false,
        responsavel: [],
    };
    mount(
        "service-card-hours",
        ServiceCard({
            service: fakeHours,
            respNames: "Yuri",
            faixa: { preco: "R$ 4.000 — R$ 20.000", formula: "Tarifa-base R$ 100/h" },
        })
    );

    const fakePlanos: Service = {
        titulo: "Mentoria Espiritual",
        slug: "mentoria-espiritual",
        digital: true,
        recurring: false,
        cnaeNovo: false,
        hidden: false,
        responsavel: [],
    };
    mount(
        "service-card-planos",
        ServiceCard({
            service: fakePlanos,
            respNames: "Aime",
            faixa: {
                planos: [
                    { label: "Sessão avulsa", preco: "R$ 100" },
                    { label: "Semanal", preco: "R$ 400/mês" },
                    { label: "Mensal", preco: "Sob consulta", consult: true },
                ],
            },
        })
    );

    const fakeConsult: Service = { titulo: "Babá", slug: "baba", digital: false, recurring: false, cnaeNovo: false, hidden: false, responsavel: [] };
    mount(
        "service-card-consult",
        ServiceCard({
            service: fakeConsult,
            respNames: "Kelly",
            faixa: { preco: "Sob consulta", consult: true },
        })
    );
});
