const CO_BASE = 'https://co.artelonga.com.br';

function _track(name, props) {
    if (typeof window.AL_track === 'function') window.AL_track(name, props || {});
}

const form = document.getElementById('al-signup');
const codeStep = document.getElementById('al-code-step');
const emailStep = document.getElementById('al-email-step');
const errEl = document.getElementById('al-signup-error');
const resendBtn = document.getElementById('al-resend');
let _email = '';
let _resendCooldown = null;

form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    errEl.hidden = true;
    const email = form.email.value.trim();
    if (!email.includes('@')) {
        errEl.textContent = 'Email inválido';
        errEl.hidden = false;
        return;
    }
    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true;
    btn.textContent = 'Enviando…';
    try {
        const r = await fetch(`${CO_BASE}/api/v1/auth/onboard-with-email`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, origin: 'artelonga' }),
        });
        if (!r.ok) throw new Error('send failed');
        _email = email;
        _track('signup_request', {});
        emailStep.hidden = true;
        codeStep.hidden = false;
        document.getElementById('al-code-target').textContent = email;
        document.getElementById('al-code').focus();
        startResendCooldown();
    } catch (e) {
        errEl.textContent = 'Não foi possível enviar. Tente novamente.';
        errEl.hidden = false;
    } finally {
        btn.disabled = false;
        btn.textContent = 'Continuar →';
    }
});

document.getElementById('al-verify-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = document.getElementById('al-code').value.trim();
    if (code.length !== 6) return;
    const btn = document.getElementById('al-verify-btn');
    btn.disabled = true;
    btn.textContent = 'Verificando…';
    try {
        const r = await fetch(`${CO_BASE}/api/v1/auth/onboard-with-email/verify`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: _email, code }),
        });
        if (!r.ok) throw new Error('verify failed');
        _track('signup_verify_success', {});
        // Cookie now set on .artelonga.com.br — page can detect via /auth/me
        window.location.href = '/';
    } catch (e) {
        _track('signup_verify_failed', {});
        const errEl2 = document.getElementById('al-verify-error');
        errEl2.textContent = 'Código inválido ou expirado.';
        errEl2.hidden = false;
    } finally {
        btn.disabled = false;
        btn.textContent = 'Confirmar →';
    }
});

function startResendCooldown() {
    let secs = 60;
    resendBtn.disabled = true;
    resendBtn.textContent = `Reenviar (${secs}s)`;
    _resendCooldown = setInterval(() => {
        secs -= 1;
        if (secs <= 0) {
            clearInterval(_resendCooldown);
            resendBtn.disabled = false;
            resendBtn.textContent = 'Reenviar';
        } else {
            resendBtn.textContent = `Reenviar (${secs}s)`;
        }
    }, 1000);
}

document.getElementById('al-edit-email')?.addEventListener('click', () => {
    codeStep.hidden = true;
    emailStep.hidden = false;
});

resendBtn?.addEventListener('click', () => {
    if (resendBtn.disabled) return;
    // Re-submit the email step
    form.dispatchEvent(new Event('submit'));
});

// Google sign-in button
document.getElementById('al-google-btn')?.addEventListener('click', () => {
    _track('signup_google_start', {});
    const returnTo = encodeURIComponent(window.location.origin + '/');
    window.location.href =
        `${CO_BASE}/api/v1/auth/google/start?origin=artelonga&return_to=${returnTo}`;
});

// On page load, check if already signed in
(async () => {
    try {
        const r = await fetch(`${CO_BASE}/api/v1/auth/me`, { credentials: 'include' });
        if (r.ok) {
            // Already logged in — redirect to homepage
            window.location.href = '/';
        }
    } catch (_) {}
})();
