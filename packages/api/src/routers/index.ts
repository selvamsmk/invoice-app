import type { RouterClient } from "@orpc/server";
import { protectedProcedure, publicProcedure } from "../index";
import { buyersRouter } from "./buyers";
import { companyRouter } from "./company";
import { dashboardRouter } from "./dashboard";
import { deliveryChallansRouter } from "./delivery-challans";
import { invoicesRouter } from "./invoices";
import { productsRouter } from "./products";
import { settingsRouter } from "./settings";
import { stentInvoicesRouter } from "./stent-invoices";
import { supplyStatementRouter } from "./supply-statement";

export const appRouter = {
	healthCheck: publicProcedure.handler(() => {
		return "OK";
	}),
	privateData: protectedProcedure.handler(({ context }) => {
		return {
			message: "This is private",
			user: context.session?.user,
		};
	}),
	// Spread module routers
	...buyersRouter,
	...productsRouter,
	...companyRouter,
	...invoicesRouter,
	...stentInvoicesRouter,
	...deliveryChallansRouter,
	...supplyStatementRouter,
	...dashboardRouter,
	...settingsRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
