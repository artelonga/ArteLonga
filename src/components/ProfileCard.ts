import { esc } from "../lib/esc";
import type { Person, Community } from "../types";

export interface ProfileCardProps {
    entity: Person | Community;
}

export function ProfileCard(props: ProfileCardProps): string {
    const e = props.entity;
    const text = e.type !== "community" ? (e.bioCurta ?? e.bio) : e.bio;
    const firstPara = text ? text.split(/\n\s*\n/)[0] : undefined;
    if (firstPara) return `<p class="card-bio">${esc(firstPara)}</p>`;
    return `<p class="card-bio empty">Biografia em breve.</p>`;
}

export interface AvatarSmProps {
    entity: Person | Community;
}

export function avatarSm(props: AvatarSmProps): string {
    const { entity } = props;
    if (entity.type === "community") return "";
    const inner = entity.pic
        ? `<img src="${esc(entity.pic)}" alt="${esc(entity.nome)}">`
        : esc(initial(entity.nome));
    return `<div class="avatar-sm">${inner}</div>`;
}

export function avatarLg(entity: Person | Community): string {
    const inner = entity.pic
        ? `<img src="${esc(entity.pic)}" alt="${esc(entity.nome)}">`
        : esc(initial(entity.nome));
    return `<div class="avatar avatar-lg">${inner}</div>`;
}

function initial(s: string | undefined): string {
    return (s ?? "?").trim()[0]?.toUpperCase() ?? "?";
}
