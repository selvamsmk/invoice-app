import ReactDOM from "react-dom/client";
import { App } from "@invoice-app/app-ui/App";
import { createAppRouter } from "@invoice-app/app-ui/router";
import { orpc, queryClient } from "./orpc";
import { initSidecarDebug } from "./tauri-debug";

// Optional: desktop-only global styles
import "./index.css";

const router = createAppRouter({
  orpc,
  queryClient,
});

const root = document.getElementById("app");
if (!root) {
  throw new Error("Root element not found");
}

// Initialize sidecar debug listeners (this file is desktop-only).
// Keep the returned cleanup function and call it on unload so listeners are removed.
initSidecarDebug()
  .then((cleanup) => {
    // Call cleanup on page unload
    const runCleanup = () => {
      cleanup().catch(() => {});
    };
    window.addEventListener("beforeunload", runCleanup, { once: true });
    window.addEventListener("unload", runCleanup, { once: true });
    // store for manual teardown if needed
    (window as any).__TAURI_SIDECAR_CLEANUP__ = runCleanup;
  })
  .catch((err) => console.warn("Failed to init tauri debug listeners", err));

ReactDOM.createRoot(root).render(
  <App router={router} queryClient={queryClient} />
);
