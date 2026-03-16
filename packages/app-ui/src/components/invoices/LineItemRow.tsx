import { Plus, X } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import BatchEditor from "./BatchEditor";

type Batch = {
	id: string;
	batchNo?: string;
	expiryDate?: string;
	quantity: number;
};

type LineItem = {
	id: string;
	productId: string;
	name: string;
	hsnCode: string;
	batches: Batch[];
	rate: number;
	gstPercentage: number;
	amount: number;
};

type Props = {
	item: LineItem;
	index: number;
	onChange: (id: string, field: string, value: any) => void;
	onRemove: (id: string) => void;
	onAddBatch: (lineItemId: string) => void;
	onRemoveBatch: (lineItemId: string, batchId: string) => void;
	onBatchChange: (
		lineItemId: string,
		batchId: string,
		field: string,
		value: any,
	) => void;
};

export default function LineItemRow({
	item,
	index,
	onChange,
	onRemove,
	onAddBatch,
	onRemoveBatch,
	onBatchChange,
}: Props) {
	return (
		<div
			key={item.id}
			data-index={index}
			className="cursor-move rounded-lg border bg-card"
		>
			<div className="flex items-center gap-2 border-b bg-muted/50 p-3">
				<div className="w-12 flex-shrink-0">
					<div className="text-center font-medium text-sm">{index + 1}</div>
				</div>

				<div className="grid flex-1 grid-cols-4 items-center gap-2">
					<Field>
						<FieldLabel className="text-xs">Product Details</FieldLabel>
						<Input
							value={item.name}
							onChange={(e) => onChange(item.id, "name", e.target.value)}
							className="text-sm"
						/>
					</Field>

					<Field>
						<FieldLabel className="text-xs">HSN</FieldLabel>
						<Input
							value={item.hsnCode}
							onChange={(e) => onChange(item.id, "hsnCode", e.target.value)}
							className="text-sm"
						/>
					</Field>

					<Field>
						<FieldLabel className="text-xs">Rate (₹)</FieldLabel>
						<Input
							type="number"
							min="0"
							step="0.01"
							value={item.rate}
							onChange={(e) =>
								onChange(
									item.id,
									"rate",
									Number.parseFloat(e.target.value) || 0,
								)
							}
							className="text-sm"
						/>
					</Field>

					<Field>
						<FieldLabel className="text-xs">GST (%)</FieldLabel>
						<Input
							type="number"
							min="0"
							max="100"
							step="0.01"
							value={item.gstPercentage}
							onChange={(e) =>
								onChange(
									item.id,
									"gstPercentage",
									Number.parseFloat(e.target.value) || 0,
								)
							}
							className="text-sm"
						/>
					</Field>
				</div>

				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => onRemove(item.id)}
					className="flex-shrink-0 text-red-600 hover:text-red-700"
				>
					<X className="h-4 w-4" />
				</Button>
			</div>

			<div className="space-y-2 p-3">
				<div className="flex items-center justify-between">
					<h5 className="font-medium text-sm">Batches (Optional)</h5>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => onAddBatch(item.id)}
						className="text-green-600 hover:text-green-700"
					>
						<Plus className="mr-1 h-3 w-3" />
						Add Batch
					</Button>
				</div>

				{item.batches.map((batch) => (
					<BatchEditor
						key={batch.id}
						lineItemId={item.id}
						batch={batch}
						onBatchChange={onBatchChange}
						onRemoveBatch={onRemoveBatch}
						canRemove={item.batches.length > 1}
					/>
				))}

				<div className="flex items-center justify-between rounded border-t bg-muted/20 px-2 py-1 pt-2">
					<span className="font-medium text-sm">
						Total Quantity:{" "}
						{item.batches.reduce((sum, b) => sum + b.quantity, 0)}
					</span>
					<span className="font-medium text-sm">
						Tax: ₹
						{(
							(item.batches.reduce((sum, b) => sum + b.quantity, 0) *
								item.rate *
								item.gstPercentage) /
							100
						).toFixed(2)}
					</span>
					<span className="font-medium text-sm">
						Amount: ₹{item.amount.toFixed(2)}
					</span>
				</div>
			</div>
		</div>
	);
}
