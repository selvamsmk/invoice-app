import { db, eq, product } from "@invoice-app/db";
import { z } from "zod";
import { publicProcedure } from "../index";

export const productsRouter = {
	listProducts: publicProcedure.handler(async () => {
		const products = await db.select().from(product);
		return products;
	}),

	createProduct: publicProcedure
		.input(
			z.object({
				name: z.string().min(1),
				defaultRate: z.number().positive(),
				hsnCode: z.string().min(1),
				gstPercentage: z.number().min(0).max(100),
			}),
		)
		.handler(async ({ input }) => {
			const [newProduct] = await db
				.insert(product)
				.values({
					id: Date.now().toString(),
					name: input.name,
					defaultRate: input.defaultRate,
					hsnCode: input.hsnCode,
					gstPercentage: input.gstPercentage,
				})
				.returning();

			return newProduct;
		}),

	updateProduct: publicProcedure
		.input(
			z.object({
				id: z.string(),
				name: z.string().min(1),
				defaultRate: z.number().positive(),
				hsnCode: z.string().min(1),
				gstPercentage: z.number().min(0).max(100),
			}),
		)
		.handler(async ({ input }) => {
			const [updatedProduct] = await db
				.update(product)
				.set({
					name: input.name,
					defaultRate: input.defaultRate,
					hsnCode: input.hsnCode,
					gstPercentage: input.gstPercentage,
					updatedAt: new Date(),
				})
				.where(eq(product.id, input.id))
				.returning();

			return updatedProduct;
		}),

	deleteProduct: publicProcedure
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.handler(async ({ input }) => {
			const [deletedProduct] = await db
				.delete(product)
				.where(eq(product.id, input.id))
				.returning();
			return deletedProduct;
		}),

	// Upload products via CSV content (CSV must have header: name,defaultRate,hsnCode,gstPercentage)
	uploadProductsCSV: publicProcedure
		.input(z.object({ csv: z.string() }))
		.handler(async ({ input }) => {
			const csv = input.csv || "";
			const lines = csv
				.split(/\r?\n/)
				.map((l) => l.trim())
				.filter(Boolean);
			if (lines.length === 0) {
				return { insertedCount: 0, insertedNames: [] };
			}

			const headerRaw = lines.shift()!;
			const header = headerRaw.split(",").map((h) => h.trim());
			const normalize = (s: string) => s.replace(/\s+/g, "").toLowerCase();
			const headerNorm = header.map(normalize);

			const required = ["name", "defaultrate", "hsncode", "gstpercentage"];
			const missing = required.filter((r) => !headerNorm.includes(r));
			if (missing.length > 0) {
				throw new Error(`Missing required columns: ${missing.join(", ")}`);
			}

			const idx = {
				name: headerNorm.indexOf("name"),
				defaultRate: headerNorm.indexOf("defaultrate"),
				hsnCode: headerNorm.indexOf("hsncode"),
				gstPercentage: headerNorm.indexOf("gstpercentage"),
			};

			const rows: Array<{
				name: string;
				defaultRate: number;
				hsnCode: string;
				gstPercentage: number;
			}> = [];
			const namesSeen = new Set<string>();
			const duplicatesInFile: string[] = [];

			for (const [i, line] of lines.entries()) {
				const cells = line
					.split(",")
					.map((c) => c.trim().replace(/^"|"$/g, ""));
				const name = (cells[idx.name] || "").trim();
				const defaultRateRaw = (cells[idx.defaultRate] || "").trim();
				const hsnCode = (cells[idx.hsnCode] || "").trim();
				const gstRaw = (cells[idx.gstPercentage] || "").trim();

				if (!name) throw new Error(`Row ${i + 2}: name is required`);
				const defaultRate = Number.parseFloat(defaultRateRaw);
				if (Number.isNaN(defaultRate) || defaultRate <= 0)
					throw new Error(
						`Row ${i + 2}: defaultRate must be a positive number`,
					);
				if (!hsnCode) throw new Error(`Row ${i + 2}: hsnCode is required`);
				const gstPercentage = Number.parseFloat(gstRaw);
				if (
					Number.isNaN(gstPercentage) ||
					gstPercentage < 0 ||
					gstPercentage > 100
				)
					throw new Error(
						`Row ${i + 2}: gstPercentage must be between 0 and 100`,
					);

				if (namesSeen.has(name)) duplicatesInFile.push(name);
				namesSeen.add(name);
				rows.push({ name, defaultRate, hsnCode, gstPercentage });
			}

			// Unique duplicate names found inside the uploaded file
			const duplicateNamesInFile = [...new Set(duplicatesInFile)];

			// Check existing names in DB
			const existingProducts = await db.select().from(product);
			const existingNamesSet = new Set(existingProducts.map((p) => p.name));
			const existingNames = [...namesSeen].filter((n) =>
				existingNamesSet.has(n),
			);

			// Filter rows to only those that are NOT duplicates in file and NOT existing in DB
			const rowsToInsert = rows.filter(
				(r) =>
					!duplicateNamesInFile.includes(r.name) &&
					!existingNamesSet.has(r.name),
			);

			// Insert valid rows
			const insertedNames: string[] = [];
			for (const [i, r] of rowsToInsert.entries()) {
				const [newProduct] = await db
					.insert(product)
					.values({
						id: `${Date.now().toString()}-${i}`,
						name: r.name,
						defaultRate: r.defaultRate,
						hsnCode: r.hsnCode,
						gstPercentage: r.gstPercentage,
					})
					.returning();
				if (newProduct) insertedNames.push(newProduct.name);
			}

			return {
				insertedCount: insertedNames.length,
				insertedNames,
				duplicateNamesInFile: duplicateNamesInFile,
				existingNames: existingNames,
			};
		}),
};

export default productsRouter;
