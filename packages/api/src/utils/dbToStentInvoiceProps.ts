import type {
	buyer as buyerModel,
	product,
	stentInvoiceLineItem,
	stentInvoiceLineItemSize,
} from "@invoice-app/db";
import type { StentInvoice } from "..";
import type { StentInvoiceProps } from "../pdf-template/stent-invoice-document";

// Drizzle-derived types
type DbProduct = typeof product.$inferSelect;
type DbLineItemRow = typeof stentInvoiceLineItem.$inferSelect;
type DbSizeRow = typeof stentInvoiceLineItemSize.$inferSelect;
type DbBuyer = typeof buyerModel.$inferSelect;

type DbLineItem = DbLineItemRow & {
	product?: DbProduct | null;
	sizes?: DbSizeRow[] | null;
};

type DbStentInvoice = StentInvoice & {
	buyer?: DbBuyer | null;
	lineItems?: DbLineItem[] | null;
};

export function mapStentInvoiceDataToInvoiceProps(
	invoiceData: DbStentInvoice,
): StentInvoiceProps {
	const lineItemsForPdf = (invoiceData.lineItems || []).map((li: any) => {
		const totalQuantity = (li.sizes || []).reduce(
			(s: number, size: any) => s + (size.quantity || 0),
			0,
		);
		return {
			id: li.id,
			name: li.productName ?? li.product?.name ?? "",
			hsnCode: li.hsnCode ?? li.product?.hsnCode ?? "",
			patientName: li.patientName ?? "",
			patientAge: li.patientAge ?? 0,
			patientDate: li.patientDate ?? "",
			patientGender: li.patientGender ?? "male",
			quantity: totalQuantity,
			sizes: (li.sizes || []).map((size: any) => ({
				id: size.id,
				sizeDimension: size.sizeDimension ?? "",
				serialNumber: size.serialNumber ?? "",
				expiryDate: size.expiryDate ?? null,
				quantity: size.quantity ?? 0,
			})),
			rate: li.rate ?? li.baseAmount ?? 0,
			gstPercentage: li.gstPercentage ?? li.product?.gstPercentage ?? 0,
			amount: li.totalAmount ?? li.total_amount ?? li.baseAmount ?? 0,
		};
	});

	const selectedInvoiceForPdf: StentInvoiceProps = {
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
