ALTER TABLE `delivery_challan`
ADD `show_sign` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `delivery_challan`
ADD `show_seal` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `stent_invoice`
ADD `show_sign` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `stent_invoice`
ADD `show_seal` integer DEFAULT 0 NOT NULL;