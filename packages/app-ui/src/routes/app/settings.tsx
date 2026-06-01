import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	AlertTriangle,
	FolderOpen,
	Loader2,
	RefreshCw,
	Settings,
	ShieldCheck,
} from "lucide-react";
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
	const archiveIntegrityQuery = useQuery(
		orpc.getArchiveIntegrityStatus.queryOptions(),
	);

	const setInvoiceExportDirMutation = useMutation(
		orpc.setInvoiceExportDir.mutationOptions({
			onSuccess: () => {
				invoiceExportDirQuery.refetch();
				archiveIntegrityQuery.refetch();
				toast.success("Invoice folder saved");
			},
			onError: (error) => {
				toast.error(error.message || "Failed to save invoice folder");
			},
		}),
	);

	const rebuildArchiveViewsMutation = useMutation(
		orpc.rebuildArchiveViews.mutationOptions({
			onSuccess: async (result) => {
				await archiveIntegrityQuery.refetch();
				toast.success(
					`Rebuild completed. ${result.rebuiltCount} document views repaired.`,
				);
			},
			onError: (error) => {
				toast.error(error.message || "Failed to rebuild archive views");
			},
		}),
	);

	const syncAllArchiveDocumentsMutation = useMutation(
		orpc.syncAllArchiveDocuments.mutationOptions({
			onSuccess: async (result) => {
				await archiveIntegrityQuery.refetch();
				toast.success(
					`Archive sync completed. ${result.totalSynced} documents synchronized.`,
				);
			},
			onError: (error) => {
				toast.error(error.message || "Failed to sync archive documents");
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
	const integrity = archiveIntegrityQuery.data;
	const effectiveArchiveRoot = integrity?.archiveRoot ?? selectedFolderPath;
	const integrityItems = integrity?.items ?? [];

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

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<ShieldCheck className="h-5 w-5" />
						Archive Maintenance
					</CardTitle>
					<CardDescription>
						Rebuild archive views and monitor hard-link integrity.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="rounded-md border bg-muted/30 p-3">
						<p className="text-muted-foreground text-sm">Archive root in use</p>
						<p className="break-all font-mono text-sm">{effectiveArchiveRoot}</p>
					</div>

					<div className="grid gap-3 md:grid-cols-3">
						<div className="rounded-md border p-3">
							<p className="text-muted-foreground text-xs">Documents tracked</p>
							<p className="font-semibold text-lg">
								{archiveIntegrityQuery.isLoading
									? "..."
									: integrity?.totalDocuments ?? 0}
							</p>
						</div>
						<div className="rounded-md border p-3">
							<p className="text-muted-foreground text-xs">Healthy</p>
							<p className="font-semibold text-green-700 text-lg">
								{archiveIntegrityQuery.isLoading
									? "..."
									: integrity?.healthyDocuments ?? 0}
							</p>
						</div>
						<div className="rounded-md border p-3">
							<p className="text-muted-foreground text-xs">With issues</p>
							<p className="font-semibold text-destructive text-lg">
								{archiveIntegrityQuery.isLoading
									? "..."
									: integrity?.issuesCount ?? 0}
							</p>
						</div>
					</div>

					<div className="grid gap-3 md:grid-cols-3">
						<div className="rounded-md border p-3">
							<p className="text-muted-foreground text-xs">Missing canonical</p>
							<p className="font-medium text-sm">
								{integrity?.missingCanonicalCount ?? 0}
							</p>
						</div>
						<div className="rounded-md border p-3">
							<p className="text-muted-foreground text-xs">Missing links</p>
							<p className="font-medium text-sm">{integrity?.missingLinksCount ?? 0}</p>
						</div>
						<div className="rounded-md border p-3">
							<p className="text-muted-foreground text-xs">Mismatched links</p>
							<p className="font-medium text-sm">
								{integrity?.mismatchedLinksCount ?? 0}
							</p>
						</div>
					</div>

					<Button
						variant="secondary"
						className="mr-2"
						onClick={() => syncAllArchiveDocumentsMutation.mutate(undefined)}
						disabled={
							syncAllArchiveDocumentsMutation.isPending ||
							archiveIntegrityQuery.isLoading
						}
					>
						{syncAllArchiveDocumentsMutation.isPending ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : (
							<RefreshCw className="mr-2 h-4 w-4" />
						)}
						Sync All Documents
					</Button>

					<Button
						onClick={() => rebuildArchiveViewsMutation.mutate(undefined)}
						disabled={
							rebuildArchiveViewsMutation.isPending ||
							archiveIntegrityQuery.isLoading
						}
					>
						{rebuildArchiveViewsMutation.isPending ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : (
							<RefreshCw className="mr-2 h-4 w-4" />
						)}
						Rebuild Archive Views
					</Button>

					{integrityItems.length > 0 ? (
						<div className="space-y-2">
							<p className="font-medium text-sm">Recent archive records</p>
							<div className="max-h-64 space-y-2 overflow-auto pr-1">
								{integrityItems.slice(0, 12).map((item) => (
									<div
										key={`${item.documentType}:${item.documentId}`}
										className="rounded-md border p-3"
									>
										<div className="flex items-center justify-between gap-3">
											<p className="font-medium text-sm">{item.documentNumber}</p>
											{item.isHealthy ? (
												<span className="text-green-700 text-xs">Healthy</span>
											) : (
												<span className="inline-flex items-center gap-1 text-destructive text-xs">
													<AlertTriangle className="h-3.5 w-3.5" />
													Issue
												</span>
											)}
										</div>
										<p className="text-muted-foreground text-xs">
											{item.documentType} • {item.buyerName} • {item.documentDate}
										</p>
										{!item.isHealthy ? (
											<p className="text-destructive text-xs">
												Missing: {item.missingPathCount}, Mismatched: {item.mismatchedPathCount}
											</p>
										) : null}
									</div>
								))}
							</div>
						</div>
					) : null}
				</CardContent>
			</Card>
		</div>
	);
}