import { appSettings, db, eq } from "@invoice-app/db";
import { z } from "zod";
import { publicProcedure } from "../index";

const invoiceExportDirKey = "invoice_export_dir";

export const settingsRouter = {
	setInvoiceExportDir: publicProcedure
		.input(
			z.object({
				path: z.string().min(1),
			}),
		)
		.handler(async ({ input }) => {
			const normalizedPath = input.path.trim();

			const existingSetting = await db.query.appSettings.findFirst({
				where: eq(appSettings.key, invoiceExportDirKey),
			});

			if (existingSetting) {
				await db
					.update(appSettings)
					.set({
						value: normalizedPath,
						updatedAt: new Date(),
					})
					.where(eq(appSettings.key, invoiceExportDirKey));
			} else {
				await db.insert(appSettings).values({
					id: crypto.randomUUID(),
					key: invoiceExportDirKey,
					value: normalizedPath,
				});
			}

			return {
				success: true,
				key: invoiceExportDirKey,
				value: normalizedPath,
			};
		}),
};

export default settingsRouter;