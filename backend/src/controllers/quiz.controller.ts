import { Request, Response, NextFunction } from 'express';
import { generateQuizForBook } from '../services/gemini.service';

interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

const FALLBACK_QUIZZES: Record<string, QuizQuestion[]> = {
  'mateus': [
    {
      question: "Segundo o Sermão do Monte em Mateus 5, quem Jesus diz que 'herdarão a terra'?",
      options: ["Os pobres em espírito", "Os misericordiosos", "Os humildes (mansos)", "Os pacificadores"],
      answer: 2,
      explanation: "Mateus 5:5 — 'Bem-aventurados os humildes, porque herdarão a terra.'"
    },
    {
      question: "Onde Jesus nasceu, de acordo com o relato do Evangelho de Mateus?",
      options: ["Nazaré", "Belém da Judeia", "Jerusalém", "Cafarnaum"],
      answer: 1,
      explanation: "Mateus 2:1 — 'E, tendo nascido Jesus em Belém da Judeia, no tempo do rei Herodes...'"
    },
    {
      question: "Qual era a profissão de Mateus antes de seguir a Jesus?",
      options: ["Pescador", "Carpinteiro", "Cobrador de impostos (publicano)", "Tenda de couro"],
      answer: 2,
      explanation: "Mateus 9:9 — 'Jesus viu um homem chamado Mateus, sentado na coletoria de impostos, e disse-lhe: Segue-me.'"
    },
    {
      question: "No Sermão do Monte, Jesus nos ensina a orar. Que nome damos a essa oração em Mateus 6?",
      options: ["Oração do Pai Nosso", "Oração de Jabez", "Oração Sacerdotal", "Oração da Fé"],
      answer: 0,
      explanation: "Mateus 6:9-13 apresenta o modelo de oração do 'Pai Nosso' ensinado por Cristo aos Seus discípulos."
    },
    {
      question: "Qual discípulo tentou andar sobre as águas ao ver Jesus caminhando sobre o mar?",
      options: ["João", "Tiago", "Pedro", "André"],
      answer: 2,
      explanation: "Mateus 14:29 — 'E Pedro, descendo do barco, andou sobre as águas para ir ter com Jesus.'"
    },
    {
      question: "Quantas vezes Jesus disse que devemos perdoar o irmão que pecar contra nós?",
      options: ["Até sete vezes", "Até setenta vezes sete", "Até três vezes no mesmo dia", "Apenas uma vez se houver arrependimento"],
      answer: 1,
      explanation: "Mateus 18:22 — 'Não te digo até sete, mas até setenta vezes sete.'"
    },
    {
      question: "Na parábola das dez virgens (Mateus 25), o que as cinco virgens insensatas esqueceram de levar?",
      options: ["Suas lâmpadas", "Suas vestes de casamento", "Azeite sobressalente para as lâmpadas", "O convite da festa"],
      answer: 2,
      explanation: "Mateus 25:3 — 'As insensatas, tomando as suas lâmpadas, não levaram azeite consigo.'"
    },
    {
      question: "Qual foi o sinal combinado por Judas Iscariotes para identificar Jesus aos guardas no Getsêmani?",
      options: ["Um aperto de mão", "Um beijo", "Apontar com o dedo", "Entregar um manto vermelho"],
      answer: 1,
      explanation: "Mateus 26:48 — 'O que eu beijar, esse é; prendei-o.'"
    },
    {
      question: "O que estava escrito na placa fixada acima da cabeça de Jesus na cruz?",
      options: ["Este é Jesus, o Rei dos Judeus", "Jesus Nazareno, Rei dos Judeus (INRI)", "Este é o Filho de Deus", "Condenado por Blasfêmia"],
      answer: 0,
      explanation: "Mateus 27:37 — 'E puseram por cima da sua cabeça a sua acusação escrita: ESTE É JESUS, O REI DOS JUDEUS.'"
    },
    {
      question: "Que ordem final Jesus deu aos Seus discípulos antes de ascender ao céu (Mateus 28)?",
      options: ["Que ficassem em Jerusalém jejuando", "A Grande Comissão (Ide e fazei discípulos de todas as nações)", "Que construíssem um templo no monte Sinai", "Que escrevessem as Suas memórias"],
      answer: 1,
      explanation: "Mateus 28:19 — 'Portanto ide, fazei discípulos de todas as nações, batizando-os em nome do Pai, e do Filho, e do Espírito Santo.'"
    }
  ],
  'juizes': [
    {
      question: "Qual foi o primeiro juiz levantado por Deus para libertar Israel, sendo ele sobrinho de Calebe?",
      options: ["Otniel", "Eúde", "Gideão", "Jefté"],
      answer: 0,
      explanation: "Juízes 3:9 — 'O Senhor levantou-lhes um libertador, Otniel, filho de Quenaz, o irmão mais novo de Calebe.'"
    },
    {
      question: "Qual juiz canhoto matou o rei Eglom de Moabe?",
      options: ["Sangue", "Eúde", "Sansão", "Baraque"],
      answer: 1,
      explanation: "Juízes 3:15 — 'O Senhor lhes levantou um libertador: Eúde, filho de Gera, benjamita, homem canhoto.'"
    },
    {
      question: "Qual juiz, junto com a profetisa Débora, liderou Israel contra os cananeus sob o comando de Jabim e seu general Sísera?",
      options: ["Gideão", "Jefté", "Baraque", "Otniel"],
      answer: 2,
      explanation: "Juízes 4:6-9 — Débora chamou Baraque para liderar o exército de Israel contra Sísera."
    },
    {
      question: "Que mulher matou o comandante Sísera com uma estaca de tenda?",
      options: ["Jael", "Débora", "Rute", "Ester"],
      answer: 0,
      explanation: "Juízes 4:21 — 'Então Jael, mulher de Héber, tomou uma estaca da tenda, e lançou mão de um martelo, e chegou-se mansamente a ele, e lhe cravou a estaca na fonte...'"
    },
    {
      question: "Como Deus reduziu o exército de Gideão antes da batalha contra os midianitas?",
      options: ["Pelo número de armas que possuíam", "Pela forma como bebiam água", "Pela idade dos soldados", "Por um sorteio divino"],
      answer: 1,
      explanation: "Juízes 7:5-7 — Deus separou os que lamberam a água como cães daqueles que se ajoelharam para beber, reduzindo o exército a 300 homens."
    },
    {
      question: "O que os 300 homens de Gideão seguravam nas mãos durante o ataque noturno?",
      options: ["Espadas e escudos", "Arcos e flechas", "Trombetas, cântaros vazios e tochas", "Lanças e fundas"],
      answer: 2,
      explanation: "Juízes 7:16 — 'Deu a cada um deles trombetas e cântaros vazios, com tochas dentro dos cântaros.'"
    },
    {
      question: "Qual juiz fez um voto imprudente de sacrificar o primeiro que saísse de sua casa ao voltar vitorioso, o que acabou sendo sua própria filha?",
      options: ["Sansão", "Baraque", "Jefté", "Jair"],
      answer: 2,
      explanation: "Juízes 11:30-31, 34 — Jefté fez um voto ao Senhor, e sua filha única saiu ao seu encontro."
    },
    {
      question: "Qual era a principal fonte da força sobre-humana de Sansão, relacionada ao seu voto de nazireu?",
      options: ["O consumo de mel e vinho", "O seu cabelo, que nunca havia sido cortado", "Um manto especial dado por um anjo", "A mandíbula de um jumento"],
      answer: 1,
      explanation: "Juízes 16:17 — 'Nunca subiu navalha à minha cabeça, porque sou nazireu de Deus desde o ventre de minha mãe.'"
    },
    {
      question: "Com o que Sansão matou mil filisteus?",
      options: ["Uma espada de ferro", "Uma funda de pastor", "A queixada de um jumento", "O fogo do céu"],
      answer: 2,
      explanation: "Juízes 15:15 — 'Achou uma queixada fresca de um jumento, estendeu a mão, e tomou-a, e feriu com ela mil homens.'"
    },
    {
      question: "Quem foi a mulher que enganou Sansão para descobrir o segredo de sua força?",
      options: ["Jezabel", "Dalila", "Raabe", "Atalia"],
      answer: 1,
      explanation: "Juízes 16:4-6 — Sansão se apaixonou por uma mulher chamada Dalila, que foi subornada para descobrir o segredo de sua grande força."
    }
  ],
  'genesis': [
    {
      question: "O que Deus criou no primeiro dia, conforme Gênesis 1?",
      options: ["O sol, a lua e as estrelas", "Os animais marinhos e as aves", "A luz, separando-a das trevas", "O homem e a mulher"],
      answer: 2,
      explanation: "Gênesis 1:3-4 — 'E disse Deus: Haja luz; e houve luz... e fez separação entre a luz e as trevas.'"
    },
    {
      question: "De que material Deus formou o primeiro homem, Adão?",
      options: ["Do pó da terra", "De uma rocha esculpida", "De um raio de sol", "Da costela de um anjo"],
      answer: 0,
      explanation: "Gênesis 2:7 — 'E formou o Senhor Deus o homem do pó da terra, e soprou em suas narinas o fôlego da vida.'"
    },
    {
      question: "Quem foi o primeiro filho de Adão e Eva a cometer um homicídio na Bíblia?",
      options: ["Abel", "Sete", "Caim", "Enoque"],
      answer: 2,
      explanation: "Gênesis 4:8 relata que Caim se levantou contra o seu irmão Abel e o matou."
    },
    {
      question: "Quantos casais humanos entraram na arca de Noé durante o Dilúvio?",
      options: ["Apenas Noé e sua esposa (1 casal)", "Noé, seus três filhos e suas respectivas esposas (4 casais)", "Sete casais de pessoas puras", "Nenhum, todos os outros morreram antes de entrar"],
      answer: 1,
      explanation: "Gênesis 7:13 — 'Nesse mesmo dia entraram na arca Noé, seus filhos Sem, Cam e Jafé, sua mulher e as três mulheres de seus filhos.'"
    },
    {
      question: "Qual foi o sinal do pacto de Deus com Noé de que nunca mais destruiria a terra por dilúvio?",
      options: ["Uma pomba com um ramo de oliveira", "Um arco-íris nas nuvens", "Um altar de pedras brilhantes", "Uma coluna de fogo"],
      answer: 1,
      explanation: "Gênesis 9:13 — 'O meu arco tenho posto nas nuvens; este será por sinal da aliança entre mim e a terra.'"
    },
    {
      question: "Qual era o nome da esposa de Abraão, que gerou Isaque na velhice?",
      options: ["Sara", "Hagar", "Rebeca", "Raquel"],
      answer: 0,
      explanation: "Gênesis 21:2 — 'E Sara concebeu, e deu a Abraão um filho na sua velhice, ao tempo determinado...'"
    },
    {
      question: "Por qual preço Jacó comprou o direito de primogenitura de seu irmão Esaú?",
      options: ["Trinta moedas de prata", "Um prato de lentilhas vermelhas", "Dez ovelhas do seu rebanho", "Uma túnica colorida"],
      answer: 1,
      explanation: "Gênesis 25:34 relata que Esaú vendeu sua primogenitura por pão e um guisado de lentilhas."
    },
    {
      question: "Que novo nome Jacó recebeu após lutar com um anjo no vau de Jaboque?",
      options: ["Abraão", "Israel", "Efraim", "Judá"],
      answer: 1,
      explanation: "Gênesis 32:28 — 'Não se chamará mais o teu nome Jacó, mas Israel; pois como príncipe lutaste com Deus e com os homens...'"
    },
    {
      question: "Que presente especial Jacó deu ao seu filho favorito, José?",
      options: ["Um anel de ouro selado", "Uma túnica de várias cores", "Uma espada de bronze", "Um cajado de pastor real"],
      answer: 1,
      explanation: "Gênesis 37:3 — 'E Israel amava a José... e fez-lhe uma túnica de várias cores.'"
    },
    {
      question: "Para qual país José foi vendido como escravo e posteriormente tornou-se governador?",
      options: ["Babilônia", "Assíria", "Egito", "Pérsia"],
      answer: 2,
      explanation: "Gênesis 41 relata a ascensão de José após interpretar os sonhos do Faraó, tornando-se governador do Egito."
    }
  ],
  'salmos': [
    {
      question: "Qual é a frase de abertura do Salmo 23, o mais famoso dos Salmos?",
      options: [
        "O Senhor é a minha luz e a minha salvação",
        "O Senhor é o meu pastor, nada me faltará",
        "Aquele que habita no esconderijo do Altíssimo",
        "Deus é o nosso refúgio e fortaleza"
      ],
      answer: 1,
      explanation: "Salmos 23:1 — 'O Senhor é o meu pastor, nada me faltará.'"
    },
    {
      question: "Quem é tradicionalmente considerado o principal autor da maioria dos Salmos?",
      options: ["Moisés", "Rei Davi", "Rei Salomão", "Profeta Samuel"],
      answer: 1,
      explanation: "Davi escreveu pelo menos 73 dos 150 Salmos, sendo amplamente conhecido como o 'doce salmista de Israel'."
    },
    {
      question: "Qual Salmo contém a famosa promessa de proteção: 'Aquele que habita no esconderijo do Altíssimo, à sombra do Onipotente descansará'?",
      options: ["Salmo 1", "Salmo 23", "Salmo 91", "Salmo 119"],
      answer: 2,
      explanation: "Salmos 91:1 — 'Aquele que habita no esconderijo do Altíssimo, à sombra do Onipotente descansará.'"
    },
    {
      question: "Qual é o menor Salmo de toda a Bíblia, contendo apenas dois versículos?",
      options: ["Salmo 23", "Salmo 100", "Salmo 117", "Salmo 150"],
      answer: 2,
      explanation: "O Salmo 117 possui apenas 2 versículos, convidando todas as nações a louvarem ao Senhor."
    },
    {
      question: "Qual é o maior Salmo de toda a Bíblia, contendo 176 versículos estruturados em acróstico alfabético?",
      options: ["Salmo 19", "Salmo 51", "Salmo 91", "Salmo 119"],
      answer: 3,
      explanation: "O Salmo 119 é o mais longo da Bíblia, focado inteiramente na excelência e amor pela Lei de Deus."
    },
    {
      question: "Como o Salmo 1 descreve a pessoa que medita na lei do Senhor dia e noite?",
      options: [
        "Como uma árvore plantada junto a ribeiros de águas",
        "Como uma fortaleza impenetrável",
        "Como uma ovelha no pasto verdejante",
        "Como uma águia que voa alto nos céus"
      ],
      answer: 0,
      explanation: "Salmos 1:3 — 'Pois será como a árvore plantada junto a ribeiros de águas, a qual dá o seu fruto no seu tempo...'"
    },
    {
      question: "Qual Salmo é conhecido como a grande oração de arrependimento e clamor por misericórdia de Davi após seu pecado com Bate-Seba?",
      options: ["Salmo 3", "Salmo 23", "Salmo 51", "Salmo 139"],
      answer: 2,
      explanation: "O Salmo 51 é o salmo penitencial de Davi, clamando: 'Cria em mim, ó Deus, um coração puro...'"
    },
    {
      question: "Complete o versículo do Salmo 119:105: 'Lâmpada para os meus pés é a tua palavra, e...'",
      options: [
        "escudo contra os meus inimigos",
        "luz para o meu caminho",
        "conforto para a minha alma",
        "alimento para o meu espírito"
      ],
      answer: 1,
      explanation: "Salmos 119:105 — 'Lâmpada para os meus pés é a tua palavra, e luz para o meu caminho.'"
    },
    {
      question: "De acordo com o Salmo 139, onde podemos ir para fugir do Espírito de Deus?",
      options: [
        "Para o deserto mais profundo",
        "Para além do grande mar",
        "Em lugar nenhum, pois Ele está em toda parte",
        "Somente no reino das sombras"
      ],
      answer: 2,
      explanation: "Salmos 139:7-8 — 'Para onde me irei do teu espírito, ou para onde fugirei da tua face? Se subir ao céu, lá tu estás; se fizer no inferno a minha cama, eis que tu ali estás também.'"
    },
    {
      question: "Com que exortação termina o livro dos Salmos no Salmo 150:6?",
      options: [
        "Orem sem cessar",
        "Tudo quanto tem fôlego louve ao Senhor",
        "Guardem os mandamentos de Deus",
        "Temam ao Senhor todos os limites da terra"
      ],
      answer: 1,
      explanation: "Salmos 150:6 — 'Tudo quanto tem fôlego louve ao Senhor. Louvai ao Senhor!'"
    }
  ],
  'proverbios': [
    {
      question: "Qual é o tema principal e ponto de partida do livro de Provérbios, definido no capítulo 1?",
      options: [
        "A riqueza material é a bênção do justo",
        "O temor do Senhor é o princípio do saber/sabedoria",
        "O silêncio absoluto evita todo tipo de pecado",
        "A vingança contra os inimigos de Deus"
      ],
      answer: 1,
      explanation: "Provérbios 1:7 — 'O temor do Senhor é o princípio do saber; os loucos desprezam a sabedoria e a instrução.'"
    },
    {
      question: "Quem é o autor principal da maior parte dos conselhos de Provérbios?",
      options: ["Rei Davi", "Rei Salomão", "Profeta Isaías", "Rei Ezequias"],
      answer: 1,
      explanation: "Provérbios 1:1 atribui a autoria primária a Salomão, filho de Davi, rei de Israel, famoso por sua extrema sabedoria."
    },
    {
      question: "Para qual pequeno animal da natureza o livro de Provérbios (capítulo 6) manda o preguiçoso olhar para aprender sabedoria?",
      options: ["A abelha", "A formiga", "A aranha", "O gafanhoto"],
      answer: 1,
      explanation: "Provérbios 6:6 — 'Vai ter com a formiga, ó preguiçoso; olha para os seus caminhos, e sê sábio.'"
    },
    {
      question: "Qual destas afirmações sobre o orgulho é encontrada em Provérbios 16:18?",
      options: [
        "O orgulho exalta o homem diante da sociedade",
        "A soberba precede a ruína, e a altivez do espírito precede a queda",
        "Deus tolera o orgulho nos que trabalham muito",
        "O orgulho é sinal de inteligência"
      ],
      answer: 1,
      explanation: "Provérbios 16:18 — 'A soberba precede a ruína, e a altivez do espírito precede a queda.'"
    },
    {
      question: "Como Provérbios 15:1 descreve a resposta ideal para acalmar a ira de alguém?",
      options: [
        "A resposta branda desvia o furor",
        "O silêncio absoluto é a melhor arma",
        "A resposta irônica faz o outro recuar",
        "Uma resposta alta e firme impõe respeito"
      ],
      answer: 0,
      explanation: "Provérbios 15:1 — 'A resposta branda desvia o furor, mas a palavra dura suscita a ira.'"
    },
    {
      question: "O que Provérbios 22:1 diz que é melhor do que muitas riquezas?",
      options: ["Ter muito ouro e pedras preciosas", "Mais vale o bom nome do que as muitas riquezas", "Ter muitos amigos poderosos", "Ser temido pelos vizinhos"],
      answer: 1,
      explanation: "Provérbios 22:1 — 'Mais vale o bom nome do que as muitas riquezas; e o ser estimado é melhor do que a prata e o ouro.'"
    },
    {
      question: "Segundo Provérbios 4:23, o que devemos guardar com toda a diligência, porque dele procedem as fontes da vida?",
      options: ["O nosso dinheiro", "A nossa reputação", "O nosso coração", "A nossa saúde física"],
      answer: 2,
      explanation: "Provérbios 4:23 — 'Sobre tudo o que se deve guardar, guarda o teu coração, porque dele procedem as fontes da vida.'"
    },
    {
      question: "Qual capítulo de Provérbios descreve o famoso poema sobre as qualidades da 'Mulher Virtuosa'?",
      options: ["Provérbios 1", "Provérbios 10", "Provérbios 23", "Provérbios 31"],
      answer: 3,
      explanation: "Provérbios 31:10-31 detalha o caráter, diligência e valor inestimável da mulher virtuosa."
    },
    {
      question: "Como Provérbios retrata a atitude do tolo/insensato em relação aos seus próprios caminhos?",
      options: [
        "O tolo sempre duvida de si mesmo",
        "O caminho do insensato parece reto aos seus próprios olhos",
        "O tolo busca conselhos sábios antes de agir",
        "O tolo reconhece seus erros rapidamente"
      ],
      answer: 1,
      explanation: "Provérbios 12:15 — 'O caminho do insensato é reto aos seus próprios olhos, mas o que dá ouvidos ao conselho é sábio.'"
    },
    {
      question: "O que acontece com quem anda com os sábios, segundo Provérbios 13:20?",
      options: [
        "Ficará orgulhoso e distante",
        "Sábio se tornará; mas o companheiro dos tolos será destruído",
        "Não precisará mais trabalhar",
        "Encontrará muitas riquezas ocultas"
      ],
      answer: 1,
      explanation: "Provérbios 13:20 — 'O que anda com os sábios ficará sábio, mas o companheiro dos tolos será destruído.'"
    }
  ],
  'enoque': [
    {
      question: "O Livro de Enoque é tradicionalmente classificado em qual categoria literária bíblica?",
      options: ["Livro Canônico do Antigo Testamento", "Escrito Apócrifo / Pseudoepígrafo", "Evangelho do Novo Testamento", "Livro Histórico da Lei"],
      answer: 1,
      explanation: "O Livro de Enoque é um texto pseudoepígrafo apócrifo, não incluído no cânone da maioria das igrejas cristãs (exceto a Igreja Ortodoxa Etíope)."
    },
    {
      question: "Quem são os seres celestes que descendem à terra para se misturar com os humanos, segundo Enoque 6?",
      options: ["Os Querubins Protetores", "Os Vigilantes (Sentinelas / Anjos Caídos)", "Os Arcanjos da Luz", "Os Serafins de Fogo"],
      answer: 1,
      explanation: "Enoque detalha a queda dos 'Vigilantes' (Grigori), os anjos que desceram à terra e tomaram esposas humanas."
    },
    {
      question: "Qual é o nome do líder dos anjos caídos que conspiraram no monte Hermom?",
      options: ["Semyaza", "Gabriel", "Uriel", "Azazel"],
      answer: 0,
      explanation: "Enoque 6:3 menciona Semyaza (ou Semjaza) como o líder supremo da conspiração dos anjos rebeldes."
    },
    {
      question: "Que gigantes híbridos nasceram da união dos Vigilantes com as filhas dos homens?",
      options: ["Os Filisteus", "Os Nephilim", "Os Titãs de Bronze", "Os Ciclopes"],
      answer: 1,
      explanation: "O livro detalha o nascimento dos gigantes Nephilim (ou Nefilins), que devastaram os recursos da humanidade primitiva."
    },
    {
      question: "Qual anjo caótico ensinou aos homens a metalurgia, a confecção de espadas, escudos e o uso de cosméticos e joias?",
      options: ["Rafael", "Azazel", "Miguel", "Sariel"],
      answer: 1,
      explanation: "Enoque 8:1 ensina que Azazel revelou as artes da guerra (espadas, metal) e da vaidade (maquiagem, pedras preciosas) aos homens."
    },
    {
      question: "Qual é a relação de parentesco de Enoque com Noé, o construtor da Arca?",
      options: ["Enoque era pai de Noé", "Enoque era bisavô de Noé", "Enoque era tio-avô de Noé", "Enoque era filho de Noé"],
      answer: 1,
      explanation: "Enoque gerou Matusalém, que gerou Lameque, que por sua vez gerou Noé. Portanto, Enoque é o bisavô de Noé."
    },
    {
      question: "Para onde Enoque é levado em suas visões para ver os segredos dos relâmpagos, ventos e astros?",
      options: ["Para o centro da terra", "Para os céus e os confins da criação", "Para a Ilha de Patmos", "Para o fundo do Mar Morto"],
      answer: 1,
      explanation: "Enoque descreve suas jornadas cósmicas acompanhado de anjos como Uriel, observando os portais celestes de onde saem as estrelas e os ventos."
    },
    {
      question: "Qual Novo Testamento cita diretamente uma profecia de Enoque sobre a vinda do Senhor com milhares de Seus santos?",
      options: ["Epístola de Tiago", "Epístola de Judas", "Evangelho de João", "Apocalipse"],
      answer: 1,
      explanation: "Judas 1:14-15 cita explicitamente: 'E destes profetizou também Enoque, o sétimo depois de Adão, dizendo: Eis que veio o Senhor com milhares de seus santos...'"
    },
    {
      question: "Como o Livro de Enoque descreve o destino final dos anjos caídos que pecaram contra Deus?",
      options: [
        "Eles serão perdoados e reabilitados no céu",
        "Eles serão aprisionados em vales escuros da terra até o dia do grande julgamento",
        "Eles reinarão sobre a terra para sempre",
        "Eles serão transformados em seres humanos comuns"
      ],
      answer: 1,
      explanation: "Enoque relata que Deus ordenou que os Vigilantes rebeldes fossem amarrados debaixo das colinas da terra nas trevas até o Dia do Juízo Final."
    },
    {
      question: "Qual é a mensagem principal dos capítulos iniciais do Livro de Enoque?",
      options: [
        "O louvor à inteligência e filosofia grega",
        "O julgamento iminente sobre os ímpios e a bênção e paz reservadas aos eleitos",
        "Regras estritas de sacrifícios no templo de Jerusalém",
        "A celebração das colheitas de trigo da Judeia"
      ],
      answer: 1,
      explanation: "O livro abre proclamando bênçãos para os justos que viverão no dia da tribulação e o julgamento cósmico contra os pecadores."
    }
  ],
  'tome': [
    {
      question: "O Evangelho de Tomé é mais conhecido por qual característica textual principal?",
      options: [
        "É uma narrativa detalhada da paixão e ressurreição de Cristo",
        "É uma coleção de 114 ditos (logia) atribuídos a Jesus",
        "É um livro de poesias litúrgicas judaicas",
        "É uma carta doutrinária dirigida à igreja de Roma"
      ],
      answer: 1,
      explanation: "O Evangelho de Tomé não possui narrativa geográfica ou biográfica; é puramente uma compilação de 114 ensinamentos (ditos secretizados) atribuídos a Jesus."
    },
    {
      question: "Qual manuscrito histórico, descoberto em 1945 no Egito, revelou a versão completa do Evangelho de Tomé em Copta?",
      options: ["Manuscritos do Mar Morto (Qumran)", "Biblioteca de Nag Hammadi", "Codex Sinaiticus", "Papiros de Oxirrinco"],
      answer: 1,
      explanation: "Nag Hammadi (Egito, 1945) continha 13 códices de papiro com dezenas de textos gnósticos, incluindo a única cópia completa de Tomé."
    },
    {
      question: "De acordo com o dito número 3 de Tomé, onde está o Reino de Deus?",
      options: [
        "Somente no céu visível",
        "Dentro de vós e fora de vós",
        "Exclusivamente no Templo Sagrado",
        "Na cidade mística de Jerusalém Celestial"
      ],
      answer: 1,
      explanation: "Tomé 3 diz: 'Antes, o Reino está dentro de vós e está fora de vós. Quando vos conhecerdes, sereis conhecidos...'"
    },
    {
      question: "Quem é o escritor/copista indicado nas palavras de introdução deste evangelho apócrifo?",
      options: ["Simão Pedro", "Judas Tomé (o Gêmeo)", "Maria Madalena", "Mateus, o Publicano"],
      answer: 1,
      explanation: "O prólogo declara: 'Estas são as palavras secretas que Jesus, o Vivo, proferiu, e que Judas Tomé anotou.'"
    },
    {
      question: "Qual é a promessa feita no dito número 2 para aquele que 'descobrir a interpretação destas palavras'?",
      options: [
        "Ficará rico e próspero",
        "Não experimentará a morte",
        "Se tornará o maior dos reis da terra",
        "Aprenderá a voar nos céus"
      ],
      answer: 1,
      explanation: "Tomé 1 (às vezes listado como dito 2) — 'Ele disse: Aquele que descobrir a interpretação destas palavras não experimentará a morte.'"
    },
    {
      question: "No dito 2 (ou 3), qual é a sequência de sentimentos de quem busca: 'Aquele que busca não cesse de buscar até encontrar; e quando encontrar...'",
      options: [
        "ficará em paz e descansará",
        "ficará perturbado; e quando for perturbado, ficará maravilhado e reinará sobre o Todo",
        "ficará triste pelas dores do mundo",
        "esquecerá tudo o que sabia"
      ],
      answer: 1,
      explanation: "Dito 2 — 'Jesus disse: Aquele que busca não cesse de buscar até encontrar; e quando encontrar, ficará perturbado; e quando for perturbado, ficará maravilhado e reinará sobre o Todo.'"
    },
    {
      question: "Como o Evangelho de Tomé é geralmente encarado do ponto de vista teológico cristão ortodoxo?",
      options: [
        "Como parte oficial e sagrada do Novo Testamento",
        "Como um escrito gnóstico apócrifo fora do cânone bíblico",
        "Como uma heresia criada na Idade Média",
        "Como a tradução literal e perfeita de Mateus"
      ],
      answer: 1,
      explanation: "A igreja primitiva e a teologia ortodoxa consideram Tomé um texto gnóstico apócrifo escrito por volta do século II, fora do cânone."
    },
    {
      question: "Complete o famoso dito místico de Jesus em Tomé 77: 'Rachai a madeira, eu estou ali. Levantai a pedra, e...'",
      options: [
        "encontrareis tesouros",
        "ali me encontrareis",
        "vereis a luz do mundo",
        "o templo desmoronará"
      ],
      answer: 1,
      explanation: "Dito 77 — 'Jesus disse: Eu sou o Todo... Rachai a madeira, eu estou ali. Levantai a pedra, e ali me encontrareis.'"
    },
    {
      question: "O que Jesus diz em Tomé sobre o jejum, a oração e a esmola ritualistas de forma externa?",
      options: [
        "Que devem ser praticados de hora em hora",
        "Que trazem mentira ao vosso espírito se praticados sem sinceridade interior",
        "Que são as únicas formas de obter salvação",
        "Que devem ser ensinados às crianças sob punição"
      ],
      answer: 1,
      explanation: "Em vários trechos (como o dito 14), Tomé traz críticas gnósticas aos rituais puramente externos, defendendo o auto-conhecimento sincero."
    },
    {
      question: "Qual discípulo é elogiado no dito 13 como alguém que compreendeu Jesus, descrevendo-o como um filósofo sábio?",
      options: ["Simão Pedro", "Mateus", "Tomé", "João"],
      answer: 2,
      explanation: "No dito 13, Tomé se destaca ao dizer a Jesus: 'Minha boca é totalmente incapaz de expressar com quem tu te pareces', mostrando sua percepção interior superior no texto."
    }
  ],
  'intensiva-odisseia': [
    {
      question: "Qual é o foco principal da Trilha Intensiva 'Odisseia pela Bíblia'?",
      options: ["A história cronológica dos reis de Israel", "Ver Jesus, o Cordeiro de Deus, desde o Velho até o Novo Testamento", "As viagens missionárias do Apóstolo Paulo", "Os detalhes da reconstrução do templo de Jerusalém"],
      answer: 1,
      explanation: "A trilha Odisseia pela Bíblia foca em mostrar como a vinda, o ministério e o sacrifício de Jesus foram anunciados desde o princípio."
    },
    {
      question: "No início da Odisseia, vemos a queda do homem em Gênesis. O que Deus promete logo em Gênesis 3:15, conhecido como Protoevangelho?",
      options: ["Que o dilúvio destruiria a terra", "Que o descendente da mulher esmagaria a cabeça da serpente", "Que o homem não comeria mais do fruto", "Que a humanidade construiria uma torre até o céu"],
      answer: 1,
      explanation: "Gênesis 3:15 é a primeira promessa de um Redentor, anunciando que Jesus (descendente da mulher) esmagaria o mal."
    },
    {
      question: "Como o evento da Páscoa judaica no Êxodo se conecta profeticamente a Jesus na Odisseia?",
      options: ["Mostrando como Moisés dividiu o mar", "Pelo sangue do cordeiro sem defeito nos umbrais que salvou da morte, prefigurando o sangue de Cristo", "Apenas por ser uma festa anual de colheita", "Através da construção do bezerro de ouro"],
      answer: 1,
      explanation: "Em 1 Coríntios 5:7, a Bíblia afirma: 'Pois também Cristo, nosso Cordeiro pascal, foi imolado', mostrando o cumprimento do sacrifício no Egito."
    },
    {
      question: "O profeta Isaías (capítulo 53) narra vividamente o sacrifício de um servo sofredor. A quem esta profecia se aplica de acordo com a Odisseia?",
      options: ["Ao Rei Davi", "Ao próprio Isaías", "A Jesus Cristo", "Ao Rei Ciro da Pérsia"],
      answer: 2,
      explanation: "Isaías 53 profetiza o sacrifício substitutivo de Jesus: 'Ele foi ferido por causa das nossas transgressões'."
    },
    {
      question: "Qual frase, comum no Evangelho de João, Jesus usa para revelar Sua divindade ecoando o 'EU SOU' de Êxodo 3:14?",
      options: ["Eu fui enviado", "Eu sou a videira verdadeira, o caminho, a luz do mundo", "Eu quero ser", "Eu posso tentar"],
      answer: 1,
      explanation: "Jesus usou o título 'EU SOU' (Ego Eimi) múltiplas vezes para revelar Sua natureza divina e Suas promessas de salvação."
    },
    {
      question: "Como os Salmos (como o Salmo 22) e o profeta Zacarias figuram na etapa 'A Precisão da Cruz'?",
      options: ["Como canções de alegria sem relação futura", "Eles descrevem com exatidão matemática a ressurreição no terceiro dia", "Eles descrevem vividamente a crucificação, as vestes divididas e o corpo transpassado muito antes do evento", "Eles apenas ordenam sacrifícios de animais no templo"],
      answer: 2,
      explanation: "Salmo 22 narra detalhes como 'repartiram entre si as minhas vestes' e Zacarias fala de 'olharão para aquele a quem transpassaram'."
    },
    {
      question: "Jesus frequentemente referia-se a Si mesmo como 'O Filho do Homem'. Em qual profeta do Antigo Testamento essa figura celestial recebe domínio eterno?",
      options: ["Daniel", "Malaquias", "Ezequiel", "Jonas"],
      answer: 0,
      explanation: "Em Daniel 7:13-14, o profeta vê 'um como Filho do Homem' recebendo do Ancião de Dias um domínio eterno que nunca passará."
    },
    {
      question: "No livro de Apocalipse, como Jesus é descrito quando João O vê no céu abrindo os selos?",
      options: ["Como uma pomba branca", "Como um Leão que também é um Cordeiro que parece ter sido morto", "Apenas como um rei terreno com espada de ferro", "Como um pilar de nuvem"],
      answer: 1,
      explanation: "Apocalipse 5:6 descreve Jesus como um Cordeiro de pé, como se tivesse sido morto, e no versículo 5 como o Leão da Tribo de Judá."
    },
    {
      question: "Por que a Odisseia foca nas 'falas de Jesus referenciadas nos livros'?",
      options: ["Para mostrar que Ele lia muito", "Para demonstrar que Ele é a Palavra encarnada e o cumprimento de toda a Lei e os Profetas", "Porque não havia mais nada para citar", "Para invalidar o Antigo Testamento"],
      answer: 1,
      explanation: "Jesus disse: 'Tudo o que está escrito a meu respeito na Lei de Moisés, nos Profetas e nos Salmos devia se cumprir' (Lucas 24:44)."
    },
    {
      question: "O que significa dizer que Jesus é o 'Cordeiro anunciado desde o Velho até o Novo Testamento'?",
      options: ["Que Ele era um profeta que pastoreava ovelhas na Galileia", "Que Ele era pacífico, mas não divino", "Que todo o plano de salvação de Deus através do sacrifício perfeito convergia n'Ele desde o início", "Que a Bíblia é um livro exclusivo sobre pecuária antiga"],
      answer: 2,
      explanation: "Desde o sacrifício em Gênesis para cobrir Adão, até João Batista dizendo 'Eis o Cordeiro de Deus', a Bíblia aponta para o sacrifício redentor de Cristo."
    }
  ]
};

