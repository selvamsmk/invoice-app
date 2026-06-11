import { appSettings, db, eq } from "@invoice-app/db";
import { z } from "zod";
import { publicProcedure } from "../index";
import renderInvoicePdf, {
	renderDeliveryChallanPdf,
	renderStentInvoicePdf,
} from "../pdf-render";
import {
	getConfiguredArchiveRoot,
	invoiceExportDirKey,
} from "../utils/archive-root";
import { mapDeliveryChallanDataToChallanProps } from "../utils/dbToDeliveryChallanProps";
import { mapInvoiceDataToInvoiceProps } from "../utils/dbToInvoiceProps";
import { mapStentInvoiceDataToInvoiceProps } from "../utils/dbToStentInvoiceProps";
import {
	archivePdfWithHardLinks,
	validateHardLinkIntegrity,
} from "../utils/invoice-archive";
import {
	getArchiveMetadataByDocument,
	listArchiveMetadata,
	parseLinkedPaths,
	upsertArchiveMetadata,
} from "../utils/invoice-archive-metadata";
import streamToBase64 from "../utils/streamToBase64";

async function ensurePdfBuffer(bufferOrStream: unknown): Promise<Buffer> {
	if (Buffer.isBuffer(bufferOrStream)) {
		return bufferOrStream;
	}

	const base64 = await streamToBase64(bufferOrStream as any);
	return Buffer.from(base64, "base64");
}

async function syncInvoiceArchives(
	archiveRoot: string | null,
	companyData: unknown,
) {
	const invoices = await db.query.invoice.findMany({
		with: {
			buyer: true,
			lineItems: {
				with: {
					product: true,
					batches: true,
				},
				orderBy: (lineItem, { asc }) => [asc(lineItem.sortOrder)],
			},
		},
	});

	for (const invoiceData of invoices) {
		const metadata = await getArchiveMetadataByDocument(
			"invoice",
			invoiceData.id,
		);
		const bufferOrStream = await renderInvoicePdf(
			mapInvoiceDataToInvoiceProps(invoiceData),
			companyData ?? undefined,
		);
		const archiveResult = await archivePdfWithHardLinks(
			{
				documentId: invoiceData.id,
				documentType: "invoice",
				documentNumber: invoiceData.invoiceNumber,
				buyerName: invoiceData.buyerName,
				documentDate: invoiceData.invoiceDate,
				existingCanonicalPath: metadata?.canonicalFilePath,
				previousLinkedPaths: parseLinkedPaths(metadata?.linkedPaths),
			},
			await ensurePdfBuffer(bufferOrStream),
			{ archiveRoot: archiveRoot ?? undefined },
		);

		await upsertArchiveMetadata({
			documentId: invoiceData.id,
			documentType: "invoice",
			documentNumber: invoiceData.invoiceNumber,
			buyerName: invoiceData.buyerName,
			documentDate: invoiceData.invoiceDate,
			canonicalFilePath: archiveResult.canonicalPath,
			linkedPaths: archiveResult.linkedPaths,
		});
	}

	return invoices.length;
}

async function syncStentInvoiceArchives(
	archiveRoot: string | null,
	companyData: unknown,
) {
	const invoices = await db.query.stentInvoice.findMany({
		with: {
			buyer: true,
			lineItems: {
				with: {
					product: true,
					sizes: true,
				},
				orderBy: (lineItem, { asc }) => [asc(lineItem.sortOrder)],
			},
		},
	});

	for (const invoiceData of invoices) {
		const metadata = await getArchiveMetadataByDocument(
			"stent-invoice",
			invoiceData.id,
		);
		const bufferOrStream = await renderStentInvoicePdf(
			mapStentInvoiceDataToInvoiceProps(invoiceData),
			companyData ?? undefined,
		);
		const archiveResult = await archivePdfWithHardLinks(
			{
				documentId: invoiceData.id,
				documentType: "stent-invoice",
				documentNumber: invoiceData.invoiceNumber,
				buyerName: invoiceData.buyerName,
				documentDate: invoiceData.invoiceDate,
				existingCanonicalPath: metadata?.canonicalFilePath,
				previousLinkedPaths: parseLinkedPaths(metadata?.linkedPaths),
			},
			await ensurePdfBuffer(bufferOrStream),
			{ archiveRoot: archiveRoot ?? undefined },
		);

		await upsertArchiveMetadata({
			documentId: invoiceData.id,
			documentType: "stent-invoice",
			documentNumber: invoiceData.invoiceNumber,
			buyerName: invoiceData.buyerName,
			documentDate: invoiceData.invoiceDate,
			canonicalFilePath: archiveResult.canonicalPath,
			linkedPaths: archiveResult.linkedPaths,
		});
	}

	return invoices.length;
}

