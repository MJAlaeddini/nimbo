import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const DB_PATH = process.env.ORCHESTRATOR_DB ?? path.join(process.cwd(), ".data", "orchestrator.db");

/**
 * Next.js dev recompiles modules on every change; a fresh SQLite handle per
 * compile would leak file descriptors and lose the in-process run scheduler's
 * view of the data. Hang the connection off globalThis instead.
 */
const globalForDb = globalThis as unknown as { __orchestratorDb?: ReturnType<typeof create> };

function create() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  return drizzle(sqlite, { schema });
}

export const db = globalForDb.__orchestratorDb ?? create();
if (process.env.NODE_ENV !== "production") globalForDb.__orchestratorDb = db;

export { schema, DB_PATH };
