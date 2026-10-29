import { z } from "zod";

/**
 * Zod-validated environment variable schema.
 * Throws a descriptive error at startup if any required variable is missing
 * or has an invalid format, ensuring fail-fast behaviour in misconfigured environments.
 */
const envSchema = z.object({
  // ── Application ──
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_NAME: z.string().default("APAAR Student Academic Platform"),
  APP_URL: z.string().url().default("http://localhost:3000"),

  // ── Database ──
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),

  // ── Authentication ──
  AUTH_SECRET: z
    .string()
    .min(16, "AUTH_SECRET must be at least 16 characters long"),
  JWT_REFRESH_SECRET: z.string().optional(),

  // ── Client URL (CORS) ──
  CLIENT_URL: z.string().url().default("http://localhost:5173"),

  // ── Document Storage ──
  DOCUMENT_STORAGE_PROVIDER: z
    .enum(["cloudinary", "local"])
    .default("local"),
  DOCUMENT_STORAGE_BUCKET: z.string().optional(),
  STORAGE_LOCAL_PATH: z.string().default("./uploads"),
  MAX_FILE_SIZE_MB: z.coerce.number().default(5),

  // ── Cloudinary ──
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // ── Email (SMTP) ──
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  FROM_NAME: z.string().default("APAAR Platform"),

  // ── Legacy Email Fallback ──
  EMAIL_HOST: z.string().optional(),
  EMAIL_PORT: z.coerce.number().optional(),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASSWORD: z.string().optional(),

  // ── Redis ──
  REDIS_URL: z.string().optional(),
});

/**
 * Parsed & validated environment object.
 * Access typed values via `env.MONGODB_URI`, `env.AUTH_SECRET`, etc.
 */
export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;
