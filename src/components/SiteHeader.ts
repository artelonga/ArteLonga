import { esc } from "../lib/esc";

const CO_BASE = "https://co.artelonga.com.br";

export function siteHeader(): string {
    return `<header class="site-header">
        <div class="site-header-inner">
            <a class="site-brand" href="/"><img src="/logo-al.png" alt="Arte Longa" width="58" height="36"></a>
            <div class="site-header-nav">
                <span id="al-header-auth"></span>
                <a class="site-cta-parceiros" href="/faca-parte/">Para parceiros →</a>
            </div>
        </div>
    </header>`;
}

export async function initHeaderAuth(): Promise<void> {
    const el = document.getElementById("al-header-auth");
    if (!el) return;
    try {
        const r = await fetch(`${CO_BASE}/api/v1/auth/me`, { credentials: "include" });
        if (r.ok) {
            const user = await r.json() as { display_name?: string; email?: string };
            const name = user.display_name || user.email || "você";
            el.innerHTML = `<span class="al-auth-greeting">Olá, ${esc(name)}</span><button class="al-auth-logout" type="button" id="al-logout-btn">Sair</button>`;
            document.getElementById("al-logout-btn")?.addEventListener("click", async () => {
                await fetch(`${CO_BASE}/api/v1/auth/logout`, { method: "POST", credentials: "include" }).catch(() => {});
                window.location.reload();
            });
        } else {
            el.innerHTML = `<a class="site-cta-entrar" href="/entrar/">Entrar →</a>`;
        }
    } catch (_) {
        el.innerHTML = `<a class="site-cta-entrar" href="/entrar/">Entrar →</a>`;
    }
}
