import { esc } from "./esc";

const REDE_EMAIL = "rede@artelonga.com.br";

interface CtaCopy {
  title: string;
  body: string;
  id: string;
}

export function ctaLead(copy: CtaCopy, btnLabel: string): string {
  return `<div class="lead-magnet">
    <h3>${esc(copy.title)}</h3>
    <p>${esc(copy.body)}</p>
    <button type="button" class="cta-button" data-cta="${esc(copy.id)}">${esc(btnLabel)}</button>
  </div>`;
}

export function modalContact(id: string, labelText: string): string {
  const label = labelText ? `<div class="modal-servico-nome">${esc(labelText)}</div>` : "";
  return `<div class="modal-overlay" id="${id}" role="dialog" aria-modal="true">
    <div class="modal-card" style="text-align:center;">
      ${label}
      <div class="modal-contact-label">Escreva para</div>
      <div class="modal-email">${REDE_EMAIL}</div>
      <button class="modal-close" type="button">Fechar</button>
    </div>
  </div>`;
}

export function wireModal(modalId: string, triggerSelector: string): void {
  const m = document.getElementById(modalId);
  if (!m) return;
  document.querySelectorAll(triggerSelector).forEach(t => {
    t.addEventListener("click", () => m.classList.add("on"));
  });
  m.addEventListener("click", e => {
    const target = e.target as Element;
    if (target === m || target.classList.contains("modal-close")) m.classList.remove("on");
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape") m.classList.remove("on"); });
}

export function wirePopover(hostSelector: string): void {
  const getOpen = () => document.querySelectorAll<HTMLElement>(hostSelector + ".servicos-open");
  const closeAll = () => {
    getOpen().forEach(h => {
      h.classList.remove("servicos-open");
      const btn = h.querySelector(".ver-servicos-btn");
      if (btn) btn.setAttribute("aria-expanded", "false");
    });
  };
  document.querySelectorAll<HTMLElement>(hostSelector + " .ver-servicos-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const host = btn.closest<HTMLElement>(hostSelector);
      if (!host) return;
      const wasOpen = host.classList.contains("servicos-open");
      closeAll();
      if (!wasOpen) {
        host.classList.add("servicos-open");
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });
  document.addEventListener("click", e => {
    const target = e.target as Element;
    if (!target.closest(".servicos-popover") && !target.closest(".ver-servicos-btn")) {
      closeAll();
    }
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeAll();
  });
}
