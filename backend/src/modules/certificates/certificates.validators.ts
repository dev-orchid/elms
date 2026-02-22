import { z } from 'zod';

export const generateCertificateSchema = z.object({
  user_id: z.string().uuid('Invalid user ID').optional(),
  course_id: z.string().uuid('Invalid course ID'),
});

export const verifyCodeParamSchema = z.object({
  code: z.string().min(1, 'Verification code is required'),
});

export type GenerateCertificateInput = z.infer<typeof generateCertificateSchema>;
export type VerifyCodeParam = z.infer<typeof verifyCodeParamSchema>;
