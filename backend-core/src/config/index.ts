import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('4000'),
  DATABASE_URL: z.string(),
  MONGODB_URI: z.string(),
  REDIS_URL: z.string(),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('24h'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  LAB_SERVICE_URL: z.string().default('http://localhost:8000'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  BCRYPT_ROUNDS: z.string().default('12'),
  RATE_LIMIT_WINDOW_MS: z.string().default('900000'),
  RATE_LIMIT_MAX: z.string().default('100'),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  TWILIO_WHATSAPP_NUMBER: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = {
  env: parsed.data.NODE_ENV,
  port: parseInt(parsed.data.PORT, 10),
  isDev: parsed.data.NODE_ENV === 'development',
  isProd: parsed.data.NODE_ENV === 'production',

  db: {
    url: parsed.data.DATABASE_URL,
  },

  mongodb: {
    uri: parsed.data.MONGODB_URI,
  },

  redis: {
    url: parsed.data.REDIS_URL,
  },

  jwt: {
    secret: parsed.data.JWT_SECRET,
    refreshSecret: parsed.data.JWT_REFRESH_SECRET,
    expiresIn: parsed.data.JWT_EXPIRES_IN,
    refreshExpiresIn: parsed.data.JWT_REFRESH_EXPIRES_IN,
  },

  services: {
    labUrl: parsed.data.LAB_SERVICE_URL,
    frontendUrl: parsed.data.FRONTEND_URL,
  },

  security: {
    bcryptRounds: parseInt(parsed.data.BCRYPT_ROUNDS, 10),
    rateLimitWindowMs: parseInt(parsed.data.RATE_LIMIT_WINDOW_MS, 10),
    rate_limit_max: parseInt(parsed.data.RATE_LIMIT_MAX, 10),
    rateLimitMax: parseInt(parsed.data.RATE_LIMIT_MAX, 10),
  },
  twilio: {
    accountSid: parsed.data.TWILIO_ACCOUNT_SID,
    authToken: parsed.data.TWILIO_AUTH_TOKEN,
    fromNumber: parsed.data.TWILIO_PHONE_NUMBER,
    whatsappNumber: parsed.data.TWILIO_WHATSAPP_NUMBER,
  },
};
