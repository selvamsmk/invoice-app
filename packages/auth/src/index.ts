import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@invoice-app/db";
import * as schema from "@invoice-app/db/schema/auth";

const AUTH_BASE_URL =
  process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

export const auth = betterAuth({
  // ✅ REQUIRED — prevents tauri:// inference
  baseURL: AUTH_BASE_URL,

  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),

  // ✅ ONLY http(s) origins
  trustedOrigins: [
    "http://localhost:3000",        // server
  ].concat(process.env.CORS_ORIGIN?.split(",").map(o => o.trim()) ?? []).filter(Boolean),

  emailAndPassword: {
    enabled: true,
  },

  advanced: {
    defaultCookieAttributes: {
      sameSite: "lax",
      secure: false,   // localhost + desktop
      httpOnly: true,
    },
  },
});
