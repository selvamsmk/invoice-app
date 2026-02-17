import { protectedProcedure, publicProcedure } from "../index";
import type { RouterClient } from "@orpc/server";
import { buyersRouter } from "./buyers";
import { productsRouter } from "./products";
import { companyRouter } from "./company";
import { invoicesRouter } from "./invoices";

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
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;