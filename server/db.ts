import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// Prefer Neon when configured, while retaining compatibility with existing
// Supabase and Plesk environments.
const databaseUrl =
  process.env.NEON_DATABASE_URL ||
  process.env.SUPABASE_NEW_DATABASE_URL ||
  process.env.SUPABASE_DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "NEON_DATABASE_URL, SUPABASE_NEW_DATABASE_URL, or SUPABASE_DATABASE_URL must be configured.",
  );
}

export const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});
export const db = drizzle(pool, { schema });
