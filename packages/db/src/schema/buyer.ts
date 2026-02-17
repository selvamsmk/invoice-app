import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

export const buyer = sqliteTable(
	"buyer",
	{
		id: text("id").primaryKey(),
		name: text("name").notNull(),
		addressLine1: text("address_line_1").notNull(),
		addressLine2: text("address_line_2"),
		addressLine3: text("address_line_3"),
		city: text("city").notNull(),
		state: text("state").notNull(),
		country: text("country").notNull().default("India"),
		pincode: text("pincode").notNull(),
		gstin: text("gstin"),
		mobileNumber: text("mobile_number"),
		emailAddress: text("email_address"),
		drugLicenseNumber: text("drug_license_number"),
		stateCode: text("state_code"),
		totalInvoices: integer("total_invoices").notNull().default(0),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [
		index("buyer_gstin_idx").on(table.gstin),
	],
);
