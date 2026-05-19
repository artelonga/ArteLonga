import { esc } from "../lib/esc";
import { siteHeader } from "../components/SiteHeader";
import { siteFooter } from "../components/SiteFooter";
import type { Lead } from "../types";

const CO_LEADS_URL = "https://co.artelonga.com.br/api/v1/leads";
const REDE_EMAIL = "rede@artelonga.com.br";

export function render(): void {
    const params = new URLSearchParams(location.search);
    const servico  = (params.get("servico")  ?? "").trim();
    const parceiro = (params.get("parceiro") ?? "").trim();

    const ctxHtml = servico
        ? `<div class="ct-context" id="ct-context">
                <strong id="ct-context-title">Sobre ${esc(servico)}</strong>${parceiro ? `<span id="ct-context-detail"> · com ${esc(parceiro)}</span>` : ""}
           </div>`
        : `<div class="ct-context is-hidden" id="ct-context"></div>`;

    const defaultPlaceholder = servico
        ? `Descreva o que precisa de ${esc(servico)}…`
        : "Descreva a demanda, contexto, prazo se houver…";

    document.body.innerHTML = `
        ${siteHeader()}
        <main class="main">
            <div class="ct-wrap">
                <h1 class="ct-h1">Descreva o seu problema.</h1>
                <p class="ct-tagline">Encontramos a solução.</p>
                ${ctxHtml}
                <form class="ct-form" id="contato-form" novalidate>
                    <input type="hidden" id="ct-servico-hidden" name="servico_ref" value="${esc(servico)}">
                    <input type="hidden" id="ct-parceiro-hidden" name="parceiro_ref" value="${esc(parceiro)}">
                    <div class="ct-field">
                        <label for="ct-nome">Nome</label>
                        <input type="text" id="ct-nome" name="nome" required autocomplete="name">
                    </div>
                    <div class="ct-field">
                        <label for="ct-precisa">O que você precisa</label>
                        <textarea id="ct-precisa" name="precisa" placeholder="${defaultPlaceholder}" required></textarea>
                    </div>
                    <div class="ct-field">
                        <label>Onde acontece</label>
                        <div class="ct-modo-pills" role="radiogroup" aria-label="Modo">
                            <label><input type="radio" name="modo" value="fisico" checked><span>Físico</span></label>
                            <label><input type="radio" name="modo" value="digital"><span>Digital</span></label>
                        </div>
                        <div class="ct-loc-grid" id="ct-loc-grid">
                            <input type="text" id="ct-estado" name="estado" placeholder="Estado" autocomplete="address-level1">
                            <input type="text" id="ct-cidade" name="cidade" placeholder="Cidade" autocomplete="address-level2">
                            <input type="text" id="ct-bairro" name="bairro" placeholder="Bairro" autocomplete="address-level3">
                        </div>
                    </div>
                    <div class="ct-field">
                        <label>Como prefere ser contatado</label>
                        <div class="ct-radio-group">
                            <label><input type="radio" name="canal" value="email" required><span>Email</span></label>
                            <label><input type="radio" name="canal" value="whatsapp" required><span>WhatsApp</span></label>
                            <label><input type="radio" name="canal" value="outro" required><span>Outro</span></label>
                        </div>
                    </div>
                    <div class="ct-field">
                        <label for="ct-contato">Contato</label>
                        <input type="text" id="ct-contato" name="contato" placeholder="Email, WhatsApp ou link" required>
                    </div>
                    <p class="ct-privacy">Seus dados são armazenados em servidor seguro por até 24 meses. Direitos LGPD: acesso, correção ou deleção em <a href="mailto:${esc(REDE_EMAIL)}">${esc(REDE_EMAIL)}</a>.</p>
                    <button type="submit" class="ct-submit">Enviar →</button>
                    <div class="ct-fallback" id="ct-fallback">
                        Falha na conexão. <a href="#" id="ct-fallback-link">Clique aqui para enviar por email</a>.
                    </div>
                    <div class="ct-success" id="ct-success">
                        <strong>Recebemos.</strong> Em até 48h alguém da rede entra em contato pelo canal que você passou.
                    </div>
                </form>
                <a class="back" href="/">← voltar</a>
            </div>
        </main>
        ${siteFooter()}
    `;

    wireForm(servico, parceiro);
}

