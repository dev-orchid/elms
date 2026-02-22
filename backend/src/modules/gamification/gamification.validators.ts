import { z } from 'zod';

export const leaderboardQuerySchema = z.object({
  scope: z.enum(['global', 'course', 'monthly']).optional(),
  scope_id: z.string().uuid().optional(),
  limit: z.string().optional(),
});

export type LeaderboardQuery = z.infer<typeof leaderboardQuerySchema>;
