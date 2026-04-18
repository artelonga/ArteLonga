/* Arte Longa · single source of truth
 *
 * Entity shapes share a base { id, type, nome, tags, pic, bio }.
 * Discriminator is `type`. Add new types (post, event, photo, ...) the same way.
 *
 * Relationships are expressed via handle references (strings), not object nesting,
 * so the graph stays flat and serializable.
 */
(function (global) {
    "use strict";

    // ─── PEOPLE ──────────────────────────────────────────────────────────────
    const people = [
        {
            handle: "yuri", type: "person", nome: "Yuri",
            role: "Sementes", tags: ["fundador", "parceiro"],
            pic: "/yuri/yuri.jpg",
            birthDate: "1993-06-24T12:30:00-03:00",
            bio: "",
            missoes: ["Escrita, Interpretação e Tradução", "Ensino, Formação e Liderança", "Inteligência e Tecnologia", "Gestão Executiva"],
            subMembers: ["kiyoshi", "soninha"]
        },
        {
            handle: "igo", type: "person", nome: "Igo",
            role: "Resistência", tags: ["fundador", "parceiro"],
            pic: null, bio: "",
            missoes: ["Gestão Operacional", "Rede de parcerias"]
        },
        {
            handle: "jose", type: "person", nome: "José Antônio",
            nomeCompleto: "José Antônio Corral Dias",
            role: "Recursos", tags: ["fundador", "parceiro"],
            pic: "/jose/jose-antonio.jpg",
            birthDate: "1957-03-15",
            bioCurta: "Empresário, palestrante e estudioso da consciência humana. Nascido em março de 1957, construiu sua trajetória a partir de origens humildes. Autor de Esperança — uma utopia possível (2024).",
            bio: "Empresário, palestrante e estudioso da consciência humana.\n\nNascido em março de 1957, pai de quatro filhos, duas enteadas e avô de uma neta, José Antônio Corral Dias construiu sua trajetória a partir de origens humildes. Proveniente de uma família desestruturada e muito pobre, começou a trabalhar aos 13 anos e, aos 14, deixou os estudos formais antes de concluir o antigo ginasial, movido pela necessidade e por um espírito naturalmente questionador.\n\nIngressou cedo no mercado de trabalho formal como office-boy e, em pouco tempo, tornou-se auxiliar de escritório, acumulando sólida experiência em rotinas administrativas, fiscais e financeiras. No final da década de 1970, já pai de dois filhos, migrou para a área comercial, atuando em vendas em diferentes setores até se estabelecer no segmento têxtil, onde permaneceu por cerca de 20 anos, inclusive como sócio de lojas de vestuário masculino.\n\nPouco antes da virada do século, iniciou atuação no setor de materiais gráficos especiais e embalagens, em parceria com empresários de Taiwan ligados a grandes corporações internacionais, como a Nan Ya e a K. Laser Group. Desde então, trabalha no desenvolvimento de produtos e tecnologias para embalagens, comunicação visual, rótulos, etiquetas e filmes autoadesivos.\n\nEm 2013, ampliou sua atuação empresarial ao fundar uma empresa voltada à prestação de serviços de pintura predial para o setor corporativo.\n\nEstudioso da espiritualidade e da consciência humana há mais de três décadas, dedica-se ao voluntariado e ao trabalho assistencial, ministrando palestras e cursos voltados ao desenvolvimento humano.\n\nEm novembro de 2024, publicou seu primeiro livro de ficção, Esperança — uma utopia possível, obra que sintetiza sua visão humanista e sua crença na transformação do indivíduo e da sociedade.",
            missoes: ["Gestão administrativa", "Gestão financeira"]
        },
        {
            handle: "mono", type: "person", nome: "Mono",
            role: "Segurança", tags: ["fundador", "parceiro"],
            pic: null, bio: "",
            missoes: ["Consultoria em TI", "Privacidade e segurança digital"]
        },
        {
            handle: "bruna", type: "person", nome: "Bruna",
            role: "Comunicação", tags: ["fundador", "parceiro"],
            pic: "/bruna/bruna.jpeg",
            bioCurta: "Sou uma pessoa prática, criativa e muito orientada a resolver problemas. Minha trajetória começou com produção de eventos, até chegar no nicho da comédia stand-up, sempre curiosa sobre tudo, aprendi diversas áreas da produção e também da comunicação, o que me deu jogo de cintura e a capacidade de me conectar com diferentes públicos de forma leve e autêntica.",
            bio: "Sou uma pessoa prática, criativa e muito orientada a resolver problemas. Minha trajetória começou com produção de eventos, até chegar no nicho da comédia stand-up, sempre curiosa sobre tudo, aprendi diversas áreas da produção e também da comunicação, o que me deu jogo de cintura e a capacidade de me conectar com diferentes públicos de forma leve e autêntica.\n\nMas antes de ser profissional, também me tornei mãe de uma criança linda albina, o que trouxe ainda mais responsabilidade, sensibilidade e força para tudo que faço. Essa vivência impacta diretamente a forma como enxergo o mundo e, consequentemente, como me posiciono profissionalmente. Com o tempo, fui evoluindo e direcionando minhas habilidades para o marketing e social media, hoje atuando com foco em projetos como a Arte Longa. Gosto de transformar ideias em algo concreto, construir presença digital e pensar estrategicamente na comunicação, sempre buscando resultado sem perder a identidade.\n\nAprendo rápido, sou curiosa e não tenho medo de testar, ajustar e melhorar no processo. Sei me virar, faço acontecer e acredito que dá pra levar o trabalho a sério sem deixar de ser leve, humana e engraçadinha.",
            missoes: ["Comunicação visual", "Criação de conteúdo", "Marketing digital"],
            subMembers: ["alicia"]
        },
        {
            handle: "luke", type: "person", nome: "Luke",
            role: "Experiência", tags: ["parceiro"],
            pic: "/luke/luke.jpeg",
            bioCurta: "Entusiasta de RPG há cerca de 10 anos, apaixonado por jogos narrativos. Hoje atua como mestre, desenvolvendo um universo próprio onde aplica e testa diferentes ideias narrativas e mecânicas.",
            bio: "Sou Luke, entusiasta de RPG, apaixonado por jogos narrativos e jogo RPG há cerca de 10 anos.\n\nAmo como os designs de RPGs podem influenciar a experiência dos jogadores e gosto de explorar e acompanhar o cenário, sempre buscando entender como mecânicas, narrativa e criatividade se conectam.\n\nExploro novos sistemas, modelos e abordagens, busco entender diferentes formas de construção de regras e experiências e, quando necessário, adaptar e implementar essas ideias em minhas mesas.\n\nUtilizo como base sistemas como D&D, Tormenta 20 e 3D&T, além de mecânicas adaptadas e conteúdos desenvolvidos pela comunidade no estilo homebrew.\n\nHoje atuo como mestre, explorando a condução de histórias e a criação de experiências para os jogadores. Como parte desse processo, desenvolvi um universo próprio, onde aplico e testo diferentes ideias narrativas e mecânicas.",
            missoes: ["Design", "Experiência de usuário (UI/UX)"]
        },
        {
            handle: "karina", type: "person", nome: "Karina",
            role: "Visão", tags: ["parceiro"],
            pic: "/karina/karina.jpeg", bio: "",
            missoes: ["Fotografia"]
        },
        {
            handle: "marina", type: "person", nome: "Marina",
            role: "Cuidado", tags: ["parceiro"],
            pic: null, bio: "",
            missoes: ["Acompanhamento nutricional", "Alfabetização", "Cuidado com o idoso", "Reforço escolar"]
        },
        {
            handle: "kayra", type: "person", nome: "Kayra",
            role: "Expressão", tags: ["parceiro"],
            pic: "/kayra/kayra.jpg", bio: "",
            missoes: ["Modelo", "Consultoria em Moda", "Rede de Talentos"]
        },
        {
            handle: "aime", type: "person", nome: "Aime",
            role: "em breve", tags: ["parceiro", "em-breve"],
            pic: null, bio: "", emBreve: true, muted: true,
            missoes: [],
            subMembers: ["john"]
        },
        {
            handle: "sylvia", type: "person", nome: "Sylvia",
            role: "Consciência", tags: ["parceiro"],
            pic: null, bio: "",
            missoes: ["Meditação", "Autocuidado"]
        },
        {
            handle: "raquel", type: "person", nome: "Raquel",
            role: "Presença", tags: ["parceiro"],
            pic: null, bio: "",
            missoes: ["Saúde Mental", "Terapia Comportamental", "Autocuidado"]
        },
        {
            handle: "rogerio", type: "person", nome: "Rogério",
            role: "Xeramoi", tags: ["parceiro"],
            pic: null, bio: "",
            missoes: ["Mentoria Espiritual", "Resistência dos Povos Originários"]
        },
        {
            handle: "alzira", type: "person", nome: "Alzira",
            role: "Xejaryi", tags: ["parceiro"],
            pic: null, bio: "",
            missoes: ["Mentoria Espiritual", "Resistência dos Povos Originários"]
        },

        // sub-members (shown under a parent profile, not on top-level roster)
        { handle: "alicia", type: "person", nome: "Alicia", role: "", tags: ["parceiro"], pic: null, bio: "", missoes: ["Futuro", "Filha da Bruna"], parentHandle: "bruna" },
        { handle: "john", type: "person", nome: "John", role: "", tags: ["parceiro"], pic: null, bio: "", missoes: ["Futuro", "Filho da Aime"], parentHandle: "aime" },
        { handle: "kiyoshi", type: "person", nome: "Kiyoshi (Shin)", role: "", tags: ["parceiro", "familia"], pic: null, bio: "", missoes: ["Pai do Yuri", "Poeta"], parentHandle: "yuri" },
        {
            handle: "soninha", type: "person", nome: "Soninha", role: "", tags: ["parceiro", "familia", "em-memoria"],
            pic: null, bio: "", emMemoria: true,
            birthDate: "1961-11-01", deathDate: "2025-10-01",
            missoes: ["Mãe do Yuri", "Atriz", "Cantora"],
            parentHandle: "yuri"
        },

        // community members (appear only under community profile, not on landing)
        { handle: "antony", type: "person", nome: "Antony", role: "", tags: ["parceiro"], pic: null, bio: "", missoes: ["Produção Musical"], communities: ["quilomboaraucaria"] },
        { handle: "bia", type: "person", nome: "Bia", role: "", tags: ["parceiro"], pic: null, bio: "", missoes: [], communities: ["quilomboaraucaria"] },
        { handle: "ken", type: "person", nome: "Ken", role: "", tags: ["parceiro"], pic: null, bio: "", missoes: ["Alimentação e Bebidas"], communities: ["quilomboaraucaria"] },
        { handle: "quinho", type: "person", nome: "Quinho", role: "", tags: ["parceiro"], pic: null, bio: "", missoes: ["Artes Visuais", "Grafite", "Murais e Fachadas"], communities: ["quilomboaraucaria"] },
        { handle: "tiao", type: "person", nome: "Tião", role: "", tags: ["parceiro"], pic: null, bio: "", missoes: ["Drywall e Bioconstrução"], communities: ["quilomboaraucaria"] },
        { handle: "veh", type: "person", nome: "Veh", role: "", tags: ["parceiro"], pic: null, bio: "", missoes: ["Alimentação e Bebidas", "Tortas Salgadas da Veh"], communities: ["quilomboaraucaria"] }
    ];

    // ─── COMMUNITIES ─────────────────────────────────────────────────────────
    const communities = [
        {
            handle: "quilomboaraucaria", type: "community", nome: "Quilombo Araucária",
            role: "Terra", tags: ["comunidade", "parceiro"],
            pic: "/quilomboaraucaria/quilomboaraucaria.png", bio: "",
            externalUrl: "https://quilomboaraucaria.org",
            site: "https://quilomboaraucaria.org",
            missoes: ["Desenvolvimento sustentável", "Raízes do futuro", "Resistência dos Povos Originários"],
            membros: ["antony", "bia", "ken", "quinho", "tiao", "veh"],
            sectionBreak: true
        },
        {
            handle: "hfsassociados", type: "community", nome: "HFS Associados",
            role: "Transparência", tags: ["comunidade", "parceiro", "contabilidade"],
            pic: null, bio: "Contabilidade.",
            externalUrl: "https://hfsassociados.com.br/",
            site: "https://hfsassociados.com.br/",
            missoes: ["Gestão Contábil", "Gestão Fiscal", "Consultoria Jurídica"],
            membros: []
        },
        {
            handle: "hedix", type: "community", nome: "Hedix",
            role: "Previsão", tags: ["comunidade", "parceiro"],
            pic: null, bio: "",
            externalUrl: "https://hedix.com.br/",
            site: "https://hedix.com.br/",
            missoes: ["Market Making Preditivo", "Inteligência de Previsão"],
            membros: []
        }
    ];

    // ─── SERVICES ────────────────────────────────────────────────────────────
    // Hidden: personal/family relations that aren't public services
    const hiddenServiceTitles = new Set(["Filha da Bruna", "Filho da Aime", "Pai do Yuri", "Mãe do Yuri"]);

    // CNAE mapping — nosso léxico → léxico oficial (Receita Federal).
    // Baseado no CNPJ 56.975.561/0001-60 (Arte Longa).
    const cnaeMap = {
        "Alfabetização":                            [{ c: "8599-6/99", d: "Outras atividades de ensino não especificadas anteriormente" }],
        "Alimentação e Bebidas":                    [{ c: "5620-1/02", d: "Serviços de alimentação para eventos e recepções — bufê" }],
        "Artes Visuais":                            [{ c: "9002-7/02", d: "Restauração de obras-de-arte" }],
        "Comunicação visual":                       [{ c: "7410-2/03", d: "Design de produto" }, { c: "7319-0/04", d: "Consultoria em publicidade" }],
        "Consultoria em Moda":                      [{ c: "7319-0/04", d: "Consultoria em publicidade" }],
        "Consultoria em TI":                        [{ c: "6204-0/00", d: "Consultoria em tecnologia da informação" }],
        "Criação de conteúdo":                      [{ c: "5911-1/99", d: "Produção cinematográfica, de vídeos e TV" }, { c: "5912-0/99", d: "Pós-produção audiovisual" }],
        "Design":                                   [{ c: "7410-2/03", d: "Design de produto" }],
        "Desenvolvimento Web":                      [{ c: "6201-5/02", d: "Web design" }, { c: "6202-3/00", d: "Desenvolvimento e licenciamento de software customizável" }],
        "Ensino, Formação e Liderança":             [{ c: "8599-6/99", d: "Outras atividades de ensino" }, { c: "8599-6/03", d: "Treinamento em informática" }],
        "Escrita, Interpretação e Tradução":        [{ c: "7490-1/01", d: "Serviços de tradução, interpretação e similares" }, { c: "5811-5/00", d: "Edição de livros" }],
        "Experiência de usuário (UI/UX)":           [{ c: "7410-2/03", d: "Design de produto" }, { c: "6201-5/02", d: "Web design" }],
        "Fotografia":                               [{ c: "7420-0/01", d: "Atividades de produção de fotografias" }, { c: "7420-0/04", d: "Filmagem de festas e eventos" }],
        "Gestão Executiva":                         [{ c: "7319-0/04", d: "Consultoria em publicidade (gestão de rede)" }],
        "Grafite":                                  [{ c: "9002-7/02", d: "Restauração de obras-de-arte (correlato)" }],
        "Inteligência e Tecnologia":                [{ c: "6204-0/00", d: "Consultoria em tecnologia da informação" }, { c: "6319-4/00", d: "Portais, provedores de conteúdo e serviços de informação na internet" }],
        "Marketing digital":                        [{ c: "7319-0/04", d: "Consultoria em publicidade" }],
        "Meditação":                                [{ c: "8599-6/99", d: "Outras atividades de ensino (correlato)" }],
        "Modelo":                                   [{ c: "7319-0/04", d: "Consultoria em publicidade" }],
        "Murais e Fachadas":                        [{ c: "7410-2/03", d: "Design de produto" }, { c: "7319-0/01", d: "Criação de estandes para feiras e exposições" }],
        "Poeta":                                    [{ c: "5811-5/00", d: "Edição de livros" }],
        "Privacidade e segurança digital":          [{ c: "6204-0/00", d: "Consultoria em tecnologia da informação" }],
        "Produção Musical":                         [{ c: "9001-9/02", d: "Produção musical" }, { c: "5920-1/00", d: "Atividades de gravação de som e de edição de música" }],
        "Raízes do futuro":                         [{ c: "8599-6/99", d: "Outras atividades de ensino (projeto educacional)" }],
        "Rede de Talentos":                         [{ c: "7319-0/04", d: "Consultoria em publicidade" }],
        "Reforço escolar":                          [{ c: "8599-6/99", d: "Outras atividades de ensino" }],
        "Tortas Salgadas da Veh":                   [{ c: "5620-1/02", d: "Serviços de alimentação — bufê" }]
    };

    function slugify(s) {
        return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/\(.*?\)/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
    }

    // Extra services that exist in the public catalog but aren't on any profile's
    // missões list (e.g. cross-cutting offerings like "Desenvolvimento Web").
    const extraServices = [
        { titulo: "Desenvolvimento Web", responsavel: ["yuri"] },
        // Consultoria em TI · subseções não-sobrepostas (Yuri, R$ 100/h)
        { titulo: "Data e Storage", responsavel: ["yuri"] },
        { titulo: "Compute", responsavel: ["yuri"] },
        { titulo: "Cloud", responsavel: ["yuri"] },
        { titulo: "Network", responsavel: ["yuri"] },
        { titulo: "Analytics e Growth", responsavel: ["yuri"] },
        { titulo: "API Development", responsavel: ["yuri"] }
    ];

    // Per-service overrides (summaries, attachments). Keyed by service title.
    const serviceOverrides = {
        "Raízes do futuro": {
            summary: "Projeto educacional do Quilombo Araucária. Formação, cultura e pertencimento enraizados na terra — para plantar as próximas gerações.",
            attachments: [
                { label: "Projeto — Raízes do Futuro", url: "/servicos/raizes-do-futuro/projeto.pdf", kind: "pdf" }
            ]
        }
    };

    // Auto-derive services from people.missoes (each unique missão with its responsible people)
    function deriveServices() {
        const byTitle = new Map();
        const all = [...people, ...communities];
        for (const e of all) {
            for (const m of (e.missoes || [])) {
                if (!byTitle.has(m)) byTitle.set(m, { titulo: m, responsavel: [] });
                byTitle.get(m).responsavel.push(e.handle);
            }
        }
        for (const ex of extraServices) {
            if (!byTitle.has(ex.titulo)) byTitle.set(ex.titulo, { titulo: ex.titulo, responsavel: [...ex.responsavel] });
            else {
                const existing = byTitle.get(ex.titulo);
                for (const r of ex.responsavel) if (!existing.responsavel.includes(r)) existing.responsavel.push(r);
            }
        }
        return Array.from(byTitle.values()).sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR"));
    }
    const services = deriveServices();
    // Attach slugs + cnae + overrides to each service
    services.forEach(s => {
        s.slug = slugify(s.titulo);
        s.cnae = cnaeMap[s.titulo] || null;
        const ov = serviceOverrides[s.titulo];
        if (ov) Object.assign(s, ov);
    });

    // ─── SOLUTIONS ───────────────────────────────────────────────────────────
    const solutions = [
        {
            handle: "artelonga", type: "solution", nome: "Arte Longa",
            tagline: "Rede Social Profissional",
            url: "https://artelonga.com.br", urlLabel: "artelonga.com.br",
            desc: "A rede. Conjunto de parceiros, serviços e soluções que formam a Arte Longa.",
            bundledServices: "*", // all services
            platforms: [
                { name: "Web", status: "done", statusText: "disponível" },
                { name: "Mobile / App", status: "wip", statusText: "Q2 2026 · em desenvolvimento" }
            ]
        },
        {
            handle: "co", type: "solution", nome: "Co",
            tagline: "Rede Social Colaborativa",
            url: "https://co-artelonga-uat.fly.dev/", urlLabel: "co-artelonga-uat.fly.dev",
            desc: "Plataforma de gestão coletiva para coletivos, quilombos e organizações. Membros, missões, quadro e jardim em um só lugar.",
            bundledServices: ["Desenvolvimento Web", "Inteligência e Tecnologia", "Gestão Executiva", "Gestão Operacional", "Experiência de usuário (UI/UX)"],
            platforms: [
                { name: "Web", status: "done", statusText: "disponível" },
                { name: "Mobile / App", status: "wip", statusText: "Q2 2026 · em desenvolvimento" }
            ]
        },
        {
            handle: "quilomboaraucaria-solution", type: "solution", nome: "Quilombo Araucária",
            tagline: "Rede Social Ambiental",
            url: "https://quilomboaraucaria.org", urlLabel: "quilomboaraucaria.org",
            desc: "Plataforma comunitária para desenvolvimento sustentável, educação e resistência dos povos originários.",
            bundledServices: ["Desenvolvimento sustentável", "Raízes do futuro", "Resistência dos Povos Originários", "Desenvolvimento Web", "Artes Visuais", "Grafite", "Murais e Fachadas"],
            platforms: [
                { name: "Web", status: "done", statusText: "disponível" },
                { name: "Mobile / App", status: "wip", statusText: "Q2 2026 · em desenvolvimento" }
            ]
        },
        {
            handle: "yggdrasil", type: "solution", nome: "Yggdrasil",
            tagline: "Rede Social para Jogos",
            url: "/yggdrasil/", urlLabel: "lançamento · junho 2026",
            internalLink: true,
            desc: "Plataforma de desenvolvimento de jogos (game engine) com foco colaborativo. Uma rede social onde criadores, jogadores e mundos convergem.",
            bundledServices: ["Desenvolvimento Web", "Inteligência e Tecnologia", "Design", "Experiência de usuário (UI/UX)", "Produção Musical"],
            platforms: [
                { name: "Web", status: "wip", statusText: "junho 2026" },
                { name: "Mobile / App", status: "wip", statusText: "junho 2026" }
            ]
        }
    ];

    // ─── INDEXES / LOOKUPS ───────────────────────────────────────────────────
    const all = [...people, ...communities, ...solutions];
    const byHandle = Object.fromEntries(all.map(e => [e.handle, e]));

    function get(handle) { return byHandle[handle]; }

    function isEmMemoria(handle) {
        const e = get(handle);
        return !!(e && e.emMemoria);
    }

    function publicServices() {
        return services.filter(s => {
            if (hiddenServiceTitles.has(s.titulo)) return false;
            if (s.responsavel.some(h => isEmMemoria(h))) return false;
            return true;
        });
    }

    // Roster = what shows on /parceiros/ (top-level people + communities in this order)
    // Order is explicit (the editorial layout).
    const rosterOrder = [
        "yuri", "igo", "jose", "mono", "bruna",
        "luke", "karina", "marina", "kayra", "aime",
        "sylvia", "raquel", "rogerio", "alzira",
        "quilomboaraucaria", "hfsassociados", "hedix"
    ];
    function roster() {
        return rosterOrder.map(h => get(h)).filter(Boolean);
    }

    // Members in a community (full entities, em_memoria excluded by default)
    function membersOf(communityHandle, { includeEmMemoria = false } = {}) {
        const c = get(communityHandle);
        if (!c || !c.membros) return [];
        return c.membros
            .map(h => get(h))
            .filter(m => m && (includeEmMemoria || !m.emMemoria));
    }

    // Sub-members of a person (like Alicia under Bruna, John under Aime)
    function subMembersOf(personHandle) {
        const p = get(personHandle);
        if (!p || !p.subMembers) return [];
        return p.subMembers.map(h => get(h)).filter(Boolean);
    }

    // Services resolved for a solution
    function bundledServices(solutionHandle) {
        const s = get(solutionHandle);
        if (!s) return [];
        if (s.bundledServices === "*") return publicServices();
        const map = Object.fromEntries(services.map(x => [x.titulo, x]));
        return s.bundledServices.map(t => map[t]).filter(Boolean);
    }

    function serviceBySlug(slug) { return services.find(s => s.slug === slug); }
    function serviceByTitle(titulo) { return services.find(s => s.titulo === titulo); }

    function solutionsUsingService(titulo) {
        return solutions.filter(sol =>
            sol.bundledServices === "*" ||
            (Array.isArray(sol.bundledServices) && sol.bundledServices.includes(titulo))
        );
    }

    // Given a service title, find other services commonly bundled alongside (in solutions)
    function relatedServices(titulo) {
        const sols = solutionsUsingService(titulo).filter(s => s.bundledServices !== "*");
        const counts = new Map();
        for (const sol of sols) {
            for (const other of sol.bundledServices) {
                if (other !== titulo) counts.set(other, (counts.get(other) || 0) + 1);
            }
        }
        return [...counts.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([t]) => services.find(s => s.titulo === t))
            .filter(Boolean);
    }

    // ─── FINANCES ────────────────────────────────────────────────────────────
    // Mensal recurring + metas trimestrais. Editado manualmente aqui.
    const finances = {
        currency: "BRL",
        quarter: "Q2 2026",
        metaMensal: 25000,
        metaQ2: 75000,

        // Gastos recorrentes mensais. Total = R$ 25.000.
        custos: [
            {
                key: "socios",
                label: "Sócios · pro labore",
                value: 14000,
                detail: "7 pessoas × R$ 2.000",
                breakdown: [
                    { label: "Yuri", value: 2000, handle: "yuri" },
                    { label: "Igo", value: 2000, handle: "igo" },
                    { label: "José Antônio", value: 2000, handle: "jose" },
                    { label: "Mono", value: 2000, handle: "mono" },
                    { label: "Bruna", value: 2000, handle: "bruna" },
                    { label: "Luke", value: 2000, handle: "luke" },
                    { label: "Marina", value: 2000, handle: "marina" }
                ]
            },
            {
                key: "contabilidade",
                label: "Contabilidade",
                value: 1612,
                detail: "1 salário mínimo · coberto pela receita de API Development (Hedix)"
            },
            {
                key: "operacional",
                label: "Despesas operacionais",
                value: 1388,
                breakdown: [
                    { label: "Produtos", value: 500 },
                    { label: "Serviços", value: 888 }
                ]
            },
            {
                key: "coworking",
                label: "Coworking · escritório",
                value: 3000
            },
            {
                key: "infra",
                label: "Armazenamento e computação",
                value: 2000
            },
            {
                key: "impacto",
                label: "Impacto ambiental, social e cultural",
                value: 3000,
                detail: "investimento ativo em rede — também via trabalho pro-bono"
            }
        ],

        // Receita potencial Q2 2026. Misto de recorrente + rampa + projetos.
        receita: {
            recorrenteMensal: [
                {
                    label: "API Development",
                    client: "Hedix",
                    detail: "16,12 h/mês × R$ 100/h — cobre a contabilidade",
                    responsavel: "yuri",
                    mensal: 1612
                },
                {
                    label: "Consultoria em TI (outros clientes)",
                    detail: "23,88 h/mês × R$ 100/h (40h/mês total, menos Hedix)",
                    responsavel: "yuri",
                    mensal: 2388
                },
                {
                    label: "Criação de conteúdo",
                    detail: "1 job fixo / mês",
                    responsavel: "bruna",
                    mensal: 1000
                }
            ],
            rampa: [
                {
                    label: "Market Making (Hedix)",
                    client: "Hedix",
                    detail: "prediction markets — rampa de crescimento",
                    responsavel: "yuri",
                    meses: [
                        { mes: "abril", value: 1000 },
                        { mes: "maio", value: 5000 },
                        { mes: "junho", value: 10000 }
                    ]
                }
            ],
            projetos: [
                {
                    label: "Website estático",
                    detail: "3 × R$ 5.000",
                    unitValue: 5000,
                    unidades: 3,
                    responsavel: "yuri"
                },
                {
                    label: "Website dinâmico",
                    detail: "1 projeto",
                    unitValue: 15000,
                    unidades: 1,
                    responsavel: "yuri"
                },
                {
                    label: "Interpretação e Tradução",
                    detail: "2 jobs × R$ 2.000/dia",
                    unitValue: 2000,
                    unidades: 2,
                    responsavel: "yuri"
                },
                {
                    label: "Consultoria avulsa",
                    detail: "10 h × R$ 100/h (no trimestre)",
                    unitValue: 100,
                    unidades: 10,
                    responsavel: "yuri"
                }
            ],
            // Pro-bono · não conta como receita mas é parte da atuação
            proBono: [
                {
                    label: "Desenvolvimento Web — Quilombo Araucária",
                    detail: "portfolio institucional · impacto social, ambiental e cultural",
                    responsavel: "yuri"
                }
            ]
        }
    };

    global.AL = {
        version: "1.0",
        people, communities, services, solutions, rosterOrder, finances,
        get, byHandle, isEmMemoria,
        publicServices, roster, membersOf, subMembersOf, bundledServices,
        hiddenServiceTitles, slugify,
        serviceBySlug, serviceByTitle, solutionsUsingService, relatedServices
    };
})(window);
