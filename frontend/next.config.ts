import { config } from 'dotenv';
import { resolve } from 'path';
import type { NextConfig } from "next";

// Load root .env so the entire monorepo shares one env file
config({ path: resolve(__dirname, '../.env') });

const nextConfig: NextConfig = {
  transpilePackages: ['shared'],
  env: {
    NEXT_PUBLIC_API_URL: process.env.API_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  },
};

export default nextConfig;
