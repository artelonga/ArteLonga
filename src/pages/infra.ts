import { esc } from "../lib/esc";
import { siteHeader } from "../components/SiteHeader";
import { siteFooter } from "../components/SiteFooter";
import { setPageSEO } from "../lib/seo";

// /infra/ — a infraestrutura da rede: o que está no ar, preço por caso de uso,
// o fluxo do CONTATO à ESCALA, e quando trocar de serviço (estudo AWS).
//
// Dados curados (a página é estática em GitHub Pages e não alcança as fontes em
// runtime — os números abaixo vêm de arquivos reais, não inventados):
//   • Inventário Fly + custo:  /Users/artelonga/projects/infra/README.md
//   • Domínios/superfícies:    ArteLonga/deploy/domains.yaml
//   • Funil contato→escala:    infra/data/funnel_stages.csv + onboarding-dashboard.md
//   • Custo infra (R$/mês):    ArteLonga/recursos/finances.yaml (key: infra)
//   • Preço por caso de uso:   solucoes/co/solution.yaml, solucoes/artelonga/solution.yaml
//   • Estudo de escala (AWS):  https://artelonga.com.br/yuri/aws/ (PT) · /yuri/aws/en/ (EN)

// ── Custo infra mensal (finances.yaml → custos[key=infra]) ───────────────────
const INFRA_COST = { value: 2000, currency: "BRL", label: "Armazenamento e computação" } as const;

// ── Faixa de preço por caso de uso (solution.yaml) ───────────────────────────
interface PriceBand { faixa: string; titulo: string; desc: string; exemplo: string; }
const PRICE_BANDS: PriceBand[] = [
    {
        faixa: "≈ US$0/mês",
        titulo: "Site ocioso",
        desc: "Subdomínio que desliga sozinho quando ocioso e só consome ao receber tráfego.",
        exemplo: "Retro Umarizal — site e cardápio em domínio próprio, sem mensalidade de plataforma.",
    },
    {
        faixa: "~US$4/mês",
        titulo: "Rede compartilhada",
        desc: "A rede inteira do co roda numa máquina compartilhada. Custo marginal por novo site ≈ zero.",
        exemplo: "co — site, quadro e wiki de cada parceiro num lugar só, com sincronização em tempo real.",
    },
    {
        faixa: "~US$150/mês",
        titulo: "Dedicado · alta demanda",
        desc: "Quando um caso de uso cresce além da computação compartilhada, migra pra um serviço dedicado.",
        exemplo: "Plataforma de dados em tempo real na AWS — repositório de dados sobre S3, custo estimável por cliente.",
    },
];

// ── No ar hoje (README.md §2 inventário + §9 domínios + domains.yaml) ─────────
interface Deploy {
    app: string;
    serve: string;
    runtime: string;
    vm: string;
    estado: "running" | "parked" | "staging";
    host: string;
    dominio?: string;
}
const DEPLOYS: Deploy[] = [
    { app: "co-artelonga", serve: "co — sites (site, quadro e wiki)", runtime: "Rust · Axum", vm: "shared-cpu-1x · 512 MB", estado: "running", host: "Fly · gru", dominio: "co.artelonga.com.br" },
    { app: "yggdrasil-artelonga", serve: "Yggdrasil — mundos digitais 2D", runtime: "Rust · Axum", vm: "shared-cpu-1x · 512 MB", estado: "running", host: "Fly · gru", dominio: "yggdrasil.artelonga.com.br" },
    { app: "artelonga-neuro", serve: "Neuro — bibliografia de neurociência", runtime: "Node 22", vm: "shared-cpu-1x · 256 MB", estado: "running", host: "Fly · gru", dominio: "neuro.artelonga.com.br" },
    { app: "artelonga-yuri", serve: "yuri — site publicado (inclui estudo AWS)", runtime: "Node · estático", vm: "shared-cpu-1x · 256 MB", estado: "running", host: "Fly · gru", dominio: "yuri.artelonga.com.br" },
    { app: "artelonga-retro", serve: "Retro Umarizal — site e cardápio (graduado)", runtime: "Node · estático", vm: "shared-cpu-1x · 256 MB", estado: "running", host: "Fly · gru", dominio: "retroumarizal.com.br" },
    { app: "quilombo-araucaria", serve: "Quilombo Araucária — plataforma comunitária", runtime: "Node · SvelteKit", vm: "shared-cpu-1x · 2048 MB", estado: "running", host: "Fly · gru", dominio: "quilomboaraucaria.org" },
    { app: "rfq", serve: "RFQ Gateway — cotações (Hedix)", runtime: "Rust · Axum", vm: "shared-cpu-1x · 256 MB", estado: "running", host: "Fly · gru", dominio: "rfq.artelonga.com.br" },
    { app: "artelonga.com.br", serve: "Site público (este) — conteúdo da rede", runtime: "estático", vm: "—", estado: "running", host: "GitHub Pages" },
];

