import {
	and,
	db,
	eq,
	invoice,
	invoiceDocumentArchive,
	invoiceLineItem,
	invoiceLineItemBatch,
} from "@invoice-app/db";
import { z } from "zod";
import { publicProcedure } from "../index";
import renderInvoicePdf from "../pdf-render";
import {
	archivePdfWithHardLinks,
	deleteArchivedPdf,
	rebuildArchiveViews,
	validateHardLinkIntegrity,
} from "../utils/invoice-archive";
import {
	deleteArchiveMetadata,
	getArchiveMetadataByDocument,
	listArchiveMetadata,
	parseLinkedPaths,
	upsertArchiveMetadata,
} from "../utils/invoice-archive-metadata";
import { getConfiguredArchiveRoot } from "../utils/archive-root";
import { mapInvoiceDataToInvoiceProps } from "../utils/dbToInvoiceProps";
import streamToBase64 from "../utils/streamToBase64";

export const invoicesRouter = {
	listInvoices: publicProcedure.handler(async () => {
		const invoices = await db.query.invoice.findMany({
			with: {
				buyer: true,
				lineItems: {
					with: {
						product: true,
						batches: true,
					},
				},
			},
			orderBy: (invoice, { desc }) => [desc(invoice.createdAt)],
		});
		return invoices;
	}),

	getInvoice: publicProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ input }) => {
			const invoiceData = await db.query.invoice.findFirst({
				where: eq(invoice.id, input.id),
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
			return invoiceData;
		}),

	renderPDF: publicProcedure
		.input(
			z.object({
				id: z.string(),
				archiveOnRender: z.boolean().optional(),
			}),
		)
		.handler(async ({ input }) => {
			// Load invoice with related data (buyer, line items, product, batches)
			const invoiceData = await db.query.invoice.findFirst({
				where: eq(invoice.id, input.id),
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

			if (!invoiceData) throw new Error("Invoice not found");

			// Load company data (use first/only company row)
			const companyData = await db.query.company.findFirst();

			// Map DB invoice data into `InvoiceProps` for PDF renderer
			const selectedInvoiceForPdf = mapInvoiceDataToInvoiceProps(invoiceData);

			// Render PDF buffer and return as base64 string (safely serializable over RPC)
			const bufferOrStream = await renderInvoicePdf(
				selectedInvoiceForPdf,
				companyData ?? undefined,
			);
			// If we received a Buffer, convert directly; otherwise treat as a stream
			let base64: string;
			let pdfBuffer: Buffer;
			if (Buffer.isBuffer(bufferOrStream)) {
				pdfBuffer = bufferOrStream as Buffer;
				base64 = pdfBuffer.toString("base64");
			} else {
				base64 = await streamToBase64(bufferOrStream as any);
				pdfBuffer = Buffer.from(base64, "base64");
			}

			if (input.archiveOnRender) {
				const archiveRoot = await getConfiguredArchiveRoot();
				const metadata = await getArchiveMetadataByDocument("invoice", input.id);
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
					pdfBuffer,
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
			return { pdfBase64: base64 };
		}),

	createInvoice: publicProcedure
		.input(
			z.object({
				invoiceNumber: z.string().min(1),
				invoiceType: z.string().default("TAX INVOICE"),
				invoiceDate: z.string(),
				dueDate: z.string().optional(),
				dcDate: z.string().optional(),
				dcNumber: z.string().optional(),
				dispatchedThrough: z.string().optional(),
				status: z.string().default("Draft"),
				isFinalized: z.boolean().default(false),
				showSign: z.boolean().default(false),
				showSeal: z.boolean().default(false),
				subtotalAmount: z.number().default(0),
				taxAmount: z.number().default(0),
				totalAmount: z.number().default(0),
				buyerId: z.string(),
				buyerName: z.string().min(1),
				buyerAddressLine1: z.string().min(1),
				buyerAddressLine2: z.string().optional(),
				buyerAddressLine3: z.string().optional(),
				buyerCity: z.string().min(1),
				buyerState: z.string().min(1),
				buyerCountry: z.string().default("India"),
				buyerPincode: z.string().regex(/^\d{6}$/),
				buyerGstin: z.string().optional(),
				buyerMobileNumber: z.string().optional(),
				buyerEmailAddress: z.string().optional(),
				buyerDrugLicenseNumber: z.string().optional(),
				buyerStateCode: z.string().optional(),
				notes: z.string().optional(),
				termsAndConditions: z.string().optional(),
				lineItems: z.array(
					z.object({
						productId: z.string(),
						productName: z.string().min(1),
						hsnCode: z.string().min(1),
						rate: z.number().positive(),
						gstPercentage: z.number().min(0).max(100),
						baseAmount: z.number().default(0),
						taxAmount: z.number().default(0),
						totalAmount: z.number().default(0),
						sortOrder: z.number().default(0),
						batches: z.array(
							z.object({
								batchNo: z.string().optional(),
								expiryDate: z.string().optional(),
								quantity: z.number().positive().default(1),
								sortOrder: z.number().default(0),
							}),
						),
					}),
				),
			}),
		)
		.handler(async ({ input }) => {
			const result = await db
				.insert(invoice)
				.values({
					id: Date.now().toString(),
					invoiceNumber: input.invoiceNumber,
					invoiceType: input.invoiceType,
					invoiceDate: input.invoiceDate,
					dueDate: input.dueDate ?? null,
					dcDate: input.dcDate ?? null,
					dcNumber: input.dcNumber ?? null,
					dispatchedThrough: input.dispatchedThrough ?? null,
					status: input.status,
					isFinalized: input.isFinalized,
					showSign: input.showSign,
					showSeal: input.showSeal,
					subtotalAmount: input.subtotalAmount,
					taxAmount: input.taxAmount,
					totalAmount: input.totalAmount,
					buyerId: input.buyerId,
					buyerName: input.buyerName,
					buyerAddressLine1: input.buyerAddressLine1,
					buyerAddressLine2: input.buyerAddressLine2 || null,
					buyerAddressLine3: input.buyerAddressLine3 || null,
					buyerCity: input.buyerCity,
					buyerState: input.buyerState,
					buyerCountry: input.buyerCountry,
					buyerPincode: input.buyerPincode,
					buyerGstin: input.buyerGstin ?? "",
					buyerMobileNumber: input.buyerMobileNumber || null,
					buyerEmailAddress: input.buyerEmailAddress || null,
					buyerDrugLicenseNumber: input.buyerDrugLicenseNumber || null,
					buyerStateCode: input.buyerStateCode || null,
					notes: input.notes || null,
					termsAndConditions: input.termsAndConditions || null,
				})
				.returning();

			const newInvoice = result[0];
			if (!newInvoice) throw new Error("Failed to create invoice");

			// Create line items and batches
			for (const [lineIndex, lineItem] of input.lineItems.entries()) {
				const lineResult = await db
					.insert(invoiceLineItem)
					.values({
						id: `${newInvoice.id}-line-${Date.now()}-${lineIndex}`,
						invoiceId: newInvoice.id,
						productId: lineItem.productId,
						productName: lineItem.productName,
						hsnCode: lineItem.hsnCode,
						rate: lineItem.rate,
						gstPercentage: lineItem.gstPercentage,
						baseAmount: lineItem.baseAmount,
						taxAmount: lineItem.taxAmount,
						totalAmount: lineItem.totalAmount,
						sortOrder: lineItem.sortOrder,
					})
					.returning();

				const newLineItem = lineResult[0];
				if (!newLineItem) throw new Error("Failed to create line item");

				for (const [batchIndex, batch] of lineItem.batches.entries()) {
					await db.insert(invoiceLineItemBatch).values({
						id: `${newLineItem.id}-batch-${Date.now()}-${batchIndex}`,
						lineItemId: newLineItem.id,
						batchNo: batch.batchNo || null,
						expiryDate: batch.expiryDate || null,
						quantity: batch.quantity,
						sortOrder: batch.sortOrder,
					});
				}
			}

			return newInvoice;
		}),

	updateInvoice: publicProcedure
		.input(
			z.object({
				id: z.string(),
				invoiceNumber: z.string().min(1),
				invoiceType: z.string().default("TAX INVOICE"),
				invoiceDate: z.string(),
				dueDate: z.string().optional(),
				dcDate: z.string().optional(),
				dcNumber: z.string().optional(),
				dispatchedThrough: z.string().optional(),
				status: z.string().default("Draft"),
				isFinalized: z.boolean().default(false),
				showSign: z.boolean().default(false),
				showSeal: z.boolean().default(false),
				subtotalAmount: z.number().default(0),
				taxAmount: z.number().default(0),
				totalAmount: z.number().default(0),
				buyerId: z.string(),
				buyerName: z.string().min(1),
				buyerAddressLine1: z.string().min(1),
				buyerAddressLine2: z.string().optional(),
				buyerAddressLine3: z.string().optional(),
				buyerCity: z.string().min(1),
				buyerState: z.string().min(1),
				buyerCountry: z.string().default("India"),
				buyerPincode: z.string().regex(/^\d{6}$/),
				buyerGstin: z.string().optional(),
				buyerMobileNumber: z.string().optional(),
				buyerEmailAddress: z.string().optional(),
				buyerDrugLicenseNumber: z.string().optional(),
				buyerStateCode: z.string().optional(),
				notes: z.string().optional(),
				termsAndConditions: z.string().optional(),
				lineItems: z.array(
					z.object({
						id: z.string().optional(),
						productId: z.string(),
						productName: z.string().min(1),
						hsnCode: z.string().min(1),
						rate: z.number().positive(),
						gstPercentage: z.number().min(0).max(100),
						baseAmount: z.number().default(0),
						taxAmount: z.number().default(0),
						totalAmount: z.number().default(0),
						sortOrder: z.number().default(0),
						batches: z.array(
							z.object({
								id: z.string().optional(),
								batchNo: z.string().optional(),
								expiryDate: z.string().optional(),
								quantity: z.number().positive().default(1),
								sortOrder: z.number().default(0),
							}),
						),
					}),
				),
			}),
		)
		.handler(async ({ input }) => {
			const updateResult = await db
				.update(invoice)
				.set({
					invoiceNumber: input.invoiceNumber,
					invoiceType: input.invoiceType,
					invoiceDate: input.invoiceDate,
					dueDate: input.dueDate ?? null,
					dcDate: input.dcDate ?? null,
					dcNumber: input.dcNumber ?? null,
					dispatchedThrough: input.dispatchedThrough ?? null,
					status: input.status,
					isFinalized: input.isFinalized,
					showSign: input.showSign,
					showSeal: input.showSeal,
					subtotalAmount: input.subtotalAmount,
					taxAmount: input.taxAmount,
					totalAmount: input.totalAmount,
					buyerId: input.buyerId,
					buyerName: input.buyerName,
					buyerAddressLine1: input.buyerAddressLine1,
					buyerAddressLine2: input.buyerAddressLine2 || null,
					buyerAddressLine3: input.buyerAddressLine3 || null,
					buyerCity: input.buyerCity,
					buyerState: input.buyerState,
					buyerCountry: input.buyerCountry,
					buyerPincode: input.buyerPincode,
					buyerGstin: input.buyerGstin ?? "",
					buyerMobileNumber: input.buyerMobileNumber || null,
					buyerEmailAddress: input.buyerEmailAddress || null,
					buyerDrugLicenseNumber: input.buyerDrugLicenseNumber || null,
					buyerStateCode: input.buyerStateCode || null,
					notes: input.notes || null,
					termsAndConditions: input.termsAndConditions || null,
					updatedAt: new Date(),
				})
				.where(eq(invoice.id, input.id))
				.returning();

			const updatedInvoice = updateResult[0];
			if (!updatedInvoice) throw new Error("Failed to update invoice");

			// Delete existing line items and batches (cascade will handle batches)
			await db
				.delete(invoiceLineItem)
				.where(eq(invoiceLineItem.invoiceId, input.id));

			// Recreate line items and batches
			for (const [lineIndex, lineItem] of input.lineItems.entries()) {
				const updateLineResult = await db
					.insert(invoiceLineItem)
					.values({
						id:
							lineItem.id ||
							`${updatedInvoice.id}-line-${Date.now()}-${lineIndex}`,
						invoiceId: updatedInvoice.id,
						productId: lineItem.productId,
						productName: lineItem.productName,
						hsnCode: lineItem.hsnCode,
						rate: lineItem.rate,
						gstPercentage: lineItem.gstPercentage,
						baseAmount: lineItem.baseAmount,
						taxAmount: lineItem.taxAmount,
						totalAmount: lineItem.totalAmount,
						sortOrder: lineItem.sortOrder,
					})
					.returning();

				const newLineItem = updateLineResult[0];
				if (!newLineItem) throw new Error("Failed to create line item");

				for (const [batchIndex, batch] of lineItem.batches.entries()) {
					await db.insert(invoiceLineItemBatch).values({
						id:
							batch.id || `${newLineItem.id}-batch-${Date.now()}-${batchIndex}`,
						lineItemId: newLineItem.id,
						batchNo: batch.batchNo || null,
						expiryDate: batch.expiryDate || null,
						quantity: batch.quantity,
						sortOrder: batch.sortOrder,
					});
				}
			}

			return updatedInvoice;
		}),

	checkArchiveIntegrity: publicProcedure
		.input(
			z.object({
				documentType: z.enum(["invoice", "stent-invoice", "delivery-challan"]),
				documentId: z.string(),
			}),
		)
		.handler(async ({ input }) => {
			const metadata = await getArchiveMetadataByDocument(
				input.documentType,
				input.documentId,
			);
			if (!metadata) {
				return { found: false };
			}

			const integrity = await validateHardLinkIntegrity(
				metadata.canonicalFilePath,
				parseLinkedPaths(metadata.linkedPaths),
			);
			return { found: true, integrity };
		}),

	rebuildArchiveViews: publicProcedure.handler(async () => {
		const archiveRoot = await getConfiguredArchiveRoot();
		const rows = await listArchiveMetadata();
		const rebuildResults = await rebuildArchiveViews(
			rows.map((row) => ({
				documentId: row.documentId,
				documentType: row.documentType as
					| "invoice"
					| "stent-invoice"
					| "delivery-challan",
				documentNumber: row.documentNumber,
				buyerName: row.buyerName,
				documentDate: row.documentDate,
				canonicalFilePath: row.canonicalFilePath,
			})),
			{ archiveRoot: archiveRoot ?? undefined },
		);

		for (const rebuilt of rebuildResults) {
			await db
				.update(invoiceDocumentArchive)
				.set({
					linkedPaths: JSON.stringify(rebuilt.linkedPaths),
					lastUpdatedAt: new Date().toISOString(),
				})
				.where(
					and(
						eq(invoiceDocumentArchive.documentType, rebuilt.documentType),
						eq(invoiceDocumentArchive.documentId, rebuilt.documentId),
					),
				);
		}

		return {
			rebuiltCount: rebuildResults.length,
		};
	}),

	deleteInvoice: publicProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ input }) => {
			const archiveMetadata = await getArchiveMetadataByDocument(
				"invoice",
				input.id,
			);

			const lineItems = await db
				.select({ id: invoiceLineItem.id })
				.from(invoiceLineItem)
				.where(eq(invoiceLineItem.invoiceId, input.id));
			for (const lineItem of lineItems) {
				await db
					.delete(invoiceLineItemBatch)
					.where(eq(invoiceLineItemBatch.lineItemId, lineItem.id));
			}

			await db
				.delete(invoiceLineItem)
				.where(eq(invoiceLineItem.invoiceId, input.id));

			const [deletedInvoice] = await db
				.delete(invoice)
				.where(eq(invoice.id, input.id))
				.returning();

			if (archiveMetadata) {
				await deleteArchivedPdf(
					archiveMetadata.canonicalFilePath,
					parseLinkedPaths(archiveMetadata.linkedPaths),
				);
				await deleteArchiveMetadata("invoice", input.id);
			}

			return deletedInvoice;
		}),
};

export default invoicesRouter;
