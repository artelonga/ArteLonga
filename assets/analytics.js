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
 *     identity is shared between artelonga.com.br and co.artelonga.com.br. Stable across
 *     sessions for return-visit analytics and stable A/B variant assignment. Erased on opt-out.
 *   - Session ID (al_sid): random UUID in sessionStorage, scoped to the tab session.
 *   - IP not collected client-side; backend hashes with secret salt before storing.
 *
 * Resilience:
 *   - Persistent queue in localStorage, cap MAX_QUEUE events. Oldest dropped on overflow.
 *   - Batch flush every BATCH_MS or BATCH_SIZE events, whichever first.
 *   - sendBeacon on pagehide / visibilitychange:hidden (survives tab close).
 *   - Server failures: exponential backoff up to MAX_BACKOFF_MS.
 *
 * Schema versioning:
 *   - Every event carries `s: SCHEMA_VERSION`. Bump when shape changes; backend handles upgrade.
 *
 * A/B framework:
 *   - EXPERIMENTS config (this file) declares active experiments + variants + weights.
 *   - Deterministic assignment: FNV-1a hash of `vid + ":" + expId` → bucket → variant.
 *   - AL_experiments.variant(expId) returns the variant id (or null if no experiment).
 *     First call per session emits a `experiment_exposure` event.
 *   - All events thereafter include `experiments: { expId: variant }` so the backend can
 *     correlate any conversion event with active variants for that visitor.
 *
 * Public API:
 *   window.AL_track(name, props)             — emit a custom event
 *   window.AL_experiments.variant(expId)     — get assigned variant for current visitor
 *   window.AL_analytics.info()               — debug snapshot
 *   window.AL_analytics.optOut() / optIn()   — privacy controls
 */
