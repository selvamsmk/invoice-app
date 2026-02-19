import { publicProcedure } from "../index";
import { db, invoice, sql } from "@invoice-app/db";

export const dashboardRouter = {
	getDashboardData: publicProcedure.handler(async () => {
		// Get total count of invoices
		const totalInvoicesResult = await db
			.select({ count: sql<number>`count(*)` })
			.from(invoice);
		const totalInvoices = totalInvoicesResult[0]?.count ?? 0;

		// Get total revenue (sum of all invoice total amounts)
		const totalRevenueResult = await db
			.select({ total: sql<number>`sum(${invoice.totalAmount})` })
			.from(invoice);
		const totalRevenue = totalRevenueResult[0]?.total ?? 0;

		// Get recent invoices (up to 5)
		const recentInvoices = await db.query.invoice.findMany({
			with: {
				buyer: true,
			},
			orderBy: (invoice, { desc }) => [desc(invoice.createdAt)],
			limit: 5,
		});

		// Map recent invoices to simplified format
		const recentInvoicesData = recentInvoices.map((inv) => ({
			invoiceNumber: inv.invoiceNumber,
			buyer: inv.buyerName,
			totalAmount: inv.totalAmount,
			date: inv.invoiceDate,
		}));

		return {
			totalInvoices,
			totalRevenue,
			recentInvoices: recentInvoicesData,
		};
	}),
};
