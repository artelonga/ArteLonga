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

    // Inline markdown:
    //   [[Label]] or [[Label|Title]] → "em breve" modal trigger
    //   [text](url)                  → anchor (external links open in new tab)
    //   *text*                       → italic
    // Safe-escaped first; brackets/asterisks survive esc() so the regexes still match.
    function mdInline(s) {
        return esc(s)
            .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, label, title) => {
                const t = title || label;
                return `<a href="#" class="al-em-breve" data-modal-title="${t}">${label}</a>`;
            })
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
                // url is already escaped — we need to unescape HTML entities for the href
                const href = url.replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"');
                const external = /^https?:\/\//.test(href);
                return `<a href="${href}"${external ? ' target="_blank" rel="noopener"' : ''}>${text}</a>`;
            })
            .replace(/\*([^*\n]+)\*/g, "<em>$1</em>");
    }

    // ─── EM-BREVE MODAL ──────────────────────────────────────────────────────
    // Mounted once on first click of .al-em-breve. Keeps the lazy footprint small.
    (function initEmBreveModal() {
        let modal = null;
        function ensure() {
            if (modal) return modal;
            modal = document.createElement("div");
            modal.className = "al-modal";
            modal.innerHTML =
                '<div class="al-modal-backdrop"></div>' +
                '<div class="al-modal-card" role="dialog" aria-modal="true" aria-labelledby="al-modal-title">' +
                  '<button class="al-modal-close" aria-label="Fechar">×</button>' +
                  '<h3 id="al-modal-title" class="al-modal-title"></h3>' +
                  '<div class="al-modal-footer">em breve</div>' +
                '</div>';
            document.body.appendChild(modal);
            modal.querySelector(".al-modal-backdrop").addEventListener("click", close);
            modal.querySelector(".al-modal-close").addEventListener("click", close);
            document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
            return modal;
        }
        function open(title) {
            const m = ensure();
            m.querySelector(".al-modal-title").textContent = title;
            m.classList.add("open");
            const c = m.querySelector(".al-modal-close"); if (c) c.focus();
        }
        function close() { if (modal) modal.classList.remove("open"); }
        document.addEventListener("click", e => {
            const a = e.target.closest && e.target.closest("a.al-em-breve");
            if (!a) return;
            e.preventDefault();
            const title = a.getAttribute("data-modal-title") || "Em breve";
            open(title);
            if (window.AL_track) window.AL_track("modal_em_breve", { title });
        });
    })();

    // Blocks split by blank lines. Within a block, single newlines become <br>.
    // A block where every line starts with "> " renders as <blockquote>.
    function bioFull(entity) {
        if (!entity.bio) return `<p class="profile-bio empty">Biografia em breve.</p>`;
        const blocks = entity.bio.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
        return blocks.map(block => {
            const lines = block.split("\n");
            if (lines.every(l => /^>\s?/.test(l))) {
                const inner = lines.map(l => l.replace(/^>\s?/, "")).join("\n");
                return `<blockquote class="profile-bio profile-bio-quote">${mdInline(inner).replace(/\n/g, "<br>")}</blockquote>`;
            }
            return `<p class="profile-bio">${mdInline(block).replace(/\n/g, "<br>")}</p>`;
        }).join("");
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

    // Expande uma lista de títulos de serviços para exibição no popover.
    // Se um título tiver filhos (ex.: "Inteligência e Tecnologia" → 10 subs),
    // o pai vira cabeçalho do grupo e os filhos ficam indentados abaixo.
    // Usado em /parceiros/ (servicos da pessoa) e /solucoes/ (bundledServices).
    function expandTitlesForPopover(titles) {
        const items = [];
        for (const t of titles) {
            const children = AL.services.filter(s => s.parent === t);
            if (children.length) {
                const parentSvc = AL.serviceByTitle(t);
                items.push({
                    titulo: t,
                    slug: parentSvc ? parentSvc.slug : AL.slugify(t),
                    role: "group"
                });
                for (const c of children) {
                    items.push({ titulo: c.titulo, slug: c.slug, role: "child" });
                }
            } else {
                const svc = AL.serviceByTitle(t);
                items.push({
                    titulo: t,
                    slug: svc ? svc.slug : AL.slugify(t),
                    role: "item"
                });
            }
        }
        return items;
    }
    function renderPopoverList(items) {
        return items.map(it => {
            const cls = it.role === "group" ? "svc-group" : it.role === "child" ? "svc-child" : "";
            return `<li${cls ? ` class="${cls}"` : ""}><a href="/servicos/${esc(it.slug)}/">${esc(it.titulo)} →</a></li>`;
        }).join("");
    }

    function miniRow(entity) {
        const nome = entity.nome;
        const memoriaTag = entity.emMemoria ? ` <span class="mini-memoria">em memória</span>` : "";
        const servicos = entity.servicos && entity.servicos.length
            ? `<div class="mini-drawer"><ul class="mini-missoes">${entity.servicos.map(m => `<li>${esc(m)}</li>`).join("")}</ul></div>`
            : "";
        return `<li class="mini-row${entity.emMemoria ? ' mini-row-memoria' : ''}">
            <a class="mini-name" href="/${esc(entity.handle)}/">${esc(nome)}</a>${memoriaTag}
            ${servicos}
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

    // ─── PAGE: PARCEIROS — ShowAll mode (flat, alfabético, sem hierarquia) ───
    // Acessada via /parceiros/#ShowAll. Lista TODAS as pessoas
    // (AL.people exceto referenceOnly), ordem alfabética pt-BR.
    // Sub-membros e membros de comunidades aparecem misturados — sem
    // categorias, sem papéis, sem serviços.
    function renderParceirosShowAll() {
        const all = AL.people
            .filter(p => !p.referenceOnly)
            .sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "pt-BR"));
        const items = all.map(p => `<li><a href="/${esc(p.handle)}/">${esc(p.nome)}</a></li>`).join("");
        document.body.innerHTML = `
            ${siteHeader()}
            <main class="main">
                <h1 class="statement">Todos</h1>
                <p class="show-all-intro">${all.length} caminhos…</p>
                <ul class="roster-all">${items}</ul>
                <p class="show-all-toggle"><a href="/parceiros/">← papéis e serviços</a></p>
            </main>
        `;
    }

    // ─── PAGE: PARCEIROS ─────────────────────────────────────────────────────
    function renderParceiros() {
        // Hash-based routing: /parceiros/#ShowAll → flat view
        const h = (location.hash || "").toLowerCase();
        if (h === "#todos" || h === "#showall") { // #showall = legacy alias
            renderParceirosShowAll();
            window.addEventListener("hashchange", renderParceiros); // idempotent
            return;
        }
        // Re-route on hash change (idempotent: same fn ref)
        window.addEventListener("hashchange", renderParceiros);

        const roster = AL.roster();

        const rows = roster.map(entity => {
            const isComunidade = entity.type === "community";
            // Name click: externa se a comunidade tem site próprio (QA, HFS, Hedix)
            const nameUrl = entity.externalUrl || `/${entity.handle}/`;
            const nameAttrs = entity.externalUrl ? ` target="_blank" rel="noopener"` : "";
            // Ver Mais: sempre leva ao perfil interno (página estendida da Arte Longa)
            const verMaisUrl = `/${entity.handle}/`;
            const verMaisLabel = isComunidade ? "Ver Mais →" : "ver mais →";
            const seeMore = entity.muted ? "" : `<a class="see-more" href="${verMaisUrl}">${verMaisLabel}</a>`;
            const socioMark = (!isComunidade && AL.isSocio && AL.isSocio(entity.handle))
                ? `<span class="socio-mark" aria-label="sócio">*</span>`
                : "";
            const nameHtml = `<a href="${nameUrl}" class="name"${nameAttrs}>${esc(entity.nome)}${socioMark}</a>`;

            // Sub-members come from either .membros (community) or .subMembers (person)
            const subHandles = isComunidade ? entity.membros : (entity.subMembers || []);
            const subs = (subHandles || []).map(h => AL.get(h)).filter(Boolean);

            // Para comunidades: esconde membros que já aparecem no roster principal
            // + coloca em-memória por último, atrás de "ver mais".
            const rosterSet = new Set(AL.rosterOrder || []);
            // Regra: quem já está no roster principal fica atrás de "ver mais"
            // (evita redundância). Em-memória permanece visível — honra a lembrança.
            const splitSubs = (list) => {
                if (!isComunidade) return { visible: list, hidden: [] };
                const visible = [];
                const hidden = [];
                for (const m of list) {
                    if (rosterSet.has(m.handle)) hidden.push(m);
                    else visible.push(m);
                }
                return { visible, hidden };
            };
            const { visible: subsVisible, hidden: subsHidden } = splitSubs(subs);

            // Comunidade: só a lista curta (únicos + em memória) + badge "+N" indicando
            // quantos outros existem. Não expande inline — CTA "Ver Mais" leva ao perfil da comunidade.
            const hiddenBadge = subsHidden.length ? `<li class="membros-badge">+ ${subsHidden.length} membros</li>` : "";
            const membrosHtml = (subsVisible.length || subsHidden.length)
                ? `<ul class="card-membros">${subsVisible.map(miniRow).join("")}${hiddenBadge}</ul>`
                : "";

            // Serviços saem do corpo do cartão — viram um botão "Ver serviços" que
            // abre um popover flutuante (position: absolute) para não empurrar o layout.
            // Comunidades não têm serviços comerciais (oferecem via missões).
            const svcList = (!isComunidade && entity.servicos && entity.servicos.length)
                ? entity.servicos
                : [];
            const svcItems = svcList.length ? expandTitlesForPopover(svcList) : [];
            const servicosBtn = svcItems.length
                ? `<button type="button" class="ver-servicos-btn" aria-expanded="false">Ver serviços (${svcItems.length}) →</button>`
                : (isComunidade || entity.muted ? "" : `<span class="card-missoes-hint">em breve</span>`);
            const servicosPopover = svcItems.length
                ? `<div class="servicos-popover" role="dialog" aria-label="Serviços de ${esc(entity.nome)}">
                    <div class="servicos-popover-head">Serviços de ${esc(entity.nome)}</div>
                    <ul class="servicos-popover-list">${renderPopoverList(svcItems)}</ul>
                   </div>`
                : "";

            const avatar = isComunidade ? "" : avatarSm(entity);
            const profileBlock = isComunidade
                ? bioCard(entity)
                : `<div class="profile-block">${avatar}${bioCard(entity)}</div>`;

            const li = [
                entity.muted ? "muted" : "",
                entity.emMemoria ? "em-memoria" : "",
                entity.emBreve ? "em-breve" : "",
                entity.sectionBreak ? "section-break" : ""
            ].filter(Boolean).join(" ");

            return `<li${li ? ` class="${li}"` : ""}>
                <div class="row">${nameHtml}<span class="role">${esc(entity.role || "")}</span></div>
                <div class="card"><div class="card-inner">
                    <div class="card-left">${profileBlock}${membrosHtml}${seeMore}</div>
                    <div class="card-right">${servicosBtn}${servicosPopover}</div>
                </div></div>
            </li>`;
        }).join("");

        document.body.innerHTML = `
            ${siteHeader()}
            <main class="main">
                <h1 class="statement">Arte Longa é:</h1>
                <ul class="roster">${rows}</ul>
                <p class="socio-legend"><span class="socio-mark">*</span> sócio · sempre em expansão</p>
                <div class="coda"><span class="when">01.04.2026</span></div>
                ${ctaLead({
                    title: "Participe",
                    body: "Faça parte da rede.",
                    id: "parceiros"
                }, "Entrar →")}
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

        // Ver mais para lista de membros de comunidade
        document.querySelectorAll(".membros-more-btn").forEach(btn => {
            const list = btn.previousElementSibling; // .card-membros
            const more = btn.dataset.more;
            btn.addEventListener("click", e => {
                e.stopPropagation();
                const expanded = list.classList.toggle("membros-expanded");
                btn.textContent = expanded ? "ver menos" : `ver mais (+${more})`;
            });
        });

        wirePopover(".roster > li");
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

                <p class="intro">Serviços são compostos em <a href="/solucoes/">Soluções</a>.</p>

                <div class="section-header"><h2>Portfólio</h2><span class="label">clique para abrir · hover revela sub-serviços</span></div>
                <div class="controls"><input type="search" id="search" placeholder="Buscar serviço…" autocomplete="off"></div>
                <div class="count" id="count"></div>
                <ul class="portfolio-list" id="portfolio-list"></ul>

                ${ctaLead({
                    title: "Anuncie",
                    body: "Participe da Rede.",
                    id: "servicos"
                }, "Entrar →")}

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

        // Renderização em dois modos:
        // 1) Sem busca: mostra apenas serviços top-level (sem parent). Parents com filhos
        //    ganham uma hover-drawer revelando sub-serviços.
        // 2) Com busca: achata toda a hierarquia e mostra resultados com breadcrumb de parent.
        function makeRow(s, { inChildren = false } = {}) {
            const parent = s.parent ? `<span class="portfolio-parent">${esc(s.parent)} ›</span> ` : "";
            const titulo = inChildren ? esc(s.titulo) : `${parent}${esc(s.titulo)}`;
            const childCount = (s.children && s.children.length) || 0;
            const expandable = childCount > 0 && !inChildren ? `<span class="portfolio-expand">+${childCount}</span>` : "";
            const resp = inChildren ? "" : `<div class="portfolio-resp">${esc(respNames(s.responsavel))}</div>`;
            const children = (!inChildren && s.children && s.children.length)
                ? `<ul class="portfolio-children">${s.children.map(ct => {
                    const ch = servicos.find(x => x.titulo === ct);
                    if (!ch) return "";
                    return `<li><a href="/servicos/${esc(ch.slug)}/" class="portfolio-link child-link"><span>${esc(ch.titulo)}</span></a></li>`;
                  }).join("")}</ul>`
                : "";
            return `<li class="${expandable ? 'has-children' : ''}">
                <a href="/servicos/${esc(s.slug)}/" class="portfolio-link">
                    <div class="portfolio-titulo">${titulo}${expandable}</div>
                    ${resp}
                </a>
                ${children}
            </li>`;
        }

        function render() {
            const q = norm(searchEl.value);
            let filtered;
            if (q) {
                filtered = servicos.filter(s => norm(s.titulo).includes(q) || norm(respNames(s.responsavel)).includes(q) || (s.parent && norm(s.parent).includes(q)));
                countEl.textContent = `${filtered.length} de ${servicos.length} serviços`;
            } else {
                filtered = servicos.filter(s => !s.parent);
                countEl.textContent = `${filtered.length} serviços · ${servicos.length - filtered.length} sub-serviços`;
            }
            if (!filtered.length) {
                listEl.innerHTML = `<li class="empty-state">Nenhum serviço encontrado.</li>`;
                return;
            }
            listEl.innerHTML = filtered.map(s => makeRow(s, { inChildren: !!q })).join("");
        }

        const urlQ = new URLSearchParams(location.search).get("q");
        if (urlQ) searchEl.value = urlQ;
        searchEl.addEventListener("input", render);
        render();
    }

    // ─── MISSION COMPONENTS ──────────────────────────────────────────────────
    function missionCard(m, depth = 0) {
        const subs = AL.subMissionsOf(m.handle);
        const sub = m.subtitle ? `<span class="missao-subtitle">${esc(m.subtitle)}</span>` : "";
        const attach = m.attachments && m.attachments.length
            ? `<ul class="missao-attach">${m.attachments.map(a =>
                `<li><a href="${esc(a.url)}" target="_blank" rel="noopener"><span class="att-kind">${esc((a.kind || "arquivo").toUpperCase())}</span> ${esc(a.label)} →</a></li>`).join("")}</ul>`
            : "";
        const children = subs.length
            ? `<ul class="missao-children">${subs.map(s => missionCard(s, depth + 1)).join("")}</ul>`
            : "";
        const envolvidos = m.envolvidos && m.envolvidos.length
            ? `<div class="missao-envolvidos">com ${m.envolvidos.map(h => {
                const p = AL.get(h);
                return p ? `<a href="/${esc(h)}/">${esc(p.nome)}</a>` : esc(h);
              }).join(", ")}</div>`
            : "";
        // Serviços que realizam a missão — link direto pra página de cada serviço
        const servicos = m.servicos && m.servicos.length
            ? `<div class="missao-servicos">
                 <span class="missao-servicos-label">Realizada por</span>
                 <ul class="missao-servicos-list">${m.servicos.map(titulo => {
                    const s = AL.serviceByTitle(titulo);
                    return s
                        ? `<li><a href="/servicos/${esc(s.slug)}/">${esc(titulo)}</a></li>`
                        : `<li>${esc(titulo)}</li>`;
                 }).join("")}</ul>
               </div>`
            : "";
        return `<li class="missao-card depth-${depth}">
            <div class="missao-head">
                <span class="missao-nome">${esc(m.nome)}</span>
                ${sub}
            </div>
            ${m.objetivo ? `<p class="missao-objetivo">${esc(m.objetivo)}${m.objetivoAutor ? ` <cite class="missao-autor">— <a href="/${esc(m.objetivoAutor)}/">${esc((AL.get(m.objetivoAutor) || {}).nome || m.objetivoAutor)}</a></cite>` : ""}</p>` : ""}
            ${servicos}
            ${envolvidos}
            ${attach}
            ${children}
        </li>`;
    }

    function renderMissionsSection() {
        const missoes = AL.topLevelMissions();
        if (!missoes.length) return "";

        // Agrupa por comunidade, exceto quando displayAtRoot=true (mostra no topo sem agrupamento)
        const rootLevel = missoes.filter(m => m.displayAtRoot);
        const byComunidade = new Map();
        for (const m of missoes) {
            if (m.displayAtRoot) continue;
            const key = m.comunidade || "_";
            if (!byComunidade.has(key)) byComunidade.set(key, []);
            byComunidade.get(key).push(m);
        }

        let html = `<div class="section-header"><h2>Missões</h2></div>`;
        html += `<p class="intro">Missões são comunidades com objetivos em comum.</p>`;

        if (rootLevel.length) {
            html += `<ul class="missoes-group">${rootLevel.map(m => missionCard(m)).join("")}</ul>`;
        }
        for (const [comunidadeHandle, list] of byComunidade) {
            const c = AL.get(comunidadeHandle);
            const head = c
                ? `<div class="missoes-comunidade-head"><span class="c-label">Comunidade</span><a class="c-link" href="/${esc(c.handle)}/">${esc(c.nome)}</a></div>`
                : "";
            html += head + `<ul class="missoes-group">${list.map(m => missionCard(m)).join("")}</ul>`;
        }
        return html;
    }

    // ─── PAGE: SOLUCOES ──────────────────────────────────────────────────────
    function renderSolucoes() {
        const renderCard = (s) => {
            const urlAttrs = s.internalLink ? "" : ` target="_blank" rel="noopener"`;
            const urlArrow = s.internalLink ? "ver →" : "acessar →";

            const isCatalog = s.bundledServices === "*";
            const rawTitles = isCatalog ? [] : (s.bundledServices || []);
            const expanded = rawTitles.length ? expandTitlesForPopover(rawTitles) : [];
            const hasServicos = isCatalog || expanded.length > 0;
            const svcCount = isCatalog ? "catálogo" : expanded.length;
            const svcBtn = hasServicos
                ? `<button type="button" class="ver-servicos-btn" aria-expanded="false">Ver serviços (${svcCount}) →</button>`
                : "";
            const svcListHtml = isCatalog
                ? `<li><a href="/servicos/">Catálogo completo →</a></li>`
                : renderPopoverList(expanded);
            const svcPopover = hasServicos
                ? `<div class="servicos-popover" role="dialog" aria-label="Serviços de ${esc(s.nome)}">
                    <div class="servicos-popover-head">Serviços · ${esc(s.nome)}</div>
                    <ul class="servicos-popover-list">${svcListHtml}</ul>
                   </div>`
                : "";

            const pergunta = s.respostaChave
                ? `<div class="solucao-pergunta${s.pergunta ? "" : " resposta-solo"}">${s.pergunta ? `<span class="q">${esc(s.pergunta)}</span> ` : ""}<strong class="a">${esc(s.respostaChave)}</strong></div>`
                : "";
            const lema = s.lema ? `<div class="solucao-lema">${esc(s.lema)}</div>` : "";
            // descLong: parágrafos extras (ex.: Shandara), renderizados após desc.
            const descLong = s.descLong
                ? s.descLong.split(/\n\s*\n/).map(p => `<p class="solucao-desc-long">${esc(p)}</p>`).join("")
                : "";
            return `<li class="solucao" id="${esc(s.handle)}">
                <div class="solucao-head">
                    <a class="solucao-nome" href="${esc(s.url)}"${urlAttrs}>${esc(s.nome)} <span class="arrow">${urlArrow}</span></a>
                    <span class="solucao-tagline">${esc(s.tagline)}</span>
                </div>
                <span class="solucao-url">${esc(s.urlLabel)}</span>
                ${pergunta}
                ${lema}
                <p class="solucao-desc">${esc(s.desc)}</p>
                ${descLong}
                <ul class="platforms solucao-platforms">${s.platforms.map(platformItem).join("")}</ul>
                <div class="solucao-actions">${svcBtn}${svcPopover}</div>
            </li>`;
        };

        // Três blocos: Universos ativos, Universos futuros (Futuro), Parcerias e produtos.
        const universosAtivos  = AL.solutions.filter(s => s.universo  && s.lifecycle === "active");
        const universosFuturos = AL.solutions.filter(s => s.universo  && s.lifecycle === "futuro");
        const parcerias        = AL.solutions.filter(s => !s.universo);

        const sectionHtml = (title, hint, list, extraClass) => list.length
            ? `<section class="solucoes-section ${extraClass || ""}">
                <h2 class="solucoes-section-title">${esc(title)}${hint ? ` <span class="solucoes-section-hint">${esc(hint)}</span>` : ""}</h2>
                <ul class="solucoes-list">${list.map(renderCard).join("")}</ul>
              </section>`
            : "";

        document.body.innerHTML = `
            ${siteHeader()}
            <main class="main">
                <h1 class="page-title">Soluções</h1>
                <div class="page-subtitle">Arte Longa · Universos</div>
                <p class="intro">Cada Universo é um conjunto vivo de serviços — um caminho próprio.</p>

                ${sectionHtml("Universos ativos", "em produção", universosAtivos)}
                ${sectionHtml("Futuro", "Universos em desenvolvimento", universosFuturos, "solucoes-futuro")}
                ${sectionHtml("Parcerias e produtos", "", parcerias)}

                ${universosDiagram()}

                ${renderMissionsSection()}

                ${ctaLead({
                    title: "Construa uma solução",
                    body: "Da ideia ao lançamento.",
                    id: "solucoes"
                }, "Compartilhe →")}

                <a class="back" href="/">← voltar</a>
            </main>
            ${modalContact("contact-modal", "Vamos construir?")}
        `;

        wirePopover(".solucao");
        wireModal("contact-modal", '[data-cta="solucoes"]');
    }

    // Diagrama do conceito de Universos paralelos: usuário → auth gate → stack
    // de universos (só o topo visível) + auto-management interno + conectividade.
    function universosDiagram() {
        return `<section class="universos-diagram-section">
            <h2 class="solucoes-section-title">Arquitetura</h2>
            <p class="intro universos-diagram-intro">Um portal único, vários Universos paralelos. Auth no centro, gestão automática e conectividade entre nós.</p>
            <svg class="universos-diagram" viewBox="0 0 720 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Diagrama: usuário → auth → universos paralelos">
              <defs>
                <marker id="ud-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto">
                  <path d="M 0 0 L 10 5 L 0 10 Z" fill="#222"/>
                </marker>
                <marker id="ud-arrow-light" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 0 L 10 5 L 0 10 Z" fill="#999"/>
                </marker>
              </defs>

              <!-- USER -->
              <g transform="translate(60,150)">
                <circle r="22" fill="#fff" stroke="#222" stroke-width="2"/>
                <circle cy="-6" r="6" fill="#222"/>
                <path d="M -10 6 Q 0 18 10 6" fill="none" stroke="#222" stroke-width="2"/>
                <text y="50" text-anchor="middle" font-size="11" fill="#666" letter-spacing="0.1em">VOCÊ</text>
              </g>

              <line x1="92" y1="150" x2="200" y2="150" stroke="#222" stroke-width="1.5" marker-end="url(#ud-arrow)"/>

              <!-- AUTH GATE -->
              <g transform="translate(240,150)">
                <rect x="-30" y="-30" width="60" height="60" rx="6" fill="#fff" stroke="#222" stroke-width="2"/>
                <rect x="-12" y="-4" width="24" height="20" rx="2" fill="none" stroke="#222" stroke-width="2"/>
                <path d="M -8 -4 V -12 Q -8 -22 0 -22 Q 8 -22 8 -12 V -4" fill="none" stroke="#222" stroke-width="2"/>
                <text y="50" text-anchor="middle" font-size="11" fill="#666" letter-spacing="0.1em">AUTH</text>
              </g>

              <line x1="270" y1="150" x2="370" y2="150" stroke="#222" stroke-width="1.5" marker-end="url(#ud-arrow)"/>

              <!-- STACK OF UNIVERSES (offset, only top is highlighted) -->
              <g transform="translate(420,80)">
                <rect x="20" y="40" width="220" height="60" rx="4" fill="#f5f5f5" stroke="#ddd" stroke-width="1"/>
                <rect x="14" y="28" width="220" height="60" rx="4" fill="#f0f0f0" stroke="#ccc" stroke-width="1"/>
                <rect x="8"  y="16" width="220" height="60" rx="4" fill="#e8e8e8" stroke="#bbb" stroke-width="1"/>
                <rect x="0"  y="0"  width="220" height="60" rx="4" fill="#fff"   stroke="#222" stroke-width="2"/>
                <text x="110" y="34" text-anchor="middle" font-size="13" font-weight="600" fill="#222">Universo (visível)</text>
                <text x="110" y="50" text-anchor="middle" font-size="11" fill="#777">os outros aguardam em paralelo</text>
                <text x="110" y="135" text-anchor="middle" font-size="11" fill="#666" letter-spacing="0.1em">UNIVERSOS PARALELOS</text>
              </g>

              <!-- CONNECTIVITY (curved, between universes) -->
              <path d="M 510 200 C 470 240, 590 240, 550 200" fill="none" stroke="#999" stroke-width="1" stroke-dasharray="3,3" marker-end="url(#ud-arrow-light)"/>
              <text x="530" y="265" text-anchor="middle" font-size="10" fill="#999" letter-spacing="0.08em">CONECTIVIDADE ENTRE NÓS</text>

              <!-- AUTO MANAGEMENT (loop) -->
              <path d="M 240 90 C 230 70, 250 70, 240 90" fill="none" stroke="#999" stroke-width="1" stroke-dasharray="2,3"/>
              <path d="M 240 60 Q 260 50 270 70" fill="none" stroke="#999" stroke-width="1" marker-end="url(#ud-arrow-light)"/>
              <text x="240" y="40" text-anchor="middle" font-size="10" fill="#999" letter-spacing="0.08em">AUTO-MANAGEMENT INTERNO</text>
            </svg>
        </section>`;
    }

    // Popover "Ver serviços" — clicar toggla; clique fora ou Esc fecha.
    // Usado em /parceiros/ (host = .roster > li) e em /solucoes/ (host = .solucao).
    function wirePopover(hostSelector) {
        const hosts = () => document.querySelectorAll(hostSelector + ".servicos-open");
        const closeAll = () => {
            hosts().forEach(h => {
                h.classList.remove("servicos-open");
                const btn = h.querySelector(".ver-servicos-btn");
                if (btn) btn.setAttribute("aria-expanded", "false");
            });
        };
        document.querySelectorAll(hostSelector + " .ver-servicos-btn").forEach(btn => {
            btn.addEventListener("click", e => {
                e.stopPropagation();
                const host = btn.closest(hostSelector);
                const wasOpen = host.classList.contains("servicos-open");
                closeAll();
                if (!wasOpen) {
                    host.classList.add("servicos-open");
                    btn.setAttribute("aria-expanded", "true");
                }
            });
        });
        document.addEventListener("click", e => {
            if (!e.target.closest(".servicos-popover") && !e.target.closest(".ver-servicos-btn")) {
                closeAll();
            }
        });
        document.addEventListener("keydown", e => {
            if (e.key === "Escape") closeAll();
        });
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
                servicos: p.bundledServices === "*" ? [] : p.bundledServices,
                emBreve: p.platforms && p.platforms.every(pl => pl.status === "wip")
            };
        }

        document.title = `${p.nome} — Arte Longa`;
        document.body.classList.toggle("em-memoria-profile", !!p.emMemoria);

        const { html: counterHtml, tick: tickFn } = counter(p);

        const bioHtmlOut = bioFull(p);
        const emBreveNote = p.emBreve ? `<div class="em-breve-note">Perfil em breve.</div>` : "";
        const emMemoriaNote = p.emMemoria ? `<div class="em-memoria-note"><em>em memória</em></div>` : "";

        const isCommunity = p.type === "community";
        // Label do bloco de serviços — varia por status:
        //   comunidade → Missões · aposentado → Legado · em memória → Legado · ativo → Serviços
        const legadoCase = p.aposentado || p.emMemoria;
        const servicoLabel = isCommunity ? "Missões" : (legadoCase ? "Legado" : "Serviços");
        const servicoHint = isCommunity
            ? "comunidade oferece via serviços"
            : p.emMemoria ? "serviços prestados · em memória"
            : p.aposentado ? "serviços prestados · aposentado"
            : "clique para ver no catálogo";
        // Underage: perfil privado, serviços não aparecem
        const missoesHtml = (p.underage || !p.servicos || !p.servicos.length)
            ? ""
            : `<section class="section missoes-section">
                 <h2>${servicoLabel} <span class="section-hint">${servicoHint}</span></h2>
                 <ul>${p.servicos.map(m => `<li>${missaoLink(m)}</li>`).join("")}</ul>
               </section>`;

        // Ensaios / publicações — estrutura dupla (curto + longo) por item.
        // Títulos e URLs preenchidos à medida que os textos ficam prontos.
        // Enquanto vazios, mostram "em breve" desabilitado.
        let essaysHtml = "";
        if (p.essays && p.essays.length) {
            const allPending = p.essays.every(e => !e.short && !e.long && !e.titulo);
            const items = p.essays.map((e, i) => {
                const num = String(i + 1).padStart(2, "0");
                const tituloHtml = e.titulo
                    ? esc(e.titulo)
                    : `<span class="essay-pending">(título em breve)</span>`;
                const shortHtml = e.short
                    ? `<a href="${esc(e.short)}">curto</a>`
                    : `<span class="essay-pending">curto</span>`;
                const longHtml = e.long
                    ? `<a href="${esc(e.long)}">longo</a>`
                    : `<span class="essay-pending">longo</span>`;
                return `<li>
                    <span class="essay-num">${num}</span>
                    <span class="essay-titulo">${tituloHtml}</span>
                    <span class="essay-formats">${shortHtml} · ${longHtml}</span>
                </li>`;
            }).join("");
            essaysHtml = `<section class="section essays-section">
                <h2>${esc(p.essaysTitle || "Ensaios")} <span class="section-hint">${allPending ? "em breve" : "curto e longo"}</span></h2>
                <ul class="essays-list">${items}</ul>
            </section>`;
        }

        // Citações estruturadas (separadas da bio livre).
        // Schema: { texto, autor?, autorNome?, autorEmBreve?, obra?, data?, url? }
        //   autor (handle)        → link para /<handle>/
        //   autorEmBreve {title}  → link para modal "em breve"
        //   autorNome             → fallback texto puro
        let citacoesHtml = "";
        if (p.citacoes && p.citacoes.length) {
            const items = p.citacoes.map(c => {
                let autorHtml = "";
                const autorEntity = c.autor ? AL.get(c.autor) : null;
                if (autorEntity) {
                    autorHtml = `<a href="/${esc(autorEntity.handle)}/">${esc(autorEntity.nome)}</a>`;
                } else if (c.autorEmBreve) {
                    autorHtml = `<a href="#" class="al-em-breve" data-modal-title="${esc(c.autorEmBreve.title)}" data-modal-body="em breve">${esc(c.autorNome || c.autorEmBreve.title)}</a>`;
                } else if (c.autorNome) {
                    autorHtml = esc(c.autorNome);
                }
                const obraHtml = c.url
                    ? `<a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.obra || c.url)}</a>`
                    : c.obra ? esc(c.obra) : "";
                const parts = [autorHtml, obraHtml, c.data ? esc(c.data) : ""].filter(Boolean);
                return `<blockquote class="citacao">
                    <p class="citacao-texto">${mdInline(c.texto)}</p>
                    <footer class="citacao-attrib">— ${parts.join(", ")}</footer>
                </blockquote>`;
            }).join("");
            citacoesHtml = `<section class="section citacoes-section">
                <h2>Citações</h2>
                ${items}
            </section>`;
        }

        const underageNote = p.underage
            ? `<div class="em-memoria-note"><em>perfil sob responsabilidade parental</em></div>`
            : "";

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

        // Reference-only (ex.: Papa Leão XIII citado em Valores) não tem canal
        // de contato institucional; só bio + link externo para a obra.
        const contactHtml = p.referenceOnly
            ? ""
            : p.site
                ? `<section class="section"><h2>Contato e Parcerias</h2><ul><li><a href="${esc(p.site)}" target="_blank" rel="noopener">${esc(p.site)}</a></li></ul></section>`
                : `<section class="section"><h2>Contato e Parcerias</h2><ul><li><span class="email-display">${REDE_EMAIL}</span></li></ul></section>`;

        // Parcerias recebidas (pro-bono etc.) — só para comunidades
        let parceriasHtml = "";
        if (p.parcerias && p.parcerias.length) {
            parceriasHtml = p.parcerias.map(par => {
                const parceiro = AL.get(par.de);
                const nomeP = parceiro ? parceiro.nome : par.de;
                const contribs = par.contribuicoes.map(c => {
                    const quem = AL.get(c.quem);
                    const link = quem ? `<a href="/${esc(c.quem)}/">${esc(quem.nome)}</a>` : esc(c.quem);
                    return `<li><strong>${link}</strong> — ${esc(c.oque)}</li>`;
                }).join("");
                return `<section class="section parceria-section">
                    <h2>Parceria · ${esc(nomeP)} <span class="section-hint">${esc(par.tipo)}</span></h2>
                    <p class="parceria-desc">${esc(par.descricao)}</p>
                    <ul class="parceria-contribs">${contribs}</ul>
                </section>`;
            }).join("");
        }

        document.body.innerHTML = `
            ${siteHeader()}
            <main class="main">
                <div class="profile-hero">
                    ${avatarLg(p)}
                    <div>
                        <h1 class="profile-name">${esc(p.nome)}</h1>
                        ${p.role ? `<div class="profile-role">${esc(p.role)}</div>` : ""}
                        ${counterHtml}
                        ${p.bioTitle ? `<h2 class="profile-bio-title">${esc(p.bioTitle)}</h2>` : ""}
                        ${bioHtmlOut}
                    </div>
                </div>
                ${emBreveNote}
                ${emMemoriaNote}
                ${underageNote}
                ${missoesHtml}
                ${citacoesHtml}
                ${essaysHtml}
                ${membrosHtml}
                ${parceriasHtml}
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

        // Missions that use this service (reverse index)
        const missoesDoServico = AL.missionsUsingService(s.titulo);
        const missoesHtml = missoesDoServico.length
            ? `<ul class="service-missoes-list">${missoesDoServico.map(m => {
                const c = AL.get(m.comunidade);
                const subline = c ? `<span class="sol-tagline">comunidade · ${esc(c.nome)}</span>` : "";
                return `<li><a href="/solucoes/#${esc(m.handle)}"><strong>${esc(m.nome)}</strong> ${subline}</a></li>`;
              }).join("")}</ul>`
            : "";

        // Related services (co-occurring in solutions)
        const related = AL.relatedServices(s.titulo);
        const relHtml = related.length
            ? `<ul class="service-related">${related.map(r =>
                `<li><a href="/servicos/${esc(r.slug)}/">${esc(r.titulo)}</a></li>`
            ).join("")}</ul>`
            : "";

        // Prefere descNossa (texto próprio); cai pra summary (compat legado).
        const descText = s.descNossa || s.summary;
        const summaryHtml = descText
            ? `<p class="service-summary">${esc(descText)}</p>`
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

                ${missoesDoServico.length ? `<div class="section-header"><h2>Em missões</h2><span class="label">realiza objetivos de</span></div>${missoesHtml}` : ""}

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

        // Links para soluções que são exemplos concretos do serviço cobrado/prestado.
        // Aparecem enxutos no final de cada linha ("exemplo em: Co, Yggdrasil").
        const solucoesLinks = (handles) => {
            if (!handles || !handles.length) return "";
            const links = handles.map(h => {
                const s = AL.get(h);
                if (!s) return null;
                return `<a class="fin-sol-link" href="/solucoes/#${esc(s.handle)}">${esc(s.nome)}</a>`;
            }).filter(Boolean);
            return links.length ? `<div class="fin-solucoes">exemplo em: ${links.join(" · ")}</div>` : "";
        };

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
                ${solucoesLinks(r.solucoes)}
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
                ${solucoesLinks(r.solucoes)}
            </li>
        `).join("");

        const projetosHtml = f.receita.projetos.map(p => {
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

        const proBonoHtml = f.receita.proBono.map(p => `
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
                <div class="page-subtitle">Arte Longa · modelo de negócio</div>

                <p class="intro">Como a rede se sustenta. Gastos recorrentes, receita potencial e metas de ${esc(f.quarter)}. Página pública, atualizada à medida que avançamos.</p>

                <!-- ──── GASTOS ──── -->
                <div class="section-header"><h2>Gastos recorrentes</h2><span class="label">mensal</span></div>
                <ul class="fin-list">${custosHtml}</ul>
                <div class="fin-total">
                    <span class="fin-total-label">Total mensal</span>
                    <span class="fin-total-value">${fmt(totalCustos)}</span>
                </div>
                <div class="fin-total-secondary">
                    <span>× 3 · ${esc(f.quarter)}</span>
                    <span>${fmt(totalCustos * 3)}</span>
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

                <!-- ──── ALINHAMENTO ──── -->
                <div class="section-header"><h2>Alinhamento</h2><span class="label">${esc(f.quarter)}</span></div>
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
                        <div class="fin-goal-label">Potencial · ${esc(f.quarter)}</div>
                        <div class="fin-goal-value">${short(totalReceitaQ2)}</div>
                        <div class="fin-goal-note">${percentMeta}% da meta · gap ${gap > 0 ? short(gap) : 'zero'}</div>
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
