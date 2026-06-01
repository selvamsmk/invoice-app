import { sql } from "drizzle-orm";
import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const invoiceDocumentArchive = sqliteTable(
	"invoice_document_archive",
	{
		id: text("id").primaryKey(),
		documentId: text("document_id").notNull(),
		documentType: text("document_type").notNull(),
		documentNumber: text("document_number").notNull(),
		buyerName: text("buyer_name").notNull(),
		documentDate: text("document_date").notNull(),
		canonicalFilePath: text("canonical_file_path").notNull(),
		linkedPaths: text("linked_paths").notNull().default("[]"),
		lastUpdatedAt: text("last_updated_at")
			.notNull()
			.default(sql`CURRENT_TIMESTAMP`),
	},
	(table) => [
		index("invoice_doc_archive_doc_idx").on(table.documentType, table.documentId),
		index("invoice_doc_archive_number_idx").on(table.documentNumber),
	],
);
