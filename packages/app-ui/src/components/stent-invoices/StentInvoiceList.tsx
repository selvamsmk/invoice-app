import type React from "react";
import { TableBody } from "@/components/ui/table";
import StentInvoiceRow from "./StentInvoiceRow";
import type { StentInvoice } from "./stent-invoice-types";

type Props = {
	invoices: StentInvoice[];
	formatCurrency: (n: number) => string;
	formatDate: (s: string) => string;
	getStatusBadge: (s: string) => React.ReactNode;
	onEdit: (inv: StentInvoice) => void;
	onDelete: (id: string) => void;
	onPreview: (inv: StentInvoice) => void;
	onDownload: (inv: StentInvoice) => void;
};

export default function StentInvoiceList({
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
				<StentInvoiceRow
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
