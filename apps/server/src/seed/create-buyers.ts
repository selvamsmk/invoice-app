import { db } from "@invoice-app/db";
import { buyer } from "@invoice-app/db/schema/buyer";
import { seed } from "drizzle-seed";
import fs from 'fs'
import path from 'path'
import { isSeedApplied, markSeedApplied } from "./seed-utils";

async function seedBuyers() {
  const SEED_KEY = "buyers_v1";

  if (await isSeedApplied(SEED_KEY)) {
    console.log("Buyers seed already applied, skipping");
    return;
  }

  console.log("Seeding buyers...");
  // Try reading buyers from CSV first (buyers.csv in the same folder)
  const csvPath = path.join(__dirname, 'buyers.csv')
  let buyersToInsert: Array<any> = []

  if (fs.existsSync(csvPath)) {
    try {
      const csv = fs.readFileSync(csvPath, 'utf-8')
      const lines = csv.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
      if (lines.length > 0) {
        // simple CSV line parser that respects quoted fields (commas inside quotes)
        const parseCsvLine = (line: string) => {
          const result: string[] = []
          let cur = ''
          let inQuotes = false
          for (let i = 0; i < line.length; i++) {
            const ch = line[i]
            if (ch === '"') {
              // handle escaped double quotes ""
              if (inQuotes && line[i + 1] === '"') {
                cur += '"'
                i++
                continue
              }
              inQuotes = !inQuotes
              continue
            }
            if (ch === ',' && !inQuotes) {
              result.push(cur)
              cur = ''
              continue
            }
            cur += ch
          }
          result.push(cur)
          return result
        }

        const header = parseCsvLine(lines.shift()!).map((h) => h.trim().toLowerCase())
        const idx = {
          name: header.indexOf('name'),
          addressLine1: header.indexOf('addressline1'),
          addressLine2: header.indexOf('addressline2'),
          addressLine3: header.indexOf('addressline3'),
          city: header.indexOf('city'),
          state: header.indexOf('state'),
          country: header.indexOf('country'),
          pincode: header.indexOf('pincode'),
          gstin: header.indexOf('gstin'),
          mobileNumber: header.indexOf('mobilenumber'),
          emailAddress: header.indexOf('emailaddress'),
          drugLicenseNumber: header.indexOf('druglicensenumber'),
          stateCode: header.indexOf('statecode'),
          totalInvoices: header.indexOf('totalinvoices'),
        }

        for (const [_i, line] of lines.entries()) {
          const cells = parseCsvLine(line).map((c) => c.trim().replace(/^"|"$/g, ''))
          const name = cells[idx.name] || ''
          const addressLine1 = cells[idx.addressLine1] || ''
          const addressLine2 = cells[idx.addressLine2] || ''
          const addressLine3 = cells[idx.addressLine3] || ''
          const city = cells[idx.city] || ''
          const state = cells[idx.state] || ''
          const country = cells[idx.country] || 'India'
          const pincode = cells[idx.pincode] || ''
          const gstin = cells[idx.gstin] || ''
          const mobileNumber = cells[idx.mobileNumber] || ''
          const emailAddress = cells[idx.emailAddress] || ''
          const drugLicenseNumber = cells[idx.drugLicenseNumber] || ''
          const stateCode = cells[idx.stateCode] || ''
          const totalInvoicesRaw = cells[idx.totalInvoices] || ''
          const totalInvoices = totalInvoicesRaw ? parseInt(totalInvoicesRaw, 10) || 0 : 0

          console.log([name, addressLine1, city, state, pincode])
          // basic validation
          if (!name) continue
          if (!addressLine1) continue
          if (!city) continue
          if (!state) continue
          if (!pincode || !/^\d{6}$/.test(pincode)) continue

          buyersToInsert.push({ name, addressLine1, addressLine2: addressLine2 || null, addressLine3: addressLine3 || null, city, state, country, pincode, gstin, mobileNumber: mobileNumber || null, emailAddress: emailAddress || null, drugLicenseNumber: drugLicenseNumber || null, stateCode: stateCode || null, totalInvoices })
        }
      }
    } catch (err) {
      console.warn('Failed to read buyers.csv, falling back to synthetic seed', err)
    }
  }

  if (buyersToInsert.length > 0) {
    for (const [i, b] of buyersToInsert.entries()) {
      await db.insert(buyer).values({
        id: `${Date.now().toString()}-${i}`,
        name: b.name,
        addressLine1: b.addressLine1,
        addressLine2: b.addressLine2,
        addressLine3: b.addressLine3,
        city: b.city,
        state: b.state,
        country: b.country || 'India',
        pincode: b.pincode,
        gstin: b.gstin,
        mobileNumber: b.mobileNumber,
        emailAddress: b.emailAddress,
        drugLicenseNumber: b.drugLicenseNumber,
        stateCode: b.stateCode,
        totalInvoices: b.totalInvoices || 0,
      })
    }

    console.log(`✅ Successfully seeded ${buyersToInsert.length} buyers from CSV`)
    await markSeedApplied(SEED_KEY);
    return
  }

  // Fallback to synthetic seed if CSV not present or empty
  // Indian GST state codes for realistic data
  const gstStateCodes = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36", "37"];
  
  const indianStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", 
    "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", 
    "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", 
    "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", 
    "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi"
  ];

  const sampleCompanyNames = [
    "Sunrise Pharmaceuticals", "Global Medical Supplies", "Healthcare Solutions Ltd", 
    "MedTech Distributors", "Wellness Corp", "Prime Medical Enterprises", 
    "Advanced Healthcare Systems", "Unity Pharmaceuticals", "Reliable Medical Co", 
    "Modern Healthcare Distributors", "Premier Medical Supplies", "Excel Healthcare", 
    "Supreme Pharmaceuticals", "Quality Medical Solutions", "Apex Healthcare Ltd"
  ];

  const sampleDrugLicenseNumbers = [
    "DL-KA-001", "DL-MH-002", "DL-TN-003", "DL-UP-004", "DL-GJ-005", 
    "DL-RJ-006", "DL-WB-007", "DL-AP-008", "DL-MP-009", "DL-PB-010"
  ];

  //@ts-ignore
  await seed(db, { buyer }).refine((f) => ({
    buyer: {
      count: 10,
      columns: {
        id: f.uuid(),
        name: f.valuesFromArray({ values: sampleCompanyNames }),
        addressLine1: f.streetAddress(),
        addressLine2: f.weightedRandom([
          { weight: 0.3, value: f.streetAddress() },
          { weight: 0.7, value: f.default({ defaultValue: null }) }
        ]),
        addressLine3: f.weightedRandom([
          { weight: 0.2, value: f.streetAddress() },
          { weight: 0.8, value: f.default({ defaultValue: null }) }
        ]),
        city: f.city(),
        state: f.valuesFromArray({ values: indianStates }),
        country: f.default({ defaultValue: "India" }),
        pincode: f.phoneNumber({ 
          template: "######"
        }),
        gstin: f.phoneNumber({
          template: "##***#####*#*##" // Format: 2 digits + 5 letters + 4 digits + 1 letter + 1 digit + 1 letter + 1 digit
        }),
        mobileNumber: f.weightedRandom([
          { 
            weight: 0.8, 
            value: f.phoneNumber({ template: "+91##########" })
          },
          { weight: 0.2, value: f.default({ defaultValue: null }) }
        ]),
        emailAddress: f.weightedRandom([
          { 
            weight: 0.7, 
            value: f.email()
          },
          { weight: 0.3, value: f.default({ defaultValue: null }) }
        ]),
        drugLicenseNumber: f.weightedRandom([
          { 
            weight: 0.6, 
            value: f.valuesFromArray({ values: sampleDrugLicenseNumbers })
          },
          { weight: 0.4, value: f.default({ defaultValue: null }) }
        ]),
        stateCode: f.valuesFromArray({ values: gstStateCodes }),
        totalInvoices: f.int({ minValue: 0, maxValue: 150 }),
      }
    }
  }));

  console.log("✅ Successfully seeded 10 buyers");
  await markSeedApplied(SEED_KEY);
}

export default seedBuyers;