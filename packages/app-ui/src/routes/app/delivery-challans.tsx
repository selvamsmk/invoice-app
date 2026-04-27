import { useDragAndDrop } from "fluid-dnd/react";
import type { Buyer, DeliveryChallan, Product } from "@invoice-app/api";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Edit as EditIcon, Eye, FileText, Plus, List } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import DeliveryChallanFormFields from "@/components/delivery-challans/DeliveryChallanFormFields";
import DeliveryChallanList from "@/components/delivery-challans/DeliveryChallanList";
import DeliveryChallanPreview from "@/components/delivery-challans/preview";
import { Button } from "@/components/ui/button";
import { Table, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppContext } from "@/hooks/useAppContext";
import { useBuyersProducts } from "@/hooks/useBuyersProducts";
import { useDeliveryChallans } from "@/hooks/useDeliveryChallans";

export const Route = createFileRoute("/app/delivery-challans")({
	component: DeliveryChallans,
});

type DeliveryChallanFormValues = {
	challanNumber: string;
	challanDate: string;
	dcDate: string;
	dcNumber: string;
	dispatchedThrough: string;
	showSign: boolean;
	showSeal: boolean;
};

type BatchDetail = {
	id: string;
	batchNo?: string;
	expiryDate?: string;
	quantity: number;
};

type DeliveryChallanLineItem = {
	id: string;
	productId: string;
	name: string;
	hsnCode: string;
	batches: BatchDetail[];
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
};

type RawLineItem = {
	id?: string;
	productId?: string;
	product?: RawProduct | null;
	productName?: string;
	hsnCode?: string;
	name?: string;
	batches?: RawBatch[];
};

type RawDeliveryChallan = {
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
	challanNumber?: string;
	challan_number?: string;
	challanDate?: string;
	challan_date?: string;
	dcDate?: string;
	dc_date?: string;
	dcNumber?: string;
	dc_number?: string;
	dispatchedThrough?: string;
	dispatched_through?: string;
	status?: string;
	isFinalized?: boolean;
	showSign?: boolean;
	showSeal?: boolean;
	show_sign?: boolean;
	show_seal?: boolean;
	createdAt?: string | Date;
	updatedAt?: string | Date;
	lineItems?: RawLineItem[];
};

type DeliveryChallanSource = RawDeliveryChallan & {
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
	sortOrder: number;
	batches: BatchPayload[];
};

type DeliveryChallanPayload = {
	challanNumber: string;
	challanDate: string;
	dcDate?: string;
	dcNumber?: string;
	dispatchedThrough?: string;
	status: string;
	isFinalized: boolean;
	showSign: boolean;
	showSeal: boolean;
	buyerId: string;
	buyerName: string;
	buyerAddressLine1: string;
	buyerAddressLine2?: string;
	buyerAddressLine3?: string;
	buyerCity: string;
	buyerState: string;
	buyerCountry: string;
	buyerPincode: string;
	buyerGstin?: string;
	buyerMobileNumber?: string;
	buyerEmailAddress?: string;
	buyerDrugLicenseNumber?: string;
	buyerStateCode?: string;
	notes?: string;
	lineItems: LineItemPayload[];
};

