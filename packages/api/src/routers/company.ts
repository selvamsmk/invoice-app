import { company, db, eq } from "@invoice-app/db";
import { z } from "zod";
import { publicProcedure } from "../index";

export const companyRouter = {
	getCompany: publicProcedure.handler(async () => {
		const companies = await db.select().from(company).limit(1);
		return companies[0] || null;
	}),

	updateCompany: publicProcedure
		.input(
			z.object({
				id: z.string().optional(),
				companyName: z.string().min(1),
				addressLine1: z.string().min(1),
				addressLine2: z.string().optional(),
				addressLine3: z.string().optional(),
				city: z.string().min(1),
				state: z.string().min(1),
				country: z.string().default("India"),
				pincode: z.string().regex(/^\d{6}$/),
				gstin: z.string().min(1),
				drugLicenseNumber: z.string().optional(),
				phoneNumber: z.string().optional(),
				emailAddress: z.email().optional().or(z.literal("")),
				bankAccountNumber: z.string().optional(),
				ifscCode: z.string().optional(),
				bankName: z.string().optional(),
				branch: z.string().optional(),
				logoUrl: z.string().optional(),
			}),
		)
		.handler(async ({ input }) => {
			// Check if company exists
			const existingCompany = await db.select().from(company).limit(1);
			const firstCompany = existingCompany[0];

			if (!firstCompany) {
				// Create new company record
				const [newCompany] = await db
					.insert(company)
					.values({
						id: Date.now().toString(),
						companyName: input.companyName,
						addressLine1: input.addressLine1,
						addressLine2: input.addressLine2 || null,
						addressLine3: input.addressLine3 || null,
						city: input.city,
						state: input.state,
						country: input.country,
						pincode: input.pincode,
						gstin: input.gstin,
						drugLicenseNumber: input.drugLicenseNumber || null,
						phoneNumber: input.phoneNumber || null,
						emailAddress: input.emailAddress || null,
						bankAccountNumber: input.bankAccountNumber || null,
						ifscCode: input.ifscCode || null,
						bankName: input.bankName || null,
						branch: input.branch || null,
						logoUrl: input.logoUrl || null,
					})
					.returning();

				return newCompany;
			}
			// Update existing company record
			const [updatedCompany] = await db
				.update(company)
				.set({
					companyName: input.companyName,
					addressLine1: input.addressLine1,
					addressLine2: input.addressLine2 || null,
					addressLine3: input.addressLine3 || null,
					city: input.city,
					state: input.state,
					country: input.country,
					pincode: input.pincode,
					gstin: input.gstin,
					drugLicenseNumber: input.drugLicenseNumber || null,
					phoneNumber: input.phoneNumber || null,
					emailAddress: input.emailAddress || null,
					bankAccountNumber: input.bankAccountNumber || null,
					ifscCode: input.ifscCode || null,
					bankName: input.bankName || null,
					branch: input.branch || null,
					logoUrl: input.logoUrl || null,
					updatedAt: new Date(),
				})
				.where(eq(company.id, firstCompany.id))
				.returning();

			return updatedCompany;
		}),
};

export default companyRouter;
