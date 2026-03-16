import { Database } from "bun:sqlite";
import fs from "node:fs";
import path from "node:path";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { EnhancedQueryLogger } from 'drizzle-query-logger';
import * as appSettingsSchema from "./schema/app_settings";
import * as appSeedsSchema from "./schema/app_seeds";
// --- Schemas ---
import * as authSchema from "./schema/auth";
import * as buyerSchema from "./schema/buyer";
import * as companySchema from "./schema/company";
import * as deliveryChallanSchema from "./schema/delivery-challan";
import * as invoiceSchema from "./schema/invoice";
import * as productSchema from "./schema/product";
import * as stentInvoiceSchema from "./schema/stent-invoice";

if (!process.env.DATABASE_URL) {
	throw new Error("DATABASE_URL is required");
}

const isDev = process.env.ENV !== "production";

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
	...stentInvoiceSchema,
	...deliveryChallanSchema,
	...appSettingsSchema,
	...appSeedsSchema,
};

// --- Export ---
export const db = drizzle({ client, schema, logger: isDev ? new EnhancedQueryLogger() : undefined });

export {
	and,
	asc,
	count,
	desc,
	eq,
	ilike,
	isNotNull,
	isNull,
	like,
	not,
	or,
	sql,
} from "drizzle-orm";
export { migrate } from "drizzle-orm/bun-sqlite/migrator";
export * from "./schema/app_settings";
export * from "./schema/app_seeds";
export * from "./schema/auth";
export * from "./schema/buyer";
export * from "./schema/company";
export * from "./schema/delivery-challan";
export * from "./schema/invoice";
export * from "./schema/product";
export * from "./schema/stent-invoice";
