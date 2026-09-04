import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: { url: process.env.ORCHESTRATOR_DB ?? ".data/orchestrator.db" },
} satisfies Config;
