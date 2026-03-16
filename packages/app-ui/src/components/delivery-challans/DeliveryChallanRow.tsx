import type { DeliveryChallan } from "@invoice-app/api";
import {
	Download,
	Edit,
	Eye,
	MoreVertical,
	Printer,
	Trash2,
} from "lucide-react";
import type React from "react";
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
	challan: DeliveryChallan;
	formatDate: (s: string) => string;
	getStatusBadge: (s: string) => React.ReactNode;
	onEdit: (challan: DeliveryChallan) => void;
	onDelete: (id: string) => void;
	onPreview: (challan: DeliveryChallan) => void;
	onDownload: (challan: DeliveryChallan) => void;
};

export default function DeliveryChallanRow({
	challan,
	formatDate,
	getStatusBadge,
	onEdit,
	onDelete,
	onPreview,
	onDownload,
}: Props) {
	return (
		<TableRow key={challan.id}>
			<TableCell className="w-35 font-medium">
				<Tooltip>
					<TooltipTrigger asChild>
						<div className="cursor-help truncate">{challan.challanNumber}</div>
					</TooltipTrigger>
					<TooltipContent>
						<p>{challan.challanNumber}</p>
					</TooltipContent>
				</Tooltip>
			</TableCell>

			<TableCell className="w-25">{formatDate(challan.challanDate)}</TableCell>

			<TableCell className="w-50">
				<Tooltip>
					<TooltipTrigger asChild>
						<div className="cursor-help truncate">{challan.buyerName}</div>
					</TooltipTrigger>
					<TooltipContent>
						<p>{challan.buyerName}</p>
					</TooltipContent>
				</Tooltip>
			</TableCell>

			<TableCell className="w-30">
				<Tooltip>
					<TooltipTrigger asChild>
						<div className="cursor-help truncate">
							{challan.buyerCity}, {challan.buyerState}
						</div>
					</TooltipTrigger>
					<TooltipContent>
						<p>
							{challan.buyerCity}, {challan.buyerState}
						</p>
					</TooltipContent>
				</Tooltip>
			</TableCell>

			<TableCell className="w-25">{getStatusBadge(challan.status)}</TableCell>

			<TableCell className="w-37.5 text-right">
				<div className="flex justify-end">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
								<MoreVertical className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onClick={() => onPreview(challan)}>
								<Eye className="mr-2 h-4 w-4" />
								View Challan
							</DropdownMenuItem>
							<DropdownMenuItem>
								<Printer className="mr-2 h-4 w-4" />
								Print Challan
							</DropdownMenuItem>
							{!challan.isFinalized && (
								<DropdownMenuItem onClick={() => onEdit(challan)}>
									<Edit className="mr-2 h-4 w-4" />
									Edit Challan
								</DropdownMenuItem>
							)}
							<DropdownMenuItem onClick={() => onDownload(challan)}>
								<Download className="mr-2 h-4 w-4" />
								Download PDF
							</DropdownMenuItem>
							{!challan.isFinalized && (
								<>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										variant="destructive"
										onClick={() => onDelete(challan.id)}
									>
										<Trash2 className="mr-2 h-4 w-4" />
										Delete Challan
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
