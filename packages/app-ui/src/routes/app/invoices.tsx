import type { Buyer, Product } from "@invoice-app/api";
import { useForm } from "@tanstack/react-form";
import { createFileRoute } from "@tanstack/react-router";
import { useDragAndDrop } from "fluid-dnd/react";
import { Edit as EditIcon, Eye, FileText, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import BuyerSelector from "@/components/invoices/BuyerSelector";
import InvoiceList from "@/components/invoices/InvoiceList";
import LineItems from "@/components/invoices/LineItems";
import ProductSelector from "@/components/invoices/ProductSelector";
import { type Invoice, InvoicePreview } from "@/components/invoices/preview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePickerInput } from "@/components/ui/date-picker";
import { Field, FieldLabel, FieldMessage } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Table, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useBuyersProducts from "@/hooks/useBuyersProducts";
import useInvoices from "@/hooks/useInvoices";
import { formatCurrency, formatDate } from "@/lib/formatters";
import InvoiceFormShell from "@/components/invoices/InvoiceFormShell";

export const Route = createFileRoute("/app/invoices")({
	component: Invoices,
});

type InvoiceFormValues = {
	invoiceNumber: string;
	invoiceType: string;
	invoiceDate: string;
	dueDate?: string;
	dcDate: string;
	dcNumber: string;
	dispatchedThrough: string;
};

type BatchDetail = {
	id: string;
	batchNo?: string;
	expiryDate?: string;
	quantity: number;
};

type InvoiceLineItem = {
	id: string;
	productId: string;
	name: string;
	hsnCode: string;
	batches: BatchDetail[];
	rate: number;
	gstPercentage: number;
	amount: number;
};

type RawBatch = {
	id?: string;
	batchNo?: string | null;
	expiryDate?: string | null;
	quantity?: number | null;
};

type RawProduct = {
	id?: string;
	name?: string;
	hsnCode?: string;
	gstPercentage?: number;
	defaultRate?: number;
};

type RawLineItem = {
	id?: string;
	productId?: string;
	product?: RawProduct | null;
	productName?: string;
	hsnCode?: string;
	name?: string;
	rate?: number;
	baseAmount?: number;
	gstPercentage?: number;
	totalAmount?: number;
	total_amount?: number;
	batches?: RawBatch[];
};

type RawInvoice = {
	id: string;
	buyer?: Buyer | null;
	buyerId?: string;
	buyerName?: string;
	buyerAddressLine1?: string;
	buyerAddressLine2?: string | null;
	buyerAddressLine3?: string | null;
	buyerCity?: string;
	buyerState?: string;
	buyerCountry?: string;
	buyerPincode?: string;
	buyerGstin?: string | null;
	buyerMobileNumber?: string | null;
	buyerEmailAddress?: string | null;
	buyerDrugLicenseNumber?: string | null;
	buyerStateCode?: string | null;
	invoiceNumber?: string;
	invoice_number?: string;
	invoiceNo?: string;
	invoice_no?: string;
	invoiceType?: string;
	invoice_type?: string;
	invoiceDate?: string;
	invoice_date?: string;
	dueDate?: string;
	due_date?: string;
	dcDate?: string;
	dc_date?: string;
	dcNumber?: string;
	dc_number?: string;
	dispatchedThrough?: string;
	dispatched_through?: string;
	totalAmount?: number;
	total_amount?: number;
	total?: number;
	status?: string;
	isFinalized?: boolean;
	createdAt?: string | Date;
	updatedAt?: string | Date;
	lineItems?: RawLineItem[];
};

type InvoiceSource = RawInvoice & {
	lineItems?: RawLineItem[];
};

type BatchPayload = {
	batchNo?: string;
	expiryDate?: string;
	quantity: number;
	sortOrder: number;
};

type LineItemPayload = {
	productId: string;
	productName: string;
	hsnCode: string;
	rate: number;
	gstPercentage: number;
	baseAmount: number;
	taxAmount: number;
	totalAmount: number;
	sortOrder: number;
	batches: BatchPayload[];
};

type InvoicePayload = {
	invoiceNumber: string;
	invoiceType: string;
	invoiceDate: string;
	dueDate?: string;
	dcDate?: string;
	dcNumber?: string;
	dispatchedThrough?: string;
	status: string;
	isFinalized: boolean;
	subtotalAmount: number;
	taxAmount: number;
	totalAmount: number;
	buyerId: string;
	buyerName: string;
	buyerAddressLine1: string;
	buyerAddressLine2?: string;
	buyerAddressLine3?: string;
	buyerCity: string;
	buyerState: string;
	buyerCountry: string;
	buyerPincode: string;
	buyerGstin: string;
	buyerMobileNumber?: string;
	buyerEmailAddress?: string;
	buyerDrugLicenseNumber?: string;
	buyerStateCode?: string;
	notes?: string;
	termsAndConditions?: string;
	lineItems: LineItemPayload[];
};

function Invoices() {
	const [invoices, setInvoices] = useState<Invoice[]>([]);

	const {
		list: invoicesQuery,
		create: createInvoiceMutation,
		update: updateInvoiceMutation,
		remove: deleteInvoiceMutation,
	} = useInvoices();

	useEffect(() => {
		if (invoicesQuery.data) {
			// Normalize invoices and line items into the shape used by the preview/pdf components
			const rawInvoices = (invoicesQuery.data ?? []) as unknown as InvoiceSource[];
			const normalized = rawInvoices.map((inv) => {
				const rawLineItems = inv.lineItems ?? [];
				const lineItems = rawLineItems.map((li) => {
					const batches = li.batches ?? [];
					const totalQuantity = batches.reduce(
						(s, batch) => s + (batch.quantity ?? 0),
						0,
					);
					const expiryDate =
						batches.length > 0
							? batches
									.map((batch) => batch.expiryDate)
									.filter((date): date is string => Boolean(date))
									.join(", ")
							: undefined;
					return {
						id: li.id,
						name: li.productName ?? li.product?.name ?? li.name ?? "",
						hsnCode: li.hsnCode ?? li.product?.hsnCode,
						// Combine expiry dates (if multiple batches) or use first
						expiryDate,
						quantity: totalQuantity,
						batches: batches.map((batch) => ({
							id: batch.id,
							batchNo: batch.batchNo ?? "",
							expiryDate: batch.expiryDate ?? undefined,
							quantity: batch.quantity ?? 1,
						})),
						// rate and amounts are already in rupees — do not convert
						rate: li.rate ?? li.baseAmount ?? 0,
						gstPercentage: li.gstPercentage ?? li.product?.gstPercentage ?? 0,
						amount: li.totalAmount ?? li.total_amount ?? li.baseAmount ?? 0,
					};
				});

				return {
					...inv,
					dcDate: inv.dcDate ?? inv.dc_date ?? undefined,
					dcNumber: inv.dcNumber ?? inv.dc_number ?? undefined,
					dispatchedThrough:
						inv.dispatchedThrough ?? inv.dispatched_through ?? undefined,
					// Ensure invoice-level amount exists (already in rupees)
					amount: inv.totalAmount ?? inv.total_amount ?? inv.total ?? 0,
					// Attach normalized line items
					lineItems,
				} as Invoice;
			});

			setInvoices(normalized);
		}
	}, [invoicesQuery.data]);

	// Fetch buyers and products from API
	const { buyers, products } = useBuyersProducts();

	const handleEditInvoice = (invoice: Invoice) => {
		// Try to find raw invoice from query data (includes batches)
		const rawInvoices = (invoicesQuery.data ?? []) as unknown as InvoiceSource[];
		const raw =
			rawInvoices.find((i) => i.id === invoice.id) ??
			(invoice as InvoiceSource);

		const normalizeDateInput = (
			value: string | Date | null | undefined,
		): string => {
			if (!value) return "";
			const parsed = new Date(value);
			if (Number.isNaN(parsed.getTime())) {
				return typeof value === "string" ? (value.split("T")[0] ?? "") : "";
			}
			return parsed.toISOString().split("T")[0] ?? "";
		};

		// Prefill buyer
		const now = new Date();
		const buyer =
			raw.buyer ??
			({
				id: raw.buyerId ?? "",
				name: raw.buyerName ?? "",
				addressLine1: raw.buyerAddressLine1 ?? "",
				addressLine2: raw.buyerAddressLine2 ?? null,
				addressLine3: raw.buyerAddressLine3 ?? null,
				city: raw.buyerCity ?? "",
				state: raw.buyerState ?? "",
				country: raw.buyerCountry ?? "India",
				pincode: raw.buyerPincode ?? "",
				gstin: raw.buyerGstin ?? null,
				mobileNumber: raw.buyerMobileNumber ?? null,
				emailAddress: raw.buyerEmailAddress ?? null,
				drugLicenseNumber: raw.buyerDrugLicenseNumber ?? null,
				stateCode: raw.buyerStateCode ?? null,
				totalInvoices: 0,
				createdAt: now,
				updatedAt: now,
			} as Buyer);

		setSelectedBuyer(buyer);
		setEditableBuyerData(buyer);

		// Map line items with batches into UI shape
		const mappedLineItems: InvoiceLineItem[] = (raw.lineItems ?? []).map(
			(li) => ({
				id:
					li.id ||
					`line-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
				productId: li.productId || li.product?.id || "",
				name: li.productName ?? li.product?.name ?? li.name ?? "",
				hsnCode: li.hsnCode ?? li.product?.hsnCode ?? "",
				batches: (li.batches ?? []).map((batch) => ({
					id:
						batch.id ||
						`batch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
					batchNo: batch.batchNo ?? "",
					expiryDate: batch.expiryDate ?? "",
					quantity: batch.quantity ?? 1,
				})),
				rate: li.rate ?? li.baseAmount ?? 0,
				gstPercentage: li.gstPercentage ?? li.product?.gstPercentage ?? 0,
				amount: li.totalAmount ?? li.total_amount ?? li.baseAmount ?? 0,
			}),
		);

		setLineItems(mappedLineItems);
		setEditingInvoiceId(invoice.id);
		// Use raw data (which includes original invoiceNumber / dueDate keys)
		const invoiceNumberValue =
			raw.invoiceNumber ??
			raw.invoice_number ??
			raw.invoiceNo ??
			raw.invoice_no ??
			invoice.invoiceNumber ??
			"";
		const invoiceTypeValue =
			raw.invoiceType ??
			raw.invoice_type ??
			invoice.invoiceType ??
			"TAX INVOICE";
		setPendingEditValues({
			invoiceNumber: String(invoiceNumberValue ?? ""),
			invoiceType: String(invoiceTypeValue ?? "TAX INVOICE"),
			invoiceDate: normalizeDateInput(
				raw.invoiceDate ?? raw.invoice_date ?? invoice.invoiceDate ?? "",
			),
			dueDate: normalizeDateInput(
				raw.dueDate ?? raw.due_date ?? invoice.dueDate ?? "",
			),
			dcDate: normalizeDateInput(raw.dcDate ?? raw.dc_date ?? ""),
			dcNumber: String(raw.dcNumber ?? raw.dc_number ?? ""),
			dispatchedThrough: String(
				raw.dispatchedThrough ?? raw.dispatched_through ?? "",
			),
		});
		setActiveTab("edit");
	};

	const handleDeleteInvoice = async (id: string) => {
		if (!confirm("Delete this invoice? This cannot be undone.")) return;
		try {
			await deleteInvoiceMutation.mutateAsync({ id });
			// Optionally update local state for immediate UI
			setInvoices((prev) => prev.filter((inv) => inv.id !== id));
		} catch (err) {
			// eslint-disable-next-line no-console
			console.error("Delete failed", err);
		}
	};

	// Tab state
	const [activeTab, setActiveTab] = useState("list");

	// Selected invoice for preview
	const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

	// Invoice creation state
	const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null);
	const [editableBuyerData, setEditableBuyerData] = useState<Buyer | null>(
		null,
	);
	const [selectedProductId, setSelectedProductId] = useState<string>("");
	const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
	const [pendingEditValues, setPendingEditValues] =
		useState<InvoiceFormValues | null>(null);

	const [parent, lineItems, setLineItems] =
		useDragAndDrop<InvoiceLineItem, HTMLDivElement>([]);

	const invoiceLineItemFields = new Set<keyof InvoiceLineItem>([
		"id",
		"productId",
		"name",
		"hsnCode",
		"batches",
		"rate",
		"gstPercentage",
		"amount",
	]);

	const isInvoiceLineItemField = (
		field: string,
	): field is keyof InvoiceLineItem =>
		invoiceLineItemFields.has(field as keyof InvoiceLineItem);

	const batchDetailFields = new Set<keyof BatchDetail>([
		"id",
		"batchNo",
		"expiryDate",
		"quantity",
	]);

	const isBatchDetailField = (field: string): field is keyof BatchDetail =>
		batchDetailFields.has(field as keyof BatchDetail);

	// Invoice form
	const defaultValues: InvoiceFormValues = {
		invoiceNumber: "",
		invoiceType: "TAX INVOICE",
		invoiceDate: new Date().toISOString().slice(0, 10),
		dueDate: "",
		dcDate: "",
		dcNumber: "",
		dispatchedThrough: "",
	};

	const invoiceForm = useForm({
		defaultValues,
		onSubmit: async ({ value }) => {
			if (!editableBuyerData || lineItems.length === 0) return;

			// Compute per-line totals (in rupees) and invoice totals
			const lineItemsForApi: LineItemPayload[] = lineItems.map((item, idx) => {
				const totalQuantity = item.batches.reduce(
					(batchSum, batch) => batchSum + batch.quantity,
					0,
				);
				const baseAmount = totalQuantity * item.rate;
				const taxAmount = (baseAmount * item.gstPercentage) / 100;
				const totalAmount = baseAmount + taxAmount;

				return {
					productId: item.productId,
					productName: item.name,
					hsnCode: item.hsnCode || "",
					rate: Math.round(item.rate),
					gstPercentage: item.gstPercentage,
					baseAmount: Math.round(baseAmount),
					taxAmount: Math.round(taxAmount),
					totalAmount: Math.round(totalAmount),
					sortOrder: idx,
					batches: item.batches.map((b, bi) => ({
						batchNo: b.batchNo || "",
						expiryDate: b.expiryDate || undefined,
						quantity: b.quantity,
						sortOrder: bi,
					})),
				};
			});

			const subtotalPaise = lineItemsForApi.reduce(
				(s, li) => s + (li.baseAmount || 0),
				0,
			);
			const taxPaise = lineItemsForApi.reduce(
				(s, li) => s + (li.taxAmount || 0),
				0,
			);
			const totalPaise = lineItemsForApi.reduce(
				(s, li) => s + (li.totalAmount || 0),
				0,
			);

			const payload: InvoicePayload = {
				invoiceNumber: value.invoiceNumber,
				invoiceType: value.invoiceType,
				invoiceDate: value.invoiceDate,
				dueDate: value.dueDate || undefined,
				dcDate: value.dcDate || undefined,
				dcNumber: value.dcNumber || undefined,
				dispatchedThrough: value.dispatchedThrough || undefined,
				status: "Draft",
				isFinalized: false,
				subtotalAmount: subtotalPaise,
				taxAmount: taxPaise,
				totalAmount: totalPaise,
				buyerId: selectedBuyer?.id ?? editableBuyerData.id,
				buyerName: editableBuyerData.name,
				buyerAddressLine1: editableBuyerData.addressLine1 ?? "",
				buyerAddressLine2: editableBuyerData.addressLine2 ?? undefined,
				buyerAddressLine3: editableBuyerData.addressLine3 ?? undefined,
				buyerCity: editableBuyerData.city ?? "",
				buyerState: editableBuyerData.state ?? "",
				buyerCountry: editableBuyerData.country ?? "India",
				buyerPincode: editableBuyerData.pincode ?? "",
				buyerGstin: editableBuyerData.gstin ?? "",
				buyerMobileNumber: editableBuyerData.mobileNumber ?? undefined,
				buyerEmailAddress: editableBuyerData.emailAddress ?? undefined,
				buyerDrugLicenseNumber:
					editableBuyerData.drugLicenseNumber ?? undefined,
				buyerStateCode: editableBuyerData.stateCode ?? undefined,
				notes: undefined,
				termsAndConditions: undefined,
				lineItems: lineItemsForApi,
			};

			try {
				if (editingInvoiceId) {
					// Update existing invoice
					await updateInvoiceMutation.mutateAsync({
						id: editingInvoiceId,
						...payload,
					});
					setEditingInvoiceId(null);
				} else {
					// Create new invoice
					await createInvoiceMutation.mutateAsync(payload);
				}

				// After successful create/update, reset local UI and switch back to list
				setActiveTab("list");
				setSelectedBuyer(null);
				setEditableBuyerData(null);
				setLineItems([]);
				setSelectedProductId("");
				invoiceForm.reset();
			} catch (err) {
				// eslint-disable-next-line no-console
				console.error("Invoice create/update failed", err);
			}
		},
	});

	useEffect(() => {
		if (activeTab !== "edit" || !pendingEditValues) return;
		if (typeof invoiceForm.setFieldValue === "function") {
			invoiceForm.setFieldValue(
				"invoiceNumber",
				pendingEditValues.invoiceNumber,
			);
			invoiceForm.setFieldValue("invoiceType", pendingEditValues.invoiceType);
			invoiceForm.setFieldValue("invoiceDate", pendingEditValues.invoiceDate);
			invoiceForm.setFieldValue("dueDate", pendingEditValues.dueDate);
			invoiceForm.setFieldValue("dcDate", pendingEditValues.dcDate);
			invoiceForm.setFieldValue("dcNumber", pendingEditValues.dcNumber);
			invoiceForm.setFieldValue(
				"dispatchedThrough",
				pendingEditValues.dispatchedThrough,
			);
		} else {
			invoiceForm.reset(pendingEditValues);
		}
		setPendingEditValues(null);
	}, [activeTab, invoiceForm, pendingEditValues]);

	const handleBuyerSelect = (buyer: Buyer) => {
		setSelectedBuyer(buyer);
		setEditableBuyerData({ ...buyer }); // Create editable copy
	};

	const handleAddProduct = (product: Product) => {
		const defaultBatch: BatchDetail = {
			id: `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			batchNo: "",
			expiryDate: "",
			quantity: 1,
		};

		const newLineItem: InvoiceLineItem = {
			id: `line-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			productId: product.id,
			name: product.name,
			hsnCode: product.hsnCode,
			batches: [defaultBatch],
			rate: product.defaultRate,
			gstPercentage: product.gstPercentage,
			amount: product.defaultRate,
		};
		setLineItems([...lineItems, newLineItem]);
		setSelectedProductId(""); // Clear the select field after adding product
	};

	const handleLineItemChange = <Field extends keyof InvoiceLineItem>(
		id: string,
		field: Field,
		value: InvoiceLineItem[Field],
	) => {
		setLineItems(
			lineItems.map((item) => {
				if (item.id === id) {
					const updatedItem = {
						...item,
						[field]: value,
					} as InvoiceLineItem;
					// Update amount calculation: (Rate × Total Quantity) + Tax
					if (
						field === "rate" ||
						field === "gstPercentage" ||
						field === "batches"
					) {
						const totalQuantity = updatedItem.batches.reduce(
							(sum, batch) => sum + batch.quantity,
							0,
						);
						const baseAmount = totalQuantity * updatedItem.rate;
						const taxAmount = (baseAmount * updatedItem.gstPercentage) / 100;
						updatedItem.amount = baseAmount + taxAmount;
					}
					return updatedItem;
				}
				return item;
			}),
		);
	};

	const handleBatchChange = <Field extends keyof BatchDetail>(
		lineItemId: string,
		batchId: string,
		field: Field,
		value: BatchDetail[Field],
	) => {
		setLineItems(
			lineItems.map((item) => {
				if (item.id === lineItemId) {
					const updatedBatches = item.batches.map((batch) =>
						batch.id === batchId ? { ...batch, [field]: value } : batch,
					);
					const updatedItem = { ...item, batches: updatedBatches };

					// Recalculate amount
					const totalQuantity = updatedBatches.reduce(
						(sum, batch) => sum + batch.quantity,
						0,
					);
					const baseAmount = totalQuantity * updatedItem.rate;
					const taxAmount = (baseAmount * updatedItem.gstPercentage) / 100;
					updatedItem.amount = baseAmount + taxAmount;

					return updatedItem;
				}
				return item;
			}),
		);
	};

	const handleAddBatch = (lineItemId: string) => {
		setLineItems(
			lineItems.map((item) => {
				if (item.id === lineItemId) {
					const newBatch: BatchDetail = {
						id: `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
						batchNo: "",
						expiryDate: "",
						quantity: 1,
					};
					const updatedBatches = [...item.batches, newBatch];
					const updatedItem = { ...item, batches: updatedBatches };

					// Recalculate amount
					const totalQuantity = updatedBatches.reduce(
						(sum, batch) => sum + batch.quantity,
						0,
					);
					const baseAmount = totalQuantity * updatedItem.rate;
					const taxAmount = (baseAmount * updatedItem.gstPercentage) / 100;
					updatedItem.amount = baseAmount + taxAmount;

					return updatedItem;
				}
				return item;
			}),
		);
	};

	const handleRemoveBatch = (lineItemId: string, batchId: string) => {
		setLineItems(
			lineItems.map((item) => {
				if (item.id === lineItemId && item.batches.length > 1) {
					const updatedBatches = item.batches.filter(
						(batch) => batch.id !== batchId,
					);
					const updatedItem = { ...item, batches: updatedBatches };

					// Recalculate amount
					const totalQuantity = updatedBatches.reduce(
						(sum, batch) => sum + batch.quantity,
						0,
					);
					const baseAmount = totalQuantity * updatedItem.rate;
					const taxAmount = (baseAmount * updatedItem.gstPercentage) / 100;
					updatedItem.amount = baseAmount + taxAmount;

					return updatedItem;
				}
				return item;
			}),
		);
	};

	const handleRemoveLineItem = (id: string) => {
		setLineItems(lineItems.filter((item) => item.id !== id));
	};

	const handleCreateInvoiceClick = () => {
		// clear edit state when creating fresh invoice
		setEditingInvoiceId(null);
		setSelectedBuyer(null);
		setEditableBuyerData(null);
		setLineItems([]);
		invoiceForm.reset();
		setActiveTab("create");
	};

	const handlePreviewInvoice = (invoice: Invoice) => {
		setSelectedInvoice(invoice);
		setActiveTab("preview");
	};

	// Sort invoices in reverse chronological order
	const sortedInvoices = [...invoices].sort(
		(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
	);

	const getStatusBadge = (status: string) => {
		const styles = {
			Paid: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
			Pending:
				"bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
			Draft: "bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-400",
			Overdue: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
		};

		return (
			<span
				className={`rounded-full px-2 py-1 font-medium text-xs ${styles[status as keyof typeof styles]}`}
			>
				{status}
			</span>
		);
	};

	return (
		<div className="flex h-full min-h-0 w-full flex-col">
			<Tabs
				className="flex min-h-0 flex-1 flex-col"
				value={activeTab}
				onValueChange={(v) => setActiveTab(v)}
			>
				<div className="mb-3 shrink-0">
					<div className="flex items-center gap-3">
						<FileText className="h-8 w-8 text-primary" />
						<h2 className="font-semibold text-lg">Invoices</h2>
					</div>
				</div>

				<div className="mb-6 shrink-0">
					<TabsList className="flex items-center gap-2">
						<TabsTrigger value="list" className="flex items-center gap-2">
							List
						</TabsTrigger>

						<TabsTrigger
							value="create"
							className="flex items-center gap-2"
							onClick={handleCreateInvoiceClick}
						>
							<Plus className="h-4 w-4" />
							Create Invoice
						</TabsTrigger>

						<TabsTrigger
							value="edit"
							className={`flex items-center gap-2 ${!editingInvoiceId ? "pointer-events-none opacity-50" : ""}`}
							aria-disabled={!editingInvoiceId}
						>
							<EditIcon className="h-4 w-4" />
							Edit Invoice
						</TabsTrigger>

						<TabsTrigger value="preview" className="flex items-center gap-2">
							<Eye className="h-4 w-4" />
							Preview
						</TabsTrigger>
					</TabsList>
				</div>

				<TabsContent value="list" className="flex min-h-0 flex-1 flex-col">
					<div className="min-h-0 flex-1 overflow-hidden rounded-md border">
						<div className="h-full max-h-full overflow-y-auto">
							<Table className="relative table-fixed">
								<TableHeader className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
									<TableRow>
										<TableHead className="w-35">Invoice No.</TableHead>
										<TableHead className="w-25">Date</TableHead>
										<TableHead className="w-50">Buyer</TableHead>
										<TableHead className="w-30">Location</TableHead>
										<TableHead className="w-32.5 text-right">Amount</TableHead>
										<TableHead className="w-25">Due Date</TableHead>
										<TableHead className="w-25">Status</TableHead>
										<TableHead className="w-37.5 text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<InvoiceList
									invoices={sortedInvoices}
									formatCurrency={formatCurrency}
									formatDate={formatDate}
									getStatusBadge={getStatusBadge}
									onEdit={handleEditInvoice}
									onDelete={handleDeleteInvoice}
									onPreview={handlePreviewInvoice}
								/>
							</Table>
						</div>
					</div>
				</TabsContent>

				<TabsContent value="create" className="flex min-h-0 flex-1 flex-col overflow-hidden">
					<div className="flex min-h-0 flex-1 flex-col">
						<InvoiceFormShell
							invoiceForm={invoiceForm}
							onCancel={() => {
								setActiveTab("list");
								setEditingInvoiceId(null);
								setSelectedBuyer(null);
								setEditableBuyerData(null);
								setLineItems([]);
								invoiceForm.reset();
							}}
							editingInvoiceId={editingInvoiceId}
						>
						<form
							onSubmit={(e) => {
								e.preventDefault();
								e.stopPropagation();
								invoiceForm.handleSubmit();
							}}
							className="space-y-6"
						>
							{/* Invoice Header */}
							<Card className="w-full">
								<CardHeader>
									<CardTitle>Invoice Details</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="grid grid-cols-2 gap-4">
										<invoiceForm.Field
											name="invoiceNumber"
											validators={{
												onBlur: ({ value }) => {
													const result = z
														.string()
														.min(1, "Invoice number is required")
														.safeParse(value);
													return result.success
														? undefined
														: result.error.issues[0]?.message;
												},
											}}
										>
											{(field) => (
												<Field>
													<FieldLabel htmlFor={field.name}>
														Invoice Number *
													</FieldLabel>
													<Input
														id={field.name}
														name={field.name}
														value={field.state.value}
														onBlur={field.handleBlur}
														onChange={(e) => field.handleChange(e.target.value)}
														placeholder="Enter invoice number"
													/>
													{!field.state.meta.isValid && (
														<FieldMessage>
															{field.state.meta.errors.join(", ")}
														</FieldMessage>
													)}
												</Field>
											)}
										</invoiceForm.Field>

										<invoiceForm.Field name="invoiceType">
											{(field) => (
												<Field>
													<FieldLabel htmlFor={field.name}>
														Invoice Type
													</FieldLabel>
													<Input
														id={field.name}
														name={field.name}
														value={field.state.value}
														onBlur={field.handleBlur}
														onChange={(e) => field.handleChange(e.target.value)}
														placeholder="Enter invoice type"
													/>
												</Field>
											)}
										</invoiceForm.Field>
									</div>

									<div className="grid grid-cols-2 gap-4">
										<invoiceForm.Field
											name="invoiceDate"
											validators={{
												onBlur: ({ value }) => {
													const result = z
														.string()
														.min(1, "Invoice date is required")
														.safeParse(value);
													return result.success
														? undefined
														: result.error.issues[0]?.message;
												},
											}}
										>
											{(field) => (
												<Field>
													<FieldLabel htmlFor={field.name}>
														Invoice Date *
													</FieldLabel>
													<DatePickerInput
														id={field.name}
														value={field.state.value}
														onBlur={field.handleBlur}
														onChange={(value) => field.handleChange(value)}
													/>
													{!field.state.meta.isValid && (
														<FieldMessage>
															{field.state.meta.errors.join(", ")}
														</FieldMessage>
													)}
												</Field>
											)}
										</invoiceForm.Field>

										<invoiceForm.Field name="dueDate">
											{(field) => (
												<Field>
													<FieldLabel htmlFor={field.name}>Due Date</FieldLabel>
													<DatePickerInput
														id={field.name}
														value={field.state.value ?? ""}
														onBlur={field.handleBlur}
														onChange={(value) => field.handleChange(value)}
													/>
												</Field>
											)}
										</invoiceForm.Field>
									</div>

									<div className="grid grid-cols-2 gap-4">
										<invoiceForm.Field name="dcNumber">
											{(field) => (
												<Field>
													<FieldLabel htmlFor={field.name}>
														DC Number
													</FieldLabel>
													<Input
														id={field.name}
														name={field.name}
														value={field.state.value}
														onBlur={field.handleBlur}
														onChange={(e) => field.handleChange(e.target.value)}
														placeholder="Enter DC number"
													/>
												</Field>
											)}
										</invoiceForm.Field>

										<invoiceForm.Field name="dcDate">
											{(field) => (
												<Field>
													<FieldLabel htmlFor={field.name}>
														DC Date
													</FieldLabel>
													<DatePickerInput
														id={field.name}
														value={field.state.value ?? ""}
														onBlur={field.handleBlur}
														onChange={(value) => field.handleChange(value)}
													/>
												</Field>
											)}
										</invoiceForm.Field>
									</div>

									<div className="grid grid-cols-2 gap-4">
										<invoiceForm.Field name="dispatchedThrough">
											{(field) => (
												<Field>
													<FieldLabel htmlFor={field.name}>
														Dispatched Through
													</FieldLabel>
													<Input
														id={field.name}
														name={field.name}
														value={field.state.value}
														onBlur={field.handleBlur}
														onChange={(e) => field.handleChange(e.target.value)}
														placeholder="Enter dispatched through"
													/>
												</Field>
											)}
										</invoiceForm.Field>
									</div>
								</CardContent>
							</Card>

							{/* Buyer Selection */}
							<Card className="w-full">
								<CardHeader>
									<CardTitle>Buyer Information</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<BuyerSelector
										buyers={buyers.data}
										selectedBuyer={selectedBuyer}
										editableBuyerData={editableBuyerData}
										onSelect={(b) => handleBuyerSelect(b)}
										onChangeEditable={(b) => setEditableBuyerData(b)}
										onClear={() => {
											setSelectedBuyer(null);
											setEditableBuyerData(null);
										}}
									/>
								</CardContent>
							</Card>

							{/* Product Selection and Line Items */}
							<Card className="w-full">
								<CardHeader>
									<CardTitle>Products</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									{/* Product Selection */}
									<ProductSelector
										products={products.data}
										selectedProductId={selectedProductId}
										onAddProduct={(p) => {
											setSelectedProductId(p.id);
											handleAddProduct(p);
										}}
									/>

									{/* Line Items */}
									{lineItems.length > 0 && (
										<div>
											<h4 className="mb-4 font-medium">
												Invoice Items (Drag to reorder)
											</h4>
											<LineItems
												parent={parent}
												lineItems={lineItems}
												onChange={(id, field, value: unknown) => {
													if (!isInvoiceLineItemField(field)) return;
													handleLineItemChange(
														id,
														field,
														value as InvoiceLineItem[typeof field],
													);
												}}
												onRemove={(id) => handleRemoveLineItem(id)}
												onAddBatch={(id) => handleAddBatch(id)}
												onRemoveBatch={(lineId, batchId) =>
													handleRemoveBatch(lineId, batchId)
												}
												onBatchChange={(
													lineId,
													batchId,
													field,
													value: unknown,
												) => {
													if (!isBatchDetailField(field)) return;
													handleBatchChange(
														lineId,
														batchId,
														field,
														value as BatchDetail[typeof field],
													);
												}}
											/>

											<div className="mt-4 rounded-lg bg-muted p-4">
												<div className="text-right">
													<p className="font-semibold text-lg">
														Total Amount: ₹
														{Math.round(
															lineItems.reduce(
																(sum, item) => sum + item.amount,
																0,
															),
														)}
													</p>
												</div>
											</div>
										</div>
									)}
								</CardContent>
							</Card>
						</form>
						</InvoiceFormShell>
					</div>
				</TabsContent>

				<TabsContent value="edit" className="flex min-h-0 flex-1 flex-col overflow-hidden">
					<div className="flex min-h-0 flex-1 flex-col">
						<InvoiceFormShell
							invoiceForm={invoiceForm}
							onCancel={() => {
								setActiveTab("list");
								setEditingInvoiceId(null);
								setSelectedBuyer(null);
								setEditableBuyerData(null);
								setLineItems([]);
								invoiceForm.reset();
							}}
							editingInvoiceId={editingInvoiceId}
						>
						<form
							onSubmit={(e) => {
								e.preventDefault();
								e.stopPropagation();
								invoiceForm.handleSubmit();
							}}
							className="space-y-6"
						>
							{/* Invoice Header */}
							<Card className="w-full">
								<CardHeader>
									<CardTitle>Edit Invoice</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="grid grid-cols-2 gap-4">
										<invoiceForm.Field
											name="invoiceNumber"
											validators={{
												onBlur: ({ value }) => {
													const result = z
														.string()
														.min(1, "Invoice number is required")
														.safeParse(value);
													return result.success
														? undefined
														: result.error.issues[0]?.message;
												},
											}}
										>
											{(field) => (
												<Field>
													<FieldLabel htmlFor={field.name}>
														Invoice Number *
													</FieldLabel>
													<Input
														id={field.name}
														name={field.name}
														value={field.state.value}
														onBlur={field.handleBlur}
														onChange={(e) => field.handleChange(e.target.value)}
														placeholder="Enter invoice number"
													/>
													{!field.state.meta.isValid && (
														<FieldMessage>
															{field.state.meta.errors.join(", ")}
														</FieldMessage>
													)}
												</Field>
											)}
										</invoiceForm.Field>

										<invoiceForm.Field name="invoiceType">
											{(field) => (
												<Field>
													<FieldLabel htmlFor={field.name}>
														Invoice Type
													</FieldLabel>
													<Input
														id={field.name}
														name={field.name}
														value={field.state.value}
														onBlur={field.handleBlur}
														onChange={(e) => field.handleChange(e.target.value)}
														placeholder="Enter invoice type"
													/>
												</Field>
											)}
										</invoiceForm.Field>
									</div>

									<div className="grid grid-cols-2 gap-4">
										<invoiceForm.Field
											name="invoiceDate"
											validators={{
												onBlur: ({ value }) => {
													const result = z
														.string()
														.min(1, "Invoice date is required")
														.safeParse(value);
													return result.success
														? undefined
														: result.error.issues[0]?.message;
												},
											}}
										>
											{(field) => (
												<Field>
													<FieldLabel htmlFor={field.name}>
														Invoice Date *
													</FieldLabel>
													<DatePickerInput
														id={field.name}
														value={field.state.value}
														onBlur={field.handleBlur}
														onChange={(value) => field.handleChange(value)}
													/>
													{!field.state.meta.isValid && (
														<FieldMessage>
															{field.state.meta.errors.join(", ")}
														</FieldMessage>
													)}
												</Field>
											)}
										</invoiceForm.Field>

										<invoiceForm.Field name="dueDate">
											{(field) => (
												<Field>
													<FieldLabel htmlFor={field.name}>Due Date</FieldLabel>
													<DatePickerInput
														id={field.name}
														value={field.state.value ?? ""}
														onBlur={field.handleBlur}
														onChange={(value) => field.handleChange(value)}
													/>
												</Field>
											)}
										</invoiceForm.Field>
									</div>

									<div className="grid grid-cols-2 gap-4">
										<invoiceForm.Field name="dcNumber">
											{(field) => (
												<Field>
													<FieldLabel htmlFor={field.name}>
														DC Number
													</FieldLabel>
													<Input
														id={field.name}
														name={field.name}
														value={field.state.value}
														onBlur={field.handleBlur}
														onChange={(e) => field.handleChange(e.target.value)}
														placeholder="Enter DC number"
													/>
												</Field>
											)}
										</invoiceForm.Field>

										<invoiceForm.Field name="dcDate">
											{(field) => (
												<Field>
													<FieldLabel htmlFor={field.name}>
														DC Date
													</FieldLabel>
													<DatePickerInput
														id={field.name}
														value={field.state.value ?? ""}
														onBlur={field.handleBlur}
														onChange={(value) => field.handleChange(value)}
													/>
												</Field>
											)}
										</invoiceForm.Field>
									</div>

									<div className="grid grid-cols-2 gap-4">
										<invoiceForm.Field name="dispatchedThrough">
											{(field) => (
												<Field>
													<FieldLabel htmlFor={field.name}>
														Dispatched Through
													</FieldLabel>
													<Input
														id={field.name}
														name={field.name}
														value={field.state.value}
														onBlur={field.handleBlur}
														onChange={(e) => field.handleChange(e.target.value)}
														placeholder="Enter dispatched through"
													/>
												</Field>
											)}
										</invoiceForm.Field>
									</div>
								</CardContent>
							</Card>

							{/* Buyer Selection */}
							<Card className="w-full">
								<CardHeader>
									<CardTitle>Buyer Information</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<BuyerSelector
										buyers={buyers.data}
										selectedBuyer={selectedBuyer}
										editableBuyerData={editableBuyerData}
										onSelect={(b) => handleBuyerSelect(b)}
										onChangeEditable={(b) => setEditableBuyerData(b)}
										onClear={() => {
											setSelectedBuyer(null);
											setEditableBuyerData(null);
										}}
									/>
								</CardContent>
							</Card>

							{/* Product Selection and Line Items */}
							<Card className="w-full">
								<CardHeader>
									<CardTitle>Products</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									{/* Product Selection */}
									<ProductSelector
										products={products.data}
										selectedProductId={selectedProductId}
										onAddProduct={(p) => {
											setSelectedProductId(p.id);
											handleAddProduct(p);
										}}
									/>

									{/* Line Items */}
									{lineItems.length > 0 && (
										<div>
											<h4 className="mb-4 font-medium">
												Invoice Items (Drag to reorder)
											</h4>
											<LineItems
												parent={parent}
												lineItems={lineItems}
												onChange={(id, field, value: unknown) => {
													if (!isInvoiceLineItemField(field)) return;
													handleLineItemChange(
														id,
														field,
														value as InvoiceLineItem[typeof field],
													);
												}}
												onRemove={(id) => handleRemoveLineItem(id)}
												onAddBatch={(id) => handleAddBatch(id)}
												onRemoveBatch={(lineId, batchId) =>
													handleRemoveBatch(lineId, batchId)
												}
												onBatchChange={(
													lineId,
													batchId,
													field,
													value: unknown,
												) => {
													if (!isBatchDetailField(field)) return;
													handleBatchChange(
														lineId,
														batchId,
														field,
														value as BatchDetail[typeof field],
													);
												}}
											/>

											<div className="mt-4 rounded-lg bg-muted p-4">
												<div className="text-right">
													<p className="font-semibold text-lg">
														Total Amount: ₹
														{Math.round(
															lineItems.reduce(
																(sum, item) => sum + item.amount,
																0,
															),
														)}
													</p>
												</div>
											</div>
										</div>
									)}
								</CardContent>
							</Card>
						</form>
						</InvoiceFormShell>
					</div>
				</TabsContent>

				<TabsContent value="preview" className="flex min-h-0 flex-1 flex-col">
					<InvoicePreview selectedInvoice={selectedInvoice ?? undefined} />
				</TabsContent>
			</Tabs>
		</div>
	);
}
