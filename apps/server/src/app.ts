import { cors } from "@elysiajs/cors";
import { createContext } from "@invoice-app/api/context";
import { appRouter } from "@invoice-app/api/routers/index";
import { auth } from "@invoice-app/auth";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { type Context, Elysia } from "elysia";
import { requestLogger } from "./plugins/logger";

// Enhanced error logger that provides detailed validation error messages
function enhancedErrorLogger(error: any) {
	// Handle oRPC validation errors with data.issues structure
	if (error?.data?.issues && Array.isArray(error.data.issues)) {
		const issues = error.data.issues.map(
			(issue: any) => {
				const path = issue.path?.length > 0 ? issue.path.join(".") : "root";
				return `  ✗ ${path}: ${issue.message}`;
			},
		);
		console.error(
			`\n❌ Input Validation Failed\n${issues.join("\n")}\n`,
		);
		return;
	}

	// Handle other errors
	if (error instanceof Error) {
		console.error(`\n❌ ${error.name}: ${error.message}\n`);
		if (error.stack) console.error(error.stack);
	} else {
		console.error("\n❌ Error:", error);
	}
}

export function createServer() {
	const rpcHandler = new RPCHandler(appRouter, {
		interceptors: [onError(enhancedErrorLogger)],
	});

	const apiHandler = new OpenAPIHandler(appRouter, {
		plugins: [
			new OpenAPIReferencePlugin({
				schemaConverters: [new ZodToJsonSchemaConverter()],
			}),
		],
		interceptors: [onError(enhancedErrorLogger)],
	});

	return new Elysia()
		.use(requestLogger)
		.use(
			cors({
				origin: (request) => {
					const origin = request.headers.get("origin");

					// 1️⃣ Non-browser / tauri / server-side requests
					if (!origin) return true;

					// 2️⃣ Explicit allowlist
					const envOrigins = (process.env.CORS_ORIGIN ?? "")
						.split(",")
						.map((value) => value.trim())
						.filter(Boolean);

					const allowedOrigins = new Set<string>([
						...envOrigins,
						"http://localhost:3001", // web dev
						"http://localhost:1420", // tauri dev
						"http://127.0.0.1:3001",
						"http://127.0.0.1:1420",
						"http://tauri.localhost", // tauri v2
						"https://tauri.localhost", // tauri v2
					]);

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
				context: await createContext({ context: context as any }),
			});
			return response ?? new Response("Not Found", { status: 404 });
		})
		.all("/api*", async (context: Context) => {
			const { response } = await apiHandler.handle(context.request, {
				prefix: "/api-reference",
				context: await createContext({ context: context as any }),
			});
			return response ?? new Response("Not Found", { status: 404 });
		})
		.get("/health", () => "OK");
}
