import { Request, Response, NextFunction } from 'express';
import { gamificationService } from './gamification.service.js';

export class GamificationController {
  async getLeaderboard(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await gamificationService.getLeaderboard(
        req.query as Record<string, string>,
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getMyStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await gamificationService.getMyStats(req.user!.id);
      res.json(stats);
    } catch (err) {
      next(err);
    }
  }

  async getBadges(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await gamificationService.getBadges(req.user!.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const gamificationController = new GamificationController();
