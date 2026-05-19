/* Arte Longa · Analytics + A/B framework (self-hosted)
 *
 * Architecture:
 *   client → queue (localStorage) → batch POST → backend (artelonga/co) → SQLite → dashboard
 *   See docs/analytics-api.md for the wire contract.
 *
 * Privacy:
 *   - Respects DNT, explicit opt-out (window.AL_optout = true OR localStorage.al_optout = "1"
 *     OR cookie al_optout=1), and navigator.webdriver (skip automated browsers).
 *   - One first-party cookie scoped to .artelonga.com.br for cross-subdomain identity threading
 *     (carries the same al_vid as localStorage). No third-party tracking, no fingerprinting.
 *   - Visitor ID (al_vid): random UUID in localStorage AND in a domain-scoped cookie so the
 *     identity is shared between artelonga.com.br and co.artelonga.com.br.
 *   - Session ID (al_sid): random UUID in sessionStorage, scoped to the tab session.
 *   - IP not collected client-side; backend hashes with secret salt before storing.
 *
 * Resilience:
 *   - Persistent queue in localStorage, cap MAX_QUEUE events. Oldest dropped on overflow.
 *   - Batch flush every BATCH_MS or BATCH_SIZE events, whichever first.
 *   - sendBeacon on pagehide / visibilitychange:hidden (survives tab close).
 *   - Server failures: exponential backoff up to MAX_BACKOFF_MS.
 *
 * A/B framework:
 *   - EXPERIMENTS config declares active experiments + variants + weights.
 *   - Deterministic assignment: FNV-1a hash of `vid + ":" + expId` → bucket → variant.
 *   - AL_experiments.variant(expId) returns the variant id (or null if no experiment).
 *     First call per session emits a `experiment_exposure` event.
 *
 * Public API:
 *   window.AL_track(name, props)             — emit a custom event
 *   window.AL_experiments.variant(expId)     — get assigned variant for current visitor
 *   window.AL_analytics.info()               — debug snapshot
 *   window.AL_analytics.optOut() / optIn()   — privacy controls
 */

import { STORAGE_KEYS } from "../lib/storage-keys";

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface ExperimentVariant {
    id: string;
    weight?: number;
}

interface UABrand {
    brand: string;
    version: string;
}

interface NavigatorWithUA {
    userAgentData?: { brands?: UABrand[] };
}

interface Experiment {
    activeFrom?: string;
    activeUntil?: string;
    variants: ExperimentVariant[];
}

interface AnalyticsEvent {
    s: number;
    site: string;
    name: string;
    sid: string;
    vid: string;
    ts: number;
    tz: string | null;
    path: string;
    query: string | null;
    ref: string | null;
    vw: number;
    vh: number;
    lang: string | null;
    ua_brand: string | null;
    utm: Record<string, string> | null;
    experiments: Record<string, string> | null;
    props: Record<string, unknown>;
}

interface PageEndEvent {
    s: number;
    site: string;
    name: "page_end";
    sid: string;
    vid: string;
    ts: number;
    path: string;
    experiments: Record<string, string> | null;
    props: Record<string, unknown>;
}

// ─── CONFIG ──────────────────────────────────────────────────────────────────

const SCHEMA_VERSION = 1;
const SITE = "artelonga";
const ENDPOINT = "https://co.artelonga.com.br/api/v1/telemetry/events";

// Active experiments. Add entries to launch A/B tests; weights are arbitrary integers.
const EXPERIMENTS: Record<string, Experiment> = {};

const BATCH_SIZE = 20;
const BATCH_MS = 5000;
const MAX_QUEUE = 1000;
const MAX_BACKOFF_MS = 60000;
const MAX_ERRORS = 20;

const SECTIONS = new Set([
    "parceiros", "servicos", "solucoes", "comunidades",
    "sobre", "recursos", "proximos-passos", "jardim", "eventos",
]);

const SHARED_DOMAIN = ".artelonga.com.br";
const SHARED_DOMAIN_RX = /(?:^|\.)artelonga\.com\.br$/i;
const APP_HOST_RX = SHARED_DOMAIN_RX;
const COOKIE_VID_MAX_AGE = 60 * 60 * 24 * 365 * 2; // 2y
const COOKIE_OPT_MAX_AGE = 60 * 60 * 24 * 365 * 5; // 5y

// ─── COOKIE HELPERS ──────────────────────────────────────────────────────────

