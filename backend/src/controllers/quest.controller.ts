import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { BIBLE_BOOKS } from './bible.controller';

export const CHRONOLOGICAL_ORDER = [
  'jo', 'genesis', 'exodo', 'levitico', 'numeros', 'deuteronomio', 'josue', 'juizes', 'rute',
  '1samuel', '2samuel', 'canticos', 'proverbios', 'eclesiastes', '1reis', '2reis', 'obadias',
  'joel', 'jonas', 'amos', 'oseias', 'isaias', 'miqueias', 'naum', 'sofonias', 'habacuque',
  'jeremias', 'lamentacoes', 'daniel', 'ezequiel', '1cronicas', '2cronicas', 'esdras',
  'neemias', 'ester', 'ageu', 'zacarias', 'malaquias', 'tiago', 'galatas', '1tessalonicenses',
  '2tessalonicenses', '1corintios', '2corintios', 'romanos', 'marcos', 'mateus', 'lucas',
  'atos', 'efesios', 'colossenses', 'filemom', 'filipenses', '1pedro', '1timoteo', 'tito',
  '2pedro', '2timoteo', 'hebreus', 'judas', 'joao', '1joao', '2joao', '3joao', 'apocalipse'
];

export const syncUserQuests = async (userId: number) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    const template = user.questTemplate || 'canon'; // 'canon' or 'chronological'
    const templateLabel = template === 'chronological' ? 'Cronológico' : 'Cânone';

    // 1. Get canonical books in active template order
    const canonicalBooks = BIBLE_BOOKS.filter(b => b.isCanonical !== false);
    const orderKeys = template === 'chronological' 
      ? CHRONOLOGICAL_ORDER 
      : canonicalBooks.map(b => b.key);

    const orderedBooks = orderKeys
      .map(key => canonicalBooks.find(b => b.key === key))
      .filter((b): b is typeof canonicalBooks[0] => !!b);

    // 2. Fetch all completed chapters for this user
    const completedProgress = await prisma.readingProgress.findMany({
      where: { userId, completed: true }
    });

    // Map: bookKey -> set of completed chapter numbers
    const completedChaptersMap: Record<string, Set<number>> = {};
    completedProgress.forEach(p => {
      const key = p.book.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "");
      if (!completedChaptersMap[key]) {
        completedChaptersMap[key] = new Set();
      }
      completedChaptersMap[key].add(p.chapter);
    });

    // Helper to get number of completed chapters for a book
    const getCompletedChaptersCount = (bookKey: string) => {
      return completedChaptersMap[bookKey] ? completedChaptersMap[bookKey].size : 0;
    };

    // Helper to check if a book is fully completed
    const isBookFullyCompleted = (book: typeof canonicalBooks[0]) => {
      const completedCount = getCompletedChaptersCount(book.key);
      return completedCount >= book.chapters;
    };

    // Find the first uncompleted book in active template order
    let activeBook = orderedBooks.find(b => !isBookFullyCompleted(b));
    if (!activeBook) {
      // If all are completed, default to the last one
      activeBook = orderedBooks[orderedBooks.length - 1];
    }

    // Dynamic properties for Quest 1
    const activeBookChaptersCompleted = getCompletedChaptersCount(activeBook.key);
    const quest1Title = `Estudo: ${activeBook.name}`;
    const quest1Desc = `Leia todos os ${activeBook.chapters} capítulos de ${activeBook.name} (${templateLabel})`;
    const quest1Goal = activeBook.chapters;
    const quest1Progress = Math.min(activeBookChaptersCompleted, quest1Goal);

    // Calculate Quest 4 (Challenge: Prefix length of completed books in active order)
    let completedPrefixCount = 0;
    for (const book of orderedBooks) {
      if (isBookFullyCompleted(book)) {
        completedPrefixCount++;
      } else {
        break;
      }
    }

    // Dynamic properties for Quest 4
    const quest4Title = `Jornada: ${templateLabel}`;
    const quest4Desc = `Conclua a leitura completa de 5 livros seguidos na ordem do ${templateLabel}`;
    const quest4Goal = 5;
    const quest4Progress = Math.min(completedPrefixCount, quest4Goal);

    // Recalculate Quest 3 (Devocional Diário, id=3, goal=7)
    const streakProgress = Math.min(user.streakDays, 7);

    // Sync targets in database
    const questSyncs = [
      { questId: 1, progress: quest1Progress, goal: quest1Goal, title: quest1Title, description: quest1Desc },
      { questId: 3, progress: streakProgress, goal: 7, title: 'Devocional Diário', description: 'Leia pelo menos 1 capítulo por dia durante 7 dias seguidos' },
      { questId: 4, progress: quest4Progress, goal: quest4Goal, title: quest4Title, description: quest4Desc }
    ];

    for (const item of questSyncs) {
      // Update Quest definition first
      await prisma.quest.update({
        where: { id: item.questId },
        data: {
          title: item.title,
          description: item.description,
          goal: item.goal
        }
      });

      const userQuest = await prisma.userQuest.findFirst({
        where: { userId, questId: item.questId }
      });

      if (userQuest) {
        const wasCompleted = userQuest.completed;
        const isCompleted = item.progress >= item.goal;
        const newProgress = Math.min(item.progress, item.goal);

        let shouldResetCompletion = false;
        if (item.questId === 1 && wasCompleted && !isCompleted) {
          // Dynamic book transitioned! Reset completion status so it can be completed again.
          shouldResetCompletion = true;
        }

        if (userQuest.progress !== newProgress || wasCompleted !== isCompleted || shouldResetCompletion) {
          await prisma.userQuest.update({
            where: { id: userQuest.id },
            data: {
              progress: newProgress,
              completed: shouldResetCompletion ? false : isCompleted
            }
          });

          // Award XP and level up user if just completed
          if (isCompleted && !wasCompleted && !shouldResetCompletion) {
            const quest = await prisma.quest.findUnique({ where: { id: item.questId } });
            if (quest) {
              let newXp = user.xp + quest.xpReward;
              let newLevel = user.level;
              while (newXp >= newLevel * 1000) {
                newXp -= newLevel * 1000;
                newLevel += 1;
              }
              await prisma.user.update({
                where: { id: userId },
                data: { xp: newXp, level: newLevel }
              });
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('Erro ao sincronizar missões do usuário:', err);
  }
};

export const getQuests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = 1; // mock
    
    // Always sync before loading
    await syncUserQuests(userId);

    const userQuests = await prisma.userQuest.findMany({
      where: { userId },
      include: { quest: true }
    });

    const formattedQuests = userQuests.map(uq => ({
      id: uq.quest.id,
      type: uq.quest.type,
      title: uq.quest.title,
      description: uq.quest.description,
      xpReward: uq.quest.xpReward,
      completed: uq.completed,
      progress: {
        current: uq.progress,
        target: uq.quest.goal
      }
    }));
    
    res.json({
      status: 'success',
      data: formattedQuests
    });
  } catch (error) {
    next(error);
  }
};

export const completeQuest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = 1; // mock
    const { questId } = req.body;

    if (!questId) {
      return res.status(400).json({ status: 'error', message: 'questId é obrigatório' });
    }

    const userQuest = await prisma.userQuest.findFirst({
      where: { userId, questId: Number(questId) },
      include: { quest: true }
    });

    if (!userQuest) {
      return res.status(404).json({ status: 'error', message: 'Quest do usuário não encontrada' });
    }

    if (!userQuest.completed) {
      await prisma.userQuest.update({
        where: { id: userQuest.id },
        data: {
          progress: userQuest.quest.goal,
          completed: true
        }
      });

      // Award XP
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        let newXp = user.xp + userQuest.quest.xpReward;
        let newLevel = user.level;
        while (newXp >= newLevel * 1000) {
          newXp -= newLevel * 1000;
          newLevel += 1;
        }
        await prisma.user.update({
          where: { id: userId },
          data: { xp: newXp, level: newLevel }
        });
      }

      return res.json({
        status: 'success',
        message: 'Missão concluída com sucesso!'
      });
    }

    res.json({
      status: 'success',
      message: 'Missão já estava concluída.'
    });
  } catch (error) {
    next(error);
  }
};

