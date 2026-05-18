import 'dotenv/config';
import { getSystemInstruction } from './aiPrompt';

// Modelos configurados com fallback automático para evitar problemas de limite de requisições (429)
const PRIMARY_MODEL = 'gemini-2.5-flash';
const FALLBACK_MODEL = 'gemini-1.5-flash';

async function fetchGeminiWithFallback(payload: any, apiKey: string) {
  const tryModel = async (modelName: string) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      const err = new Error(`Erro na API do Gemini (${modelName}): ${response.status} ${response.statusText} - ${errorText}`);
      (err as any).status = response.status;
      throw err;
    }

    return response.json();
  };

  try {
    return await tryModel(PRIMARY_MODEL);
  } catch (error: any) {
    if (error.status === 429 || (error.message && error.message.includes('429'))) {
      console.warn(`[Gemini API] Limite atingido no ${PRIMARY_MODEL} (429). Iniciando fallback para ${FALLBACK_MODEL}...`);
      return await tryModel(FALLBACK_MODEL);
    }
    throw error;
  }
}

export async function generateChatReply(
  userMessage: string,
  history: Array<{ sender: string; message: string }>,
  book: string,
  chapter: number
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY não configurada no ambiente.');
  }

  const systemInstruction = getSystemInstruction(book, chapter);

  const contents = history.map(h => ({
    role: h.sender === 'user' ? 'user' : 'model',
    parts: [{ text: h.message }]
  }));

  // Adiciona a mensagem atual se o histórico for vazio ou não a incluir no final
  if (contents.length === 0 || contents[contents.length - 1].parts[0].text !== userMessage) {
    contents.push({
      role: 'user',
      parts: [{ text: userMessage }]
    });
  }

  try {
    const payload = {
      contents,
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800
      }
    };

    const json = (await fetchGeminiWithFallback(payload, apiKey)) as any;
    const textReply = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textReply) {
      throw new Error('Resposta vazia ou inválida recebida da API do Gemini.');
    }

    return textReply.trim();
  } catch (error) {
    console.error('Erro na chamada ao Gemini:', error);
    throw error;
  }
}

export async function generateChapterSummary(
  book: string,
  chapter: number,
  verses: Array<{ number: number; text: string }>
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return ''; 
  }

  const systemInstruction =
    `Você é um teólogo especialista encarregado de criar resumos inspiradores, dinâmicos e profundos de capítulos da Bíblia. ` +
    `Sua tarefa é escrever um resumo em português com exatamente 2 a 3 frases, destacando o tema central e a aplicação prática para a vida de fé do leitor. ` +
    `Use formatação HTML básica como <strong> para palavras ou expressões chave. Seja espiritualmente edificante, moderno e caloroso.`;

  const versesText = verses.map(v => `${v.number}. ${v.text}`).join('\n');
  const prompt = `Por favor, crie um resumo do livro de ${book}, capítulo ${chapter}.\n\nAqui estão os versículos como referência:\n${versesText}`;

  try {
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 300
      }
    };

    const json = (await fetchGeminiWithFallback(payload, apiKey)) as any;
    const summary = json.candidates?.[0]?.content?.parts?.[0]?.text;
    return summary ? summary.trim() : '';
  } catch (error) {
    console.error('Erro ao gerar resumo da IA:', error);
    return '';
  }
}

export async function generateQuizForBook(book: string): Promise<Array<any>> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY não configurada no ambiente.');
  }

  const systemInstruction =
    `Você é um teólogo e educador bíblico especialista em gamificação. ` +
    `Sua tarefa é gerar um quiz interativo fascinante de múltipla escolha sobre o livro bíblico fornecido. ` +
    `O quiz deve conter exatamente 10 perguntas em português de alta qualidade técnica e espiritual. ` +
    `Você DEVE retornar a resposta EXCLUSIVAMENTE em formato JSON. Não inclua nenhuma explicação antes ou depois do JSON. Não envolva o JSON em crases/markdown. ` +
    `O JSON deve ser um array contendo exatamente 10 objetos com a seguinte estrutura: ` +
    `[` +
    `  {` +
    `    "question": "Pergunta clara em português...",` +
    `    "options": ["Opção A", "Opção B", "Opção C", "Opção D"],` +
    `    "answer": 0, // índice numérico de 0 a 3 referente à alternativa correta` +
    `    "explanation": "Breve justificativa bíblica (com versículo de referência, ex: 'Gênesis 1:1')"` +
    `  }` +
    `]`;

  const prompt = `Gere exatamente 10 perguntas dinâmicas e teologicamente precisas para o quiz do livro bíblico: ${book}.`;

  try {
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2500,
        responseMimeType: "application/json"
      }
    };

    const json = (await fetchGeminiWithFallback(payload, apiKey)) as any;
    let textReply = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textReply) {
      throw new Error('Resposta vazia recebida do Gemini para o quiz.');
    }

    textReply = textReply.trim();
    if (textReply.startsWith('```json')) {
      textReply = textReply.substring(7);
    } else if (textReply.startsWith('```')) {
      textReply = textReply.substring(3);
    }
    if (textReply.endsWith('```')) {
      textReply = textReply.substring(0, textReply.length - 3);
    }
    textReply = textReply.trim();

    const quizData = JSON.parse(textReply);
    if (!Array.isArray(quizData) || quizData.length !== 10) {
      throw new Error(`O quiz gerado não contém exatamente 10 perguntas. Total retornado: ${quizData?.length || 0}`);
    }

    return quizData;
  } catch (error) {
    console.error(`Erro ao gerar quiz com IA para ${book}:`, error);
    throw error;
  }
}

