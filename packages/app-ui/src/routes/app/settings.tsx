import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { FolderOpen, Loader2, Settings } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useAppContext } from "@/hooks/useAppContext";

export const Route = createFileRoute("/app/settings")({
	component: SettingsPage,
});

function SettingsPage() {
	const { orpc } = useAppContext();

	const invoiceExportDirQuery = useQuery(orpc.getInvoiceExportDir.queryOptions());

	const setInvoiceExportDirMutation = useMutation(
		orpc.setInvoiceExportDir.mutationOptions({
			onSuccess: () => {
				invoiceExportDirQuery.refetch();
				toast.success("Invoice folder saved");
			},
			onError: (error) => {
				toast.error(error.message || "Failed to save invoice folder");
			},
		}),
	);

	const handleChooseInvoiceFolder = async () => {
		try {
			const { open } = await import("@tauri-apps/plugin-dialog");

			const selected = await open({
				directory: true,
				multiple: false,
			});

			if (!selected) return;

			const selectedPath = Array.isArray(selected) ? selected[0] : selected;
			if (!selectedPath) return;

			await setInvoiceExportDirMutation.mutateAsync({
				path: selectedPath,
			});
		} catch (error) {
			console.error("Failed to select folder:", error);
			toast.error("Unable to open folder picker");
		}
	};

	const selectedFolderPath = invoiceExportDirQuery.data?.value ?? "Not set";

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="font-bold text-3xl tracking-tight">Settings</h1>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Settings className="h-5 w-5" />
						Invoice Export
					</CardTitle>
					<CardDescription>
						Choose the base folder where invoices will be exported.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="rounded-md border bg-muted/30 p-3">
						<p className="text-muted-foreground text-sm">Selected folder</p>
						<p className="break-all font-mono text-sm">{selectedFolderPath}</p>
					</div>

					<Button
						onClick={handleChooseInvoiceFolder}
						disabled={
							invoiceExportDirQuery.isLoading ||
							setInvoiceExportDirMutation.isPending
						}
					>
						{setInvoiceExportDirMutation.isPending ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : (
							<FolderOpen className="mr-2 h-4 w-4" />
						)}
						Choose Invoice Folder
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}