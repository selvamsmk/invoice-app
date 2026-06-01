import {
	and,
	db,
	eq,
	invoiceDocumentArchive,
} from "@invoice-app/db";
import type { ArchiveDocumentType } from "./invoice-archive";

type ArchiveMetadataInsert = {
	documentId: string;
	documentType: ArchiveDocumentType;
	documentNumber: string;
	buyerName: string;
	documentDate: string;
	canonicalFilePath: string;
	linkedPaths: string[];
};

export async function getArchiveMetadataByDocument(
	documentType: ArchiveDocumentType,
	documentId: string,
) {
	const [row] = await db
		.select()
		.from(invoiceDocumentArchive)
		.where(
			and(
				eq(invoiceDocumentArchive.documentType, documentType),
				eq(invoiceDocumentArchive.documentId, documentId),
			),
		)
		.limit(1);
	return row ?? null;
}

export async function upsertArchiveMetadata(input: ArchiveMetadataInsert) {
	const nowIso = new Date().toISOString();
	const id = `${input.documentType}:${input.documentId}`;

	await db
		.insert(invoiceDocumentArchive)
		.values({
			id,
			documentId: input.documentId,
			documentType: input.documentType,
			documentNumber: input.documentNumber,
			buyerName: input.buyerName,
			documentDate: input.documentDate,
			canonicalFilePath: input.canonicalFilePath,
			linkedPaths: JSON.stringify(input.linkedPaths),
			lastUpdatedAt: nowIso,
		})
		.onConflictDoUpdate({
			target: invoiceDocumentArchive.id,
			set: {
				documentNumber: input.documentNumber,
				buyerName: input.buyerName,
				documentDate: input.documentDate,
				canonicalFilePath: input.canonicalFilePath,
				linkedPaths: JSON.stringify(input.linkedPaths),
				lastUpdatedAt: nowIso,
			},
		});
}

export async function deleteArchiveMetadata(
	documentType: ArchiveDocumentType,
	documentId: string,
) {
	await db
		.delete(invoiceDocumentArchive)
		.where(
			and(
				eq(invoiceDocumentArchive.documentType, documentType),
				eq(invoiceDocumentArchive.documentId, documentId),
			),
		);
}

export async function listArchiveMetadata() {
	return db.select().from(invoiceDocumentArchive);
}

export function parseLinkedPaths(raw: string | null | undefined): string[] {
	if (!raw) return [];
	try {
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed.filter((entry): entry is string => typeof entry === "string");
	} catch {
		return [];
	}
}
