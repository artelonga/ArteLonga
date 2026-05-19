const CO_BASE = "https://co.artelonga.com.br";

function _track(name: string, props?: Record<string, unknown>): void {
    if (typeof window.AL_track === "function") window.AL_track(name, props ?? {});
}

const form = document.getElementById("al-signup") as HTMLFormElement | null;
const codeStep = document.getElementById("al-code-step");
const emailStep = document.getElementById("al-email-step");
const errEl = document.getElementById("al-signup-error");
const resendBtn = document.getElementById("al-resend") as HTMLButtonElement | null;

let _email = "";
let _resendCooldown: number | null = null;

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
        _track("signup_request", {});
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
        _track("signup_verify_success", {});
        window.location.href = "/";
    } catch {
        _track("signup_verify_failed", {});
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

function startResendCooldown(): void {
    if (!resendBtn) return;
    let secs = 60;
    resendBtn.disabled = true;
    resendBtn.textContent = `Reenviar (${secs}s)`;
    _resendCooldown = setInterval(() => {
        secs -= 1;
        if (secs <= 0) {
            if (_resendCooldown !== null) clearInterval(_resendCooldown);
            if (resendBtn) {
                resendBtn.disabled = false;
                resendBtn.textContent = "Reenviar";
            }
        } else {
            if (resendBtn) resendBtn.textContent = `Reenviar (${secs}s)`;
        }
    }, 1000);
}

document.getElementById("al-edit-email")?.addEventListener("click", () => {
    if (codeStep) codeStep.hidden = true;
    if (emailStep) emailStep.hidden = false;
});

resendBtn?.addEventListener("click", () => {
    if (resendBtn.disabled) return;
    form?.dispatchEvent(new Event("submit"));
});

// Google sign-in button
document.getElementById("al-google-btn")?.addEventListener("click", () => {
    _track("signup_google_start", {});
    const returnTo = encodeURIComponent(window.location.origin + "/");
    window.location.href = `${CO_BASE}/api/v1/auth/google/start?origin=artelonga&return_to=${returnTo}`;
});

// On page load, check if already signed in.
void (async () => {
    try {
        const r = await fetch(`${CO_BASE}/api/v1/auth/me`, { credentials: "include" });
        if (r.ok) window.location.href = "/";
    } catch { /* noop */ }
})();
