import {
	db,
	eq,
	stentInvoice,
	stentInvoiceLineItem,
	stentInvoiceLineItemSize,
} from "@invoice-app/db";
import { z } from "zod";
import { publicProcedure } from "../index";
import { renderStentInvoicePdf } from "../pdf-render";
import { mapStentInvoiceDataToInvoiceProps } from "../utils/dbToStentInvoiceProps";
import streamToBase64 from "../utils/streamToBase64";

export const stentInvoicesRouter = {
	listStentInvoices: publicProcedure.handler(async () => {
		const invoices = await db.query.stentInvoice.findMany({
			with: {
				buyer: true,
				lineItems: {
					with: {
						product: true,
						sizes: true,
					},
				},
			},
			orderBy: (stentInvoice, { desc }) => [desc(stentInvoice.createdAt)],
		});
		return invoices;
	}),

	getStentInvoice: publicProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ input }) => {
			const invoiceData = await db.query.stentInvoice.findFirst({
				where: eq(stentInvoice.id, input.id),
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
			return invoiceData;
		}),

	renderStentPDF: publicProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ input }) => {
			// Load stent invoice with related data (buyer, line items, product, sizes)
			const invoiceData = await db.query.stentInvoice.findFirst({
				where: eq(stentInvoice.id, input.id),
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

			if (!invoiceData) throw new Error("Stent invoice not found");

			// Load company data (use first/only company row)
			const companyData = await db.query.company.findFirst();

			// Map DB stent invoice data into `StentInvoiceProps` for PDF renderer
			const selectedInvoiceForPdf =
				mapStentInvoiceDataToInvoiceProps(invoiceData);

			// Render PDF buffer and return as base64 string (safely serializable over RPC)
			const bufferOrStream = await renderStentInvoicePdf(
				selectedInvoiceForPdf,
				companyData ?? undefined,
			);
			// If we received a Buffer, convert directly; otherwise treat as a stream
			let base64: string;
			if (Buffer.isBuffer(bufferOrStream)) {
				base64 = (bufferOrStream as Buffer).toString("base64");
			} else {
				base64 = await streamToBase64(bufferOrStream as any);
			}
			return { pdfBase64: base64 };
		}),

	createStentInvoice: publicProcedure
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
						patientName: z.string().min(1),
						patientAge: z.number().positive(),
						patientDate: z.string().min(1),
						patientGender: z.enum(["male", "female"]),
						rate: z.number().positive(),
						gstPercentage: z.number().min(0).max(100),
						baseAmount: z.number().default(0),
						taxAmount: z.number().default(0),
						totalAmount: z.number().default(0),
						sortOrder: z.number().default(0),
						sizes: z.array(
							z.object({
								sizeDimension: z.string().min(1),
								serialNumber: z.string().min(1),
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
				.insert(stentInvoice)
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
			if (!newInvoice) throw new Error("Failed to create stent invoice");

			// Create line items and sizes
			for (const [lineIndex, lineItem] of input.lineItems.entries()) {
				const lineResult = await db
					.insert(stentInvoiceLineItem)
					.values({
						id: `${newInvoice.id}-line-${Date.now()}-${lineIndex}`,
						invoiceId: newInvoice.id,
						productId: lineItem.productId,
						productName: lineItem.productName,
						hsnCode: lineItem.hsnCode,
						patientName: lineItem.patientName,
						patientAge: lineItem.patientAge,
						patientDate: lineItem.patientDate,
						patientGender: lineItem.patientGender,
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

				for (const [sizeIndex, size] of lineItem.sizes.entries()) {
					await db.insert(stentInvoiceLineItemSize).values({
						id: `${newLineItem.id}-size-${Date.now()}-${sizeIndex}`,
						lineItemId: newLineItem.id,
						sizeDimension: size.sizeDimension,
						serialNumber: size.serialNumber,
						expiryDate: size.expiryDate || null,
						quantity: size.quantity,
						sortOrder: size.sortOrder,
					});
				}
			}

			return newInvoice;
		}),

	updateStentInvoice: publicProcedure
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
						patientName: z.string().min(1),
						patientAge: z.number().positive(),
						patientDate: z.string().min(1),
						patientGender: z.enum(["male", "female"]),
						rate: z.number().positive(),
						gstPercentage: z.number().min(0).max(100),
						baseAmount: z.number().default(0),
						taxAmount: z.number().default(0),
						totalAmount: z.number().default(0),
						sortOrder: z.number().default(0),
						sizes: z.array(
							z.object({
								id: z.string().optional(),
								sizeDimension: z.string().min(1),
								serialNumber: z.string().min(1),
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
				.update(stentInvoice)
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
					buyerGstin: input.buyerGstin,
					buyerMobileNumber: input.buyerMobileNumber || null,
					buyerEmailAddress: input.buyerEmailAddress || null,
					buyerDrugLicenseNumber: input.buyerDrugLicenseNumber || null,
					buyerStateCode: input.buyerStateCode || null,
					notes: input.notes || null,
					termsAndConditions: input.termsAndConditions || null,
					updatedAt: new Date(),
				})
				.where(eq(stentInvoice.id, input.id))
				.returning();

			const updatedInvoice = updateResult[0];
			if (!updatedInvoice) throw new Error("Failed to update stent invoice");

			// Delete existing line items and sizes
			await db
				.delete(stentInvoiceLineItem)
				.where(eq(stentInvoiceLineItem.invoiceId, input.id));

			// Recreate line items and sizes
			for (const [lineIndex, lineItem] of input.lineItems.entries()) {
				const updateLineResult = await db
					.insert(stentInvoiceLineItem)
					.values({
						id:
							lineItem.id ||
							`${updatedInvoice.id}-line-${Date.now()}-${lineIndex}`,
						invoiceId: updatedInvoice.id,
						productId: lineItem.productId,
						productName: lineItem.productName,
						hsnCode: lineItem.hsnCode,
						patientName: lineItem.patientName,
						patientAge: lineItem.patientAge,
						patientDate: lineItem.patientDate,
						patientGender: lineItem.patientGender,
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

				for (const [sizeIndex, size] of lineItem.sizes.entries()) {
					await db.insert(stentInvoiceLineItemSize).values({
						id: size.id || `${newLineItem.id}-size-${Date.now()}-${sizeIndex}`,
						lineItemId: newLineItem.id,
						sizeDimension: size.sizeDimension,
						serialNumber: size.serialNumber,
						expiryDate: size.expiryDate || null,
						quantity: size.quantity,
						sortOrder: size.sortOrder,
					});
				}
			}

			return updatedInvoice;
		}),

	deleteStentInvoice: publicProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ input }) => {
			const lineItems = await db
				.select({ id: stentInvoiceLineItem.id })
				.from(stentInvoiceLineItem)
				.where(eq(stentInvoiceLineItem.invoiceId, input.id));
			for (const lineItem of lineItems) {
				await db
					.delete(stentInvoiceLineItemSize)
					.where(eq(stentInvoiceLineItemSize.lineItemId, lineItem.id));
			}

			await db
				.delete(stentInvoiceLineItem)
				.where(eq(stentInvoiceLineItem.invoiceId, input.id));

			const [deletedInvoice] = await db
				.delete(stentInvoice)
				.where(eq(stentInvoice.id, input.id))
				.returning();
			return deletedInvoice;
		}),
};

export default stentInvoicesRouter;
