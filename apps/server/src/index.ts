import "dotenv/config";
import { createServer } from "./app";
import { runMigrations } from "./migrate";
import seedBuyers from "./seed/create-buyers";
import seedCompany from "./seed/create-company";
import seedProducts from "./seed/create-products";
import seedInitialUser from "./seed/create-user";

async function main() {
	await runMigrations();
	await seedInitialUser();
	await seedBuyers();
	await seedProducts();
	await seedCompany();

	const port = Number(process.env.PORT ?? 3000);

	const app = createServer();
	const server = app.listen(port, () => {
		console.log(`🚀 Server running on http://localhost:${port}`);
	});

	const shutdown = () => {
		console.log("🛑 Shutting down server...");
		server.stop?.();
		process.exit(0);
	};

	process.on("SIGINT", shutdown);
	process.on("SIGTERM", shutdown);
}

main().catch((err) => {
	console.error("❌ Failed to start server", err);
	process.exit(1);
});
