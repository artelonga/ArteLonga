/**
 * Types do universe artelonga.
 *
 * Geradas/mantidas a partir de `openapi/artelonga.yaml`. Quando bumparmos
 * `openapi-typescript` como devDep, esse arquivo passa a ser auto-gerado
 * via `npm run gen-types`. Por ora é hand-written espelhando o spec.
 *
 * **Não importar runtime data daqui** — só types. Runtime helpers vivem
 * em `src/data.ts` (a chegar) que tipa `window.AL`.
 */

/** Slug-style identifier (lowercase + dashes). */
export type Handle = string;

export type EntityType = "person" | "business" | "community" | "reference";

export type Tag =
    | "fundador"
    | "parceiro"
    | "comunidade"
    | "em-memoria"
    | "guardiao"
    | "familia"
    | "contabilidade"
    | "alimentacao";

export type Unit = "hora" | "palavra" | "pessoa" | "unidade" | "aula" | "sessão";

export type ParceriaTipo = "pro-bono" | "paga" | "troca";

export interface Citacao {
    texto: string;
    autor?: Handle;
    autorNome?: string;
    autorEmBreve?: { title: string };
    obra?: string;
    data?: string; // ISO date
    url?: string;
}

export interface HomeLink {
    label: string;
    url: string;
}

export interface Contacts {
    tagline?: string;
    email?: string;
    whatsapp?: string;
    site?: string;
}

export interface CnaeEntry {
    c: string; // codigo
    d: string; // descricao
}

export interface Person {
    handle: Handle;
    type: "person" | "business" | "reference";
    nome: string;
    role?: string;
    tags?: Tag[];
    pic?: string | null;
    birthDate?: string;
    bioTitle?: string;
    bioCurta?: string;
    bio?: string;
    citacoes?: Citacao[];
    servicos?: string[]; // titulos de service
    subMembers?: Handle[];
    communities?: Handle[];
    contacts?: Contacts;
    homeLinks?: HomeLink[];
    emMemoria?: boolean;
    referenceOnly?: boolean;
    externalUrl?: string;
}

export interface Contribuicao {
    quem: Handle;
    oque: string;
}

export interface Parceria {
    de: Handle;
    tipo: ParceriaTipo;
    descricao?: string;
    contribuicoes?: Contribuicao[];
}

export interface Community {
    handle: Handle;
    type: "community";
    nome: string;
    role?: string;
    tags?: Tag[];
    pic?: string | null;
    tagline?: string;
    bio?: string;
    externalUrl?: string;
    site?: string;
    servicos?: string[];
    membros?: Handle[];
    parcerias?: Parceria[];
    sectionBreak?: boolean;
}

export interface Service {
    titulo: string;
    slug?: string; // auto-derived
    parent?: string; // titulo do parent
    paraQuem?: string;
    digital?: boolean;
    recurring?: boolean;
    hoursLow?: number;
    hoursHigh?: number;
    unit?: Unit;
    responsavel?: Handle[];
    implicitResponsavel?: Handle[];
    cnae?: CnaeEntry[];
    cnaeNovo?: boolean;
    children?: string[]; // titulos de children
}

export interface DefaultLocation {
    estado: string;
    cidade: string;
    bairro: string;
}

/**
 * Shape do `window.AL` exposed pelo data.js.
 * Renderer importa daqui pra ter type safety.
 */
export interface UniverseData {
    people: Person[];
    communities: Community[];
    services: Service[];
    DEFAULT_LOCATION: DefaultLocation;

    // Helpers (runtime)
    get(handle: Handle): Person | Community | undefined;
    serviceByTitle(titulo: string): Service | undefined;
    serviceBySlug(slug: string): Service | undefined;
    publicServices(): Service[];
    rosterOrder: Handle[];
    isInactive(handle: Handle): boolean;
    isSocio(handle: Handle): boolean;
    locationMatches(handle: Handle, filter: Partial<DefaultLocation>): boolean;
    locationSuggestions(): { estados: string[]; cidades: string[]; bairros: string[] };
    computeFaixaPreco(s: Service): {
        preco?: string;
        formula?: string;
        consult?: boolean;
        planos?: { label: string; preco: string; consult?: boolean }[];
    };
    slugify(s: string): string;
}

declare global {
    interface Window {
        AL: UniverseData;
    }
}

export {};
