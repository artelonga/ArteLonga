(function() {
  "use strict";
  const STORAGE_KEYS = {
    VID: "al_vid",
    SID: "al_sid",
    OPT_OUT: "al_optout",
    EVENT_QUEUE: "al_evq_v1",
    UTM: "al_utm"
  };
  const SCHEMA_VERSION = 1;
  const SITE = "artelonga";
  const ENDPOINT = "https://co.artelonga.com.br/api/v1/telemetry/events";
  const EXPERIMENTS = {};
  const BATCH_SIZE = 20;
  const BATCH_MS = 5e3;
  const MAX_QUEUE = 1e3;
  const MAX_BACKOFF_MS = 6e4;
  const MAX_ERRORS = 20;
  const SECTIONS = /* @__PURE__ */ new Set([
    "parceiros",
    "servicos",
    "solucoes",
    "comunidades",
    "sobre",
    "recursos",
    "proximos-passos",
    "jardim",
    "eventos"
  ]);
  const SHARED_DOMAIN = ".artelonga.com.br";
  const SHARED_DOMAIN_RX = /(?:^|\.)artelonga\.com\.br$/i;
  const APP_HOST_RX = SHARED_DOMAIN_RX;
  const COOKIE_VID_MAX_AGE = 60 * 60 * 24 * 365 * 2;
  const COOKIE_OPT_MAX_AGE = 60 * 60 * 24 * 365 * 5;
  function canSetSharedCookie() {
    return SHARED_DOMAIN_RX.test(location.hostname || "");
  }
  function readCookie(name) {
    const esc = name.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
    const m = (document.cookie || "").match(new RegExp("(?:^|; )" + esc + "=([^;]*)"));
    if (!m) return null;
    try {
      return decodeURIComponent(m[1] ?? "");
    } catch {
      return null;
    }
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
    try {
      document.cookie = parts.join("; ");
    } catch {
    }
  }
  function deleteSharedCookie(name) {
    if (!canSetSharedCookie()) return;
    try {
      document.cookie = name + "=; Path=/; Domain=" + SHARED_DOMAIN + "; Max-Age=0";
    } catch {
    }
  }
  try {
    localStorage.removeItem("al_evq");
  } catch {
  }
  function dnt() {
    const nav = navigator;
    const win = window;
    const v = navigator.doNotTrack ?? nav.msDoNotTrack ?? win.doNotTrack;
    return v === "1" || v === "yes";
  }
  function isOptedOut() {
    if (window.AL_optout === true) return true;
    try {
      if (localStorage.getItem(STORAGE_KEYS.OPT_OUT) === "1") return true;
    } catch {
    }
    if (readCookie(STORAGE_KEYS.OPT_OUT) === "1") return true;
    return dnt();
  }
  function isAutomated() {
    if (navigator.webdriver) return true;
    if (/HeadlessChrome|PhantomJS|Selenium|Cypress|Playwright/i.test(navigator.userAgent || "")) return true;
    return false;
  }
  function normalizePath(p) {
    p = (p || "/").replace(/\/index\.html$/, "/");
    p = p.replace(/\/+$/, "/");
    return p || "/";
  }
  function currentPath() {
    return normalizePath(location.pathname);
  }
  const _automated = isAutomated();
  if (isOptedOut() || _automated) {
    window.AL_track = function() {
    };
    window.AL_experiments = { variant: function() {
      return null;
    } };
    window.AL_analytics = {
      optedOut: true,
      sid: "",
      vid: "",
      schema: SCHEMA_VERSION,
      queueSize() {
        return 0;
      },
      async flush() {
      },
      info() {
        return {
          optedOut: true,
          reason: _automated ? "automated" : "opted-out",
          sid: "",
          vid: "",
          schema: SCHEMA_VERSION,
          queueSize: 0,
          endpoint: null,
          experiments: {},
          utm: null
        };
      },
      optIn() {
        try {
          localStorage.removeItem(STORAGE_KEYS.OPT_OUT);
        } catch {
        }
        deleteSharedCookie(STORAGE_KEYS.OPT_OUT);
        location.reload();
      },
      optOut() {
        try {
          localStorage.setItem(STORAGE_KEYS.OPT_OUT, "1");
        } catch {
        }
        writeSharedCookie(STORAGE_KEYS.OPT_OUT, "1", COOKIE_OPT_MAX_AGE);
      }
    };
  } else {
    let uuid = function() {
      if (crypto.randomUUID) return crypto.randomUUID();
      return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10) + "-" + Math.random().toString(36).slice(2, 10);
    }, extractUtm = function() {
      let params;
      try {
        params = new URLSearchParams(location.search);
      } catch {
        return null;
      }
      const out = {};
      for (const k of ["source", "medium", "campaign", "term", "content"]) {
        const v = params.get("utm_" + k);
        if (v) out[k] = String(v).slice(0, 64);
      }
      return Object.keys(out).length ? out : null;
    }, hash32 = function(s) {
      let h = 2166136261;
      for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      return h >>> 0;
    }, pickVariant = function(seed, variants) {
      var _a, _b;
      const total = variants.reduce((a, v) => a + (v.weight != null ? v.weight : 1), 0);
      if (total <= 0) return ((_a = variants[0]) == null ? void 0 : _a.id) ?? "";
      const bucket = hash32(seed) % total;
      let cum = 0;
      for (const v of variants) {
        cum += v.weight != null ? v.weight : 1;
        if (bucket < cum) return v.id;
      }
      return ((_b = variants[variants.length - 1]) == null ? void 0 : _b.id) ?? "";
    }, track = function(name, props = {}) {
      try {
        const ua = navigator.userAgentData;
        const ev = {
          s: SCHEMA_VERSION,
          site: SITE,
          name: String(name || "unknown").slice(0, 64),
          sid: SID,
          vid: VID,
          ts: Date.now(),
          tz: typeof Intl !== "undefined" && Intl.DateTimeFormat ? Intl.DateTimeFormat().resolvedOptions().timeZone ?? null : null,
          path: currentPath(),
          query: location.search || null,
          ref: document.referrer || null,
          vw: window.innerWidth,
          vh: window.innerHeight,
          lang: navigator.language || null,
          ua_brand: (ua == null ? void 0 : ua.brands) ? ua.brands.map((b) => b.brand).join(",") : null,
          utm,
          experiments: Object.keys(exposed).length ? { ...exposed } : null,
          props
        };
        const q = loadQ();
        q.push(ev);
        saveQ(q);
        scheduleFlush();
      } catch {
      }
    }, variant = function(expId) {
      var _a;
      if (Object.prototype.hasOwnProperty.call(exposed, expId)) return exposed[expId] ?? null;
      const exp = EXPERIMENTS[expId];
      if (!((_a = exp == null ? void 0 : exp.variants) == null ? void 0 : _a.length)) return null;
      const now = Date.now();
      if (exp.activeFrom && Date.parse(exp.activeFrom) > now) return null;
      if (exp.activeUntil && Date.parse(exp.activeUntil) < now) return null;
      const v = pickVariant(VID + ":" + expId, exp.variants);
      exposed[expId] = v;
      track("experiment_exposure", { exp: expId, variant: v });
      return v;
    }, loadQ = function() {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.EVENT_QUEUE) || "[]");
      } catch {
        return [];
      }
    }, saveQ = function(q) {
      try {
        localStorage.setItem(STORAGE_KEYS.EVENT_QUEUE, JSON.stringify(q.slice(-MAX_QUEUE)));
      } catch {
      }
    }, scheduleFlush = function(delay) {
      if (flushTimer || !ENDPOINT) return;
      flushTimer = setTimeout(flush, delay ?? BATCH_MS);
    }, beacon = function(payload) {
      if (!navigator.sendBeacon) return false;
      try {
        const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
        return navigator.sendBeacon(ENDPOINT, blob);
      } catch {
        return false;
      }
    }, onEnd = function() {
      if (endSent) return;
      endSent = true;
      if (isActive) {
        activeMs += Date.now() - lastResume;
        isActive = false;
      }
      const ev = {
        s: SCHEMA_VERSION,
        site: SITE,
        name: "page_end",
        sid: SID,
        vid: VID,
        ts: Date.now(),
        path: currentPath(),
        experiments: Object.keys(exposed).length ? { ...exposed } : null,
        props: { active_ms: activeMs, total_ms: Date.now() - pvStart }
      };
      if (!beacon({ schema: SCHEMA_VERSION, batch: [ev] })) {
        const q = loadQ();
        q.push(ev);
        saveQ(q);
        void flush();
      }
    };
    let sid = null;
    try {
      sid = sessionStorage.getItem(STORAGE_KEYS.SID);
    } catch {
    }
    if (!sid) {
      sid = uuid();
      try {
        sessionStorage.setItem(STORAGE_KEYS.SID, sid);
      } catch {
      }
    }
    const SID = sid;
    let vid = readCookie(STORAGE_KEYS.VID);
    if (!vid) {
      try {
        vid = localStorage.getItem(STORAGE_KEYS.VID);
      } catch {
      }
    }
    if (!vid) vid = uuid();
    try {
      localStorage.setItem(STORAGE_KEYS.VID, vid);
    } catch {
    }
    writeSharedCookie(STORAGE_KEYS.VID, vid, COOKIE_VID_MAX_AGE);
    const VID = vid;
    let utm = null;
    try {
      utm = JSON.parse(sessionStorage.getItem(STORAGE_KEYS.UTM) || "null");
    } catch {
    }
    if (!utm) {
      utm = extractUtm();
      if (utm) {
        try {
          sessionStorage.setItem(STORAGE_KEYS.UTM, JSON.stringify(utm));
        } catch {
        }
      }
    }
    const exposed = {};
    let activeMs = 0;
    let lastResume = Date.now();
    let isActive = document.visibilityState !== "hidden";
    document.addEventListener("visibilitychange", function() {
      if (document.visibilityState === "hidden" && isActive) {
        activeMs += Date.now() - lastResume;
        isActive = false;
      } else if (document.visibilityState !== "hidden" && !isActive) {
        lastResume = Date.now();
        isActive = true;
      }
    });
    let flushTimer = null;
    let backoff = BATCH_MS;
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
      } catch {
        return false;
      }
    }
    async function flush() {
      flushTimer = null;
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
    const pvStart = Date.now();
    track("page_view", { title: (document.title || "").slice(0, 128) });
    const scrolled = /* @__PURE__ */ new Set();
    let scrollTimer = null;
    window.addEventListener("scroll", function() {
      if (scrollTimer) return;
      scrollTimer = setTimeout(function() {
        scrollTimer = null;
        const doc = document.documentElement;
        const total = doc.scrollHeight - window.innerHeight;
        if (total <= 0) return;
        const pct = Math.min(100, Math.round((window.scrollY + window.innerHeight) / doc.scrollHeight * 100));
        for (const m of [25, 50, 75, 100]) {
          if (pct >= m && !scrolled.has(m)) {
            scrolled.add(m);
            track("scroll_depth", { pct: m });
          }
        }
      }, 200);
    }, { passive: true });
    document.addEventListener("click", function(e) {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const a = target.closest("a");
      if (!a) return;
      const href = a.getAttribute("href") || "";
      if (!href || href.startsWith("#")) return;
      const isAbs = /^https?:\/\//.test(href);
      let host = "";
      if (isAbs) {
        try {
          host = new URL(href, location.href).hostname;
        } catch {
        }
      }
      const sameHost = isAbs && host === location.hostname;
      const isApp = isAbs && !sameHost && APP_HOST_RX.test(host);
      const isOutbound = isAbs && !sameHost && !isApp;
      if (href.startsWith("mailto:")) track("click_email", { href });
      else if (href.startsWith("tel:")) track("click_tel", { href });
      else if (href.includes("wa.me") || href.includes("api.whatsapp.com")) track("click_whatsapp", { href });
      else if (/\.pdf(\?|#|$)/i.test(href)) track("click_pdf", { href });
      else if (isApp) {
        const sub = host.replace(/\.?artelonga\.com\.br$/i, "") || "main";
        track("click_app", { app: sub, href });
      } else if (isOutbound) track("click_outbound", { href });
      else if (href.startsWith("/")) {
        const seg = href.split("/").filter(Boolean)[0];
        if (seg && SECTIONS.has(seg)) track("click_section", { section: seg, href });
        else if (seg) track("click_profile", { handle: seg });
      }
    }, true);
    document.addEventListener("click", function(e) {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const btn = target.closest("button, .see-more, .ver-servicos-btn");
      if (!btn) return;
      const label = (btn.textContent || "").trim().slice(0, 64);
      const kind = btn.classList.contains("ver-servicos-btn") ? "ver_servicos" : btn.classList.contains("see-more") ? "ver_mais" : "button";
      track("click_cta", { kind, label });
    }, true);
    let errorCount = 0;
    window.addEventListener("error", function(e) {
      var _a;
      if (errorCount >= MAX_ERRORS) return;
      errorCount++;
      track("js_error", {
        message: String(e.message || "").slice(0, 256),
        source: String(e.filename || "").slice(0, 256),
        line: e.lineno,
        col: e.colno,
        stack: (((_a = e.error) == null ? void 0 : _a.stack) ?? "").split("\n").slice(0, 4).join("\n").slice(0, 512)
      });
    });
    window.addEventListener("unhandledrejection", function(e) {
      if (errorCount >= MAX_ERRORS) return;
      errorCount++;
      let reason = "";
      try {
        const r = e.reason;
        reason = String(r && typeof r === "object" && r.stack ? r.stack : e.reason);
      } catch {
        reason = "unserializable";
      }
      track("js_promise_rejection", { reason: reason.slice(0, 512) });
    });
    let endSent = false;
    document.addEventListener("visibilitychange", function() {
      if (document.visibilityState === "hidden") onEnd();
    });
    window.addEventListener("pagehide", onEnd);
    window.AL_track = track;
    window.AL_experiments = { variant };
    window.AL_analytics = {
      sid: SID,
      vid: VID,
      schema: SCHEMA_VERSION,
      queueSize() {
        return loadQ().length;
      },
      flush,
      info() {
        return {
          sid: SID,
          vid: VID,
          schema: SCHEMA_VERSION,
          queueSize: loadQ().length,
          endpoint: ENDPOINT,
          experiments: { ...exposed },
          utm,
          optedOut: false
        };
      },
      optOut() {
        try {
          localStorage.setItem(STORAGE_KEYS.OPT_OUT, "1");
        } catch {
        }
        writeSharedCookie(STORAGE_KEYS.OPT_OUT, "1", COOKIE_OPT_MAX_AGE);
        try {
          sessionStorage.removeItem(STORAGE_KEYS.SID);
          localStorage.removeItem(STORAGE_KEYS.VID);
          localStorage.removeItem(STORAGE_KEYS.EVENT_QUEUE);
          sessionStorage.removeItem(STORAGE_KEYS.UTM);
        } catch {
        }
        deleteSharedCookie(STORAGE_KEYS.VID);
      },
      optIn() {
        try {
          localStorage.removeItem(STORAGE_KEYS.OPT_OUT);
        } catch {
        }
        deleteSharedCookie(STORAGE_KEYS.OPT_OUT);
        location.reload();
      }
    };
  }
})();
