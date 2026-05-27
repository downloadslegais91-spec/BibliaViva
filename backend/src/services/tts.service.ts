import '../env';

export async function generateAudio(text: string, speakingRate?: number, voiceName?: string, isSsml?: boolean): Promise<string> {
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_TTS_API_KEY não configurada no ambiente.');
  }

  let safeText = text;
  if (safeText.length > 4800) {
    safeText = safeText.substring(0, 4800);
    if (isSsml) {
      // Find the last '<' to see if we cut inside a tag
      const lastOpen = safeText.lastIndexOf('<');
      const lastClose = safeText.lastIndexOf('>');
      if (lastOpen > lastClose) {
        safeText = safeText.substring(0, lastOpen);
      }
      
      const voiceOpens = (safeText.match(/<voice/g) || []).length;
      const voiceCloses = (safeText.match(/<\/voice>/g) || []).length;
      if (voiceOpens > voiceCloses) {
        safeText += '</voice>';
      }

      const prosodyOpens = (safeText.match(/<prosody/g) || []).length;
      const prosodyCloses = (safeText.match(/<\/prosody>/g) || []).length;
      if (prosodyOpens > prosodyCloses) {
        safeText += '</prosody>';
      }

      if (!safeText.endsWith('</speak>')) {
        safeText += '</speak>';
      }
    }
  }

  const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
  const payload = {
    input: isSsml ? { ssml: safeText } : { text: safeText },
    // Permite escolha da voz padrão
    voice: { languageCode: 'pt-BR', name: voiceName || 'pt-BR-Neural2-C' }, // Usando C ou B (masculino/feminino)
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