function wireForm(servico: string, parceiro: string): void {
    const locGrid = document.getElementById("ct-loc-grid");
    document.querySelectorAll<HTMLInputElement>('input[name="modo"]').forEach(r => {
        r.addEventListener("change", () => {
            if (!locGrid) return;
            locGrid.classList.toggle("is-hidden", r.value === "digital" && r.checked);
        });
    });

    const form = document.getElementById("contato-form") as HTMLFormElement | null;
    const successEl = document.getElementById("ct-success");
    const fallbackDiv = document.getElementById("ct-fallback");
    const fallbackLink = document.getElementById("ct-fallback-link") as HTMLAnchorElement | null;
    if (!form) return;

    form.addEventListener("submit", (e: Event) => {
        e.preventDefault();
        void submitForm(form, servico, parceiro, successEl, fallbackDiv, fallbackLink);
    });
}

async function submitForm(
    form: HTMLFormElement,
    servico: string,
    parceiro: string,
    successEl: HTMLElement | null,
    fallbackDiv: HTMLElement | null,
    fallbackLink: HTMLAnchorElement | null,
): Promise<void> {
    const d = new FormData(form);
    const get = (k: string): string => ((d.get(k) as string | null) ?? "").trim();
    const nome        = get("nome");
    const precisaVal  = get("precisa");
    const canal       = get("canal");
    const contato     = get("contato");
    if (!nome || !precisaVal || !canal || !contato) {
        form.reportValidity();
        return;
    }

    const submit = form.querySelector<HTMLButtonElement>(".ct-submit");
    if (submit) { submit.disabled = true; submit.textContent = "Enviando…"; }
    if (fallbackDiv) fallbackDiv.classList.remove("on");

    const canalLabel = canal === "email" ? "Email" : canal === "whatsapp" ? "WhatsApp" : "Outro";
    const modo = get("modo") || "fisico";
    const localLabel = modo === "digital"
        ? "Digital"
        : `Físico · ${get("bairro") || "—"} · ${get("cidade") || "—"} · ${get("estado") || "—"}`;

    const mensagem = [
        `Demanda: ${precisaVal}`,
        `Local: ${localLabel}`,
        `Canal preferido: ${canalLabel}`,
        `Contato: ${contato}`,
    ].join("\n");

    const payload: Lead = {
        nome: nome || null,
        email: canal === "email" ? contato : null,
        telefone: canal === "whatsapp" ? contato : null,
        mensagem,
        servico_titulo: servico || null,
        parceiro_handle: parceiro || null,
    };

    try {
        const r = await fetch(CO_LEADS_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            credentials: "omit",
            mode: "cors",
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        window.AL_track?.("lead_submit", { servico: servico || null, parceiro: parceiro || null, channel: canal });
        if (submit) submit.textContent = "Enviado ✓";
        if (successEl) successEl.classList.add("on");
    } catch (err) {
        window.AL_track?.("lead_submit_failed", { servico: servico || null, parceiro: parceiro || null, channel: canal });
        console.error("lead submit failed:", err);
        if (submit) { submit.textContent = "Falhou — tente de novo"; submit.disabled = false; }
        if (fallbackLink) fallbackLink.href = buildMailto(servico, parceiro, nome, precisaVal, localLabel, canalLabel, contato);
        if (fallbackDiv) fallbackDiv.classList.add("on");
    }
}

function buildMailto(
    servico: string,
    parceiro: string,
    nome: string,
    precisa: string,
    localLabel: string,
    canalLabel: string,
    contato: string,
): string {
    const subject = servico ? `Demanda · ${servico} · ${nome}` : `Demanda · ${nome}`;
    const body = [
        `Nome: ${nome}`,
        servico  ? `Serviço de interesse: ${servico}`  : "",
        parceiro ? `Parceiro de interesse: ${parceiro}` : "",
        `Demanda: ${precisa}`,
        `Local: ${localLabel}`,
        `Canal preferido: ${canalLabel}`,
        `Contato: ${contato}`,
    ].filter(Boolean).join("\n");
    return `mailto:${REDE_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