(function () {
    "use strict";

    // ─── CONFIG ──────────────────────────────────────────────────────────────
    const SCHEMA_VERSION = 1;
    const SITE = "artelonga";
    // TODO: set when artelonga/co exposes POST /events. While empty, events queue locally.
    const ENDPOINT = "";

    // Active experiments. Add entries to launch A/B tests; weights are arbitrary integers
    // (assignment uses sum of weights as the bucket size).
    //
    // Example:
    //   "homepage_hero_v2": {
    //       activeFrom:  "2026-05-01",
    //       activeUntil: null,                 // open-ended
    //       variants: [
    //           { id: "control",   weight: 50 },
    //           { id: "treatment", weight: 50 }
    //       ]
    //   }
    const EXPERIMENTS = {};

    const BATCH_SIZE     = 20;
    const BATCH_MS       = 5000;
    const MAX_QUEUE      = 1000;
    const MAX_BACKOFF_MS = 60000;
    const MAX_ERRORS     = 20;

    // localStorage / sessionStorage keys
    const Q_KEY      = "al_evq_v1";
    const SID_KEY    = "al_sid";
    const VID_KEY    = "al_vid";
    const UTM_KEY    = "al_utm";
    const OPTOUT_KEY = "al_optout";

    // Top-level sections used to classify same-origin clicks.
    const SECTIONS = new Set([
        "parceiros", "servicos", "solucoes", "comunidades",
        "sobre", "recursos", "proximos-passos", "jardim", "eventos"
    ]);

    // Shared-domain cookie for cross-subdomain identity (artelonga.com.br ↔ co.artelonga.com.br).
    const SHARED_DOMAIN     = ".artelonga.com.br";
    const SHARED_DOMAIN_RX  = /(?:^|\.)artelonga\.com\.br$/i;
    const APP_HOST_RX       = SHARED_DOMAIN_RX;
    const COOKIE_VID_MAX_AGE = 60 * 60 * 24 * 365 * 2; // 2y
    const COOKIE_OPT_MAX_AGE = 60 * 60 * 24 * 365 * 5; // 5y
    function canSetSharedCookie() {
        return SHARED_DOMAIN_RX.test(location.hostname || "");
    }
    function readCookie(name) {
        const esc = name.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
        const m = (document.cookie || "").match(new RegExp("(?:^|; )" + esc + "=([^;]*)"));
        if (!m) return null;
        try { return decodeURIComponent(m[1]); } catch { return null; }
    }
    function writeSharedCookie(name, value, maxAge) {
        if (!canSetSharedCookie()) return;
        const parts = [
            name + "=" + encodeURIComponent(value),
            "Path=/",
            "Domain=" + SHARED_DOMAIN,
            "SameSite=Lax",
            "Max-Age=" + maxAge
        ];
        if (location.protocol === "https:") parts.push("Secure");
        try { document.cookie = parts.join("; "); } catch {}
    }
    function deleteSharedCookie(name) {
        if (!canSetSharedCookie()) return;
        try { document.cookie = name + "=; Path=/; Domain=" + SHARED_DOMAIN + "; Max-Age=0"; } catch {}
    }

    // Migration: drop pre-v1 queue (different shape).
    try { localStorage.removeItem("al_evq"); } catch {}

    // ─── PRIVACY GATE ────────────────────────────────────────────────────────
    function dnt() {
        const v = navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack;
        return v === "1" || v === "yes";
    }
    function isOptedOut() {
        if (window.AL_optout === true) return true;
        try { if (localStorage.getItem(OPTOUT_KEY) === "1") return true; } catch {}
        if (readCookie(OPTOUT_KEY) === "1") return true;
        return dnt();
    }
    function isAutomated() {
        if (navigator.webdriver) return true;
        if (/HeadlessChrome|PhantomJS|Selenium|Cypress|Playwright/i.test(navigator.userAgent || "")) return true;
        return false;
    }
    if (isOptedOut() || isAutomated()) {
        window.AL_track = function () {};
        window.AL_experiments = { variant: function () { return null; } };
        window.AL_analytics = {
            optedOut: true,
            info: function () { return { optedOut: true, reason: isAutomated() ? "automated" : "opted-out" }; },
            optIn: function () {
                try { localStorage.removeItem(OPTOUT_KEY); } catch {}
                deleteSharedCookie(OPTOUT_KEY);
                location.reload();
            },
            optOut: function () {
                try { localStorage.setItem(OPTOUT_KEY, "1"); } catch {}
                writeSharedCookie(OPTOUT_KEY, "1", COOKIE_OPT_MAX_AGE);
            }
        };
        return;
    }

    // ─── IDS ─────────────────────────────────────────────────────────────────
    function uuid() {
        if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
        return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10) + "-" + Math.random().toString(36).slice(2, 10);
    }
    let sid = null;
    try { sid = sessionStorage.getItem(SID_KEY); } catch {}
    if (!sid) { sid = uuid(); try { sessionStorage.setItem(SID_KEY, sid); } catch {} }

    // Visitor ID: prefer the shared-domain cookie so identity is unified across
    // artelonga.com.br ↔ co.artelonga.com.br. Fall back to localStorage, then mint a new one.
    // Always write both so subsequent visits to the other subdomain see the same vid.
    let vid = readCookie(VID_KEY);
    if (!vid) { try { vid = localStorage.getItem(VID_KEY); } catch {} }
    if (!vid) vid = uuid();
    try { localStorage.setItem(VID_KEY, vid); } catch {}
    writeSharedCookie(VID_KEY, vid, COOKIE_VID_MAX_AGE);

    // ─── PATH / UTM ──────────────────────────────────────────────────────────
    function normalizePath(p) {
        p = (p || "/").replace(/\/index\.html$/, "/");
        p = p.replace(/\/+$/, "/");
        return p || "/";
    }
    function currentPath() { return normalizePath(location.pathname); }

    function extractUtm() {
        let params;
        try { params = new URLSearchParams(location.search); } catch { return null; }
        const out = {};
        for (const k of ["source", "medium", "campaign", "term", "content"]) {
            const v = params.get("utm_" + k);
            if (v) out[k] = String(v).slice(0, 64);
        }
        return Object.keys(out).length ? out : null;
    }
    let utm = null;
    try { utm = JSON.parse(sessionStorage.getItem(UTM_KEY) || "null"); } catch {}
    if (!utm) {
        utm = extractUtm();
        if (utm) { try { sessionStorage.setItem(UTM_KEY, JSON.stringify(utm)); } catch {} }
    }

    // ─── A/B (DETERMINISTIC) ─────────────────────────────────────────────────
    function hash32(s) {
        let h = 2166136261; // FNV-1a 32-bit offset basis
        for (let i = 0; i < s.length; i++) {
            h ^= s.charCodeAt(i);
            h = Math.imul(h, 16777619);
        }
        return h >>> 0;
    }
    function pickVariant(seed, variants) {
        const total = variants.reduce((a, v) => a + (v.weight != null ? v.weight : 1), 0);
        if (total <= 0) return variants[0].id;
        const bucket = hash32(seed) % total;
        let cum = 0;
        for (const v of variants) {
            cum += v.weight != null ? v.weight : 1;
            if (bucket < cum) return v.id;
        }
        return variants[variants.length - 1].id;
    }
    const exposed = {}; // expId → variantId, snapshotted on every event
    function variant(expId) {
        if (Object.prototype.hasOwnProperty.call(exposed, expId)) return exposed[expId];
        const exp = EXPERIMENTS[expId];
        if (!exp || !exp.variants || !exp.variants.length) return null;
        const now = Date.now();
        if (exp.activeFrom  && Date.parse(exp.activeFrom)  > now) return null;
        if (exp.activeUntil && Date.parse(exp.activeUntil) < now) return null;
        const v = pickVariant(vid + ":" + expId, exp.variants);
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
    function loadQ() {
        try { return JSON.parse(localStorage.getItem(Q_KEY) || "[]"); } catch { return []; }
    }
    function saveQ(q) {
        try { localStorage.setItem(Q_KEY, JSON.stringify(q.slice(-MAX_QUEUE))); } catch {}
    }

    // ─── TRACK ───────────────────────────────────────────────────────────────
    function track(name, props) {
        try {
            const ev = {
                s: SCHEMA_VERSION,
                site: SITE,
                name: String(name || "unknown").slice(0, 64),
                sid, vid,
                ts: Date.now(),
                tz: (Intl && Intl.DateTimeFormat && Intl.DateTimeFormat().resolvedOptions().timeZone) || null,
                path: currentPath(),
                query: location.search || null,
                ref: document.referrer || null,
                vw: window.innerWidth,
                vh: window.innerHeight,
                lang: navigator.language || null,
                ua_brand: (navigator.userAgentData && navigator.userAgentData.brands)
                    ? navigator.userAgentData.brands.map(b => b.brand).join(",")
                    : null,
                utm: utm,
                experiments: Object.keys(exposed).length ? Object.assign({}, exposed) : null,
                props: props || {}
            };
            const q = loadQ();
            q.push(ev);
            saveQ(q);
            scheduleFlush();
        } catch {}
    }

    // ─── FLUSH (exponential backoff on failure) ──────────────────────────────
    let flushTimer = null;
    let backoff = BATCH_MS;
    function scheduleFlush(delay) {
        if (flushTimer || !ENDPOINT) return;
        flushTimer = setTimeout(flush, delay != null ? delay : BATCH_MS);
    }
    async function flush() {
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
    async function send(batch) {
        try {
            const r = await fetch(ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ schema: SCHEMA_VERSION, batch }),
                keepalive: true,
                credentials: "omit",
                mode: "cors"
            });
            return r.ok;
        } catch { return false; }
    }
    function beacon(payload) {
        if (!ENDPOINT || !navigator.sendBeacon) return false;
        try {
            const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
            return navigator.sendBeacon(ENDPOINT, blob);
        } catch { return false; }
    }

    // ─── HOOKS ───────────────────────────────────────────────────────────────
    const pvStart = Date.now();
    track("page_view", { title: (document.title || "").slice(0, 128) });

    // Scroll depth (milestones 25 / 50 / 75 / 100)
    const scrolled = new Set();
    let scrollTimer = null;
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
    document.addEventListener("click", function (e) {
        const a = e.target.closest && e.target.closest("a");
        if (!a) return;
        const href = a.getAttribute("href") || "";
        if (!href || href.startsWith("#")) return;

        const isAbs = /^https?:\/\//.test(href);
        let host = "";
        if (isAbs) { try { host = new URL(href, location.href).hostname; } catch {} }
        const sameHost   = isAbs && host === location.hostname;
        const isApp      = isAbs && !sameHost && APP_HOST_RX.test(host);
        const isOutbound = isAbs && !sameHost && !isApp;

        if (href.startsWith("mailto:"))                                track("click_email",    { href });
        else if (href.startsWith("tel:"))                              track("click_tel",      { href });
        else if (href.includes("wa.me") || href.includes("api.whatsapp.com")) track("click_whatsapp", { href });
        else if (/\.pdf(\?|#|$)/i.test(href))                          track("click_pdf",      { href });
        else if (isApp) {
            const sub = host.replace(/\.?artelonga\.com\.br$/i, "") || "main";
            track("click_app", { app: sub, href });
        }
        else if (isOutbound)                                           track("click_outbound", { href });
        else if (href.startsWith("/")) {
            const seg = href.split("/").filter(Boolean)[0];
            if (SECTIONS.has(seg)) track("click_section", { section: seg, href });
            else if (seg)          track("click_profile", { handle: seg });
        }
    }, true);

    // CTAs
    document.addEventListener("click", function (e) {
        const btn = e.target.closest && e.target.closest("button, .see-more, .ver-servicos-btn");
        if (!btn) return;
        const label = (btn.textContent || "").trim().slice(0, 64);
        const kind = btn.classList.contains("ver-servicos-btn") ? "ver_servicos"
                   : btn.classList.contains("see-more")        ? "ver_mais"
                   : "button";
        track("click_cta", { kind, label });
    }, true);

    // JS errors (capped to MAX_ERRORS to prevent flooding)
    let errorCount = 0;
    window.addEventListener("error", function (e) {
        if (errorCount >= MAX_ERRORS) return;
        errorCount++;
        track("js_error", {
            message: String((e && e.message) || "").slice(0, 256),
            source:  String((e && e.filename) || "").slice(0, 256),
            line:    e && e.lineno,
            col:     e && e.colno,
            stack:   ((e && e.error && e.error.stack) || "").split("\n").slice(0, 4).join("\n").slice(0, 512)
        });
    });
    window.addEventListener("unhandledrejection", function (e) {
        if (errorCount >= MAX_ERRORS) return;
        errorCount++;
        let reason = "";
        try { reason = String((e.reason && e.reason.stack) || e.reason); } catch { reason = "unserializable"; }
        track("js_promise_rejection", { reason: reason.slice(0, 512) });
    });

    // Page end (one shot per page navigation; emits accumulated active dwell)
    let endSent = false;
    function onEnd() {
        if (endSent) return;
        endSent = true;
        if (isActive) { activeMs += Date.now() - lastResume; isActive = false; }
        const ev = {
            s: SCHEMA_VERSION, site: SITE, name: "page_end",
            sid, vid, ts: Date.now(),
            path: currentPath(),
            experiments: Object.keys(exposed).length ? Object.assign({}, exposed) : null,
            props: { active_ms: activeMs, total_ms: Date.now() - pvStart }
        };
        if (!beacon({ schema: SCHEMA_VERSION, batch: [ev] })) {
            const q = loadQ();
            q.push(ev);
            saveQ(q);
            flush();
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
        sid, vid, schema: SCHEMA_VERSION,
        queueSize: function () { return loadQ().length; },
        flush,
        info: function () {
            return {
                sid, vid, schema: SCHEMA_VERSION,
                queueSize: loadQ().length,
                endpoint: ENDPOINT || null,
                experiments: Object.assign({}, exposed),
                utm: utm,
                optedOut: false
            };
        },
        optOut: function () {
            try { localStorage.setItem(OPTOUT_KEY, "1"); } catch {}
            writeSharedCookie(OPTOUT_KEY, "1", COOKIE_OPT_MAX_AGE);
            try {
                sessionStorage.removeItem(SID_KEY);
                localStorage.removeItem(VID_KEY);
                localStorage.removeItem(Q_KEY);
                sessionStorage.removeItem(UTM_KEY);
            } catch {}
            deleteSharedCookie(VID_KEY);
        },
        optIn: function () {
            try { localStorage.removeItem(OPTOUT_KEY); } catch {}
            deleteSharedCookie(OPTOUT_KEY);
            location.reload();
        }
    };
})();
