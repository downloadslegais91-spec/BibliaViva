import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { resolveUserId } from '../services/auth';

export const getUserStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = await resolveUserId(req); 
    let user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        readingProgress: true,
      }
    });

    if (!user) {
      const uniqueEmail = `fallback-${userId}-${Date.now()}@bibliaviva.com`;
      user = await prisma.user.create({
        data: {
          id: userId,
          name: 'Usuário Teste',
          email: uniqueEmail,
          xp: 0,
          level: 1,
          streakDays: 0,
        },
        include: {
          readingProgress: true,
        }
      });
    }

    res.json({
      status: 'success',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

export const addXpToUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { xpToAdd } = req.body;
    if (typeof xpToAdd !== 'number' || xpToAdd <= 0) {
      res.status(400).json({ status: 'error', message: 'Quantidade de XP inválida.' });
      return;
    }

    const userId = await resolveUserId(req);
    
    // Find the user first to get their current XP and Level
    let user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      // If user doesn't exist, create them
      const uniqueEmail = `fallback-${userId}-${Date.now()}@bibliaviva.com`;
      user = await prisma.user.create({
        data: {
          id: userId,
          name: 'Usuário Teste',
          email: uniqueEmail,
          xp: 0,
          level: 1,
          streakDays: 0,
        }
      });
    }

    let currentXp = user.xp + xpToAdd;
    let currentLevel = user.level;
    let leveledUp = false;

    // Loop to handle multiple level ups in one large XP addition
    while (currentXp >= currentLevel * 1000) {
      currentXp -= currentLevel * 1000;
      currentLevel += 1;
      leveledUp = true;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        xp: currentXp,
        level: currentLevel
      },
      include: {
        readingProgress: true
      }
    });

    res.json({
      status: 'success',
      data: {
        user: updatedUser,
        leveledUp,
        addedXp: xpToAdd,
        newLevel: currentLevel
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, questTemplate } = req.body;
    const userId = await resolveUserId(req);

    const data: any = {};
    if (name !== undefined) data.name = name;
    if (email !== undefined) {
      data.email = email.trim().toLowerCase();
    }
    if (questTemplate !== undefined) data.questTemplate = questTemplate;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
      include: {
        readingProgress: true
      }
    });

    res.json({
      status: 'success',
      data: updatedUser
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json({
        status: 'error',
        message: 'Este e-mail já está sendo utilizado por outro usuário.'
      });
      return;
    }
    next(error);
  }
};

export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      res.status(409).json({
        status: 'error',
        message: 'Este e-mail já está sendo utilizado.'
      });
      return;
    }

    // Create the new user
    const newUser = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        xp: 0,
        level: 1,
        streakDays: 0,
      }
    });

    // Auto-assign all existing quests to this new user
    const quests = await prisma.quest.findMany();
    if (quests.length > 0) {
      await prisma.userQuest.createMany({
        data: quests.map(q => ({
          userId: newUser.id,
          questId: q.id,
          progress: 0,
          completed: false,
        }))
      });
    }

    // Return full user with relations
    const fullUser = await prisma.user.findUnique({
      where: { id: newUser.id },
      include: {
        readingProgress: true,
        userQuests: true,
      }
    });

    res.status(201).json({
      status: 'success',
      data: fullUser
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(409).json({
        status: 'error',
        message: 'Este e-mail já está sendo utilizado.'
      });
      return;
    }
    next(error);
  }
};

export const getRanking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: [
        { xp: 'desc' },
        { level: 'desc' }
      ],
      take: 100,
      select: {
        id: true,
        name: true,
        xp: true,
        level: true
      }
    });

    res.json({
      status: 'success',
      data: users
    });
  } catch (error) {
    next(error);
  }
};

export const getUserDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      res.status(400).json({ status: 'error', message: 'ID de usuário inválido.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      res.status(404).json({ status: 'error', message: 'Usuário não encontrado.' });
      return;
    }

    const chaptersCount = await prisma.readingProgress.count({
      where: { userId }
    });

    const questsCount = await prisma.userQuest.count({
      where: { userId, completed: true }
    });

    // Mask email for privacy
    let maskedEmail = '';
    if (user.email) {
      const parts = user.email.split('@');
      if (parts.length === 2) {
        const name = parts[0];
        const domain = parts[1];
        maskedEmail = name.length > 2 
          ? `${name.substring(0, 2)}***@${domain}` 
          : `***@${domain}`;
      }
    }

    res.json({
      status: 'success',
      data: {
        id: user.id,
        name: user.name,
        email: maskedEmail,
        xp: user.xp,
        level: user.level,
        streakDays: user.streakDays,
        createdAt: user.createdAt,
        plan: user.plan,
        chaptersRead: chaptersCount,
        questsCompleted: questsCount
      }
    });
  } catch (error) {
    next(error);
  }
};

export const checkUserEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (user) {
      res.json({
        status: 'success',
        exists: true,
        data: {
          name: user.name,
          email: user.email
        }
      });
    } else {
      res.status(404).json({
        status: 'error',
        exists: false,
        message: 'Este e-mail não possui cadastro no sistema.'
      });
    }
  } catch (error) {
    next(error);
  }
};