// ── Fluxo CONTATO → ESCALA (funnel_stages.csv e0–e20 + onboarding-dashboard.md) ─
interface PipelineStage {
    num: string;
    nome: string;
    eventos: string;
    owner: string;
    marca?: "infra" | "scale";
    nota: string;
}
const PIPELINE: PipelineStage[] = [
    { num: "①", nome: "Aquisição", eventos: "e0–e2 · envio → entrega → abertura", owner: "Marketing", nota: "Abertura observada 40,3% (n=77, Wilson)." },
    { num: "②", nome: "Engajamento", eventos: "e3–e6 · clique → página → cadastro", owner: "Crescimento / Produto", nota: "Visita ao painel e início de cadastro." },
    { num: "③", nome: "Monetização", eventos: "e7–e8 · plano → pagamento", owner: "Receita / Finanças", nota: "Escolha de plano e autorização de pagamento." },
    { num: "④", nome: "Criação (Horizons)", eventos: "e9–e11 · pedido → app → publicar", owner: "Produto", nota: "Geração do site e publicação." },
    { num: "⑤", nome: "Entrada no ar (infra)", eventos: "e12–e18 · hospedagem → domínio → DNS → HTTPS", owner: "Infra / DNS", marca: "infra", nota: "Onde a infra entra: hospedagem, domínio, DNS (propagação 0,169 s) e certificado HTTPS." },
    { num: "⑥", nome: "Ativação & retenção", eventos: "e19–e20 · ativação → renovação/cancelamento", owner: "Produto / Receita", marca: "scale", nota: "Cada site vira uma fonte de contato — escala horizontal de funis." },
];

// ── Estudo de escala (solution.yaml co §casos + onboarding §3.5) ─────────────
const AWS_STUDY = {
    urlPt: "/yuri/aws/",
    urlEn: "/yuri/aws/en/",
    metricas: [
        "−95% de custo de armazenamento (DynamoDB → S3/Parquet)",
        "varredura 157 h → 13 min",
        "~US$150/mês por cliente de alta demanda",
    ] as string[],
};

function deployRow(d: Deploy): string {
    const estadoLabel = d.estado === "running" ? "ativo" : d.estado === "staging" ? "homologação" : "estacionado";
    return `<tr>
        <td class="infra-app">${esc(d.app)}${d.dominio ? `<span class="infra-dom">${esc(d.dominio)}</span>` : ""}</td>
        <td>${esc(d.serve)}</td>
        <td>${esc(d.runtime)}</td>
        <td>${esc(d.vm)}</td>
        <td>${esc(d.host)}</td>
        <td><span class="infra-state infra-state-${esc(d.estado)}">${esc(estadoLabel)}</span></td>
    </tr>`;
}

function priceCard(p: PriceBand): string {
    return `<div class="infra-price-card">
        <div class="infra-price-faixa">${esc(p.faixa)}</div>
        <div class="infra-price-titulo">${esc(p.titulo)}</div>
        <p class="infra-price-desc">${esc(p.desc)}</p>
        <p class="infra-price-ex">${esc(p.exemplo)}</p>
    </div>`;
}