// Generates a dynamic and clean quiz fallback for any Bible book requested that is not hardcoded.
function generateGenericQuiz(bookName: string): QuizQuestion[] {
  const genericQuestions: QuizQuestion[] = [
    {
      question: `Qual é o propósito geral de estudarmos o livro de ${bookName}?`,
      options: [
        "Aprofundar a compreensão espiritual e histórica da palavra de Deus",
        "Apenas decorar versículos para competições religiosas",
        "Conhecer genealogias sem aplicação prática",
        "Substituir a oração diária"
      ],
      answer: 0,
      explanation: `O estudo sistemático de ${bookName} enriquece a nossa fé, conectando lições do passado com sabedoria prática.`
    },
    {
      question: `O que nos ensina a meditação atenta nos capítulos do livro de ${bookName}?`,
      options: [
        "Que a fé deve ser vivida e meditada no coração com humildade",
        "Que o conhecimento puramente intelectual é superior ao amor",
        "Que a leitura bíblica pode ser feita de forma mecânica e sem reflexão",
        "Que as Escrituras Sagradas não têm utilidade nos dias modernos"
      ],
      answer: 0,
      explanation: `A leitura de ${bookName} convida o fiel à meditação, que transforma o caráter de dentro para fora.`
    },
    {
      question: `Como as Escrituras Sagradas costumam retratar a relação entre Deus e o leitor humilde em ${bookName}?`,
      options: [
        "Deus se afasta dos que erram e nunca mais ouve suas preces",
        "Deus resiste aos soberbos, mas concede graça aos humildes",
        "A humilhação material é exigida para obter qualquer favor divino",
        "Deus prefere as grandes fortunas externas em detrimento da retidão"
      ],
      answer: 1,
      explanation: `Em toda a Bíblia, e ilustrado no livro de ${bookName}, vemos que Deus acolhe com amor e graça os de coração quebrantado.`
    },
    {
      question: `Ao lermos e ouvirmos as narrações de ${bookName}, qual deve ser nossa postura de coração?`,
      options: [
        "De abertura espiritual, buscando escutar o que o Senhor quer falar à nossa alma",
        "De crítica apática, buscando apenas falhas gramaticais no texto",
        "De pressa e ansiedade, querendo terminar a leitura o mais rápido possível",
        "De orgulho espiritual, nos julgando superiores aos outros fiéis"
      ],
      answer: 0,
      explanation: `O livro de ${bookName} fala de maneira singular a quem se aproxima do texto sagrado com ouvidos atentos e coração pronto para obedecer.`
    },
    {
      question: `Que virtude é amplamente elogiada e promovida nas páginas do livro de ${bookName}?`,
      options: [
        "A autossuficiência e o orgulho pessoal",
        "O amor fraternal, a justiça, a fidelidade e a retidão de caráter",
        "A busca desenfreada por bens e glórias terrenas",
        "A fofoca e as contendas entre irmãos de fé"
      ],
      answer: 1,
      explanation: `A fidelidade ao Senhor e o amor prático são marcas inquestionáveis da conduta ensinada nas Escrituras, incluindo ${bookName}.`
    },
    {
      question: `Quem é o verdadeiro autor de toda transformação que a leitura de ${bookName} gera na vida do cristão?`,
      options: [
        "O próprio esforço solitário da mente humana",
        "O Espírito Santo de Deus, que ilumina o entendimento e aplica a palavra ao coração",
        "O líder religioso local que lê a Bíblia pelo fiel",
        "As moedas e ofertas depositadas nos templos"
      ],
      answer: 1,
      explanation: `A palavra de Deus em ${bookName} é viva e eficaz, impulsionada pelo Espírito Santo na vida de quem crê.`
    },
    {
      question: `Onde reside a fonte de sabedoria destacada implícita ou explicitamente no livro de ${bookName}?`,
      options: [
        "Em filosofias vazias de vaidade terrena",
        "No temor reverente ao Senhor e no cumprimento de Seus mandamentos de amor",
        "Na acumulação de títulos e certificados acadêmicos",
        "Em teorias conspiratórias sobre o fim do mundo"
      ],
      answer: 1,
      explanation: `A verdadeira sabedoria bíblica demonstrada em ${bookName} tem raiz no relacionamento profundo e reverente com o Criador.`
    },
    {
      question: `Qual destas atitudes nos afasta dos ensinamentos inspiradores revelados em ${bookName}?`,
      options: [
        "O orgulho, a insensatez, a impaciência e a mentira",
        "A oração sincera nos momentos de dor",
        "O estudo sistemático e com amor ao próximo",
        "A caridade realizada no silêncio do lar"
      ],
      answer: 0,
      explanation: `O livro de ${bookName} nos alerta contra a mentira, a soberba e as práticas que machucam os nossos semelhantes e nos afastam de Deus.`
    },
    {
      question: `Quando nos deparamos com passagens complexas em ${bookName}, o que devemos buscar?`,
      options: [
        "Orar pedindo discernimento e buscar referências confiáveis e teologicamente sólidas",
        "Ignorar completamente o livro e nunca mais lê-lo",
        "Criar interpretações fantasiosas sem base contextual",
        "Discutir com agressividade nas redes sociais"
      ],
      answer: 0,
      explanation: `O entendimento dos ensinos profundos de ${bookName} requer humildade, oração e instrução de homens e mulheres de fé.`
    },
    {
      question: `Qual é o resultado de colocarmos em prática os conselhos e ensinamentos eternos contidos em ${bookName}?`,
      options: [
        "Uma vida de paz interior, fortalecida na esperança e frutífera em boas obras",
        "O fim instantâneo de todas as dificuldades físicas do dia a dia",
        "A garantia de sucesso financeiro infalível e imediato",
        "O isolamento absoluto de todas as pessoas da sociedade"
      ],
      answer: 0,
      explanation: `Seguir as verdades eternas expressas em ${bookName} nos constrói sobre uma rocha firme, nos preparando para tempestades com paz e firmeza espiritual.`
    }
  ];

  return genericQuestions;
}

