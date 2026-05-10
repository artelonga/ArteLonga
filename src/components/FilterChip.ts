import { esc } from "../lib/esc";

export interface FilterChipProps {
    id: string;
    label: string;
    count: number;
    active?: boolean;
}

export function FilterChip(props: FilterChipProps): string {
    const { id, label, count, active } = props;
    const cls = active ? "sup-chip is-active" : "sup-chip";
    const pressed = active ? "true" : "false";
    return `<button type="button" class="${cls}" data-cat="${esc(id)}" aria-pressed="${pressed}">
        ${esc(label)} <span class="sup-count">${count}</span>
    </button>`;
}
