import type { RouterClient } from "@orpc/server";
import { protectedProcedure, publicProcedure } from "../index";
import { buyersRouter } from "./buyers";
import { companyRouter } from "./company";
import { dashboardRouter } from "./dashboard";
import { deliveryChallansRouter } from "./delivery-challans";
import { invoicesRouter } from "./invoices";
import { productsRouter } from "./products";
import { stentInvoicesRouter } from "./stent-invoices";

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
	...dashboardRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
