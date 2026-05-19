import { siteHeader } from "../components/SiteHeader";
import { siteFooter } from "../components/SiteFooter";

const REDE_EMAIL = "rede@artelonga.com.br";

export function render(): void {
    document.body.innerHTML = `
        ${siteHeader()}
        <main class="main">
            <div class="fp-wrap">
                <div>
                    <h1 class="fp-h1">Para parceiros.</h1>
                    <p class="fp-tagline">Te acompanhamos desde o primeiro cliente. Até onde quiser.</p>
                    <p class="fp-loc">Rede de prestadores · Brasil</p>
                </div>

                <section class="fp-how">
                    <h2>Como funciona</h2>
                    <div class="fp-how-grid">
                        <div class="fp-how-tile">
                            <div class="fp-how-num">01</div>
                            <div class="fp-how-titulo">Seu canal direto</div>
                            <div class="fp-how-desc">Cliente fala com você no seu WhatsApp e Instagram. Você decide como se comunicar.</div>
                        </div>
                        <div class="fp-how-tile">
                            <div class="fp-how-num">02</div>
                            <div class="fp-how-titulo">Cobrança flexível</div>
                            <div class="fp-how-desc">Autonomia na negociação. Tarifa-base R$ 100/h é padrão da rede; você define a sua.</div>
                        </div>
                        <div class="fp-how-tile">
                            <div class="fp-how-num">03</div>
                            <div class="fp-how-titulo">Planejem em conjunto</div>
                            <div class="fp-how-desc">Sob demanda · Semanal · Mensal. Quando o volume varia, marca como Sob consulta e fala direto com o cliente.</div>
                        </div>
                        <div class="fp-how-tile">
                            <div class="fp-how-num">04</div>
                            <div class="fp-how-titulo">Catálogo e portfolio</div>
                            <div class="fp-how-desc">Por você, para quem. Clareza durante a busca.</div>
                        </div>
                        <div class="fp-how-tile">
                            <div class="fp-how-num">05</div>
                            <div class="fp-how-titulo">Gestão Arte Longa</div>
                            <div class="fp-how-desc">Executivo, Operacional, Logística, Vendas, Contabilidade, Jurídico, Financeiro, Marketing, Design, Tecnologia, Inteligência — preço especial para parceiros.</div>
                        </div>
                    </div>
                </section>

                <form class="fp-form" id="parceiro-form" novalidate>
                    <div class="fp-form-title">Faça parte da rede</div>
                    <p class="fp-form-sub">
                        O que você faz? Entramos em contato para alinhar o seu lugar na rede.
                    </p>

                    <div class="fp-field">
                        <label for="fp-nome">Nome ou nome artístico</label>
                        <input type="text" id="fp-nome" name="nome" required autocomplete="name">
                    </div>

                    <div class="fp-field">
                        <label for="fp-servico">O que você faz</label>
                        <input type="text" id="fp-servico" name="servico" placeholder="Ex.: Piloto de drone, fotografia, psicologia clínica…" required>
                    </div>

                    <div class="fp-field">
                        <label>Onde você atende</label>
                        <div class="fp-loc-grid">
                            <input type="text" id="fp-estado" name="estado" placeholder="Estado" autocomplete="address-level1" required>
                            <input type="text" id="fp-cidade" name="cidade" placeholder="Cidade" autocomplete="address-level2" required>
                            <input type="text" id="fp-bairro" name="bairro" placeholder="Bairro" autocomplete="address-level3" required>
                        </div>
                    </div>

                    <div class="fp-field">
                        <label>Situação fiscal</label>
                        <div class="fp-radio-group">
                            <label>
                                <input type="radio" name="cnpj" value="possuo" required>
                                <span class="fp-radio-text">
                                    Possuo CNPJ
                                    <span class="fp-radio-sub">MEI · ME · etc.</span>
                                </span>
                            </label>
                            <label>
                                <input type="radio" name="cnpj" value="preciso" required>
                                <span class="fp-radio-text">
                                    Preciso de um CNPJ
                                    <span class="fp-radio-sub">A gente te orienta</span>
                                </span>
                            </label>
                        </div>
                    </div>

                    <div class="fp-field">
                        <label>Como prefere ser contatado</label>
                        <div class="fp-radio-group fp-radio-group-3">
                            <label>
                                <input type="radio" name="canal" value="email" required>
                                <span class="fp-radio-text">Email</span>
                            </label>
                            <label>
                                <input type="radio" name="canal" value="whatsapp" required>
                                <span class="fp-radio-text">WhatsApp</span>
                            </label>
                            <label>
                                <input type="radio" name="canal" value="outro" required>
                                <span class="fp-radio-text">Outro</span>
                            </label>
                        </div>
                    </div>

                    <div class="fp-field">
                        <label for="fp-contato">Contato</label>
                        <input type="text" id="fp-contato" name="contato" placeholder="Email, WhatsApp, ou link" required>
                    </div>

                    <div class="fp-field">
                        <label for="fp-msg">Algo mais que queira contar (opcional)</label>
                        <textarea id="fp-msg" name="mensagem" placeholder="Frase de apresentação, link de portfólio, agenda, qualquer coisa…"></textarea>
                    </div>

                    <button type="submit" class="fp-submit">Faça parte da rede →</button>

                    <div class="fp-success" id="fp-success">
                        <strong>Recebemos.</strong> Vamos entrar em contato pra alinhar seu lugar na rede.
                    </div>
                </form>

                <section class="fp-caminho">
                    <h2>Caminho para sociedade</h2>
                    <p class="fp-caminho-lead">
                        Quem entrega valor consistente vira sócio. Sócio tem
                        <strong>participação nos lucros</strong> e
                        <strong>poder decisório</strong> na gestão da rede,
                        além de pro-labore mensal.
                    </p>

                    <h3 class="fp-sub">Direitos do sócio</h3>
                    <dl class="fp-direitos">
                        <dt>Participação nos lucros</dt>
                        <dd>Distribuída proporcionalmente entre sócios ao fim do exercício.</dd>
                        <dt>Poder decisório</dt>
                        <dd>Voz e voto nas decisões estratégicas, financeiras e de admissão de novos sócios.</dd>
                    </dl>

                    <h3 class="fp-sub">Composição da remuneração mensal</h3>
                    <p class="fp-caminho-lead">
                        Pra dar dimensão: um parceiro típico trabalha cerca de
                        32h/sem × 4 = <strong>128h/mês a R$ 100/h =
                        R$ 12.800 mensais</strong>, distribuídos em quatro frentes.
                    </p>
                    <dl class="fp-breakdown">
                        <dt>R$ 2.000</dt>
                        <dd>Pessoal <span>renda direta</span></dd>
                        <dt>R$ 3.000</dt>
                        <dd>Benefícios <span>autocuidado e família</span></dd>
                        <dt>R$ 5.000</dt>
                        <dd>Impacto <span>social, ambiental e cultural</span></dd>
                        <dt>R$ 2.800</dt>
                        <dd>Reserva <span>folgas, férias e flexibilidade</span></dd>
                    </dl>
                    <p class="fp-caminho-note">
                        A composição é flexível e ajusta ao momento de cada parceiro.
                        Sociedade não é requisito — você pode atuar pela rede sem nunca
                        se tornar sócio.
                    </p>
                </section>

                <a class="back" href="/">← voltar</a>
            </div>
        </main>
        ${siteFooter()}
    `;

    wireForm();
}

