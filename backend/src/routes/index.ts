import { Router } from 'express';
import { getUserStats, addXpToUser, updateUserProfile, registerUser, getRanking, getUserDetails, checkUserEmail } from '../controllers/user.controller';
import { saveProgress } from '../controllers/progress.controller';
import { adminLogin, getAdminStats, getAdminUsers, deleteUser, updateUserPlanByAdmin } from '../controllers/admin.controller';


import { getQuests, completeQuest } from '../controllers/quest.controller';
import { saveChat, getChatHistory, getChatTts } from '../controllers/chat.controller';
import { getBooks, getChapter, getChapterAudio, getTranslations } from '../controllers/bible.controller';
import { getQuizForBook } from '../controllers/quiz.controller';
import { getSermons, refreshBookSermons, updateUserPlan } from '../controllers/sermon.controller';
import { getBackgroundMusic } from '../controllers/media.controller';
import { z } from 'zod';
import { validate } from '../middlewares/validate';

const router = Router();

// Admin Routes
router.post('/admin/login', adminLogin);
router.get('/admin/stats', getAdminStats);
router.get('/admin/users', getAdminUsers);
router.delete('/admin/users/:id', deleteUser);
router.put('/admin/users/:id/plan', validate(z.object({
  body: z.object({
    plan: z.enum(['FREE', 'BASIC', 'PREMIUM'])
  })
})), updateUserPlanByAdmin);

router.get('/users/ranking', getRanking);

router.get('/users/:id/details', getUserDetails);
router.get('/users/me', getUserStats);
router.post('/users/check-email', validate(z.object({
  body: z.object({
    email: z.string().email('E-mail inválido'),
  })
})), checkUserEmail);
router.post('/users/register', validate(z.object({
  body: z.object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    email: z.string().email('E-mail inválido'),
  })
})), registerUser);
router.put('/users/profile', validate(z.object({
  body: z.object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").optional(),
    email: z.string().email("E-mail inválido").optional(),
    questTemplate: z.enum(['canon', 'chronological']).optional()
  })
})), updateUserProfile);
router.post('/users/add-xp', validate(z.object({

  body: z.object({
    xpToAdd: z.number().int().positive()
  })
})), addXpToUser);

router.post('/users/me/plan', validate(z.object({
  body: z.object({
    plan: z.enum(['FREE', 'BASIC', 'PREMIUM'])
  })
})), updateUserPlan);

router.get('/quiz/:book', getQuizForBook);
router.get('/media/music/:book', getBackgroundMusic);
// Sermon routes
router.get('/sermons/:book', getSermons);
router.post('/sermons/:book/refresh', refreshBookSermons);


router.post('/progress', validate(z.object({
  body: z.object({
    book: z.string(),
    chapter: z.number().int(),
    verses: z.array(z.number()),
    completed: z.boolean(),
  })
})), saveProgress);

router.get('/quests', getQuests);
router.post('/quests/complete', validate(z.object({
  body: z.object({
    questId: z.number().int()
  })
})), completeQuest);

router.get('/chat', getChatHistory);

router.post('/chat', validate(z.object({
  body: z.object({
    sender: z.enum(['user', 'ai']),
    message: z.string().min(1),
    book: z.string().optional(),
    chapter: z.number().int().optional(),
  })
})), saveChat);

router.post('/chat/tts', validate(z.object({
  body: z.object({
    text: z.string().min(1)
  })
})), getChatTts);


router.get('/bible/:book/:chapter/audio', getChapterAudio);

router.get('/bible/books', getBooks);
router.get('/bible/translations', getTranslations);
router.get('/books', getBooks);
router.get('/bible/:book/:chapter', getChapter);

export default router;


