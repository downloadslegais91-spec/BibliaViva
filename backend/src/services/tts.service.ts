import '../env';

const TTS_CACHE: Record<string, string> = {};

export async function generateAudio(text: string, speakingRate?: number, voiceName?: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY não configurada no ambiente.');
  }

  // Cache lookup para o texto exato
  if (TTS_CACHE[text]) {
    return TTS_CACHE[text];
  }

  // Limita o texto para evitar custos exorbitantes (max ~2000 caracteres por req de áudio é seguro)
  const safeText = text.substring(0, 2000);

  // Endpoint do Gemini 2.5 Flash
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: "Leia o seguinte texto da Bíblia de forma clara, natural e reverente:\n\n" + safeText }]
      }
    ],
    // Força a resposta ser em áudio
    generationConfig: {
      responseModalities: ["AUDIO"]
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro na API Gemini TTS: ${response.status} - ${errorText}`);
    }

    const json = await response.json() as any;
    
    // A API Gemini retorna o base64 do áudio dentro de inlineData
    const audioBase64 = json.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!audioBase64) {
      throw new Error('Nenhum conteúdo de áudio recebido da API do Gemini.');
    }
    
    const audioContent = `data:audio/mp3;base64,${audioBase64}`;
    TTS_CACHE[text] = audioContent;
    
    return audioContent;
  } catch (error) {
    console.error('Erro na geração de TTS com Gemini:', error);
    throw error;
  }
}
