import { esc } from "../lib/esc";
import { mdInline } from "../lib/markdown";
import { setPageSEO, OG_DEFAULT_IMAGE } from "../lib/seo";
import { avatarLg } from "../components/ProfileCard";
import { siteHeader } from "../components/SiteHeader";
import { siteFooter } from "../components/SiteFooter";
import type {
    Person,
    Community,
    Citacao,
    HomeLink,
    Parceria,
    EssayItem,
    PortfolioPoem,
    BacklinkEntry,
} from "../types";

const REDE_EMAIL = "rede@artelonga.com.br";

// Profile shape accepted by the template — superset of Person + Community
// (solution profiles are remapped to this before rendering).
interface RenderableProfile {
    handle: string;
    type: string;
    nome: string;
    role?: string;
    pic?: string | null;
    birthDate?: string;
    deathDate?: string;
    bioTitle?: string;
    bio?: string;
    bioHidden?: string;
    bioAudio?: string;
    citacoes?: Citacao[];
    servicos?: string[];
    communities?: string[];
    subMembers?: string[];
    membros?: string[];
    contacts?: { tagline?: string; email?: string; whatsapp?: string; site?: string };
    homeLinks?: HomeLink[];
    essays?: EssayItem[];
    essaysTitle?: string;
    emMemoria?: boolean;
    emBreve?: boolean;
    aposentado?: boolean;
    underage?: boolean;
    muted?: boolean;
    referenceOnly?: boolean;
    site?: string;
    parcerias?: Parceria[];
}

