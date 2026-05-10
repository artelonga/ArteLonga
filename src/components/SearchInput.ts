import { esc } from "../lib/esc";

export interface SearchInputProps {
    id: string;
    name?: string;
    placeholder?: string;
}

export function SearchInput(props: SearchInputProps): string {
    const { id, name = "q", placeholder = "Buscar…" } = props;
    return `<form class="market-search" role="search" autocomplete="off"
          onsubmit="event.preventDefault(); return false;">
        <input type="search" name="${esc(name)}" id="${esc(id)}"
               placeholder="${esc(placeholder)}"
               autocomplete="off"
               aria-label="${esc(placeholder)}">
    </form>`;
}
