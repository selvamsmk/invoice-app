import { db } from "@invoice-app/db";
import { z } from "zod";
import { publicProcedure } from "../index";
import { renderSupplyStatementPdf } from "../pdf-render";
import { mapSupplyStatementDataToProps } from "../utils/dbToSupplyStatementProps";
import streamToBase64 from "../utils/streamToBase64";

const supplyStatementFilterSchema = z.object({
	buyerId: z.string().default("all"),
	startDate: z.string().optional(),
	endDate: z.string().optional(),
	includeStandard: z.boolean().default(true),
	includeStent: z.boolean().default(true),
	statementTitle: z.string().optional(),
	showSign: z.boolean().default(false),
	showSeal: z.boolean().default(false),
});

type StatementRow = {
	date: string;
	invoiceNo: string;
	quantity: number;
	amount: number;
};

type StatementLineItemRow = StatementRow & {
	invoiceType: "Standard Invoice" | "Stent Invoice";
	buyerName: string;
	buyerGstin: string;
	hsnCode: string;
	taxableValue: number;
	gstRatePercentage: number;
	cgstAmount: number;
	sgstAmount: number;
	totalItemAmount: number;
};

type CsvGroupedRow = {
	invoice_no: string;
	invoice_date: string;
	Invoice_type: "Standard Invoice" | "Stent Invoice";
	Buyer_name: string;
	Buyer_GSTIN: string;
	HSN_code: string;
	Quantity: number;
	Taxable_value: number;
	GST_rate_percentage: number;
	CGST_amount: number;
	SGST_amount: number;
	Total_item_amount: number;
};

function normalizeIsoDate(value: string): string {
	return value.split("T")[0] ?? value;
}

function isDateWithinRange(
	date: string,
	startDate?: string,
	endDate?: string,
): boolean {
	const normalized = normalizeIsoDate(date);
	if (startDate && normalized < startDate) return false;
	if (endDate && normalized > endDate) return false;
	return true;
}

function sumAsNumber(values: number[]): number {
	return values.reduce((acc, value) => acc + value, 0);
}

