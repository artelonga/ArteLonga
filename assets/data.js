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

    // ─── PRICING ─────────────────────────────────────────────────────────────
    // Default rate da rede. Cada pessoa pode ter `hourlyRate` próprio (override).
    const DEFAULT_HOURLY_RATE = 100;

    // ─── LOCATION ────────────────────────────────────────────────────────────
    // Localização padrão da rede (Jardim Umarizal). Pessoas sem `location`
    // herdam isso. Rodney tem location próprio (Cangaíba). Schema:
    //   location: { estado, cidade, bairro }   ← preferido
    //   location: "Bairro · Cidade · UF"       ← legado, parseado em runtime
    const DEFAULT_LOCATION = Object.freeze({
        estado: "SP", cidade: "São Paulo", bairro: "Jardim Umarizal"
    });

    // ─── PEOPLE ──────────────────────────────────────────────────────────────
    const people = [
        {
            handle: "yuri", type: "person", nome: "Yuri",
            role: "Sementes", tags: ["fundador", "parceiro"],
            pic: "/yuri/yuri.jpg?v=20260428",
            birthDate: "1993-06-24T12:30:00-03:00",
            bioTitle: "Terra",
            bioCurta: "Filho de Kiyoshi e Soninha e fascinado por todos que me inspiram. Como neurocientista, busco compreender a consciência. Como ser humano, busco compreender os saberes ancestrais. Trabalho com desenvolvimento de tecnologia sustentável.",
            bio: "Filho de Kiyoshi e Soninha e fascinado por [todos que me inspiram](/parceiros/#todos)\nComo neurocientista, busco compreender a consciência\nComo ser humano, busco compreender os saberes ancestrais\nTrabalho com desenvolvimento de [tecnologia sustentável](/solucoes/)\n\nNão haviam nomes quando nossos ancestrais pisaram na Terra\n\nO eu não se faz de reconhecimento ou recompensa. Não é sobre mim.\n\nNao chamavam-se japoneses ou nordestinos\nafricanos ou indígenas.\nEram gente, como a gente\nSem nome\n\nO eu são [todos que inspiram](/parceiros/#todos)\nE avaxi ete'i\n\nPerdi a planilha orçamentária,\nTropecei no Quilombo Araucária e encontrei Zé Pilintra,\nEle sábio, eu ainda com trinta\nCompartilhou comigo coragem pra recomeçar\n\nA missão é cuidar da Terra\nSenão todo mundo vai embora, só a vovó que vai poder ficar\nA tecnologia é pedal que acelera,\nEntão seja ciente e começa com Yvyrupa\n\nFaça junto, compartilha a colheita, Yvyrupa nhande tekoa,\nGuarda ka'a porã e seus guardiões guarani mbya\nProteção no àiyé, caminha sem medo Olódùmarè, Òrìşà èdè Yorùbá\nSegredo, coração sujo e ubuntu pra um dia desvendar\n\nNão se esquece de respirar agora, a palavra não importa,\nA justiça abre a porta e os parente vem pro arraiá.\n\nXeramoi passou o petyngua,\nXejaryi com sabedoria sabia que eu dormia com medo de acordar\n\nMe botou pra dormir no opy ouvindo jui no calor do tata\nSonhei que eu era eu mesmo\nFoi aí que eu senti o que era existir\nE acordei querendo trabalhar\n\nGuanyin e o sagrado feminino, A Ana, a Soninha e todas as kunha\nJohn, Alicia, kiryngue kuery vao colocar sentido nas palavras que você inventar\nCuida do Kiyoshi porque já não é de hoje que ele vem cuidando de ti\nSem tentar traduzir o que so presenca e atencao te permitem sentir,\n\nSem medo, por aqui eu me expresso em palavra ou em rima\nEu e todo o Universo, mbaraete, fé, nhande kuery\nNhande pytunju, a expressão de nhanderu\nChuva é tupã mandando descansar, autocuidado nhane noite\n\nJaxy pyau",
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
            servicos: ["Escrita, Interpretação e Tradução", "Ensino, Formação e Liderança", "Inteligência e Tecnologia", "Gestão Executiva", "Tradução EN-PT", "Tradução Guarani-PT"],
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
            pic: "mono\mono.jpeg", bio: "Atuo em formação na área de Segurança da Informação, com interesse no desenvolvimento de práticas que integrem proteção de dados, análise de vulnerabilidades e consciência organizacional. Minha trajetória combina estudo contínuo, curiosidade por tecnologia e sensibilidade humana, orientando minha forma de compreender riscos e construir soluções. Tenho interesse amplo por tecnologia e busco constantemente aprender sobre diferentes áreas da TI, explorando desde fundamentos até novas ferramentas e tendências. Sou natural de Brasília e, aos 16 anos, me mudei para a Bahia, em Ilhéus. Anos depois, decidi sair em busca de crescimento profissional e artístico, estabelecendo-me no Rio Grande do Sul, onde reconstruí minha trajetória conciliando trabalho e formação. No campo artístico, desenvolvo minha carreira como ator, com formação construída ao longo de anos de estudo e prática. Integrei a companhia Teatro Luz & Cena, experiência que fortaleceu minha presença cênica e consolidou a arte como parte essencial da minha identidade. Posteriormente, segui para São Paulo, onde tive contato com a Arte Longa e o Quilombo Auracária, filosofias que ampliaram minha visão sobre criação, coletividade e propósito, influenciando diretamente minha forma de pensar e atuar tanto na arte quanto na vida profissional. Foi a partir de experiências reais com vulnerabilidades e golpes que encontrei na cibersegurança um novo propósito. Hoje, compreendo a segurança da informação não apenas como um campo técnico, mas como uma forma de proteger pessoas, relações e histórias. Acredito na integração entre áreas humanas e tecnológicas como um diferencial essencial para o presente e o futuro",
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
            hourlyRate: 275,
            servicos: ["Saúde Mental", "Psicologia Clínica", "Autocuidado"]
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
            servicos: ["Tradução PT-EN", "Tradução PT-DE", "Tradução EN-DE"]
        },
        {
            handle: "denise", type: "person", nome: "Denise",
            role: "Tradução · Guarani", tags: ["parceiro"],
            pic: null, bio: "",
            servicos: ["Tradução PT-Guarani"]
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
            communities: ["quilomboaraucaria"],
            contacts: {
                whatsapp: "5511983717331",
                whatsappDisplay: "+55 11 98371-7331",
                instagram: "TerraPsicoterapia",
                tagline: "Psicoterapia online e presencial: Inicie seu atendimento ⤵️"
            }
        },
        {
            handle: "rodney", type: "person", nome: "Rodney",
            role: "Piloto de Drone", tags: ["parceiro"],
            pic: null, bio: "",
            location: { estado: "SP", cidade: "São Paulo", bairro: "Cangaíba" },
            servicos: ["Piloto de Drone"]
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
        { handle: "veh", type: "person", nome: "Veh", role: "", tags: ["parceiro"], pic: null, bio: "", servicos: ["Alimentação e Bebidas", "Tortas Salgadas da Veh"], communities: ["quilomboaraucaria"], contacts: { tagline: "Tortas salgadas artesanais. Faça seu pedido ⤵️" } },
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
    //   paraQuem:           string curta (2-3 palavras) — pra quem o serviço é.
    //   hoursLow/hoursHigh: estimativa em horas (números). Pode ser fracionário
    //                        pra produtos (ex.: torta = 0.8-2h, palavra = 0.003-0.005h).
    //                        Sem isso, o serviço não exibe preço.
    //   unit:               unidade do preço — "sessão", "aula", "consulta",
    //                        "oficina", "torta", "unidade", "pessoa", "palavra",
    //                        "diária", "treino", "grupo", "hora". Vai como sufixo
    //                        do total ("R\$ 100/sessão"). Default = nada.
    //   recurring:          true = serviço mensal recorrente. Sufixo "/mês".
    //   digital:            true = entregue remotamente (web/áudio/vídeo/texto).
    //                        Bypass do filtro de localização — aparece em qualquer
    //                        cidade/bairro. Marcar tudo que é online por natureza.
    //   planos:             array de [{ label, hours, unit? }] — pacotes de tempo
    //                        nomeados (ex.: "Plano semanal" = 4h, "Plano mensal" =
    //                        16h). Cada plano é renderizado com label + preço
    //                        computado (hours × rate dos responsáveis).
    //                        Override: quando o serviço tem planos, eles renderizam
    //                        no card e no detalhe — mesmo pra não-sócios. Bom pra
    //                        prestadores que querem publicar preços-pacote.
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
        { titulo: "Desenvolvimento de API",      parent: "Inteligência e Tecnologia", implicitResponsavel: ["yuri"], paraQuem: "Empresas · times técnicos", digital: true, hoursLow: 30, hoursHigh: 150, cnae: [{ c: "6202-3/00", d: "Desenvolvimento e licenciamento de software customizável" }] },
        { titulo: "Desenvolvimento de Software", parent: "Inteligência e Tecnologia", implicitResponsavel: ["yuri"], paraQuem: "Empresas · startups", digital: true, hoursLow: 80, hoursHigh: 400, cnae: [{ c: "6202-3/00", d: "Desenvolvimento e licenciamento de software customizável" }] },
        { titulo: "Desenvolvimento Web",         parent: "Inteligência e Tecnologia", implicitResponsavel: ["yuri"], paraQuem: "Empresas · estúdios", digital: true, hoursLow: 40, hoursHigh: 200, cnae: [{ c: "6201-5/02", d: "Web design" }, { c: "6202-3/00", d: "Desenvolvimento e licenciamento de software customizável" }] },
        { titulo: "Nuvem",                       parent: "Inteligência e Tecnologia", implicitResponsavel: ["yuri"], paraQuem: "Empresas · projetos", digital: true, hoursLow: 10, hoursHigh: 80, cnae: [{ c: "6204-0/00", d: "Consultoria em TI" }, { c: "6319-4/00", d: "Provedores de conteúdo e serviços de informação na internet" }] },
        { titulo: "Computação",                  parent: "Inteligência e Tecnologia", implicitResponsavel: ["yuri"], paraQuem: "Times técnicos", digital: true, hoursLow: 10, hoursHigh: 80, cnae: [{ c: "6204-0/00", d: "Consultoria em TI" }] },
        { titulo: "Dados e Armazenamento",       parent: "Inteligência e Tecnologia", implicitResponsavel: ["yuri"], paraQuem: "Empresas · times de dados", digital: true, hoursLow: 15, hoursHigh: 100, cnae: [{ c: "6204-0/00", d: "Consultoria em TI" }, { c: "6319-4/00", d: "Provedores de serviços de informação na internet" }] },
        { titulo: "Hardware",                    parent: "Inteligência e Tecnologia", implicitResponsavel: ["yuri"], paraQuem: "Estúdios · projetos", digital: true, hoursLow: 8, hoursHigh: 60, cnae: [{ c: "6204-0/00", d: "Consultoria em TI" }] },
        { titulo: "Sistemas Operacionais",       parent: "Inteligência e Tecnologia", implicitResponsavel: ["yuri"], paraQuem: "Times técnicos", digital: true, hoursLow: 10, hoursHigh: 80, cnae: [{ c: "6204-0/00", d: "Consultoria em TI" }] },
        { titulo: "Redes",                       parent: "Inteligência e Tecnologia", implicitResponsavel: ["yuri"], paraQuem: "Empresas · escritórios", digital: true, hoursLow: 8, hoursHigh: 60, cnae: [{ c: "6204-0/00", d: "Consultoria em TI" }] },
        { titulo: "Tráfego e Crescimento",       parent: "Inteligência e Tecnologia", implicitResponsavel: ["yuri"], paraQuem: "Marcas · e-commerce", digital: true, hoursLow: 20, hoursHigh: 80, recurring: true, cnae: [{ c: "7319-0/04", d: "Consultoria em publicidade" }, { c: "6319-4/00", d: "Portais, provedores de conteúdo e serviços de informação na internet" }] },
        { titulo: "Automação de Processos",      parent: "Inteligência e Tecnologia", implicitResponsavel: ["yuri"], paraQuem: "Empresas · operações", digital: true, hoursLow: 8, hoursHigh: 20, cnaeNovo: true, cnae: [{ c: "6202-3/00", d: "Desenvolvimento e licenciamento de software customizável" }, { c: "6204-0/00", d: "Consultoria em tecnologia da informação" }] },

        // ── Serviços com CNAE já formalizado no CNPJ ─────────────────────────
        { titulo: "Alfabetização",                       paraQuem: "Crianças · adultos", hoursLow: 1, hoursHigh: 2, unit: "aula", cnae: [{ c: "8599-6/99", d: "Outras atividades de ensino não especificadas anteriormente" }] },
        { titulo: "Alimentação e Bebidas",               paraQuem: "Eventos · empresas", hoursLow: 0.35, hoursHigh: 1, unit: "pessoa", cnae: [{ c: "5620-1/02", d: "Serviços de alimentação para eventos e recepções — bufê" }] },
        { titulo: "Hambúrguer Artesanal", paraQuem: "Bairro · delivery", hoursLow: 0.25, hoursHigh: 0.6, unit: "unidade", cnaeNovo: true, cnae: [{ c: "5611-2/01", d: "Restaurantes e similares" }, { c: "5620-1/04", d: "Fornecimento de alimentos preparados preponderantemente para consumo domiciliar" }] },
        { titulo: "Comunicação Visual",                  paraQuem: "Eventos · marcas", digital: true, hoursLow: 8, hoursHigh: 30, cnae: [{ c: "7410-2/03", d: "Design de produto" }, { c: "7319-0/04", d: "Consultoria em publicidade" }] },
        { titulo: "Consultoria em Moda",                 paraQuem: "Marcas · pessoas", hoursLow: 4, hoursHigh: 20, cnae: [{ c: "7319-0/04", d: "Consultoria em publicidade" }] },
        { titulo: "Consultoria em TI",                   paraQuem: "Pequenas empresas · ONGs", digital: true, hoursLow: 4, hoursHigh: 40, cnae: [{ c: "6204-0/00", d: "Consultoria em tecnologia da informação" }] },
        { titulo: "Criação de Conteúdo",                 paraQuem: "Marcas · pessoas", digital: true, hoursLow: 15, hoursHigh: 60, recurring: true, cnae: [{ c: "5911-1/99", d: "Produção cinematográfica, de vídeos e TV" }, { c: "5912-0/99", d: "Pós-produção audiovisual" }] },
        { titulo: "Dança e Expressão Corporal",          paraQuem: "Crianças · adultos", cnae: [{ c: "8592-9/01", d: "Ensino de dança" }] },
        { titulo: "Design",                              paraQuem: "Marcas · produtos", digital: true, hoursLow: 8, hoursHigh: 60, cnae: [{ c: "7410-2/03", d: "Design de produto" }] },
        { titulo: "Ensino, Formação e Liderança",        paraQuem: "Empresas · times", hoursLow: 2, hoursHigh: 8, unit: "sessão", cnae: [{ c: "8599-6/99", d: "Outras atividades de ensino" }, { c: "8599-6/03", d: "Treinamento em informática" }] },
        { titulo: "Escrita, Interpretação e Tradução",   paraQuem: "Empresas · autores", digital: true, hoursLow: 5, hoursHigh: 30, cnae: [{ c: "7490-1/01", d: "Serviços de tradução, interpretação e similares" }, { c: "5811-5/00", d: "Edição de livros" }] },
        { titulo: "Experiência de Usuário (UI/UX)",      paraQuem: "Produtos · apps", digital: true, hoursLow: 15, hoursHigh: 100, cnae: [{ c: "7410-2/03", d: "Design de produto" }, { c: "6201-5/02", d: "Web design" }] },
        { titulo: "Fotografia",                          paraQuem: "Eventos · ensaios", hoursLow: 6, hoursHigh: 15, cnae: [{ c: "7420-0/01", d: "Atividades de produção de fotografias" }, { c: "7420-0/04", d: "Filmagem de festas e eventos" }] },
        { titulo: "Piloto de Drone",                     paraQuem: "Eventos · obras · imobiliário", cnaeNovo: true, cnae: [{ c: "7420-0/02", d: "Atividades de produção de fotografias aéreas" }, { c: "5911-1/99", d: "Produção de vídeos não especificada anteriormente" }] },
        { titulo: "Inteligência e Tecnologia",           paraQuem: "Empresas · estúdios", digital: true, hoursLow: 20, hoursHigh: 200, cnae: [{ c: "6204-0/00", d: "Consultoria em tecnologia da informação" }, { c: "6319-4/00", d: "Portais, provedores de conteúdo e serviços de informação na internet" }] },
        { titulo: "Marketing Digital",                   paraQuem: "Marcas · pequenas empresas", digital: true, hoursLow: 20, hoursHigh: 80, recurring: true, cnae: [{ c: "7319-0/04", d: "Consultoria em publicidade" }] },
        { titulo: "Mentoria Espiritual",                 paraQuem: "Adultos em transição", digital: true, hoursLow: 1, hoursHigh: 2, unit: "sessão", cnae: [{ c: "8599-6/99", d: "Outras atividades de ensino" }] },
        { titulo: "Murais e Fachadas",                   paraQuem: "Comércio · casa", hoursLow: 16, hoursHigh: 80, cnae: [{ c: "7410-2/03", d: "Design de produto" }, { c: "7319-0/01", d: "Criação de estandes para feiras e exposições" }] },
        { titulo: "Pensamento Islâmico",                 paraQuem: "Curiosos · estudantes", digital: true, hoursLow: 1, hoursHigh: 2, unit: "sessão", cnae: [{ c: "8592-9/99", d: "Ensino de arte e cultura não especificado anteriormente" }, { c: "8599-6/99", d: "Outras atividades de ensino" }] },
        { titulo: "Privacidade e Segurança",             paraQuem: "Empresas · projetos sensíveis", digital: true, hoursLow: 20, hoursHigh: 80, cnae: [{ c: "6204-0/00", d: "Consultoria em tecnologia da informação" }] },
        { titulo: "Produção Musical",                    paraQuem: "Artistas · marcas", hoursLow: 8, hoursHigh: 20, cnae: [{ c: "9001-9/02", d: "Produção musical" }, { c: "5920-1/00", d: "Atividades de gravação de som e de edição de música" }] },
        { titulo: "Reforço Escolar",                     paraQuem: "Crianças · adolescentes", hoursLow: 1, hoursHigh: 2, unit: "aula", cnae: [{ c: "8599-6/99", d: "Outras atividades de ensino" }] },
        { titulo: "Stylist, Moda e Passarela",           paraQuem: "Marcas · eventos", hoursLow: 4, hoursHigh: 20, cnae: [{ c: "7319-0/04", d: "Consultoria em publicidade" }] },
        { titulo: "Tortas Salgadas da Veh", paraQuem: "Eventos · empresas",
          planos: [
              { label: "Sob demanda" },
              { label: "Semanal" },
              { label: "Mensal" }
          ],
          cnae: [{ c: "5620-1/02", d: "Serviços de alimentação — bufê" }] },
        // ── Tradução · parent + sub-pares de idiomas ──
        // Padrão da rede: 0,003-0,005h por palavra → R\$ 0,30 – R\$ 0,50/palavra.
        { titulo: "Tradução",                            paraQuem: "Empresas · autores · pesquisadores", digital: true, hoursLow: 0.003, hoursHigh: 0.005, unit: "palavra", cnae: [{ c: "7490-1/01", d: "Serviços de tradução, interpretação e similares" }] },
        { titulo: "Tradução PT-EN",                      parent: "Tradução", implicitResponsavel: ["ramona"], paraQuem: "Português → Inglês", digital: true, hoursLow: 0.003, hoursHigh: 0.005, unit: "palavra", cnae: [{ c: "7490-1/01", d: "Serviços de tradução, interpretação e similares" }] },
        { titulo: "Tradução PT-DE",                      parent: "Tradução", implicitResponsavel: ["ramona"], paraQuem: "Português → Alemão", digital: true, hoursLow: 0.003, hoursHigh: 0.005, unit: "palavra", cnae: [{ c: "7490-1/01", d: "Serviços de tradução, interpretação e similares" }] },
        { titulo: "Tradução EN-DE",                      parent: "Tradução", implicitResponsavel: ["ramona"], paraQuem: "Inglês → Alemão", digital: true, hoursLow: 0.003, hoursHigh: 0.005, unit: "palavra", cnae: [{ c: "7490-1/01", d: "Serviços de tradução, interpretação e similares" }] },
        { titulo: "Tradução EN-PT",                      parent: "Tradução", implicitResponsavel: ["yuri"], paraQuem: "Inglês → Português", digital: true, hoursLow: 0.003, hoursHigh: 0.005, unit: "palavra", cnae: [{ c: "7490-1/01", d: "Serviços de tradução, interpretação e similares" }] },
        { titulo: "Tradução PT-Guarani",                 parent: "Tradução", implicitResponsavel: ["denise"], paraQuem: "Português → Guarani", digital: true, hoursLow: 0.003, hoursHigh: 0.005, unit: "palavra", cnae: [{ c: "7490-1/01", d: "Serviços de tradução, interpretação e similares" }] },
        { titulo: "Tradução Guarani-PT",                 parent: "Tradução", implicitResponsavel: ["yuri"], paraQuem: "Guarani → Português", digital: true, hoursLow: 0.003, hoursHigh: 0.005, unit: "palavra", cnae: [{ c: "7490-1/01", d: "Serviços de tradução, interpretação e similares" }] },

        // ── Gaps de missões (serviços novos criados pra fechar ponte) ────────
        { titulo: "Educação Ambiental",                  paraQuem: "Escolas · ONGs", hoursLow: 2, hoursHigh: 8, unit: "oficina", cnae: [{ c: "8599-6/99", d: "Outras atividades de ensino" }] },
        { titulo: "Produção de Desfile",                 paraQuem: "Marcas · eventos", hoursLow: 40, hoursHigh: 200, cnae: [{ c: "9001-9/03", d: "Produção de espetáculos de dança" }] },
        { titulo: "Futebol e Esporte",                   paraQuem: "Crianças · juvenis", hoursLow: 1, hoursHigh: 2, unit: "treino", cnae: [{ c: "9319-1/01", d: "Produção e promoção de eventos esportivos" }] },

        // ── Correções (CNAE a formalizar — hoje no CNPJ estava errado/ausente)
        { titulo: "Artes Visuais",                       paraQuem: "Coleções · ativações", hoursLow: 10, hoursHigh: 200, cnaeNovo: true, cnae: [{ c: "9002-7/01", d: "Atividades de artistas plásticos, jornalistas independentes e escritores" }] },
        { titulo: "Conexões",                            paraQuem: "Empreendedores · rede", digital: true, cnaeNovo: true, cnae: [{ c: "7020-4/00", d: "Atividades de consultoria em gestão empresarial" }] },
        { titulo: "Gestão Executiva",                    paraQuem: "Pequenas empresas", digital: true, hoursLow: 20, hoursHigh: 80, recurring: true, cnaeNovo: true, cnae: [{ c: "7020-4/00", d: "Atividades de consultoria em gestão empresarial" }] },
        { titulo: "Grafite",                             paraQuem: "Eventos · ativações", hoursLow: 8, hoursHigh: 40, cnaeNovo: true, cnae: [{ c: "9002-7/01", d: "Atividades de artistas plásticos, jornalistas independentes e escritores" }] },
        { titulo: "Meditação",                           paraQuem: "Iniciantes · grupos", cnaeNovo: true, cnae: [{ c: "8690-9/99", d: "Outras atividades de atenção à saúde humana" }] },
        { titulo: "Rede de Talentos",                    paraQuem: "Empresas · contratantes", digital: true, cnaeNovo: true, cnae: [{ c: "7810-8/00", d: "Seleção e agenciamento de mão-de-obra" }] },

        // ── Novos CNAEs a formalizar (antes sem classificação) ───────────────
        { titulo: "Acompanhamento Nutricional",          paraQuem: "Adultos · esportistas",
digital: true,           planos: [
              { hours: 1 },
              { label: "Semanal" },
              { label: "Mensal" }
          ],
          cnaeNovo: true, cnae: [{ c: "8650-0/02", d: "Atividades de profissionais da nutrição" }] },
        { titulo: "Autocuidado",                         paraQuem: "Adultos", digital: true, cnaeNovo: true, cnae: [{ c: "8690-9/99", d: "Outras atividades de atenção à saúde humana" }] },
        { titulo: "Auditoria",                           paraQuem: "Empresas · governança", digital: true, cnaeNovo: true, cnae: [{ c: "6920-6/02", d: "Atividades de auditoria contábil e tributária" }] },
        { titulo: "Comunicação Científica",              paraQuem: "Pesquisadores · marcas", digital: true, hoursLow: 5, hoursHigh: 30, cnaeNovo: true, cnae: [{ c: "8599-6/99", d: "Outras atividades de ensino" }, { c: "5811-5/00", d: "Edição de livros" }] },
        { titulo: "Consultoria Jurídica",                paraQuem: "Pequenas empresas · pessoas", digital: true, hoursLow: 1, hoursHigh: 1, unit: "hora", cnaeNovo: true, cnae: [{ c: "6911-7/01", d: "Serviços advocatícios" }] },
        { titulo: "Cuidado com o Idoso",                 paraQuem: "Famílias · idosos",
          planos: [
              { hours: 6 },
              { label: "Semanal" },
              { label: "Mensal" }
          ],
          cnaeNovo: true, cnae: [{ c: "8712-3/00", d: "Serviços de assistência à saúde prestados a pacientes fora de unidades de saúde" }] },
        { titulo: "Desenho Botânico",                    paraQuem: "Editoras · coleções", hoursLow: 8, hoursHigh: 40, cnaeNovo: true, cnae: [{ c: "9002-7/01", d: "Atividades de artistas plásticos, jornalistas independentes e escritores" }] },
        { titulo: "Drywall e Bioconstrução",             paraQuem: "Casa · obra", hoursLow: 20, hoursHigh: 500, cnaeNovo: true, cnae: [{ c: "4330-4/02", d: "Instalação de portas, janelas, tetos, divisórias e armários" }, { c: "4399-1/99", d: "Outros serviços especializados para construção" }] },
        { titulo: "Gestão Administrativa",               paraQuem: "Pequenas empresas", digital: true, hoursLow: 20, hoursHigh: 80, recurring: true, cnaeNovo: true, cnae: [{ c: "8211-3/00", d: "Serviços combinados de escritório e apoio administrativo" }] },
        { titulo: "Gestão Contábil",                     paraQuem: "Pequenas empresas · MEI", digital: true, hoursLow: 5, hoursHigh: 20, recurring: true, cnaeNovo: true, cnae: [{ c: "6920-6/01", d: "Atividades de contabilidade" }] },
        { titulo: "Gestão Financeira",                   paraQuem: "Pequenas empresas", digital: true, hoursLow: 8, hoursHigh: 40, recurring: true, cnaeNovo: true, cnae: [{ c: "7020-4/00", d: "Atividades de consultoria em gestão empresarial" }] },
        { titulo: "Gestão Fiscal",                       paraQuem: "Pequenas empresas · MEI", digital: true, hoursLow: 5, hoursHigh: 20, recurring: true, cnaeNovo: true, cnae: [{ c: "6920-6/01", d: "Atividades de contabilidade" }] },
        { titulo: "Gestão Operacional",                  paraQuem: "Pequenas empresas", digital: true, hoursLow: 20, hoursHigh: 80, recurring: true, cnaeNovo: true, cnae: [{ c: "7020-4/00", d: "Atividades de consultoria em gestão empresarial" }] },
        { titulo: "Gestão de Logística",                 paraQuem: "Empresas · operações", digital: true, cnaeNovo: true, cnae: [{ c: "5229-0/01", d: "Serviços de apoio ao transporte por táxi" }, { c: "7020-4/00", d: "Atividades de consultoria em gestão empresarial" }] },
        { titulo: "Gestão de Vendas",                    paraQuem: "Empresas · times comerciais", digital: true, cnaeNovo: true, cnae: [{ c: "7020-4/00", d: "Atividades de consultoria em gestão empresarial" }, { c: "7319-0/04", d: "Consultoria em publicidade" }] },
        { titulo: "Inteligência de Previsão",            paraQuem: "Empresas · fundos", digital: true, hoursLow: 40, hoursHigh: 400, cnaeNovo: true, cnae: [{ c: "7320-3/00", d: "Pesquisa de mercado e de opinião pública" }, { c: "6311-9/00", d: "Tratamento de dados, provedores de serviços de aplicação e serviços de hospedagem" }] },
        { titulo: "Market Making Preditivo",             paraQuem: "Mercados · plataformas", digital: true, hoursLow: 40, hoursHigh: 400, cnaeNovo: true, cnae: [{ c: "6619-3/99", d: "Outras atividades auxiliares dos serviços financeiros" }] },
        // ── Sub-serviços de "Saúde Mental" (Raquel cobre a árvore) ──
        { titulo: "Saúde Mental",                        paraQuem: "Adultos · adolescentes", digital: true, cnaeNovo: true, cnae: [{ c: "8650-0/03", d: "Atividades de psicologia e psicanálise" }] },
        { titulo: "Psicologia Clínica",                  parent: "Saúde Mental", paraQuem: "Adultos", digital: true, cnaeNovo: true, cnae: [{ c: "8650-0/03", d: "Atividades de psicologia e psicanálise" }] },
        { titulo: "Psicoterapia Psicanalítica",          parent: "Saúde Mental", paraQuem: "Adultos", digital: true, hoursLow: 1, hoursHigh: 1, unit: "sessão", cnaeNovo: true, cnae: [{ c: "8650-0/03", d: "Atividades de psicologia e psicanálise" }] },
        { titulo: "Psicologia Analítica (Junguiana)",    parent: "Saúde Mental", paraQuem: "Adultos", digital: true, hoursLow: 1, hoursHigh: 1, unit: "sessão", cnaeNovo: true, cnae: [{ c: "8650-0/03", d: "Atividades de psicologia e psicanálise" }] },
        { titulo: "Psicologia Social e Comunitária",     parent: "Saúde Mental", paraQuem: "Grupos · ONGs", digital: true, hoursLow: 2, hoursHigh: 8, unit: "grupo", cnaeNovo: true, cnae: [{ c: "8650-0/03", d: "Atividades de psicologia e psicanálise" }] },
        { titulo: "Yoga",                                paraQuem: "Iniciantes · turmas", cnaeNovo: true, cnae: [{ c: "9313-1/00", d: "Atividades de condicionamento físico" }, { c: "8690-9/99", d: "Outras atividades de atenção à saúde humana" }] },

        // ── Gaps com CNAE a formalizar ───────────────────────────────────────
        { titulo: "Agrofloresta",                        paraQuem: "Sítios · escolas", hoursLow: 40, hoursHigh: 400, cnaeNovo: true, cnae: [{ c: "0161-0/01", d: "Serviço de preparação de terreno, cultivo e colheita" }] },
        { titulo: "Compostagem",                         paraQuem: "Casa · condomínios", hoursLow: 8, hoursHigh: 30, cnaeNovo: true, cnae: [{ c: "3821-1/00", d: "Tratamento e disposição de resíduos não-perigosos" }] },
        { titulo: "Produção de Eventos",                 paraQuem: "Marcas · empresas", hoursLow: 30, hoursHigh: 150, cnaeNovo: true, cnae: [{ c: "8230-0/02", d: "Atividades de organização de feiras, congressos, exposições e festas" }] },

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
            tagline: "Humanidade",
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
            tagline: "Conexão",
            url: "/co/", urlLabel: "co.artelonga.com.br",
            internalLink: true,
            externalUrl: "https://co.artelonga.com.br/",
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
            desc: "Engine de jogos completa, open source, construída em torno do Godot. Do arcade 2D aos mundos 3D — onde criadores, jogadores e universos convergem.",
            descLong: "Yggdrasil nasce como engine de jogos de verdade: ferramentas de criação, runtime, multiplayer e distribuição na mesma plataforma open source. A interface jogável da Arte Longa deixa de ser uma camada decorativa e passa a ser um motor de jogos completo.\n\nLançamento · arcade 2D pronto para jogar\n\nNa estreia (junho de 2026), a Yggdrasil já vem com uma biblioteca de jogos arcade 2D — Snake, Tetris, Space Invaders, Pong e variações — jogáveis direto no navegador e no app. Servem como vitrine, sandbox para novos criadores e referência viva de como construir jogos sobre a engine.\n\nRoadmap · mundos 3D no horizonte\n\nA fundação 3D já vive no Godot. O passo seguinte é abrir esse caminho aos criadores: cenários 3D, espaços persistentes e mundos compartilhados. A meta é que a Yggdrasil leve do pixel ao polígono sem trocar de ferramenta — um único universo de criação, do arcade clássico ao mundo aberto.",
            lifecycle: "futuro",
            universo: true,
            // Yggdrasil: Luke faz Design solo. Yuri cobre o resto (Inteligência e Tecnologia — collapsível) + Produção Musical (Antony).
            bundledServices: ["Inteligência e Tecnologia", "Design", "Produção Musical"],
            platforms: [
                { name: "Web · arcade 2D", status: "wip", statusText: "junho 2026" },
                { name: "Mobile / App · arcade 2D", status: "wip", statusText: "junho 2026" },
                { name: "Mundos 3D", status: "wip", statusText: "no horizonte" }
            ]
        },
        {
            handle: "agora", type: "solution", nome: "Ágora",
            tagline: "Coletivo",
            url: "/agora/", urlLabel: "em breve",
            internalLink: true,
            lema: "Escritório digital dos parceiros Arte Longa.",
            desc: "Coworking digital para os parceiros Arte Longa: salas, presença, agendas e ferramentas compartilhadas em um só lugar. O dia a dia da rede acontece aqui.",
            descLong: "A Ágora é o escritório digital da rede Arte Longa — um espaço comum onde os parceiros se encontram, conversam, planejam e tocam projetos lado a lado, mesmo distantes geograficamente.\n\nEm breve · o que a Ágora reúne\n\nSalas de trabalho persistentes, presença leve entre parceiros, agendas integradas, quadros compartilhados e atalhos para os outros Universos da rede (Co, Yggdrasil, Quilombo Araucária). O coworking físico vira coworking digital sem perder o senso de coletivo.\n\nPara quem é\n\nParceiros Arte Longa, suas comunidades e missões. A Ágora é o tecido que liga gestão, criação e operação no dia a dia da rede.",
            lifecycle: "futuro",
            universo: true,
            bundledServices: ["Inteligência e Tecnologia", "Design", "Gestão Operacional", "Gestão Executiva", "Conexões"],
            platforms: [
                { name: "Web", status: "wip", statusText: "em breve" },
                { name: "Mobile / App", status: "wip", statusText: "em breve" }
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

    // ─── PORTFOLIO ────────────────────────────────────────────────────────────
    // Conceito derivado: entry = intersecção parceiro × serviço.
    // Não tem tipo próprio no schema — é gerado em runtime a partir de
    // service.responsavel. Documentado em docs/SCHEMA.md.
    function portfolioEntry(parceiroHandle, servico) {
        const p = get(parceiroHandle);
        return {
            parceiro: parceiroHandle,
            parceiroNome: p ? p.nome : parceiroHandle,
            servico: servico.titulo,
            servicoSlug: servico.slug,
            servicoUrl: `/servicos/${servico.slug}/`
        };
    }
    function portfolioOf(parceiroHandle) {
        return services
            .filter(s => !s.hidden && s.responsavel.includes(parceiroHandle))
            .map(s => portfolioEntry(parceiroHandle, s));
    }
    function portfolioFor(servicoTitulo) {
        const s = services.find(x => x.titulo === servicoTitulo);
        if (!s || s.hidden) return [];
        return s.responsavel
            .filter(h => !isInactive(h))
            .map(h => portfolioEntry(h, s));
    }
    function portfolio() {
        const out = [];
        for (const s of services) {
            if (s.hidden) continue;
            for (const h of s.responsavel) {
                if (isInactive(h)) continue;
                out.push(portfolioEntry(h, s));
            }
        }
        return out;
    }

    // ─── LOCATION HELPERS ────────────────────────────────────────────────────
    // Normaliza a location do parceiro pra { estado, cidade, bairro }.
    // Aceita object structured, string legada ("Bairro · Cidade · UF") ou nada
    // (cai no DEFAULT_LOCATION = SP · São Paulo · Jardim Umarizal).
    function locationOf(handle) {
        const e = get(handle);
        if (!e || !e.location) return DEFAULT_LOCATION;
        const loc = e.location;
        if (typeof loc === "string") {
            const parts = loc.split(/\s*·\s*/);
            return {
                estado: parts[2] || DEFAULT_LOCATION.estado,
                cidade: parts[1] || DEFAULT_LOCATION.cidade,
                bairro: parts[0] || DEFAULT_LOCATION.bairro
            };
        }
        return {
            estado: loc.estado || DEFAULT_LOCATION.estado,
            cidade: loc.cidade || DEFAULT_LOCATION.cidade,
            bairro: loc.bairro || DEFAULT_LOCATION.bairro
        };
    }

    // Hierarquia de locations disponíveis: { estado: { cidade: Set<bairro> } }.
    // Usado pra popular os selects cascateados na home.
    function availableLocations() {
        const tree = new Map();
        const all = [...people, ...communities];
        for (const e of all) {
            if (isInactive(e.handle)) continue;
            // Só aparece em filtro quem tem serviço ativo público.
            const hasPublic = services.some(s =>
                !s.hidden && s.responsavel.includes(e.handle) &&
                !s.responsavel.some(h => isInactive(h))
            );
            if (!hasPublic) continue;
            const loc = locationOf(e.handle);
            if (!tree.has(loc.estado)) tree.set(loc.estado, new Map());
            const cm = tree.get(loc.estado);
            if (!cm.has(loc.cidade)) cm.set(loc.cidade, new Set());
            if (loc.bairro) cm.get(loc.cidade).add(loc.bairro);
        }
        return tree;
    }

    // Match independente em cada nível (estado, cidade, bairro). Substring
    // case-insensitive sem acento. Vazio = nível ignorado.
    function _normLoc(s) {
        return String(s || "").toLowerCase().normalize("NFD")
            .replace(/[̀-ͯ]/g, "").trim();
    }
    function locationMatches(handleOrLoc, filters) {
        const f = filters || {};
        const loc = (typeof handleOrLoc === "string") ? locationOf(handleOrLoc) : handleOrLoc;
        if (f.estado && !_normLoc(loc.estado).includes(_normLoc(f.estado))) return false;
        if (f.cidade && !_normLoc(loc.cidade).includes(_normLoc(f.cidade))) return false;
        if (f.bairro && !_normLoc(loc.bairro).includes(_normLoc(f.bairro))) return false;
        return true;
    }

    // Filtra serviços por { estado, cidade, bairro }. Strings vazias ignoradas.
    // Serviços com `digital: true` ignoram filtro (entrega remota).
    function servicesIn(filters) {
        return publicServices().filter(s => {
            if (s.digital) return true;
            return s.responsavel.some(h => {
                if (isInactive(h)) return false;
                return locationMatches(h, filters);
            });
        });
    }

    // Sugestões por nível pro datalist de cada input.
    // Retorna { estados, cidades, bairros } — cada um array de strings únicas
    // do que existe na DB (excluindo inativos).
    function locationSuggestions() {
        const estados = new Set();
        const cidades = new Set();
        const bairros = new Set();
        const all = [...people, ...communities];
        for (const e of all) {
            if (isInactive(e.handle)) continue;
            const hasPublic = services.some(s =>
                !s.hidden && s.responsavel.includes(e.handle) &&
                !s.responsavel.some(h => isInactive(h))
            );
            if (!hasPublic) continue;
            const loc = locationOf(e.handle);
            if (loc.estado) estados.add(loc.estado);
            if (loc.cidade) cidades.add(loc.cidade);
            if (loc.bairro) bairros.add(loc.bairro);
        }
        return {
            estados: [...estados].sort(),
            cidades: [...cidades].sort(),
            bairros: [...bairros].sort()
        };
    }

    // Pricing — sempre hours × rate. Para produtos (torta, hambúrguer, palavra),
    // hoursLow/hoursHigh expressam horas POR UNIDADE (ex: 8h por batch de 10
    // tortas → 0.8h/torta × R\$ 100/h = R\$ 80/torta).
    // Sem hoursLow/hoursHigh → "Sob consulta" + CTA de contato.
    // Retorna { preco, formula, consult } pra render exibir tudo na cara —
    // cliente vê preço e a conta que o gerou.
    function rateOf(handle) {
        const e = get(handle);
        return (e && typeof e.hourlyRate === "number") ? e.hourlyRate : DEFAULT_HOURLY_RATE;
    }
    function fmtBR(n) {
        const opts = n < 1
            ? { minimumFractionDigits: 2, maximumFractionDigits: 2 }
            : { maximumFractionDigits: 0 };
        return "R$ " + n.toLocaleString("pt-BR", opts);
    }
    function fmtHours(n) {
        return Number.isInteger(n) ? `${n}` : `${n}`.replace(".", ",");
    }
    function computeFaixaPreco(s) {
        const ativos = (s.responsavel || []).filter(h => !isInactive(h));
        const rates = ativos.length ? ativos.map(rateOf) : [DEFAULT_HOURLY_RATE];
        const minRate = Math.min(...rates);
        const maxRate = Math.max(...rates);

        const ratePart = (minRate === maxRate)
            ? `${fmtBR(minRate)}/h`
            : `${fmtBR(minRate)}–${fmtBR(maxRate)}/h`;

        // Modo planos. Padrão da rede:
        //   { hours: N }              → label "Nh", preço hours × rate (flat fee)
        //   { label: "Semanal" }      → "Sob consulta" (volume varia, fala-se direto)
        //   { label: "Mensal"  }      → "Sob consulta"
        //   { label: "Sob demanda" }  → "Sob consulta"
        // Regra geral: plano com `hours` → label horária + preço computado;
        // sem `hours` → label livre + preço "Sob consulta".
        if (s.planos && s.planos.length) {
            const planos = s.planos.map(p => {
                if (typeof p.hours === "number") {
                    const hoursPart = `${fmtHours(p.hours)}h`;
                    const low  = p.hours * minRate;
                    const high = p.hours * maxRate;
                    const unitSuffix = p.unit ? `/${p.unit}` : "";
                    const preco = (low === high)
                        ? `${fmtBR(low)}${unitSuffix}`
                        : `${fmtBR(low)} – ${fmtBR(high)}${unitSuffix}`;
                    const formula = `${hoursPart} × ${ratePart}`;
                    return { label: p.label || hoursPart, preco, formula, consult: false };
                }
                return { label: p.label, preco: "Sob consulta", formula: null, consult: true };
            });
            return { planos, preco: null, formula: null, consult: false };
        }

        // Sem horas → Sob consulta.
        if (!s.hoursLow || !s.hoursHigh) {
            return { planos: null, preco: "Sob consulta", formula: null, consult: true };
        }

        // Per-unit pricing (palavra, torta, sessão, etc.) usa rate da rede e
        // mostra o total computado — não respeita non-sócio rule, porque
        // preço por unidade é padrão da rede, não negociado individualmente.
        const isPerUnit = !!s.unit && !s.recurring && s.unit !== "hora";
        if (isPerUnit) {
            const useRate = DEFAULT_HOURLY_RATE;
            const low  = s.hoursLow  * useRate;
            const high = s.hoursHigh * useRate;
            const unitSuffix = `/${s.unit}`;
            const preco = (low === high)
                ? `${fmtBR(low)}${unitSuffix}`
                : `${fmtBR(low)} – ${fmtBR(high)}${unitSuffix}`;
            // Pra unidades sub-hora (palavra, torta), a fórmula "0,003h por palavra"
            // confunde — esconde, deixa só o preço falar. Pra unidades >= 1h
            // (sessão, aula, consulta, diária, oficina), mostra a base.
            const formula = (s.hoursHigh < 1)
                ? `Tarifa-base R$ ${useRate}/h`
                : (s.hoursLow === s.hoursHigh
                    ? `${fmtHours(s.hoursLow)}h por ${s.unit} × R$ ${useRate}/h`
                    : `${fmtHours(s.hoursLow)}–${fmtHours(s.hoursHigh)}h por ${s.unit} × R$ ${useRate}/h`);
            return { planos: null, preco, formula, consult: false };
        }

        // Não-sócios em serviço por projeto → Sob consulta + canal direto.
        if (ativos.length && ativos.some(h => !isSocio(h))) {
            return { planos: null, preco: "Sob consulta", formula: null, consult: true };
        }

        // Sócios em serviço one-time → mostra a tarifa horária flat (R\$ 100/h).
        // Total fica sob demanda, calculado conforme escopo do trabalho.
        const hoursPart = (s.hoursLow === s.hoursHigh)
            ? `~${fmtHours(s.hoursLow)}h estimadas`
            : `~${fmtHours(s.hoursLow)}–${fmtHours(s.hoursHigh)}h estimadas`;
        return { planos: null, preco: ratePart, formula: hoursPart, consult: false };
    }

    // Roster = what shows on /parceiros/ (top-level people + communities in this order)
    // Order is explicit (the editorial layout).
    const rosterOrder = [
        "yuri", "igo", "joseantonio", "mono",
        "luke", "marina", "karina", "kayra", "aime",
        "syl", "raquel", "alice", "ramona", "denise", "rogerio", "alzira", "miguel", "joao",
        "rodney",
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

    // ─── POEMAS ──────────────────────────────────────────────────────────────
    // Poemas associados a perfis (Kiyoshi etc.). Renderizados em /<autor>/<slug>/.
    const poems = [
        {
            slug: "inocencia",
            titulo: "Inocência",
            autor: "kiyoshi",
            stanzas: [
                [
                    "Há, apesar do adiantado horário, crianças pelas ruas",
                    "De lágrimas ressecadas e corações embrutecidos pela dor",
                    "Se encolhem nalgum canto e dormem nas frias noites nuas",
                    "E do manto dos ressentimentos, fazem indevassável cobertor",
                    "E não sonham mais com inocência..."
                ],
                [
                    "Há, apesar das crianças róseas, crianças pálidas pelas ruas",
                    "De saúdes enfraquecidas, mas de corpos endurecidos como aço",
                    "Que à perspectiva de alguma dor, entorpecidos cheiram luas",
                    "E se diluem entre os detritos, pequeninos, em mil pedaços",
                    "E não mais choram por carência..."
                ],
                [
                    "Há, apesar de tanto fausto, crianças famintas pelas ruas",
                    "Frutos de outra fome, enganada em fugazes prazeres vãos",
                    "Alimentados pela nossa hipocrisia cega à realidade crua",
                    "E que sobrevivem entre delitos, vazios, pequeninos anciãos",
                    "E nós clamamos por um pouco de decência..."
                ],
                [
                    "Há, apesar de tanta brutalidade, crianças puras pelas ruas",
                    "Que se protegem do mal dos homens, com finos e imaginários véus",
                    "Sonham alguma dignidade, choram a insignificância das suas vidas",
                    "E, já quase irremediáveis, ainda suplicam para os céus",
                    "Meu Deus! Um pouquinho de clemência..."
                ],
                [
                    "Que frio na alma!",
                    "Que fome da carinho!",
                    "Que sede de justiça!",
                    "Que prisão a liberdade!",
                    "Mas, de resto, tudo bem..."
                ]
            ]
        }
    ];
    function poemBySlug(slug) { return poems.find(p => p.slug === slug); }
    function poemsByAuthor(handle) { return poems.filter(p => p.autor === handle); }

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
        missao: "Conectar parceiros a seus clientes.",
        visao: "Rede social profissional.",
        valores: [
            {
                titulo: "Semear sonhos, escrever legados.",
                texto: ""
            },
            {
                titulo: "Trabalho digno.",
                texto: "",
                referencia: {
                    obra: "Rerum Novarum: sobre a condição dos operários",
                    data: "15 de maio de 1891",
                    autor: "leaoxiii",
                    url: "https://www.vatican.va/content/leo-xiii/pt/encyclicals/documents/hf_l-xiii_enc_15051891_rerum-novarum.html"
                }
            },
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
        people, communities, services, solutions, missions, poems, rosterOrder, finances, manifesto,
        get, byHandle, isEmMemoria, isInactive, isSocio,
        rateOf, computeFaixaPreco, DEFAULT_HOURLY_RATE,
        DEFAULT_LOCATION, locationOf, availableLocations, servicesIn, locationMatches, locationSuggestions,
        portfolio, portfolioOf, portfolioFor,
        publicServices, roster, membersOf, subMembersOf, bundledServices,
        serviceCatalog, slugify,
        serviceBySlug, serviceByTitle, solutionsUsingService, relatedServices,
        missionBySlug, topLevelMissions, missionsOfCommunity, subMissionsOf, missionsUsingService,
        poemBySlug, poemsByAuthor
    };
})(window);
