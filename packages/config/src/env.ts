import { z } from 'zod';

const envSchema = z.object({
  // App
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_APP_NAME: z.string().default('Bananasbindery'),

  // Supabase — REQUIRED (fail-fast if missing)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

  // Storage
  NEXT_PUBLIC_STORAGE_URL: z.string().url().optional(),

  // Payment (Xendit)
  XENDIT_SECRET_KEY: z.string().min(1).optional(),
  XENDIT_TEST_SECRET_KEY: z.string().min(1).optional(),
  XENDIT_CALLBACK_TOKEN: z.string().min(1).optional(),
  XENDIT_TEST_CALLBACK_TOKEN: z.string().min(1).optional(),

  // Shipping (Biteship)
  BITESHIP_API_KEY: z.string().min(1).optional(),
  BITESHIP_TEST_API_KEY: z.string().min(1).optional(),
  BITESHIP_ORIGIN_AREA_ID: z.string().min(1).optional(),

  // Maps — Phase 5+
  NEXT_PUBLIC_GOOGLE_MAPS_KEY: z.string().min(1).optional(),

  // WhatsApp (Fonnte) — Phase 7+
  FONNTE_API_TOKEN: z.string().min(1).optional(),
  WHATSAPP_API_KEY: z.string().min(1).optional(),
  WHATSAPP_SENDER_NUMBER: z.string().min(1).optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validates environment variables. Call at app startup.
 * Throws with detailed error if required vars are missing.
 */
export function validateEnv(env: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(env);

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    const messages = Object.entries(errors)
      .map(([key, msgs]) => `  ${key}: ${(msgs ?? []).join(', ')}`)
      .join('\n');
    throw new Error(`Invalid environment variables:\n${messages}`);
  }

  return result.data;
}
