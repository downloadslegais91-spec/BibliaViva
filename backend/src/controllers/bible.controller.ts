import { Request, Response, NextFunction } from 'express';
import { generateChapterSummary } from '../services/gemini.service';
export const BIBLE_BOOKS = [
  // Antigo Testamento - Pentateuco
  { name: 'Gênesis', key: 'genesis', chapters: 50, category: 'Pentateuco' },
  { name: 'Êxodo', key: 'exodo', chapters: 40, category: 'Pentateuco' },
  { name: 'Levítico', key: 'levitico', chapters: 27, category: 'Pentateuco' },
  { name: 'Números', key: 'numeros', chapters: 36, category: 'Pentateuco' },
  { name: 'Deuteronômio', key: 'deuteronomio', chapters: 34, category: 'Pentateuco' },
  // Antigo Testamento - Livros Históricos
  { name: 'Josué', key: 'josue', chapters: 24, category: 'Históricos (AT)' },
  { name: 'Juízes', key: 'juizes', chapters: 21, category: 'Históricos (AT)' },
  { name: 'Rute', key: 'rute', chapters: 4, category: 'Históricos (AT)' },
  { name: '1 Samuel', key: '1samuel', chapters: 31, category: 'Históricos (AT)' },
  { name: '2 Samuel', key: '2samuel', chapters: 24, category: 'Históricos (AT)' },
  { name: '1 Reis', key: '1reis', chapters: 22, category: 'Históricos (AT)' },
  { name: '2 Reis', key: '2reis', chapters: 25, category: 'Históricos (AT)' },
  { name: '1 Crônicas', key: '1cronicas', chapters: 29, category: 'Históricos (AT)' },
  { name: '2 Crônicas', key: '2cronicas', chapters: 36, category: 'Históricos (AT)' },
  { name: 'Esdras', key: 'esdras', chapters: 10, category: 'Históricos (AT)' },
  { name: 'Neemias', key: 'neemias', chapters: 13, category: 'Históricos (AT)' },
  { name: 'Ester', key: 'ester', chapters: 10, category: 'Históricos (AT)' },
  // Antigo Testamento - Livros Poéticos
  { name: 'Jó', key: 'jo', chapters: 42, category: 'Poéticos' },
  { name: 'Salmos', key: 'salmos', chapters: 150, category: 'Poéticos' },
  { name: 'Provérbios', key: 'proverbios', chapters: 31, category: 'Poéticos' },
  { name: 'Eclesiastes', key: 'eclesiastes', chapters: 12, category: 'Poéticos' },
  { name: 'Cânticos', key: 'canticos', chapters: 8, category: 'Poéticos' },
  // Antigo Testamento - Profetas Maiores
  { name: 'Isaías', key: 'isaias', chapters: 66, category: 'Profetas Maiores' },
  { name: 'Jeremias', key: 'jeremias', chapters: 52, category: 'Profetas Maiores' },
  { name: 'Lamentações', key: 'lamentacoes', chapters: 5, category: 'Profetas Maiores' },
  { name: 'Ezequiel', key: 'ezequiel', chapters: 48, category: 'Profetas Maiores' },
  { name: 'Daniel', key: 'daniel', chapters: 12, category: 'Profetas Maiores' },
  // Antigo Testamento - Profetas Menores
  { name: 'Oseias', key: 'oseias', chapters: 14, category: 'Profetas Menores' },
  { name: 'Joel', key: 'joel', chapters: 3, category: 'Profetas Menores' },
  { name: 'Amós', key: 'amos', chapters: 9, category: 'Profetas Menores' },
  { name: 'Obadias', key: 'obadias', chapters: 1, category: 'Profetas Menores' },
  { name: 'Jonas', key: 'jonas', chapters: 4, category: 'Profetas Menores' },
  { name: 'Miqueias', key: 'miqueias', chapters: 7, category: 'Profetas Menores' },
  { name: 'Naum', key: 'naum', chapters: 3, category: 'Profetas Menores' },
  { name: 'Habacuque', key: 'habacuque', chapters: 3, category: 'Profetas Menores' },
  { name: 'Sofonias', key: 'sofonias', chapters: 3, category: 'Profetas Menores' },
  { name: 'Ageu', key: 'ageu', chapters: 2, category: 'Profetas Menores' },
  { name: 'Zacarias', key: 'zacarias', chapters: 14, category: 'Profetas Menores' },
  { name: 'Malaquias', key: 'malaquias', chapters: 4, category: 'Profetas Menores' },
  // Novo Testamento - Evangelhos
  { name: 'Mateus', key: 'mateus', chapters: 28, category: 'Evangelhos' },
  { name: 'Marcos', key: 'marcos', chapters: 16, category: 'Evangelhos' },
  { name: 'Lucas', key: 'lucas', chapters: 24, category: 'Evangelhos' },
  { name: 'João', key: 'joao', chapters: 21, category: 'Evangelhos' },
  // Novo Testamento - Histórico
  { name: 'Atos', key: 'atos', chapters: 28, category: 'Histórico (NT)' },
  // Novo Testamento - Epístolas Paulinas
  { name: 'Romanos', key: 'romanos', chapters: 16, category: 'Cartas Paulinas' },
  { name: '1 Coríntios', key: '1corintios', chapters: 16, category: 'Cartas Paulinas' },
  { name: '2 Coríntios', key: '2corintios', chapters: 13, category: 'Cartas Paulinas' },
  { name: 'Gálatas', key: 'galatas', chapters: 6, category: 'Cartas Paulinas' },
  { name: 'Efésios', key: 'efesios', chapters: 6, category: 'Cartas Paulinas' },
  { name: 'Filipenses', key: 'filipenses', chapters: 4, category: 'Cartas Paulinas' },
  { name: 'Colossenses', key: 'colossenses', chapters: 4, category: 'Cartas Paulinas' },
  { name: '1 Tessalonicenses', key: '1tessalonicenses', chapters: 5, category: 'Cartas Paulinas' },
  { name: '2 Tessalonicenses', key: '2tessalonicenses', chapters: 3, category: 'Cartas Paulinas' },
  { name: '1 Timóteo', key: '1timoteo', chapters: 6, category: 'Cartas Paulinas' },
  { name: '2 Timóteo', key: '2timoteo', chapters: 4, category: 'Cartas Paulinas' },
  { name: 'Tito', key: 'tito', chapters: 3, category: 'Cartas Paulinas' },
  { name: 'Filemom', key: 'filemom', chapters: 1, category: 'Cartas Paulinas' },
  // Novo Testamento - Epístolas Gerais
  { name: 'Hebreus', key: 'hebreus', chapters: 13, category: 'Cartas Gerais' },
  { name: 'Tiago', key: 'tiago', chapters: 5, category: 'Cartas Gerais' },
  { name: '1 Pedro', key: '1pedro', chapters: 5, category: 'Cartas Gerais' },
  { name: '2 Pedro', key: '2pedro', chapters: 3, category: 'Cartas Gerais' },
  { name: '1 João', key: '1joao', chapters: 5, category: 'Cartas Gerais' },
  { name: '2 João', key: '2joao', chapters: 1, category: 'Cartas Gerais' },
  { name: '3 João', key: '3joao', chapters: 1, category: 'Cartas Gerais' },
  { name: 'Judas', key: 'judas', chapters: 1, category: 'Cartas Gerais' },
  // Novo Testamento - Profético
  { name: 'Apocalipse', key: 'apocalipse', chapters: 22, category: 'Profecia (NT)' },
  // Curiosidades / Apócrifos (Não Canônicos)
  { name: 'Livro de Enoque', key: 'enoque', chapters: 5, category: 'Apócrifos (Não Canônico)', isCanonical: false },
  { name: 'Evangelho de Tomé', key: 'tome', chapters: 1, category: 'Apócrifos (Não Canônico)', isCanonical: false }
];

