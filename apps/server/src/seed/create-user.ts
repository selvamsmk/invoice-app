import { auth } from "@invoice-app/auth";
import fs from "fs";
import path from "path";
import { isSeedApplied, markSeedApplied } from "./seed-utils";

async function seedInitialUser() {
	const SEED_KEY = "initial_admin";

	if (await isSeedApplied(SEED_KEY)) {
		console.log("Initial admin seed already applied, skipping");
		return;
	}

	const ctx = await auth.$context;

	// Read from user.csv or use dummy data
	const csvPath = path.join(__dirname, "user.csv");

	let email = "";
	let password = "";
	let name = "Admin User";

	if (!fs.existsSync(csvPath)) {
		console.warn(
			"user.csv not found. Using dummy data. Copy user.csv.example to user.csv for custom credentials.",
		);
		// Dummy data fallback
		email = "admin@example.com";
		password = "admin123";
		name = "Admin User";
	} else {
		try {
			const csv = fs.readFileSync(csvPath, "utf-8");
			const lines = csv
				.split(/\r?\n/)
				.map((l) => l.trim())
				.filter(Boolean);

			if (lines.length < 2 || !lines[0] || !lines[1]) {
				console.warn("user.csv is empty or invalid. Using dummy data.");
				email = "admin@example.com";
				password = "admin123";
				name = "Admin User";
			} else {
				const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
				const data = lines[1].split(",").map((c) => c.trim());

				const idx = {
					email: header.indexOf("email"),
					password: header.indexOf("password"),
					name: header.indexOf("name"),
				};

				email = data[idx.email] || "";
				password = data[idx.password] || "";
				name = data[idx.name] || "Admin User";

				if (!email || !password) {
					console.warn(
						"Email or password missing in user.csv. Using dummy data.",
					);
					email = "admin@example.com";
					password = "admin123";
				}
			}
		} catch (error) {
			console.error("Error reading user.csv, using dummy data:", error);
			email = "admin@example.com";
			password = "admin123";
			name = "Admin User";
		}
	}

	try {
		const existing = await ctx.internalAdapter.findUserByEmail(email);

		if (existing) {
			console.log("User already exists:", email);
			return;
		}

		// 1. Create user
		const user = await ctx.internalAdapter.createUser({
			email,
			name,
		});

		// 2. Hash password
		const hashedPassword = await ctx.password.hash(password);

		// 3. Create credential login account
		await ctx.internalAdapter.createAccount({
			userId: user.id,
			providerId: "credential",
			accountId: crypto.randomUUID(),
			email,
			password: hashedPassword,
		});

		console.log("User created successfully:", email);
		await markSeedApplied(SEED_KEY);
	} catch (error) {
		console.error("Error seeding user:", error);
	}
}

export default seedInitialUser;
