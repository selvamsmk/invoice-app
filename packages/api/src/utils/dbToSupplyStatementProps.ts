import type { buyer as buyerModel } from "@invoice-app/db";
import type {
	SupplyStatementLineItem,
	SupplyStatementProps,
} from "../pdf-template/supply-statement-document";

type DbBuyer = typeof buyerModel.$inferSelect;

export type SupplyStatementDbRow = {
	date: string;
	invoiceNo: string;
	quantity: number;
	amount: number;
};

type MapSupplyStatementParams = {
	rows: SupplyStatementDbRow[];
	totalAmount: number;
	selectedBuyer?: DbBuyer | null;
	statementTitle?: string;
	statementDate?: string;
	showSign?: boolean;
	showSeal?: boolean;
};

function buildStatementNumber(now: number): string {
	return `SUPPLY-STMT-${now}`;
}

function mapRowsToLineItems(
	rows: SupplyStatementDbRow[],
): SupplyStatementLineItem[] {
	return rows.map((row, index) => ({
		id: `${index}`,
		date: row.date,
		invoiceNo: row.invoiceNo,
		quantity: row.quantity,
		amount: row.amount,
	}));
}

export function mapSupplyStatementDataToProps({
	rows,
	totalAmount,
	selectedBuyer,
	statementTitle,
	statementDate,
	showSign = false,
	showSeal = false,
}: MapSupplyStatementParams): SupplyStatementProps {
	const now = Date.now();
	return {
		id: `supply-statement-${now}`,
		statementNumber: buildStatementNumber(now),
		statementDate:
			statementDate ?? new Date().toISOString().split("T")[0] ?? "",
		statementTitle: statementTitle ?? "Supply Statement",
		buyerName: selectedBuyer?.name ?? "All Buyers",
		buyerAddressLine1: selectedBuyer?.addressLine1 ?? "",
		buyerAddressLine2: selectedBuyer?.addressLine2 ?? "",
		buyerCity: selectedBuyer?.city ?? "",
		buyerState: selectedBuyer?.state ?? "",
		buyerPincode: selectedBuyer?.pincode ?? "",
		buyerPhone: selectedBuyer?.mobileNumber ?? "",
		buyerGstin: selectedBuyer?.gstin ?? "",
		totalAmount,
		showSign,
		showSeal,
		lineItems: mapRowsToLineItems(rows),
	};
}
