import type { Product } from "@invoice-app/api";
import React from "react";
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from "@/components/ui/combobox";

type Props = {
	products?: Product[] | undefined;
	selectedProductId: string;
	onAddProduct: (p: Product) => void;
};

const ProductSelector = React.forwardRef<HTMLDivElement, Props>(
	({ products, selectedProductId, onAddProduct }, ref) => {
		return (
			<div ref={ref}>
			<p className="mb-4 text-muted-foreground text-sm">
				Add products to the invoice:
			</p>
			<Combobox
				items={products ?? []}
				itemToStringValue={(product) => product.name}
				value={products?.find((p) => p.id === selectedProductId) ?? null}
				onValueChange={(product) => {
					if (product) onAddProduct(product);
				}}
			>
				<ComboboxInput placeholder="Search products..." showClear />
				<ComboboxContent>
					<ComboboxEmpty>No products found.</ComboboxEmpty>
					<ComboboxList>
						{(product) => (
							<ComboboxItem key={product.id} value={product}>
								<div className="flex flex-col items-start">
									<span className="font-medium">{product.name}</span>
									<span className="text-muted-foreground text-xs">
										₹{product.defaultRate} • HSN: {product.hsnCode} • GST:{" "}
										{product.gstPercentage}%
									</span>
								</div>
							</ComboboxItem>
						)}
					</ComboboxList>
				</ComboboxContent>
				</Combobox>
			</div>
		);
	}
);

ProductSelector.displayName = "ProductSelector";

export default ProductSelector;
