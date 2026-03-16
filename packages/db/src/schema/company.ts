import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const company = sqliteTable(
	"company",
	{
		id: text("id").primaryKey(),
		companyName: text("company_name").notNull(),
		addressLine1: text("address_line_1").notNull(),
		addressLine2: text("address_line_2"),
		addressLine3: text("address_line_3"),
		city: text("city").notNull(),
		state: text("state").notNull(),
		country: text("country").notNull().default("India"),
		pincode: text("pincode").notNull(),
		gstin: text("gstin").notNull(),
		drugLicenseNumber: text("drug_license_number"),
		phoneNumber: text("phone_number"),
		emailAddress: text("email_address"),
		bankAccountNumber: text("bank_account_number"),
		ifscCode: text("ifsc_code"),
		bankName: text("bank_name"),
		branch: text("branch"),
		logoUrl: text("logo_url"), // For storing company logo path/URL
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [
		index("company_gstin_idx").on(table.gstin),
		index("company_name_idx").on(table.companyName),
	],
);
