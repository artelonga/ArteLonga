/* Arte Longa · Analytics (self-hosted beacon)
 *
 * Arquitetura:
 *   frontend → queue localStorage → batch POST → backend (artelonga/co) → DB → Grafana
 *
 * Privacy:
 *   - Sem cookies, sem fingerprint.
 *   - Session ID efêmero em sessionStorage (some ao fechar aba).
 *   - IP nunca sai do navegador; quando backend estiver no ar, será hasheado lá.
 *
 * Resiliência:
 *   - Queue persistente em localStorage (MAX 1000 eventos).
 *   - Se endpoint vazio ou offline: eventos acumulam; drenam quando ligar.
 *   - keepalive: true para fetch resistir a navegação.
 *   - sendBeacon para eventos de unload (pagehide / visibilitychange hidden).
 *
 * Ligação:
 *   Definir ENDPOINT abaixo quando `artelonga/co` expuser `POST /events`.
 *   Até lá, eventos acumulam no localStorage do visitante (cap 1000).
 */
(function () {
    // TODO: URL do collector no artelonga/co. Vazio = coleta mas não envia.
    const ENDPOINT = "";

    const BATCH_SIZE = 20;
    const BATCH_MS = 5000;
    const MAX_QUEUE = 1000;
    const Q_KEY = "al_evq";
    const SID_KEY = "al_sid";
    const SITE = "artelonga";

    // ── Session ID (per-tab)
    let sid = null;
    try { sid = sessionStorage.getItem(SID_KEY); } catch {}
    if (!sid) {
        sid = (crypto && crypto.randomUUID)
            ? crypto.randomUUID()
            : (Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10));
        try { sessionStorage.setItem(SID_KEY, sid); } catch {}
    }

    // ── Queue (persistente, bounded)
    function loadQ() {
        try { return JSON.parse(localStorage.getItem(Q_KEY) || "[]"); } catch { return []; }
    }
    function saveQ(q) {
        try { localStorage.setItem(Q_KEY, JSON.stringify(q.slice(-MAX_QUEUE))); } catch {}
    }

    // ── Core track API (expostopara window.AL_track também)
    function track(name, props) {
        const ev = {
            site: SITE,
            name: String(name || "unknown").slice(0, 64),
            sid,
            ts: Date.now(),
            tz: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
            path: location.pathname,
            query: location.search || null,
            ref: document.referrer || null,
            vw: window.innerWidth,
            vh: window.innerHeight,
            lang: navigator.language || null,
            ua_brand: (navigator.userAgentData && navigator.userAgentData.brands)
                ? navigator.userAgentData.brands.map(b => b.brand).join(",")
                : null,
            props: props || {}
        };
        const q = loadQ();
        q.push(ev);
        saveQ(q);
        scheduleFlush();
    }

    let flushTimer = null;
    function scheduleFlush() {
        if (flushTimer || !ENDPOINT) return;
        flushTimer = setTimeout(flush, BATCH_MS);
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
            if (q.length > batch.length) scheduleFlush();
        } else {
            // Falhou: mantém queue, tenta de novo depois
            scheduleFlush();
        }
    }

    async function send(batch) {
        try {
            const r = await fetch(ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ batch }),
                keepalive: true,
                credentials: "omit",
                mode: "cors"
            });
            return r.ok;
        } catch {
            return false;
        }
    }

    // ── Beacon síncrono para eventos de unload
    function beacon(ev) {
        if (!ENDPOINT || !navigator.sendBeacon) return false;
        try {
            const blob = new Blob(
                [JSON.stringify({ batch: [ev] })],
                { type: "application/json" }
            );
            return navigator.sendBeacon(ENDPOINT, blob);
        } catch { return false; }
    }

    // ─── HOOKS ────────────────────────────────────────────────────────────

    // Page view (inicial)
    const pvStart = Date.now();
    track("page_view", { title: document.title });

    // Scroll depth (milestones 25/50/75/100)
    const scrolled = new Set();
    let scrollTimer = null;
    window.addEventListener("scroll", () => {
        if (scrollTimer) return;
        scrollTimer = setTimeout(() => {
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

    // Clicks delegados
    document.addEventListener("click", (e) => {
        const a = e.target.closest("a");
        if (!a) return;
        const href = a.getAttribute("href") || "";
        if (!href || href.startsWith("#")) return;

        const isAbs = /^https?:\/\//.test(href);
        const isOutbound = isAbs && !href.includes(location.hostname);
        const isEmail = href.startsWith("mailto:");
        const isTel = href.startsWith("tel:");
        const isWa = href.includes("wa.me") || href.includes("api.whatsapp.com");
        const isPdf = /\.pdf(\?|#|$)/i.test(href);

        if (isEmail)        track("click_email",    { href });
        else if (isTel)     track("click_tel",      { href });
        else if (isWa)      track("click_whatsapp", { href });
        else if (isPdf)     track("click_pdf",      { href });
        else if (isOutbound) track("click_outbound", { href });
        else if (href.startsWith("/")) {
            const seg = href.split("/").filter(Boolean)[0];
            const sections = new Set(["parceiros", "servicos", "solucoes", "comunidades", "sobre", "recursos", "proximos-passos"]);
            if (sections.has(seg)) track("click_section", { section: seg, href });
            else if (seg)           track("click_profile", { handle: seg });
        }
    }, true);

    // Engajamento: cliques em botões de ação (CTAs dos cartões)
    document.addEventListener("click", (e) => {
        const btn = e.target.closest("button, .see-more, .ver-servicos-btn");
        if (!btn) return;
        const label = (btn.textContent || "").trim().slice(0, 64);
        const kind = btn.classList.contains("ver-servicos-btn") ? "ver_servicos"
                   : btn.classList.contains("see-more") ? "ver_mais"
                   : "button";
        track("click_cta", { kind, label });
    }, true);

    // Session end (unload) — duração da visita
    let endSent = false;
    function onEnd() {
        if (endSent) return;
        endSent = true;
        const ms = Date.now() - pvStart;
        const ev = {
            site: SITE, name: "page_end", sid,
            ts: Date.now(), path: location.pathname,
            props: { ms }
        };
        // Tenta beacon; se offline ou sem endpoint, cai no queue normal
        if (!beacon(ev)) {
            const q = loadQ();
            q.push(ev);
            saveQ(q);
        }
    }
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") onEnd();
    });
    window.addEventListener("pagehide", onEnd);

    // API pública para eventos custom em handlers específicos
    window.AL_track = track;
    window.AL_analytics = { sid, queueSize: () => loadQ().length, flush };
})();