function pipelineStep(s: PipelineStage): string {
    const cls = s.marca ? ` is-${s.marca}` : "";
    const tag = s.marca === "infra" ? `<span class="infra-step-tag">infra</span>`
        : s.marca === "scale" ? `<span class="infra-step-tag is-scale">escala</span>` : "";
    return `<li class="infra-step${cls}">
        <div class="infra-step-head"><span class="infra-step-num">${esc(s.num)}</span>${tag}</div>
        <div class="infra-step-nome">${esc(s.nome)}</div>
        <div class="infra-step-ev">${esc(s.eventos)}</div>
        <div class="infra-step-owner">${esc(s.owner)}</div>
        <p class="infra-step-nota">${esc(s.nota)}</p>
    </li>`;
}

export function render(): void {
    document.title = "Infraestrutura — Arte Longa";
    setPageSEO({
        title: "Infraestrutura — Arte Longa",
        description: "A infraestrutura da rede: o que está no ar, preço por caso de uso, o fluxo do contato à escala e quando migrar pra um serviço dedicado.",
        url: "/infra/",
    });

    const costFmt = INFRA_COST.value.toLocaleString("pt-BR");

    document.body.innerHTML = `
        ${siteHeader()}
        <main class="main infra-main">
            <h1 class="infra-title">Infraestrutura</h1>
            <p class="infra-lede">A <strong>infraestrutura da rede</strong> — o que está no ar, quanto custa por caso de uso,
                e como um parceiro vai <strong>do contato à escala</strong> sobre ela. Computação em Fly (região <code>gru</code>, São Paulo),
                DNS na Hostinger, site público em GitHub Pages. Orçamento de infra: <strong>R$&nbsp;${esc(costFmt)}/mês</strong>
                (${esc(INFRA_COST.label.toLowerCase())}).</p>

            <section class="infra-section">
                <h2 class="infra-h2">No ar &amp; preço por caso de uso</h2>
                <p class="infra-section-lede">Os serviços no ar hoje e a faixa de preço de cada caso de uso —
                    de um subdomínio que dorme (≈US$0) à rede compartilhada (~US$4), até um cliente dedicado de alta demanda (~US$150).
                    O ponto-chave: <strong>o custo marginal de cada novo site na rede compartilhada ≈ zero</strong>.</p>

                <div class="infra-prices">
                    ${PRICE_BANDS.map(priceCard).join("")}
                </div>

                <div class="infra-table-wrap">
                    <table class="infra-table">
                        <thead><tr>
                            <th>App</th><th>O que serve</th><th>Tecnologia</th><th>Máquina</th><th>Onde roda</th><th>Estado</th>
                        </tr></thead>
                        <tbody>${DEPLOYS.map(deployRow).join("")}</tbody>
                    </table>
                </div>
            </section>

            <section class="infra-section">
                <h2 class="infra-h2">Fluxo: do contato à escala</h2>
                <p class="infra-section-lede">A jornada de <em>“recebeu um email”</em> a <em>“site no ar em domínio próprio sobre HTTPS”</em>,
                    modelada como 21 eventos (<code>e0</code>–<code>e20</code>) em seis estágios, cada um com um time responsável.
                    A <strong class="infra-mark-infra">infra entra na entrada no ar</strong> (⑤);
                    a <strong class="infra-mark-scale">escala</strong> acontece quando cada site vira uma nova fonte de contato (⑥).</p>
                <ol class="infra-pipeline">
                    ${PIPELINE.map(pipelineStep).join("")}
                </ol>
            </section>

            <section class="infra-section infra-scale">
                <h2 class="infra-h2">Escalabilidade · quando trocar de serviço</h2>
                <p class="infra-section-lede">Quando um caso de uso cresce além do conjunto de ferramentas compartilhado, escalamos —
                    e, no limite, migramos pra um serviço dedicado. O estudo de caso da <strong>AWS</strong> mostra
                    como e quando fazer isso.</p>
                <div class="infra-scale-box">
                    <ul class="infra-scale-metrics">
                        ${AWS_STUDY.metricas.map(m => `<li>${esc(m)}</li>`).join("")}
                    </ul>
                    <p class="infra-scale-cta">
                        <a class="infra-scale-link" href="${esc(AWS_STUDY.urlPt)}">Ler o estudo de caso AWS →</a>
                        <a class="infra-scale-link-alt" href="${esc(AWS_STUDY.urlEn)}">(English version)</a>
                    </p>
                </div>
            </section>

            <a class="back" href="/">← voltar ao início</a>
        </main>
        ${siteFooter()}
    `;
}
