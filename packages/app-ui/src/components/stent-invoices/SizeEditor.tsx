import { X } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import { DatePickerInput } from "@/components/ui/date-picker";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type Size = {
	id: string;
	sizeDimension: string;
	serialNumber: string;
	expiryDate?: string;
	quantity: number;
};

type Props = {
	lineItemId: string;
	size: Size;
	onSizeChange: (
		lineItemId: string,
		sizeId: string,
		field: string,
		value: any,
	) => void;
	onRemoveSize: (lineItemId: string, sizeId: string) => void;
	canRemove?: boolean;
};

export default function SizeEditor({
	lineItemId,
	size,
	onSizeChange,
	onRemoveSize,
	canRemove = false,
}: Props) {
	return (
		<div
			key={size.id}
			className="flex items-center gap-2 rounded bg-muted/30 p-2"
		>
			<div className="grid flex-1 grid-cols-4 gap-2">
				<Field>
					<FieldLabel className="text-xs">Size Dimension</FieldLabel>
					<Input
						value={size.sizeDimension}
						onChange={(e) =>
							onSizeChange(lineItemId, size.id, "sizeDimension", e.target.value)
						}
						className="text-sm"
						placeholder="e.g., 3.5mm"
						required
					/>
				</Field>

				<Field>
					<FieldLabel className="text-xs">Serial Number</FieldLabel>
					<Input
						value={size.serialNumber}
						onChange={(e) =>
							onSizeChange(lineItemId, size.id, "serialNumber", e.target.value)
						}
						className="text-sm"
						placeholder="Enter serial number"
						required
					/>
				</Field>

				<Field>
					<FieldLabel className="text-xs">Expiry Date (Optional)</FieldLabel>
					<DatePickerInput
						value={size.expiryDate || ""}
						onChange={(value) =>
							onSizeChange(lineItemId, size.id, "expiryDate", value)
						}
						className="text-sm"
						placeholder="Select expiry date"
					/>
				</Field>

				<Field>
					<FieldLabel className="text-xs">Quantity</FieldLabel>
					<Input
						type="number"
						min="1"
						step="1"
						value={size.quantity}
						onChange={(e) =>
							onSizeChange(
								lineItemId,
								size.id,
								"quantity",
								Number.parseInt(e.target.value) || 1,
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
					onClick={() => onRemoveSize(lineItemId, size.id)}
					className="flex-shrink-0 text-red-600 hover:text-red-700"
				>
					<X className="h-3 w-3" />
				</Button>
			)}
		</div>
	);
}
