import { siteHeader } from "../components/SiteHeader";
import { siteFooter } from "../components/SiteFooter";

const CO_BASE = "https://co.artelonga.com.br";

export function render(): void {
    document.body.innerHTML = `
        ${siteHeader()}
        <main class="main">
            <div class="entrar-wrap">
                <div id="al-email-step">
                    <h1 class="entrar-h1">Entrar<br>ou Cadastrar</h1>
                    <p class="entrar-sub">Acesse sua conta ou crie uma com o seu email.</p>
                    <form class="fp-form" id="al-signup" novalidate>
                        <p class="fp-form-title">Continue com seu email</p>
                        <div class="fp-field">
                            <label for="email">Email</label>
                            <input type="email" id="email" name="email"
                                   placeholder="email@exemplo.com"
                                   autocomplete="email" required>
                        </div>
                        <button type="submit" class="fp-submit">Continuar →</button>
                        <div id="al-signup-error" class="entrar-error" hidden></div>
                        <div class="entrar-divider" aria-hidden="true">ou</div>
                        <button type="button" class="entrar-google-btn" id="al-google-btn">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            Entrar com Google
                        </button>
                    </form>
                </div>
                <div id="al-code-step" hidden>
                    <div class="fp-form">
                        <p class="fp-form-title">Verifique seu email</p>
                        <p class="fp-form-sub">
                            Enviamos um código de 6 dígitos para
                            <span class="entrar-code-target" id="al-code-target"></span>.
                        </p>
                        <form id="al-verify-form" novalidate>
                            <div class="fp-field">
                                <label for="al-code">Código</label>
                                <input type="text" id="al-code" name="code"
                                       placeholder="000000"
                                       autocomplete="one-time-code"
                                       inputmode="numeric"
                                       maxlength="6" required>
                            </div>
                            <button type="submit" id="al-verify-btn" class="fp-submit">
                                Confirmar →
                            </button>
                            <div id="al-verify-error" class="entrar-error" hidden></div>
                        </form>
                        <div class="entrar-actions">
                            <button type="button" id="al-resend" disabled>Reenviar</button>
                            <span class="entrar-sep" aria-hidden="true">·</span>
                            <button type="button" id="al-edit-email">Editar email</button>
                        </div>
                    </div>
                </div>
                <a class="back" href="/">← voltar</a>
            </div>
        </main>
        ${siteFooter()}
    `;

    checkAuth();
    wireSignup();
}

function checkAuth(): void {
    void (async () => {
        try {
            const r = await fetch(`${CO_BASE}/api/v1/auth/me`, { credentials: "include" });
            if (r.ok) window.location.href = "/";
        } catch { /* noop */ }
    })();
}

function wireSignup(): void {
    const form = document.getElementById("al-signup") as HTMLFormElement | null;
    const codeStep = document.getElementById("al-code-step");
    const emailStep = document.getElementById("al-email-step");
    const errEl = document.getElementById("al-signup-error");
    const resendBtn = document.getElementById("al-resend") as HTMLButtonElement | null;

    let _email = "";
    let _resendCooldown: number | null = null;

    function startResendCooldown(): void {
        if (!resendBtn) return;
        let secs = 60;
        resendBtn.disabled = true;
        resendBtn.textContent = `Reenviar (${secs}s)`;
        _resendCooldown = setInterval(() => {
            secs -= 1;
            if (secs <= 0) {
                if (_resendCooldown !== null) clearInterval(_resendCooldown);
                resendBtn.disabled = false;
                resendBtn.textContent = "Reenviar";
            } else {
                resendBtn.textContent = `Reenviar (${secs}s)`;
            }
        }, 1000);
    }

    form?.addEventListener("submit", async (e: Event) => {
        e.preventDefault();
        if (!errEl) return;
        errEl.hidden = true;

        const emailInput = (form as HTMLFormElement & { email: HTMLInputElement }).email;
        const email = emailInput.value.trim();
        if (!email.includes("@")) {
            errEl.textContent = "Email inválido";
            errEl.hidden = false;
            return;
        }

        const btn = form.querySelector<HTMLButtonElement>("button[type=submit]");
        if (!btn) return;
        btn.disabled = true;
        btn.textContent = "Enviando…";

        try {
            const r = await fetch(`${CO_BASE}/api/v1/auth/onboard-with-email`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, origin: "artelonga" }),
            });
            if (!r.ok) throw new Error("send failed");
            _email = email;
            track("signup_request", {});
            if (emailStep) emailStep.hidden = true;
            if (codeStep) codeStep.hidden = false;
            const codeTarget = document.getElementById("al-code-target");
            if (codeTarget) codeTarget.textContent = email;
            const codeInput = document.getElementById("al-code");
            if (codeInput instanceof HTMLInputElement) codeInput.focus();
            startResendCooldown();
        } catch {
            errEl.textContent = "Não foi possível enviar. Tente novamente.";
            errEl.hidden = false;
        } finally {
            btn.disabled = false;
            btn.textContent = "Continuar →";
        }
    });

    document.getElementById("al-verify-form")?.addEventListener("submit", async (e: Event) => {
        e.preventDefault();
        const codeInput = document.getElementById("al-code") as HTMLInputElement | null;
        if (!codeInput) return;
        const code = codeInput.value.trim();
        if (code.length !== 6) return;

        const btn = document.getElementById("al-verify-btn") as HTMLButtonElement | null;
        if (!btn) return;
        btn.disabled = true;
        btn.textContent = "Verificando…";

        try {
            const r = await fetch(`${CO_BASE}/api/v1/auth/onboard-with-email/verify`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: _email, code }),
            });
            if (!r.ok) throw new Error("verify failed");
            track("signup_verify_success", {});
            window.location.href = "/";
        } catch {
            track("signup_verify_failed", {});
            const errEl2 = document.getElementById("al-verify-error");
            if (errEl2) {
                errEl2.textContent = "Código inválido ou expirado.";
                errEl2.hidden = false;
            }
        } finally {
            btn.disabled = false;
            btn.textContent = "Confirmar →";
        }
    });

    document.getElementById("al-edit-email")?.addEventListener("click", () => {
        if (codeStep) codeStep.hidden = true;
        if (emailStep) emailStep.hidden = false;
    });

    resendBtn?.addEventListener("click", () => {
        if (resendBtn.disabled) return;
        form?.dispatchEvent(new Event("submit"));
    });

    document.getElementById("al-google-btn")?.addEventListener("click", () => {
        track("signup_google_start", {});
        const returnTo = encodeURIComponent(window.location.origin + "/");
        window.location.href = `${CO_BASE}/api/v1/auth/google/start?origin=artelonga&return_to=${returnTo}`;
    });
}

function track(name: string, props?: Record<string, unknown>): void {
    if (typeof window.AL_track === "function") window.AL_track(name, props ?? {});
}
