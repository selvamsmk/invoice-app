import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { buyer } from "./buyer";
import { product } from "./product";

export const deliveryChallan = sqliteTable(
	"delivery_challan",
	{
		id: text("id").primaryKey(),
		challanNumber: text("challan_number").notNull().unique(),

		// Dates
		challanDate: text("challan_date").notNull(), // ISO date string
		dcDate: text("dc_date"),
		dcNumber: text("dc_number"),
		dispatchedThrough: text("dispatched_through"),

		// Status and flags
		status: text("status").notNull().default("Draft"), // Draft, Dispatched, Delivered
		isFinalized: integer("is_finalized", { mode: "boolean" })
			.notNull()
			.default(false),
		showSign: integer("show_sign", { mode: "boolean" })
			.notNull()
			.default(sql`0`),
		showSeal: integer("show_seal", { mode: "boolean" })
			.notNull()
			.default(sql`0`),

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
		buyerGstin: text("buyer_gstin"),
		buyerMobileNumber: text("buyer_mobile_number"),
		buyerEmailAddress: text("buyer_email_address"),
		buyerDrugLicenseNumber: text("buyer_drug_license_number"),
		buyerStateCode: text("buyer_state_code"),

		// Notes
		notes: text("notes"),

		// Timestamps
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("delivery_challan_number_idx").on(table.challanNumber),
		index("delivery_challan_buyer_id_idx").on(table.buyerId),
		index("delivery_challan_status_idx").on(table.status),
		index("delivery_challan_date_idx").on(table.challanDate),
	],
);

export const deliveryChallanLineItem = sqliteTable(
	"delivery_challan_line_item",
	{
		id: text("id").primaryKey(),
		challanId: text("challan_id").notNull(),

		// Product reference and editable details
		productId: text("product_id").notNull(), // Reference to product table
		productName: text("product_name").notNull(),
		hsnCode: text("hsn_code").notNull(),

		// Display order
		sortOrder: integer("sort_order").notNull().default(0),

		// Timestamps
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("delivery_challan_line_item_challan_id_idx").on(table.challanId),
		index("delivery_challan_line_item_product_id_idx").on(table.productId),
		index("delivery_challan_line_item_sort_order_idx").on(table.sortOrder),
	],
);

export const deliveryChallanLineItemBatch = sqliteTable(
	"delivery_challan_line_item_batch",
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
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("delivery_challan_batch_line_item_id_idx").on(table.lineItemId),
		index("delivery_challan_batch_sort_order_idx").on(table.sortOrder),
	],
);

// Define relations between tables
export const deliveryChallanRelations = relations(
	deliveryChallan,
	({ one, many }) => ({
		buyer: one(buyer, {
			fields: [deliveryChallan.buyerId],
			references: [buyer.id],
		}),
		lineItems: many(deliveryChallanLineItem),
	}),
);

export const deliveryChallanLineItemRelations = relations(
	deliveryChallanLineItem,
	({ one, many }) => ({
		challan: one(deliveryChallan, {
			fields: [deliveryChallanLineItem.challanId],
			references: [deliveryChallan.id],
		}),
		product: one(product, {
			fields: [deliveryChallanLineItem.productId],
			references: [product.id],
		}),
		batches: many(deliveryChallanLineItemBatch),
	}),
);

export const deliveryChallanLineItemBatchRelations = relations(
	deliveryChallanLineItemBatch,
	({ one }) => ({
		lineItem: one(deliveryChallanLineItem, {
			fields: [deliveryChallanLineItemBatch.lineItemId],
			references: [deliveryChallanLineItem.id],
		}),
	}),
);
