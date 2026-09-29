import { defineConfig } from "drizzle-kit";

const databaseUrl =
  process.env.NEON_DATABASE_URL || process.env.SUPABASE_NEW_DATABASE_URL;

if (!databaseUrl) {
  throw new Error("NEON_DATABASE_URL or SUPABASE_NEW_DATABASE_URL must be configured.");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
