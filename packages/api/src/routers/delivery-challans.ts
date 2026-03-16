import {
	db,
	deliveryChallan,
	deliveryChallanLineItem,
	deliveryChallanLineItemBatch,
	eq,
} from "@invoice-app/db";
import { z } from "zod";
import { publicProcedure } from "../index";
import { renderDeliveryChallanPdf } from "../pdf-render";
import type { DeliveryChallanProps } from "../pdf-template/delivery-challan-document";
import streamToBase64 from "../utils/streamToBase64";

// Helper function to map DB data to PDF props
function mapDeliveryChallanDataToChallanProps(
	challanData: any,
): DeliveryChallanProps {
	return {
		id: challanData.id,
		challanNumber: challanData.challanNumber,
		challanDate: challanData.challanDate,
		dcDate: challanData.dcDate ?? undefined,
		dcNumber: challanData.dcNumber ?? undefined,
		dispatchedThrough: challanData.dispatchedThrough ?? undefined,
		buyerName: challanData.buyerName,
		buyerAddressLine1: challanData.buyerAddressLine1,
		buyerAddressLine2: challanData.buyerAddressLine2 ?? undefined,
		buyerCity: challanData.buyerCity,
		buyerState: challanData.buyerState,
		buyerPincode: challanData.buyerPincode,
		buyerPhone: challanData.buyerMobileNumber ?? undefined,
		buyerGstin: challanData.buyerGstin ?? undefined,
		lineItems: (challanData.lineItems || []).map((li: any) => ({
			id: li.id,
			name: li.productName,
			hsnCode: li.hsnCode,
			quantity: (li.batches || []).reduce(
				(sum: number, b: any) => sum + (b.quantity || 0),
				0,
			),
			batches: (li.batches || []).map((b: any) => ({
				batchNo: b.batchNo ?? undefined,
				expiryDate: b.expiryDate ?? undefined,
				quantity: b.quantity,
			})),
		})),
	};
}

