import { X } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import { DatePickerInput } from "@/components/ui/date-picker";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type Batch = {
	id: string;
	batchNo?: string;
	expiryDate?: string;
	quantity: number;
};

type Props = {
	lineItemId: string;
	batch: Batch;
	onBatchChange: (
		lineItemId: string,
		batchId: string,
		field: string,
		value: any,
	) => void;
	onRemoveBatch: (lineItemId: string, batchId: string) => void;
	canRemove?: boolean;
};

export default function BatchEditor({
	lineItemId,
	batch,
	onBatchChange,
	onRemoveBatch,
	canRemove = false,
}: Props) {
	return (
		<div
			key={batch.id}
			className="flex items-center gap-2 rounded bg-muted/30 p-2"
		>
			<div className="grid flex-1 grid-cols-3 gap-2">
				<Field>
					<FieldLabel className="text-xs">Batch No (Optional)</FieldLabel>
					<Input
						value={batch.batchNo || ""}
						onChange={(e) =>
							onBatchChange(lineItemId, batch.id, "batchNo", e.target.value)
						}
						className="text-sm"
						placeholder="Enter batch number"
					/>
				</Field>

				<Field>
					<FieldLabel className="text-xs">Expiry Date (Optional)</FieldLabel>
					<DatePickerInput
						value={batch.expiryDate || ""}
						onChange={(value) =>
							onBatchChange(lineItemId, batch.id, "expiryDate", value)
						}
						className="text-sm"
						placeholder="Select expiry date"
					/>
				</Field>

				<Field>
					<FieldLabel className="text-xs">Quantity</FieldLabel>
					<Input
						type="number"
						min="0"
						step="1"
						value={batch.quantity}
						onChange={(e) =>
							onBatchChange(
								lineItemId,
								batch.id,
								"quantity",
								Number.parseInt(e.target.value) || 0,
							)
						}
						className="text-sm"
					/>
				</Field>
			</div>

			{canRemove && (
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => onRemoveBatch(lineItemId, batch.id)}
					className="flex-shrink-0 text-red-600 hover:text-red-700"
				>
					<X className="h-3 w-3" />
				</Button>
			)}
		</div>
	);
}
