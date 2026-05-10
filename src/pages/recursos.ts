import { esc } from "../lib/esc";
import { siteHeader } from "../components/SiteHeader";
import { siteFooter } from "../components/SiteFooter";
import type { FinanceCostItem, FinanceRecurrentItem, FinanceRampaItem, FinanceProjectItem, FinanceProBonoItem } from "../types";

export function render(): void {
    const AL = window.AL;
    const f = AL.finances;
    const fmt = (n: number): string =>
        n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
    const short = (n: number): string =>
        n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
    const nomeOf = (h: string): string => {
        const p = AL.get(h);
        return p ? p.nome : h;
    };

    const solucoesLinks = (handles: string[] | undefined): string => {
        if (!handles?.length) return "";
        const links = handles
            .map(h => {
                const s = AL.get(h);
                if (!s) return null;
                return `<a class="fin-sol-link" href="/solucoes/#${esc(s.handle)}">${esc(s.nome)}</a>`;
            })
            .filter((l): l is string => l !== null);
        return links.length ? `<div class="fin-solucoes">exemplo em: ${links.join(" · ")}</div>` : "";
    };

    const totalCustos = f.custos.reduce((a, c) => a + c.value, 0);
    const custosHtml = f.custos.map((c: FinanceCostItem) => {
        const breakdownHtml = c.breakdown
            ? `<div class="fin-sub-breakdown">${c.breakdown
                  .map(
                      b =>
                          `<div class="sub-line"><span>${esc(b.label)}${b.handle ? ` <a class="sub-link" href="/${esc(b.handle)}/">↗</a>` : ""}</span><span>${fmt(b.value)}</span></div>`
                  )
                  .join("")}</div>`
            : "";
        const detailHtml = c.detail ? `<div class="fin-detail">${esc(c.detail)}</div>` : "";
        return `<li class="fin-item">
            <div class="fin-head">
                <div class="fin-label">${esc(c.label)}</div>
                <div class="fin-value">${fmt(c.value)}</div>
            </div>
            ${detailHtml}${breakdownHtml}
        </li>`;
    }).join("");

    const recorrenteMensalTotal = f.receita.recorrenteMensal.reduce((a, r) => a + r.mensal, 0);
    const recorrenteQ2 = recorrenteMensalTotal * 3;
    const rampaQ2 = f.receita.rampa.reduce((a, r) => a + r.meses.reduce((b, m) => b + m.value, 0), 0);
    const projetosQ2 = f.receita.projetos.reduce((a, p) => a + p.unitValue * p.unidades, 0);
    const totalReceitaQ2 = recorrenteQ2 + rampaQ2 + projetosQ2;
    const percentMeta = Math.round((totalReceitaQ2 / f.metaQ2) * 100);
    const gap = f.metaQ2 - totalReceitaQ2;

    const recorrenteHtml = f.receita.recorrenteMensal
        .map((r: FinanceRecurrentItem) => `
        <li class="fin-item">
            <div class="fin-head">
                <div class="fin-label">${esc(r.label)}${r.client ? ` <span class="client-tag">cliente: ${esc(r.client)}</span>` : ""}</div>
                <div class="fin-value">${fmt(r.mensal)}<span class="fin-unit">/mês</span></div>
            </div>
            <div class="fin-detail">${esc(r.detail)} · por <a href="/${esc(r.responsavel)}/">${esc(nomeOf(r.responsavel))}</a></div>
            ${solucoesLinks(r.solucoes)}
        </li>
    `).join("");

    const rampaHtml = f.receita.rampa
        .map((r: FinanceRampaItem) => `
        <li class="fin-item">
            <div class="fin-head">
                <div class="fin-label">${esc(r.label)}${r.client ? ` <span class="client-tag">cliente: ${esc(r.client)}</span>` : ""}</div>
                <div class="fin-value">${fmt(r.meses.reduce((a, m) => a + m.value, 0))}<span class="fin-unit"> · Q2</span></div>
            </div>
            <div class="fin-detail">${esc(r.detail)} · por <a href="/${esc(r.responsavel)}/">${esc(nomeOf(r.responsavel))}</a></div>
            <div class="fin-sub-breakdown">${r.meses.map(m =>
                `<div class="sub-line"><span>${esc(m.mes)}</span><span>${fmt(m.value)}</span></div>`
            ).join("")}</div>
            ${solucoesLinks(r.solucoes)}
        </li>
    `).join("");

    const projetosHtml = f.receita.projetos
        .map((p: FinanceProjectItem) => {
            const total = p.unitValue * p.unidades;
            const byHtml = p.responsavel
                ? ` · por <a href="/${esc(p.responsavel)}/">${esc(nomeOf(p.responsavel))}</a>`
                : "";
            return `<li class="fin-item">
                <div class="fin-head">
                    <div class="fin-label">${esc(p.label)}</div>
                    <div class="fin-value">${fmt(total)}</div>
                </div>
                <div class="fin-detail">${esc(p.detail)}${byHtml}</div>
                ${solucoesLinks(p.solucoes)}
            </li>`;
        }).join("");

    const proBonoHtml = f.receita.proBono
        .map((p: FinanceProBonoItem) => `
        <li class="fin-item pro-bono">
            <div class="fin-head">
                <div class="fin-label">${esc(p.label)}</div>
                <div class="fin-value pro-bono-tag">pro-bono</div>
            </div>
            <div class="fin-detail">${esc(p.detail)} · por <a href="/${esc(p.responsavel)}/">${esc(nomeOf(p.responsavel))}</a></div>
            ${solucoesLinks(p.solucoes)}
        </li>
    `).join("");

    document.body.innerHTML = `
        ${siteHeader()}
        <main class="main">
            <h1 class="page-title">Recursos</h1>
            <div class="page-subtitle">Transparência financeira · receita, custos e meta trimestral · ${esc(f.quarter)}</div>

            <p class="intro">Como a rede se sustenta. Em ${esc(f.quarter)} projetamos <strong>${fmt(totalReceitaQ2)}</strong> de receita — suficiente para cobrir os <strong>${fmt(totalCustos * 3)}</strong> de custos operacionais e dedicar o trimestre a teste, validação e melhoria. Esta página é pública e atualizada em tempo real.</p>

            <div class="section-header"><h2>Resumo</h2><span class="label">${esc(f.quarter)}</span></div>
            <div class="fin-goal-grid fin-goal-grid-3">
                <div class="fin-goal">
                    <div class="fin-goal-label">Custos · ${esc(f.quarter)}</div>
                    <div class="fin-goal-value">${short(totalCustos * 3)}</div>
                    <div class="fin-goal-note">${short(totalCustos)}/mês × 3</div>
                </div>
                <div class="fin-goal">
                    <div class="fin-goal-label">Meta · ${esc(f.quarter)}</div>
                    <div class="fin-goal-value">${short(f.metaQ2)}</div>
                    <div class="fin-goal-note">receita objetivo</div>
                </div>
                <div class="fin-goal highlighted">
                    <div class="fin-goal-label">Receita projetada</div>
                    <div class="fin-goal-value">${short(totalReceitaQ2)}</div>
                    <div class="fin-goal-note">${percentMeta}% da meta · gap ${gap > 0 ? short(gap) : "zero"}</div>
                </div>
            </div>

            <div class="fin-breakdown-summary">
                <div class="sum-line"><span>Recorrente × 3</span><span>${fmt(recorrenteQ2)}</span></div>
                <div class="sum-line"><span>Rampa (Hedix MM)</span><span>${fmt(rampaQ2)}</span></div>
                <div class="sum-line"><span>Projetos</span><span>${fmt(projetosQ2)}</span></div>
                <div class="sum-line sum-total"><span>Total projetado</span><span>${fmt(totalReceitaQ2)}</span></div>
            </div>

            <div class="section-header"><h2>Gastos recorrentes</h2><span class="label">o que mantemos por mês</span></div>
            <p class="intro-short">Custo fixo da operação. Pro labore dos sócios, contabilidade, coworking e infraestrutura.</p>
            <ul class="fin-list">${custosHtml}</ul>
            <div class="fin-total">
                <span class="fin-total-label">Total mensal</span>
                <span class="fin-total-value">${fmt(totalCustos)}</span>
            </div>
            <div class="fin-total-secondary">
                <span>× 3 · ${esc(f.quarter)}</span>
                <span>${fmt(totalCustos * 3)}</span>
            </div>

            <div class="section-header"><h2>Receita garantida</h2><span class="label">recorrente · mensal</span></div>
            <p class="intro-short">Contratos fixos que entram todo mês. Baseline previsível.</p>
            <ul class="fin-list">${recorrenteHtml}</ul>
            <div class="fin-subtotal">
                <span>Subtotal recorrente · mensal</span>
                <span>${fmt(recorrenteMensalTotal)}</span>
            </div>
            <div class="fin-subtotal">
                <span>Subtotal recorrente · ${esc(f.quarter)} (× 3)</span>
                <span>${fmt(recorrenteQ2)}</span>
            </div>

            <div class="section-header"><h2>Receita em rampa</h2><span class="label">crescimento mês a mês</span></div>
            <p class="intro-short">Receita ramping up — começa pequena e cresce a cada mês.</p>
            <ul class="fin-list">${rampaHtml}</ul>
            <div class="fin-subtotal">
                <span>Subtotal rampa · ${esc(f.quarter)}</span>
                <span>${fmt(rampaQ2)}</span>
            </div>

            <div class="section-header"><h2>Receita pontual</h2><span class="label">projetos · one-off no trimestre</span></div>
            <p class="intro-short">Projetos avulsos. Acontecem uma vez no trimestre.</p>
            <ul class="fin-list">${projetosHtml}</ul>
            <div class="fin-subtotal">
                <span>Subtotal projetos · ${esc(f.quarter)}</span>
                <span>${fmt(projetosQ2)}</span>
            </div>

            <div class="section-header"><h2>Pro-bono</h2><span class="label">impacto · não entra na receita</span></div>
            <p class="intro-short">Trabalho que fazemos sem cobrar. Parte do impacto social, ambiental e cultural.</p>
            <ul class="fin-list">${proBonoHtml}</ul>

            <p class="fin-footnote">
                Consulte também <a href="/sobre/">Sobre</a> (dados cadastrais), <a href="/proximos-passos/">Próximos Passos</a> (metas) e <a href="/servicos/">Serviços</a> (catálogo).
            </p>

            <p class="proximos-link-bottom">
                <a href="/proximos-passos/">Próximos Passos →</a>
            </p>

            <a class="back" href="/">← voltar</a>
        </main>
        ${siteFooter()}
    `;
}
