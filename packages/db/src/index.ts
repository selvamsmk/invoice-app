import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import fs from "node:fs";
import path from "node:path";

// --- Schemas ---
import * as authSchema from "./schema/auth";
import * as buyerSchema from "./schema/buyer";
import * as productSchema from "./schema/product";
import * as companySchema from "./schema/company";
import * as invoiceSchema from "./schema/invoice";
import * as appSeedsSchema from "./schema/app_seeds";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

const RAW_DB_PATH = process.env.DATABASE_URL;
const repoRoot = path.resolve(import.meta.dirname, "../../..");
const resolvedDbPath = path.isAbsolute(RAW_DB_PATH)
  ? RAW_DB_PATH
  : path.resolve(repoRoot, RAW_DB_PATH);

// IMPORTANT: log here
console.log("🗄️ Using DB:", resolvedDbPath);

if (resolvedDbPath !== ":memory:") {
  fs.mkdirSync(path.dirname(resolvedDbPath), { recursive: true });
}

const client = new Database(resolvedDbPath);

// --- Combine schemas ---
const schema = {
  ...authSchema,
  ...buyerSchema,
  ...productSchema,
  ...companySchema,
  ...invoiceSchema,
  ...appSeedsSchema,
};

// --- Export ---
export const db = drizzle({ client, schema });

export * from "./schema/auth";
export * from "./schema/buyer";
export * from "./schema/product";
export * from "./schema/company";
export * from "./schema/invoice";
export * from "./schema/app_seeds";

export {
  eq,
  and,
  or,
  not,
  isNull,
  isNotNull,
  like,
  ilike,
  desc,
  asc,
  count,
  sql
} from "drizzle-orm";

export { migrate } from "drizzle-orm/bun-sqlite/migrator"
