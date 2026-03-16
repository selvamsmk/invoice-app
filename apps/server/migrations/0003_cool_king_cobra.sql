CREATE TABLE `stent_invoice` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_number` text NOT NULL,
	`invoice_type` text DEFAULT 'TAX INVOICE' NOT NULL,
	`invoice_date` text NOT NULL,
	`due_date` text,
	`dc_date` text,
	`dc_number` text,
	`dispatched_through` text,
	`status` text DEFAULT 'Draft' NOT NULL,
	`is_finalized` integer DEFAULT false NOT NULL,
	`subtotal_amount` integer DEFAULT 0 NOT NULL,
	`tax_amount` integer DEFAULT 0 NOT NULL,
	`total_amount` integer DEFAULT 0 NOT NULL,
	`buyer_id` text NOT NULL,
	`buyer_name` text NOT NULL,
	`buyer_address_line_1` text NOT NULL,
	`buyer_address_line_2` text,
	`buyer_address_line_3` text,
	`buyer_city` text NOT NULL,
	`buyer_state` text NOT NULL,
	`buyer_country` text DEFAULT 'India' NOT NULL,
	`buyer_pincode` text NOT NULL,
	`buyer_gstin` text NOT NULL,
	`buyer_mobile_number` text,
	`buyer_email_address` text,
	`buyer_drug_license_number` text,
	`buyer_state_code` text,
	`notes` text,
	`terms_and_conditions` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `stent_invoice_invoice_number_unique` ON `stent_invoice` (`invoice_number`);--> statement-breakpoint
CREATE INDEX `stent_invoice_number_idx` ON `stent_invoice` (`invoice_number`);--> statement-breakpoint
CREATE INDEX `stent_invoice_buyer_id_idx` ON `stent_invoice` (`buyer_id`);--> statement-breakpoint
CREATE INDEX `stent_invoice_status_idx` ON `stent_invoice` (`status`);--> statement-breakpoint
CREATE INDEX `stent_invoice_date_idx` ON `stent_invoice` (`invoice_date`);--> statement-breakpoint
CREATE TABLE `stent_invoice_line_item` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_id` text NOT NULL,
	`product_id` text NOT NULL,
	`product_name` text NOT NULL,
	`hsn_code` text NOT NULL,
	`patient_name` text NOT NULL,
	`patient_age` integer NOT NULL,
	`patient_gender` text NOT NULL,
	`rate` integer NOT NULL,
	`gst_percentage` real NOT NULL,
	`base_amount` integer DEFAULT 0 NOT NULL,
	`tax_amount` integer DEFAULT 0 NOT NULL,
	`total_amount` integer DEFAULT 0 NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `stent_line_item_invoice_id_idx` ON `stent_invoice_line_item` (`invoice_id`);--> statement-breakpoint
CREATE INDEX `stent_line_item_product_id_idx` ON `stent_invoice_line_item` (`product_id`);--> statement-breakpoint
CREATE INDEX `stent_line_item_sort_order_idx` ON `stent_invoice_line_item` (`sort_order`);--> statement-breakpoint
CREATE TABLE `stent_invoice_line_item_size` (
	`id` text PRIMARY KEY NOT NULL,
	`line_item_id` text NOT NULL,
	`size_dimension` text NOT NULL,
	`serial_number` text NOT NULL,
	`expiry_date` text,
	`quantity` integer DEFAULT 1 NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `stent_size_line_item_id_idx` ON `stent_invoice_line_item_size` (`line_item_id`);--> statement-breakpoint
CREATE INDEX `stent_size_sort_order_idx` ON `stent_invoice_line_item_size` (`sort_order`);