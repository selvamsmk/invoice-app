import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from "@/components/ui/combobox";
import { DatePickerInput } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useAppContext } from "@/hooks/useAppContext";
import { useBuyersProducts } from "@/hooks/useBuyersProducts";

export const Route = createFileRoute("/app/supply-statement")({
	component: SupplyStatementPage,
});

type BuyerOption = {
	id: string;
	name: string;
	gstin?: string | null;
	city?: string;
	state?: string;
};

type StatementRow = {
	date: string;
	invoiceNo: string;
	quantity: number;
	amount: number;
};

function toIsoDate(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

function getThisMonthRange(): { start: string; end: string } {
	const now = new Date();
	const start = new Date(now.getFullYear(), now.getMonth(), 1);
	return { start: toIsoDate(start), end: toIsoDate(now) };
}

function getLastMonthRange(): { start: string; end: string } {
	const now = new Date();
	const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
	const end = new Date(now.getFullYear(), now.getMonth(), 0);
	return { start: toIsoDate(start), end: toIsoDate(end) };
}

function getCurrentFinancialYearRange(): { start: string; end: string } {
	const now = new Date();
	const fyStartYear =
		now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
	const start = new Date(fyStartYear, 3, 1);
	return { start: toIsoDate(start), end: toIsoDate(now) };
}

function getLastFinancialYearRange(): { start: string; end: string } {
	const now = new Date();
	const currentFyStartYear =
		now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
	const start = new Date(currentFyStartYear - 1, 3, 1);
	const end = new Date(currentFyStartYear, 2, 31);
	return { start: toIsoDate(start), end: toIsoDate(end) };
}

function getLastYearRange(): { start: string; end: string } {
	const now = new Date();
	const lastYear = now.getFullYear() - 1;
	const start = new Date(lastYear, 0, 1);
	const end = new Date(lastYear, 11, 31);
	return { start: toIsoDate(start), end: toIsoDate(end) };
}

function getCurrentYearRange(): { start: string; end: string } {
	const now = new Date();
	const start = new Date(now.getFullYear(), 0, 1);
	return { start: toIsoDate(start), end: toIsoDate(now) };
}

function formatMoney(value: number): string {
	return new Intl.NumberFormat("en-IN", {
		style: "currency",
		currency: "INR",
		maximumFractionDigits: 2,
	}).format(value);
}

function escapeCsvCell(value: string | number): string {
	const stringValue = String(value ?? "");
	if (
		stringValue.includes(",") ||
		stringValue.includes('"') ||
		stringValue.includes("\n")
	) {
		return `"${stringValue.replace(/"/g, '""')}"`;
	}
	return stringValue;
}

function SupplyStatementPage() {
	const { orpc } = useAppContext();
	const { buyers } = useBuyersProducts();
	const [selectedBuyerId, setSelectedBuyerId] = useState("all");
	const [activePreset, setActivePreset] = useState<
		| "this-month"
		| "last-month"
		| "current-fy"
		| "last-fy"
		| "current-year"
		| "last-year"
		| "custom"
	>("this-month");
	const initialRange = getThisMonthRange();
	const [startDate, setStartDate] = useState(initialRange.start);
	const [endDate, setEndDate] = useState(initialRange.end);
	const [includeStandard, setIncludeStandard] = useState(true);
	const [includeStent, setIncludeStent] = useState(true);
	const [statementTitle, setStatementTitle] = useState(
		"Supply statement for selected period",
	);
	const [showSign, setShowSign] = useState(false);
	const [showSeal, setShowSeal] = useState(false);

	const buyerOptions = useMemo<BuyerOption[]>(() => {
		const unique = new Map<string, BuyerOption>();
		for (const buyer of buyers.data ?? []) {
			const key = [
				buyer.gstin?.trim() || "",
				buyer.name?.trim() || "",
				buyer.city?.trim() || "",
				buyer.state?.trim() || "",
			].join("|");
			if (!unique.has(key)) {
				unique.set(key, {
					id: buyer.id,
					name: buyer.name,
					gstin: buyer.gstin,
					city: buyer.city,
					state: buyer.state,
				});
			}
		}

		return [
			{ id: "all", name: "All Buyers" },
			...Array.from(unique.values()).sort((a, b) =>
				a.name.localeCompare(b.name),
			),
		];
	}, [buyers.data]);

	const selectedBuyer = useMemo(
		() =>
			buyerOptions.find((buyer) => buyer.id === selectedBuyerId) ??
			buyerOptions[0] ??
			null,
		[buyerOptions, selectedBuyerId],
	);

	const rowFilters = useMemo(
		() => ({
			buyerId: selectedBuyerId,
			startDate,
			endDate,
			includeStandard,
			includeStent,
		}),
		[selectedBuyerId, startDate, endDate, includeStandard, includeStent],
	);

	const pdfExportInput = useMemo(
		() => ({
			...rowFilters,
			statementTitle,
			showSign,
			showSeal,
		}),
		[rowFilters, statementTitle, showSign, showSeal],
	);

	const statementQuery = useQuery(
		orpc.getSupplyStatementData.queryOptions({ input: rowFilters }),
	);

	const renderPdfMutation = useMutation(
		orpc.renderSupplyStatementPdf.mutationOptions(),
	);

	const rows: StatementRow[] = statementQuery.data?.rows ?? [];
	const totalAmount = statementQuery.data?.totalAmount ?? 0;

	const applyPreset = (
		preset:
			| "this-month"
			| "last-month"
			| "current-fy"
			| "last-fy"
			| "current-year"
			| "last-year",
	) => {
		setActivePreset(preset);

		if (preset === "this-month") {
			const range = getThisMonthRange();
			setStartDate(range.start);
			setEndDate(range.end);
			return;
		}

		if (preset === "last-month") {
			const range = getLastMonthRange();
			setStartDate(range.start);
			setEndDate(range.end);
			return;
		}

		if (preset === "last-fy") {
			const range = getLastFinancialYearRange();
			setStartDate(range.start);
			setEndDate(range.end);
			return;
		}

		if (preset === "last-year") {
			const range = getLastYearRange();
			setStartDate(range.start);
			setEndDate(range.end);
			return;
		}

		if (preset === "current-year") {
			const range = getCurrentYearRange();
			setStartDate(range.start);
			setEndDate(range.end);
			return;
		}

		const range = getCurrentFinancialYearRange();
		setStartDate(range.start);
		setEndDate(range.end);
	};

	const handleStartDateChange = (value: string) => {
		setActivePreset("custom");
		setStartDate(value);
	};

	const handleEndDateChange = (value: string) => {
		setActivePreset("custom");
		setEndDate(value);
	};

	const canExport = includeStandard || includeStent;

	const handleExportCsv = () => {
		if (!canExport) {
			toast.error("Select at least one category to export CSV");
			return;
		}

		const csvRows = statementQuery.data?.csvRows ?? [];
		if (csvRows.length === 0) {
			toast.error("No rows available for CSV export");
			return;
		}

		const headers = [
			"invoice_no",
			"invoice_date",
			"Invoice_type",
			"Buyer_name",
			"Buyer_GSTIN",
			"HSN_code",
			"Quantity",
			"Taxable_value",
			"GST_rate_percentage",
			"CGST_amount",
			"SGST_amount",
			"Total_item_amount",
		] as const;

		const lines = [headers.join(",")];
		for (const row of csvRows) {
			lines.push(headers.map((header) => escapeCsvCell(row[header])).join(","));
		}

		const csv = lines.join("\n");
		const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const fileDate = new Date().toISOString().split("T")[0] ?? "statement";
		const link = document.createElement("a");
		link.href = url;
		link.download = `supply-statement-${fileDate}.csv`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
		toast.success("CSV exported successfully");
	};

	const handleExportPdf = async () => {
		if (!canExport) {
			toast.error("Select at least one category to export PDF");
			return;
		}

		try {
			const response = await renderPdfMutation.mutateAsync(pdfExportInput);
			if (!response.pdfBase64) {
				throw new Error("Failed to generate PDF");
			}

			const byteChars = atob(response.pdfBase64);
			const byteNumbers = new Array(byteChars.length);
			for (let index = 0; index < byteChars.length; index++) {
				byteNumbers[index] = byteChars.charCodeAt(index);
			}
			const byteArray = new Uint8Array(byteNumbers);
			const blob = new Blob([byteArray], { type: "application/pdf" });
			const url = URL.createObjectURL(blob);
			const fileDate = new Date().toISOString().split("T")[0] ?? "statement";
			const link = document.createElement("a");
			link.href = url;
			link.download = `supply-statement-${fileDate}.pdf`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
			toast.success("PDF exported successfully");
		} catch (error) {
			console.error("Failed to export supply statement PDF", error);
			toast.error("Failed to export PDF");
		}
	};

	return (
		<div className="h-full min-h-0 space-y-6 overflow-y-auto pr-1">
			<div className="flex items-center justify-between gap-3">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">
						Supply Statement
					</h1>
					<p className="text-muted-foreground text-sm">
						Pulls data from standard invoices and stent invoices only.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						onClick={handleExportPdf}
						disabled={renderPdfMutation.isPending || !canExport}
					>
						{renderPdfMutation.isPending ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : (
							<FileText className="mr-2 h-4 w-4" />
						)}
						Export PDF
					</Button>
					<Button
						onClick={handleExportCsv}
						disabled={statementQuery.isFetching || !canExport}
					>
						<Download className="mr-2 h-4 w-4" />
						Export CSV
					</Button>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<FileSpreadsheet className="h-5 w-5" />
						Filter & Selection
					</CardTitle>
					<CardDescription>
						Choose buyer, period, and category for statement generation.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-5">
					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<p className="font-medium text-sm">Buyer</p>
							<Combobox
								items={buyerOptions}
								itemToStringLabel={(buyer) => buyer.name}
								itemToStringValue={(buyer) => buyer.id}
								value={selectedBuyer}
								onValueChange={(buyer) => {
									setSelectedBuyerId(buyer?.id ?? "all");
								}}
							>
								<ComboboxInput placeholder="Search buyer..." showClear />
								<ComboboxContent>
									<ComboboxEmpty>No buyers found.</ComboboxEmpty>
									<ComboboxList>
										{(buyer) => (
											<ComboboxItem key={buyer.id} value={buyer}>
												<div className="flex flex-col items-start">
													<span className="font-medium">{buyer.name}</span>
													{buyer.id !== "all" ? (
														<span className="text-muted-foreground text-xs">
															{buyer.city}, {buyer.state} •{" "}
															{buyer.gstin || "GSTIN not set"}
														</span>
													) : null}
												</div>
											</ComboboxItem>
										)}
									</ComboboxList>
								</ComboboxContent>
							</Combobox>
						</div>
						<div className="space-y-2">
							<p className="font-medium text-sm">
								Statement Name (PDF right box)
							</p>
							<Input
								value={statementTitle}
								onChange={(event) => setStatementTitle(event.target.value)}
								placeholder="Outstanding for the month of May"
							/>
						</div>
					</div>

					<div className="space-y-2">
						<p className="font-medium text-sm">Time Period</p>
						<div className="flex flex-wrap gap-2">
							<Button
								type="button"
								variant={activePreset === "this-month" ? "default" : "outline"}
								onClick={() => applyPreset("this-month")}
							>
								This Month
							</Button>
							<Button
								type="button"
								variant={activePreset === "last-month" ? "default" : "outline"}
								onClick={() => applyPreset("last-month")}
							>
								Last Month
							</Button>
							<Button
								type="button"
								variant={activePreset === "current-fy" ? "default" : "outline"}
								onClick={() => applyPreset("current-fy")}
							>
								Current Financial Year
							</Button>
							<Button
								type="button"
								variant={activePreset === "last-fy" ? "default" : "outline"}
								onClick={() => applyPreset("last-fy")}
							>
								Last Financial Year
							</Button>
							<Button
								type="button"
								variant={
									activePreset === "current-year" ? "default" : "outline"
								}
								onClick={() => applyPreset("current-year")}
							>
								Current Year
							</Button>
							<Button
								type="button"
								variant={activePreset === "last-year" ? "default" : "outline"}
								onClick={() => applyPreset("last-year")}
							>
								Last Year
							</Button>
						</div>
						<div className="grid gap-3 md:grid-cols-2">
							<div>
								<p className="mb-1 text-muted-foreground text-xs">Start date</p>
								<DatePickerInput
									value={startDate}
									onChange={handleStartDateChange}
									placeholder="Select start date"
								/>
							</div>
							<div>
								<p className="mb-1 text-muted-foreground text-xs">End date</p>
								<DatePickerInput
									value={endDate}
									onChange={handleEndDateChange}
									placeholder="Select end date"
								/>
							</div>
						</div>
					</div>

					<div className="space-y-2">
						<p className="font-medium text-sm">Category</p>
						<div className="flex flex-wrap items-center gap-4">
							<label
								className="inline-flex items-center gap-2"
								htmlFor="include-standard-invoices"
							>
								<Checkbox
									id="include-standard-invoices"
									checked={includeStandard}
									onCheckedChange={(checked) =>
										setIncludeStandard(checked === true)
									}
								/>
								<span className="text-sm">Standard Invoices</span>
							</label>
							<label
								className="inline-flex items-center gap-2"
								htmlFor="include-stent-invoices"
							>
								<Checkbox
									id="include-stent-invoices"
									checked={includeStent}
									onCheckedChange={(checked) =>
										setIncludeStent(checked === true)
									}
								/>
								<span className="text-sm">Stent Invoices</span>
							</label>
							<p className="text-muted-foreground text-xs">
								{includeStandard && includeStent
									? "Both categories selected"
									: includeStandard
										? "Standard Invoices only"
										: includeStent
											? "Stent Invoices only"
											: "Select at least one category"}
							</p>
						</div>
					</div>

					<div className="space-y-2">
						<p className="font-medium text-sm">PDF Extras</p>
						<div className="flex flex-wrap items-center gap-4">
							<label
								className="inline-flex items-center gap-2"
								htmlFor="show-signature-in-pdf"
							>
								<Checkbox
									id="show-signature-in-pdf"
									checked={showSign}
									onCheckedChange={(checked) => setShowSign(checked === true)}
								/>
								<span className="text-sm">Show signature in PDF</span>
							</label>
							<label
								className="inline-flex items-center gap-2"
								htmlFor="show-seal-in-pdf"
							>
								<Checkbox
									id="show-seal-in-pdf"
									checked={showSeal}
									onCheckedChange={(checked) => setShowSeal(checked === true)}
								/>
								<span className="text-sm">Show seal in PDF</span>
							</label>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Statement Rows</CardTitle>
					<CardDescription>
						Each row represents one invoice in the selected period.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					{statementQuery.isFetching ? (
						<p className="text-muted-foreground text-sm">
							Loading statement rows...
						</p>
					) : null}
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>S.No</TableHead>
								<TableHead>Date</TableHead>
								<TableHead>Invoice no</TableHead>
								<TableHead className="text-right">Quantity</TableHead>
								<TableHead className="text-right">Amount</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{rows.length > 0 ? (
								rows.map((row, index) => (
									<TableRow key={`${row.invoiceNo}-${index}`}>
										<TableCell>{index + 1}</TableCell>
										<TableCell>{row.date}</TableCell>
										<TableCell>{row.invoiceNo}</TableCell>
										<TableCell className="text-right">{row.quantity}</TableCell>
										<TableCell className="text-right">
											{formatMoney(row.amount)}
										</TableCell>
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell
										colSpan={5}
										className="py-8 text-center text-muted-foreground"
									>
										No statement rows available for the selected filters.
									</TableCell>
								</TableRow>
							)}
							<TableRow>
								<TableCell colSpan={4} className="text-right font-medium">
									Total
								</TableCell>
								<TableCell className="text-right font-semibold">
									{formatMoney(totalAmount)}
								</TableCell>
							</TableRow>
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	);
}
