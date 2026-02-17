import { db } from "@invoice-app/db";
import { company } from "@invoice-app/db/schema/company";
import { isSeedApplied, markSeedApplied } from "./seed-utils";
import fs from 'fs';
import path from 'path';

async function seedCompany() {
  const SEED_KEY = "company_v1";

  if (await isSeedApplied(SEED_KEY)) {
    console.log("Company seed already applied, skipping");
    return;
  }

  console.log("Seeding company...");

  // Read from company.csv or use dummy data
  const csvPath = path.join(__dirname, 'company.csv');
  
  // Dummy data fallback
  let companyData = {
    companyName: 'Example Company',
    addressLine1: '123 Main Street',
    addressLine2: 'Suite 100',
    addressLine3: "1234",
    city: 'Example City',
    state: 'Example State',
    country: 'India',
    pincode: '000000',
    gstin: '00XXXXX0000X0XX',
    drugLicenseNumber: 'XX-00-00X-0000',
    phoneNumber: '+91-0000000000',
    emailAddress: 'company@example.com',
    bankAccountNumber: '0000000000000000',
    ifscCode: 'XXXX0000000',
    bankName: 'Example Bank',
    branch: 'Example Branch',
  };

  if (!fs.existsSync(csvPath)) {
    console.warn("company.csv not found. Using dummy data. Copy company.csv.example to company.csv for custom details.");
  } else {
    try {
      const csv = fs.readFileSync(csvPath, 'utf-8');
      const lines = csv.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      
      if (lines.length < 2 || !lines[0] || !lines[1]) {
        console.warn("company.csv is empty or invalid. Using dummy data.");
      } else {
        // Simple CSV parser that respects quoted fields
        const parseCsvLine = (line: string) => {
          const result: string[] = [];
          let cur = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
              if (inQuotes && line[i + 1] === '"') {
                cur += '"';
                i++;
                continue;
              }
              inQuotes = !inQuotes;
              continue;
            }
            if (ch === ',' && !inQuotes) {
              result.push(cur);
              cur = '';
              continue;
            }
            cur += ch;
          }
          result.push(cur);
          return result;
        };

        const header = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
        const data = parseCsvLine(lines[1]).map((c) => c.trim().replace(/^"|"$/g, ''));

        const idx = {
          companyName: header.indexOf('companyname'),
          addressLine1: header.indexOf('addressline1'),
          addressLine2: header.indexOf('addressline2'),
          addressLine3: header.indexOf('addressline3'),
          city: header.indexOf('city'),
          state: header.indexOf('state'),
          country: header.indexOf('country'),
          pincode: header.indexOf('pincode'),
          gstin: header.indexOf('gstin'),
          drugLicenseNumber: header.indexOf('druglicensenumber'),
          phoneNumber: header.indexOf('phonenumber'),
          emailAddress: header.indexOf('emailaddress'),
          bankAccountNumber: header.indexOf('bankaccountnumber'),
          ifscCode: header.indexOf('ifsccode'),
          bankName: header.indexOf('bankname'),
          branch: header.indexOf('branch'),
        };

        // Override dummy data with CSV data
        companyData = {
          companyName: data[idx.companyName] || companyData.companyName,
          addressLine1: data[idx.addressLine1] || companyData.addressLine1,
          addressLine2: data[idx.addressLine2] || companyData.addressLine2,
          addressLine3: data[idx.addressLine3] || companyData.addressLine3,
          city: data[idx.city] || companyData.city,
          state: data[idx.state] || companyData.state,
          country: data[idx.country] || companyData.country,
          pincode: data[idx.pincode] || companyData.pincode,
          gstin: data[idx.gstin] || companyData.gstin,
          drugLicenseNumber: data[idx.drugLicenseNumber] || companyData.drugLicenseNumber,
          phoneNumber: data[idx.phoneNumber] || companyData.phoneNumber,
          emailAddress: data[idx.emailAddress] || companyData.emailAddress,
          bankAccountNumber: data[idx.bankAccountNumber] || companyData.bankAccountNumber,
          ifscCode: data[idx.ifscCode] || companyData.ifscCode,
          bankName: data[idx.bankName] || companyData.bankName,
          branch: data[idx.branch] || companyData.branch,
        };
      }
    } catch (error) {
      console.error("Error reading company.csv, using dummy data:", error);
    }
  }

  try {
    await db.insert(company).values({
      id: Date.now().toString(),
      companyName: companyData.companyName,
      addressLine1: companyData.addressLine1,
      addressLine2: companyData.addressLine2,
      addressLine3: companyData.addressLine3,
      city: companyData.city,
      state: companyData.state,
      country: companyData.country,
      pincode: companyData.pincode,
      gstin: companyData.gstin,
      drugLicenseNumber: companyData.drugLicenseNumber,
      phoneNumber: companyData.phoneNumber,
      emailAddress: companyData.emailAddress,
      bankAccountNumber: companyData.bankAccountNumber,
      ifscCode: companyData.ifscCode,
      bankName: companyData.bankName,
      branch: companyData.branch,
      logoUrl: null,
    });

    console.log("Company seeded successfully!");
    await markSeedApplied(SEED_KEY);
  } catch (error) {
    console.error("Error seeding company:", error);
  }
}

export default seedCompany;