const APOCRYPHAL_BIBLE: Record<string, Record<number, Array<{ number: number; text: string }>>> = {
  'enoque': {
    1: [
      { number: 1, text: "Palavras de bênção com as quais Enoque abençoou os eleitos e os justos, que viverão no dia da tribulação, quando todos os ímpios e transgressores forem removidos." },
      { number: 2, text: "Enoque, um homem justo, cujos olhos foram abertos por Deus, teve uma visão do Santo nos céus, que os anjos me mostraram. Deles ouvi todas as coisas e entendi o que vi, não para esta geração, mas para uma geração distante que está por vir." },
      { number: 3, text: "A respeito dos eleitos eu falei, e conversei sobre eles com o Santo e Grande, o Deus do mundo, que sairá de sua habitação celestial." },
      { number: 4, text: "Ele descerá sobre o monte Sinai e aparecerá com suas hostes na força e majestade de seu poder." },
      { number: 5, text: "E todos os seres temerão, e os vigilantes tremerão, e um grande medo e angústia se apoderará deles até os confins da terra." }
    ],
    2: [
      { number: 1, text: "Observai todas as coisas que ocorrem no céu: como as luminárias celestes não mudam seus caminhos, como cada uma nasce e se põe em ordem, sem transgredir seus mandamentos." },
      { number: 2, text: "Olhai para a terra e prestai atenção nas coisas que nela acontecem, desde o princípio até o fim, observando como nenhuma das obras de Deus muda ao se manifestar." },
      { number: 3, text: "Vede o verão e o inverno, como toda a terra se enche de água e as nuvens derramam orvalho e chuva sobre ela." }
    ],
    3: [
      { number: 1, text: "Observai e vede como todas as árvores parecem murchas e perdem todas as suas folhas no inverno, exceto quatorze árvores especiais que não perdem suas folhagens, mas permanecem verdes por anos." }
    ],
    4: [
      { number: 1, text: "Observai novamente os dias de verão, como o sol aquece a terra e vós buscais sombra e frescor por causa do calor ardente, e como a terra queima com o calor escaldante sem que possais pisar no solo." }
    ],
    5: [
      { number: 1, text: "Observai como as árvores se cobrem de folhas verdes e dão frutos. Prestai atenção a tudo e compreendei que Aquele que vive para sempre faz todas essas coisas para vós." },
      { number: 2, text: "Como Suas obras permanecem ano após ano, e todas as tarefas que realizam para Ele não mudam, mas assim como Deus decretou, assim acontece." }
    ]
  },
  'tome': {
    1: [
      { number: 1, text: "Estas são as palavras secretas que Jesus, o Vivo, proferiu, e que Judas Tomé, o Gêmeo, anotou." },
      { number: 2, text: "Ele disse: 'Aquele que descobrir a interpretação destas palavras não experimentará a morte.'" },
      { number: 3, text: "Jesus disse: 'Aquele que busca não cesse de buscar até encontrar; e quando encontrar, ficará perturbado; e quando for perturbado, ficará maravilhado e reinará sobre o Todo.'" },
      { number: 4, text: "Jesus disse: 'Se aqueles que vos guiam disserem: Vede, o Reino está no céu, então as aves do céu vos precederão. Se disserem: Está no mar, então os peixes vos precederão. Antes, o Reino está dentro de vós e fora de vós.'" },
      { number: 5, text: "Jesus disse: 'Reconhece o que está diante dos teus olhos, e o que está oculto te será revelado. Pois nada há oculto que não venha a ser manifesto.'" }
    ]
  }
};

