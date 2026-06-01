import type { DeliveryChallanProps } from "../pdf-template/delivery-challan-document";

export function mapDeliveryChallanDataToChallanProps(
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
		showSign: challanData.showSign ?? false,
		showSeal: challanData.showSeal ?? false,
		lineItems: (challanData.lineItems || []).map((li: any) => ({
			id: li.id,
			name: li.productName,
			hsnCode: li.hsnCode,
			quantity: (li.batches || []).reduce(
				(sum: number, batch: any) => sum + (batch.quantity || 0),
				0,
			),
			batches: (li.batches || []).map((batch: any) => ({
				batchNo: batch.batchNo ?? undefined,
				expiryDate: batch.expiryDate ?? undefined,
				quantity: batch.quantity,
			})),
		})),
	};
}
