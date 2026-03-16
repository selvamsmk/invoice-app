import { useMutation } from "@tanstack/react-query";
import { Download, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Loader from "@/components/loader";
import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { useAppContext } from "@/hooks/useAppContext";

interface DeliveryChallanPreviewProps {
	challanId: string;
}

export default function DeliveryChallanPreview({
	challanId,
}: DeliveryChallanPreviewProps) {
	const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
	const [isLoadingPreview, setIsLoadingPreview] = useState(false);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const { orpc } = useAppContext();

	// renderPDF mutation
	const renderPDFMutation = useMutation(
		orpc.renderDcPDF.mutationOptions(),
	);

	useEffect(() => {
		let mounted = true;
		async function fetchPreview() {
			if (!challanId || typeof window === "undefined") return;

			setIsLoadingPreview(true);
			setPreviewUrl(null);

			try {
				const resp = await renderPDFMutation.mutateAsync({ id: challanId });
				if (!resp || !resp.pdfBase64) return;
				const base64 = await resp.pdfBase64;
				const byteChars = atob(base64);
				const byteNumbers = new Array(byteChars.length);
				for (let i = 0; i < byteChars.length; i++) {
					byteNumbers[i] = byteChars.charCodeAt(i);
				}
				const byteArray = new Uint8Array(byteNumbers);
				const blob = new Blob([byteArray], { type: "application/pdf" });
				const url = URL.createObjectURL(blob);
				if (mounted) {
					setPreviewUrl(url);
					setIsLoadingPreview(false);
				}
			} catch (err) {
				if (mounted) setIsLoadingPreview(false);
			}
		}
		fetchPreview();
		return () => {
			mounted = false;
			if (previewUrl) {
				URL.revokeObjectURL(previewUrl);
			}
		};
	}, [challanId]);

	async function handleDownload() {
		if (!challanId) return;
		setIsGeneratingPDF(true);
		try {
			const resp = await renderPDFMutation.mutateAsync({ id: challanId });
			if (!resp || !resp.pdfBase64) throw new Error("Failed to generate PDF");
			const base64 = await resp.pdfBase64;
			const byteChars = atob(base64);
			const byteNumbers = new Array(byteChars.length);
			for (let i = 0; i < byteChars.length; i++) {
				byteNumbers[i] = byteChars.charCodeAt(i);
			}
			const byteArray = new Uint8Array(byteNumbers);
			const blob = new Blob([byteArray], { type: "application/pdf" });
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `delivery-challan-${challanId}.pdf`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
			toast.success("Delivery challan downloaded successfully");
		} catch (err) {
			console.error("Error downloading delivery challan", err);
			toast.error("Failed to download delivery challan");
		} finally {
			setIsGeneratingPDF(false);
		}
	}

	return (
		<div className="flex h-full flex-col">
			<div className="sticky top-0 z-10 border-b bg-background/95 p-6 backdrop-blur supports-backdrop-filter:bg-background/60">
				<div className="flex items-center justify-between">
					<div>
						<CardTitle className="flex items-center gap-2">
							<FileText className="h-5 w-5" />
							Delivery Challan Preview
						</CardTitle>
						<CardDescription>
							View and download the delivery challan PDF
						</CardDescription>
					</div>
					<Button
						onClick={handleDownload}
						disabled={isGeneratingPDF || isLoadingPreview}
					>
						<Download className="mr-2 h-4 w-4" />
						{isGeneratingPDF ? "Generating..." : "Download PDF"}
					</Button>
				</div>
			</div>

			<div className="min-h-0 flex-1 overflow-hidden p-6">
				{isLoadingPreview ? (
					<div className="flex min-h-150 items-center justify-center rounded-md bg-muted/20">
						<Loader />
					</div>
				) : previewUrl ? (
					<div className="h-full overflow-hidden rounded-md border">
						<iframe
							src={previewUrl}
							className="h-full w-full"
							title="Delivery Challan Preview"
						/>
					</div>
				) : (
					<div className="flex min-h-150 items-center justify-center rounded-md bg-muted/20">
						<p className="text-muted-foreground">Failed to load preview</p>
					</div>
				)}
			</div>
		</div>
	);
}
