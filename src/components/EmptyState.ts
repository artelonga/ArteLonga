import { esc } from "../lib/esc";

export interface EmptyStateProps {
    message: string;
    ctaHref?: string;
    ctaLabel?: string;
    hidden?: boolean;
}

export function EmptyState(props: EmptyStateProps): string {
    const { message, ctaHref, ctaLabel, hidden } = props;
    const cta =
        ctaHref && ctaLabel
            ? ` <a href="${esc(ctaHref)}">${esc(ctaLabel)}</a>`
            : "";
    return `<p class="market-empty"${hidden ? " hidden" : ""}>${esc(message)}${cta}</p>`;
}