async function getSupplyStatementDataInternal(
	filters: z.infer<typeof supplyStatementFilterSchema>,
): Promise<{
	rows: StatementRow[];
	totalAmount: number;
	csvRows: CsvGroupedRow[];
}> {
	const lineItemRows: StatementLineItemRow[] = [];
	const buyerIdFilter = filters.buyerId !== "all" ? filters.buyerId : null;

	if (filters.includeStandard) {
		const invoices = await db.query.invoice.findMany({
			with: {
				lineItems: {
					with: {
						batches: true,
					},
				},
			},
		});

		for (const invoice of invoices) {
			if (buyerIdFilter && invoice.buyerId !== buyerIdFilter) continue;
			if (
				!isDateWithinRange(
					invoice.invoiceDate,
					filters.startDate,
					filters.endDate,
				)
			) {
				continue;
			}

			for (const lineItem of invoice.lineItems ?? []) {
				const quantity = sumAsNumber(
					(lineItem.batches ?? []).map((batch) => Number(batch.quantity ?? 0)),
				);
				const taxAmount = Number(lineItem.taxAmount ?? 0);
				lineItemRows.push({
					date: normalizeIsoDate(invoice.invoiceDate),
					invoiceNo: invoice.invoiceNumber,
					quantity,
					amount: Number(invoice.totalAmount ?? 0),
					invoiceType: "Standard Invoice",
					buyerName: invoice.buyerName,
					buyerGstin: invoice.buyerGstin ?? "",
					hsnCode: lineItem.hsnCode,
					taxableValue: Number(lineItem.baseAmount ?? 0),
					gstRatePercentage: Number(lineItem.gstPercentage ?? 0),
					cgstAmount: taxAmount / 2,
					sgstAmount: taxAmount / 2,
					totalItemAmount: Number(lineItem.totalAmount ?? 0),
				});
			}
		}
	}

	if (filters.includeStent) {
		const stentInvoices = await db.query.stentInvoice.findMany({
			with: {
				lineItems: {
					with: {
						sizes: true,
					},
				},
			},
		});

		for (const invoice of stentInvoices) {
			if (buyerIdFilter && invoice.buyerId !== buyerIdFilter) continue;
			if (
				!isDateWithinRange(
					invoice.invoiceDate,
					filters.startDate,
					filters.endDate,
				)
			) {
				continue;
			}

			for (const lineItem of invoice.lineItems ?? []) {
				const quantity = sumAsNumber(
					(lineItem.sizes ?? []).map((size) => Number(size.quantity ?? 0)),
				);
				const taxAmount = Number(lineItem.taxAmount ?? 0);
				lineItemRows.push({
					date: normalizeIsoDate(invoice.invoiceDate),
					invoiceNo: invoice.invoiceNumber,
					quantity,
					amount: Number(invoice.totalAmount ?? 0),
					invoiceType: "Stent Invoice",
					buyerName: invoice.buyerName,
					buyerGstin: invoice.buyerGstin ?? "",
					hsnCode: lineItem.hsnCode,
					taxableValue: Number(lineItem.baseAmount ?? 0),
					gstRatePercentage: Number(lineItem.gstPercentage ?? 0),
					cgstAmount: taxAmount / 2,
					sgstAmount: taxAmount / 2,
					totalItemAmount: Number(lineItem.totalAmount ?? 0),
				});
			}
		}
	}

	lineItemRows.sort((a, b) => {
		if (a.date === b.date) return a.invoiceNo.localeCompare(b.invoiceNo);
		return a.date.localeCompare(b.date);
	});

	const groupedByInvoice = new Map<
		string,
		StatementRow & {
			date: string;
			invoiceType: "Standard Invoice" | "Stent Invoice";
		}
	>();
	for (const row of lineItemRows) {
		const groupKey = `${row.invoiceType}::${row.invoiceNo}`;
		const existing = groupedByInvoice.get(groupKey);
		if (!existing) {
			groupedByInvoice.set(groupKey, {
				date: row.date,
				invoiceType: row.invoiceType,
				invoiceNo: row.invoiceNo,
				quantity: row.quantity,
				amount: row.amount,
			});
			continue;
		}

		existing.quantity += row.quantity;
	}

	const groupedByInvoiceHsn = new Map<string, CsvGroupedRow>();
	for (const row of lineItemRows) {
		const groupKey = `${row.invoiceType}::${row.invoiceNo}::${row.hsnCode}`;
		const existing = groupedByInvoiceHsn.get(groupKey);
		if (!existing) {
			groupedByInvoiceHsn.set(groupKey, {
				invoice_no: row.invoiceNo,
				invoice_date: row.date,
				Invoice_type: row.invoiceType,
				Buyer_name: row.buyerName,
				Buyer_GSTIN: row.buyerGstin,
				HSN_code: row.hsnCode,
				Quantity: row.quantity,
				Taxable_value: row.taxableValue,
				GST_rate_percentage: row.gstRatePercentage,
				CGST_amount: row.cgstAmount,
				SGST_amount: row.sgstAmount,
				Total_item_amount: row.totalItemAmount,
			});
			continue;
		}

		existing.Quantity += row.quantity;
		existing.Taxable_value += row.taxableValue;
		existing.CGST_amount += row.cgstAmount;
		existing.SGST_amount += row.sgstAmount;
		existing.Total_item_amount += row.totalItemAmount;
	}

	const rows = Array.from(groupedByInvoice.values()).map((row) => ({
		date: row.date,
		invoiceNo: row.invoiceNo,
		quantity: row.quantity,
		amount: row.amount,
	}));

	return {
		rows,
		totalAmount: rows.reduce((sum, row) => sum + row.amount, 0),
		csvRows: Array.from(groupedByInvoiceHsn.values()),
	};
}

export const supplyStatementRouter = {
	getSupplyStatementData: publicProcedure
		.input(supplyStatementFilterSchema)
		.handler(async ({ input }) => {
			if (!input.includeStandard && !input.includeStent) {
				return {
					rows: [],
					totalAmount: 0,
					csvRows: [],
				};
			}

			return getSupplyStatementDataInternal(input);
		}),

	renderSupplyStatementPdf: publicProcedure
		.input(supplyStatementFilterSchema)
		.handler(async ({ input }) => {
			if (!input.includeStandard && !input.includeStent) {
				throw new Error("Select at least one category to render statement PDF");
			}

			const { rows, totalAmount } = await getSupplyStatementDataInternal(input);
			const companyData = await db.query.company.findFirst();
			const selectedBuyer =
				input.buyerId !== "all"
					? await db.query.buyer.findFirst({
							where: (buyer, { eq }) => eq(buyer.id, input.buyerId),
						})
					: null;

			const statementPayload = mapSupplyStatementDataToProps({
				rows,
				totalAmount,
				selectedBuyer,
				statementTitle: input.statementTitle,
				statementDate: input.endDate,
				showSign: input.showSign,
				showSeal: input.showSeal,
			});

			const bufferOrStream = await renderSupplyStatementPdf(
				statementPayload,
				companyData,
			);
			const base64 = Buffer.isBuffer(bufferOrStream)
				? bufferOrStream.toString("base64")
				: await streamToBase64(bufferOrStream as NodeJS.ReadableStream);

			return { pdfBase64: base64 };
		}),
};

export default supplyStatementRouter;
