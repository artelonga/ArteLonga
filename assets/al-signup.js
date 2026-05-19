(function() {
  "use strict";
  var _a, _b, _c;
  const CO_BASE = "https://co.artelonga.com.br";
  function _track(name, props) {
    if (typeof window.AL_track === "function") window.AL_track(name, props ?? {});
  }
  const form = document.getElementById("al-signup");
  const codeStep = document.getElementById("al-code-step");
  const emailStep = document.getElementById("al-email-step");
  const errEl = document.getElementById("al-signup-error");
  const resendBtn = document.getElementById("al-resend");
  let _email = "";
  let _resendCooldown = null;
  form == null ? void 0 : form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!errEl) return;
    errEl.hidden = true;
    const emailInput = form.email;
    const email = emailInput.value.trim();
    if (!email.includes("@")) {
      errEl.textContent = "Email inválido";
      errEl.hidden = false;
      return;
    }
    const btn = form.querySelector("button[type=submit]");
    if (!btn) return;
    btn.disabled = true;
    btn.textContent = "Enviando…";
    try {
      const r = await fetch(`${CO_BASE}/api/v1/auth/onboard-with-email`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, origin: "artelonga" })
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
  (_a = document.getElementById("al-verify-form")) == null ? void 0 : _a.addEventListener("submit", async (e) => {
    e.preventDefault();
    const codeInput = document.getElementById("al-code");
    if (!codeInput) return;
    const code = codeInput.value.trim();
    if (code.length !== 6) return;
    const btn = document.getElementById("al-verify-btn");
    if (!btn) return;
    btn.disabled = true;
    btn.textContent = "Verificando…";
    try {
      const r = await fetch(`${CO_BASE}/api/v1/auth/onboard-with-email/verify`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: _email, code })
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
  function startResendCooldown() {
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
    }, 1e3);
  }
  (_b = document.getElementById("al-edit-email")) == null ? void 0 : _b.addEventListener("click", () => {
    if (codeStep) codeStep.hidden = true;
    if (emailStep) emailStep.hidden = false;
  });
  resendBtn == null ? void 0 : resendBtn.addEventListener("click", () => {
    if (resendBtn.disabled) return;
    form == null ? void 0 : form.dispatchEvent(new Event("submit"));
  });
  (_c = document.getElementById("al-google-btn")) == null ? void 0 : _c.addEventListener("click", () => {
    _track("signup_google_start", {});
    const returnTo = encodeURIComponent(window.location.origin + "/");
    window.location.href = `${CO_BASE}/api/v1/auth/google/start?origin=artelonga&return_to=${returnTo}`;
  });
  void (async () => {
    try {
      const r = await fetch(`${CO_BASE}/api/v1/auth/me`, { credentials: "include" });
      if (r.ok) window.location.href = "/";
    } catch {
    }
  })();
})();