export const deliveryChallansRouter = {
	listDeliveryChallans: publicProcedure.handler(async () => {
		const challans = await db.query.deliveryChallan.findMany({
			with: {
				buyer: true,
				lineItems: {
					with: {
						product: true,
						batches: true,
					},
				},
			},
			orderBy: (deliveryChallan, { desc }) => [desc(deliveryChallan.createdAt)],
		});
		return challans;
	}),

	getDeliveryChallan: publicProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ input }) => {
			const challanData = await db.query.deliveryChallan.findFirst({
				where: eq(deliveryChallan.id, input.id),
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
			return challanData;
		}),

	renderDcPDF: publicProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ input }) => {
			const challanData = await db.query.deliveryChallan.findFirst({
				where: eq(deliveryChallan.id, input.id),
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

			if (!challanData) throw new Error("Delivery challan not found");

			const companyData = await db.query.company.findFirst();
			const selectedChallanForPdf =
				mapDeliveryChallanDataToChallanProps(challanData);

			const bufferOrStream = await renderDeliveryChallanPdf(
				selectedChallanForPdf,
				companyData ?? undefined,
			);
			let base64: string;
			if (Buffer.isBuffer(bufferOrStream)) {
				base64 = (bufferOrStream as Buffer).toString("base64");
			} else {
				base64 = await streamToBase64(bufferOrStream as any);
			}
			return { pdfBase64: base64 };
		}),

	createDeliveryChallan: publicProcedure
		.input(
			z.object({
				challanNumber: z.string().min(1),
				challanDate: z.string(),
				dcDate: z.string().optional(),
				dcNumber: z.string().optional(),
				dispatchedThrough: z.string().optional(),
				status: z.string().default("Draft"),
				isFinalized: z.boolean().default(false),
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
				lineItems: z.array(
					z.object({
						productId: z.string(),
						productName: z.string().min(1),
						hsnCode: z.string().min(1),
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
				.insert(deliveryChallan)
				.values({
					id: Date.now().toString(),
					challanNumber: input.challanNumber,
					challanDate: input.challanDate,
					dcDate: input.dcDate ?? null,
					dcNumber: input.dcNumber ?? null,
					dispatchedThrough: input.dispatchedThrough ?? null,
					status: input.status,
					isFinalized: input.isFinalized,
					buyerId: input.buyerId,
					buyerName: input.buyerName,
					buyerAddressLine1: input.buyerAddressLine1,
					buyerAddressLine2: input.buyerAddressLine2 || null,
					buyerAddressLine3: input.buyerAddressLine3 || null,
					buyerCity: input.buyerCity,
					buyerState: input.buyerState,
					buyerCountry: input.buyerCountry,
					buyerPincode: input.buyerPincode,
					buyerGstin: input.buyerGstin ?? null,
					buyerMobileNumber: input.buyerMobileNumber || null,
					buyerEmailAddress: input.buyerEmailAddress || null,
					buyerDrugLicenseNumber: input.buyerDrugLicenseNumber || null,
					buyerStateCode: input.buyerStateCode || null,
					notes: input.notes || null,
				})
				.returning();

			const newChallan = result[0];
			if (!newChallan) throw new Error("Failed to create delivery challan");

			// Create line items and batches
			for (const [lineIndex, lineItem] of input.lineItems.entries()) {
				const lineItemResult = await db
					.insert(deliveryChallanLineItem)
					.values({
						id: `${newChallan.id}-line-${lineIndex}`,
						challanId: newChallan.id,
						productId: lineItem.productId,
						productName: lineItem.productName,
						hsnCode: lineItem.hsnCode,
						sortOrder: lineItem.sortOrder || lineIndex,
					})
					.returning();

				const newLineItem = lineItemResult[0];
				if (!newLineItem) continue;

				for (const [batchIndex, batch] of lineItem.batches.entries()) {
					await db.insert(deliveryChallanLineItemBatch).values({
						id: `${newLineItem.id}-batch-${batchIndex}`,
						lineItemId: newLineItem.id,
						batchNo: batch.batchNo || null,
						expiryDate: batch.expiryDate || null,
						quantity: batch.quantity,
						sortOrder: batch.sortOrder || batchIndex,
					});
				}
			}

			return newChallan;
		}),

	updateDeliveryChallan: publicProcedure
		.input(
			z.object({
				id: z.string(),
				challanNumber: z.string().min(1),
				challanDate: z.string(),
				dcDate: z.string().optional(),
				dcNumber: z.string().optional(),
				dispatchedThrough: z.string().optional(),
				status: z.string().default("Draft"),
				isFinalized: z.boolean().default(false),
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
				lineItems: z.array(
					z.object({
						id: z.string().optional(),
						productId: z.string(),
						productName: z.string().min(1),
						hsnCode: z.string().min(1),
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
				.update(deliveryChallan)
				.set({
					challanNumber: input.challanNumber,
					challanDate: input.challanDate,
					dcDate: input.dcDate ?? null,
					dcNumber: input.dcNumber ?? null,
					dispatchedThrough: input.dispatchedThrough ?? null,
					status: input.status,
					isFinalized: input.isFinalized,
					buyerId: input.buyerId,
					buyerName: input.buyerName,
					buyerAddressLine1: input.buyerAddressLine1,
					buyerAddressLine2: input.buyerAddressLine2 || null,
					buyerAddressLine3: input.buyerAddressLine3 || null,
					buyerCity: input.buyerCity,
					buyerState: input.buyerState,
					buyerCountry: input.buyerCountry,
					buyerPincode: input.buyerPincode,
					buyerGstin: input.buyerGstin || null,
					buyerMobileNumber: input.buyerMobileNumber || null,
					buyerEmailAddress: input.buyerEmailAddress || null,
					buyerDrugLicenseNumber: input.buyerDrugLicenseNumber || null,
					buyerStateCode: input.buyerStateCode || null,
					notes: input.notes || null,
					updatedAt: new Date(),
				})
				.where(eq(deliveryChallan.id, input.id))
				.returning();

			const updatedChallan = updateResult[0];
			if (!updatedChallan) throw new Error("Failed to update delivery challan");

			// Delete existing line items and batches
			await db
				.delete(deliveryChallanLineItem)
				.where(eq(deliveryChallanLineItem.challanId, input.id));

			// Recreate line items and batches
			for (const [lineIndex, lineItem] of input.lineItems.entries()) {
				const lineItemResult = await db
					.insert(deliveryChallanLineItem)
					.values({
						id: lineItem.id || `${updatedChallan.id}-line-${lineIndex}`,
						challanId: updatedChallan.id,
						productId: lineItem.productId,
						productName: lineItem.productName,
						hsnCode: lineItem.hsnCode,
						sortOrder: lineItem.sortOrder || lineIndex,
					})
					.returning();

				const newLineItem = lineItemResult[0];
				if (!newLineItem) continue;

				for (const [batchIndex, batch] of lineItem.batches.entries()) {
					await db.insert(deliveryChallanLineItemBatch).values({
						id: batch.id || `${newLineItem.id}-batch-${batchIndex}`,
						lineItemId: newLineItem.id,
						batchNo: batch.batchNo || null,
						expiryDate: batch.expiryDate || null,
						quantity: batch.quantity,
						sortOrder: batch.sortOrder || batchIndex,
					});
				}
			}

			return updatedChallan;
		}),

	deleteDeliveryChallan: publicProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ input }) => {
			const lineItems = await db
				.select({ id: deliveryChallanLineItem.id })
				.from(deliveryChallanLineItem)
				.where(eq(deliveryChallanLineItem.challanId, input.id));
			for (const lineItem of lineItems) {
				await db
					.delete(deliveryChallanLineItemBatch)
					.where(eq(deliveryChallanLineItemBatch.lineItemId, lineItem.id));
			}

			await db
				.delete(deliveryChallanLineItem)
				.where(eq(deliveryChallanLineItem.challanId, input.id));

			const [deletedChallan] = await db
				.delete(deliveryChallan)
				.where(eq(deliveryChallan.id, input.id))
				.returning();
			return deletedChallan;
		}),
};

export default deliveryChallansRouter;
