CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);--> statement-breakpoint
CREATE TABLE `buyer` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`address_line_1` text NOT NULL,
	`address_line_2` text,
	`address_line_3` text,
	`city` text NOT NULL,
	`state` text NOT NULL,
	`country` text DEFAULT 'India' NOT NULL,
	`pincode` text NOT NULL,
	`gstin` text,
	`mobile_number` text,
	`email_address` text,
	`drug_license_number` text,
	`state_code` text,
	`total_invoices` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `buyer_gstin_idx` ON `buyer` (`gstin`);--> statement-breakpoint
CREATE TABLE `company` (
	`id` text PRIMARY KEY NOT NULL,
	`company_name` text NOT NULL,
	`address_line_1` text NOT NULL,
	`address_line_2` text,
	`address_line_3` text,
	`city` text NOT NULL,
	`state` text NOT NULL,
	`country` text DEFAULT 'India' NOT NULL,
	`pincode` text NOT NULL,
	`gstin` text NOT NULL,
	`drug_license_number` text,
	`phone_number` text,
	`email_address` text,
	`bank_account_number` text,
	`ifsc_code` text,
	`bank_name` text,
	`branch` text,
	`logo_url` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `company_gstin_idx` ON `company` (`gstin`);--> statement-breakpoint
CREATE INDEX `company_name_idx` ON `company` (`company_name`);--> statement-breakpoint
CREATE TABLE `invoice` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_number` text NOT NULL,
	`invoice_type` text DEFAULT 'TAX INVOICE' NOT NULL,
	`invoice_date` text NOT NULL,
	`due_date` text,
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
CREATE UNIQUE INDEX `invoice_invoice_number_unique` ON `invoice` (`invoice_number`);--> statement-breakpoint
CREATE INDEX `invoice_number_idx` ON `invoice` (`invoice_number`);--> statement-breakpoint
CREATE INDEX `invoice_buyer_id_idx` ON `invoice` (`buyer_id`);--> statement-breakpoint
CREATE INDEX `invoice_status_idx` ON `invoice` (`status`);--> statement-breakpoint
CREATE INDEX `invoice_date_idx` ON `invoice` (`invoice_date`);--> statement-breakpoint
CREATE TABLE `invoice_line_item` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_id` text NOT NULL,
	`product_id` text NOT NULL,
	`product_name` text NOT NULL,
	`hsn_code` text NOT NULL,
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
CREATE INDEX `invoice_line_item_invoice_id_idx` ON `invoice_line_item` (`invoice_id`);--> statement-breakpoint
CREATE INDEX `invoice_line_item_product_id_idx` ON `invoice_line_item` (`product_id`);--> statement-breakpoint
CREATE INDEX `invoice_line_item_sort_order_idx` ON `invoice_line_item` (`sort_order`);--> statement-breakpoint
CREATE TABLE `invoice_line_item_batch` (
	`id` text PRIMARY KEY NOT NULL,
	`line_item_id` text NOT NULL,
	`batch_no` text,
	`expiry_date` text,
	`quantity` integer DEFAULT 1 NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `invoice_batch_line_item_id_idx` ON `invoice_line_item_batch` (`line_item_id`);--> statement-breakpoint
CREATE INDEX `invoice_batch_sort_order_idx` ON `invoice_line_item_batch` (`sort_order`);--> statement-breakpoint
CREATE TABLE `product` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`default_rate` real NOT NULL,
	`hsn_code` text NOT NULL,
	`gst_percentage` real NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `product_hsn_code_idx` ON `product` (`hsn_code`);--> statement-breakpoint
CREATE INDEX `product_name_idx` ON `product` (`name`);