async function syncDeliveryChallanArchives(
	archiveRoot: string | null,
	companyData: unknown,
) {
	const challans = await db.query.deliveryChallan.findMany({
		with: {
			buyer: true,
			lineItems: {
				with: {
					product: true,
					batches: true,
				},
				orderBy: (lineItem, { asc }) => [asc(lineItem.sortOrder)],
			},
		},
	});

	for (const challanData of challans) {
		const metadata = await getArchiveMetadataByDocument(
			"delivery-challan",
			challanData.id,
		);
		const bufferOrStream = await renderDeliveryChallanPdf(
			mapDeliveryChallanDataToChallanProps(challanData),
			companyData ?? undefined,
		);
		const archiveResult = await archivePdfWithHardLinks(
			{
				documentId: challanData.id,
				documentType: "delivery-challan",
				documentNumber: challanData.challanNumber,
				buyerName: challanData.buyerName,
				documentDate: challanData.challanDate,
				existingCanonicalPath: metadata?.canonicalFilePath,
				previousLinkedPaths: parseLinkedPaths(metadata?.linkedPaths),
			},
			await ensurePdfBuffer(bufferOrStream),
			{ archiveRoot: archiveRoot ?? undefined },
		);

		await upsertArchiveMetadata({
			documentId: challanData.id,
			documentType: "delivery-challan",
			documentNumber: challanData.challanNumber,
			buyerName: challanData.buyerName,
			documentDate: challanData.challanDate,
			canonicalFilePath: archiveResult.canonicalPath,
			linkedPaths: archiveResult.linkedPaths,
		});
	}

	return challans.length;
}

export const settingsRouter = {
	getInvoiceExportDir: publicProcedure.handler(async () => {
		const setting = await db.query.appSettings.findFirst({
			where: eq(appSettings.key, invoiceExportDirKey),
		});

		return {
			success: true,
			key: invoiceExportDirKey,
			value: setting?.value ?? null,
		};
	}),

	setInvoiceExportDir: publicProcedure
		.input(
			z.object({
				path: z.string().min(1),
			}),
		)
		.handler(async ({ input }) => {
			const normalizedPath = input.path.trim();

			const existingSetting = await db.query.appSettings.findFirst({
				where: eq(appSettings.key, invoiceExportDirKey),
			});

			if (existingSetting) {
				await db
					.update(appSettings)
					.set({
						value: normalizedPath,
						updatedAt: new Date(),
					})
					.where(eq(appSettings.key, invoiceExportDirKey));
			} else {
				await db.insert(appSettings).values({
					id: crypto.randomUUID(),
					key: invoiceExportDirKey,
					value: normalizedPath,
				});
			}

			return {
				success: true,
				key: invoiceExportDirKey,
				value: normalizedPath,
			};
		}),

	getArchiveIntegrityStatus: publicProcedure.handler(async () => {
		const archiveRoot = await getConfiguredArchiveRoot();
		const rows = await listArchiveMetadata();

		let healthyDocuments = 0;
		let missingCanonicalCount = 0;
		let missingLinksCount = 0;
		let mismatchedLinksCount = 0;

		const items = [] as Array<{
			documentId: string;
			documentType: string;
			documentNumber: string;
			buyerName: string;
			documentDate: string;
			canonicalFilePath: string;
			expectedLinkCount: number;
			missingPathCount: number;
			mismatchedPathCount: number;
			isHealthy: boolean;
			lastUpdatedAt: string;
		}>;

		for (const row of rows) {
			const expectedLinkedPaths = parseLinkedPaths(row.linkedPaths);
			const integrity = await validateHardLinkIntegrity(
				row.canonicalFilePath,
				expectedLinkedPaths,
			);

			const missingCanonical = integrity.missingPaths.includes(
				row.canonicalFilePath,
			);
			const missingLinks = integrity.missingPaths.filter(
				(missingPath) => missingPath !== row.canonicalFilePath,
			);

			if (missingCanonical) {
				missingCanonicalCount += 1;
			}
			missingLinksCount += missingLinks.length;
			mismatchedLinksCount += integrity.mismatchedPaths.length;

			if (integrity.allLinked) {
				healthyDocuments += 1;
			}

			items.push({
				documentId: row.documentId,
				documentType: row.documentType,
				documentNumber: row.documentNumber,
				buyerName: row.buyerName,
				documentDate: row.documentDate,
				canonicalFilePath: row.canonicalFilePath,
				expectedLinkCount: expectedLinkedPaths.length,
				missingPathCount: integrity.missingPaths.length,
				mismatchedPathCount: integrity.mismatchedPaths.length,
				isHealthy: integrity.allLinked,
				lastUpdatedAt: row.lastUpdatedAt,
			});
		}

		const issuesCount = rows.length - healthyDocuments;

		return {
			success: true,
			archiveRoot,
			totalDocuments: rows.length,
			healthyDocuments,
			issuesCount,
			missingCanonicalCount,
			missingLinksCount,
			mismatchedLinksCount,
			items,
		};
	}),

	syncAllArchiveDocuments: publicProcedure.handler(async () => {
		const archiveRoot = await getConfiguredArchiveRoot();
		const companyData = await db.query.company.findFirst();
		const invoiceCount = await syncInvoiceArchives(archiveRoot, companyData);
		const stentInvoiceCount = await syncStentInvoiceArchives(
			archiveRoot,
			companyData,
		);
		const deliveryChallanCount = await syncDeliveryChallanArchives(
			archiveRoot,
			companyData,
		);

		return {
			success: true,
			archiveRoot,
			invoiceCount,
			stentInvoiceCount,
			deliveryChallanCount,
			totalSynced: invoiceCount + stentInvoiceCount + deliveryChallanCount,
		};
	}),
};

export default settingsRouter;
