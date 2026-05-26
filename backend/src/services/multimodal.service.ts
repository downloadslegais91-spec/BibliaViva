import '../env';

// Cache em memória para evitar consumir cota duplicada
// Em produção, isso iria para um banco de dados
const MUSIC_CACHE: Record<string, string> = {};

export async function generateBackgroundMusic(book: string): Promise<string> {
  // Se já geramos a trilha sonora para este livro antes, retorna do cache!
  if (MUSIC_CACHE[book]) {
    console.log(`[Cache] Retornando música em cache para o livro: ${book}`);
    return MUSIC_CACHE[book];
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY não configurada no ambiente.');
  }

  // Tenta utilizar o modelo Lyria 3 Pro para gerar a música
  // (Nota: a interface da API pode variar dependendo do SDK oficial no futuro)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/lyria-3-pro:generateContent?key=${apiKey}`;
  
  const prompt = `Crie uma trilha sonora instrumental meditativa, relaxante e cinematográfica de 30 segundos adequada para a leitura do livro bíblico de ${book}. A música deve transmitir paz e foco espiritual, sem vocais. Formato mp3.`;

  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }]
      }
    ]
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`Erro na API Lyria: ${response.status} - ${errorText}. Tentando fallback...`);
      throw new Error('API indisponível ou erro 404.');
    }

    const json = await response.json() as any;
    
    // Supondo que a API retorne um base64 na resposta padrão do Gemini para mídias geradas
    const audioBase64 = json.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (audioBase64) {
      const audioUrl = `data:audio/mp3;base64,${audioBase64}`;
      MUSIC_CACHE[book] = audioUrl;
      return audioUrl;
    } else {
      throw new Error('Áudio não retornado pelo modelo Lyria.');
    }
  } catch (error) {
    console.error('Erro ao gerar música, aplicando fallback estático de segurança:', error);
    
    // FALLBACK DE SEGURANÇA:
    // Se a API Lyria ainda não estiver disponível publicamente via generateContent ou a cota esgotar, 
    // nós retornamos trilhas instrumentais estáticas de domínio público hospedadas online
    // de acordo com a "vibe" do livro.
    let fallbackAudio = 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_a1501b8e8f.mp3?filename=ambient-piano-amp-strings-10711.mp3'; // Padrão relaxante

    const bookLower = book.toLowerCase();
    if (bookLower.includes('apocalipse') || bookLower.includes('daniel')) {
      fallbackAudio = 'https://cdn.pixabay.com/download/audio/2021/11/25/audio_91b3cb39e9.mp3?filename=epic-cinematic-trailer-103892.mp3'; // Épico
    } else if (bookLower.includes('salmos') || bookLower.includes('provérbios')) {
      fallbackAudio = 'https://cdn.pixabay.com/download/audio/2022/10/25/audio_277c0879f8.mp3?filename=acoustic-guitar-background-music-124898.mp3'; // Acústico / Calmo
    } else if (bookLower.includes('êxodo') || bookLower.includes('josué')) {
      fallbackAudio = 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=desert-voices-11468.mp3'; // Deserto / Épico
    }
    
    // Salvamos no cache para não processar novamente
    MUSIC_CACHE[book] = fallbackAudio;
    return fallbackAudio;
  }
}
