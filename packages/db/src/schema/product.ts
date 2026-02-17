import { sql } from "drizzle-orm";
import { sqliteTable, text, real, integer, index } from "drizzle-orm/sqlite-core";

export const product = sqliteTable(
	"product",
	{
		id: text("id").primaryKey(),
		name: text("name").notNull(),
		defaultRate: real("default_rate").notNull(),
		hsnCode: text("hsn_code").notNull(),
		gstPercentage: real("gst_percentage").notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [
		index("product_hsn_code_idx").on(table.hsnCode),
		index("product_name_idx").on(table.name),
	],
);