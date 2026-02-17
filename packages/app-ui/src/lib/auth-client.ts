import { createAuthClient } from "better-auth/react";

const serverUrl = import.meta.env.VITE_SERVER_URL ?? "http://127.0.0.1:3000";

// Disable auth when building/running for desktop or when explicitly set
export const DISABLE_AUTH =
  import.meta.env.VITE_DISABLE_AUTH === "true" || !!(window as any).__TAURI__;

export const authClient = createAuthClient({
  baseURL: serverUrl,
  fetchOptions: { credentials: "include" },
});
