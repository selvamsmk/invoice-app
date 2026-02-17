import fs from "fs";
import path from "path";
import { db } from "@invoice-app/db";
import { product } from "@invoice-app/db/schema/product";
import { isSeedApplied, markSeedApplied } from "./seed-utils";

async function seedProducts() {
  const SEED_KEY = "products_v1";

  if (await isSeedApplied(SEED_KEY)) {
    console.log("Products seed already applied, skipping");
    return;
  }

  console.log("Seeding products...");

  // Try to read products from CSV (fallback to built-in sample list)
  const csvPath = path.join(__dirname, 'products.csv');
  let productsToInsert: Array<{ name: string; defaultRate: number; hsnCode: string; gstPercentage: number }> = [];

  if (fs.existsSync(csvPath)) {
    try {
      const csv = fs.readFileSync(csvPath, 'utf-8');
      const lines = csv.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      if (lines.length > 0) {
        const header = lines.shift()!.split(',').map((h) => h.trim().toLowerCase());
        const idx = {
          name: header.indexOf('name'),
          defaultRate: header.indexOf('defaultrate'),
          hsnCode: header.indexOf('hsncode'),
          gstPercentage: header.indexOf('gstpercentage'),
        };

        for (const [_i, line] of lines.entries()) {
          const cells = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
          const name = cells[idx.name] || '';
          const defaultRate = parseFloat(cells[idx.defaultRate] || '0');
          const hsnCode = cells[idx.hsnCode] || '';
          const gstPercentage = parseFloat(cells[idx.gstPercentage] || '0');
          if (!name) continue;
          productsToInsert.push({ name, defaultRate: Number(defaultRate), hsnCode, gstPercentage: Number(gstPercentage) });
        }
      }
    } catch (err) {
      console.warn('Failed to read products.csv, falling back to sample list', err);
    }
  }

  // If CSV not found or empty, use a default sample list
  if (productsToInsert.length === 0) {
    productsToInsert = [
      { name: 'Paracetamol 500mg Tablets', defaultRate: 25, hsnCode: '30049099', gstPercentage: 12 },
      { name: 'Amoxicillin 250mg Capsules', defaultRate: 120, hsnCode: '30041000', gstPercentage: 12 },
      { name: 'Cetirizine 10mg Tablets', defaultRate: 50, hsnCode: '30049099', gstPercentage: 12 },
      { name: 'Omeprazole 20mg Capsules', defaultRate: 180, hsnCode: '30049099', gstPercentage: 12 },
      { name: 'Metformin 500mg Tablets', defaultRate: 80, hsnCode: '30049099', gstPercentage: 12 },
      { name: 'Amlodipine 5mg Tablets', defaultRate: 75, hsnCode: '30049099', gstPercentage: 12 },
      { name: 'Atorvastatin 10mg Tablets', defaultRate: 150, hsnCode: '30049099', gstPercentage: 12 },
      { name: 'Digital Thermometer', defaultRate: 400, hsnCode: '90251100', gstPercentage: 18 },
      { name: 'Blood Pressure Monitor', defaultRate: 2500, hsnCode: '90189099', gstPercentage: 18 },
      { name: 'Hand Sanitizer 500ml', defaultRate: 150, hsnCode: '38085000', gstPercentage: 18 },
    ];
  }

  // Insert products into DB
  for (const [i, p] of productsToInsert.entries()) {
    await db.insert(product).values({
      id: `${Date.now().toString()}-${i}`,
      name: p.name,
      defaultRate: p.defaultRate,
      hsnCode: p.hsnCode,
      gstPercentage: p.gstPercentage,
    });
  }

  console.log(`✅ Successfully seeded ${productsToInsert.length} products`);
  await markSeedApplied(SEED_KEY);
}

export default seedProducts;