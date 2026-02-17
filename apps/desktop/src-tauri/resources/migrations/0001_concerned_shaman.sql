CREATE TABLE `app_seeds` (
	`id` text PRIMARY KEY NOT NULL,
	`seed_key` text NOT NULL,
	`applied` integer DEFAULT false NOT NULL,
	`applied_at` text,
	`checksum` text,
	`notes` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `app_seeds_seed_key_unique` ON `app_seeds` (`seed_key`);