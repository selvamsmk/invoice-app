import type { DeliveryChallan } from "@invoice-app/api";
import type React from "react";
import {
	TableBody,
	TableCell,
	TableRow,
} from "@/components/ui/table";
import DeliveryChallanRow from "./DeliveryChallanRow";

type Props = {
	challans: DeliveryChallan[];
	onEdit: (challan: DeliveryChallan) => void;
	onDelete: (id: string) => void;
	onPreview: (challan: DeliveryChallan) => void;
	onDownload: (challan: DeliveryChallan) => void;
	getStatusBadge: (status: string) => React.ReactNode;
};

export default function DeliveryChallanList({
	challans,
	onEdit,
	onDelete,
	onPreview,
	onDownload,
	getStatusBadge,
}: Props) {
	const formatDate = (dateString: string) => {
		if (!dateString) return "-";
		return new Date(dateString).toLocaleDateString("en-IN", {
			day: "2-digit",
			month: "short",
			year: "numeric",
		});
	};

	return (
		<TableBody>
			{challans.length === 0 ? (
				<TableRow>
					<TableCell colSpan={6} className="py-12 text-center">
						<div className="space-y-1">
							<p className="font-medium text-sm">No delivery challans yet</p>
							<p className="text-muted-foreground text-sm">
								Create your first delivery challan to get started.
							</p>
						</div>
					</TableCell>
				</TableRow>
			) : (
				challans.map((challan) => (
					<DeliveryChallanRow
						key={challan.id}
						challan={challan}
						formatDate={formatDate}
						getStatusBadge={getStatusBadge}
						onEdit={onEdit}
						onDelete={onDelete}
						onPreview={onPreview}
						onDownload={onDownload}
					/>
				))
			)}
		</TableBody>
	);
}
