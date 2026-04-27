import type { Buyer, Product } from "@invoice-app/api";
import React from "react";
import BuyerSelector from "@/components/invoices/BuyerSelector";
import LineItems from "@/components/invoices/LineItems";
import ProductSelector from "@/components/invoices/ProductSelector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePickerInput } from "@/components/ui/date-picker";
import { Field, FieldLabel, FieldMessage } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

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

type Props = {
	invoiceForm: any;
	buyers?: any;
	products?: any;
	selectedBuyer: Buyer | null;
	editableBuyerData: Buyer | null;
	onSelectBuyer: (b: Buyer) => void;
	onChangeEditableBuyer: (b: Buyer | null) => void;
	onClearBuyer: () => void;
	selectedProductId: string;
	onAddProduct: (p: Product) => void;
	parent: any;
	lineItems: InvoiceLineItem[];
	onLineItemChange: (
		id: string,
		field: keyof InvoiceLineItem,
		value: any,
	) => void;
	onRemoveLineItem: (id: string) => void;
	onAddBatch: (lineId: string) => void;
	onRemoveBatch: (lineId: string, batchId: string) => void;
	onBatchChange: (
		lineId: string,
		batchId: string,
		field: keyof BatchDetail,
		value: any,
	) => void;
};

export default function InvoiceFormFields({
	invoiceForm,
	buyers,
	products,
	selectedBuyer,
	editableBuyerData,
	onSelectBuyer,
	onChangeEditableBuyer,
	onClearBuyer,
	selectedProductId,
	onAddProduct,
	parent,
	lineItems,
	onLineItemChange,
	onRemoveLineItem,
	onAddBatch,
	onRemoveBatch,
	onBatchChange,
}: Props) {
	const productSelectorRef = React.useRef<HTMLDivElement>(null);

	return (
		<div className="flex flex-col gap-5">
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
								onBlur: ({ value }: any) => {
									return value && value.length > 0
										? undefined
										: "Invoice number is required";
								},
							}}
						>
							{(field: any) => (
								<Field>
									<FieldLabel htmlFor={field.name}>Invoice Number *</FieldLabel>
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
							{(field: any) => (
								<Field>
									<FieldLabel htmlFor={field.name}>Invoice Type</FieldLabel>
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
						<invoiceForm.Field name="invoiceDate">
							{(field: any) => (
								<Field>
									<FieldLabel htmlFor={field.name}>Invoice Date *</FieldLabel>
									<DatePickerInput
										id={field.name}
										value={field.state.value}
										onChange={(value) => field.handleChange(value)}
										onBlur={field.handleBlur}
										placeholder="Select invoice date"
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
							{(field: any) => (
								<Field>
									<FieldLabel htmlFor={field.name}>Due Date *</FieldLabel>
									<DatePickerInput
										id={field.name}
										value={field.state.value}
										onChange={(value) => field.handleChange(value)}
										onBlur={field.handleBlur}
										placeholder="Select due date"
									/>
									{!field.state.meta.isValid && (
										<FieldMessage>
											{field.state.meta.errors.join(", ")}
										</FieldMessage>
									)}
								</Field>
							)}
						</invoiceForm.Field>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<invoiceForm.Field name="dcNumber">
							{(field: any) => (
								<Field>
									<FieldLabel htmlFor={field.name}>DC Number</FieldLabel>
									<Input
										id={field.name}
										name={field.name}
										value={field.state.value ?? ""}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="Enter DC number"
									/>
								</Field>
							)}
						</invoiceForm.Field>

						<invoiceForm.Field name="dcDate">
							{(field: any) => (
								<Field>
									<FieldLabel htmlFor={field.name}>DC Date</FieldLabel>
									<DatePickerInput
										id={field.name}
										value={field.state.value}
										onChange={(value) => field.handleChange(value)}
										onBlur={field.handleBlur}
										placeholder="Select DC date"
									/>
								</Field>
							)}
						</invoiceForm.Field>
					</div>

					<invoiceForm.Field name="dispatchedThrough">
						{(field: any) => (
							<Field>
								<FieldLabel htmlFor={field.name}>Dispatched Through</FieldLabel>
								<Input
									id={field.name}
									name={field.name}
									value={field.state.value ?? ""}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="Enter courier / transport name"
								/>
							</Field>
						)}
					</invoiceForm.Field>

					<div className="grid grid-cols-2 gap-4">
						<invoiceForm.Field name="showSign">
							{(field: any) => (
								<Field>
									<div className="flex items-center gap-2">
										<Checkbox
											id={field.name}
											checked={Boolean(field.state.value)}
											onCheckedChange={(checked) =>
												field.handleChange(checked === true)
											}
										/>
										<FieldLabel htmlFor={field.name}>
											Show Sign In PDF
										</FieldLabel>
									</div>
								</Field>
							)}
						</invoiceForm.Field>

						<invoiceForm.Field name="showSeal">
							{(field: any) => (
								<Field>
									<div className="flex items-center gap-2">
										<Checkbox
											id={field.name}
											checked={Boolean(field.state.value)}
											onCheckedChange={(checked) =>
												field.handleChange(checked === true)
											}
										/>
										<FieldLabel htmlFor={field.name}>
											Show Seal In PDF
										</FieldLabel>
									</div>
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
						buyers={buyers}
						selectedBuyer={selectedBuyer}
						editableBuyerData={editableBuyerData}
						onSelect={(b: Buyer) => onSelectBuyer(b)}
						onChangeEditable={(b: Buyer | null) => onChangeEditableBuyer(b)}
						onClear={() => onClearBuyer()}
					/>
				</CardContent>
			</Card>

			{/* Product Selection and Line Items */}
			<Card className="w-full">
				<CardHeader>
					<CardTitle>Products</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{lineItems.length > 0 && (
						<div>
							<h4 className="mb-4 font-medium">
								Invoice Items (Drag to reorder)
							</h4>
							<LineItems
								parent={parent}
								lineItems={lineItems}
								onChange={(id, field, value) =>
									onLineItemChange(id, field as any, value)
								}
								onRemove={(id) => onRemoveLineItem(id)}
								onAddBatch={(id) => onAddBatch(id)}
								onRemoveBatch={(lineId, batchId) =>
									onRemoveBatch(lineId, batchId)
								}
								onBatchChange={(lineId, batchId, field, value) =>
									onBatchChange(lineId, batchId, field as any, value)
								}
							/>

							<div className="mt-4 rounded-lg bg-muted p-4">
								<div className="text-right">
									<p className="font-semibold text-lg">
										Total Amount: ₹
										{Math.round(
											lineItems.reduce((sum, item) => sum + item.amount, 0),
										)}
									</p>
								</div>
							</div>
						</div>
					)}

					<ProductSelector
						ref={productSelectorRef}
						products={products}
						selectedProductId={selectedProductId}
						onAddProduct={(p: Product) => {
							onAddProduct(p);
							setTimeout(() => {
								productSelectorRef.current?.scrollIntoView({
									behavior: "smooth",
									block: "center",
								});
							}, 100);
						}}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
