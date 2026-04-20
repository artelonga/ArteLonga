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
            servicos: ["Escrita, Interpretação e Tradução", "Ensino, Formação e Liderança", "Inteligência e Tecnologia", "Gestão Executiva"],
            subMembers: ["kiyoshi", "soninha"]
        },
        {
            handle: "igo", type: "person", nome: "Igo",
            role: "Resistência", tags: ["fundador", "parceiro"],
            pic: null, bio: "",
            servicos: ["Gestão Operacional", "Conexões"]
        },
        {
            handle: "joseantonio", type: "person", nome: "José Antônio",
            nomeCompleto: "José Antônio Corral Dias",
            role: "Recursos", tags: ["fundador", "parceiro"],
            pic: "/joseantonio/jose-antonio.jpg",
            birthDate: "1957-03-15",
            bioCurta: "Empresário, palestrante e estudioso da consciência humana. Nascido em março de 1957, construiu sua trajetória a partir de origens humildes. Autor de Esperança — uma utopia possível (2024).",
            bio: "Empresário, palestrante e estudioso da consciência humana.\n\nNascido em março de 1957, pai de quatro filhos, duas enteadas e avô de uma neta, José Antônio Corral Dias construiu sua trajetória a partir de origens humildes. Proveniente de uma família desestruturada e muito pobre, começou a trabalhar aos 13 anos e, aos 14, deixou os estudos formais antes de concluir o antigo ginasial, movido pela necessidade e por um espírito naturalmente questionador.\n\nIngressou cedo no mercado de trabalho formal como office-boy e, em pouco tempo, tornou-se auxiliar de escritório, acumulando sólida experiência em rotinas administrativas, fiscais e financeiras. No final da década de 1970, já pai de dois filhos, migrou para a área comercial, atuando em vendas em diferentes setores até se estabelecer no segmento têxtil, onde permaneceu por cerca de 20 anos, inclusive como sócio de lojas de vestuário masculino.\n\nPouco antes da virada do século, iniciou atuação no setor de materiais gráficos especiais e embalagens, em parceria com empresários de Taiwan ligados a grandes corporações internacionais, como a Nan Ya e a K. Laser Group. Desde então, trabalha no desenvolvimento de produtos e tecnologias para embalagens, comunicação visual, rótulos, etiquetas e filmes autoadesivos.\n\nEm 2013, ampliou sua atuação empresarial ao fundar uma empresa voltada à prestação de serviços de pintura predial para o setor corporativo.\n\nEstudioso da espiritualidade e da consciência humana há mais de três décadas, dedica-se ao voluntariado e ao trabalho assistencial, ministrando palestras e cursos voltados ao desenvolvimento humano.\n\nEm novembro de 2024, publicou seu primeiro livro de ficção, Esperança — uma utopia possível, obra que sintetiza sua visão humanista e sua crença na transformação do indivíduo e da sociedade.",
            servicos: ["Gestão Administrativa", "Gestão Financeira", "Mentoria Espiritual"]
        },
        {
            handle: "mono", type: "person", nome: "Mono",
            role: "Segurança", tags: ["fundador", "parceiro"],
            pic: null, bio: "",
            servicos: ["Consultoria em TI", "Privacidade e Segurança"]
        },
        {
            handle: "bruna", type: "person", nome: "Bruna",
            role: "Comunicação", tags: ["fundador", "parceiro"],
            pic: "/bruna/bruna.jpeg",
            bioCurta: "Sou uma pessoa prática, criativa e muito orientada a resolver problemas. Minha trajetória começou com produção de eventos, até chegar no nicho da comédia stand-up, sempre curiosa sobre tudo, aprendi diversas áreas da produção e também da comunicação, o que me deu jogo de cintura e a capacidade de me conectar com diferentes públicos de forma leve e autêntica.",
            bio: "Sou uma pessoa prática, criativa e muito orientada a resolver problemas. Minha trajetória começou com produção de eventos, até chegar no nicho da comédia stand-up, sempre curiosa sobre tudo, aprendi diversas áreas da produção e também da comunicação, o que me deu jogo de cintura e a capacidade de me conectar com diferentes públicos de forma leve e autêntica.\n\nMas antes de ser profissional, também me tornei mãe de uma criança linda albina, o que trouxe ainda mais responsabilidade, sensibilidade e força para tudo que faço. Essa vivência impacta diretamente a forma como enxergo o mundo e, consequentemente, como me posiciono profissionalmente. Com o tempo, fui evoluindo e direcionando minhas habilidades para o marketing e social media, hoje atuando com foco em projetos como a Arte Longa. Gosto de transformar ideias em algo concreto, construir presença digital e pensar estrategicamente na comunicação, sempre buscando resultado sem perder a identidade.\n\nAprendo rápido, sou curiosa e não tenho medo de testar, ajustar e melhorar no processo. Sei me virar, faço acontecer e acredito que dá pra levar o trabalho a sério sem deixar de ser leve, humana e engraçadinha.",
            servicos: ["Comunicação Visual", "Criação de Conteúdo", "Marketing Digital"],
            subMembers: ["alicia"]
        },
        {
            handle: "luke", type: "person", nome: "Luke",
            role: "Experiência", tags: ["parceiro"],
            pic: "/luke/luke.jpeg",
            bioCurta: "Entusiasta de RPG há cerca de 10 anos, apaixonado por jogos narrativos. Hoje atua como mestre, desenvolvendo um universo próprio onde aplica e testa diferentes ideias narrativas e mecânicas.",
            bio: "Sou Luke, entusiasta de RPG, apaixonado por jogos narrativos e jogo RPG há cerca de 10 anos.\n\nAmo como os designs de RPGs podem influenciar a experiência dos jogadores e gosto de explorar e acompanhar o cenário, sempre buscando entender como mecânicas, narrativa e criatividade se conectam.\n\nExploro novos sistemas, modelos e abordagens, busco entender diferentes formas de construção de regras e experiências e, quando necessário, adaptar e implementar essas ideias em minhas mesas.\n\nUtilizo como base sistemas como D&D, Tormenta 20 e 3D&T, além de mecânicas adaptadas e conteúdos desenvolvidos pela comunidade no estilo homebrew.\n\nHoje atuo como mestre, explorando a condução de histórias e a criação de experiências para os jogadores. Como parte desse processo, desenvolvi um universo próprio, onde aplico e testo diferentes ideias narrativas e mecânicas.",
            servicos: ["Design", "Experiência de Usuário (UI/UX)"]
        },
        {
            handle: "karina", type: "person", nome: "Karina",
            role: "Visão", tags: ["parceiro"],
            pic: "/karina/karina.jpeg", bio: "",
            servicos: ["Fotografia"]
        },
        {
            handle: "marina", type: "person", nome: "Marina",
            role: "Cuidado", tags: ["parceiro"],
            pic: null, bio: "",
            servicos: ["Acompanhamento Nutricional", "Alfabetização", "Cuidado com o Idoso", "Reforço Escolar"]
        },
        {
            handle: "kayra", type: "person", nome: "Kayra",
            role: "Expressão", tags: ["parceiro"],
            pic: "/kayra/kayra.jpg", bio: "",
            servicos: ["Stylist, Moda e Passarela", "Consultoria em Moda", "Rede de Talentos"]
        },
        {
            handle: "aime", type: "person", nome: "Aime",
            role: "em breve", tags: ["parceiro", "em-breve"],
            pic: null, bio: "", emBreve: true, muted: true,
            servicos: [],
            subMembers: ["john"]
        },
        {
            handle: "sylvia", type: "person", nome: "Sylvia",
            role: "Consciência", tags: ["parceiro"],
            pic: null, bio: "",
            servicos: ["Meditação", "Autocuidado", "Dança e Expressão Corporal"]
        },
        {
            handle: "raquel", type: "person", nome: "Raquel",
            role: "Presença", tags: ["parceiro"],
            pic: null, bio: "",
            servicos: ["Saúde Mental", "Autocuidado"]
        },
        {
            handle: "alice", type: "person", nome: "Alice",
            role: "Movimento", tags: ["parceiro"],
            pic: "/alice/alice.png", bio: "",
            servicos: ["Pensamento Islâmico", "Dança e Expressão Corporal"],
            essaysTitle: "Ensaios · Pensamento Islâmico",
            essays: [
                { titulo: "", short: "", long: "" },
                { titulo: "", short: "", long: "" },
                { titulo: "", short: "", long: "" },
                { titulo: "", short: "", long: "" },
                { titulo: "", short: "", long: "" },
                { titulo: "", short: "", long: "" },
                { titulo: "", short: "", long: "" },
                { titulo: "", short: "", long: "" }
            ]
        },
        {
            handle: "ramona", type: "person", nome: "Ramona",
            role: "Internacionalização", tags: ["parceiro"],
            pic: null, bio: "",
            servicos: ["Tradução de Inglês"]
        },
        {
            handle: "rogerio", type: "person", nome: "Rogério",
            role: "Xeramoi", tags: ["parceiro"],
            pic: null, bio: "",
            servicos: ["Mentoria Espiritual"]
        },
        {
            handle: "alzira", type: "person", nome: "Alzira",
            role: "Xejaryi", tags: ["parceiro"],
            pic: null, bio: "",
            servicos: ["Mentoria Espiritual"]
        },
        {
            handle: "miguel", type: "person", nome: "Miguel",
            role: "Futuro", tags: ["parceiro"],
            pic: null,
            bioCurta: "18 anos. Apaixonado por resolver problemas, robótica, negócios e contribuir para a evolução das pessoas. Mira no MS&E da Stanford University.",
            bio: "Olá! Me chamo Miguel, tenho 18 anos.\n\nGosto muito de resolver problemas, robótica, negócios, desenvolver ideias, conversar, e contribuir para a evolução das pessoas (genuinamente, não só para ficar bonito no papel).\n\nLuto diariamente para superar a minha inevitável temporalidade deixando coisas boas por onde passo, quero deixar uma marca muito maior do que eu mesmo nesse mundo quando partir.\n\nMinha principal meta no momento é ingressar na Stanford University para cursar MS&E.\n\nSe quiser conversar, me chama aqui: mkbrito06@gmail.com\n\nObrigado :)",
            servicos: []
        },

        // sub-members (shown under a parent profile, not on top-level roster)
        { handle: "alicia", type: "person", nome: "Alicia", role: "", tags: ["parceiro", "menor"], pic: null, bio: "", underage: true, servicos: ["Futuro", "Filha da Bruna"], parentHandle: "bruna" },
        { handle: "john", type: "person", nome: "John", role: "", tags: ["parceiro", "menor"], pic: null, bio: "", underage: true, servicos: ["Futuro", "Filho da Aime"], parentHandle: "aime" },
        { handle: "kiyoshi", type: "person", nome: "Kiyoshi (Shin)", role: "", tags: ["parceiro", "familia", "aposentado"], pic: null, bio: "", aposentado: true, servicos: ["Pai do Yuri", "Poeta"], parentHandle: "yuri" },
        {
            handle: "soninha", type: "person", nome: "Soninha", role: "", tags: ["parceiro", "familia", "em-memoria"],
            pic: null, bio: "", emMemoria: true,
            birthDate: "1961-11-01", deathDate: "2025-10-01",
            servicos: ["Mãe do Yuri", "Atriz", "Cantora"],
            parentHandle: "yuri"
        },

        // community members (appear only under community profile, not on landing)
        { handle: "antony", type: "person", nome: "Antony", role: "", tags: ["parceiro"], pic: null, bio: "", servicos: ["Produção Musical"], communities: ["quilomboaraucaria"] },
        { handle: "bia", type: "person", nome: "Bia", role: "", tags: ["parceiro"], pic: null, bio: "", servicos: [], communities: ["quilomboaraucaria"] },
        { handle: "ken", type: "person", nome: "Ken", role: "", tags: ["parceiro"], pic: null, bio: "", servicos: ["Alimentação e Bebidas"], communities: ["quilomboaraucaria"] },
        { handle: "quinho", type: "person", nome: "Quinho", role: "", tags: ["parceiro"], pic: null, bio: "", servicos: ["Artes Visuais", "Grafite", "Murais e Fachadas"], communities: ["quilomboaraucaria"] },
        { handle: "tiao", type: "person", nome: "Tião", role: "", tags: ["parceiro"], pic: null, bio: "", servicos: ["Drywall e Bioconstrução"], communities: ["quilomboaraucaria"] },
        { handle: "veh", type: "person", nome: "Veh", role: "", tags: ["parceiro"], pic: null, bio: "", servicos: ["Alimentação e Bebidas", "Tortas Salgadas da Veh"], communities: ["quilomboaraucaria"] },
        { handle: "joao", type: "person", nome: "João", role: "", tags: ["parceiro"], pic: null, bio: "", servicos: ["Saúde Mental"], communities: ["quilomboaraucaria"] },
        {
            handle: "carlinhos", type: "person", nome: "Carlinhos",
            role: "Distribuição de Frutas",
            tags: ["parceiro", "familia", "em-memoria", "guardiao"],
            pic: null,
            bio: "Guardião. Quem passou pelo Quilombo conheceu o Carlinhos — e pela fruta que ele distribuía, a generosidade da terra virou lembrança viva.\n\n[Leia mais no quilomboaraucaria.org →](https://quilomboaraucaria.org/blog/carlinhos)",
            emMemoria: true,
            birthDate: "1965-06-01T12:00:00-03:00", deathDate: "2025-06-01",
            servicos: ["Distribuição de Frutas"],
            communities: ["quilomboaraucaria"]
        },
        {
            handle: "mara-brandao", type: "person", nome: "Mara Brandão",
            role: "",
            tags: ["parceiro", "em-memoria"],
            pic: null,
            bio: "Em memória.",
            emMemoria: true,
            servicos: [],
            communities: ["quilomboaraucaria"]
        },
        // Reference-only: histórico/canônico, citável a partir de Valores.
        // referenceOnly = true ⇒ não aparece em /parceiros/, /servicos/ nem em roster de comunidades.
        {
            handle: "leaoxiii", type: "person",
            nome: "Papa Leão XIII",
            nomeCompleto: "Vincenzo Gioacchino Raffaele Luigi Pecci",
            role: "",
            tags: ["referencia", "em-memoria"],
            pic: null,
            emMemoria: true,
            referenceOnly: true,
            birthDate: "1810-03-02",
            deathDate: "1903-07-20",
            bio: "Autor da encíclica [Rerum Novarum](https://www.vatican.va/content/leo-xiii/pt/encyclicals/documents/hf_l-xiii_enc_15051891_rerum-novarum.html) (15 de maio de 1891) — marco da doutrina social, defendendo a dignidade do trabalho, o justo salário e a associação livre dos trabalhadores.",
            servicos: [],
            communities: []
        }
    ];

    // ─── COMMUNITIES ─────────────────────────────────────────────────────────
    const communities = [
        {
            handle: "quilomboaraucaria", type: "community", nome: "Quilombo Araucária",
            role: "Terra", tags: ["comunidade", "parceiro"],
            pic: "/quilomboaraucaria/quilomboaraucaria.png",
            tagline: "Natureza Viva, Futuro Ancestral",
            bio: "Espaço de resistência ambiental, cultural e social.",
            externalUrl: "https://quilomboaraucaria.org",
            site: "https://quilomboaraucaria.org",
            // QA não oferece serviços comerciais — seus projetos aparecem em Missões (/solucoes/)
            servicos: [],
            // Todos os membros de QA (incluindo os fundadores que também são top-roster).
            // A renderização esconde os já visíveis no roster principal atrás de "ver mais",
            // e coloca os em memória ao final.
            // Ordem: alive-unique primeiro, em memória em seguida; fundadores (que
            // também estão no roster principal) ficam atrás de "ver mais".
            membros: ["antony", "bia", "joao", "ken", "quinho", "tiao", "veh",
                      "carlinhos", "mara-brandao",
                      "yuri", "igo", "joseantonio", "mono", "bruna"],
            // Parceria Arte Longa — pro-bono. Exibido em /quilomboaraucaria/.
            parcerias: [
                {
                    de: "artelonga",
                    tipo: "pro-bono",
                    descricao: "Arte Longa construiu a plataforma digital e a comunicação do Quilombo Araucária sem cobrar — como contribuição ao impacto ambiental, social e cultural.",
                    contribuicoes: [
                        { quem: "yuri", oque: "Inteligência e Tecnologia · todos os subcomponentes (Desenvolvimento Web, API, Dados, Nuvem, Computação, Hardware, Redes, Sistemas, Software) + Tráfego e Crescimento" },
                        { quem: "mono", oque: "Design · Privacidade e Segurança" },
                        { quem: "bruna", oque: "Criação de Conteúdo" },
                        { quem: "igo", oque: "Conexões" }
                    ]
                }
            ],
            sectionBreak: true
        },
        {
            handle: "hfsassociados", type: "community", nome: "HFS Associados",
            role: "Transparência", tags: ["comunidade", "parceiro", "contabilidade"],
            pic: null, bio: "Contabilidade.",
            externalUrl: "https://hfsassociados.com.br/",
            site: "https://hfsassociados.com.br/",
            servicos: ["Gestão Contábil", "Gestão Fiscal", "Consultoria Jurídica"],
            membros: []
        },
        {
            handle: "hedix", type: "community", nome: "Hedix",
            role: "Previsão", tags: ["comunidade", "parceiro"],
            pic: null, bio: "",
            externalUrl: "https://hedix.com.br/",
            site: "https://hedix.com.br/",
            servicos: ["Market Making Preditivo", "Inteligência de Previsão"],
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
        "Comunicação Visual":                       [{ c: "7410-2/03", d: "Design de produto" }, { c: "7319-0/04", d: "Consultoria em publicidade" }],
        "Consultoria em Moda":                      [{ c: "7319-0/04", d: "Consultoria em publicidade" }],
        "Consultoria em TI":                        [{ c: "6204-0/00", d: "Consultoria em tecnologia da informação" }],
        "Criação de Conteúdo":                      [{ c: "5911-1/99", d: "Produção cinematográfica, de vídeos e TV" }, { c: "5912-0/99", d: "Pós-produção audiovisual" }],
        "Design":                                   [{ c: "7410-2/03", d: "Design de produto" }],
        "Desenvolvimento Web":                      [{ c: "6201-5/02", d: "Web design" }, { c: "6202-3/00", d: "Desenvolvimento e licenciamento de software customizável" }],
        "Ensino, Formação e Liderança":             [{ c: "8599-6/99", d: "Outras atividades de ensino" }, { c: "8599-6/03", d: "Treinamento em informática" }],
        "Escrita, Interpretação e Tradução":        [{ c: "7490-1/01", d: "Serviços de tradução, interpretação e similares" }, { c: "5811-5/00", d: "Edição de livros" }],
        "Experiência de Usuário (UI/UX)":           [{ c: "7410-2/03", d: "Design de produto" }, { c: "6201-5/02", d: "Web design" }],
        "Fotografia":                               [{ c: "7420-0/01", d: "Atividades de produção de fotografias" }, { c: "7420-0/04", d: "Filmagem de festas e eventos" }],
        "Gestão Executiva":                         [{ c: "7319-0/04", d: "Consultoria em publicidade (gestão de rede)" }],
        "Grafite":                                  [{ c: "9002-7/02", d: "Restauração de obras-de-arte (correlato)" }],
        "Inteligência e Tecnologia":                [{ c: "6204-0/00", d: "Consultoria em tecnologia da informação" }, { c: "6319-4/00", d: "Portais, provedores de conteúdo e serviços de informação na internet" }],
        "Desenvolvimento de Software":              [{ c: "6202-3/00", d: "Desenvolvimento e licenciamento de software customizável" }],
        "Desenvolvimento de API":                   [{ c: "6202-3/00", d: "Desenvolvimento e licenciamento de software customizável" }],
        "Nuvem":                                    [{ c: "6204-0/00", d: "Consultoria em TI" }, { c: "6319-4/00", d: "Provedores de conteúdo e serviços de informação na internet" }],
        "Computação":                               [{ c: "6204-0/00", d: "Consultoria em TI" }],
        "Dados e Armazenamento":                    [{ c: "6204-0/00", d: "Consultoria em TI" }, { c: "6319-4/00", d: "Provedores de serviços de informação na internet" }],
        "Hardware":                                 [{ c: "6204-0/00", d: "Consultoria em TI" }],
        "Sistemas Operacionais":                    [{ c: "6204-0/00", d: "Consultoria em TI" }],
        "Redes":                                    [{ c: "6204-0/00", d: "Consultoria em TI" }],
        "Tráfego e Crescimento":                    [{ c: "7319-0/04", d: "Consultoria em publicidade" }, { c: "6319-4/00", d: "Portais, provedores de conteúdo e serviços de informação na internet" }],
        "Conexões":                                 [{ c: "7319-0/04", d: "Consultoria em publicidade · articulação de rede" }],
        "Marketing Digital":                        [{ c: "7319-0/04", d: "Consultoria em publicidade" }],
        "Meditação":                                [{ c: "8599-6/99", d: "Outras atividades de ensino (correlato)" }],
        "Stylist, Moda e Passarela":                                   [{ c: "7319-0/04", d: "Consultoria em publicidade" }],
        "Murais e Fachadas":                        [{ c: "7410-2/03", d: "Design de produto" }, { c: "7319-0/01", d: "Criação de estandes para feiras e exposições" }],
        "Poeta":                                    [{ c: "5811-5/00", d: "Edição de livros" }],
        "Privacidade e Segurança":          [{ c: "6204-0/00", d: "Consultoria em tecnologia da informação" }],
        "Produção Musical":                         [{ c: "9001-9/02", d: "Produção musical" }, { c: "5920-1/00", d: "Atividades de gravação de som e de edição de música" }],
        "Raízes do futuro":                         [{ c: "8599-6/99", d: "Outras atividades de ensino (projeto educacional)" }],
        "Rede de Talentos":                         [{ c: "7319-0/04", d: "Consultoria em publicidade" }],
        "Reforço Escolar":                          [{ c: "8599-6/99", d: "Outras atividades de ensino" }],
        "Tortas Salgadas da Veh":                   [{ c: "5620-1/02", d: "Serviços de alimentação — bufê" }]
    };

    function slugify(s) {
        return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/\(.*?\)/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
    }

    // Extra services no catálogo. Sub-serviços têm `parent` = título do serviço-pai.
    // Parents são buscáveis na raiz mas renderizam com hover-expand dos filhos em /servicos/.
    const extraServices = [
        // Sub-serviços de "Inteligência e Tecnologia" (Yuri, R$ 100/h)
        { titulo: "Desenvolvimento de API",      responsavel: ["yuri"], parent: "Inteligência e Tecnologia" },
        { titulo: "Desenvolvimento de Software", responsavel: ["yuri"], parent: "Inteligência e Tecnologia" },
        { titulo: "Desenvolvimento Web",         responsavel: ["yuri"], parent: "Inteligência e Tecnologia" },
        { titulo: "Nuvem",                       responsavel: ["yuri"], parent: "Inteligência e Tecnologia" },
        { titulo: "Computação",                  responsavel: ["yuri"], parent: "Inteligência e Tecnologia" },
        { titulo: "Dados e Armazenamento",       responsavel: ["yuri"], parent: "Inteligência e Tecnologia" },
        { titulo: "Hardware",                    responsavel: ["yuri"], parent: "Inteligência e Tecnologia" },
        { titulo: "Sistemas Operacionais",       responsavel: ["yuri"], parent: "Inteligência e Tecnologia" },
        { titulo: "Redes",                       responsavel: ["yuri"], parent: "Inteligência e Tecnologia" },
        { titulo: "Tráfego e Crescimento",       responsavel: ["yuri"], parent: "Inteligência e Tecnologia" }
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

    // Auto-derive catalog from entity.servicos (each entity contributes its services).
    // True missions (goal-oriented communities) live in /comunidades/<h>/missoes/*.md
    // and are separate from this catalog.
    function deriveServices() {
        const byTitle = new Map();
        const all = [...people, ...communities];
        for (const e of all) {
            for (const m of (e.servicos || [])) {
                if (!byTitle.has(m)) byTitle.set(m, { titulo: m, responsavel: [] });
                byTitle.get(m).responsavel.push(e.handle);
            }
        }
        for (const ex of extraServices) {
            if (!byTitle.has(ex.titulo)) byTitle.set(ex.titulo, { titulo: ex.titulo, responsavel: [...ex.responsavel], parent: ex.parent });
            else {
                const existing = byTitle.get(ex.titulo);
                for (const r of ex.responsavel) if (!existing.responsavel.includes(r)) existing.responsavel.push(r);
                if (ex.parent && !existing.parent) existing.parent = ex.parent;
            }
        }
        // Attach children arrays to parents (symmetric lookup)
        const result = Array.from(byTitle.values());
        for (const s of result) {
            s.children = result.filter(x => x.parent === s.titulo).map(x => x.titulo);
        }
        return result.sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR"));
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
            tagline: "Redes do Futuro",
            url: "https://artelonga.com.br", urlLabel: "artelonga.com.br",
            lema: "A Rede — Conectando Pessoas.",
            desc: "Um jeito natural de conectar pessoas e seus legados. Em vida, em memória, em futuro.",
            bundledServices: "*", // all services
            platforms: [
                { name: "Web", status: "done", statusText: "disponível" },
                { name: "Mobile / App", status: "wip", statusText: "Q2 2026 · em desenvolvimento" }
            ]
        },
        {
            handle: "co", type: "solution", nome: "Co",
            tagline: "Rede Social Web",
            url: "https://co-artelonga-uat.fly.dev/", urlLabel: "co-artelonga-uat.fly.dev",
            lema: "Conectando Pessoas na Web.",
            desc: "Comunidade. Consciência Coletiva. Colaborar. Compartilhar. Comunicar. Coinventar.",
            // Co: Yuri fez tudo (Inteligência e Tecnologia — collapsível), Luke contribuiu Design.
            // Igo e Mono também apoiaram (Gestão Operacional, Privacidade e Segurança).
            bundledServices: ["Inteligência e Tecnologia", "Design", "Gestão Executiva", "Gestão Operacional", "Privacidade e Segurança"],
            platforms: [
                { name: "Web", status: "done", statusText: "disponível" },
                { name: "Mobile / App", status: "wip", statusText: "Q2 2026 · em desenvolvimento" }
            ]
        },
        {
            handle: "quilomboaraucaria-solution", type: "solution", nome: "Quilombo Araucária",
            tagline: "Natureza Viva, Futuro Ancestral",
            url: "https://quilomboaraucaria.org", urlLabel: "quilomboaraucaria.org",
            desc: "Espaço de resistência ambiental, cultural e social.",
            bundledServices: ["Desenvolvimento Web", "Artes Visuais", "Grafite", "Murais e Fachadas"],
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
            lema: "Desenvolvimento de jogos.",
            desc: "Sem limites para a expressão da criatividade. Uma rede social onde criadores, jogadores e mundos convergem.",
            // Yggdrasil: Luke faz Design solo. Yuri cobre o resto (Inteligência e Tecnologia — collapsível) + Produção Musical (Antony).
            bundledServices: ["Inteligência e Tecnologia", "Design", "Produção Musical"],
            platforms: [
                { name: "Web", status: "wip", statusText: "junho 2026" },
                { name: "Mobile / App", status: "wip", statusText: "junho 2026" }
            ]
        },
        {
            handle: "hedix-solution", type: "solution", nome: "Hedix",
            tagline: "Market Making em Mercados de Previsão",
            url: "https://hedix.com.br/", urlLabel: "hedix.com.br",
            lema: "Liquidez e formação de preço em mercados de previsão.",
            desc: "Plataforma de market making preditivo. Provê liquidez, forma preço e agrega sinal em prediction markets — onde o mercado é o oráculo.",
            comunidade: "hedix",
            bundledServices: ["Market Making Preditivo", "Inteligência de Previsão"],
            platforms: [
                { name: "Web", status: "done", statusText: "disponível" }
            ]
        }
    ];

    // ─── MISSIONS (projetos de comunidades) ──────────────────────────────────
    // Missão = comunidade com objetivo. Tem pai (comunidade) e pode ter filhas (sub-missões).
    // Renderizadas em /solucoes/ em uma seção dedicada — não entram no catálogo de serviços.
    const missions = [
        // Quilombo Araucária · todas as missões sob a mesma comunidade (top-level irmãs)
        {
            handle: "raizes-do-futuro", type: "mission",
            nome: "Raízes do Futuro",
            subtitle: "Agrofloresta · horta e compostagem",
            comunidade: "quilomboaraucaria",
            objetivo: "Regeneração do solo e da comunidade via agrofloresta, horta e compostagem — o futuro planta raízes agora.",
            tags: ["terra", "sustentabilidade", "educacao"],
            attachments: [
                { label: "Projeto — Raízes do Futuro", url: "/missoes/raizes-do-futuro/projeto.pdf", kind: "pdf" }
            ]
        },
        {
            handle: "gres-amazonia", type: "mission",
            nome: "GRES Amazônia",
            subtitle: "Escola de samba · futebol feminino e masculino para famílias de baixa renda",
            comunidade: "quilomboaraucaria",
            objetivo: "Cultura e Esporte Vivos.",
            tags: ["cultura", "esporte", "social"]
        },
        {
            handle: "reparacao-historica", type: "mission",
            nome: "Reparação Histórica",
            subtitle: "Povos originários",
            comunidade: "quilomboaraucaria",
            objetivo: "\u201CA reparação à população negra e dos povos originários é urgente, é necessária, é fundamental.\u201D",
            objetivoAutor: "bia",
            tags: ["cultura", "justica"],
            envolvidos: ["rogerio", "alzira"]
        },
        {
            handle: "eventos-espacos-saberes", type: "mission",
            nome: "Eventos e Espaços de Saberes",
            comunidade: "quilomboaraucaria",
            objetivo: "Encontros, aulas e espaços presenciais que transmitem os saberes da rede.",
            tags: ["educacao", "cultura", "eventos"]
        }
    ];

    // ─── INDEXES / LOOKUPS ───────────────────────────────────────────────────
    const all = [...people, ...communities, ...solutions, ...missions];
    const byHandle = Object.fromEntries(all.map(e => [e.handle, e]));

    function get(handle) { return byHandle[handle]; }

    function isEmMemoria(handle) {
        const e = get(handle);
        return !!(e && e.emMemoria);
    }

    // Qualquer status que tire a pessoa do catálogo ativo de serviços:
    // em memória (já passou), aposentado (serviços vão para legado),
    // underage (menor de 18, universo privado sob responsabilidade da mãe/pai).
    function isInactive(handle) {
        const e = get(handle);
        return !!(e && (e.emMemoria || e.aposentado || e.underage));
    }

    function publicServices() {
        return services.filter(s => {
            if (hiddenServiceTitles.has(s.titulo)) return false;
            if (s.responsavel.some(h => isInactive(h))) return false;
            return true;
        });
    }

    // Roster = what shows on /parceiros/ (top-level people + communities in this order)
    // Order is explicit (the editorial layout).
    const rosterOrder = [
        "yuri", "igo", "joseantonio", "mono", "bruna",
        "luke", "marina", "karina", "kayra", "aime",
        "sylvia", "raquel", "alice", "ramona", "rogerio", "alzira", "miguel",
        "quilomboaraucaria", "hfsassociados", "hedix"
    ];
    function roster() {
        // referenceOnly entities (citadas em Valores, mas fora do catálogo público)
        // nunca entram no roster. Defesa extra caso alguém adicione ao rosterOrder.
        return rosterOrder.map(h => get(h)).filter(e => e && !e.referenceOnly);
    }

    // Members in a community (full entities, em_memoria excluded by default).
    // referenceOnly fica sempre de fora (entidades de citação não pertencem a comunidades).
    function membersOf(communityHandle, { includeEmMemoria = false } = {}) {
        const c = get(communityHandle);
        if (!c || !c.membros) return [];
        return c.membros
            .map(h => get(h))
            .filter(m => m && !m.referenceOnly && (includeEmMemoria || !m.emMemoria));
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
                    { label: "José Antônio", value: 2000, handle: "joseantonio" },
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
            // `solucoes` aponta para produtos da Arte Longa que exemplificam o
            // serviço — dá ao visitante do /recursos/ um lugar concreto para ver.
            recorrenteMensal: [
                {
                    label: "Desenvolvimento de API",
                    client: "Hedix",
                    detail: "16,12 h/mês × R$ 100/h — cobre a contabilidade",
                    responsavel: "yuri",
                    mensal: 1612,
                    solucoes: ["hedix-solution"]
                },
                {
                    label: "Consultoria em TI (outros clientes)",
                    detail: "23,88 h/mês × R$ 100/h (40h/mês total, menos Hedix)",
                    responsavel: "yuri",
                    mensal: 2388,
                    solucoes: ["co", "yggdrasil", "quilomboaraucaria-solution"]
                },
                {
                    label: "Criação de Conteúdo",
                    detail: "1 job fixo / mês",
                    responsavel: "bruna",
                    mensal: 1000,
                    solucoes: ["artelonga"]
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
                    ],
                    solucoes: ["hedix-solution"]
                }
            ],
            projetos: [
                {
                    label: "Website estático",
                    detail: "3 × R$ 5.000",
                    unitValue: 5000,
                    unidades: 3,
                    responsavel: "yuri",
                    solucoes: ["artelonga"]
                },
                {
                    label: "Website dinâmico",
                    detail: "1 projeto",
                    unitValue: 15000,
                    unidades: 1,
                    responsavel: "yuri",
                    solucoes: ["co", "quilomboaraucaria-solution"]
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
                },
                {
                    label: "Serviços",
                    detail: "90 h × R$ 100/h · outros sócios (no trimestre)",
                    unitValue: 100,
                    unidades: 90
                }
            ],
            // Pro-bono · não conta como receita mas é parte da atuação
            proBono: [
                {
                    label: "Desenvolvimento Web — Quilombo Araucária",
                    detail: "portfolio institucional · impacto social, ambiental e cultural",
                    responsavel: "yuri",
                    solucoes: ["quilomboaraucaria-solution"]
                }
            ]
        }
    };

    function missionBySlug(slug) { return missions.find(m => m.handle === slug); }
    function topLevelMissions() { return missions.filter(m => !m.parentMission); }
    function missionsOfCommunity(handle) { return missions.filter(m => m.comunidade === handle && !m.parentMission); }
    function subMissionsOf(missionHandle) { return missions.filter(m => m.parentMission === missionHandle); }

    // ─── MANIFESTO (Missão · Visão · Valores) ────────────────────────────────
    // Referência externa segue o padrão { obra, data, autor (handle), url }.
    // `autor` resolve para um perfil interno via AL.get — permite citar
    // pessoas históricas (referenceOnly: true) sem expô-las nos rosters.
    const manifesto = {
        missao: "Semear sonhos, escrever legados.",
        visao: {
            texto: "Trabalho digno.",
            referencia: {
                obra: "Rerum Novarum: sobre a condição dos operários",
                data: "15 de maio de 1891",
                autor: "leaoxiii",
                url: "https://www.vatican.va/content/leo-xiii/pt/encyclicals/documents/hf_l-xiii_enc_15051891_rerum-novarum.html"
            }
        },
        valores: [
            {
                titulo: "Desenvolvimento sustentável",
                texto: "",
                referencia: {
                    obra: "Objetivos de Desenvolvimento Sustentável",
                    data: "2015",
                    autor: "ONU",
                    url: "https://brasil.un.org/pt-br/sdgs"
                }
            }
        ]
    };

    // ─── SÓCIOS ──────────────────────────────────────────────────────────────
    // Fonte única: o breakdown de `custos.socios` em finances.
    // Quem recebe pro-labore é sócio. Ponto.
    const socioCusto = (finances.custos || []).find(c => c.key === "socios");
    const socioHandles = new Set(
        ((socioCusto && socioCusto.breakdown) || [])
            .map(b => b.handle)
            .filter(Boolean)
    );
    function isSocio(handle) { return socioHandles.has(handle); }

    global.AL = {
        version: "2.1",
        people, communities, services, solutions, missions, rosterOrder, finances, manifesto,
        get, byHandle, isEmMemoria, isInactive, isSocio,
        publicServices, roster, membersOf, subMembersOf, bundledServices,
        hiddenServiceTitles, slugify,
        serviceBySlug, serviceByTitle, solutionsUsingService, relatedServices,
        missionBySlug, topLevelMissions, missionsOfCommunity, subMissionsOf
    };
})(window);