function generateIntensivaGenericQuiz(intensivaName: string): QuizQuestion[] {
  const nomeGeral = intensivaName.replace('intensiva-', '').toUpperCase();
  return [
    {
      question: `Qual é o principal objetivo da Trilha Intensiva focada no tema '${nomeGeral}'?`,
      options: [
        "Decorar versículos aleatórios sem contexto",
        "Aprofundar a compreensão espiritual e conectar os textos bíblicos de forma estruturada e temática",
        "Substituir completamente a leitura diária da Bíblia",
        "Apenas acumular pontos no aplicativo"
      ],
      answer: 1,
      explanation: `As Trilhas Intensivas, como a de ${nomeGeral}, existem para criar conexões profundas entre diversos livros e temas da Bíblia.`
    },
    {
      question: `Ao completar as fases desta Trilha Intensiva, o que se espera do estudante da Bíblia?`,
      options: [
        "Que ele tenha uma visão mais madura, conectada e aplicável da Palavra de Deus em sua vida",
        "Que ele sinta que não precisa mais ir à igreja",
        "Que ele memorize a Bíblia inteira de trás para frente",
        "Que ele possa julgar os outros irmãos que não estudam"
      ],
      answer: 0,
      explanation: "O estudo temático intensivo serve para o crescimento espiritual maduro e aplicação prática, não para orgulho intelectual."
    },
    {
      question: `Durante a Trilha '${nomeGeral}', lemos passagens de vários livros diferentes. O que isso demonstra sobre as Escrituras?`,
      options: [
        "Que os livros não têm relação entre si",
        "Que a Bíblia tem uma unidade e um fio condutor divino, onde o Antigo e o Novo Testamento se complementam perfeitamente",
        "Que os autores bíblicos apenas copiaram uns aos outros",
        "Que a leitura temática é a única forma permitida de ler a Bíblia"
      ],
      answer: 1,
      explanation: "A harmonia temática e teológica entre diferentes livros, escritos em épocas distintas, demonstra a inspiração singular do Espírito Santo."
    },
    {
      question: `Como devemos aplicar o conhecimento adquirido nas diversas etapas desta Trilha Intensiva?`,
      options: [
        "Apenas debatendo teologia nas redes sociais",
        "Sendo ouvintes esquecidos da Palavra",
        "Sendo praticantes da Palavra, permitindo que o ensinamento transforme nosso caráter e atitudes diárias",
        "Guardando o conhecimento apenas para nós mesmos"
      ],
      answer: 2,
      explanation: "Tiago 1:22 exorta: 'Sede praticantes da palavra e não somente ouvintes'."
    },
    {
      question: `Ao meditar nos textos desta Trilha, quem é o guia essencial para revelação verdadeira do texto sagrado?`,
      options: [
        "A inteligência humana por si só",
        "O Espírito Santo, que ilumina o nosso entendimento",
        "O líder religioso que obriga a leitura",
        "O algoritmo do aplicativo"
      ],
      answer: 1,
      explanation: "Jesus prometeu que o Espírito da Verdade nos guiaria a toda a verdade (João 16:13)."
    },
    {
      question: `Muitas passagens nesta Trilha apontam direta ou indiretamente para a redenção. Qual é o foco central de todas as Escrituras?`,
      options: [
        "A construção de templos físicos suntuosos",
        "Regras alimentares do Oriente Médio",
        "A revelação de Jesus Cristo, o Messias, e Seu plano de salvação para a humanidade",
        "Histórias de guerras antigas isoladas"
      ],
      answer: 2,
      explanation: "Em Lucas 24 e João 5, Jesus afirma que as Escrituras testificam a Seu respeito."
    },
    {
      question: `O que significa dedicar-se de forma 'Intensiva' ao estudo de um tema bíblico como '${nomeGeral}'?`,
      options: [
        "Ler o mais rápido possível para terminar logo",
        "Mergulhar de forma focada, refletindo sobre o contexto, a doutrina e a aplicação daquele assunto específico",
        "Fazer jejum total de água durante todo o estudo",
        "Ler apenas os versículos que falam de prosperidade"
      ],
      answer: 1,
      explanation: "O estudo intensivo requer meditação atenta e aprofundamento sincero nas verdades de Deus."
    },
    {
      question: `Ao encontrar textos difíceis durante as fases desta Trilha, qual a postura correta?`,
      options: [
        "Ignorá-los e pular a fase",
        "Orar pedindo sabedoria a Deus, pesquisar o contexto e manter um coração humilde para aprender",
        "Criar uma interpretação própria que justifique nossos erros",
        "Desanimar e parar a Trilha"
      ],
      answer: 1,
      explanation: "A oração e o estudo diligente são essenciais, sabendo que Deus dá sabedoria a quem pede com fé (Tiago 1:5)."
    },
    {
      question: `Qual é o maior proveito que um cristão pode tirar ao completar essa jornada intensiva?`,
      options: [
        "Ganhar mais experiência (XP) no perfil",
        "Ter um relacionamento mais íntimo com Deus e estar mais equipado para viver e compartilhar a Sua Palavra",
        "Poder se gabar para os amigos na igreja",
        "Não precisar ler mais a Bíblia neste ano"
      ],
      answer: 1,
      explanation: "O objetivo final do conhecimento bíblico é amar mais a Deus e refletir isso no amor e no serviço ao próximo."
    },
    {
      question: `Por fim, a constância em ler as Escrituras, praticada nesta Trilha, se assemelha a que elemento da vida física?`,
      options: [
        "A um remédio amargo",
        "Ao alimento diário (pão) que sustenta a vida, fortalecendo a saúde espiritual da alma",
        "Ao sono que nos faz esquecer os problemas",
        "A um exercício exaustivo que enfraquece o corpo"
      ],
      answer: 1,
      explanation: "Jesus disse: 'Nem só de pão viverá o homem, mas de toda a palavra que sai da boca de Deus' (Mateus 4:4)."
    }
  ];
}