export async function render(): Promise<void> {
    const handle = document.body.dataset["handle"] ?? "";
    const AL = window.AL;
    const raw = AL.get(handle);
    if (!raw) {
        document.body.innerHTML = `<main class="main"><p>Perfil não encontrado.</p></main>`;
        return;
    }

    // Remap solution entities to profile shape
    let p: RenderableProfile;
    if (raw.type === "solution") {
        const sol = raw;
        const fullBio = (sol.desc ?? "") + (sol.descLong ? "\n\n" + sol.descLong : "");
        const siteUrl =
            sol.externalUrl ??
            (typeof sol.url === "string" && /^https?:\/\//.test(sol.url) ? sol.url : undefined);
        const servicos = sol.bundledServices === "*" ? [] : (sol.bundledServices ?? []);
        const emBreve = sol.platforms ? sol.platforms.every(pl => pl.status === "wip") : false;
        // Use object mutation to avoid exactOptionalPropertyTypes violations
        const solProfile: RenderableProfile = { handle: sol.handle, type: sol.type, nome: sol.nome, bio: fullBio, servicos, emBreve };
        if (sol.tagline !== undefined) solProfile.role = sol.tagline;
        if (siteUrl !== undefined) solProfile.site = siteUrl;
        p = solProfile;
    } else {
        const entity = raw as Person | Community;
        // Cast to mutable RenderableProfile; fields are structurally compatible
        p = entity as unknown as RenderableProfile;
        // Compute and assign site separately to satisfy exactOptionalPropertyTypes
        const computedSite =
            entity.type !== "community"
                ? ((entity as Person).site ?? entity.externalUrl)
                : (entity.site ?? entity.externalUrl);
        if (computedSite !== undefined) p.site = computedSite;
    }

    document.title = `${p.nome} — Arte Longa`;
    document.body.classList.toggle("em-memoria-profile", !!p.emMemoria);

    const { html: counterHtml, tick: tickFn } = makeCounter(p);
    const bioHtmlOut = bioFull(p.bio);
    const bioHiddenHtml = p.bioHidden
        ? `<details class="profile-bio-hidden"><summary>[...]</summary><p>${esc(p.bioHidden)}</p></details>`
        : "";
    const bioAudioHtml = p.bioAudio
        ? `<div class="profile-bio-audio">
            <button type="button" class="bio-audio-btn" aria-label="Tocar bio em áudio" data-state="paused">
                <span class="bio-audio-icon" aria-hidden="true"></span>
                <span class="bio-audio-label">Ouvir</span>
            </button>
            <audio class="bio-audio-el" preload="metadata" src="${esc(p.bioAudio)}"></audio>
        </div>`
        : "";
    const emBreveNote = p.emBreve ? `<div class="em-breve-note">Perfil em breve.</div>` : "";
    const emMemoriaNote = p.emMemoria ? `<div class="em-memoria-note"><em>em memória</em></div>` : "";
    const underageNote = p.underage
        ? `<div class="em-memoria-note"><em>perfil sob responsabilidade parental</em></div>`
        : "";

    const isCommunity = p.type === "community";

    const BASE_URL = "https://artelonga.com.br";
    const ogImage = p.pic
        ? (p.pic.startsWith("http") ? p.pic : `${BASE_URL}${p.pic}`)
        : OG_DEFAULT_IMAGE;
    const bioDesc = p.bio ? p.bio.replace(/\n/g, " ").slice(0, 200) : undefined;
    setPageSEO({
        title: `${p.nome} — Arte Longa`,
        ...(bioDesc ? { description: bioDesc } : {}),
        url: `/${p.handle}/`,
        ogImage,
        ogType: "profile",
        jsonLd: isCommunity
            ? {
                "@context": "https://schema.org",
                "@type": "Organization",
                "name": p.nome,
                "url": `${BASE_URL}/${p.handle}/`,
                ...(ogImage !== OG_DEFAULT_IMAGE ? { "logo": ogImage } : {}),
            }
            : {
                "@context": "https://schema.org",
                "@type": "Person",
                "name": p.nome,
                "url": `${BASE_URL}/${p.handle}/`,
                "image": ogImage,
                ...(p.role ? { "jobTitle": p.role } : {}),
                "worksFor": { "@type": "Organization", "name": "Arte Longa", "url": BASE_URL },
            },
    });

    const legadoCase = p.aposentado ?? p.emMemoria;
    const servicoLabel = isCommunity ? "Missões" : legadoCase ? "Legado" : "Serviços";
    const servicoHint = isCommunity
        ? "comunidade oferece via serviços"
        : p.emMemoria
        ? "serviços prestados · em memória"
        : p.aposentado
        ? "serviços prestados · aposentado"
        : "clique para ver no catálogo";

    const missoesHtml =
        p.underage || !p.servicos?.length
            ? ""
            : `<section class="section missoes-section">
                 <h2>${servicoLabel} <span class="section-hint">${servicoHint}</span></h2>
                 <ul>${p.servicos.map(m => `<li>${missaoLink(m)}</li>`).join("")}</ul>
               </section>`;

    const essaysHtml = buildEssaysHtml(p);
    const poemasHtml = buildPoemasHtml(p);
    const citacoesHtml = buildCitacoesHtml(p);
    const homeLinksHtml = buildHomeLinksHtml(p);
    const membrosHtml = buildMembrosHtml(p);
    const comunidadesHtml = buildComunidadesHtml(p);
    const contactHtml = buildContactHtml(p);
    const parceriasHtml = buildParceriasHtml(p);

    const avatarHtml = avatarLg({ type: p.type !== "community" ? "person" : "community", nome: p.nome, pic: p.pic } as Person | Community);

    document.body.innerHTML = `
        ${siteHeader()}
        <main class="main">
            <div class="profile-hero">
                ${avatarHtml}
                <div>
                    <h1 class="profile-name">${esc(p.nome)}</h1>
                    ${p.role ? `<div class="profile-role">${esc(p.role)}</div>` : ""}
                    ${counterHtml}
                    ${p.bioTitle ? `<h2 class="profile-bio-title">${esc(p.bioTitle)}</h2>` : ""}
                    ${bioHiddenHtml}
                    ${bioAudioHtml}
                    ${bioHtmlOut}
                </div>
            </div>
            ${emBreveNote}
            ${emMemoriaNote}
            ${underageNote}
            ${homeLinksHtml}
            ${missoesHtml}
            ${citacoesHtml}
            ${poemasHtml}
            ${essaysHtml}
            ${membrosHtml}
            ${parceriasHtml}
            ${comunidadesHtml}
            ${contactHtml}
            <a class="back" href="/">← voltar</a>
        </main>
        ${siteFooter()}
    `;

    if (tickFn) tickFn();

    void injectBacklinks(handle);
}

// ── Backlinks ─────────────────────────────────────────────────────────────

const BACKLINKS_MAX = 10;

async function injectBacklinks(handle: string): Promise<void> {
    let entries: BacklinkEntry[];
    try {
        const resp = await fetch("/assets/backlinks.json");
        if (!resp.ok) return;
        const data = await resp.json() as Record<string, BacklinkEntry[]>;
        entries = data[handle] ?? [];
    } catch {
        return;
    }
    if (!entries.length) return;
    const html = buildBacklinksHtml(entries);
    const back = document.querySelector<HTMLElement>("a.back");
    if (back) back.insertAdjacentHTML("beforebegin", html);
}

function backlinksUrl(e: BacklinkEntry): string {
    if (e.type === "service") return `/servicos/${esc(e.from)}/`;
    if (e.type === "mission") return `/missoes/${esc(e.from)}/`;
    return `/${esc(e.from)}/`;
}

function backlinkTypeLabel(type: string): string {
    const map: Record<string, string> = {
        service: "serviço",
        person: "pessoa",
        community: "comunidade",
        mission: "missão",
        solution: "solução",
    };
    return map[type] ?? type;
}

function buildBacklinksHtml(entries: BacklinkEntry[]): string {
    const visible = entries.slice(0, BACKLINKS_MAX);
    const items = visible
        .map(e => {
            const label = backlinkTypeLabel(e.type);
            return `<li><a href="${backlinksUrl(e)}">${esc(e.nome)}</a> <span class="section-hint">${label}</span></li>`;
        })
        .join("");
    const extra = entries.length > BACKLINKS_MAX
        ? ` <span class="section-hint">+${entries.length - BACKLINKS_MAX} mais</span>`
        : "";
    const count = entries.length;
    return `<section class="section backlinks-section">
        <details class="backlinks-details">
            <summary>Mencionado em <strong>${count}</strong> referência${count !== 1 ? "s" : ""}${extra}</summary>
            <ul class="backlinks-list">${items}</ul>
        </details>
    </section>`;
}

// ── Helpers ───────────────────────────────────────────────────────────────

function missaoLink(titulo: string): string {
    return `<a class="missao-link" href="/servicos/?q=${encodeURIComponent(titulo)}">${esc(titulo)} <span class="missao-arrow">→ serviços</span></a>`;
}

function bioFull(bio: string | undefined): string {
    if (!bio) return `<p class="profile-bio empty">Biografia em breve.</p>`;
    const blocks = bio.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
    return blocks
        .map(block => {
            const lines = block.split("\n");
            if (lines.every(l => /^>\s?/.test(l))) {
                const inner = lines.map(l => l.replace(/^>\s?/, "")).join("\n");
                return `<blockquote class="profile-bio profile-bio-quote">${mdInline(inner).replace(/\n/g, "<br>")}</blockquote>`;
            }
            return `<p class="profile-bio">${mdInline(block).replace(/\n/g, "<br>")}</p>`;
        })
        .join("");
}

interface CounterResult {
    html: string;
    tick: (() => void) | null;
}

function makeCounter(p: RenderableProfile): CounterResult {
    if (!p.birthDate) return { html: "", tick: null };
    if (p.emMemoria) {
        if (!p.deathDate) return { html: "", tick: null };
        const birth = new Date(p.birthDate);
        const death = new Date(p.deathDate);
        const years = Math.floor((death.getTime() - birth.getTime()) / (365.25 * 24 * 3600 * 1000));
        return {
            html: `<div class="profile-counter-static">${years} anos · ${birth.getFullYear()}—${death.getFullYear()} · em memória</div>`,
            tick: null,
        };
    }
    const birthDate = p.birthDate;
    const html = `<div class="profile-counter" data-birth="${esc(birthDate)}"></div>`;
    return { html, tick: () => tickCounter(birthDate) };
}

function tickCounter(birthStr: string): void {
    const precision = (() => {
        if (!birthStr.includes("T")) return "day";
        const t = (birthStr.split("T")[1] ?? "").replace(/[Z+-].*$/, "");
        const colons = (t.match(/:/g) ?? []).length;
        return colons >= 2 ? "second" : colons === 1 ? "minute" : "hour";
    })();
    const birth = new Date(birthStr);
    const el = document.querySelector<HTMLElement>(`.profile-counter[data-birth="${CSS.escape(birthStr)}"]`);
    if (!el) return;

    const renderAge = (): void => {
        const now = new Date();
        let y = now.getFullYear() - birth.getFullYear();
        let mo = now.getMonth() - birth.getMonth();
        let d = now.getDate() - birth.getDate();
        let h = now.getHours() - birth.getHours();
        let mi = now.getMinutes() - birth.getMinutes();
        let se = now.getSeconds() - birth.getSeconds();
        if (se < 0) { se += 60; mi -= 1; }
        if (mi < 0) { mi += 60; h -= 1; }
        if (h < 0) { h += 24; d -= 1; }
        if (d < 0) {
            const pm = new Date(now.getFullYear(), now.getMonth(), 0);
            d += pm.getDate();
            mo -= 1;
        }
        if (mo < 0) { mo += 12; y -= 1; }
        const plural = (n: number, one: string, many: string): string => `${n} ${n === 1 ? one : many}`;
        const parts = [`${y} anos`, plural(mo, "mês", "meses"), plural(d, "dia", "dias")];
        if (precision === "second")
            parts.push(`${String(h).padStart(2, "0")}h${String(mi).padStart(2, "0")}m${String(se).padStart(2, "0")}s`);
        else if (precision === "minute")
            parts.push(`${String(h).padStart(2, "0")}h${String(mi).padStart(2, "0")}`);
        else if (precision === "hour")
            parts.push(`${h}h`);
        el.textContent = parts.join(" · ");
    };
    renderAge();
    setInterval(renderAge, precision === "second" ? 1000 : 60000);
}

function buildEssaysHtml(p: RenderableProfile): string {
    if (!p.essays?.length) return "";
    const allPending = p.essays.every(e => !e.short && !e.long && !e.titulo);
    const items = p.essays
        .map((e, i) => {
            const num = String(i + 1).padStart(2, "0");
            const tituloHtml = e.titulo
                ? esc(e.titulo)
                : `<span class="essay-pending">(título em breve)</span>`;
            const shortHtml = e.short
                ? `<a href="${esc(e.short)}">curto</a>`
                : `<span class="essay-pending">curto</span>`;
            const longHtml = e.long
                ? `<a href="${esc(e.long)}">longo</a>`
                : `<span class="essay-pending">longo</span>`;
            return `<li>
                <span class="essay-num">${num}</span>
                <span class="essay-titulo">${tituloHtml}</span>
                <span class="essay-formats">${shortHtml} · ${longHtml}</span>
            </li>`;
        })
        .join("");
    return `<section class="section essays-section">
        <h2>${esc(p.essaysTitle ?? "Ensaios")} <span class="section-hint">${allPending ? "em breve" : "curto e longo"}</span></h2>
        <ul class="essays-list">${items}</ul>
    </section>`;
}

function buildPoemasHtml(p: RenderableProfile): string {
    const AL = window.AL;
    const authorPoems: PortfolioPoem[] = AL.poemsByAuthor ? AL.poemsByAuthor(p.handle) : [];
    if (!authorPoems.length) return "";
    const items = authorPoems
        .map(pm => `<li><a href="/${esc(p.handle)}/${esc(pm.slug)}/">${esc(pm.titulo)} →</a></li>`)
        .join("");
    return `<section class="section poemas-section">
        <h2>Poemas</h2>
        <ul class="poemas-list">${items}</ul>
    </section>`;
}

function buildCitacoesHtml(p: RenderableProfile): string {
    if (!p.citacoes?.length) return "";
    const AL = window.AL;
    const items = p.citacoes
        .map(c => {
            let autorHtml = "";
            const autorEntity = c.autor ? AL.get(c.autor) : undefined;
            if (autorEntity) {
                autorHtml = `<a href="/${esc(autorEntity.handle)}/">${esc(autorEntity.nome)}</a>`;
            } else if (c.autorEmBreve) {
                autorHtml = `<a href="#" class="al-em-breve" data-modal-title="${esc(c.autorEmBreve.title)}">${esc(c.autorNome ?? c.autorEmBreve.title)}</a>`;
            } else if (c.autorNome) {
                autorHtml = esc(c.autorNome);
            }
            const obraHtml = c.url
                ? `<a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.obra ?? c.url)}</a>`
                : c.obra
                ? esc(c.obra)
                : "";
            const parts = [autorHtml, obraHtml, c.data ? esc(c.data) : ""].filter(Boolean);
            return `<blockquote class="citacao">
                <p class="citacao-texto">${mdInline(c.texto)}</p>
                <footer class="citacao-attrib">— ${parts.join(", ")}</footer>
            </blockquote>`;
        })
        .join("");
    return `<section class="section citacoes-section"><h2>Citações</h2>${items}</section>`;
}

function buildHomeLinksHtml(p: RenderableProfile): string {
    if (!p.homeLinks?.length) return "";
    return `<section class="section home-links-section">
        <h2>Navegação</h2>
        <ul class="home-links-list">${p.homeLinks
            .map(l => `<li><a href="${esc(l.url)}">${esc(l.label)}</a></li>`)
            .join("")}</ul>
    </section>`;
}

function buildMembrosHtml(p: RenderableProfile): string {
    const AL = window.AL;
    const subHandles = p.type === "community" ? p.membros : p.subMembers;
    if (!subHandles?.length) return "";
    const subs = subHandles.map(h => AL.get(h)).filter(Boolean) as NonNullable<ReturnType<typeof AL.get>>[];
    return `<section class="section">
        <h2>Membros</h2>
        <ul>${subs.map(s => `<li><a href="/${esc(s.handle)}/">${esc(s.nome)}</a></li>`).join("")}</ul>
    </section>`;
}

function buildComunidadesHtml(p: RenderableProfile): string {
    if (!p.communities?.length) return "";
    const AL = window.AL;
    return `<section class="section">
        <h2>Comunidades</h2>
        <ul>${p.communities
            .map(h => {
                const c = AL.get(h);
                return c ? `<li><a href="/${esc(c.handle)}/">${esc(c.nome)}</a></li>` : "";
            })
            .join("")}</ul>
    </section>`;
}

function buildContactHtml(p: RenderableProfile): string {
    if (p.referenceOnly) return "";
    if (p.site) {
        return `<section class="section"><h2>Contato e Parcerias</h2><ul><li><a href="${esc(p.site)}" target="_blank" rel="noopener">${esc(p.site)}</a></li></ul></section>`;
    }
    return `<section class="section"><h2>Contato e Parcerias</h2><ul><li><span class="email-display">${REDE_EMAIL}</span></li></ul></section>`;
}

function buildParceriasHtml(p: RenderableProfile): string {
    if (!p.parcerias?.length) return "";
    const AL = window.AL;
    return p.parcerias
        .map(par => {
            const parceiro = AL.get(par.de);
            const nomeP = parceiro ? parceiro.nome : par.de;
            const contribs = (par.contribuicoes ?? [])
                .map(c => {
                    const quem = AL.get(c.quem);
                    const link = quem
                        ? `<a href="/${esc(c.quem)}/">${esc(quem.nome)}</a>`
                        : esc(c.quem);
                    return `<li><strong>${link}</strong> — ${esc(c.oque)}</li>`;
                })
                .join("");
            return `<section class="section parceria-section">
                <h2>Parceria · ${esc(nomeP)} <span class="section-hint">${esc(par.tipo)}</span></h2>
                <p class="parceria-desc">${esc(par.descricao ?? "")}</p>
                <ul class="parceria-contribs">${contribs}</ul>
            </section>`;
        })
        .join("");
}
