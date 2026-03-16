import type { Buyer, Product } from "@invoice-app/api";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useDragAndDrop } from "fluid-dnd/react";
import { Activity, Edit as EditIcon, Eye, List, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import InvoiceFormShell from "@/components/invoices/InvoiceFormShell";
import StentInvoiceFormFields from "@/components/stent-invoices/StentInvoiceFormFields";
import StentInvoiceList from "@/components/stent-invoices/StentInvoiceList";
import type { StentInvoice } from "@/components/stent-invoices/stent-invoice-types";
import { StentInvoicePreview } from "@/components/stent-invoices/stent-preview";
import { Table, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppContext } from "@/hooks/useAppContext";
import useBuyersProducts from "@/hooks/useBuyersProducts";
import useStentInvoices from "@/hooks/useStentInvoices";
import { formatCurrency, formatDate } from "@/lib/formatters";

export const Route = createFileRoute("/app/stent-invoices")({
	component: StentInvoices,
});

type StentInvoiceFormValues = {
	invoiceNumber: string;
	invoiceType: string;
	invoiceDate: string;
	dueDate?: string;
	dcDate: string;
	dcNumber: string;
	dispatchedThrough: string;
};

type SizeDetail = {
	id: string;
	sizeDimension: string;
	serialNumber: string;
	expiryDate?: string;
	quantity: number;
};

type StentInvoiceLineItem = {
	id: string;
	productId: string;
	name: string;
	hsnCode: string;
	patientName: string;
	patientAge: number;
	patientDate: string;
	patientGender: string;
	sizes: SizeDetail[];
	rate: number;
	gstPercentage: number;
	amount: number;
};

type RawSize = {
	id?: string;
	sizeDimension?: string | null;
	serialNumber?: string | null;
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
	patientName?: string;
	patientAge?: number;
	patientDate?: string;
	patientGender?: string;
	rate?: number;
	baseAmount?: number;
	gstPercentage?: number;
	totalAmount?: number;
	total_amount?: number;
	sizes?: RawSize[];
};

type RawStentInvoice = {
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

type StentInvoiceSource = RawStentInvoice & {
	lineItems?: RawLineItem[];
};

type SizePayload = {
	sizeDimension: string;
	serialNumber: string;
	expiryDate?: string;
	quantity: number;
	sortOrder: number;
};

type LineItemPayload = {
	productId: string;
	productName: string;
	hsnCode: string;
	patientName: string;
	patientAge: number;
	patientDate: string;
	patientGender: "male" | "female";
	rate: number;
	gstPercentage: number;
	baseAmount: number;
	taxAmount: number;
	totalAmount: number;
	sortOrder: number;
	sizes: SizePayload[];
};

type StentInvoicePayload = {
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

function StentInvoices() {
	const [invoices, setInvoices] = useState<StentInvoice[]>([]);
	const { orpc } = useAppContext();

	const {
		list: invoicesQuery,
		create: createInvoiceMutation,
		update: updateInvoiceMutation,
		remove: deleteInvoiceMutation,
	} = useStentInvoices();

	// Add renderPDF mutation for stent invoices
	const renderPDFMutation = useMutation(orpc.renderStentPDF.mutationOptions());

	useEffect(() => {
		if (invoicesQuery.data) {
			// Normalize invoices and line items into the shape used by the preview/pdf components
			const rawInvoices = (invoicesQuery.data ??
				[]) as unknown as StentInvoiceSource[];
			const normalized = rawInvoices.map((inv) => {
				const rawLineItems = inv.lineItems ?? [];
				const lineItems = rawLineItems.map((li) => {
					const sizes = li.sizes ?? [];
					const totalQuantity = sizes.reduce(
						(s, size) => s + (size.quantity ?? 0),
						0,
					);
					return {
						id: li.id,
						name: li.productName ?? li.product?.name ?? li.name ?? "",
						hsnCode: li.hsnCode ?? li.product?.hsnCode,
						patientName: li.patientName ?? "",
						patientAge: li.patientAge ?? 0,
						patientDate: li.patientDate ?? "",
						patientGender: li.patientGender ?? "male",
						quantity: totalQuantity,
						sizes: sizes.map((size) => ({
							id: size.id,
							sizeDimension: size.sizeDimension ?? "",
							serialNumber: size.serialNumber ?? "",
							expiryDate: size.expiryDate ?? undefined,
							quantity: size.quantity ?? 1,
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
				} as StentInvoice;
			});

			setInvoices(normalized);
		}
	}, [invoicesQuery.data]);

	// Fetch buyers and products from API
	const { buyers, products } = useBuyersProducts();

	const handleEditInvoice = (invoice: StentInvoice) => {
		// Try to find raw invoice from query data (includes sizes)
		const rawInvoices = (invoicesQuery.data ??
			[]) as unknown as StentInvoiceSource[];
		const raw =
			rawInvoices.find((i) => i.id === invoice.id) ??
			(invoice as StentInvoiceSource);

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

		// Map line items with sizes into UI shape
		const mappedLineItems: StentInvoiceLineItem[] = (raw.lineItems ?? []).map(
			(li) => ({
				id:
					li.id ||
					`line-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
				productId: li.productId || li.product?.id || "",
				name: li.productName ?? li.product?.name ?? li.name ?? "",
				hsnCode: li.hsnCode ?? li.product?.hsnCode ?? "",
				patientName: li.patientName ?? "",
				patientAge: li.patientAge ?? 0,
				patientDate: li.patientDate ?? "",
				patientGender: li.patientGender ?? "male",
				sizes: (li.sizes ?? []).map((size) => ({
					id:
						size.id ||
						`size-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
					sizeDimension: size.sizeDimension ?? "",
					serialNumber: size.serialNumber ?? "",
					expiryDate: size.expiryDate ?? "",
					quantity: size.quantity ?? 1,
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
		try {
			await deleteInvoiceMutation.mutateAsync({ id });
			// Optionally update local state for immediate UI
			setInvoices((prev) => prev.filter((inv) => inv.id !== id));
			toast.success("Stent invoice deleted successfully");
		} catch (err) {
			// eslint-disable-next-line no-console
			console.error("Delete failed", err);
			toast.error("Failed to delete stent invoice");
		}
	};

	// Tab state
	const [activeTab, setActiveTab] = useState("list");

	// Selected invoice for preview
	const [selectedInvoice, setSelectedInvoice] = useState<StentInvoice | null>(
		null,
	);

	// Invoice creation state
	const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null);
	const [editableBuyerData, setEditableBuyerData] = useState<Buyer | null>(
		null,
	);
	const [selectedProductId, setSelectedProductId] = useState<string>("");
	const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
	const [pendingEditValues, setPendingEditValues] =
		useState<StentInvoiceFormValues | null>(null);

	const [parent, lineItems, setLineItems] = useDragAndDrop<
		StentInvoiceLineItem,
		HTMLDivElement
	>([]);

	const stentInvoiceLineItemFields = new Set<keyof StentInvoiceLineItem>([
		"id",
		"productId",
		"name",
		"hsnCode",
		"patientName",
		"patientAge",
		"patientDate",
		"patientGender",
		"sizes",
		"rate",
		"gstPercentage",
		"amount",
	]);

	const isStentInvoiceLineItemField = (
		field: string,
	): field is keyof StentInvoiceLineItem =>
		stentInvoiceLineItemFields.has(field as keyof StentInvoiceLineItem);

	const sizeDetailFields = new Set<keyof SizeDetail>([
		"id",
		"sizeDimension",
		"serialNumber",
		"expiryDate",
		"quantity",
	]);

	const isSizeDetailField = (field: string): field is keyof SizeDetail =>
		sizeDetailFields.has(field as keyof SizeDetail);

	// Invoice form
	const defaultValues: StentInvoiceFormValues = {
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
				const totalQuantity = item.sizes.reduce(
					(sizeSum, size) => sizeSum + size.quantity,
					0,
				);
				const baseAmount = totalQuantity * item.rate;
				const taxAmount = (baseAmount * item.gstPercentage) / 100;
				const totalAmount = baseAmount + taxAmount;

				return {
					productId: item.productId,
					productName: item.name,
					hsnCode: item.hsnCode || "",
					patientName: item.patientName,
					patientAge: item.patientAge,
					patientDate: item.patientDate,
					patientGender: item.patientGender as "male" | "female",
					rate: Math.round(item.rate),
					gstPercentage: item.gstPercentage,
					baseAmount: Math.round(baseAmount),
					taxAmount: Math.round(taxAmount),
					totalAmount: Math.round(totalAmount),
					sortOrder: idx,
					sizes: item.sizes.map((s, si) => ({
						sizeDimension: s.sizeDimension,
						serialNumber: s.serialNumber,
						expiryDate: s.expiryDate || undefined,
						quantity: s.quantity,
						sortOrder: si,
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

			const payload: StentInvoicePayload = {
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
				console.error("Stent invoice create/update failed", err);
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
		const defaultSize: SizeDetail = {
			id: `size-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			sizeDimension: "",
			serialNumber: "",
			expiryDate: "",
			quantity: 1,
		};

		const newLineItem: StentInvoiceLineItem = {
			id: `line-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			productId: product.id,
			name: product.name,
			hsnCode: product.hsnCode,
			patientName: "",
			patientAge: 0,
			patientDate: new Date().toISOString().slice(0, 10),
			patientGender: "male",
			sizes: [defaultSize],
			rate: product.defaultRate,
			gstPercentage: product.gstPercentage,
			amount: product.defaultRate,
		};
		setLineItems([...lineItems, newLineItem]);
		setSelectedProductId(""); // Clear the select field after adding product
	};

	const handleLineItemChange = <Field extends keyof StentInvoiceLineItem>(
		id: string,
		field: Field,
		value: StentInvoiceLineItem[Field],
	) => {
		setLineItems(
			lineItems.map((item) => {
				if (item.id === id) {
					const updatedItem = {
						...item,
						[field]: value,
					} as StentInvoiceLineItem;
					// Update amount calculation: (Rate × Total Quantity) + Tax
					if (
						field === "rate" ||
						field === "gstPercentage" ||
						field === "sizes"
					) {
						const totalQuantity = updatedItem.sizes.reduce(
							(sum, size) => sum + size.quantity,
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

	const handleSizeChange = <Field extends keyof SizeDetail>(
		lineItemId: string,
		sizeId: string,
		field: Field,
		value: SizeDetail[Field],
	) => {
		setLineItems(
			lineItems.map((item) => {
				if (item.id === lineItemId) {
					const updatedSizes = item.sizes.map((size) =>
						size.id === sizeId ? { ...size, [field]: value } : size,
					);
					const updatedItem = { ...item, sizes: updatedSizes };

					// Recalculate amount
					const totalQuantity = updatedSizes.reduce(
						(sum, size) => sum + size.quantity,
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

	const handleAddSize = (lineItemId: string) => {
		setLineItems(
			lineItems.map((item) => {
				if (item.id === lineItemId) {
					const newSize: SizeDetail = {
						id: `size-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
						sizeDimension: "",
						serialNumber: "",
						expiryDate: "",
						quantity: 1,
					};
					const updatedSizes = [...item.sizes, newSize];
					const updatedItem = { ...item, sizes: updatedSizes };

					// Recalculate amount
					const totalQuantity = updatedSizes.reduce(
						(sum, size) => sum + size.quantity,
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

	const handleRemoveSize = (lineItemId: string, sizeId: string) => {
		setLineItems(
			lineItems.map((item) => {
				if (item.id === lineItemId && item.sizes.length > 1) {
					const updatedSizes = item.sizes.filter((size) => size.id !== sizeId);
					const updatedItem = { ...item, sizes: updatedSizes };

					// Recalculate amount
					const totalQuantity = updatedSizes.reduce(
						(sum, size) => sum + size.quantity,
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

	const handlePreviewInvoice = (invoice: StentInvoice) => {
		setSelectedInvoice(invoice);
		setActiveTab("preview");
	};

	const handleDownloadInvoice = async (invoice: StentInvoice) => {
		try {
			const resp = await renderPDFMutation.mutateAsync({ id: invoice.id });
			if (!resp || !resp.pdfBase64) throw new Error("Failed to generate PDF");
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
			link.download = `${invoice.invoiceNumber}.pdf`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
			toast.success("Stent invoice downloaded successfully", {
				description: `${invoice.invoiceNumber}.pdf`,
				position: "top-right",
			});
		} catch (err) {
			console.error("Error downloading stent invoice", err);
			toast.error("Failed to download stent invoice", {
				description: "Please try again",
				position: "top-left",
			});
		}
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
                <div className="mb-3 flex shrink-0 items-center gap-3">
				    <Activity className="h-8 w-8 text-primary" />
					<div>
						<h2 className="font-semibold text-lg">Stent Invoices</h2>
						<p className="text-muted-foreground text-sm">
							Manage medical device invoices with patient information and size
							tracking
						</p>
					</div>
				</div>

				<div className="mb-6 shrink-0">
					<TabsList className="flex items-center gap-2">
						<TabsTrigger value="list" className="flex items-center gap-2">
							<List className="h-4 w-4" />
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
								<StentInvoiceList
									invoices={sortedInvoices}
									formatCurrency={formatCurrency}
									formatDate={formatDate}
									getStatusBadge={getStatusBadge}
									onEdit={handleEditInvoice}
									onDelete={handleDeleteInvoice}
									onPreview={handlePreviewInvoice}
									onDownload={handleDownloadInvoice}
								/>
							</Table>
						</div>
					</div>
				</TabsContent>

				<TabsContent
					value="create"
					className="flex min-h-0 flex-1 flex-col overflow-hidden"
				>
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
							<StentInvoiceFormFields
								invoiceForm={invoiceForm}
								buyers={buyers.data}
								products={products.data}
								selectedBuyer={selectedBuyer}
								editableBuyerData={editableBuyerData}
								onSelectBuyer={(b) => handleBuyerSelect(b)}
								onChangeEditableBuyer={(b) => setEditableBuyerData(b)}
								onClearBuyer={() => {
									setSelectedBuyer(null);
									setEditableBuyerData(null);
								}}
								selectedProductId={selectedProductId}
								onAddProduct={(p) => {
									setSelectedProductId(p.id);
									handleAddProduct(p);
								}}
								parent={parent}
								lineItems={lineItems}
								onLineItemChange={(id, field, value: unknown) => {
									if (!isStentInvoiceLineItemField(field)) return;
									handleLineItemChange(
										id,
										field,
										value as StentInvoiceLineItem[typeof field],
									);
								}}
								onRemoveLineItem={(id) => handleRemoveLineItem(id)}
								onAddSize={(id) => handleAddSize(id)}
								onRemoveSize={(lineId, sizeId) =>
									handleRemoveSize(lineId, sizeId)
								}
								onSizeChange={(lineId, sizeId, field, value: unknown) => {
									if (!isSizeDetailField(field)) return;
									handleSizeChange(
										lineId,
										sizeId,
										field,
										value as SizeDetail[typeof field],
									);
								}}
							/>
						</InvoiceFormShell>
					</div>
				</TabsContent>

				<TabsContent
					value="edit"
					className="flex min-h-0 flex-1 flex-col overflow-hidden"
				>
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
							<StentInvoiceFormFields
								invoiceForm={invoiceForm}
								buyers={buyers.data}
								products={products.data}
								selectedBuyer={selectedBuyer}
								editableBuyerData={editableBuyerData}
								onSelectBuyer={(b) => handleBuyerSelect(b)}
								onChangeEditableBuyer={(b) => setEditableBuyerData(b)}
								onClearBuyer={() => {
									setSelectedBuyer(null);
									setEditableBuyerData(null);
								}}
								selectedProductId={selectedProductId}
								onAddProduct={(p) => {
									setSelectedProductId(p.id);
									handleAddProduct(p);
								}}
								parent={parent}
								lineItems={lineItems}
								onLineItemChange={(id, field, value: unknown) => {
									if (!isStentInvoiceLineItemField(field)) return;
									handleLineItemChange(
										id,
										field,
										value as StentInvoiceLineItem[typeof field],
									);
								}}
								onRemoveLineItem={(id) => handleRemoveLineItem(id)}
								onAddSize={(id) => handleAddSize(id)}
								onRemoveSize={(lineId, sizeId) =>
									handleRemoveSize(lineId, sizeId)
								}
								onSizeChange={(lineId, sizeId, field, value: unknown) => {
									if (!isSizeDetailField(field)) return;
									handleSizeChange(
										lineId,
										sizeId,
										field,
										value as SizeDetail[typeof field],
									);
								}}
							/>
						</InvoiceFormShell>
					</div>
				</TabsContent>

				<TabsContent value="preview" className="flex min-h-0 flex-1 flex-col">
					<StentInvoicePreview selectedInvoice={selectedInvoice ?? undefined} />
				</TabsContent>
			</Tabs>
		</div>
	);
}
