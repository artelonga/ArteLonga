/* Arte Longa · rendering layer
 *
 * Pure-ish components that take an entity (or context) and return HTML strings.
 * Pages compose components. Dispatcher at bottom runs based on body[data-page].
 */
(function (global) {
    "use strict";
    const AL = global.AL;
    if (!AL) { console.error("AL data not loaded"); return; }

    const REDE_EMAIL = "rede@artelonga.com.br";
    const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const norm = s => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const initial = s => (s || "?").trim()[0].toUpperCase();
    const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
    const encodeQ = s => encodeURIComponent(s);

    // ─── COMPONENTS ──────────────────────────────────────────────────────────

    function avatarSm(entity) {
        if (entity.type === "community") return "";
        const inner = entity.pic
            ? `<img src="${esc(entity.pic)}" alt="${esc(entity.nome)}">`
            : esc(initial(entity.nome));
        return `<div class="avatar-sm">${inner}</div>`;
    }

    function avatarLg(entity) {
        const inner = entity.pic
            ? `<img src="${esc(entity.pic)}" alt="${esc(entity.nome)}">`
            : esc(initial(entity.nome));
        return `<div class="avatar avatar-lg">${inner}</div>`;
    }

    function bioCard(entity) {
        const text = entity.bioCurta || entity.bio;
        if (text) return `<p class="card-bio">${esc(text.split(/\n\s*\n/)[0])}</p>`;
        return `<p class="card-bio empty">Biografia em breve.</p>`;
    }

    function bioFull(entity) {
        if (!entity.bio) return `<p class="profile-bio empty">Biografia em breve.</p>`;
        const paragraphs = entity.bio.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
        return paragraphs.map(p => `<p class="profile-bio">${esc(p)}</p>`).join("");
    }

    // Inline age counter, under the role. Returns element + optional tick function.
    function counter(entity) {
        if (!entity.birthDate) return { html: "", tick: null };
        if (entity.emMemoria) {
            if (!entity.deathDate) return { html: "", tick: null };
            const birth = new Date(entity.birthDate);
            const death = new Date(entity.deathDate);
            const years = Math.floor((death - birth) / (365.25 * 24 * 3600 * 1000));
            return {
                html: `<div class="profile-counter-static">${years} anos · ${birth.getFullYear()}—${death.getFullYear()} · em memória</div>`,
                tick: null
            };
        }
        const html = `<div class="profile-counter" data-birth="${esc(entity.birthDate)}"></div>`;
        return { html, tick: () => tickCounter(entity.birthDate) };
    }

    function tickCounter(birthStr) {
        const precision = (() => {
            if (!birthStr.includes("T")) return "day";
            const t = birthStr.split("T")[1].replace(/[Z+-].*$/, "");
            const colons = (t.match(/:/g) || []).length;
            return colons >= 2 ? "second" : colons === 1 ? "minute" : "hour";
        })();
        const birth = new Date(birthStr);
        const el = document.querySelector(`.profile-counter[data-birth="${CSS.escape(birthStr)}"]`);
        if (!el) return null;

        const render = () => {
            const now = new Date();
            let y = now.getFullYear() - birth.getFullYear();
            let mo = now.getMonth() - birth.getMonth();
            let d = now.getDate() - birth.getDate();
            let h = now.getHours() - birth.getHours();
            let mi = now.getMinutes() - birth.getMinutes();
            let se = now.getSeconds() - birth.getSeconds();
            if (se < 0) { se += 60; mi -= 1; }
            if (mi < 0) { mi += 60; h -= 1; }
            if (h < 0) { h += 24; d -= 1; }
            if (d < 0) { const pm = new Date(now.getFullYear(), now.getMonth(), 0); d += pm.getDate(); mo -= 1; }
            if (mo < 0) { mo += 12; y -= 1; }
            const parts = [`${y} anos`, plural(mo, "mês", "meses"), plural(d, "dia", "dias")];
            if (precision === "second") parts.push(`${String(h).padStart(2,"0")}h${String(mi).padStart(2,"0")}m${String(se).padStart(2,"0")}s`);
            else if (precision === "minute") parts.push(`${String(h).padStart(2,"0")}h${String(mi).padStart(2,"0")}`);
            else if (precision === "hour") parts.push(`${h}h`);
            el.textContent = parts.join(" · ");
        };
        render();
        setInterval(render, precision === "second" ? 1000 : 60000);
    }

    function missaoLink(titulo) {
        return `<a class="missao-link" href="/servicos/?q=${encodeQ(titulo)}">${esc(titulo)} <span class="missao-arrow">→ serviços</span></a>`;
    }

    function miniRow(entity) {
        const nome = entity.nome;
        const memoriaTag = entity.emMemoria ? ` <span class="mini-memoria">em memória</span>` : "";
        const missoes = entity.missoes && entity.missoes.length
            ? `<div class="mini-drawer"><ul class="mini-missoes">${entity.missoes.map(m => `<li>${esc(m)}</li>`).join("")}</ul></div>`
            : "";
        return `<li class="mini-row${entity.emMemoria ? ' mini-row-memoria' : ''}">
            <a class="mini-name" href="/${esc(entity.handle)}/">${esc(nome)}</a>${memoriaTag}
            ${missoes}
        </li>`;
    }

    function platformItem(p) {
        return `<li class="platform ${p.status}">
            <span class="platform-dot"></span>
            <span class="platform-name">${esc(p.name)}</span>
            <span class="platform-status">${esc(p.statusText)}</span>
        </li>`;
    }

    function ctaLead(copy, btnLabel) {
        return `<div class="lead-magnet">
            <h3>${esc(copy.title)}</h3>
            <p>${esc(copy.body)}</p>
            <button type="button" class="cta-button" data-cta="${esc(copy.id)}">${esc(btnLabel)}</button>
        </div>`;
    }

    function modalContact(id, labelText) {
        return `<div class="modal-overlay" id="${id}" role="dialog" aria-modal="true">
            <div class="modal-card" style="text-align:center;">
                <div class="modal-servico-nome">${esc(labelText)}</div>
                <div class="modal-contact-label">Escreva para</div>
                <div class="modal-email">${REDE_EMAIL}</div>
                <button class="modal-close" type="button">Fechar</button>
            </div>
        </div>`;
    }

    function wireModal(modalId, triggerSelector) {
        const m = document.getElementById(modalId);
        if (!m) return;
        document.querySelectorAll(triggerSelector).forEach(t => {
            t.addEventListener("click", () => m.classList.add("on"));
        });
        m.addEventListener("click", e => {
            if (e.target === m || e.target.classList.contains("modal-close")) m.classList.remove("on");
        });
        document.addEventListener("keydown", e => { if (e.key === "Escape") m.classList.remove("on"); });
    }

    // Site header (shared by every page)
    function siteHeader() {
        return `<header class="site-header">
            <div class="site-header-inner">
                <a class="site-brand" href="/"><img src="/logo-al.png" alt="Arte Longa"></a>
                <span class="site-tagline">semeando sonhos</span>
            </div>
        </header>`;
    }

    // ─── PAGE: HOME ──────────────────────────────────────────────────────────
    function renderHome() {
        document.body.innerHTML = `
            ${siteHeader()}
            <main class="main">
                <div class="home-wrap">
                    <div class="home-hero">
                        <h1 class="home-title">Arte Longa</h1>
                        <div class="home-subtitle">semeando sonhos</div>
                    </div>
                    <ul class="home-menu">
                        <li><a href="/parceiros/">Parceiros <span class="arrow">ver →</span></a></li>
                        <li><a href="/servicos/">Serviços <span class="arrow">ver →</span></a></li>
                        <li><a href="/solucoes/">Soluções <span class="arrow">ver →</span></a></li>
                    </ul>
                    <div class="home-meta">
                        <a href="/sobre/">Sobre</a>
                        <span class="sep">·</span>
                        <a href="/proximos-passos/">Próximos Passos</a>
                    </div>
                </div>
            </main>
        `;
    }

    // ─── PAGE: PARCEIROS ─────────────────────────────────────────────────────
    function renderParceiros() {
        const roster = AL.roster();

        const rows = roster.map(entity => {
            const isComunidade = entity.type === "community";
            const targetUrl = entity.externalUrl || `/${entity.handle}/`;
            const targetAttrs = entity.externalUrl ? ` target="_blank" rel="noopener"` : "";
            const seeMore = entity.muted ? "" : `<a class="see-more" href="${targetUrl}"${targetAttrs}>ver mais →</a>`;
            const nameHtml = `<a href="${targetUrl}" class="name"${targetAttrs}>${esc(entity.nome)}</a>`;

            // Sub-members come from either .membros (community) or .subMembers (person)
            const subHandles = isComunidade ? entity.membros : (entity.subMembers || []);
            const subs = (subHandles || []).map(h => AL.get(h)).filter(Boolean);

            const membrosHtml = subs.length
                ? `<ul class="card-membros">${subs.map(miniRow).join("")}</ul>`
                : "";

            const missoesHtml = (entity.missoes && entity.missoes.length)
                ? `<ul class="card-missoes">${entity.missoes.map(m => `<li>${esc(m)}</li>`).join("")}</ul>`
                : (entity.muted ? "" : `<ul class="card-missoes"><li style="font-style:italic;color:#bbb;">em breve</li></ul>`);

            const avatar = isComunidade ? "" : avatarSm(entity);
            const profileBlock = isComunidade
                ? bioCard(entity)
                : `<div class="profile-block">${avatar}${bioCard(entity)}</div>`;

            const li = [
                entity.muted ? "muted" : "",
                entity.sectionBreak ? "section-break" : ""
            ].filter(Boolean).join(" ");

            return `<li${li ? ` class="${li}"` : ""}>
                <div class="row">${nameHtml}<span class="role">${esc(entity.role || "")}</span></div>
                <div class="card"><div class="card-inner">
                    <div class="card-left">${profileBlock}${membrosHtml}${seeMore}</div>
                    <div class="card-right">${missoesHtml}</div>
                </div></div>
            </li>`;
        }).join("");

        document.body.innerHTML = `
            ${siteHeader()}
            <main class="main">
                <h1 class="statement">Arte Longa é:</h1>
                <ul class="roster">${rows}</ul>
                <div class="coda"><span class="when">01.04.2026</span></div>
                ${ctaLead({
                    title: "Seja um parceiro",
                    body: "Tem uma missão que dialoga com a rede? Entre para a Arte Longa. Acompanhamos seu crescimento.",
                    id: "parceiros"
                }, "Quero ser parceiro →")}
            </main>
            ${modalContact("contact-modal", "Bem-vindo à rede")}
        `;

        // Wire tap-toggle
        document.querySelectorAll(".roster > li").forEach(li => {
            const role = li.querySelector(":scope > .row > .role");
            if (role) role.addEventListener("click", e => { e.stopPropagation(); li.classList.toggle("open"); });
        });
        document.querySelectorAll(".mini-row").forEach(row => {
            row.addEventListener("click", e => {
                if (e.target.closest(".mini-name")) return;
                e.stopPropagation();
                row.classList.toggle("open");
            });
        });

        wireModal("contact-modal", '[data-cta="parceiros"]');
    }

    // ─── PAGE: SERVICOS ──────────────────────────────────────────────────────
    function renderServicos() {
        const servicos = AL.publicServices();
        const handleToNome = Object.fromEntries(AL.people.concat(AL.communities).map(e => [e.handle, e.nome]));
        const respNames = handles => handles.map(h => handleToNome[h] || h).join(", ");

        document.body.innerHTML = `
            ${siteHeader()}
            <main class="main">
                <h1 class="page-title">Serviços</h1>
                <div class="page-subtitle">Arte Longa · catálogo</div>

                <p class="intro">Um serviço é uma unidade combinável. A rede pacota serviços em <a href="/solucoes/">soluções</a> — ou monta uma custom, sob encomenda.</p>

                <div class="section-header"><h2>Portfólio</h2><span class="label">serviços da rede · clique para abrir</span></div>
                <div class="controls"><input type="search" id="search" placeholder="Buscar serviço…" autocomplete="off"></div>
                <div class="count" id="count"></div>
                <ul class="portfolio-list" id="portfolio-list"></ul>

                ${ctaLead({
                    title: "Anuncie seus serviços com a Arte Longa",
                    body: "Tem um serviço que dialoga com a rede? Junte-se ao portfólio. Transparência e rede de parceiros.",
                    id: "servicos"
                }, "Quero anunciar →")}

                <a class="back" href="/">← voltar</a>
            </main>
            ${modalContact("lead-modal", "Anuncie com a Arte Longa")}
        `;

        const listEl = document.getElementById("portfolio-list");
        const countEl = document.getElementById("count");
        const searchEl = document.getElementById("search");
        const leadModal = document.getElementById("lead-modal");

        leadModal.addEventListener("click", e => {
            if (e.target === leadModal || e.target.classList.contains("modal-close")) leadModal.classList.remove("on");
        });
        document.addEventListener("keydown", e => { if (e.key === "Escape") leadModal.classList.remove("on"); });
        document.querySelector('[data-cta="servicos"]').addEventListener("click", () => leadModal.classList.add("on"));

        function render() {
            const q = norm(searchEl.value);
            const filtered = q ? servicos.filter(s => norm(s.titulo).includes(q) || norm(respNames(s.responsavel)).includes(q)) : servicos;
            countEl.textContent = `${filtered.length} de ${servicos.length} serviços`;
            if (!filtered.length) {
                listEl.innerHTML = `<li class="empty-state">Nenhum serviço encontrado.</li>`;
                return;
            }
            listEl.innerHTML = "";
            filtered.forEach(s => {
                const li = document.createElement("li");
                li.innerHTML = `<a href="/servicos/${esc(s.slug)}/" class="portfolio-link"><div class="portfolio-titulo">${esc(s.titulo)}</div><div class="portfolio-resp">${esc(respNames(s.responsavel))}</div></a>`;
                listEl.appendChild(li);
            });
        }

        const urlQ = new URLSearchParams(location.search).get("q");
        if (urlQ) searchEl.value = urlQ;
        searchEl.addEventListener("input", render);
        render();
    }

    // ─── PAGE: SOLUCOES ──────────────────────────────────────────────────────
    function renderSolucoes() {
        const cards = AL.solutions.map(s => {
            const urlAttrs = s.internalLink ? "" : ` target="_blank" rel="noopener"`;
            const urlArrow = s.internalLink ? "ver →" : "acessar →";

            // Bundle list
            let bundleHtml = "";
            if (s.bundledServices === "*") {
                bundleHtml = `<ul class="bundle-list"><li><a href="/servicos/">catálogo completo →</a></li></ul>`;
            } else {
                const items = s.bundledServices;
                const show = 3;
                const lis = items.map((t, i) => {
                    const slug = AL.slugify(t);
                    return `<li${i >= show ? ' class="more-item"' : ''}><a href="/servicos/${slug}/">${esc(t)}</a></li>`;
                }).join("");
                const moreCount = Math.max(0, items.length - show);
                const btn = moreCount > 0
                    ? `<button type="button" class="bundle-more-btn" data-more="${moreCount}">ver mais (+${moreCount})</button>`
                    : "";
                bundleHtml = `<ul class="bundle-list">${lis}</ul>${btn}`;
            }

            return `<li class="solucao">
                <div class="solucao-head">
                    <a class="solucao-nome" href="${esc(s.url)}"${urlAttrs}>${esc(s.nome)} <span class="arrow">${urlArrow}</span></a>
                    <span class="solucao-tagline">${esc(s.tagline)}</span>
                </div>
                <span class="solucao-url">${esc(s.urlLabel)}</span>
                <p class="solucao-desc">${esc(s.desc)}</p>
                <div class="solucao-grid">
                    <div>
                        <div class="bundle-label">Serviços</div>
                        ${bundleHtml}
                    </div>
                    <div>
                        <div class="bundle-label">Plataformas</div>
                        <ul class="platforms">${s.platforms.map(platformItem).join("")}</ul>
                    </div>
                </div>
            </li>`;
        }).join("");

        document.body.innerHTML = `
            ${siteHeader()}
            <main class="main">
                <h1 class="page-title">Soluções</h1>
                <div class="page-subtitle">Arte Longa · Produtos</div>
                <p class="intro">Uma solução é um conjunto de serviços da rede organizados em uma plataforma. Cada solução reúne pessoas, missões e tecnologia em torno de um tema.</p>
                <ul class="solucoes-list">${cards}</ul>

                ${ctaLead({
                    title: "Construa soluções com a Arte Longa",
                    body: "Tem uma ideia de plataforma ou rede social que junta pessoas em torno de algo? A gente ajuda a sair do papel — da concepção ao lançamento.",
                    id: "solucoes"
                }, "Quero construir →")}

                <a class="back" href="/">← voltar</a>
            </main>
            ${modalContact("contact-modal", "Vamos construir?")}
        `;

        document.querySelectorAll(".bundle-more-btn").forEach(btn => {
            const list = btn.previousElementSibling;
            const more = btn.dataset.more;
            btn.addEventListener("click", () => {
                const expanded = list.classList.toggle("expanded");
                btn.textContent = expanded ? "ver menos" : `ver mais (+${more})`;
            });
        });
        wireModal("contact-modal", '[data-cta="solucoes"]');
    }

    // ─── PAGE: PROFILE ───────────────────────────────────────────────────────
    function renderProfile(handle) {
        let p = AL.get(handle);
        if (!p) { document.body.innerHTML = `<main class="main"><p>Perfil não encontrado.</p></main>`; return; }

        // Solutions (e.g. Yggdrasil) rendered as profiles: remap fields to profile shape
        if (p.type === "solution") {
            p = {
                ...p,
                role: p.tagline,
                bio: p.desc,
                missoes: p.bundledServices === "*" ? [] : p.bundledServices,
                emBreve: p.platforms && p.platforms.every(pl => pl.status === "wip")
            };
        }

        document.title = `${p.nome} — Arte Longa`;

        const { html: counterHtml, tick: tickFn } = counter(p);

        const bioHtmlOut = bioFull(p);
        const emBreveNote = p.emBreve ? `<div class="em-breve-note">Perfil em breve.</div>` : "";
        const emMemoriaNote = p.emMemoria ? `<div class="em-memoria-note"><em>em memória</em></div>` : "";

        const missoesHtml = (p.missoes && p.missoes.length)
            ? `<section class="section missoes-section">
                 <h2>Missões <span class="section-hint">coleções de serviços — clique para ver</span></h2>
                 <ul>${p.missoes.map(m => `<li>${missaoLink(m)}</li>`).join("")}</ul>
               </section>` : "";

        // Sub-members (for persons) OR community members
        let membrosHtml = "";
        const subHandles = p.type === "community" ? p.membros : p.subMembers;
        if (subHandles && subHandles.length) {
            const subs = subHandles.map(h => AL.get(h)).filter(Boolean);
            membrosHtml = `<section class="section">
                <h2>Membros</h2>
                <ul>${subs.map(s => `<li><a href="/${esc(s.handle)}/">${esc(s.nome)}</a></li>`).join("")}</ul>
            </section>`;
        }

        let comunidadesHtml = "";
        if (p.communities && p.communities.length) {
            comunidadesHtml = `<section class="section">
                <h2>Comunidades</h2>
                <ul>${p.communities.map(h => { const c = AL.get(h); return c ? `<li><a href="/${esc(c.handle)}/">${esc(c.nome)}</a></li>` : ""; }).join("")}</ul>
            </section>`;
        }

        const contactHtml = p.site
            ? `<section class="section"><h2>Contato e Orçamento</h2><ul><li><a href="${esc(p.site)}" target="_blank" rel="noopener">${esc(p.site)}</a></li></ul></section>`
            : `<section class="section"><h2>Contato e Orçamento</h2><ul><li><span class="email-display">${REDE_EMAIL}</span></li></ul></section>`;

        document.body.innerHTML = `
            ${siteHeader()}
            <main class="main">
                <div class="profile-hero">
                    ${avatarLg(p)}
                    <div>
                        <h1 class="profile-name">${esc(p.nome)}</h1>
                        ${p.role ? `<div class="profile-role">${esc(p.role)}</div>` : ""}
                        ${counterHtml}
                        ${bioHtmlOut}
                    </div>
                </div>
                ${emBreveNote}
                ${emMemoriaNote}
                ${missoesHtml}
                ${membrosHtml}
                ${comunidadesHtml}
                ${contactHtml}
                <a class="back" href="/">← voltar</a>
            </main>
        `;
        if (tickFn) tickFn();
    }

    // ─── PAGE: SERVICE DETAIL ────────────────────────────────────────────────
    function renderService(slug) {
        const s = AL.serviceBySlug(slug);
        if (!s) { document.body.innerHTML = `<main class="main"><p>Serviço não encontrado.</p><a class="back" href="/servicos/">← voltar</a></main>`; return; }

        document.title = `${s.nome || s.titulo} — Serviços — Arte Longa`;

        // Responsáveis (people + communities)
        const respEntities = s.responsavel.map(h => AL.get(h)).filter(Boolean);
        const respLinks = respEntities.map(e => {
            const url = e.externalUrl || `/${e.handle}/`;
            const attr = e.externalUrl ? ` target="_blank" rel="noopener"` : "";
            return `<a href="${url}"${attr}>${esc(e.nome)}</a>`;
        }).join(", ");

        // CNAE
        const cnaeHtml = s.cnae && s.cnae.length
            ? `<ul class="service-cnae-list">${s.cnae.map(x =>
                `<li><span class="cnae-code">${esc(x.c)}</span><span class="cnae-desc">${esc(x.d)}</span></li>`
            ).join("")}</ul>`
            : `<p class="empty-line">CNAE não mapeado. Consulte <a href="/sobre/#cnae">/sobre</a> para a lista completa.</p>`;

        // Solutions that bundle this service
        const sols = AL.solutionsUsingService(s.titulo);
        const solsHtml = sols.length
            ? `<ul class="service-sols-list">${sols.map(sol => {
                const url = sol.internalLink ? sol.url : sol.url;
                const attr = sol.internalLink ? "" : ` target="_blank" rel="noopener"`;
                return `<li><a href="${esc(url)}"${attr}><strong>${esc(sol.nome)}</strong> <span class="sol-tagline">${esc(sol.tagline)}</span></a></li>`;
            }).join("")}</ul>`
            : `<p class="empty-line">Ainda não entra em nenhuma solução padrão — pode compor uma custom.</p>`;

        // Related services (co-occurring in solutions)
        const related = AL.relatedServices(s.titulo);
        const relHtml = related.length
            ? `<ul class="service-related">${related.map(r =>
                `<li><a href="/servicos/${esc(r.slug)}/">${esc(r.titulo)}</a></li>`
            ).join("")}</ul>`
            : "";

        const summaryHtml = s.summary
            ? `<p class="service-summary">${esc(s.summary)}</p>`
            : "";

        const attachmentsHtml = (s.attachments && s.attachments.length)
            ? `<div class="section-header"><h2>Material</h2><span class="label">download</span></div>
               <ul class="service-attachments">${s.attachments.map(a =>
                   `<li><a href="${esc(a.url)}" target="_blank" rel="noopener" class="attachment-link">
                     <span class="att-kind">${esc((a.kind || "arquivo").toUpperCase())}</span>
                     <span class="att-label">${esc(a.label)}</span>
                     <span class="att-arrow">baixar →</span>
                   </a></li>`
               ).join("")}</ul>`
            : "";

        document.body.innerHTML = `
            ${siteHeader()}
            <main class="main">
                <div class="service-crumb"><a href="/servicos/">← Serviços</a></div>
                <div class="service-label">Serviço</div>
                <h1 class="service-title">${esc(s.titulo)}</h1>
                <div class="service-resp">Responsável: ${respLinks}</div>
                ${summaryHtml}
                ${attachmentsHtml}

                <div class="section-header"><h2>CNAE</h2><span class="label">classificação oficial</span></div>
                ${cnaeHtml}

                <div class="section-header"><h2>Em soluções</h2><span class="label">combina com outras</span></div>
                <p class="intro-short">Este serviço compõe as seguintes soluções da rede. Também pode ser combinado sob encomenda.</p>
                ${solsHtml}

                ${related.length ? `<div class="section-header"><h2>Frequentemente combinado com</h2><span class="label">serviços irmãos</span></div>${relHtml}` : ""}

                <div class="section-header"><h2>Orçamento</h2><span class="label">contato direto</span></div>
                <div class="service-contact">
                    <div class="modal-email">${REDE_EMAIL}</div>
                </div>

                <a class="back" href="/servicos/">← voltar ao portfólio</a>
            </main>
        `;
    }

    // ─── PAGE: RECURSOS ──────────────────────────────────────────────────────
    function renderRecursos() {
        const f = AL.finances;
        const fmt = n => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
        const short = n => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
        const nomeOf = h => { const p = AL.get(h); return p ? p.nome : h; };

        // ── COSTS ──
        const totalCustos = f.custos.reduce((a, c) => a + c.value, 0);
        const custosHtml = f.custos.map(c => {
            const breakdownHtml = c.breakdown
                ? `<div class="fin-sub-breakdown">${c.breakdown.map(b =>
                    `<div class="sub-line"><span>${esc(b.label)}${b.handle ? ` <a class="sub-link" href="/${esc(b.handle)}/">↗</a>` : ""}</span><span>${fmt(b.value)}</span></div>`
                  ).join("")}</div>`
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

        // ── REVENUE ──
        const recorrenteMensalTotal = f.receita.recorrenteMensal.reduce((a, r) => a + r.mensal, 0);
        const recorrenteQ2 = recorrenteMensalTotal * 3;

        const rampaQ2 = f.receita.rampa.reduce((a, r) => a + r.meses.reduce((b, m) => b + m.value, 0), 0);

        const projetosQ2 = f.receita.projetos.reduce((a, p) => a + (p.unitValue * p.unidades), 0);

        const totalReceitaQ2 = recorrenteQ2 + rampaQ2 + projetosQ2;
        const percentMeta = Math.round((totalReceitaQ2 / f.metaQ2) * 100);
        const gap = f.metaQ2 - totalReceitaQ2;

        const recorrenteHtml = f.receita.recorrenteMensal.map(r => `
            <li class="fin-item">
                <div class="fin-head">
                    <div class="fin-label">${esc(r.label)}${r.client ? ` <span class="client-tag">cliente: ${esc(r.client)}</span>` : ""}</div>
                    <div class="fin-value">${fmt(r.mensal)}<span class="fin-unit">/mês</span></div>
                </div>
                <div class="fin-detail">${esc(r.detail)} · por <a href="/${esc(r.responsavel)}/">${esc(nomeOf(r.responsavel))}</a></div>
            </li>
        `).join("");

        const rampaHtml = f.receita.rampa.map(r => `
            <li class="fin-item">
                <div class="fin-head">
                    <div class="fin-label">${esc(r.label)}${r.client ? ` <span class="client-tag">cliente: ${esc(r.client)}</span>` : ""}</div>
                    <div class="fin-value">${fmt(r.meses.reduce((a, m) => a + m.value, 0))}<span class="fin-unit"> · Q2</span></div>
                </div>
                <div class="fin-detail">${esc(r.detail)} · por <a href="/${esc(r.responsavel)}/">${esc(nomeOf(r.responsavel))}</a></div>
                <div class="fin-sub-breakdown">${r.meses.map(m =>
                    `<div class="sub-line"><span>${esc(m.mes)}</span><span>${fmt(m.value)}</span></div>`
                ).join("")}</div>
            </li>
        `).join("");

        const projetosHtml = f.receita.projetos.map(p => {
            const total = p.unitValue * p.unidades;
            return `<li class="fin-item">
                <div class="fin-head">
                    <div class="fin-label">${esc(p.label)}</div>
                    <div class="fin-value">${fmt(total)}</div>
                </div>
                <div class="fin-detail">${esc(p.detail)} · por <a href="/${esc(p.responsavel)}/">${esc(nomeOf(p.responsavel))}</a></div>
            </li>`;
        }).join("");

        const proBonoHtml = f.receita.proBono.map(p => `
            <li class="fin-item pro-bono">
                <div class="fin-head">
                    <div class="fin-label">${esc(p.label)}</div>
                    <div class="fin-value pro-bono-tag">pro-bono</div>
                </div>
                <div class="fin-detail">${esc(p.detail)} · por <a href="/${esc(p.responsavel)}/">${esc(nomeOf(p.responsavel))}</a></div>
            </li>
        `).join("");

        document.body.innerHTML = `
            ${siteHeader()}
            <main class="main">
                <h1 class="page-title">Recursos</h1>
                <div class="page-subtitle">Arte Longa · modelo de negócio</div>

                <p class="intro">Como a rede se sustenta. Gastos recorrentes, receita potencial e metas de ${esc(f.quarter)}. Página pública, atualizada à medida que avançamos.</p>

                <!-- ──── GASTOS ──── -->
                <div class="section-header"><h2>Gastos recorrentes</h2><span class="label">mensal</span></div>
                <ul class="fin-list">${custosHtml}</ul>
                <div class="fin-total">
                    <span class="fin-total-label">Total mensal</span>
                    <span class="fin-total-value">${fmt(totalCustos)}</span>
                </div>

                <!-- ──── RECEITA RECORRENTE ──── -->
                <div class="section-header"><h2>Receita · recorrente mensal</h2><span class="label">baseline</span></div>
                <ul class="fin-list">${recorrenteHtml}</ul>
                <div class="fin-subtotal">
                    <span>Subtotal recorrente · mensal</span>
                    <span>${fmt(recorrenteMensalTotal)}</span>
                </div>
                <div class="fin-subtotal">
                    <span>Subtotal recorrente · ${esc(f.quarter)} (× 3)</span>
                    <span>${fmt(recorrenteQ2)}</span>
                </div>

                <!-- ──── RECEITA RAMPA ──── -->
                <div class="section-header"><h2>Receita · rampa</h2><span class="label">crescimento mensal</span></div>
                <ul class="fin-list">${rampaHtml}</ul>
                <div class="fin-subtotal">
                    <span>Subtotal rampa · ${esc(f.quarter)}</span>
                    <span>${fmt(rampaQ2)}</span>
                </div>

                <!-- ──── RECEITA PROJETOS ──── -->
                <div class="section-header"><h2>Receita · projetos</h2><span class="label">one-off no trimestre</span></div>
                <ul class="fin-list">${projetosHtml}</ul>
                <div class="fin-subtotal">
                    <span>Subtotal projetos · ${esc(f.quarter)}</span>
                    <span>${fmt(projetosQ2)}</span>
                </div>

                <!-- ──── PRO-BONO ──── -->
                <div class="section-header"><h2>Pro-bono</h2><span class="label">não entra na receita</span></div>
                <p class="intro-short">Na Arte Longa nem tudo é receita. O trabalho pro-bono é parte do impacto social, ambiental e cultural.</p>
                <ul class="fin-list">${proBonoHtml}</ul>

                <!-- ──── META ──── -->
                <div class="section-header"><h2>Meta vs Potencial</h2><span class="label">${esc(f.quarter)}</span></div>
                <div class="fin-goal-grid">
                    <div class="fin-goal">
                        <div class="fin-goal-label">Meta de receita · ${esc(f.quarter)}</div>
                        <div class="fin-goal-value">${short(f.metaQ2)}</div>
                        <div class="fin-goal-note">objetivo trimestral</div>
                    </div>
                    <div class="fin-goal highlighted">
                        <div class="fin-goal-label">Potencial estimado</div>
                        <div class="fin-goal-value">${short(totalReceitaQ2)}</div>
                        <div class="fin-goal-note">${percentMeta}% da meta · gap ${gap > 0 ? short(gap) : 'nenhum'}</div>
                    </div>
                </div>

                <div class="fin-breakdown-summary">
                    <div class="sum-line"><span>Recorrente × 3</span><span>${fmt(recorrenteQ2)}</span></div>
                    <div class="sum-line"><span>Rampa (Hedix MM)</span><span>${fmt(rampaQ2)}</span></div>
                    <div class="sum-line"><span>Projetos</span><span>${fmt(projetosQ2)}</span></div>
                    <div class="sum-line sum-total"><span>Total estimado</span><span>${fmt(totalReceitaQ2)}</span></div>
                </div>

                <p class="fin-footnote">
                    Consulte também <a href="/sobre/">Sobre</a> (dados cadastrais e CNAEs), <a href="/proximos-passos/">Próximos Passos</a> (metas) e <a href="/servicos/">Serviços</a> (catálogo completo).
                </p>

                <a class="back" href="/">← voltar</a>
            </main>
        `;
    }

    // ─── DISPATCHER ──────────────────────────────────────────────────────────
    const pageFns = {
        home: renderHome,
        parceiros: renderParceiros,
        servicos: renderServicos,
        solucoes: renderSolucoes,
        recursos: renderRecursos,
        profile: () => renderProfile(document.body.dataset.handle),
        service: () => renderService(document.body.dataset.slug)
    };

    document.addEventListener("DOMContentLoaded", () => {
        const page = document.body.dataset.page;
        const fn = pageFns[page];
        if (fn) fn();
        else if (page) console.warn(`No renderer for page: ${page}`);
    });
})(window);
