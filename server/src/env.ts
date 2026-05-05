import { z } from "zod";

const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  CLIENT_ORIGIN: z.string().url().optional(),
  PORT: z.coerce.number().int().positive().optional()
});

export const env = EnvSchema.parse(process.env);

