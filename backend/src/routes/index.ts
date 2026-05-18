import { Router } from 'express';
import { getUserStats, addXpToUser, updateUserProfile, registerUser } from '../controllers/user.controller';
import { saveProgress } from '../controllers/progress.controller';

import { getQuests, completeQuest } from '../controllers/quest.controller';
import { saveChat, getChatHistory } from '../controllers/chat.controller';
import { getBooks, getChapter, getChapterAudio } from '../controllers/bible.controller';
import { getQuizForBook } from '../controllers/quiz.controller';
import { z } from 'zod';
import { validate } from '../middlewares/validate';

const router = Router();

router.get('/users/me', getUserStats);
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

router.get('/quiz/:book', getQuizForBook);


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

router.get('/bible/:book/:chapter/audio', getChapterAudio);

router.get('/bible/books', getBooks);
router.get('/books', getBooks);
router.get('/bible/:book/:chapter', getChapter);

export default router;


