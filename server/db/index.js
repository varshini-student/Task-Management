import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql as drizzleSql } from "drizzle-orm";
import { env } from "../config/env.js";
import * as schema from "./schema/index.js";

const sql = neon(env.databaseUrl);

export const db = drizzle(sql, { schema });
export { schema };

/** Verifies the Neon connection at boot so failures are obvious and early. */
export async function verifyDatabaseConnection() {
  await db.execute(drizzleSql`select 1`);
}
