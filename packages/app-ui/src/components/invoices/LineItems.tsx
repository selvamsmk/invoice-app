import type React from "react";
import LineItemRow from "./LineItemRow";

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
	parent:
		| React.RefObject<HTMLElement>
		| ((el: HTMLElement | null) => void)
		| null;
	lineItems: LineItem[];
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

export default function LineItems({
	parent,
	lineItems,
	onChange,
	onRemove,
	onAddBatch,
	onRemoveBatch,
	onBatchChange,
}: Props) {
	return (
		<div>
			<div ref={parent as any} className="space-y-4">
				{lineItems.map((item, index) => (
					<LineItemRow
						key={item.id}
						item={item}
						index={index}
						onChange={onChange}
						onRemove={onRemove}
						onAddBatch={onAddBatch}
						onRemoveBatch={onRemoveBatch}
						onBatchChange={onBatchChange}
					/>
				))}
			</div>
		</div>
	);
}
