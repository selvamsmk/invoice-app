const INVALID_FILE_SYSTEM_CHARS_REGEX = /[<>:"/\\|?*]/g;

export function sanitizeFolderName(name: string): string {
	return name.replace(INVALID_FILE_SYSTEM_CHARS_REGEX, "").trim();
}

export async function ensureDir(dir: string): Promise<void> {
	const targetDir = dir.trim();
	if (!targetDir) {
		throw new Error("Directory path is required");
	}

	// Prefer Tauri FS in desktop runtime.
	try {
		const moduleName = "@tauri-apps/plugin-fs";
		const tauriFs = (await import(/* @vite-ignore */ moduleName)) as {
			mkdir: (path: string, options?: { recursive?: boolean }) => Promise<void>;
		};
		if (typeof tauriFs.mkdir === "function") {
			await tauriFs.mkdir(targetDir, { recursive: true });
			return;
		}
	} catch {
		// Fall through to Node.js fs fallback.
	}

	// Fallback for Node-capable runtimes.
	const fs = await import("node:fs/promises");
	await fs.mkdir(targetDir, { recursive: true });
}

export function formatMonth(date: Date): string {
	const monthNumber = String(date.getMonth() + 1).padStart(2, "0");
	const monthName = date.toLocaleString("en-US", { month: "long" });
	return `${monthNumber}-${monthName}`;
}

export function formatInvoiceFileName(
	invoiceNumber: string | number,
	buyerName: string,
	invoiceDate: Date | string | number,
): string {
	const date = new Date(invoiceDate);
	if (Number.isNaN(date.getTime())) {
		throw new Error("Invalid invoice date");
	}

	const formattedDate = date.toISOString().slice(0, 10);
	const sanitizedBuyer = sanitizeFolderName(buyerName)
		.replace(/\s+/g, " ")
		.trim();
	const sanitizedInvoiceNumber = String(invoiceNumber)
		.replace(INVALID_FILE_SYSTEM_CHARS_REGEX, "")
		.trim();

	return `${formattedDate}_INV-${sanitizedInvoiceNumber}_${sanitizedBuyer}.pdf`;
}
