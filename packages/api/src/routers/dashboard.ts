import { db, invoice, sql, stentInvoice } from "@invoice-app/db";
import { publicProcedure } from "../index";

export const dashboardRouter = {
	getDashboardData: publicProcedure.handler(async () => {
		const [
			totalInvoicesResult,
			totalStentInvoicesResult,
			totalRevenueResult,
			totalStentRevenueResult,
			recentInvoices,
			recentStentInvoices,
		] = await Promise.all([
			db.select({ count: sql<number>`count(*)` }).from(invoice),
			db.select({ count: sql<number>`count(*)` }).from(stentInvoice),
			db.select({ total: sql<number>`sum(${invoice.totalAmount})` }).from(invoice),
			db
				.select({ total: sql<number>`sum(${stentInvoice.totalAmount})` })
				.from(stentInvoice),
			db.query.invoice.findMany({
				orderBy: (invoice, { desc }) => [desc(invoice.createdAt)],
				limit: 5,
			}),
			db.query.stentInvoice.findMany({
				orderBy: (stentInvoice, { desc }) => [desc(stentInvoice.createdAt)],
				limit: 5,
			}),
		]);

		const totalInvoices =
			(totalInvoicesResult[0]?.count ?? 0) +
			(totalStentInvoicesResult[0]?.count ?? 0);

		const totalRevenue =
			(totalRevenueResult[0]?.total ?? 0) +
			(totalStentRevenueResult[0]?.total ?? 0);

		const mergedRecentInvoices = [
			...recentInvoices.map((inv) => ({
				invoiceNumber: inv.invoiceNumber,
				buyer: inv.buyerName,
				totalAmount: inv.totalAmount,
				date: inv.invoiceDate,
				createdAt: inv.createdAt,
			})),
			...recentStentInvoices.map((inv) => ({
				invoiceNumber: inv.invoiceNumber,
				buyer: inv.buyerName,
				totalAmount: inv.totalAmount,
				date: inv.invoiceDate,
				createdAt: inv.createdAt,
			})),
		]
			.sort((a, b) => {
				const toTimestamp = (value: Date | string | number | null | undefined) => {
					if (value instanceof Date) return value.getTime();
					if (typeof value === "number") return value;
					if (typeof value === "string") return new Date(value).getTime();
					return 0;
				};

				return toTimestamp(b.createdAt) - toTimestamp(a.createdAt);
			})
			.slice(0, 5)
			.map(({ createdAt: _createdAt, ...invoiceData }) => invoiceData);

		return {
			totalInvoices,
			totalRevenue,
			recentInvoices: mergedRecentInvoices,
		};
	}),
};
