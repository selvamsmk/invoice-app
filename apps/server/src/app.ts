import { Elysia, type Context } from "elysia";
import { cors } from "@elysiajs/cors";
import { RPCHandler } from "@orpc/server/fetch";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { onError } from "@orpc/server";

import { appRouter } from "@invoice-app/api/routers/index";
import { createContext } from "@invoice-app/api/context";
import { auth } from "@invoice-app/auth";

export function createServer() {
  const rpcHandler = new RPCHandler(appRouter, {
    interceptors: [onError(console.error)],
  });

  const apiHandler = new OpenAPIHandler(appRouter, {
    plugins: [
      new OpenAPIReferencePlugin({
        schemaConverters: [new ZodToJsonSchemaConverter()],
      }),
    ],
    interceptors: [onError(console.error)],
  });

  return new Elysia()
    .use(
     cors({
    origin: (request) => {
      const origin = request.headers.get("origin");

      // 1️⃣ Non-browser / tauri / server-side requests
      if (!origin) return true;

      // 2️⃣ Explicit allowlist
      const allowedOrigins = new Set<string>([
        process.env.CORS_ORIGIN,
        "http://localhost:3001", // web dev
        "http://localhost:1420", // tauri dev
      ].filter(Boolean) as string[]);

      // 3️⃣ Allow tauri protocol
      if (origin.startsWith("tauri://")) return true;

      // 4️⃣ Allow configured origins
      if (allowedOrigins.has(origin)) return true;

      return false;
    },
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
    )
    .all("/api/auth/*", async (context: Context) => {
      if (["POST", "GET"].includes(context.request.method)) {
        return auth.handler(context.request);
      }
      return context.status(405);
    })
    .all("/rpc*", async (context: Context) => {
      const { response } = await rpcHandler.handle(context.request, {
        prefix: "/rpc",
        context: await createContext({ context }),
      });
      return response ?? new Response("Not Found", { status: 404 });
    })
    .all("/api*", async (context: Context) => {
      const { response } = await apiHandler.handle(context.request, {
        prefix: "/api-reference",
        context: await createContext({ context }),
      });
      return response ?? new Response("Not Found", { status: 404 });
    })
    .get("/health", () => "OK");
}
