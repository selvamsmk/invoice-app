CREATE TABLE `invoice_document_archive` (
	`id` text PRIMARY KEY NOT NULL,
	`document_id` text NOT NULL,
	`document_type` text NOT NULL,
	`document_number` text NOT NULL,
	`buyer_name` text NOT NULL,
	`document_date` text NOT NULL,
	`canonical_file_path` text NOT NULL,
	`linked_paths` text DEFAULT '[]' NOT NULL,
	`last_updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `invoice_doc_archive_doc_idx` ON `invoice_document_archive` (`document_type`,`document_id`);--> statement-breakpoint
CREATE INDEX `invoice_doc_archive_number_idx` ON `invoice_document_archive` (`document_number`);