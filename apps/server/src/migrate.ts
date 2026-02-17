import { db, migrate, sql } from "@invoice-app/db";
import path from "path";

export async function runMigrations() {
  const migrationsFolder =
    process.env.MIGRATIONS_DIR ??
    path.resolve(process.cwd(), "migrations");

  console.log("📂 Running migrations from:", migrationsFolder);

  const existingTables = await db.all<{ name: string }>(sql`
    select name
    from sqlite_master
    where type = 'table'
      and name not like 'sqlite_%'
      and name != '_drizzle_migrations'
  `);

  if (existingTables.length > 0) {
    console.warn(
      "⚠️ Migration skipped: existing tables found. If schema changed, reset local DB.",
    );
    return;
  }

  try {
    await migrate(db, {
      migrationsFolder,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const alreadyExists = message.includes("already exists");
    if (alreadyExists) {
      console.warn("⚠️ Migration skipped: table already exists. If schema changed, reset local DB.");
      return;
    }
    throw err;
  }
}