const ENGLISH_MAPPING: Record<string, string> = {
  'genesis': 'genesis', 'exodo': 'exodus', 'levitico': 'leviticus', 'numeros': 'numbers', 'deuteronomio': 'deuteronomy',
  'josue': 'joshua', 'juizes': 'judges', 'rute': 'ruth', '1samuel': '1 samuel', '2samuel': '2 samuel',
  '1reis': '1 kings', '2reis': '2 kings', '1cronicas': '1 chronicles', '2cronicas': '2 chronicles',
  'esdras': 'ezra', 'neemias': 'nehemiah', 'ester': 'esther', 'jo': 'job', 'salmos': 'psalms', 'proverbios': 'proverbs',
  'eclesiastes': 'ecclesiastes', 'canticos': 'song of solomon', 'isaias': 'isaiah', 'jeremias': 'jeremiah',
  'lamentacoes': 'lamentations', 'ezequiel': 'ezekiel', 'daniel': 'daniel', 'oseias': 'hosea', 'joel': 'joel',
  'amos': 'amos', 'obadias': 'obadiah', 'jonas': 'jonah', 'miqueias': 'micah', 'naum': 'nahum', 'habacuque': 'habakkuk',
  'sofonias': 'zephaniah', 'ageu': 'haggai', 'zacarias': 'zechariah', 'malaquias': 'malachi',
  'mateus': 'matthew', 'marcos': 'mark', 'lucas': 'luke', 'joao': 'john', 'atos': 'acts',
  'romanos': 'romans', '1corintios': '1 corinthians', '2corintios': '2 corinthians', 'galatas': 'galatians',
  'efesios': 'ephesians', 'filipenses': 'philippians', 'colossenses': 'colossians', '1tessalonicenses': '1 thessalonians',
  '2tessalonicenses': '2 thessalonians', '1timoteo': '1 timothy', '2timoteo': '2 timothy', 'tito': 'titus',
  'filemom': 'philemon', 'hebreus': 'hebrews', 'tiago': 'james', '1pedro': '1 peter', '2pedro': '2 peter',
  '1joao': '1 john', '2joao': '2 john', '3joao': '3 john', 'judas': 'jude', 'apocalipse': 'revelation'
};