function canSetSharedCookie(): boolean {
    return SHARED_DOMAIN_RX.test(location.hostname || "");
}

function readCookie(name: string): string | null {
    const esc = name.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
    const m = (document.cookie || "").match(new RegExp("(?:^|; )" + esc + "=([^;]*)"));
    if (!m) return null;
    try { return decodeURIComponent(m[1] ?? ""); } catch { return null; }
}

function writeSharedCookie(name: string, value: string, maxAge: number): void {
    if (!canSetSharedCookie()) return;
    const parts = [
        name + "=" + encodeURIComponent(value),
        "Path=/",
        "Domain=" + SHARED_DOMAIN,
        "SameSite=Lax",
        "Max-Age=" + maxAge,
    ];
    if (location.protocol === "https:") parts.push("Secure");
    try { document.cookie = parts.join("; "); } catch { /* noop */ }
}

function deleteSharedCookie(name: string): void {
    if (!canSetSharedCookie()) return;
    try { document.cookie = name + "=; Path=/; Domain=" + SHARED_DOMAIN + "; Max-Age=0"; } catch { /* noop */ }
}

// Migration: drop pre-v1 queue (different shape).
try { localStorage.removeItem("al_evq"); } catch { /* noop */ }

// ─── PRIVACY GATE ────────────────────────────────────────────────────────────

function dnt(): boolean {
    const nav = navigator as Navigator & { msDoNotTrack?: string };
    const win = window as Window & { doNotTrack?: string };
    const v = navigator.doNotTrack ?? nav.msDoNotTrack ?? win.doNotTrack;
    return v === "1" || v === "yes";
}

function isOptedOut(): boolean {
    if ((window as Window & { AL_optout?: boolean }).AL_optout === true) return true;
    try { if (localStorage.getItem(STORAGE_KEYS.OPT_OUT) === "1") return true; } catch { /* noop */ }
    if (readCookie(STORAGE_KEYS.OPT_OUT) === "1") return true;
    return dnt();
}

function isAutomated(): boolean {
    if (navigator.webdriver) return true;
    if (/HeadlessChrome|PhantomJS|Selenium|Cypress|Playwright/i.test(navigator.userAgent || "")) return true;
    return false;
}

// ─── PATH / UTM HELPERS (used in both branches) ──────────────────────────────

function normalizePath(p: string): string {
    p = (p || "/").replace(/\/index\.html$/, "/");
    p = p.replace(/\/+$/, "/");
    return p || "/";
}

function currentPath(): string { return normalizePath(location.pathname); }

// ─── MAIN ────────────────────────────────────────────────────────────────────

const _automated = isAutomated();