const QUIZ_CACHE = new Map<string, QuizQuestion[]>();

export const getQuizForBook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawBook = req.params.book;
    if (typeof rawBook !== 'string') {
      res.status(400).json({ status: 'error', message: 'Livro inválido.' });
      return;
    }

    const bookKey = rawBook.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // 1. Level 1 Cache: Check if we have a static preloaded high-fidelity quiz
    if (FALLBACK_QUIZZES[bookKey]) {
      console.log(`[Quiz Cache] Retornando quiz estático pré-moldado para o livro: ${rawBook} (0ms)`);
      res.json({
        status: 'success',
        data: FALLBACK_QUIZZES[bookKey]
      });
      return;
    }

    // 2. Level 2 Cache: Check if we have a dynamically cached quiz in memory
    if (QUIZ_CACHE.has(bookKey)) {
      console.log(`[Quiz Cache] Retornando quiz em cache para o livro: ${rawBook} (0ms)`);
      res.json({
        status: 'success',
        data: QUIZ_CACHE.get(bookKey)
      });
      return;
    }

    // If Gemini key is set, attempt to generate dynamically!
    if (process.env.GEMINI_API_KEY) {
      try {
        console.log(`Gerando quiz via Gemini para o livro: ${rawBook}...`);
        const quizData = await generateQuizForBook(rawBook);
        
        // Cache the newly generated quiz in memory
        if (quizData && quizData.length === 10) {
          QUIZ_CACHE.set(bookKey, quizData);
          console.log(`[Quiz Cache] Quiz gerado via Gemini com sucesso e salvo em cache para: ${rawBook}`);
        }

        res.json({
          status: 'success',
          data: quizData
        });
        return;
      } catch (geminiError) {
        console.warn(`Falha na geração do Gemini para o quiz de ${rawBook}. Acionando fallback local...`, geminiError);
      }
    }

    // Fallback block if Gemini failed or is not configured
    let fallbackQuestions: QuizQuestion[] | undefined = FALLBACK_QUIZZES[bookKey];
    if (!fallbackQuestions) {
      if (bookKey.startsWith('intensiva-')) {
        fallbackQuestions = generateIntensivaGenericQuiz(rawBook);
      } else {
        fallbackQuestions = generateGenericQuiz(rawBook);
      }
      // Cache the generic questions to avoid regenerating them
      QUIZ_CACHE.set(bookKey, fallbackQuestions);
    }

    res.json({
      status: 'success',
      data: fallbackQuestions
    });
  } catch (error) {
    next(error);
  }
};
