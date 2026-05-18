import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { resolveUserId } from '../services/auth';
import { SermonService } from '../services/sermon.service';

export const getSermons = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const book = req.params.book as string;
    let plan = 'FREE';

    try {
      const resolvedUserId = await resolveUserId(req);
      const user = await prisma.user.findUnique({ where: { id: resolvedUserId } });
      if (user) {
        plan = user.plan || 'FREE';
      }
    } catch (authError) {
      console.log('[SermonController] User not authenticated or resolution failed, defaulting to FREE plan');
    }

    const sermons = await SermonService.getSermonsForBook(book);
    
    // Gating logic:
    // FREE tier: only returns top 3 videos
    // BASIC / PREMIUM: returns up to top 6 videos
    const userPlan = plan.toUpperCase();
    const isFree = userPlan === 'FREE';
    const gatedSermons = isFree ? sermons.slice(0, 3) : sermons;

    res.json({
      status: 'success',
      data: {
        sermons: gatedSermons,
        plan: userPlan,
        totalAvailable: sermons.length
      }
    });
  } catch (error) {
    next(error);
  }
};

export const refreshBookSermons = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const book = req.params.book as string;
    const sermons = await SermonService.forceRefresh(book);
    res.json({
      status: 'success',
      data: sermons
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserPlan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = await resolveUserId(req);
    const { plan } = req.body;
    
    if (!plan || !['FREE', 'BASIC', 'PREMIUM'].includes(plan.toUpperCase())) {
      res.status(400).json({ status: 'error', message: 'Plano inválido. Escolha entre FREE, BASIC ou PREMIUM.' });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { plan: plan.toUpperCase() }
    });

    res.json({
      status: 'success',
      data: {
        plan: updatedUser.plan
      }
    });
  } catch (error) {
    next(error);
  }
};
