import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const appSeeds = sqliteTable("app_seeds", {
	id: text("id").primaryKey(), // crypto.randomUUID()

	seedKey: text("seed_key").notNull().unique(),
	// examples:
	// "initial_admin"
	// "buyers_v1"
	// "products_v1"
	// "company_v1"

	applied: integer("applied", { mode: "boolean" }).notNull().default(false),

	appliedAt: text("applied_at"), // ISO string

	checksum: text("checksum"),
	// optional: hash of seed data/version

	notes: text("notes"),
});
