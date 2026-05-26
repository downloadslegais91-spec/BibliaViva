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
