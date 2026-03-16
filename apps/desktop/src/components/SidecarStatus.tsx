import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { AlertTriangle, Loader, XCircle } from "lucide-react";

export function SidecarStatus() {
	const [status, setStatus] = useState<"unknown" | "started" | "healthy" | "error">("unknown");
	const [errorMsg, setErrorMsg] = useState<string>("");
	const [logs, setLogs] = useState<string[]>([]);

	useEffect(() => {
		let unlisteners: (() => void)[] = [];

		const setup = async () => {
			// Listen to sidecar status events
			const unlistenStatus = await listen<string>("sidecar:status", (event) => {
				setStatus(event.payload as any);
				setErrorMsg("");
			});

			const unlistenError = await listen<string>("sidecar:error", (event) => {
				setStatus("error");
				setErrorMsg(event.payload);
				console.error("[Sidecar Error]", event.payload);
			});

			const unlistenStderr = await listen<string>("sidecar:stderr", (event) => {
				setLogs((prev) => [...prev.slice(-4), event.payload]);
			});

			const unlistenStdout = await listen<string>("sidecar:stdout", (event) => {
				setLogs((prev) => [...prev.slice(-4), event.payload]);
			});

			unlisteners = [unlistenStatus, unlistenError, unlistenStderr, unlistenStdout];
		};

		setup().catch((err) => {
			console.error("Failed to listen to sidecar events", err);
		});

		return () => {
			unlisteners.forEach((fn) => fn?.());
		};
	}, []);

	if (status === "healthy" || status === "unknown") {
		return null; // Hide when healthy
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			<div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg dark:bg-slate-900">
				{status === "started" && (
					<div className="flex items-start gap-4">
						<Loader className="h-6 w-6 animate-spin text-blue-500" />
						<div className="flex-1">
							<h2 className="font-semibold text-lg">Starting Server...</h2>
							<p className="text-muted-foreground mt-2">
								The backend server is initializing. Please wait.
							</p>
						</div>
					</div>
				)}

				{status === "error" && (
					<div className="flex items-start gap-4">
						<XCircle className="h-6 w-6 text-red-500 shrink-0 mt-1" />
						<div className="flex-1">
							<h2 className="font-semibold text-lg text-red-600">Server Error</h2>
							<p className="text-muted-foreground mt-2 text-sm">{errorMsg}</p>

							{logs.length > 0 && (
								<div className="mt-4">
									<h4 className="font-medium text-sm mb-2">Recent Logs:</h4>
									<div className="bg-slate-100 dark:bg-slate-800 p-3 rounded font-mono text-xs max-h-32 overflow-y-auto">
										{logs.map((log, i) => (
											<div key={i} className="text-red-600 dark:text-red-400 whitespace-pre-wrap break-words">
												{log}
											</div>
										))}
									</div>
								</div>
							)}

							<div className="mt-4 p-3 bg-amber-100 dark:bg-amber-900/30 rounded text-sm text-amber-800 dark:text-amber-300">
								<AlertTriangle className="inline h-4 w-4 mr-2" />
								<strong>Troubleshooting:</strong>
								<ul className="mt-2 list-disc list-inside space-y-1">
									<li>Check if port 3000 is available: <code className="bg-amber-200/50 px-1">lsof -i :3000</code></li>
									<li>Ensure the app has permissions to access the database</li>
									<li>Try restarting the application</li>
									<li>Check system logs if error persists</li>
								</ul>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
