import type { Buyer, Product } from "@invoice-app/api";
import React from "react";
import BuyerSelector from "@/components/delivery-challans/BuyerSelector";
import LineItems from "@/components/delivery-challans/LineItems";
import ProductSelector from "@/components/delivery-challans/ProductSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePickerInput } from "@/components/ui/date-picker";
import { Field, FieldLabel, FieldMessage } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

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

type Props = {
	form: any;
	buyers?: any;
	products?: any;
	selectedBuyer: Buyer | null;
	editableBuyerData: Buyer | null;
	onBuyerSelect: (b: Buyer | null) => void;
	setEditableBuyerData: (b: Buyer | null) => void;
	selectedProductId: string;
	onAddProduct: (p: Product) => void;
	setSelectedProductId: (id: string) => void;
	parent: any;
	lineItems: DeliveryChallanLineItem[];
	onLineItemChange: (
		id: string,
		field: keyof DeliveryChallanLineItem,
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

export default function DeliveryChallanFormFields({
	form,
	buyers,
	products,
	selectedBuyer,
	editableBuyerData,
	onBuyerSelect,
	setEditableBuyerData,
	selectedProductId,
	onAddProduct,
	setSelectedProductId,
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
			{/* Delivery Challan Header */}
			<Card className="w-full">
				<CardHeader>
					<CardTitle>Delivery Challan Details</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<form.Field
							name="challanNumber"
							validators={{
								onBlur: ({ value }: any) => {
									return value && value.length > 0
										? undefined
										: "Challan number is required";
								},
							}}
						>
							{(field: any) => (
								<Field>
									<FieldLabel htmlFor={field.name}>Challan Number *</FieldLabel>
									<Input
										id={field.name}
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="Enter challan number"
									/>
									{!field.state.meta.isValid && (
										<FieldMessage>
											{field.state.meta.errors.join(", ")}
										</FieldMessage>
									)}
								</Field>
							)}
						</form.Field>

						<form.Field name="challanDate">
							{(field: any) => (
								<Field>
									<FieldLabel htmlFor={field.name}>Challan Date *</FieldLabel>
									<DatePickerInput
										id={field.name}
										value={field.state.value}
										onChange={(value) => field.handleChange(value)}
										onBlur={field.handleBlur}
										placeholder="Select challan date"
									/>
									{!field.state.meta.isValid && (
										<FieldMessage>
											{field.state.meta.errors.join(", ")}
										</FieldMessage>
									)}
								</Field>
							)}
						</form.Field>
					</div>

					<form.Field name="dispatchedThrough">
						{(field: any) => (
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
									placeholder="Enter dispatch details"
								/>
							</Field>
						)}
					</form.Field>
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
						onSelect={(b: Buyer) => onBuyerSelect(b)}
						onChangeEditable={(b: Buyer) => setEditableBuyerData(b)}
						onClear={() => {
							setEditableBuyerData(null);
							onBuyerSelect(null);
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
					{lineItems.length > 0 && (
						<div>
							<h4 className="mb-4 font-medium">
								Challan Items (Drag to reorder)
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
						</div>
					)}

					<ProductSelector
						ref={productSelectorRef}
						products={products}
						selectedProductId={selectedProductId}
						onAddProduct={(p: Product) => {
							onAddProduct(p);
							setSelectedProductId("");
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

			{/* Submit */}
			<form.Subscribe>
				{() => (
					<div className="flex justify-end">
						<Button type="submit" onClick={form.handleSubmit}>
							Submit Delivery Challan
						</Button>
					</div>
				)}
			</form.Subscribe>
		</div>
	);
}
