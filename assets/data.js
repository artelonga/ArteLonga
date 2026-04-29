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
            pic: "/yuri/yuri.jpg?v=20260428",
            birthDate: "1993-06-24T12:30:00-03:00",
            bioTitle: "Terra",
            bioCurta: "Filho de Kiyoshi e Soninha e fascinado por todos que me inspiram. Como neurocientista, busco compreender a consciência. Como ser humano, busco compreender os saberes ancestrais. Trabalho com desenvolvimento de tecnologia sustentável.",
            bio: "Filho de Kiyoshi e Soninha e fascinado por [todos que me inspiram](/parceiros/#todos)\nComo neurocientista, busco compreender a consciência\nComo ser humano, busco compreender os saberes ancestrais\nTrabalho com desenvolvimento de [tecnologia sustentável](/solucoes/)\n\nNão haviam nomes quando nossos ancestrais pisaram na Terra\n\nO eu não se faz de reconhecimento ou recompensa. Não é sobre mim.\n\nNao chamavam-se japoneses ou nordestinos\nafricanos ou indígenas.\nEram gente, como a gente\nSem nome\n\nO eu são [todos que inspiram](/parceiros/#todos)\nE avaxi ete'i\n\nPerdi a planilha orçamentária,\nTropecei no Quilombo Araucária e encontrei Zé Pilintra,\nEle sábio, eu ainda com trinta\nCompartilhou comigo coragem pra recomeçar\n\nA missão é cuidar da Terra\nSenão todo mundo vai embora, só a vovó que vai poder ficar\nA tecnologia é pedal que acelera,\nEntão seja ciente e começa com Yvyrupa\n\nFaça junto, compartilha a colheita, Yvyrupa nhande tekoa,\nGuarda ka'a porã e seus guardiões guarani Mbyá\nProteção no àiyé, caminha sem medo Olódùmarè, Òrìşà èdè Yorùbá\nSegredo, coração sujo e ubuntu pra um dia desvendar\n\nNão se esquece de respirar agora, a palavra não importa,\nA justiça abre a porta e os parente vem pro arraiá.\n\nXeramoi passou o petynga,\nXejaryi com sabedoria sabia que eu dormia com medo de acordar\n\nMe botou pra dormir no opy ouvindo jui no calor do tata\nSonhei que eu era eu mesmo\nFoi aí que eu senti o que era existir\nE acordei querendo trabalhar\n\nGuanyin e o sagrado feminino, A Ana, a Soninha e todas as kunha\nJohn, Alicia, kiryngue kuery vao colocar sentido nas palavras que você inventar\nCuida do Kiyoshi porque já não é de hoje que ele vem cuidando de ti\nSem tentar traduzir o que so presenca e atencao te permitem sentir,\n\nSem medo, por aqui eu me expresso em palavra ou em rima\nEu e todo o Universo, mbaraete, fé, nhande kuery\nNhande pytunju, a expressão de nhanderu\nChuva é tupã mandando descansar, autocuidado nhane noite\n\nJaxy pyau",
            citacoes: [
                {
                    texto: "A terceira utilidade (*d'A Economia como meio de conciliação de Classes*) será a suspensão do movimento de emigração; ninguém, com efeito, quereria trocar por uma região estrangeira a sua pátria e a sua terra natal, se nesta encontrasse os meios de levar uma vida mais tolerável.",
                    autor: "leaoxiii",
                    obra: "Rerum Novarum: sobre a condição dos operários",
                    data: "1891-05-15",
                    url: "https://www.vatican.va/content/leo-xiii/pt/encyclicals/documents/hf_l-xiii_enc_15051891_rerum-novarum.html"
                },
                {
                    texto: "Pra onde você voaria se fosse livre?",
                    autorNome: "Yuri",
                    autorEmBreve: { title: "Capítulo 1: Gênesis" },
                    data: "2015"
                }
            ],
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
            bio: "Empresário, palestrante e estudioso da consciência humana.\n\nNascido em março de 1957, pai de quatro filhos, duas enteadas e avô de uma neta, José Antônio Corral Dias construiu sua trajetória a partir de origens humildes. Proveniente de uma família desestruturada e muito pobre, começou a trabalhar aos 13 anos e, aos 14, deixou os estudos formais antes de concluir o antigo ginasial, movido pela necessidade e por um espírito naturalmente questionador.\n\nIngressou cedo no mercado de trabalho formal como office-boy e, em pouco tempo, tornou-se auxiliar de escritório, acumulando sólida experiência em rotinas administrativas, fiscais e financeiras. No final da década de 1970, já pai de dois filhos, migrou para a área comercial, atuando em vendas em diferentes setores até se estabelecer no segmento têxtil, onde permaneceu por cerca de 20 anos, inclusive como sócio de lojas de vestuário masculino.\n\nPouco antes da virada do século, iniciou atuação no setor de materiais gráficos especiais e embalagens, em parceria com empresários de Taiwan ligados a grandes corporações internacionais, como a Nan Ya e a K. Laser Group. Desde então, trabalha no desenvolvimento de produtos e tecnologias para embalagens, comunicação visual, rótulos, etiquetas e filmes autoadesivos.\n\nEm 2013, ampliou sua atuação empresarial ao fundar uma empresa voltada à prestação de serviços de pintura predial para o setor corporativo.\n\nEstudioso da espiritualidade e da consciência humana há mais de três décadas, dedica-se ao voluntariado e ao trabalho assistencial, ministrando palestras e cursos voltados ao desenvolvimento humano.\n\nEm novembro de 2024, publicou seu primeiro livro de ficção, Esperança — uma utopia possível, obra que sintetiza sua visão humanista e sua crença na transformação do indivíduo e da sociedade. Mais em [jacdias.com.br](https://jacdias.com.br/).",
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
            pic: "/bruna/bruna.jpeg?v=20260424",
            bioCurta: "Sou uma pessoa prática, criativa e muito orientada a resolver problemas. Minha trajetória começou com produção de eventos, até chegar no nicho da comédia stand-up, sempre curiosa sobre tudo, aprendi diversas áreas da produção e também da comunicação, o que me deu jogo de cintura e a capacidade de me conectar com diferentes públicos de forma leve e autêntica.",
            bio: "Sou uma pessoa prática, criativa e muito orientada a resolver problemas. Minha trajetória começou com produção de eventos, até chegar no nicho da comédia stand-up, sempre curiosa sobre tudo, aprendi diversas áreas da produção e também da comunicação, o que me deu jogo de cintura e a capacidade de me conectar com diferentes públicos de forma leve e autêntica.\n\nMas antes de ser profissional, também me tornei mãe de uma criança linda albina, o que trouxe ainda mais responsabilidade, sensibilidade e força para tudo que faço. Essa vivência impacta diretamente a forma como enxergo o mundo e, consequentemente, como me posiciono profissionalmente. Com o tempo, fui evoluindo e direcionando minhas habilidades para o marketing e social media, hoje atuando com foco em projetos como a Arte Longa. Gosto de transformar ideias em algo concreto, construir presença digital e pensar estrategicamente na comunicação, sempre buscando resultado sem perder a identidade.\n\nAprendo rápido, sou curiosa e não tenho medo de testar, ajustar e melhorar no processo. Sei me virar, faço acontecer e acredito que dá pra levar o trabalho a sério sem deixar de ser leve, humana e engraçadinha.",
            servicos: ["Comunicação Visual", "Criação de Conteúdo", "Marketing Digital", "Produção de Eventos"],
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
            handle: "syl", type: "person", nome: "Syl Saghira",
            role: "Cientista-artista", tags: ["parceiro"],
            pic: null,
            bio: "Syl é formada em Ciências Biológicas, com foco em Ciências Ambientais, e construiu uma trajetória que integra ciência, arte e sociedade. Especializou-se em Fisiologia do Exercício enquanto dirigia a Cia de Dança Âmar, dedicada às danças árabes.\n\nAo longo de sua carreira, desenvolveu atuação em comunicação científica e engajamento público, trabalhando com diferentes formatos de divulgação e construção de narrativas acessíveis para aproximar a ciência da sociedade.\n\nDurante a pandemia, atuou como voluntária em testagem de COVID-19 e, em seguida, concluiu mestrado em genética. Nesse período, viveu de forma nômade pelo Brasil, buscando uma vida mais simples e conectada à natureza, incluindo dois anos em Ubatuba, onde aprofundou sua relação com o território e o meio ambiente.\n\nAtualmente, é doutoranda na área de ética e inovação social, investigando formas de aplicar a ciência com impacto social. Também é professora de yoga, integrando práticas de mindfulness e consciência corporal às suas atividades.\n\nNos intervalos, dedica-se ao desenho botânico e à meditação.",
            servicos: ["Comunicação Científica", "Yoga", "Desenho Botânico", "Dança e Expressão Corporal", "Meditação", "Autocuidado"]
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
            servicos: ["Mentoria Espiritual"],
            communities: ["quilomboaraucaria"]
        },
        {
            handle: "alzira", type: "person", nome: "Alzira",
            role: "Xejaryi", tags: ["parceiro"],
            pic: null, bio: "",
            servicos: ["Mentoria Espiritual"],
            communities: ["quilomboaraucaria"]
        },
        {
            handle: "miguel", type: "person", nome: "Miguel",
            role: "Futuro", tags: ["parceiro"],
            pic: null,
            bioCurta: "18 anos. Apaixonado por resolver problemas, robótica, negócios e contribuir para a evolução das pessoas. Mira no MS&E da Stanford University.",
            bio: "Olá! Me chamo Miguel, tenho 18 anos.\n\nGosto muito de resolver problemas, robótica, negócios, desenvolver ideias, conversar, e contribuir para a evolução das pessoas (genuinamente, não só para ficar bonito no papel).\n\nLuto diariamente para superar a minha inevitável temporalidade deixando coisas boas por onde passo, quero deixar uma marca muito maior do que eu mesmo nesse mundo quando partir.\n\nMinha principal meta no momento é ingressar na Stanford University para cursar MS&E.\n\nSe quiser conversar, me chama aqui: mkbrito06@gmail.com\n\nObrigado :)",
            servicos: []
        },
        {
            handle: "joao", type: "person", nome: "João",
            role: "Psicologia Clínica", tags: ["parceiro"],
            pic: null,
            bio: "Psicólogo clínico com abordagem em psicanálise e psicologia junguiana, atuando no atendimento de crianças, adolescentes, adultos, idosos e casais. É pós-graduado em Psicologia Social e Ciências Humanas, desenvolvendo um trabalho fundamentado na escuta clínica, com foco na elaboração do sofrimento psíquico, no fortalecimento da autonomia e na promoção do bem-estar mental.\n\nPossui experiência no acolhimento de pessoas em situação de vulnerabilidade social e dependência química, além de integrar o grupo de masculinidades da Fecaf. Realiza atendimentos nas modalidades online e presencial.",
            servicos: ["Psicologia Clínica", "Saúde Mental", "Psicoterapia Psicanalítica", "Psicologia Analítica (Junguiana)", "Psicologia Social e Comunitária"],
            communities: ["quilomboaraucaria"]
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
        },

        // ─── BUSINESSES (parceiros pessoa jurídica) ──────────────────────────
        {
            handle: "retro-umarizal", type: "business", nome: "Retro Umarizal Burger & Chopp",
            role: "Alimentação", tags: ["parceiro", "alimentacao"],
            pic: null,
            externalUrl: "/retro-umarizal/",
            bio: "Hambúrgueres artesanais no Umarizal.\n\n[Ver cardápio completo →](/retro-umarizal/menu/)",
            servicos: ["Hambúrguer Artesanal", "Alimentação e Bebidas"]
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
            // QA oferece serviços que realizam suas próprias missões — agrofloresta,
            // compostagem, educação ambiental, produção de desfile da escola de
            // samba, futebol. Complementam os serviços individuais dos membros.
            servicos: ["Agrofloresta", "Compostagem", "Educação Ambiental", "Produção de Desfile", "Futebol e Esporte"],
            // Todos os membros de QA (incluindo os fundadores que também são top-roster).
            // A renderização esconde os já visíveis no roster principal atrás de "ver mais",
            // e coloca os em memória ao final.
            // Ordem: alive-unique primeiro, em memória em seguida; fundadores (que
            // também estão no roster principal) ficam atrás de "ver mais".
            membros: ["antony", "bia", "ken", "quinho", "tiao", "veh",
                      "carlinhos", "mara-brandao",
                      "yuri", "igo", "joseantonio", "mono", "bruna",
                      "rogerio", "alzira", "joao"],
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
            servicos: ["Market Making Preditivo", "Inteligência de Previsão", "Desenvolvimento de API"],
            membros: []
        }
    ];

    // ─── SERVICES ────────────────────────────────────────────────────────────
    // serviceCatalog é a FONTE ÚNICA de cada serviço. Antes existiam 4 estruturas
    // separadas (cnaeMap + extraServices + serviceOverrides + hiddenServiceTitles)
    // e a info de cada serviço vivia espalhada por chaves de string. Refactor B:
    // toda metadata fica aqui; `responsavel[]` continua auto-derivado de
    // people/communities (humano escreve `servicos: ["Título"]`, sistema valida).
    //
    // Campos:
    //   titulo:             identificador (string Pt-BR usada nos arrays .servicos)
    //   parent:             título do serviço-pai (sub-serviços agrupam sob ele)
    //   cnae:               [{ c, d }] — código + descrição CNAE oficial
    //   descNossa:          copy próprio do que entregamos (≠ descrição CNAE genérica)
    //   attachments:        [{ label, url, kind }] — PDFs, projetos, links
    //   tags:               futuro — base pra taxonomia (Commit C)
    //   hidden:             true = não aparece em /servicos/ (relações pessoais/familiares)
    //   implicitResponsavel:handles que ganham responsabilidade pelo serviço mesmo
    //                        sem escrever o título em `.servicos` (ex: Yuri cobre toda
    //                        a árvore de I&T sem precisar listar cada sub-serviço).
    //
    // Validação: deriveServices() emite console.warn se person/community.servicos
    // referencia título inexistente aqui — typos viram erro explícito, não silêncio.

    function slugify(s) {
        return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/\(.*?\)/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
    }

    // Marcador `cnaeNovo: true` sinaliza CNAE proposto que ainda não consta do
    // CNPJ 56.975.561/0001-60 e precisa ser adicionado via Receita Federal.
    // Roadmap público da empresa — render pode exibir badge "a formalizar".
    const serviceCatalog = [
        // ── Sub-serviços de "Inteligência e Tecnologia" (Yuri cobre a árvore) ──
        { titulo: "Desenvolvimento de API",      parent: "Inteligência e Tecnologia", implicitResponsavel: ["yuri"], cnae: [{ c: "6202-3/00", d: "Desenvolvimento e licenciamento de software customizável" }] },
        { titulo: "Desenvolvimento de Software", parent: "Inteligência e Tecnologia", implicitResponsavel: ["yuri"], cnae: [{ c: "6202-3/00", d: "Desenvolvimento e licenciamento de software customizável" }] },
        { titulo: "Desenvolvimento Web",         parent: "Inteligência e Tecnologia", implicitResponsavel: ["yuri"], cnae: [{ c: "6201-5/02", d: "Web design" }, { c: "6202-3/00", d: "Desenvolvimento e licenciamento de software customizável" }] },
        { titulo: "Nuvem",                       parent: "Inteligência e Tecnologia", implicitResponsavel: ["yuri"], cnae: [{ c: "6204-0/00", d: "Consultoria em TI" }, { c: "6319-4/00", d: "Provedores de conteúdo e serviços de informação na internet" }] },
        { titulo: "Computação",                  parent: "Inteligência e Tecnologia", implicitResponsavel: ["yuri"], cnae: [{ c: "6204-0/00", d: "Consultoria em TI" }] },
        { titulo: "Dados e Armazenamento",       parent: "Inteligência e Tecnologia", implicitResponsavel: ["yuri"], cnae: [{ c: "6204-0/00", d: "Consultoria em TI" }, { c: "6319-4/00", d: "Provedores de serviços de informação na internet" }] },
        { titulo: "Hardware",                    parent: "Inteligência e Tecnologia", implicitResponsavel: ["yuri"], cnae: [{ c: "6204-0/00", d: "Consultoria em TI" }] },
        { titulo: "Sistemas Operacionais",       parent: "Inteligência e Tecnologia", implicitResponsavel: ["yuri"], cnae: [{ c: "6204-0/00", d: "Consultoria em TI" }] },
        { titulo: "Redes",                       parent: "Inteligência e Tecnologia", implicitResponsavel: ["yuri"], cnae: [{ c: "6204-0/00", d: "Consultoria em TI" }] },
        { titulo: "Tráfego e Crescimento",       parent: "Inteligência e Tecnologia", implicitResponsavel: ["yuri"], cnae: [{ c: "7319-0/04", d: "Consultoria em publicidade" }, { c: "6319-4/00", d: "Portais, provedores de conteúdo e serviços de informação na internet" }] },

        // ── Serviços com CNAE já formalizado no CNPJ ─────────────────────────
        { titulo: "Alfabetização",                       cnae: [{ c: "8599-6/99", d: "Outras atividades de ensino não especificadas anteriormente" }] },
        { titulo: "Alimentação e Bebidas",               cnae: [{ c: "5620-1/02", d: "Serviços de alimentação para eventos e recepções — bufê" }] },
        { titulo: "Hambúrguer Artesanal",                cnaeNovo: true, cnae: [{ c: "5611-2/01", d: "Restaurantes e similares" }, { c: "5620-1/04", d: "Fornecimento de alimentos preparados preponderantemente para consumo domiciliar" }] },
        { titulo: "Comunicação Visual",                  cnae: [{ c: "7410-2/03", d: "Design de produto" }, { c: "7319-0/04", d: "Consultoria em publicidade" }] },
        { titulo: "Consultoria em Moda",                 cnae: [{ c: "7319-0/04", d: "Consultoria em publicidade" }] },
        { titulo: "Consultoria em TI",                   cnae: [{ c: "6204-0/00", d: "Consultoria em tecnologia da informação" }] },
        { titulo: "Criação de Conteúdo",                 cnae: [{ c: "5911-1/99", d: "Produção cinematográfica, de vídeos e TV" }, { c: "5912-0/99", d: "Pós-produção audiovisual" }] },
        { titulo: "Dança e Expressão Corporal",          cnae: [{ c: "8592-9/01", d: "Ensino de dança" }] },
        { titulo: "Design",                              cnae: [{ c: "7410-2/03", d: "Design de produto" }] },
        { titulo: "Ensino, Formação e Liderança",        cnae: [{ c: "8599-6/99", d: "Outras atividades de ensino" }, { c: "8599-6/03", d: "Treinamento em informática" }] },
        { titulo: "Escrita, Interpretação e Tradução",   cnae: [{ c: "7490-1/01", d: "Serviços de tradução, interpretação e similares" }, { c: "5811-5/00", d: "Edição de livros" }] },
        { titulo: "Experiência de Usuário (UI/UX)",      cnae: [{ c: "7410-2/03", d: "Design de produto" }, { c: "6201-5/02", d: "Web design" }] },
        { titulo: "Fotografia",                          cnae: [{ c: "7420-0/01", d: "Atividades de produção de fotografias" }, { c: "7420-0/04", d: "Filmagem de festas e eventos" }] },
        { titulo: "Inteligência e Tecnologia",           cnae: [{ c: "6204-0/00", d: "Consultoria em tecnologia da informação" }, { c: "6319-4/00", d: "Portais, provedores de conteúdo e serviços de informação na internet" }] },
        { titulo: "Marketing Digital",                   cnae: [{ c: "7319-0/04", d: "Consultoria em publicidade" }] },
        { titulo: "Mentoria Espiritual",                 cnae: [{ c: "8599-6/99", d: "Outras atividades de ensino" }] },
        { titulo: "Murais e Fachadas",                   cnae: [{ c: "7410-2/03", d: "Design de produto" }, { c: "7319-0/01", d: "Criação de estandes para feiras e exposições" }] },
        { titulo: "Pensamento Islâmico",                 cnae: [{ c: "8592-9/99", d: "Ensino de arte e cultura não especificado anteriormente" }, { c: "8599-6/99", d: "Outras atividades de ensino" }] },
        { titulo: "Privacidade e Segurança",             cnae: [{ c: "6204-0/00", d: "Consultoria em tecnologia da informação" }] },
        { titulo: "Produção Musical",                    cnae: [{ c: "9001-9/02", d: "Produção musical" }, { c: "5920-1/00", d: "Atividades de gravação de som e de edição de música" }] },
        { titulo: "Reforço Escolar",                     cnae: [{ c: "8599-6/99", d: "Outras atividades de ensino" }] },
        { titulo: "Stylist, Moda e Passarela",           cnae: [{ c: "7319-0/04", d: "Consultoria em publicidade" }] },
        { titulo: "Tortas Salgadas da Veh",              cnae: [{ c: "5620-1/02", d: "Serviços de alimentação — bufê" }] },
        { titulo: "Tradução de Inglês",                  cnae: [{ c: "7490-1/01", d: "Serviços de tradução, interpretação e similares" }] },

        // ── Gaps de missões (serviços novos criados pra fechar ponte) ────────
        { titulo: "Educação Ambiental",                  cnae: [{ c: "8599-6/99", d: "Outras atividades de ensino" }] },
        { titulo: "Produção de Desfile",                 cnae: [{ c: "9001-9/03", d: "Produção de espetáculos de dança" }] },
        { titulo: "Futebol e Esporte",                   cnae: [{ c: "9319-1/01", d: "Produção e promoção de eventos esportivos" }] },

        // ── Correções (CNAE a formalizar — hoje no CNPJ estava errado/ausente)
        { titulo: "Artes Visuais",                       cnaeNovo: true, cnae: [{ c: "9002-7/01", d: "Atividades de artistas plásticos, jornalistas independentes e escritores" }] },
        { titulo: "Conexões",                            cnaeNovo: true, cnae: [{ c: "7020-4/00", d: "Atividades de consultoria em gestão empresarial" }] },
        { titulo: "Gestão Executiva",                    cnaeNovo: true, cnae: [{ c: "7020-4/00", d: "Atividades de consultoria em gestão empresarial" }] },
        { titulo: "Grafite",                             cnaeNovo: true, cnae: [{ c: "9002-7/01", d: "Atividades de artistas plásticos, jornalistas independentes e escritores" }] },
        { titulo: "Meditação",                           cnaeNovo: true, cnae: [{ c: "8690-9/99", d: "Outras atividades de atenção à saúde humana" }] },
        { titulo: "Rede de Talentos",                    cnaeNovo: true, cnae: [{ c: "7810-8/00", d: "Seleção e agenciamento de mão-de-obra" }] },

        // ── Novos CNAEs a formalizar (antes sem classificação) ───────────────
        { titulo: "Acompanhamento Nutricional",          cnaeNovo: true, cnae: [{ c: "8650-0/02", d: "Atividades de profissionais da nutrição" }] },
        { titulo: "Autocuidado",                         cnaeNovo: true, cnae: [{ c: "8690-9/99", d: "Outras atividades de atenção à saúde humana" }] },
        { titulo: "Comunicação Científica",              cnaeNovo: true, cnae: [{ c: "8599-6/99", d: "Outras atividades de ensino" }, { c: "5811-5/00", d: "Edição de livros" }] },
        { titulo: "Consultoria Jurídica",                cnaeNovo: true, cnae: [{ c: "6911-7/01", d: "Serviços advocatícios" }] },
        { titulo: "Cuidado com o Idoso",                 cnaeNovo: true, cnae: [{ c: "8712-3/00", d: "Serviços de assistência à saúde prestados a pacientes fora de unidades de saúde" }] },
        { titulo: "Desenho Botânico",                    cnaeNovo: true, cnae: [{ c: "9002-7/01", d: "Atividades de artistas plásticos, jornalistas independentes e escritores" }] },
        { titulo: "Drywall e Bioconstrução",             cnaeNovo: true, cnae: [{ c: "4330-4/02", d: "Instalação de portas, janelas, tetos, divisórias e armários" }, { c: "4399-1/99", d: "Outros serviços especializados para construção" }] },
        { titulo: "Gestão Administrativa",               cnaeNovo: true, cnae: [{ c: "8211-3/00", d: "Serviços combinados de escritório e apoio administrativo" }] },
        { titulo: "Gestão Contábil",                     cnaeNovo: true, cnae: [{ c: "6920-6/01", d: "Atividades de contabilidade" }] },
        { titulo: "Gestão Financeira",                   cnaeNovo: true, cnae: [{ c: "7020-4/00", d: "Atividades de consultoria em gestão empresarial" }] },
        { titulo: "Gestão Fiscal",                       cnaeNovo: true, cnae: [{ c: "6920-6/01", d: "Atividades de contabilidade" }] },
        { titulo: "Gestão Operacional",                  cnaeNovo: true, cnae: [{ c: "7020-4/00", d: "Atividades de consultoria em gestão empresarial" }] },
        { titulo: "Inteligência de Previsão",            cnaeNovo: true, cnae: [{ c: "7320-3/00", d: "Pesquisa de mercado e de opinião pública" }, { c: "6311-9/00", d: "Tratamento de dados, provedores de serviços de aplicação e serviços de hospedagem" }] },
        { titulo: "Market Making Preditivo",             cnaeNovo: true, cnae: [{ c: "6619-3/99", d: "Outras atividades auxiliares dos serviços financeiros" }] },
        { titulo: "Saúde Mental",                        cnaeNovo: true, cnae: [{ c: "8650-0/03", d: "Atividades de psicologia e psicanálise" }] },
        { titulo: "Psicologia Clínica",                  cnaeNovo: true, cnae: [{ c: "8650-0/03", d: "Atividades de psicologia e psicanálise" }] },
        { titulo: "Psicoterapia Psicanalítica",          cnaeNovo: true, cnae: [{ c: "8650-0/03", d: "Atividades de psicologia e psicanálise" }] },
        { titulo: "Psicologia Analítica (Junguiana)",    cnaeNovo: true, cnae: [{ c: "8650-0/03", d: "Atividades de psicologia e psicanálise" }] },
        { titulo: "Psicologia Social e Comunitária",     cnaeNovo: true, cnae: [{ c: "8650-0/03", d: "Atividades de psicologia e psicanálise" }] },
        { titulo: "Yoga",                                cnaeNovo: true, cnae: [{ c: "9313-1/00", d: "Atividades de condicionamento físico" }, { c: "8690-9/99", d: "Outras atividades de atenção à saúde humana" }] },

        // ── Gaps com CNAE a formalizar ───────────────────────────────────────
        { titulo: "Agrofloresta",                        cnaeNovo: true, cnae: [{ c: "0161-0/01", d: "Serviço de preparação de terreno, cultivo e colheita" }] },
        { titulo: "Compostagem",                         cnaeNovo: true, cnae: [{ c: "3821-1/00", d: "Tratamento e disposição de resíduos não-perigosos" }] },
        { titulo: "Produção de Eventos",                 cnaeNovo: true, cnae: [{ c: "8230-0/02", d: "Atividades de organização de feiras, congressos, exposições e festas" }] },

        // ── Hidden — profissões pessoais de entes em-memória/aposentados,
        // relações familiares e placeholders de menores. Não são serviços
        // comerciais da rede. Filtrados de /servicos/ via publicServices().
        { titulo: "Atriz",                 hidden: true },
        { titulo: "Cantora",               hidden: true },
        { titulo: "Distribuição de Frutas",hidden: true },
        { titulo: "Filha da Bruna",        hidden: true },
        { titulo: "Filho da Aime",         hidden: true },
        { titulo: "Futuro",                hidden: true },
        { titulo: "Mãe do Yuri",           hidden: true },
        { titulo: "Pai do Yuri",           hidden: true },
        { titulo: "Poeta",                 hidden: true }
    ];

    // Deriva o catálogo exposto a partir de serviceCatalog + .servicos de people/communities.
    // Canonical = serviceCatalog. Responsáveis = auto-derivados. Typos em
    // person/community.servicos geram console.warn (antes ficavam órfãos silenciosos).
    function deriveServices() {
        const byTitle = new Map();
        // Seed from canonical catalog (inclui implicitResponsavel)
        for (const def of serviceCatalog) {
            byTitle.set(def.titulo, {
                ...def,
                slug: slugify(def.titulo),
                responsavel: def.implicitResponsavel ? [...def.implicitResponsavel] : [],
                cnae: def.cnae || null
            });
        }
        // Auto-derive responsáveis a partir de people/communities.servicos
        const all = [...people, ...communities];
        for (const e of all) {
            for (const titulo of (e.servicos || [])) {
                if (!byTitle.has(titulo)) {
                    console.warn(`[AL] Serviço "${titulo}" usado por ${e.handle} não está em serviceCatalog — adicionando entry temporária`);
                    byTitle.set(titulo, { titulo, slug: slugify(titulo), responsavel: [], cnae: null });
                }
                const existing = byTitle.get(titulo);
                if (!existing.responsavel.includes(e.handle)) {
                    existing.responsavel.push(e.handle);
                }
            }
        }
        // Symmetric lookup: children arrays anexados ao parent
        const result = Array.from(byTitle.values());
        for (const s of result) {
            s.children = result.filter(x => x.parent === s.titulo).map(x => x.titulo);
        }
        return result.sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR"));
    }
    const services = deriveServices();

    // ─── UNIVERSOS (formerly "solutions") ────────────────────────────────────
    // Cada Universo é um projeto: pessoas unidas por um objetivo (tagline = palavra-chave).
    // `lifecycle: "active" | "futuro"` separa em /solucoes/. `universo: true` distingue
    // dos produtos/parcerias. Descrições longas vivem no perfil próprio do Universo,
    // não no catálogo.
    const solutions = [
        {
            handle: "artelonga", type: "solution", nome: "Arte Longa",
            tagline: "Conexão",
            url: "/artelonga/", urlLabel: "artelonga.com.br",
            internalLink: true,
            externalUrl: "https://artelonga.com.br",
            lema: "Conectando pessoas.",
            desc: "Conectando pessoas.",
            // Hub: como o perfil é o "home" do Universo, oferece atalhos para as
            // áreas principais. O resto (stack, serviços, etc.) já vive em /servicos/.
            homeLinks: [
                { label: "Sobre",     href: "/sobre/" },
                { label: "Parceiros", href: "/parceiros/" },
                { label: "Serviços",  href: "/servicos/" },
                { label: "Soluções",  href: "/solucoes/" }
            ],
            lifecycle: "active",
            universo: true,
            bundledServices: "*", // all services
            platforms: [
                { name: "Web", status: "done", statusText: "disponível" },
                { name: "Mobile / App", status: "wip", statusText: "Q2 2026 · em desenvolvimento" }
            ]
        },
        {
            handle: "quilomboaraucaria-solution", type: "solution", nome: "Quilombo Araucária",
            tagline: "Terra",
            url: "/quilomboaraucaria/", urlLabel: "quilomboaraucaria.org",
            internalLink: true,
            externalUrl: "https://quilomboaraucaria.org",
            lema: "Conexão entre pessoas e a natureza.",
            desc: "Site dinâmico que cobre autenticação, privacidade e segurança. Resistência ambiental, cultural e social — natureza, ancestralidade e tecnologia em comunhão.",
            lifecycle: "active",
            universo: true,
            bundledServices: ["Desenvolvimento Web", "Privacidade e Segurança", "Artes Visuais", "Grafite", "Murais e Fachadas"],
            platforms: [
                { name: "Web", status: "done", statusText: "disponível" },
                { name: "Mobile / App", status: "wip", statusText: "Q2 2026 · em desenvolvimento" }
            ]
        },
        {
            handle: "co", type: "solution", nome: "Co",
            tagline: "Conexão na Internet",
            url: "/co/", urlLabel: "lançamento · 1 de maio de 2026",
            internalLink: true,
            externalUrl: "https://co-artelonga-uat.fly.dev/",
            lema: "Organize seus Universos paralelos.",
            desc: "Aplicação web para organização e navegação entre seus Universos.",
            lifecycle: "futuro",
            universo: true,
            releaseDate: "2026-05-01",
            // Co: Yuri fez tudo (Inteligência e Tecnologia — collapsível), Luke contribuiu Design.
            // Igo e Mono também apoiaram (Gestão Operacional, Privacidade e Segurança).
            bundledServices: ["Inteligência e Tecnologia", "Design", "Gestão Executiva", "Gestão Operacional", "Privacidade e Segurança"],
            platforms: [
                { name: "Web", status: "wip", statusText: "1 de maio de 2026" },
                { name: "Mobile / App", status: "wip", statusText: "Q2 2026" }
            ]
        },
        {
            handle: "co-dev", type: "solution", nome: "Co Dev",
            tagline: "Formação",
            url: "/co-dev/", urlLabel: "em breve",
            internalLink: true,
            lema: "Escalabilidade desde o primeiro commit.",
            desc: "Framework open source de desenvolvimento multi-plataforma criado in-house para escalabilidade. Cobre privacidade e segurança, desenvolvimento de API e autenticação.",
            lifecycle: "futuro",
            universo: true,
            bundledServices: ["Desenvolvimento de API", "Privacidade e Segurança", "Inteligência e Tecnologia"],
            platforms: [
                { name: "Web", status: "wip", statusText: "em desenvolvimento" }
            ]
        },
        {
            handle: "qa-dev", type: "solution", nome: "QA Dev",
            tagline: "Tecnologia",
            url: "/qa-dev/", urlLabel: "em breve",
            internalLink: true,
            lema: "Aprenda construindo.",
            desc: "Exemplo open source derivado do template de site dinâmico do Quilombo Araucária, voltado para aprendizado. Cobre desenvolvimento web, mobile, sistemas operacionais nativos, privacidade e segurança.",
            lifecycle: "futuro",
            universo: true,
            bundledServices: ["Desenvolvimento Web", "Desenvolvimento de Software", "Privacidade e Segurança", "Inteligência e Tecnologia"],
            platforms: [
                { name: "Web", status: "wip", statusText: "em desenvolvimento" }
            ]
        },
        {
            handle: "yggdrasil", type: "solution", nome: "Yggdrasil",
            tagline: "Experiência",
            url: "/yggdrasil/", urlLabel: "lançamento · junho 2026",
            internalLink: true,
            lema: "Desenvolvimento de jogos sem limites.",
            desc: "Engine de jogos open source construída em torno do Godot. Onde criadores, jogadores e mundos convergem.",
            lifecycle: "futuro",
            universo: true,
            // Yggdrasil: Luke faz Design solo. Yuri cobre o resto (Inteligência e Tecnologia — collapsível) + Produção Musical (Antony).
            bundledServices: ["Inteligência e Tecnologia", "Design", "Produção Musical"],
            platforms: [
                { name: "Web", status: "wip", statusText: "junho 2026" },
                { name: "Mobile / App", status: "wip", statusText: "junho 2026" }
            ]
        },
        {
            handle: "shandara", type: "solution", nome: "Shandara",
            tagline: "Imersão",
            url: "/shandara/", urlLabel: "em construção",
            internalLink: true,
            lema: "Mundo modular para experiências interativas.",
            desc: "Universo de fantasia original, profundo e expansível, projetado para ser a base de experiências interativas e narrativas, com foco em diversidade cultural e sistemas próprios de mundo.",
            descLong: "Shandara é um mundo de fantasia criado para ser a base de experiências interativas, especialmente RPGs, mas também pode ser usado em jogos digitais, histórias e plataformas online.\n\nO que torna Shandara diferente de outros mundos de fantasia é que ele é estruturado em torno de seis forças primordiais que regem tudo: vida, matéria, tempo, transformação e energia. Essas forças moldam não apenas o ambiente, mas também as culturas, criaturas e conflitos do mundo.\n\nO mundo é habitado por várias espécies únicas, cada uma com sua própria identidade cultural, organização social e conexão com as forças fundamentais. Em vez de serem apenas variações de “raças clássicas”, cada povo de Shandara tem sua própria história, filosofia e papel ativo nos conflitos globais.\n\nO cenário também é marcado por um grande evento histórico — uma guerra que dividiu o mundo e alterou o equilíbrio entre magia, natureza e civilização — criando um ambiente cheio de tensões políticas, mistérios antigos e oportunidades narrativas.\n\nAlém disso, Shandara foi pensado desde o início como um universo modular, ou seja:\n\n• Pode ser usado como base para campanhas de RPG\n• Pode ser adaptado para plataformas digitais\n• Pode servir como template para criação de novas experiências\n\nIsso permite que ele funcione não apenas como uma história, mas como um ecossistema expansível, onde novos conteúdos, mecânicas e tecnologias podem ser integrados ao longo do tempo.",
            lifecycle: "futuro",
            universo: true,
            bundledServices: ["Design", "Inteligência e Tecnologia"],
            platforms: [
                { name: "Mesa de RPG", status: "wip", statusText: "em construção" },
                { name: "Plataforma digital", status: "wip", statusText: "futuro" }
            ]
        },
        {
            handle: "hedix-solution", type: "solution", nome: "Hedix",
            tagline: "Mercados de Previsão",
            url: "/hedix-solution/", urlLabel: "hedix.com.br",
            internalLink: true,
            externalUrl: "https://hedix.com.br/",
            lema: "Liquidez e formação de preço em mercados de previsão.",
            desc: "Formação de mercado e inteligência preditiva. Provê liquidez, forma preço e agrega sinal em mercados de previsão — onde a multidão é o oráculo.",
            lifecycle: "active",
            universo: false,
            comunidade: "hedix",
            bundledServices: ["Market Making Preditivo", "Inteligência de Previsão", "Desenvolvimento de API"],
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
        // Campo `servicos[]`: títulos do serviceCatalog que realizam a missão.
        // Validado em deriveServices(): typo vira console.warn.
        {
            handle: "raizes-do-futuro", type: "mission",
            nome: "Raízes do Futuro",
            subtitle: "Agrofloresta · horta e compostagem",
            comunidade: "quilomboaraucaria",
            objetivo: "Regeneração do solo e da comunidade via agrofloresta, horta e compostagem — o futuro planta raízes agora.",
            tags: ["terra", "sustentabilidade", "educacao"],
            servicos: ["Agrofloresta", "Compostagem", "Educação Ambiental", "Ensino, Formação e Liderança", "Drywall e Bioconstrução"],
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
            tags: ["cultura", "esporte", "social"],
            servicos: ["Produção de Desfile", "Futebol e Esporte", "Produção Musical", "Artes Visuais", "Dança e Expressão Corporal"]
        },
        {
            handle: "reparacao-historica", type: "mission",
            nome: "Reparação Histórica",
            subtitle: "Povos originários",
            comunidade: "quilomboaraucaria",
            objetivo: "\u201CA reparação à população negra e dos povos originários é urgente, é necessária, é fundamental.\u201D",
            objetivoAutor: "bia",
            tags: ["cultura", "justica"],
            envolvidos: ["rogerio", "alzira"],
            servicos: ["Mentoria Espiritual", "Ensino, Formação e Liderança"]
        },
        {
            handle: "eventos-espacos-saberes", type: "mission",
            nome: "Eventos e Espaços de Saberes",
            comunidade: "quilomboaraucaria",
            objetivo: "Encontros, aulas e espaços presenciais que transmitem os saberes da rede.",
            tags: ["educacao", "cultura", "eventos"],
            servicos: [
                "Produção de Eventos",
                "Ensino, Formação e Liderança",
                "Alfabetização",
                "Reforço Escolar",
                "Meditação",
                "Pensamento Islâmico",
                "Mentoria Espiritual",
                "Dança e Expressão Corporal",
                "Alimentação e Bebidas"
            ]
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
            if (s.hidden) return false;
            if (s.responsavel.some(h => isInactive(h))) return false;
            return true;
        });
    }

    // Roster = what shows on /parceiros/ (top-level people + communities in this order)
    // Order is explicit (the editorial layout).
    const rosterOrder = [
        "yuri", "igo", "joseantonio", "mono",
        "luke", "marina", "karina", "kayra", "aime",
        "syl", "raquel", "alice", "ramona", "rogerio", "alzira", "miguel", "joao",
        "bruna",
        "quilomboaraucaria", "hfsassociados", "hedix",
        "retro-umarizal"
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
                value: 12000,
                detail: "6 pessoas × R$ 2.000",
                breakdown: [
                    { label: "Yuri", value: 2000, handle: "yuri" },
                    { label: "Igo", value: 2000, handle: "igo" },
                    { label: "José Antônio", value: 2000, handle: "joseantonio" },
                    { label: "Mono", value: 2000, handle: "mono" },
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
    // Reverse index: quais missões usam este serviço?
    function missionsUsingService(titulo) {
        return missions.filter(m => (m.servicos || []).includes(titulo));
    }

    // Validação cruzada: todo mission.servicos[title] precisa existir no serviceCatalog.
    for (const m of missions) {
        for (const titulo of (m.servicos || [])) {
            if (!services.find(s => s.titulo === titulo)) {
                console.warn(`[AL] Missão "${m.handle}" referencia serviço "${titulo}" inexistente no serviceCatalog`);
            }
        }
    }

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
                titulo: "",
                texto: "Contribuir para a Agenda 2030 dos Objetivos de Desenvolvimento Sustentável.",
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
        serviceCatalog, slugify,
        serviceBySlug, serviceByTitle, solutionsUsingService, relatedServices,
        missionBySlug, topLevelMissions, missionsOfCommunity, subMissionsOf, missionsUsingService
    };
})(window);
