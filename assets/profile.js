(function () {
    const p = window.PROFILE;
    if (!p) return;

    const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const initial = s => (s || "?").trim()[0].toUpperCase();

    document.title = `${p.nome} — Arte Longa`;

    const avatarContent = p.pic
        ? `<img src="${esc(p.pic)}" alt="${esc(p.nome)}">`
        : esc(initial(p.nome));

    const bioParagraphs = p.bio
        ? String(p.bio).split(/\n\s*\n/).map(s => s.trim()).filter(Boolean)
        : [];
    const bioHtml = bioParagraphs.length
        ? bioParagraphs.map(para => `<p class="profile-bio">${esc(para)}</p>`).join("")
        : `<p class="profile-bio empty">Biografia em breve.</p>`;

    const missoesHtml = p.missoes && p.missoes.length
        ? `<section class="section">
             <h2>Missões</h2>
             <ul>${p.missoes.map(m => `<li>${esc(m)}</li>`).join("")}</ul>
           </section>`
        : "";

    const membrosHtml = p.membros && p.membros.length
        ? `<section class="section">
             <h2>Membros</h2>
             <ul>${p.membros.map(m => `<li><a href="/${esc(m.handle)}/">${esc(m.nome)}</a></li>`).join("")}</ul>
           </section>`
        : "";

    const comunidadesHtml = p.comunidades && p.comunidades.length
        ? `<section class="section">
             <h2>Comunidades</h2>
             <ul>${p.comunidades.map(c => `<li><a href="/${esc(c.handle)}/">${esc(c.nome)}</a></li>`).join("")}</ul>
           </section>`
        : "";

    const emBreveNote = p.emBreve
        ? `<div class="em-breve-note">Perfil em breve.</div>`
        : "";

    const contactHtml = p.site
        ? `<section class="section">
             <h2>Contato</h2>
             <ul><li><a href="${esc(p.site)}" target="_blank" rel="noopener">${esc(p.site)}</a></li></ul>
           </section>`
        : `<section class="section">
             <h2>Contato</h2>
             <ul><li><a href="mailto:yuri@artelonga.com.br">yuri@artelonga.com.br</a></li></ul>
           </section>`;

    document.body.innerHTML = `
        <header class="site-header">
          <div class="site-header-inner">
            <a class="site-brand" href="/"><img src="/logo-al.png" alt="Arte Longa"></a>
            <span class="site-tagline">semeando sonhos</span>
          </div>
        </header>
        <main class="main">
          <div class="profile-hero">
            <div class="avatar">${avatarContent}</div>
            <div>
              <h1 class="profile-name">${esc(p.nome)}</h1>
              ${p.role ? `<div class="profile-role">${esc(p.role)}</div>` : ""}
              ${bioHtml}
            </div>
          </div>
          ${emBreveNote}
          ${missoesHtml}
          ${membrosHtml}
          ${comunidadesHtml}
          ${contactHtml}
          <a class="back" href="/">← voltar</a>
        </main>
    `;
})();
