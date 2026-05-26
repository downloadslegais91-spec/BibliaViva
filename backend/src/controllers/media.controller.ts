import { Request, Response, NextFunction } from 'express';
import { generateBackgroundMusic } from '../services/multimodal.service';

export const getBackgroundMusic = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { book } = req.params;
    
    if (!book) {
      res.status(400).json({ status: 'error', message: 'Book name is required' });
      return;
    }

    const audioUrl = await generateBackgroundMusic(book as string);

    res.json({
      status: 'success',
      data: {
        book,
        audioUrl
      }
    });
  } catch (error) {
    next(error);
  }
};

import { generateAudio } from '../services/tts.service';

export const generateTTSAudio = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      res.status(400).json({ status: 'error', message: 'Text is required' });
      return;
    }

    const audioUrl = await generateAudio(text);

    res.json({
      status: 'success',
      data: {
        audioUrl
      }
    });
  } catch (error) {
    next(error);
  }
};
