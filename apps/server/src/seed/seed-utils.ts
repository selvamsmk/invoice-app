import { db, appSeeds, eq } from "@invoice-app/db";

export async function isSeedApplied(seedKey: string) {
  const rows = await db.select().from(appSeeds).where(eq(appSeeds.seedKey, seedKey));
  if (!rows || rows.length === 0) return false;
  // Drizzle sqlite boolean stored as 0/1 integer
  return Boolean(rows[0]?.applied);
}

export async function markSeedApplied(seedKey: string, checksum?: string, notes?: string) {
  const now = new Date().toISOString();
  const existing = await db.select().from(appSeeds).where(eq(appSeeds.seedKey, seedKey));

  if (existing && existing.length > 0) {
    await db
      .update(appSeeds)
      .set({ applied: true, appliedAt: now, checksum: checksum ?? existing[0]?.checksum, notes: notes ?? existing[0]?.notes })
      .where(eq(appSeeds.seedKey, seedKey));
    return;
  }

  await db.insert(appSeeds).values({
    id: crypto.randomUUID(),
    seedKey,
    applied: true,
    appliedAt: now,
    checksum: checksum ?? null,
    notes: notes ?? null,
  });
}
