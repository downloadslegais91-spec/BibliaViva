import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';

const ADMIN_TOKEN = 'admin-secret-token';
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';

/**
 * Middleware or helper to check admin authorization
 */
const verifyAdminToken = (req: Request): boolean => {
  const token = req.headers['x-admin-token'] as string;
  return token === ADMIN_TOKEN;
};

export const adminLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body;
    const normalizedUsername = typeof username === 'string' ? username.trim().toLowerCase() : '';

    if ((normalizedUsername === ADMIN_USER || normalizedUsername === 'admin@gmail.com') && password === ADMIN_PASS) {
      res.json({
        status: 'success',
        data: {
          token: ADMIN_TOKEN
        }
      });
    } else {
      res.status(401).json({
        status: 'error',
        message: 'Usuário ou senha incorretos.'
      });
    }
  } catch (error) {
    next(error);
  }
};

export const getAdminStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!verifyAdminToken(req)) {
      res.status(403).json({ status: 'error', message: 'Acesso negado. Token administrativo inválido.' });
      return;
    }

    const totalUsers = await prisma.user.count();
    
    const xpAgg = await prisma.user.aggregate({
      _avg: { xp: true }
    });
    const avgXp = Math.round(xpAgg._avg.xp || 0);

    const lvlAgg = await prisma.user.aggregate({
      _avg: { level: true }
    });
    const avgLevel = Math.round((lvlAgg._avg.level || 1) * 10) / 10;

    const plans = await prisma.user.groupBy({
      by: ['plan'],
      _count: {
        id: true
      }
    });

    const planStats = {
      FREE: 0,
      BASIC: 0,
      PREMIUM: 0
    };

    plans.forEach(p => {
      if (p.plan in planStats) {
        planStats[p.plan as keyof typeof planStats] = p._count.id;
      }
    });

    res.json({
      status: 'success',
      data: {
        totalUsers,
        avgXp,
        avgLevel,
        planStats
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!verifyAdminToken(req)) {
      res.status(403).json({ status: 'error', message: 'Acesso negado. Token administrativo inválido.' });
      return;
    }

    const users = await prisma.user.findMany({
      orderBy: { id: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        xp: true,
        level: true,
        streakDays: true,
        plan: true,
        createdAt: true,
        lastAccess: true
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

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!verifyAdminToken(req)) {
      res.status(403).json({ status: 'error', message: 'Acesso negado. Token administrativo inválido.' });
      return;
    }

    const { id } = req.params;
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      res.status(400).json({ status: 'error', message: 'ID de usuário inválido.' });
      return;
    }

    // Do not delete system default user (ID 1)
    if (userId === 1) {
      res.status(400).json({ status: 'error', message: 'Não é permitido excluir o usuário padrão do sistema.' });
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      res.status(404).json({ status: 'error', message: 'Usuário não encontrado.' });
      return;
    }

    // Delete user - Cascades automatically through prisma based on schema constraints
    await prisma.user.delete({
      where: { id: userId }
    });

    res.json({
      status: 'success',
      message: 'Usuário excluído com sucesso.'
    });
  } catch (error) {
    next(error);
  }
};