function DeliveryChallans() {
	const [challans, setChallans] = useState<DeliveryChallan[]>([]);
	const { orpc } = useAppContext();

	const {
		list: challansQuery,
		create: createChallanMutation,
		update: updateChallanMutation,
		remove: deleteChallanMutation,
	} = useDeliveryChallans();

	// Add renderPDF mutation
	const renderPDFMutation = useMutation(
		orpc.renderDcPDF.mutationOptions(),
	);

	useEffect(() => {
		if (challansQuery.data) {
			const mapped = (challansQuery.data ?? []).map((c: any) => ({
				id: c.id,
				challanNumber: c.challanNumber ?? c.challan_number ?? "",
				challanDate: c.challanDate ?? c.challan_date ?? "",
				dcDate: c.dcDate ?? c.dc_date ?? null,
				dcNumber: c.dcNumber ?? c.dc_number ?? null,
				dispatchedThrough: c.dispatchedThrough ?? c.dispatched_through ?? null,
				status: c.status ?? "Draft",
				isFinalized: c.isFinalized ?? false,
				showSign: Boolean(c.showSign ?? c.show_sign ?? false),
				showSeal: Boolean(c.showSeal ?? c.show_seal ?? false),
				buyerId: c.buyerId ?? "",
				buyerName: c.buyerName ?? "",
				buyerAddressLine1: c.buyerAddressLine1 ?? "",
				buyerAddressLine2: c.buyerAddressLine2 ?? null,
				buyerAddressLine3: c.buyerAddressLine3 ?? null,
				buyerCity: c.buyerCity ?? "",
				buyerState: c.buyerState ?? "",
				buyerCountry: c.buyerCountry ?? "India",
				buyerPincode: c.buyerPincode ?? "",
				buyerGstin: c.buyerGstin ?? null,
				buyerMobileNumber: c.buyerMobileNumber ?? null,
				buyerEmailAddress: c.buyerEmailAddress ?? null,
				buyerDrugLicenseNumber: c.buyerDrugLicenseNumber ?? null,
				buyerStateCode: c.buyerStateCode ?? null,
				notes: c.notes ?? null,
				createdAt: c.createdAt
					? typeof c.createdAt === "string"
						? new Date(c.createdAt)
						: c.createdAt
					: new Date(),
				updatedAt: c.updatedAt
					? typeof c.updatedAt === "string"
						? new Date(c.updatedAt)
						: c.updatedAt
					: new Date(),
			}));
			setChallans(mapped);
		}
	}, [challansQuery.data]);

	// Fetch buyers and products from API
	const { buyers, products } = useBuyersProducts();

	const handleEditChallan = (challan: DeliveryChallan) => {
		const rawChallans = (challansQuery.data ??
			[]) as unknown as DeliveryChallanSource[];
		const raw =
			rawChallans.find((c) => c.id === challan.id) ??
			(challan as DeliveryChallanSource);

		const normalizeDateInput = (
			value: string | Date | null | undefined,
		): string => {
			if (!value) return "";
			if (typeof value === "string") return value.split("T")[0]!;
			return value.toISOString().split("T")[0]!;
		};

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

		const mappedLineItems: DeliveryChallanLineItem[] = (
			raw.lineItems ?? []
		).map((li) => ({
			id:
				li.id || `line-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
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
		}));

		setLineItems(mappedLineItems);
		setEditingChallanId(challan.id);

		const challanNumberValue =
			raw.challanNumber ?? raw.challan_number ?? challan.challanNumber ?? "";
		setPendingEditValues({
			challanNumber: String(challanNumberValue ?? ""),
			challanDate: normalizeDateInput(
				raw.challanDate ?? raw.challan_date ?? challan.challanDate ?? "",
			),
			dcDate: normalizeDateInput(raw.dcDate ?? raw.dc_date ?? challan.dcDate ?? ""),
			dcNumber: String(raw.dcNumber ?? raw.dc_number ?? challan.dcNumber ?? ""),
			dispatchedThrough: String(
				raw.dispatchedThrough ?? raw.dispatched_through ?? challan.dispatchedThrough ?? "",
			),
			showSign: Boolean(raw.showSign ?? raw.show_sign ?? false),
			showSeal: Boolean(raw.showSeal ?? raw.show_seal ?? false),
		});
		setActiveTab("edit");
	};

	const handleDeleteChallan = async (id: string) => {
		try {
			await deleteChallanMutation.mutateAsync({ id });
			toast.success("Delivery challan deleted successfully");
		} catch (err) {
			console.error(err);
			toast.error("Failed to delete delivery challan");
		}
	};

	// Tab state
	const [activeTab, setActiveTab] = useState("list");

	// Selected challan for preview
	const [selectedChallan, setSelectedChallan] =
		useState<DeliveryChallan | null>(null);

	// Challan creation state
	const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null);
	const [editableBuyerData, setEditableBuyerData] = useState<Buyer | null>(
		null,
	);
	const [selectedProductId, setSelectedProductId] = useState<string>("");
	const [editingChallanId, setEditingChallanId] = useState<string | null>(null);
	const [pendingEditValues, setPendingEditValues] =
		useState<DeliveryChallanFormValues | null>(null);

	const [parent, lineItems, setLineItems] = useDragAndDrop<
		DeliveryChallanLineItem,
		HTMLDivElement
	>([]);

	const challanLineItemFields = new Set<keyof DeliveryChallanLineItem>([
		"id",
		"productId",
		"name",
		"hsnCode",
		"batches",
	]);

	const isChallanLineItemField = (
		field: string,
	): field is keyof DeliveryChallanLineItem =>
		challanLineItemFields.has(field as keyof DeliveryChallanLineItem);

	const batchDetailFields = new Set<keyof BatchDetail>([
		"id",
		"batchNo",
		"expiryDate",
		"quantity",
	]);

	const isBatchDetailField = (field: string): field is keyof BatchDetail =>
		batchDetailFields.has(field as keyof BatchDetail);

	// Challan form
	const defaultValues: DeliveryChallanFormValues = {
		challanNumber: "",
		challanDate: new Date().toISOString().slice(0, 10),
		dcDate: "",
		dcNumber: "",
		dispatchedThrough: "",
		showSign: false,
		showSeal: false,
	};

	const challanForm = useForm({
		defaultValues,
		onSubmit: async ({ value }) => {
			if (!editableBuyerData || lineItems.length === 0) return;

			const lineItemsForApi: LineItemPayload[] = lineItems.map((item, idx) => {
				const totalQuantity = item.batches.reduce(
					(sum, batch) => sum + (batch.quantity || 0),
					0,
				);

				return {
					productId: item.productId,
					productName: item.name,
					hsnCode: item.hsnCode,
					sortOrder: idx,
					batches: item.batches.map((batch, batchIdx) => ({
						batchNo: batch.batchNo || undefined,
						expiryDate: batch.expiryDate || undefined,
						quantity: batch.quantity,
						sortOrder: batchIdx,
					})),
				};
			});

			const payload: DeliveryChallanPayload = {
				challanNumber: value.challanNumber,
				challanDate: value.challanDate,
				dcDate: value.dcDate || undefined,
				dcNumber: value.dcNumber || undefined,
				dispatchedThrough: value.dispatchedThrough || undefined,
				status: "Draft",
				isFinalized: false,
				showSign: value.showSign,
				showSeal: value.showSeal,
				buyerId: selectedBuyer?.id ?? editableBuyerData.id,
				buyerName: editableBuyerData.name,
				buyerAddressLine1: editableBuyerData.addressLine1 ?? "",
				buyerAddressLine2: editableBuyerData.addressLine2 ?? undefined,
				buyerAddressLine3: editableBuyerData.addressLine3 ?? undefined,
				buyerCity: editableBuyerData.city ?? "",
				buyerState: editableBuyerData.state ?? "",
				buyerCountry: editableBuyerData.country ?? "India",
				buyerPincode: editableBuyerData.pincode ?? "",
				buyerGstin: editableBuyerData.gstin ?? undefined,
				buyerMobileNumber: editableBuyerData.mobileNumber ?? undefined,
				buyerEmailAddress: editableBuyerData.emailAddress ?? undefined,
				buyerDrugLicenseNumber:
					editableBuyerData.drugLicenseNumber ?? undefined,
				buyerStateCode: editableBuyerData.stateCode ?? undefined,
				notes: undefined,
				lineItems: lineItemsForApi,
			};

			try {
				if (editingChallanId) {
					await updateChallanMutation.mutateAsync({
						id: editingChallanId,
						...payload,
					});
					toast.success("Delivery challan updated successfully");
				} else {
					await createChallanMutation.mutateAsync(payload);
					toast.success("Delivery challan created successfully");
				}
				setActiveTab("list");
				setSelectedBuyer(null);
				setEditableBuyerData(null);
				setLineItems([]);
				setEditingChallanId(null);
				challanForm.reset();
			} catch (err) {
				console.error(err);
				toast.error("Failed to save delivery challan");
			}
		},
	});

	useEffect(() => {
		if (activeTab !== "edit" || !pendingEditValues) return;
		if (typeof challanForm.setFieldValue === "function") {
			Object.entries(pendingEditValues).forEach(([key, val]) => {
				challanForm.setFieldValue(key as any, val as any);
			});
		} else {
			challanForm.reset(pendingEditValues);
		}
		setPendingEditValues(null);
	}, [activeTab, challanForm, pendingEditValues]);

	const handleBuyerSelect = (buyer: Buyer | null) => {
		setSelectedBuyer(buyer);
		setEditableBuyerData(buyer ? { ...buyer } : null);
	};

	const handleAddProduct = (product: Product) => {
		const defaultBatch: BatchDetail = {
			id: `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			batchNo: "",
			expiryDate: "",
			quantity: 1,
		};

		const newLineItem: DeliveryChallanLineItem = {
			id: `line-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			productId: product.id,
			name: product.name,
			hsnCode: product.hsnCode,
			batches: [defaultBatch],
		};
		setLineItems([...lineItems, newLineItem]);
		setSelectedProductId("");
	};

	const handleLineItemChange = <Field extends keyof DeliveryChallanLineItem>(
		id: string,
		field: Field,
		value: DeliveryChallanLineItem[Field],
	) => {
		setLineItems(
			lineItems.map((item) => {
				if (item.id !== id) return item;
				return { ...item, [field]: value };
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
				if (item.id !== lineItemId) return item;
				return {
					...item,
					batches: item.batches.map((batch) => {
						if (batch.id !== batchId) return batch;
						return { ...batch, [field]: value };
					}),
				};
			}),
		);
	};

	const handleAddBatch = (lineItemId: string) => {
		setLineItems(
			lineItems.map((item) => {
				if (item.id !== lineItemId) return item;
				const newBatch: BatchDetail = {
					id: `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
					batchNo: "",
					expiryDate: "",
					quantity: 1,
				};
				return {
					...item,
					batches: [...item.batches, newBatch],
				};
			}),
		);
	};

	const handleRemoveBatch = (lineItemId: string, batchId: string) => {
		setLineItems(
			lineItems.map((item) => {
				if (item.id !== lineItemId) return item;
				const updatedBatches = item.batches.filter((b) => b.id !== batchId);
				if (updatedBatches.length === 0) {
					return item;
				}
				return {
					...item,
					batches: updatedBatches,
				};
			}),
		);
	};

	const handleRemoveLineItem = (id: string) => {
		setLineItems(lineItems.filter((item) => item.id !== id));
	};

	const handleCreateChallanClick = () => {
		setEditingChallanId(null);
		setSelectedBuyer(null);
		setEditableBuyerData(null);
		setLineItems([]);
		challanForm.reset();
		setActiveTab("create");
	};

	const handlePreviewChallan = (challan: DeliveryChallan) => {
		setSelectedChallan(challan);
		setActiveTab("preview");
	};

	const handleDownloadChallan = async (challan: DeliveryChallan) => {
		try {
			const resp = await renderPDFMutation.mutateAsync({ id: challan.id });
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
			link.download = `${challan.challanNumber}.pdf`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
			toast.success("Delivery challan downloaded successfully", {
				description: `${challan.challanNumber}.pdf`,
				position: "top-right",
			});
		} catch (err) {
			console.error("Error downloading delivery challan", err);
			toast.error("Failed to download delivery challan", {
				description: "Please try again",
				position: "top-left",
			});
		}
	};

	const sortedChallans = [...challans].sort(
		(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
	);

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "Draft":
				return "default";
			case "Dispatched":
				return "secondary";
			case "Delivered":
				return "default";
			default:
				return "default";
		}
	};

	return (
		<div className="flex h-full min-h-0 w-full flex-col">
			<Tabs
				className="flex min-h-0 flex-1 flex-col"
				value={activeTab}
				onValueChange={setActiveTab}
			>
				<div className="mb-6 flex items-center justify-between">
				<div className="flex shrink-0 items-center gap-3">
					<FileText className="h-8 w-8" />
					<div className="flex flex-col">
						<h1 className="font-bold text-3xl">Delivery Challans</h1>
						<p className="text-sm text-muted-foreground">Manage and track your delivery challans</p>
					</div>
				</div>
						{activeTab === "list" && (
                        <Button onClick={handleCreateChallanClick}>
							<Plus className="mr-2 h-4 w-4" />
							Create Delivery Challan
						</Button>
					)}
				</div>

                <TabsList className="mb-3 flex items-center gap-2">
                    <TabsTrigger value="list" className="min-w-24 flex items-center gap-2">
                        <List className="h-4 w-4" />
                        List
                    </TabsTrigger>
                    <TabsTrigger value="create" className="min-w-24 flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Create
                    </TabsTrigger>
                    <TabsTrigger
                        value="edit"
                        disabled={!editingChallanId}
                        className={`min-w-24 flex items-center gap-2 ${!editingChallanId ? "pointer-events-none opacity-50" : ""}`}
                        aria-disabled={!editingChallanId}
                    >
                        <EditIcon className="h-4 w-4" />
                        Edit
                    </TabsTrigger>
                    <TabsTrigger
                        value="preview"
                        disabled={!selectedChallan}
                        className={`min-w-24 flex items-center gap-2 ${!selectedChallan ? "pointer-events-none opacity-50" : ""}`}
                        aria-disabled={!selectedChallan}
                    >
                        <Eye className="h-4 w-4" />
                            Preview
					</TabsTrigger>
				</TabsList>

				<TabsContent value="list" className="flex min-h-0 flex-1 flex-col">
					<div className="min-h-0 flex-1 overflow-hidden rounded-md border">
						<div className="h-full max-h-full overflow-y-auto">
							<Table className="relative table-fixed">
								<TableHeader className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
									<TableRow>
										<TableHead className="w-35">Challan Number</TableHead>
										<TableHead className="w-25">Challan Date</TableHead>
										<TableHead className="w-50">Buyer Name</TableHead>
										<TableHead className="w-30">Location</TableHead>
										<TableHead className="w-25">Status</TableHead>
										<TableHead className="w-37.5 text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<DeliveryChallanList
									challans={sortedChallans}
									onEdit={handleEditChallan}
									onDelete={handleDeleteChallan}
									onPreview={handlePreviewChallan}
									onDownload={handleDownloadChallan}
									getStatusBadge={getStatusBadge}
								/>
							</Table>
						</div>
					</div>
				</TabsContent>

				<TabsContent
					value="create"
					className="flex min-h-0 flex-1 flex-col overflow-hidden"
				>
					<div className="min-h-0 flex-1 overflow-y-auto pr-1">
						<DeliveryChallanFormFields
							form={challanForm}
							buyers={buyers.data ?? []}
							products={products.data ?? []}
							selectedBuyer={selectedBuyer}
							editableBuyerData={editableBuyerData}
							selectedProductId={selectedProductId}
							lineItems={lineItems}
							parent={parent}
							onBuyerSelect={handleBuyerSelect}
							onAddProduct={handleAddProduct}
							onLineItemChange={handleLineItemChange}
							onBatchChange={handleBatchChange}
							onAddBatch={handleAddBatch}
							onRemoveBatch={handleRemoveBatch}
							onRemoveLineItem={handleRemoveLineItem}
							setSelectedProductId={setSelectedProductId}
							setEditableBuyerData={setEditableBuyerData}
						/>
					</div>
				</TabsContent>

				<TabsContent
					value="edit"
					className="flex min-h-0 flex-1 flex-col overflow-hidden"
				>
					<div className="min-h-0 flex-1 overflow-y-auto pr-1">
						<DeliveryChallanFormFields
							form={challanForm}
							buyers={buyers.data ?? []}
							products={products.data ?? []}
							selectedBuyer={selectedBuyer}
							editableBuyerData={editableBuyerData}
							selectedProductId={selectedProductId}
							lineItems={lineItems}
							parent={parent}
							onBuyerSelect={handleBuyerSelect}
							onAddProduct={handleAddProduct}
							onLineItemChange={handleLineItemChange}
							onBatchChange={handleBatchChange}
							onAddBatch={handleAddBatch}
							onRemoveBatch={handleRemoveBatch}
							onRemoveLineItem={handleRemoveLineItem}
							setSelectedProductId={setSelectedProductId}
							setEditableBuyerData={setEditableBuyerData}
						/>
					</div>
				</TabsContent>

				<TabsContent
					value="preview"
					className="flex min-h-0 flex-1 flex-col overflow-hidden"
				>
					<div className="min-h-0 flex-1 overflow-y-auto pr-1">
						{selectedChallan && (
							<DeliveryChallanPreview challanId={selectedChallan.id} />
						)}
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}