const LOCAL_FALLBACK_VERSES = [
  { number: 1, text: "Vendo Jesus as multidões, subiu ao monte e, depois de se sentar, os seus discípulos se aproximaram dele." },
  { number: 2, text: "E ele passou a ensiná-los, dizendo:" },
  { number: 3, text: "\"Bem-aventurados os pobres em espírito, porque deles é o reino dos céus." },
  { number: 4, text: "Bem-aventurados os que choram, porque serão consolados." },
  { number: 5, text: "Bem-aventurados os humildes, porque herdarão a terra." },
  { number: 6, text: "Bem-aventurados os que têm fome e sede de justiça, porque serão saciados." },
  { number: 7, text: "Bem-aventurados os misericordiosos, porque obterão misericórdia." },
  { number: 8, text: "Bem-aventurados os puros de coração, porque verão a Deus." },
  { number: 9, text: "Bem-aventurados os pacificadores, porque serão chamados filhos de Deus." },
  { number: 10, text: "Bem-aventurados os perseguidos por causa da justiça, porque deles é o reino dos céus." }
];

export const getBooks = async (req: Request, res: Response) => {
  res.json({
    status: 'success',
    data: BIBLE_BOOKS
  });
};

export const getChapter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawBook = req.params.book;
    const rawChapter = req.params.chapter;
    if (typeof rawBook !== 'string' || typeof rawChapter !== 'string') {
      res.status(400).json({
        status: 'error',
        message: 'Livro ou capítulo inválido.'
      });
      return;
    }

    const bookParam = rawBook.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const chapter = parseInt(rawChapter, 10);

    const bookConfig = BIBLE_BOOKS.find(b => 
      b.key === bookParam || 
      b.key === bookParam.replace(/\s+/g, '') ||
      b.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === bookParam
    );
    if (!bookConfig || isNaN(chapter) || chapter < 1 || chapter > bookConfig.chapters) {
      res.status(400).json({
        status: 'error',
        message: 'Livro ou capítulo inválido.'
      });
      return;
    }

    const englishBookName = ENGLISH_MAPPING[bookConfig.key];
    let verses: Array<{ number: number; text: string }> = [];

    if (bookConfig.isCanonical === false) {
      const bookData = APOCRYPHAL_BIBLE[bookConfig.key];
      if (bookData && bookData[chapter]) {
        verses = bookData[chapter];
      } else {
        verses = [
          { number: 1, text: `Este capítulo do livro não canônico ${bookConfig.name} não está catalogado localmente.` }
        ];
      }
    } else {
      try {
        const url = `https://bible-api.com/${englishBookName}+${chapter}?translation=almeida`;
        const response = await fetch(url);
        if (response.ok) {
          const json = await response.json();
          verses = json.verses.map((v: any) => ({
            number: v.verse,
            text: v.text.trim()
          }));
        } else {
          throw new Error('Falha ao obter dados de bible-api.com');
        }
      } catch (fetchError) {
        console.warn('Erro ao conectar com API externa da Bíblia. Usando fallback local para Mateus 5 se aplicável.', fetchError);
        if (bookConfig.key === 'mateus' && chapter === 5) {
          verses = LOCAL_FALLBACK_VERSES;
        } else {
          // Generics offline message
          verses = [
            { number: 1, text: `[Modo Offline] Versículo do livro ${bookConfig.name}, capítulo ${chapter}. Por favor, verifique sua conexão de rede para ler a Bíblia inteira dinamicamente!` }
          ];
        }
      }
    }

    let summary = '';
    if (process.env.GEMINI_API_KEY) {
      summary = await generateChapterSummary(bookConfig.name, chapter, verses);
    }
    if (!summary) {
      summary = generateSummary(bookConfig.name, chapter);
    }

    res.json({
      status: 'success',
      data: {
        book: bookConfig.name,
        chapter,
        verses,
        summary,
        isCanonical: bookConfig.isCanonical !== false
      }
    });
  } catch (error) {
    next(error);
  }
};

