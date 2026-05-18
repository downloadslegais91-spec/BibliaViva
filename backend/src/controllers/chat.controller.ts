import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { generateChatReply } from '../services/gemini.service';
import { resolveUserId } from '../services/auth';

export const saveChat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = await resolveUserId(req);
    const { sender, message, book, chapter } = req.body;

    // 1. Salva a mensagem do usuário ou do IA diretamente
    const chatMessage = await prisma.aiChatHistory.create({
      data: { userId, sender, message }
    });

    if (sender === 'user') {
      // 2. Busca histórico recente (últimas 10 mensagens do usuário)
      const recentHistory = await prisma.aiChatHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10
      });
      recentHistory.reverse(); // Ordem cronológica

      // 3. Gera resposta via Gemini
      let aiResponseText = '';
      try {
        aiResponseText = await generateChatReply(
          message,
          recentHistory.map(h => ({ sender: h.sender, message: h.message })),
          book || 'Mateus',
          chapter || 5
        );
      } catch (geminiError) {
        console.error('Erro na geração da IA:', geminiError);
        aiResponseText = 'Desculpe, estou com dificuldades de me conectar no momento. Mas continue meditando na Palavra! 🙏';
      }

      // 4. Salva a resposta da IA e retorna ela
      const aiMessage = await prisma.aiChatHistory.create({
        data: { userId, sender: 'ai', message: aiResponseText }
      });

      res.json({
        status: 'success',
        data: aiMessage
      });
      return;
    }

    res.json({
      status: 'success',
      data: chatMessage
    });
  } catch (error) {
    next(error);
  }
};

export const getChatHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = await resolveUserId(req);
    const history = await prisma.aiChatHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' }
    });

    res.json({
      status: 'success',
      data: history
    });
  } catch (error) {
    next(error);
  }
};
