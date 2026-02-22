import { Router } from 'express';
import { gamificationController } from './gamification.controller.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/auth.js';
import { leaderboardQuerySchema } from './gamification.validators.js';

const router = Router();

// Leaderboard (global, course, monthly)
router.get(
  '/leaderboard',
  authenticate,
  validate({ query: leaderboardQuerySchema }),
  gamificationController.getLeaderboard,
);

// My stats (points, level, streak, badges summary, rank)
router.get(
  '/gamification/my-stats',
  authenticate,
  gamificationController.getMyStats,
);

// All badges with earned status
router.get(
  '/gamification/badges',
  authenticate,
  gamificationController.getBadges,
);

export default router;
