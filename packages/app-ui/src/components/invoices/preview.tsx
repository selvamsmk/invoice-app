import { useMutation, useQuery } from "@tanstack/react-query";
import { Download, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Loader from "@/components/loader";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardTitle,
} from "@/components/ui/card";
import { useAppContext } from "@/hooks/useAppContext";

export interface Invoice {
	id: string;
	invoiceNumber: string;
	buyerName: string;
	buyerCity: string;
	buyerState: string;
	amount: number;
	totalAmount: number;
	status: string;
	invoiceDate: string;
	dueDate?: string;
	dcDate?: string;
	dcNumber?: string;
	dispatchedThrough?: string;
	createdAt: string;
	isFinalized: boolean;
	invoiceType: string;
	lineItems?: {
		id?: string;
		name: string;
		hsnCode?: string;
		expiryDate?: string;
		quantity: number;
		rate: number;
		gstPercentage?: number;
		amount: number;
	}[];
}

interface InvoicePreviewProps {
	selectedInvoice?: Invoice;
}

export function InvoicePreview({ selectedInvoice }: InvoicePreviewProps) {
	const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
	const [isLoadingPreview, setIsLoadingPreview] = useState(false);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const { orpc } = useAppContext();

	// Fetch company data from API
	const companyQuery = useQuery(orpc.getCompany.queryOptions());
	const companyData = companyQuery.data;

	// renderPDF mutation
	const renderPDFMutation = useMutation(orpc.renderPDF.mutationOptions());

	useEffect(() => {
		let mounted = true;
		async function fetchPreview() {
			if (!selectedInvoice || typeof window === "undefined") return;

			setIsLoadingPreview(true);
			setPreviewUrl(null);

			try {
				const resp = await renderPDFMutation.mutateAsync({
					id: selectedInvoice.id,
				});
				if (!resp || !resp.pdfBase64) return;
				const base64 = await resp.pdfBase64;
				const byteChars = atob(base64);
				const byteNumbers = new Array(byteChars.length);
				for (let i = 0; i < byteChars.length; i++) {
					byteNumbers[i] = byteChars.charCodeAt(i);
				}
				const byteArray = new Uint8Array(byteNumbers);
				const blob = new Blob([byteArray], { type: "application/pdf" });
				const url = URL.createObjectURL(blob);
				if (mounted) {
					setPreviewUrl(url);
					setIsLoadingPreview(false);
				}
			} catch (err) {
				if (mounted) setIsLoadingPreview(false);
				// ignore preview errors
			}
		}
		fetchPreview();
		return () => {
			mounted = false;
			if (previewUrl) {
				URL.revokeObjectURL(previewUrl);
			}
		};
	}, [selectedInvoice, companyData]);

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat("en-IN", {
			style: "currency",
			currency: "INR",
			minimumFractionDigits: 2,
		}).format(amount / 100);
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-IN", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
		});
	};

	if (!selectedInvoice) {
		return (
			<Card className="flex min-h-0 w-full flex-1 flex-col items-center justify-center">
				<CardContent className="text-center">
					<FileText className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
					<CardTitle className="mb-2">Invoice Preview</CardTitle>
					<CardDescription>
						Select an invoice from the list to preview it here
					</CardDescription>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="flex h-full min-h-0 w-full flex-col">
			<div className="mb-4 flex shrink-0 items-center justify-between">
				<div>
					<h3 className="font-semibold text-lg">
						{selectedInvoice.invoiceNumber}
					</h3>
					<p className="text-muted-foreground text-sm">
						{selectedInvoice.buyerName} •{" "}
						{formatCurrency(selectedInvoice.totalAmount)}
					</p>
				</div>
				{typeof window !== "undefined" && selectedInvoice ? (
					<Button
						onClick={async () => {
							setIsGeneratingPDF(true);
							try {
								const resp = await renderPDFMutation.mutateAsync({
									id: selectedInvoice.id,
								});
								if (!resp || !resp.pdfBase64)
									throw new Error("Failed to generate PDF");
								const base64 = await resp.pdfBase64;
								const byteChars = atob(base64);
								const byteNumbers = new Array(byteChars.length);
								for (let i = 0; i < byteChars.length; i++) {
									byteNumbers[i] = byteChars.charCodeAt(i);
								}
								const byteArray = new Uint8Array(byteNumbers);
								const blob = new Blob([byteArray], { type: "application/pdf" });
								const url = URL.createObjectURL(blob);
								const link = document.createElement("a");
								link.href = url;
								link.download = `${selectedInvoice.invoiceNumber}.pdf`;
								document.body.appendChild(link);
								link.click();
								document.body.removeChild(link);
								URL.revokeObjectURL(url);
							toast.success("Invoice downloaded successfully", {
								description: `${selectedInvoice.invoiceNumber}.pdf`,
								position: "top-right",
							});
						} catch (err) {
							// eslint-disable-next-line no-console
							console.error("Error generating PDF", err);
							toast.error("Failed to download invoice", {
								description: "Please try again",
								position: "top-left",
							});
							} finally {
								setIsGeneratingPDF(false);
							}
						}}
						disabled={isGeneratingPDF}
						className="flex items-center gap-2"
					>
						<Download className="h-4 w-4" />
						{isGeneratingPDF ? "Generating..." : "Download PDF"}
					</Button>
				) : (
					<Button disabled className="flex items-center gap-2">
						<Download className="h-4 w-4" />
						Download PDF
					</Button>
				)}
			</div>
			<div className="flex-1 overflow-hidden">
				{typeof window !== "undefined" ? (
					<div className="h-full w-full">
						{isLoadingPreview ? (
							<Loader />
						) : previewUrl ? (
							<iframe
								title="Invoice Preview"
								src={previewUrl}
								style={{ width: "100%", height: "100%", border: "none" }}
							/>
						) : (
							<Card className="flex h-full items-center justify-center">
								<CardContent className="text-center">
									<FileText className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
									<CardDescription>Failed to load preview</CardDescription>
								</CardContent>
							</Card>
						)}
					</div>
				) : (
					<Card className="h-full w-full border p-4">
						<CardTitle>
							{companyData?.companyName || "Your Company Name"}
						</CardTitle>
						<CardDescription>
							{companyData?.addressLine1 || "Address not available"}
						</CardDescription>

						<div className="mt-4">
							<h4 className="font-medium text-sm">Bill To</h4>
							<p className="text-sm">{selectedInvoice.buyerName}</p>
							<p className="text-muted-foreground text-sm">
								{selectedInvoice.buyerCity}, {selectedInvoice.buyerState}
							</p>
						</div>

						<div className="mt-4">
							<h4 className="font-medium text-sm">Invoice Details</h4>
							<p className="text-sm">
								Date: {formatDate(selectedInvoice.invoiceDate)}
							</p>
							<p className="text-sm">
								Due:{" "}
								{selectedInvoice.dueDate
									? formatDate(selectedInvoice.dueDate)
									: "-"}
							</p>
							<p className="text-sm">Status: {selectedInvoice.status}</p>
						</div>

						<div className="mt-4">
							<h4 className="font-medium text-sm">Total</h4>
							<p className="font-semibold text-lg">
								{formatCurrency(selectedInvoice.totalAmount)}
							</p>
						</div>
					</Card>
				)}
			</div>
		</div>
	);
}