function generateSummary(book: string, chapter: number): string {
  if (book === 'Mateus' && chapter === 5) {
    return 'Este capítulo contém o famoso <strong>Sermão do Monte</strong>, onde Jesus apresenta as Bem-aventuranças — bênçãos para os humildes, misericordiosos e pacificadores. Jesus também aprofunda a Lei de Moisés, mostrando que a verdadeira obediência vai além do ato externo e alcança o coração.';
  }
  if (book === 'Salmos' && chapter === 23) {
    return 'O Salmo mais conhecido de toda a Bíblia. Um poema de profunda confiança e entrega a Deus como o <strong>Bom Pastor</strong> que guia, protege, supre e acolhe Sua ovelha em todos os momentos da vida, mesmo nas sombras do vale da morte.';
  }
  if (book === 'Provérbios' && chapter === 1) {
    return 'Este capítulo de abertura estabelece o propósito do livro de Provérbios: transmitir sabedoria, instrução e entendimento. O autor enfatiza que <strong>"o temor do Senhor é o princípio do saber"</strong> e alerta vigorosamente contra a sedução e os caminhos dos insensatos.';
  }
  if (book.toLowerCase().includes('enoque')) {
    return 'Este texto apresenta a introdução e as visões iniciais atribuídas a <strong>Enoque</strong>, retratando julgamentos divinos, a ordem natural imutável da criação e exortações morais. <em>Nota: Este livro é considerado pseudoepígrafo / apócrifo na maior parte das tradições judaico-cristãs.</em>';
  }
  if (book.toLowerCase().includes('tomé') || book.toLowerCase().includes('tome')) {
    return 'O Evangelho Gnóstico de <strong>Tomé</strong> contém uma coleção de ditos (logia) atribuídos a Jesus. É caracterizado por sua ênfase na busca espiritual interior e gnosticismo primitivo. <em>Nota: Trata-se de um escrito não-canônico fora da tradição bíblica clássica.</em>';
  }
  return `Resumo do capítulo ${chapter} de ${book}: Uma passagem preciosa de edificação espiritual que nos convida a meditar na soberania divina, nos ensinamentos práticos para a vida diária e na fidelidade do Senhor ao Seu povo.`;
}

import { generateAudio } from '../services/tts.service';

export const getChapterAudio = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawBook = req.params.book;
    const rawChapter = req.params.chapter;
    
    if (typeof rawBook !== 'string' || typeof rawChapter !== 'string') {
      res.status(400).json({ status: 'error', message: 'Livro ou capítulo inválido' });
      return;
    }

    const chapterNum = parseInt(rawChapter, 10);
    const bookParam = rawBook.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    const bookConfig = BIBLE_BOOKS.find(b => 
      b.key === bookParam || 
      b.key === bookParam.replace(/\s+/g, '') ||
      b.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === bookParam
    );
    
    if (!bookConfig || isNaN(chapterNum) || chapterNum < 1 || chapterNum > bookConfig.chapters) {
      res.status(404).json({ status: 'error', message: 'Livro ou capítulo não encontrado' });
      return;
    }
    
    let verses: Array<{ number: number; text: string }> = [];

    if (bookConfig.isCanonical === false) {
      const bookData = APOCRYPHAL_BIBLE[bookConfig.key];
      if (bookData && bookData[chapterNum]) {
        verses = bookData[chapterNum];
      }
    } else {
      try {
        const englishBookName = ENGLISH_MAPPING[bookConfig.key];
        const url = `https://bible-api.com/${englishBookName}+${chapterNum}?translation=almeida`;
        const response = await fetch(url);
        if (response.ok) {
          const json = await response.json();
          verses = json.verses.map((v: any) => ({
            number: v.verse,
            text: v.text.trim()
          }));
        } else {
          throw new Error('Falha ao obter dados de bible-api.com');
        }
      } catch (fetchError) {
        console.warn('Erro ao conectar com API externa da Bíblia para áudio. Usando fallback local para Mateus 5 se aplicável.', fetchError);
        if (bookConfig.key === 'mateus' && chapterNum === 5) {
          verses = LOCAL_FALLBACK_VERSES;
        } else {
          verses = [
            { number: 1, text: `Por favor, verifique sua conexão de rede para ouvir a Bíblia inteira!` }
          ];
        }
      }
    }

    if (verses.length === 0) {
      res.status(404).json({ status: 'error', message: 'Nenhum versículo encontrado para este capítulo.' });
      return;
    }
    
    // Introdução do livro e capítulo
    let textToRead = `Livro de ${bookConfig.name}, capítulo ${chapterNum}. `;
    
    // Concatena todos os textos dos versículos, SEM citar o número do versículo
    textToRead += verses.map(v => v.text).join(' ');

    const speedParam = req.query.speed;
    let speakingRate = 1.0;
    if (typeof speedParam === 'string') {
      const parsedSpeed = parseFloat(speedParam);
      if (!isNaN(parsedSpeed) && parsedSpeed >= 0.25 && parsedSpeed <= 4.0) {
        speakingRate = parsedSpeed;
      }
    }

    const audioBase64 = await generateAudio(textToRead, speakingRate);
    
    res.json({
      status: 'success',
      data: { audioBase64 }
    });
  } catch (error: any) {
    console.error("Audio generation failed:", error.message);
    res.status(500).json({ 
      status: 'error', 
      message: 'Erro na geração de áudio (as credenciais do Google Cloud podem estar ausentes).'
    });
  }
};
