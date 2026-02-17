// packages/db/src/drizzle.config.ts
import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";
import { resolve, dirname, isAbsolute } from "path";
import fs from "fs";

// Load .env from apps/server
dotenv.config({
  path: resolve(__dirname, "../../apps/server/.env"),
});

// Resolve database path relative to repo root
// Default to ./data/local.db
const rawDbUrl =
  process.env.DATABASE_URL ||
  resolve(__dirname, "../../data/local.db"); // src -> db -> packages -> repo root

const dbUrl = isAbsolute(rawDbUrl)
  ? rawDbUrl
  : resolve(__dirname, "../../", rawDbUrl);

fs.mkdirSync(dirname(dbUrl), { recursive: true });

console.log("DB Url:", dbUrl)

export default defineConfig({
  schema: "./src/schema",
  out: "../../apps/server/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: dbUrl,
  },
});