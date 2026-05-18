import { Request } from 'express';
import prisma from '../prisma';

/**
 * Resolves the database User ID dynamically using the custom 'X-User-Email' request header.
 * If the user does not exist in the database, they are automatically registered, and all
 * default quests are mapped to them.
 * 
 * Falls back to ID 1 (standard test/mock user) if the header is missing.
 */
export const resolveUserId = async (req: Request): Promise<number> => {
  const emailHeader = req.headers['x-user-email'] as string;
  
  if (emailHeader && emailHeader.trim() !== '') {
    const email = emailHeader.trim().toLowerCase();
    
    let user = await prisma.user.findUnique({
      where: { email }
    });

    // If user is not found, automatically register them!
    if (!user) {
      console.log(`[Auth] Resolvendo novo usuário via e-mail: ${email}`);
      const namePart = email.split('@')[0];
      const name = namePart.charAt(0).toUpperCase() + namePart.slice(1);
      
      user = await prisma.user.create({
        data: {
          name,
          email,
          xp: 0,
          level: 1,
          streakDays: 1,
        }
      });

      // Auto-assign all existing quests to this new user
      const quests = await prisma.quest.findMany();
      if (quests.length > 0) {
        await prisma.userQuest.createMany({
          data: quests.map(q => ({
            userId: user!.id,
            questId: q.id,
            progress: 0,
            completed: false,
          }))
        });
      }
    }

    return user.id;
  }
  
  // Default fallback to user 1 (test user). Ensure user 1 exists!
  let defaultUser = await prisma.user.findUnique({ where: { id: 1 } });
  if (!defaultUser) {
    try {
      defaultUser = await prisma.user.create({
        data: {
          id: 1,
          name: 'Discípulo Fiel',
          email: 'usuario@bibliaviva.com.br',
          xp: 0,
          level: 1,
          streakDays: 0,
        }
      });
      
      const quests = await prisma.quest.findMany();
      if (quests.length > 0) {
        await prisma.userQuest.createMany({
          data: quests.map(q => ({
            userId: 1,
            questId: q.id,
            progress: 0,
            completed: false,
          }))
        });
      }
    } catch (e) {
      defaultUser = await prisma.user.findUnique({ where: { id: 1 } });
      if (!defaultUser) {
        const anyUser = await prisma.user.findFirst();
        if (anyUser) return anyUser.id;
      }
    }
  }

  return defaultUser ? defaultUser.id : 1;
};
