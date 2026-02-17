import { protectedProcedure, publicProcedure } from "../index";
import { db, buyer, eq } from "@invoice-app/db";
import { z } from "zod";

export const buyersRouter = {
  listBuyers: publicProcedure.handler(async () => {
    const buyers = await db.select().from(buyer);
    return buyers;
  }),
  createBuyer: publicProcedure
    .input(z.object({
      name: z.string().min(1),
      addressLine1: z.string().min(1),
      addressLine2: z.string().optional(),
      addressLine3: z.string().optional(),
      city: z.string().min(1),
      state: z.string().min(1),
      country: z.string().default("India"),
      pincode: z.string().regex(/^\d{6}$/),
      gstin: z.string().min(1),
      mobileNumber: z.string().optional(),
      emailAddress: z.email().optional().or(z.literal("")),
      drugLicenseNumber: z.string().optional(),
      stateCode: z.string().optional(),
    }))
    .handler(async ({ input }) => {
      const [newBuyer] = await db
        .insert(buyer)
        .values({
          id: Date.now().toString(),
          name: input.name,
          addressLine1: input.addressLine1,
          addressLine2: input.addressLine2 || null,
          addressLine3: input.addressLine3 || null,
          city: input.city,
          state: input.state,
          country: input.country,
          pincode: input.pincode,
          gstin: input.gstin,
          mobileNumber: input.mobileNumber || null,
          emailAddress: input.emailAddress || null,
          drugLicenseNumber: input.drugLicenseNumber || null,
          stateCode: input.stateCode || null,
          totalInvoices: 0,
        })
        .returning();

      return newBuyer;
    }),
  updateBuyer: publicProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1),
      addressLine1: z.string().min(1),
      addressLine2: z.string().optional(),
      addressLine3: z.string().optional(),
      city: z.string().min(1),
      state: z.string().min(1),
      country: z.string().default("India"),
      pincode: z.string().regex(/^\d{6}$/),
      gstin: z.string().min(1),
      mobileNumber: z.string().optional(),
      emailAddress: z.email().optional().or(z.literal("")),
      drugLicenseNumber: z.string().optional(),
      stateCode: z.string().optional(),
    }))
    .handler(async ({ input }) => {
      const [updatedBuyer] = await db
        .update(buyer)
        .set({
          name: input.name,
          addressLine1: input.addressLine1,
          addressLine2: input.addressLine2 || null,
          addressLine3: input.addressLine3 || null,
          city: input.city,
          state: input.state,
          country: input.country,
          pincode: input.pincode,
          gstin: input.gstin,
          mobileNumber: input.mobileNumber || null,
          emailAddress: input.emailAddress || null,
          drugLicenseNumber: input.drugLicenseNumber || null,
          stateCode: input.stateCode || null,
          updatedAt: new Date(),
        })
        .where(eq(buyer.id, input.id))
        .returning();

      return updatedBuyer;
    }),
  deleteBuyer: publicProcedure
    .input(z.object({
      id: z.string(),
    }))
    .handler(async ({ input }) => {
      const [deletedBuyer] = await db.delete(buyer).where(eq(buyer.id, input.id)).returning();
      return deletedBuyer;
    }),

  // Upload buyers via CSV content (CSV must have header: name,addressLine1,city,state,pincode,gstin)
  uploadBuyersCSV: publicProcedure
    .input(z.object({ csv: z.string() }))
    .handler(async ({ input }) => {
      // Helper to parse CSV line respecting quotes
      const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };

      const csv = input.csv || "";
      const lines = csv.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      if (lines.length === 0) {
        return { insertedCount: 0, insertedNames: [] };
      }

      const headerRaw = lines.shift()!;
      const header = parseCSVLine(headerRaw);
      const normalize = (s: string) => s.replace(/\s+/g, '').toLowerCase();
      const headerNorm = header.map(normalize);

      const required = ['name', 'addressline1', 'city', 'state', 'pincode'];
      const missing = required.filter((r) => !headerNorm.includes(r));
      if (missing.length > 0) {
        throw new Error(`Missing required columns: ${missing.join(', ')}`);
      }

      const idx = {
        name: headerNorm.indexOf('name'),
        addressLine1: headerNorm.indexOf('addressline1'),
        addressLine2: headerNorm.indexOf('addressline2'),
        addressLine3: headerNorm.indexOf('addressline3'),
        city: headerNorm.indexOf('city'),
        state: headerNorm.indexOf('state'),
        country: headerNorm.indexOf('country'),
        pincode: headerNorm.indexOf('pincode'),
        gstin: headerNorm.indexOf('gstin'),
        mobileNumber: headerNorm.indexOf('mobilenumber'),
        emailAddress: headerNorm.indexOf('emailaddress'),
        drugLicenseNumber: headerNorm.indexOf('druglicensenumber'),
        stateCode: headerNorm.indexOf('statecode'),
        totalInvoices: headerNorm.indexOf('totalinvoices'),
      };

      const rows: Array<any> = [];
      const namesSeen = new Set<string>();
      const duplicatesInFile: string[] = [];

      for (const [i, line] of lines.entries()) {
        const cells = parseCSVLine(line);
        const name = (cells[idx.name] || '').trim();
        const addressLine1 = (cells[idx.addressLine1] || '').trim();
        const addressLine2 = (cells[idx.addressLine2] || '').trim();
        const addressLine3 = (cells[idx.addressLine3] || '').trim();
        const city = (cells[idx.city] || '').trim();
        const state = (cells[idx.state] || '').trim();
        const country = (cells[idx.country] || '').trim() || 'India';
        const pincode = (cells[idx.pincode] || '').trim();
        const gstin = (cells[idx.gstin] || '').trim();
        const mobileNumber = (cells[idx.mobileNumber] || '').trim();
        const emailAddress = (cells[idx.emailAddress] || '').trim();
        const drugLicenseNumber = (cells[idx.drugLicenseNumber] || '').trim();
        const stateCode = (cells[idx.stateCode] || '').trim();
        const totalInvoicesRaw = (cells[idx.totalInvoices] || '').trim();
        const totalInvoices = totalInvoicesRaw ? parseInt(totalInvoicesRaw, 10) || 0 : 0;

        if (!name) throw new Error(`Row ${i + 2}: name is required`);
        if (!addressLine1) throw new Error(`Row ${i + 2}: addressLine1 is required`);
        if (!city) throw new Error(`Row ${i + 2}: city is required`);
        if (!state) throw new Error(`Row ${i + 2}: state is required`);
        if (!pincode || !/^\d{6}$/.test(pincode)) throw new Error(`Row ${i + 2}: pincode must be 6 digits`);

        if (namesSeen.has(name)) duplicatesInFile.push(name);
        namesSeen.add(name);
        rows.push({ name, addressLine1, addressLine2, addressLine3, city, state, country, pincode, gstin, mobileNumber, emailAddress, drugLicenseNumber, stateCode, totalInvoices });
      }

      const duplicateNamesInFile = [...new Set(duplicatesInFile)];

      const existingBuyers = await db.select().from(buyer);
      const existingNamesSet = new Set(existingBuyers.map((b) => b.name));
      const existingNames = [...namesSeen].filter((n) => existingNamesSet.has(n));

      const rowsToInsert = rows.filter((r) => !duplicateNamesInFile.includes(r.name) && !existingNamesSet.has(r.name));

      const insertedNames: string[] = [];
      for (const [i, r] of rowsToInsert.entries()) {
        const [newBuyer] = await db.insert(buyer).values({
          id: `${Date.now().toString()}-${i}`,
          name: r.name,
          addressLine1: r.addressLine1,
          addressLine2: r.addressLine2 || null,
          addressLine3: r.addressLine3 || null,
          city: r.city,
          state: r.state,
          country: r.country || 'India',
          pincode: r.pincode,
          gstin: r.gstin,
          mobileNumber: r.mobileNumber || null,
          emailAddress: r.emailAddress || null,
          drugLicenseNumber: r.drugLicenseNumber || null,
          stateCode: r.stateCode || null,
          totalInvoices: r.totalInvoices || 0,
        }).returning();
        if (newBuyer) insertedNames.push(newBuyer.name);
      }

      return {
        insertedCount: insertedNames.length,
        insertedNames,
        duplicateNamesInFile: duplicateNamesInFile,
        existingNames: existingNames,
      };
    }),
};

export default buyersRouter;
