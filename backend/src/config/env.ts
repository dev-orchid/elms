import { config } from 'dotenv';
import { resolve } from 'path';
import { z } from 'zod';

// Load .env — skipped on Vercel (env vars set in dashboard)
if (!process.env.VERCEL) {
  // Try monorepo root (one level up from backend/)
  config({ path: resolve(process.cwd(), '../.env') });
  // Fallback: try current directory
  config({ path: resolve(process.cwd(), '.env') });
}

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_URL: z.string().default('http://localhost:4000/api'),
  SUPABASE_URL: z.string().default('https://placeholder.supabase.co'),
  SUPABASE_ANON_KEY: z.string().default('placeholder-anon-key'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default('placeholder-service-role-key'),
  JWT_SECRET: z.string().default('dev-jwt-secret-change-in-production'),
});

export const env = envSchema.parse(process.env);
