import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { syncUserQuests } from './quest.controller';

export const saveProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = 1; // mock
    const { book, chapter, verses, completed } = req.body;

    let progress = await prisma.readingProgress.findFirst({
      where: { userId, book, chapter }
    });

    if (progress) {
      progress = await prisma.readingProgress.update({
        where: { id: progress.id },
        data: { verses, completed }
      });
    } else {
      progress = await prisma.readingProgress.create({
        data: { userId, book, chapter, verses, completed }
      });
    }

    // Add XP if completed
    if (completed) {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      if (user) {
        let currentXp = user.xp + 50;
        let currentLevel = user.level;
        while (currentXp >= currentLevel * 1000) {
          currentXp -= currentLevel * 1000;
          currentLevel += 1;
        }
        await prisma.user.update({
          where: { id: userId },
          data: {
            xp: currentXp,
            level: currentLevel
          }
        });
      }
    }

    // Sync user quests dynamically in real time!
    await syncUserQuests(userId);

    res.json({
      status: 'success',
      data: progress
    });
  } catch (error) {
    next(error);
  }
};
