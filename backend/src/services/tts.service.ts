import 'dotenv/config';

export async function generateAudio(text: string, speakingRate?: number): Promise<string> {
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_TTS_API_KEY não configurada no ambiente.');
  }

  // Limita o texto para evitar custos ou payload muito alto (max ~4800 caracteres)
  const safeText = text.substring(0, 4800);

  const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
  const payload = {
    input: { text: safeText },
    // A voz Neural2 em pt-BR costuma ser muito natural e premium
    voice: { languageCode: 'pt-BR', name: 'pt-BR-Neural2-B' },
    audioConfig: { 
      audioEncoding: 'MP3' as const,
      speakingRate: speakingRate || 1.0
    },
  };


  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro na API TTS do Google Cloud: ${response.status} - ${errorText}`);
    }

    const json = await response.json() as any;
    
    if (!json.audioContent) {
      throw new Error('Nenhum conteúdo de áudio recebido da API.');
    }
    
    // A API REST já retorna o áudio em formato base64 no campo audioContent
    return json.audioContent;
  } catch (error) {
    console.error('Erro na geração de TTS:', error);
    throw error;
  }
}