function wireForm(): void {
    const form = document.getElementById("parceiro-form") as HTMLFormElement | null;
    const success = document.getElementById("fp-success");
    if (!form) return;

    form.addEventListener("submit", (e: Event) => {
        e.preventDefault();
        const data = new FormData(form);
        const get = (k: string): string => ((data.get(k) as string | null) ?? "").trim();
        const nome    = get("nome");
        const servico = get("servico");
        const estado  = get("estado");
        const cidade  = get("cidade");
        const bairro  = get("bairro");
        const cnpj    = get("cnpj");
        const canal   = get("canal");
        const contato = get("contato");
        const msg     = get("mensagem");
        if (!nome || !servico || !estado || !cidade || !bairro || !cnpj || !canal || !contato) {
            form.reportValidity();
            return;
        }
        const cnpjLabel  = cnpj  === "possuo"    ? "Possuo CNPJ (MEI · ME · etc.)" : "Preciso de um CNPJ";
        const canalLabel = canal === "email"      ? "Email"
                         : canal === "whatsapp"   ? "WhatsApp" : "Outro";
        const subject = `Faça parte da rede · ${nome}`;
        const body = [
            `Nome: ${nome}`,
            `Serviço: ${servico}`,
            `Local: ${bairro} · ${cidade} · ${estado}`,
            `Situação fiscal: ${cnpjLabel}`,
            `Canal preferido: ${canalLabel}`,
            `Contato: ${contato}`,
            msg ? `\nMensagem:\n${msg}` : "",
        ].filter(Boolean).join("\n");
        const mailto = `mailto:${REDE_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailto;
        if (success) success.classList.add("on");
        const btn = form.querySelector<HTMLButtonElement>(".fp-submit");
        if (btn) btn.textContent = "Enviado ✓";
    });
}
