import { z } from "zod";

// Schema for validating and typing environment variables
const envSchema = z.object({
  ENVIRONMENT: z.enum(["development", "staging", "production"]),
  CLICKUP_TOKEN: z.string().min(10, "CLICKUP_TOKEN seems too short"),
  CLICKUP_TEAM_ID: z.string().min(5, "CLICKUP_TEAM_ID seems too short"),
  DOCS_BUCKET: z.any(), // Leave as-is; can't validate at runtime
  DB: z.any(),          // Same here
});

// Exported type-safe interface
export type ValidatedEnv = z.infer<typeof envSchema>;

// Function to call at startup
export function validateEnv(env: unknown): ValidatedEnv {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    console.error("❌ Invalid environment configuration:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables");
  }
  return parsed.data;
}
