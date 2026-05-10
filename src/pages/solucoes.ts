import { esc } from "../lib/esc";
import { siteHeader } from "../components/SiteHeader";
import { ctaLead, modalContact, wireModal } from "../lib/ui";
import type { Solution } from "../types";

export function render(): void {
    const AL = window.AL;

    const renderRow = (s: Solution): string => {
        const internal = s.internalLink !== false && (s.url ?? "").startsWith("/");
        const urlAttrs = internal ? "" : ` target="_blank" rel="noopener"`;
        const meta = s.urlLabel
            ? `<span class="universo-meta">${esc(s.urlLabel)}</span>`
            : "";
        return `<li class="universo-row">
            <a class="universo-link" href="${esc(s.url ?? "#")}"${urlAttrs}>
                <span class="universo-nome">${esc(s.nome)}</span>
                <span class="universo-objetivo">${esc(s.tagline ?? "")}</span>
                ${meta}
                <span class="universo-arrow">→</span>
            </a>
        </li>`;
    };

    const ativos = AL.solutions.filter(s => s.universo && s.lifecycle === "active");
    const futuros = AL.solutions.filter(s => s.universo && s.lifecycle === "futuro");
    const parcerias = AL.solutions.filter(s => !s.universo);

    const sectionHtml = (title: string, list: Solution[]): string =>
        list.length
            ? `<div class="section-header"><h2>${esc(title)}</h2></div>
               <ul class="universos-catalog">${list.map(renderRow).join("")}</ul>`
            : "";

    document.body.innerHTML = `
        ${siteHeader()}
        <main class="main">
            <h1 class="page-title">Soluções</h1>
            <div class="page-subtitle">Arte Longa</div>

            ${sectionHtml("Ativos", ativos)}
            ${sectionHtml("Futuro", futuros)}
            ${sectionHtml("Parcerias", parcerias)}

            ${universosDiagram()}

            ${ctaLead({ title: "Construa um Universo", body: "Da ideia ao lançamento.", id: "solucoes" }, "Compartilhe →")}

            <a class="back" href="/">← voltar</a>
        </main>
        ${modalContact("contact-modal", "")}
    `;

    wireModal("contact-modal", '[data-cta="solucoes"]');
}

function universosDiagram(): string {
    return `<section class="universos-diagram-section">
        <h2 class="solucoes-section-title">Arquitetura</h2>
        <p class="intro universos-diagram-intro">Uma identidade, vários Universos conectados em tempo real.</p>
        <svg class="universos-diagram" viewBox="0 0 720 340" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Você → identidade única → Universos conectados em tempo real">

          <!-- VOCÊ -->
          <g transform="translate(60,170)">
            <circle r="22" fill="#fff" stroke="#222" stroke-width="2"/>
            <circle cx="-7" cy="-4" r="2.2" fill="#222"/>
            <circle cx="7"  cy="-4" r="2.2" fill="#222"/>
            <path d="M -9 6 Q 0 15 9 6" fill="none" stroke="#222" stroke-width="2" stroke-linecap="round"/>
            <text y="48" text-anchor="middle" font-size="11" fill="#666" letter-spacing="0.1em">VOCÊ</text>
          </g>

          <line x1="84" y1="170" x2="206" y2="170" stroke="#222" stroke-width="1.5"/>

          <g transform="translate(238,170)">
            <circle r="30" fill="#fff" stroke="#222" stroke-width="2"/>
            <circle cy="-8" r="7.5" fill="#222"/>
            <path d="M -13 14 C -13 4 -6 0 0 0 C 6 0 13 4 13 14 Z" fill="#222"/>
            <text y="55" text-anchor="middle" font-size="11" fill="#666" letter-spacing="0.1em">IDENTIDADE</text>
          </g>

          <line x1="268" y1="170" x2="440" y2="60"  stroke="#222" stroke-width="1" opacity="0.45"/>
          <line x1="268" y1="170" x2="520" y2="120" stroke="#222" stroke-width="1" opacity="0.45"/>
          <line x1="268" y1="170" x2="560" y2="200" stroke="#222" stroke-width="1" opacity="0.45"/>
          <line x1="268" y1="170" x2="520" y2="260" stroke="#222" stroke-width="1" opacity="0.45"/>
          <line x1="268" y1="170" x2="440" y2="290" stroke="#222" stroke-width="1" opacity="0.45"/>

          <g class="ud-mesh">
            <line class="ud-pulse" x1="440" y1="60"  x2="520" y2="120" stroke="#888" stroke-width="1"/>
            <line class="ud-pulse" x1="520" y1="120" x2="560" y2="200" stroke="#888" stroke-width="1"/>
            <line class="ud-pulse" x1="560" y1="200" x2="520" y2="260" stroke="#888" stroke-width="1"/>
            <line class="ud-pulse" x1="520" y1="260" x2="440" y2="290" stroke="#888" stroke-width="1"/>
            <line class="ud-pulse" x1="440" y1="60"  x2="440" y2="290" stroke="#888" stroke-width="1"/>
            <line class="ud-pulse" x1="440" y1="60"  x2="560" y2="200" stroke="#888" stroke-width="1"/>
            <line class="ud-pulse" x1="440" y1="290" x2="560" y2="200" stroke="#888" stroke-width="1"/>
            <line class="ud-pulse" x1="520" y1="120" x2="520" y2="260" stroke="#888" stroke-width="1"/>
          </g>

          <circle cx="440" cy="60"  r="22" fill="#fff" stroke="#222" stroke-width="1.5"/>
          <circle cx="520" cy="120" r="22" fill="#fff" stroke="#222" stroke-width="1.5"/>
          <circle cx="560" cy="200" r="22" fill="#fff" stroke="#222" stroke-width="1.5"/>
          <circle cx="520" cy="260" r="22" fill="#fff" stroke="#222" stroke-width="1.5"/>
          <circle cx="440" cy="290" r="22" fill="#fff" stroke="#222" stroke-width="1.5"/>

          <text x="500" y="325" text-anchor="middle" font-size="11" fill="#666" letter-spacing="0.1em">UNIVERSOS · CONEXÃO EM TEMPO REAL</text>
        </svg>
    </section>`;
}
