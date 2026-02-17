import { sql, relations } from "drizzle-orm";
import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";
import { buyer } from "./buyer";
import { product } from "./product";

export const invoice = sqliteTable(
	"invoice",
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
		isFinalized: integer("is_finalized", { mode: "boolean" }).notNull().default(false),
		
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
		index("invoice_number_idx").on(table.invoiceNumber),
		index("invoice_buyer_id_idx").on(table.buyerId),
		index("invoice_status_idx").on(table.status),
		index("invoice_date_idx").on(table.invoiceDate),
	],
);

export const invoiceLineItem = sqliteTable(
	"invoice_line_item",
	{
		id: text("id").primaryKey(),
		invoiceId: text("invoice_id").notNull(),
		
		// Product reference and editable details
		productId: text("product_id").notNull(), // Reference to product table
		productName: text("product_name").notNull(),
		hsnCode: text("hsn_code").notNull(),
		
		// Pricing (stored in paise/cents for rate, percentage as decimal)
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
		index("invoice_line_item_invoice_id_idx").on(table.invoiceId),
		index("invoice_line_item_product_id_idx").on(table.productId),
		index("invoice_line_item_sort_order_idx").on(table.sortOrder),
	],
);

export const invoiceLineItemBatch = sqliteTable(
	"invoice_line_item_batch",
	{
		id: text("id").primaryKey(),
		lineItemId: text("line_item_id").notNull(),
		
		// Batch details
		batchNo: text("batch_no"), // Optional batch number
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
		index("invoice_batch_line_item_id_idx").on(table.lineItemId),
		index("invoice_batch_sort_order_idx").on(table.sortOrder),
	],
);

// Define relations between tables
export const invoiceRelations = relations(invoice, ({ one, many }) => ({
	buyer: one(buyer, {
		fields: [invoice.buyerId],
		references: [buyer.id],
	}),
	lineItems: many(invoiceLineItem),
}));

export const invoiceLineItemRelations = relations(invoiceLineItem, ({ one, many }) => ({
	invoice: one(invoice, {
		fields: [invoiceLineItem.invoiceId],
		references: [invoice.id],
	}),
	product: one(product, {
		fields: [invoiceLineItem.productId],
		references: [product.id],
	}),
	batches: many(invoiceLineItemBatch),
}));

export const invoiceLineItemBatchRelations = relations(invoiceLineItemBatch, ({ one }) => ({
	lineItem: one(invoiceLineItem, {
		fields: [invoiceLineItemBatch.lineItemId],
		references: [invoiceLineItem.id],
	}),
}));