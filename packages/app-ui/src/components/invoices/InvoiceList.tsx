import type React from "react";
import type { Invoice } from "@/components/invoices/preview";
import { TableBody } from "@/components/ui/table";
import InvoiceRow from "./InvoiceRow";

type Props = {
	invoices: Invoice[];
	formatCurrency: (n: number) => string;
	formatDate: (s: string) => string;
	getStatusBadge: (s: string) => React.ReactNode;
	onEdit: (inv: Invoice) => void;
	onDelete: (id: string) => void;
	onPreview: (inv: Invoice) => void;
	onDownload: (inv: Invoice) => void;
};

export default function InvoiceList({
	invoices,
	formatCurrency,
	formatDate,
	getStatusBadge,
	onEdit,
	onDelete,
	onPreview,
	onDownload,
}: Props) {
	return (
		<TableBody>
			{invoices.map((invoice) => (
				<InvoiceRow
					key={invoice.id}
					invoice={invoice}
					formatCurrency={formatCurrency}
					formatDate={formatDate}
					getStatusBadge={getStatusBadge}
					onEdit={onEdit}
					onDelete={onDelete}
					onPreview={onPreview}
					onDownload={onDownload}
				/>
			))}
		</TableBody>
	);
}
