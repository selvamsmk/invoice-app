import type {
	buyer as buyerModel,
	invoiceLineItem,
	invoiceLineItemBatch,
	product,
} from "@invoice-app/db";
import type { Invoice } from "..";
import type { InvoiceProps } from "../pdf-template/invoice-document";

// Drizzle-derived types for related rows
type DbProduct = typeof product.$inferSelect;
type DbLineItemRow = typeof invoiceLineItem.$inferSelect;
type DbBatchRow = typeof invoiceLineItemBatch.$inferSelect;
type DbBuyer = typeof buyerModel.$inferSelect;

// Line item with relations returned by the query
type DbLineItem = DbLineItemRow & {
	product?: DbProduct | null;
	batches?: DbBatchRow[] | null;
};

// Invoice with related buyer and line items (as returned by `.with` in Drizzle)
type DbInvoice = Invoice & {
	buyer?: DbBuyer | null;
	lineItems?: DbLineItem[] | null;
};

export function mapInvoiceDataToInvoiceProps(
	invoiceData: DbInvoice,
): InvoiceProps {
	const lineItemsForPdf = (invoiceData.lineItems || []).map((li: any) => {
		const totalQuantity = (li.batches || []).reduce(
			(s: number, b: any) => s + (b.quantity || 0),
			0,
		);
		return {
			id: li.id,
			name: li.productName ?? li.product?.name ?? "",
			hsnCode: li.hsnCode ?? li.product?.hsnCode ?? "",
			expiryDate:
				li.batches && li.batches.length > 0
					? li.batches
							.map((b: any) => b.expiryDate)
							.filter(Boolean)
							.join(", ")
					: undefined,
			quantity: totalQuantity,
			batches: (li.batches || []).map((b: any) => ({
				id: b.id,
				batchNo: b.batchNo ?? null,
				expiryDate: b.expiryDate ?? null,
				quantity: b.quantity ?? 0,
			})),
			// DB stores amounts in paise
			rate: li.rate ?? li.baseAmount ?? 0,
			gstPercentage: li.gstPercentage ?? li.product?.gstPercentage ?? 0,
			amount: li.totalAmount ?? li.total_amount ?? li.baseAmount ?? 0,
		};
	});

	const selectedInvoiceForPdf: InvoiceProps = {
		id: invoiceData.id,
		invoiceNumber: invoiceData.invoiceNumber,
		buyerName: invoiceData.buyerName ?? invoiceData.buyer?.name ?? "",
		buyerAddressLine1: invoiceData.buyerAddressLine1 ?? undefined,
		buyerAddressLine2: invoiceData.buyerAddressLine2 ?? undefined,
		buyerCity: invoiceData.buyerCity ?? invoiceData.buyer?.city ?? "",
		buyerState: invoiceData.buyerState ?? invoiceData.buyer?.state ?? "",
		buyerPincode: invoiceData.buyerPincode ?? undefined,
		buyerPhone: invoiceData.buyerMobileNumber ?? undefined,
		buyerGstin: invoiceData.buyerGstin ?? invoiceData.buyer?.gstin ?? undefined,
		// Invoice-level amounts in paise
		amount: invoiceData.totalAmount ?? 0,
		totalAmount: invoiceData.totalAmount ?? 0,
		status: invoiceData.status,
		invoiceDate: invoiceData.invoiceDate,
		dueDate: invoiceData.dueDate ?? "",
		dcDate: invoiceData.dcDate ?? undefined,
		dcNumber: invoiceData.dcNumber ?? undefined,
		dispatchedThrough: invoiceData.dispatchedThrough ?? undefined,
		createdAt: invoiceData.createdAt
			? invoiceData.createdAt instanceof Date
				? invoiceData.createdAt.toISOString()
				: String(invoiceData.createdAt)
			: new Date().toISOString(),
		isFinalized: invoiceData.isFinalized,
		showSign: invoiceData.showSign ?? false,
		showSeal: invoiceData.showSeal ?? false,
		invoiceType: invoiceData.invoiceType,
		lineItems: lineItemsForPdf,
	};

	return selectedInvoiceForPdf;
}
