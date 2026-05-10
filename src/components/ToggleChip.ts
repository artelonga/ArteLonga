import { esc } from "../lib/esc";

export interface ToggleChipProps {
    id: string;
    label: string;
    checked?: boolean;
}

export function ToggleChip(props: ToggleChipProps): string {
    const { id, label, checked } = props;
    return `<label class="toggle-chip">
        <input type="checkbox" id="${esc(id)}"${checked ? " checked" : ""}>
        <span>${esc(label)}</span>
    </label>`;
}
