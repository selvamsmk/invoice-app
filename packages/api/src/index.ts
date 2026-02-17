import { ORPCError, os } from "@orpc/server";
import type { Context } from "./context";
import { buyer, product, company, invoice } from "@invoice-app/db";
import type { AppRouterClient } from './routers'

export const o = os.$context<Context>();

export const publicProcedure = o;

const requireAuth = o.middleware(async ({ context, next }) => {
	if (!context.session?.user) {
		throw new ORPCError("UNAUTHORIZED");
	}
	return next({
		context: {
			session: context.session,
		},
	});
});

export const protectedProcedure = publicProcedure.use(requireAuth);

// Export types for frontend use
export type Buyer = typeof buyer.$inferSelect;
export type Product = typeof product.$inferSelect;
export type Company = typeof company.$inferSelect;
export type Invoice = typeof invoice.$inferSelect;
export type { AppRouterClient };
