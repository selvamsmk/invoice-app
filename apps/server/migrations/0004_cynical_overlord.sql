CREATE TABLE `delivery_challan` (
	`id` text PRIMARY KEY NOT NULL,
	`challan_number` text NOT NULL,
	`challan_date` text NOT NULL,
	`dc_date` text,
	`dc_number` text,
	`dispatched_through` text,
	`status` text DEFAULT 'Draft' NOT NULL,
	`is_finalized` integer DEFAULT false NOT NULL,
	`buyer_id` text NOT NULL,
	`buyer_name` text NOT NULL,
	`buyer_address_line_1` text NOT NULL,
	`buyer_address_line_2` text,
	`buyer_address_line_3` text,
	`buyer_city` text NOT NULL,
	`buyer_state` text NOT NULL,
	`buyer_country` text DEFAULT 'India' NOT NULL,
	`buyer_pincode` text NOT NULL,
	`buyer_gstin` text,
	`buyer_mobile_number` text,
	`buyer_email_address` text,
	`buyer_drug_license_number` text,
	`buyer_state_code` text,
	`notes` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `delivery_challan_challan_number_unique` ON `delivery_challan` (`challan_number`);--> statement-breakpoint
CREATE INDEX `delivery_challan_number_idx` ON `delivery_challan` (`challan_number`);--> statement-breakpoint
CREATE INDEX `delivery_challan_buyer_id_idx` ON `delivery_challan` (`buyer_id`);--> statement-breakpoint
CREATE INDEX `delivery_challan_status_idx` ON `delivery_challan` (`status`);--> statement-breakpoint
CREATE INDEX `delivery_challan_date_idx` ON `delivery_challan` (`challan_date`);--> statement-breakpoint
CREATE TABLE `delivery_challan_line_item` (
	`id` text PRIMARY KEY NOT NULL,
	`challan_id` text NOT NULL,
	`product_id` text NOT NULL,
	`product_name` text NOT NULL,
	`hsn_code` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `delivery_challan_line_item_challan_id_idx` ON `delivery_challan_line_item` (`challan_id`);--> statement-breakpoint
CREATE INDEX `delivery_challan_line_item_product_id_idx` ON `delivery_challan_line_item` (`product_id`);--> statement-breakpoint
CREATE INDEX `delivery_challan_line_item_sort_order_idx` ON `delivery_challan_line_item` (`sort_order`);--> statement-breakpoint
CREATE TABLE `delivery_challan_line_item_batch` (
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
CREATE INDEX `delivery_challan_batch_line_item_id_idx` ON `delivery_challan_line_item_batch` (`line_item_id`);--> statement-breakpoint
CREATE INDEX `delivery_challan_batch_sort_order_idx` ON `delivery_challan_line_item_batch` (`sort_order`);