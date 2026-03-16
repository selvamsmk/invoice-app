import type React from "react";
import { Button } from "@/components/ui/button";

type FormSubmitState = {
	canSubmit: boolean;
	isSubmitting: boolean;
};

type InvoiceFormLike = {
	handleSubmit: () => void;
	Subscribe: React.ComponentType<{
		selector: (state: FormSubmitState) => [boolean, boolean];
		children: (values: [boolean, boolean]) => React.ReactNode;
	}>;
};

type Props = {
	invoiceForm: InvoiceFormLike;
	onCancel: () => void;
	editingInvoiceId?: string | null;
	children?: React.ReactNode;
};

export default function InvoiceFormShell({
	invoiceForm,
	onCancel,
	editingInvoiceId,
	children,
}: Props) {
	return (
		<div className="h-full min-h-0 overflow-y-auto">
			<div className="pb-6">
				{children}

				<div className="mt-4 flex justify-between">
					<Button type="button" variant="outline" onClick={onCancel}>
						Cancel
					</Button>

					<invoiceForm.Subscribe
						selector={(state) => [state.canSubmit, state.isSubmitting]}
					>
						{(values) => {
							const [canSubmit, isSubmitting] = values;
							return (
								<Button
									type="button"
									onClick={() => invoiceForm.handleSubmit()}
									disabled={!canSubmit || isSubmitting}
								>
									{isSubmitting
										? editingInvoiceId
											? "Updating..."
											: "Creating..."
										: editingInvoiceId
											? "Update Invoice"
											: "Create Invoice"}
								</Button>
							);
						}}
					</invoiceForm.Subscribe>
				</div>
			</div>
		</div>
	);
}
