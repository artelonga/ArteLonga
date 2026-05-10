import { esc } from "../lib/esc";

export type ButtonVariant = "primary" | "secondary";
export type ButtonAs = "button" | "a";

export interface ButtonProps {
    label: string;
    variant?: ButtonVariant;
    as?: ButtonAs;
    href?: string;
    arrow?: boolean;
    dataCta?: string;
}

export function Button(props: ButtonProps): string {
    const { label, variant = "primary", as: elem = "button", href, arrow, dataCta } = props;
    const text = arrow ? `${esc(label)} →` : esc(label);
    if (elem === "a") {
        const cls = variant === "primary" ? "cta-button" : "cta-secondary";
        return `<a class="${cls}" href="${esc(href ?? "#")}">${text}</a>`;
    }
    if (dataCta) {
        return `<button type="button" class="cta-button" data-cta="${esc(dataCta)}">${text}</button>`;
    }
    const cls = variant === "primary" ? "ct-submit" : "cta-secondary";
    return `<button type="button" class="${cls}">${text}</button>`;
}
