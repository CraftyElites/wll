import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv();

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required (mysql://...)"),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters"),
  ORIGIN_SECRET: z.string().min(16).optional(),
  COOKIE_DOMAIN: z.string().default("localhost"),
  ALLOWED_ORIGINS: z
    .string()
    .default("http://localhost:5173,http://localhost:3000,https://webeverlabs.com,https://dash.webeverlabs.com")
    .transform((s) => s.split(",").map((x) => x.trim()).filter(Boolean)),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(25 * 1024 * 1024),
  ALLOWED_MIME_PREFIXES: z
    .string()
    .default("image/,application/pdf,text/,application/json,application/wurl,application/zip,video/")
    .transform((s) => s.split(",").map((x) => x.trim()).filter(Boolean)),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const cfg = parsed.data;
export const isProd = cfg.NODE_ENV === "production";
