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

/**
 * Item autoral (poema, ensaio, etc) que vive em `<handle>/profile.yaml#portfolio`.
 * Renderizado em `/<handle>/<slug>/` via dispatch `data-page="poem"|"essay"`.
 */
export interface PortfolioPoem {
    kind: "poem";
    slug: string;
    titulo: string;
    autor?: Handle;
    stanzas: string[][];
    draft?: boolean;
}

export interface PortfolioEssay {
    kind: "essay";
    slug: string;
    titulo: string;
    short?: string;
    body?: string;
    draft?: boolean;
}

export type PortfolioItem = PortfolioPoem | PortfolioEssay;

export interface EssayItem {
    titulo?: string;
    short?: string;
    long?: string;
}

export interface Contacts {
    tagline?: string;
    email?: string;
    whatsapp?: string;
    whatsappDisplay?: string;
    instagram?: string;
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
    deathDate?: string;
    bioTitle?: string;
    bioCurta?: string;
    bio?: string;
    bioHidden?: string;
    bioAudio?: string;
    citacoes?: Citacao[];
    servicos?: string[]; // titulos de service
    subMembers?: Handle[];
    communities?: Handle[];
    contacts?: Contacts;
    homeLinks?: HomeLink[];
    portfolio?: PortfolioItem[];
    essays?: EssayItem[];
    essaysTitle?: string;
    emMemoria?: boolean;
    emBreve?: boolean;
    aposentado?: boolean;
    underage?: boolean;
    muted?: boolean;
    referenceOnly?: boolean;
    externalUrl?: string;
    site?: string;
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
    bioCurta?: string;
    externalUrl?: string;
    site?: string;
    servicos?: string[];
    membros?: Handle[];
    parcerias?: Parceria[];
    sectionBreak?: boolean;
    muted?: boolean;
    emBreve?: boolean;
    emMemoria?: boolean;
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
    descNossa?: string;
    summary?: string;
    nome?: string;
    attachments?: Array<{ kind?: string; label: string; url: string }>;
}

export interface DefaultLocation {
    estado: string;
    cidade: string;
    bairro: string;
}

// ── Mission types ──────────────────────────────────────────────────────────

export interface Mission {
    handle: string;
    nome: string;
    subtitle?: string;
    objetivo?: string;
    objetivoAutor?: Handle;
    comunidade?: Handle;
    displayAtRoot?: boolean;
    attachments?: Array<{ kind?: string; label: string; url: string }>;
    envolvidos?: Handle[];
    servicos?: string[];
}

// ── Solution types ─────────────────────────────────────────────────────────

export interface SolutionPlatform {
    name: string;
    status: string;
    statusText: string;
}

export interface Solution {
    handle: Handle;
    type: "solution";
    nome: string;
    tagline?: string;
    desc?: string;
    descLong?: string;
    url?: string;
    urlLabel?: string;
    internalLink?: boolean;
    universo?: boolean;
    lifecycle?: "active" | "futuro";
    platforms?: SolutionPlatform[];
    bundledServices?: string[] | "*";
    externalUrl?: string;
}

// ── Finance types ──────────────────────────────────────────────────────────

export interface FinanceCostBreakdown {
    label: string;
    value: number;
    handle?: Handle;
}

export interface FinanceCostItem {
    label: string;
    value: number;
    detail?: string;
    breakdown?: FinanceCostBreakdown[];
}

export interface FinanceRecurrentItem {
    label: string;
    mensal: number;
    detail: string;
    responsavel: Handle;
    client?: string;
    solucoes?: Handle[];
}

export interface FinanceRampaMes {
    mes: string;
    value: number;
}

export interface FinanceRampaItem {
    label: string;
    detail: string;
    responsavel: Handle;
    client?: string;
    meses: FinanceRampaMes[];
    solucoes?: Handle[];
}

export interface FinanceProjectItem {
    label: string;
    detail: string;
    unitValue: number;
    unidades: number;
    responsavel?: Handle;
    solucoes?: Handle[];
}

export interface FinanceProBonoItem {
    label: string;
    detail: string;
    responsavel: Handle;
    solucoes?: Handle[];
}

export interface FinanceReceita {
    recorrenteMensal: FinanceRecurrentItem[];
    rampa: FinanceRampaItem[];
    projetos: FinanceProjectItem[];
    proBono: FinanceProBonoItem[];
}

export interface Finances {
    quarter: string;
    metaQ2: number;
    custos: FinanceCostItem[];
    receita: FinanceReceita;
}

// ── FaixaPreco ────────────────────────────────────────────────────────────

export interface FaixaPlano {
    label: string;
    preco: string;
    consult?: boolean;
    formula?: string;
}

export interface FaixaPreco {
    preco?: string;
    formula?: string;
    consult?: boolean;
    planos?: FaixaPlano[];
}

/**
 * Shape do `window.AL` exposed pelo data.js.
 * Renderer importa daqui pra ter type safety.
 */
export interface UniverseData {
    people: Person[];
    communities: Community[];
    services: Service[];
    missions: Mission[];
    solutions: Solution[];
    finances: Finances;
    DEFAULT_LOCATION: DefaultLocation;

    // Lookup helpers
    get(handle: Handle): Person | Community | Solution | undefined;
    serviceByTitle(titulo: string): Service | undefined;
    serviceBySlug(slug: string): Service | undefined;
    publicServices(): Service[];
    roster(): (Person | Community)[];
    rosterOrder: Handle[];

    // Predicate helpers
    isInactive(handle: Handle): boolean;
    isSocio(handle: Handle): boolean;
    locationMatches(handle: Handle, filter: Partial<DefaultLocation>): boolean;

    // Suggestion helpers
    locationSuggestions(): { estados: string[]; cidades: string[]; bairros: string[] };

    // Computation helpers
    computeFaixaPreco(s: Service): FaixaPreco;
    slugify(s: string): string;
    relatedServices(titulo: string): Service[];

    // Mission helpers
    subMissionsOf(handle: string): Mission[];
    topLevelMissions(): Mission[];

    // Poem helpers
    poemsByAuthor(handle: Handle): PortfolioPoem[];
    poemBySlug(slug: string): PortfolioPoem | undefined;
}

// ── Lead ──────────────────────────────────────────────────────────────────

export interface Lead {
    nome: string | null;
    email: string | null;
    telefone: string | null;
    mensagem: string;
    servico_titulo: string | null;
    parceiro_handle: string | null;
}

declare global {
    interface Window {
        AL: UniverseData;
        AL_track?: (event: string, props?: Record<string, unknown>) => void;
    }
}

export {};
