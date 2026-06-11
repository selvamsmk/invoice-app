import path from "node:path";
import { appSettings, db, eq } from "@invoice-app/db";

export const invoiceExportDirKey = "invoice_export_dir";

export async function getConfiguredArchiveRoot(): Promise<string | null> {
	const setting = await db.query.appSettings.findFirst({
		where: eq(appSettings.key, invoiceExportDirKey),
	});

	const rawPath = setting?.value?.trim();
	if (!rawPath) {
		return null;
	}

	return path.resolve(rawPath);
}