if (isOptedOut() || _automated) {
    // No-op public API for opted-out / automated visitors.
    window.AL_track = function () { /* noop */ };
    window.AL_experiments = { variant: function () { return null; } };
    window.AL_analytics = {
        optedOut: true,
        sid: "", vid: "", schema: SCHEMA_VERSION,
        queueSize() { return 0; },
        async flush() { /* noop */ },
        info() {
            return {
                optedOut: true,
                reason: _automated ? "automated" : "opted-out",
                sid: "", vid: "", schema: SCHEMA_VERSION,
                queueSize: 0, endpoint: null,
                experiments: {}, utm: null,
            };
        },
        optIn() {
            try { localStorage.removeItem(STORAGE_KEYS.OPT_OUT); } catch { /* noop */ }
            deleteSharedCookie(STORAGE_KEYS.OPT_OUT);
            location.reload();
        },
        optOut() {
            try { localStorage.setItem(STORAGE_KEYS.OPT_OUT, "1"); } catch { /* noop */ }
            writeSharedCookie(STORAGE_KEYS.OPT_OUT, "1", COOKIE_OPT_MAX_AGE);
        },
    };
} else {
    // ─── IDS ─────────────────────────────────────────────────────────────────

    function uuid(): string {
        if (crypto.randomUUID) return crypto.randomUUID();
        return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10) + "-" + Math.random().toString(36).slice(2, 10);
    }

    let sid: string | null = null;
    try { sid = sessionStorage.getItem(STORAGE_KEYS.SID); } catch { /* noop */ }
    if (!sid) { sid = uuid(); try { sessionStorage.setItem(STORAGE_KEYS.SID, sid); } catch { /* noop */ } }
    const SID = sid; // guaranteed non-null after uuid() fallback

    // Visitor ID: prefer the shared-domain cookie so identity is unified across subdomains.
    let vid: string | null = readCookie(STORAGE_KEYS.VID);
    if (!vid) { try { vid = localStorage.getItem(STORAGE_KEYS.VID); } catch { /* noop */ } }
    if (!vid) vid = uuid();
    try { localStorage.setItem(STORAGE_KEYS.VID, vid); } catch { /* noop */ }
    writeSharedCookie(STORAGE_KEYS.VID, vid, COOKIE_VID_MAX_AGE);
    const VID = vid; // guaranteed non-null

    // ─── UTM ─────────────────────────────────────────────────────────────────

    function extractUtm(): Record<string, string> | null {
        let params: URLSearchParams;
        try { params = new URLSearchParams(location.search); } catch { return null; }
        const out: Record<string, string> = {};
        for (const k of ["source", "medium", "campaign", "term", "content"]) {
            const v = params.get("utm_" + k);
            if (v) out[k] = String(v).slice(0, 64);
        }
        return Object.keys(out).length ? out : null;
    }

    let utm: Record<string, string> | null = null;
    try { utm = JSON.parse(sessionStorage.getItem(STORAGE_KEYS.UTM) || "null") as Record<string, string> | null; } catch { /* noop */ }
    if (!utm) {
        utm = extractUtm();
        if (utm) { try { sessionStorage.setItem(STORAGE_KEYS.UTM, JSON.stringify(utm)); } catch { /* noop */ } }
    }

    // ─── A/B (DETERMINISTIC) ─────────────────────────────────────────────────

    function hash32(s: string): number {
        let h = 2166136261; // FNV-1a 32-bit offset basis
        for (let i = 0; i < s.length; i++) {
            h ^= s.charCodeAt(i);
            h = Math.imul(h, 16777619);
        }
        return h >>> 0;
    }

    function pickVariant(seed: string, variants: ExperimentVariant[]): string {
        const total = variants.reduce((a, v) => a + (v.weight != null ? v.weight : 1), 0);
        if (total <= 0) return variants[0]?.id ?? "";
        const bucket = hash32(seed) % total;
        let cum = 0;
        for (const v of variants) {
            cum += v.weight != null ? v.weight : 1;
            if (bucket < cum) return v.id;
        }
        return variants[variants.length - 1]?.id ?? "";
    }

    const exposed: Record<string, string> = {};

    function track(name: string, props?: Record<string, unknown>): void;
    function track(name: string, props: Record<string, unknown> = {}): void {
        try {
            const ua = (navigator as Navigator & NavigatorWithUA).userAgentData;
            const ev: AnalyticsEvent = {
                s: SCHEMA_VERSION,
                site: SITE,
                name: String(name || "unknown").slice(0, 64),
                sid: SID,
                vid: VID,
                ts: Date.now(),
                tz: (typeof Intl !== "undefined" && Intl.DateTimeFormat)
                    ? (Intl.DateTimeFormat().resolvedOptions().timeZone ?? null)
                    : null,
                path: currentPath(),
                query: location.search || null,
                ref: document.referrer || null,
                vw: window.innerWidth,
                vh: window.innerHeight,
                lang: navigator.language || null,
                ua_brand: ua?.brands ? ua.brands.map((b: UABrand) => b.brand).join(",") : null,
                utm,
                experiments: Object.keys(exposed).length ? { ...exposed } : null,
                props,
            };
            const q = loadQ();
            q.push(ev);
            saveQ(q);
            scheduleFlush();
        } catch { /* noop */ }
    }

    function variant(expId: string): string | null {
        if (Object.prototype.hasOwnProperty.call(exposed, expId)) return exposed[expId] ?? null;
        const exp = EXPERIMENTS[expId];
        if (!exp?.variants?.length) return null;
        const now = Date.now();
        if (exp.activeFrom && Date.parse(exp.activeFrom) > now) return null;
        if (exp.activeUntil && Date.parse(exp.activeUntil) < now) return null;
        const v = pickVariant(VID + ":" + expId, exp.variants);
        exposed[expId] = v;
        track("experiment_exposure", { exp: expId, variant: v });
        return v;
    }

    // ─── VISIBILITY-AWARE DWELL ──────────────────────────────────────────────

    let activeMs = 0;
    let lastResume = Date.now();
    let isActive = document.visibilityState !== "hidden";

    document.addEventListener("visibilitychange", function () {
        if (document.visibilityState === "hidden" && isActive) {
            activeMs += Date.now() - lastResume;
            isActive = false;
        } else if (document.visibilityState !== "hidden" && !isActive) {
            lastResume = Date.now();
            isActive = true;
        }
    });

    // ─── QUEUE ───────────────────────────────────────────────────────────────

    function loadQ(): (AnalyticsEvent | PageEndEvent)[] {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.EVENT_QUEUE) || "[]") as (AnalyticsEvent | PageEndEvent)[]; } catch { return []; }
    }

    function saveQ(q: (AnalyticsEvent | PageEndEvent)[]): void {
        try { localStorage.setItem(STORAGE_KEYS.EVENT_QUEUE, JSON.stringify(q.slice(-MAX_QUEUE))); } catch { /* noop */ }
    }

    // ─── FLUSH ───────────────────────────────────────────────────────────────

    let flushTimer: ReturnType<typeof setTimeout> | null = null;
    let backoff = BATCH_MS;

    function scheduleFlush(delay?: number): void {
        if (flushTimer || !ENDPOINT) return;
        flushTimer = setTimeout(flush, delay ?? BATCH_MS);
    }

    async function send(batch: (AnalyticsEvent | PageEndEvent)[]): Promise<boolean> {
        try {
            const r = await fetch(ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ schema: SCHEMA_VERSION, batch }),
                keepalive: true,
                credentials: "omit",
                mode: "cors",
            });
            return r.ok;
        } catch { return false; }
    }

    function beacon(payload: { schema: number; batch: (AnalyticsEvent | PageEndEvent)[] }): boolean {
        if (!ENDPOINT || !navigator.sendBeacon) return false;
        try {
            const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
            return navigator.sendBeacon(ENDPOINT, blob);
        } catch { return false; }
    }

    async function flush(): Promise<void> {
        flushTimer = null;
        if (!ENDPOINT) return;
        const q = loadQ();
        if (!q.length) return;
        const batch = q.slice(0, BATCH_SIZE);
        const ok = await send(batch);
        if (ok) {
            saveQ(q.slice(batch.length));
            backoff = BATCH_MS;
            if (q.length > batch.length) scheduleFlush(BATCH_MS);
        } else {
            backoff = Math.min(MAX_BACKOFF_MS, backoff * 2);
            scheduleFlush(backoff);
        }
    }

    // ─── HOOKS ───────────────────────────────────────────────────────────────

    const pvStart = Date.now();
    track("page_view", { title: (document.title || "").slice(0, 128) });

    // Scroll depth (milestones 25 / 50 / 75 / 100)
    const scrolled = new Set<number>();
    let scrollTimer: ReturnType<typeof setTimeout> | null = null;
    window.addEventListener("scroll", function () {
        if (scrollTimer) return;
        scrollTimer = setTimeout(function () {
            scrollTimer = null;
            const doc = document.documentElement;
            const total = doc.scrollHeight - window.innerHeight;
            if (total <= 0) return;
            const pct = Math.min(100, Math.round(((window.scrollY + window.innerHeight) / doc.scrollHeight) * 100));
            for (const m of [25, 50, 75, 100]) {
                if (pct >= m && !scrolled.has(m)) {
                    scrolled.add(m);
                    track("scroll_depth", { pct: m });
                }
            }
        }, 200);
    }, { passive: true });

    // Anchor clicks (delegated)
    document.addEventListener("click", function (e: MouseEvent) {
        const target = e.target;
        if (!(target instanceof Element)) return;
        const a = target.closest("a");
        if (!a) return;
        const href = a.getAttribute("href") || "";
        if (!href || href.startsWith("#")) return;

        const isAbs = /^https?:\/\//.test(href);
        let host = "";
        if (isAbs) { try { host = new URL(href, location.href).hostname; } catch { /* noop */ } }
        const sameHost = isAbs && host === location.hostname;
        const isApp = isAbs && !sameHost && APP_HOST_RX.test(host);
        const isOutbound = isAbs && !sameHost && !isApp;

        if (href.startsWith("mailto:"))                                        track("click_email",    { href });
        else if (href.startsWith("tel:"))                                      track("click_tel",      { href });
        else if (href.includes("wa.me") || href.includes("api.whatsapp.com")) track("click_whatsapp", { href });
        else if (/\.pdf(\?|#|$)/i.test(href))                                  track("click_pdf",      { href });
        else if (isApp) {
            const sub = host.replace(/\.?artelonga\.com\.br$/i, "") || "main";
            track("click_app", { app: sub, href });
        }
        else if (isOutbound)                                                   track("click_outbound", { href });
        else if (href.startsWith("/")) {
            const seg = href.split("/").filter(Boolean)[0];
            if (seg && SECTIONS.has(seg)) track("click_section", { section: seg, href });
            else if (seg)                 track("click_profile", { handle: seg });
        }
    }, true);

    // CTAs
    document.addEventListener("click", function (e: MouseEvent) {
        const target = e.target;
        if (!(target instanceof Element)) return;
        const btn = target.closest("button, .see-more, .ver-servicos-btn");
        if (!btn) return;
        const label = (btn.textContent || "").trim().slice(0, 64);
        const kind = btn.classList.contains("ver-servicos-btn") ? "ver_servicos"
                   : btn.classList.contains("see-more")        ? "ver_mais"
                   : "button";
        track("click_cta", { kind, label });
    }, true);

    // JS errors (capped to MAX_ERRORS)
    let errorCount = 0;
    window.addEventListener("error", function (e: ErrorEvent) {
        if (errorCount >= MAX_ERRORS) return;
        errorCount++;
        track("js_error", {
            message: String(e.message || "").slice(0, 256),
            source:  String(e.filename || "").slice(0, 256),
            line:    e.lineno,
            col:     e.colno,
            stack:   ((e.error as { stack?: string } | null)?.stack ?? "").split("\n").slice(0, 4).join("\n").slice(0, 512),
        });
    });

    window.addEventListener("unhandledrejection", function (e: PromiseRejectionEvent) {
        if (errorCount >= MAX_ERRORS) return;
        errorCount++;
        let reason = "";
        try {
            const r = e.reason as { stack?: string } | string | undefined;
            reason = String((r && typeof r === "object" && r.stack) ? r.stack : e.reason);
        } catch { reason = "unserializable"; }
        track("js_promise_rejection", { reason: reason.slice(0, 512) });
    });

    // Page end (one shot per page navigation)
    let endSent = false;
    function onEnd(): void {
        if (endSent) return;
        endSent = true;
        if (isActive) { activeMs += Date.now() - lastResume; isActive = false; }
        const ev: PageEndEvent = {
            s: SCHEMA_VERSION, site: SITE, name: "page_end",
            sid: SID, vid: VID, ts: Date.now(),
            path: currentPath(),
            experiments: Object.keys(exposed).length ? { ...exposed } : null,
            props: { active_ms: activeMs, total_ms: Date.now() - pvStart },
        };
        if (!beacon({ schema: SCHEMA_VERSION, batch: [ev] })) {
            const q = loadQ();
            q.push(ev);
            saveQ(q);
            void flush();
        }
    }

    document.addEventListener("visibilitychange", function () {
        if (document.visibilityState === "hidden") onEnd();
    });
    window.addEventListener("pagehide", onEnd);

    // ─── PUBLIC API ──────────────────────────────────────────────────────────

    window.AL_track = track;
    window.AL_experiments = { variant };
    window.AL_analytics = {
        sid: SID, vid: VID, schema: SCHEMA_VERSION,
        queueSize() { return loadQ().length; },
        flush,
        info() {
            return {
                sid: SID, vid: VID, schema: SCHEMA_VERSION,
                queueSize: loadQ().length,
                endpoint: ENDPOINT,
                experiments: { ...exposed },
                utm,
                optedOut: false,
            };
        },
        optOut() {
            try { localStorage.setItem(STORAGE_KEYS.OPT_OUT, "1"); } catch { /* noop */ }
            writeSharedCookie(STORAGE_KEYS.OPT_OUT, "1", COOKIE_OPT_MAX_AGE);
            try {
                sessionStorage.removeItem(STORAGE_KEYS.SID);
                localStorage.removeItem(STORAGE_KEYS.VID);
                localStorage.removeItem(STORAGE_KEYS.EVENT_QUEUE);
                sessionStorage.removeItem(STORAGE_KEYS.UTM);
            } catch { /* noop */ }
            deleteSharedCookie(STORAGE_KEYS.VID);
        },
        optIn() {
            try { localStorage.removeItem(STORAGE_KEYS.OPT_OUT); } catch { /* noop */ }
            deleteSharedCookie(STORAGE_KEYS.OPT_OUT);
            location.reload();
        },
    };
}
