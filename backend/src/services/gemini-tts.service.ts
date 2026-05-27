import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import '../env';

// Configura o ffmpeg com o binário instalado
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

import os from 'os';

const PUBLIC_AUDIO_DIR = '/tmp'; // Use tmp dir for Vercel Serverless

// Cria o diretório de áudio se não existir
if (!fs.existsSync(PUBLIC_AUDIO_DIR)) {
  fs.mkdirSync(PUBLIC_AUDIO_DIR, { recursive: true });
}

export type TTSContext = 'devocional' | 'leitura' | 'passagem_at' | 'oracao' | 'meditacao' | 'instrucao' | 'celebracao' | 'narrador';

interface VoiceConfig {
  voiceName: string;
  stylePrompt: string;
}

const VOICE_MAP: Record<TTSContext, VoiceConfig> = {
  devocional: { voiceName: 'Sulafat', stylePrompt: 'Caloroso, pausas nas reflexões' },
  leitura: { voiceName: 'Aoede', stylePrompt: 'Devocional, pausas entre versículos' },
  passagem_at: { voiceName: 'Gacrux', stylePrompt: 'Grave, com peso e autoridade' },
  oracao: { voiceName: 'Vindemiatrix', stylePrompt: '[pause] entre frases, muito suave' },
  meditacao: { voiceName: 'Achernar', stylePrompt: 'Intimista, [slowly] constante' },
  instrucao: { voiceName: 'Kore', stylePrompt: 'Claro, direto, neutro' },
  celebracao: { voiceName: 'Laomedeia', stylePrompt: 'Entusiasta, genuíno, curto' },
  narrador: { voiceName: 'Charon', stylePrompt: 'Multi-speaker, boa diction' }
};

const TTL_MAP: Record<TTSContext, number> = {
  leitura: 7 * 24 * 60 * 60 * 1000, // 7 dias
  devocional: 24 * 60 * 60 * 1000, // 24 horas
  passagem_at: 7 * 24 * 60 * 60 * 1000,
  oracao: 24 * 60 * 60 * 1000,
  meditacao: 24 * 60 * 60 * 1000,
  instrucao: 24 * 60 * 60 * 1000,
  celebracao: 30 * 24 * 60 * 60 * 1000, // 30 dias
  narrador: 7 * 24 * 60 * 60 * 1000
};

export async function generateGeminiTTS(
  text: string,
  context: TTSContext = 'leitura',
  quality: 'flash' | 'pro' = 'flash'
): Promise<{ audioBase64: string; duration_seconds: number }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY não configurada no ambiente.');

  // Verifica cache local
  const hash = crypto.createHash('sha256').update(`${text}_${context}_${quality}`).digest('hex');
  const filename = `${hash}.aac`;
  const filePath = path.join(PUBLIC_AUDIO_DIR, filename);

  if (fs.existsSync(filePath)) {
    // Check TTL
    const stats = fs.statSync(filePath);
    const age = Date.now() - stats.mtimeMs;
    const ttl = TTL_MAP[context];
    if (age < ttl) {
      const b64 = fs.readFileSync(filePath, { encoding: 'base64' });
      return { audioBase64: b64, duration_seconds: 0 };
    } else {
      fs.unlinkSync(filePath); // Expirado
    }
  }

  const voiceConfig = VOICE_MAP[context];
  const modelName = quality === 'pro' ? 'gemini-2.5-pro' : 'gemini-2.5-flash';

  const systemInstruction = `Você é um leitor de voz especializado. Estilo de leitura: ${voiceConfig.stylePrompt}. Respeite tags como [pause], [slowly], [softly], [emphasis]. GERE APENAS ÁUDIO.`;

  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text }]
      }
    ],
    systemInstruction: {
      parts: [{ text: systemInstruction }]
    },
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: voiceConfig.voiceName
          }
        }
      }
    }
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Erro na API Gemini TTS: ${response.status} - ${errText}`);
  }

  const json = await response.json() as any;
  const pcmBase64 = json.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

  if (!pcmBase64) {
    throw new Error('A API não retornou os dados de áudio PCM.');
  }

  // Salva PCM temporário
  const tempPcmPath = path.join(PUBLIC_AUDIO_DIR, `${hash}.pcm`);
  fs.writeFileSync(tempPcmPath, Buffer.from(pcmBase64, 'base64'));

  // Converte para AAC 128kbps via ffmpeg
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(tempPcmPath)
      .inputFormat('s16le')
      .inputOptions(['-ar 24000', '-ac 1']) // Gemini Audio é 24000Hz, 1 canal
      .audioCodec('aac')
      .audioBitrate('128k')
      .save(filePath)
      .on('end', () => {
        fs.unlinkSync(tempPcmPath); // limpa temp
        const b64 = fs.readFileSync(filePath, { encoding: 'base64' });
        resolve({ audioBase64: b64, duration_seconds: 0 }); // Opcional: ffmpeg ffprobe para pegar a duração
      })
      .on('error', (err) => {
        if (fs.existsSync(tempPcmPath)) fs.unlinkSync(tempPcmPath);
        reject(new Error(`Erro ao converter áudio via ffmpeg: ${err.message}`));
      });
  });
}
