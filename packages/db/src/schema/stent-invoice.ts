import { relations, sql } from "drizzle-orm";
import {
	index,
	integer,
	real,
	sqliteTable,
	text,
} from "drizzle-orm/sqlite-core";
import { buyer } from "./buyer";
import { product } from "./product";

export const stentInvoice = sqliteTable(
	"stent_invoice",
	{
		id: text("id").primaryKey(),
		invoiceNumber: text("invoice_number").notNull().unique(),
		invoiceType: text("invoice_type").notNull().default("TAX INVOICE"),

		// Dates
		invoiceDate: text("invoice_date").notNull(), // ISO date string
		dueDate: text("due_date"),
		dcDate: text("dc_date"),
		dcNumber: text("dc_number"),
		dispatchedThrough: text("dispatched_through"),

		// Status and flags
		status: text("status").notNull().default("Draft"), // Draft, Pending, Paid, Overdue
		isFinalized: integer("is_finalized", { mode: "boolean" })
			.notNull()
			.default(false),
		showSign: integer("show_sign", { mode: "boolean" })
			.notNull()
			.default(sql`0`),
		showSeal: integer("show_seal", { mode: "boolean" })
			.notNull()
			.default(sql`0`),

		// Amounts (stored in paise/cents)
		subtotalAmount: integer("subtotal_amount").notNull().default(0),
		taxAmount: integer("tax_amount").notNull().default(0),
		totalAmount: integer("total_amount").notNull().default(0),

		// Buyer reference and editable details
		buyerId: text("buyer_id").notNull(), // Reference to buyer table
		buyerName: text("buyer_name").notNull(),
		buyerAddressLine1: text("buyer_address_line_1").notNull(),
		buyerAddressLine2: text("buyer_address_line_2"),
		buyerAddressLine3: text("buyer_address_line_3"),
		buyerCity: text("buyer_city").notNull(),
		buyerState: text("buyer_state").notNull(),
		buyerCountry: text("buyer_country").notNull().default("India"),
		buyerPincode: text("buyer_pincode").notNull(),
		buyerGstin: text("buyer_gstin").notNull(),
		buyerMobileNumber: text("buyer_mobile_number"),
		buyerEmailAddress: text("buyer_email_address"),
		buyerDrugLicenseNumber: text("buyer_drug_license_number"),
		buyerStateCode: text("buyer_state_code"),

		// Notes and additional info
		notes: text("notes"),
		termsAndConditions: text("terms_and_conditions"),

		// Timestamps
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [
		index("stent_invoice_number_idx").on(table.invoiceNumber),
		index("stent_invoice_buyer_id_idx").on(table.buyerId),
		index("stent_invoice_status_idx").on(table.status),
		index("stent_invoice_date_idx").on(table.invoiceDate),
	],
);

export const stentInvoiceLineItem = sqliteTable(
	"stent_invoice_line_item",
	{
		id: text("id").primaryKey(),
		invoiceId: text("invoice_id").notNull(),

		// Product reference and editable details
		productId: text("product_id").notNull(), // Reference to product table
		productName: text("product_name").notNull(),
		hsnCode: text("hsn_code").notNull(),

		// Patient information
		patientName: text("patient_name").notNull(),
		patientAge: integer("patient_age").notNull(),
		patientDate: text("patient_date"), // ISO date string
		patientGender: text("patient_gender").notNull(), // "male" or "female"

		// Pricing (stored in rupees for rate, percentage as decimal)
		rate: integer("rate").notNull(), // Per unit rate in paise
		gstPercentage: real("gst_percentage").notNull(), // GST percentage as decimal (e.g., 18.0 for 18%)

		// Line totals (calculated fields, stored in paise)
		baseAmount: integer("base_amount").notNull().default(0), // Rate × Total Quantity
		taxAmount: integer("tax_amount").notNull().default(0), // Base Amount × GST%
		totalAmount: integer("total_amount").notNull().default(0), // Base + Tax

		// Display order
		sortOrder: integer("sort_order").notNull().default(0),

		// Timestamps
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [
		index("stent_line_item_invoice_id_idx").on(table.invoiceId),
		index("stent_line_item_product_id_idx").on(table.productId),
		index("stent_line_item_sort_order_idx").on(table.sortOrder),
	],
);

export const stentInvoiceLineItemSize = sqliteTable(
	"stent_invoice_line_item_size",
	{
		id: text("id").primaryKey(),
		lineItemId: text("line_item_id").notNull(),

		// Size details
		sizeDimension: text("size_dimension").notNull(), // Size dimension (e.g., "3.0 x 15mm", "6Fr", etc.)
		serialNumber: text("serial_number").notNull(), // SN.No.
		expiryDate: text("expiry_date"), // ISO date string, optional
		quantity: integer("quantity").notNull().default(1),

		// Display order
		sortOrder: integer("sort_order").notNull().default(0),

		// Timestamps
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [
		index("stent_size_line_item_id_idx").on(table.lineItemId),
		index("stent_size_sort_order_idx").on(table.sortOrder),
	],
);

// Define relations between tables
export const stentInvoiceRelations = relations(
	stentInvoice,
	({ one, many }) => ({
		buyer: one(buyer, {
			fields: [stentInvoice.buyerId],
			references: [buyer.id],
		}),
		lineItems: many(stentInvoiceLineItem),
	}),
);

export const stentInvoiceLineItemRelations = relations(
	stentInvoiceLineItem,
	({ one, many }) => ({
		invoice: one(stentInvoice, {
			fields: [stentInvoiceLineItem.invoiceId],
			references: [stentInvoice.id],
		}),
		product: one(product, {
			fields: [stentInvoiceLineItem.productId],
			references: [product.id],
		}),
		sizes: many(stentInvoiceLineItemSize),
	}),
);

export const stentInvoiceLineItemSizeRelations = relations(
	stentInvoiceLineItemSize,
	({ one }) => ({
		lineItem: one(stentInvoiceLineItem, {
			fields: [stentInvoiceLineItemSize.lineItemId],
			references: [stentInvoiceLineItem.id],
		}),
	}),
);
