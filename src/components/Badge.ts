export type BadgeTone = "online" | "counter" | "muted";

export interface BadgeProps {
    tone: BadgeTone;
    label: string;
}

export function Badge(props: BadgeProps): string {
    const cls =
        props.tone === "online"
            ? "market-card-online"
            : props.tone === "counter"
            ? "market-card-children"
            : "badge-muted";
    return `<span class="${cls}">${props.label}</span>`;
}
