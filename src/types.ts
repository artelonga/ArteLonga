/**
 * Types do universe artelonga.
 *
 * Os tipos que espelham `openapi/artelonga.yaml` são re-exportados de
 * `src/types.gen.ts` (auto-gerado por `npm run gen-types`). Tipos
 * UI-only sem equivalente no schema OpenAPI ficam aqui hand-written.
 */

import type { components } from "./types.gen";

// ── Re-exports dos tipos gerados via openapi-typescript ───────────────────

export type Handle = components["schemas"]["Handle"];
export type EntityType = components["schemas"]["EntityType"];
export type Tag = components["schemas"]["Tag"];
export type Citacao = components["schemas"]["Citacao"];
export type HomeLink = components["schemas"]["HomeLink"];
export type PortfolioPoem = components["schemas"]["PortfolioPoem"];
export type PortfolioEssay = components["schemas"]["PortfolioEssay"];
export type PortfolioItem = components["schemas"]["PortfolioItem"];
export type Contacts = components["schemas"]["Contacts"];
export type Person = components["schemas"]["Person"];
export type Parceria = components["schemas"]["Parceria"];
export type Community = components["schemas"]["Community"];
export type CnaeEntry = components["schemas"]["CnaeEntry"];
export type Service = components["schemas"]["Service"];
export type Mission = components["schemas"]["Mission"];
export type Solution = components["schemas"]["Solution"];
export type Attachment = components["schemas"]["Attachment"];
export type Finances = components["schemas"]["Finances"];
export type BacklinkEntry = components["schemas"]["BacklinkEntry"];

// Finance aliases: nomes históricos mapeados para schemas OpenAPI.
export type FinanceCostItem = components["schemas"]["FinanceCost"];
export type FinanceRecurrentItem = components["schemas"]["FinanceRecurrentItem"];
export type FinanceRampaItem = components["schemas"]["FinanceRampaItem"];
export type FinanceProjectItem = components["schemas"]["FinanceProject"];
export type FinanceProBonoItem = components["schemas"]["FinanceProBono"];

// ── Tipos UI-only sem equivalente no schema OpenAPI ───────────────────────

export interface EssayItem {
    titulo?: string;
    short?: string;
    long?: string;
}

export interface DefaultLocation {
    estado: string;
    cidade: string;
    bairro: string;
}

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

// ── Analytics public API ──────────────────────────────────────────────────

export interface ALAnalyticsInfo {
    sid: string;
    vid: string;
    schema: number;
    queueSize: number;
    endpoint: string | null;
    experiments: Record<string, string>;
    utm: Record<string, string> | null;
    optedOut: boolean;
    reason?: string;
}

export interface ALAnalyticsAPI {
    sid: string;
    vid: string;
    schema: number;
    optedOut?: boolean;
    queueSize(): number;
    flush(): Promise<void>;
    info(): ALAnalyticsInfo;
    optOut(): void;
    optIn(): void;
}

export interface ALExperimentsAPI {
    variant(expId: string): string | null;
}

declare global {
    interface Window {
        AL: UniverseData;
        AL_track?: (event: string, props?: Record<string, unknown>) => void;
        AL_analytics?: ALAnalyticsAPI;
        AL_experiments?: ALExperimentsAPI;
    }
}

export {};
