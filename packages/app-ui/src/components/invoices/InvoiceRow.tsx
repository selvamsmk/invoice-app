import {
	Download,
	Edit,
	Eye,
	MoreVertical,
	Printer,
	Trash2,
} from "lucide-react";
import type React from "react";
import type { Invoice } from "@/components/invoices/preview";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableCell, TableRow } from "@/components/ui/table";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";

type Props = {
	invoice: Invoice;
	formatCurrency: (n: number) => string;
	formatDate: (s: string) => string;
	getStatusBadge: (s: string) => React.ReactNode;
	onEdit: (inv: Invoice) => void;
	onDelete: (id: string) => void;
	onPreview: (inv: Invoice) => void;
	onDownload: (inv: Invoice) => void;
};

export default function InvoiceRow({
	invoice,
	formatCurrency,
	formatDate,
	getStatusBadge,
	onEdit,
	onDelete,
	onPreview,
	onDownload,
}: Props) {
	return (
		<TableRow key={invoice.id}>
			<TableCell className="w-35 font-medium">
				<Tooltip>
					<TooltipTrigger asChild>
						<div className="cursor-help truncate">{invoice.invoiceNumber}</div>
					</TooltipTrigger>
					<TooltipContent>
						<p>{invoice.invoiceNumber}</p>
					</TooltipContent>
				</Tooltip>
			</TableCell>

			<TableCell className="w-25">{formatDate(invoice.invoiceDate)}</TableCell>

			<TableCell className="w-50">
				<Tooltip>
					<TooltipTrigger asChild>
						<div className="cursor-help truncate">{invoice.buyerName}</div>
					</TooltipTrigger>
					<TooltipContent>
						<p>{invoice.buyerName}</p>
					</TooltipContent>
				</Tooltip>
			</TableCell>

			<TableCell className="w-30">
				<Tooltip>
					<TooltipTrigger asChild>
						<div className="cursor-help truncate">
							{invoice.buyerCity}, {invoice.buyerState}
						</div>
					</TooltipTrigger>
					<TooltipContent>
						<p>
							{invoice.buyerCity}, {invoice.buyerState}
						</p>
					</TooltipContent>
				</Tooltip>
			</TableCell>

			<TableCell className="w-32.5 text-right font-medium">
				{formatCurrency(invoice.totalAmount)}
			</TableCell>

			<TableCell className="w-25">
				{formatDate(invoice.dueDate ?? "")}
			</TableCell>

			<TableCell className="w-25">{getStatusBadge(invoice.status)}</TableCell>

			<TableCell className="w-37.5 text-right">
				<div className="flex justify-end">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
								<MoreVertical className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onClick={() => onPreview(invoice)}>
								<Eye className="mr-2 h-4 w-4" />
								View Invoice
							</DropdownMenuItem>
							<DropdownMenuItem>
								<Printer className="mr-2 h-4 w-4" />
								Print Invoice
							</DropdownMenuItem>
							{!invoice.isFinalized && (
								<DropdownMenuItem onClick={() => onEdit(invoice)}>
									<Edit className="mr-2 h-4 w-4" />
									Edit Invoice
								</DropdownMenuItem>
							)}
							<DropdownMenuItem onClick={() => onDownload(invoice)}>
								<Download className="mr-2 h-4 w-4" />
								Download PDF
							</DropdownMenuItem>
							{!invoice.isFinalized && (
								<>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										variant="destructive"
										onClick={() => onDelete(invoice.id)}
									>
										<Trash2 className="mr-2 h-4 w-4" />
										Delete Invoice
									</DropdownMenuItem>
								</>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</TableCell>
		</TableRow>
	);
}
