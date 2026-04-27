import { db, migrate } from "@invoice-app/db";
import path from "path";

export async function runMigrations() {
	const migrationsFolder =
		process.env.MIGRATIONS_DIR ?? path.resolve(process.cwd(), "migrations");

	console.log("📂 Running migrations from:", migrationsFolder);

	try {
		await migrate(db, {
			migrationsFolder,
		});
		console.log("✅ Migrations are up to date.");
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		const alreadyExists = message.includes("already exists");
		if (alreadyExists) {
			console.warn(
				"⚠️ Migration conflict detected (objects already exist). Check migration history/state before retrying.",
			);
			throw err;
		}
		throw err;
	}
}
