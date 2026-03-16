import { listen } from "@tauri-apps/api/event";

// Initialize listeners and return a cleanup function which will unlisten all
// registered handlers. Each `listen` call returns an `unlisten` function
// promise in the Tauri API.
export async function initSidecarDebug(): Promise<() => Promise<void>> {
	const unlistens: Array<() => void | Promise<void>> = [];

	try {
		const u = await listen("sidecar:error", (e: any) => {
			console.error("❌ Sidecar error:", e.payload);
			try {
				// eslint-disable-next-line no-alert
				alert(`Sidecar error:\n${e.payload}`);
			} catch {}
		});
		unlistens.push(u);
	} catch (err) {
		console.warn("Failed to listen for sidecar:error", err);
	}

	try {
		const u = await listen("sidecar:stdout", (e: any) => {
			console.log("[server]", e.payload);
		});
		unlistens.push(u);
	} catch (err) {
		console.warn("Failed to listen for sidecar:stdout", err);
	}

	try {
		const u = await listen("sidecar:stderr", (e: any) => {
			console.error("[server]", e.payload);
		});
		unlistens.push(u);
	} catch (err) {
		console.warn("Failed to listen for sidecar:stderr", err);
	}

	try {
		const u = await listen("sidecar:terminated", (e: any) => {
			console.error("🛑 Server exited:", e.payload);
			try {
				// eslint-disable-next-line no-alert
				alert(`Server exited:\n${e.payload}`);
			} catch {}
		});
		unlistens.push(u);
	} catch (err) {
		console.warn("Failed to listen for sidecar:terminated", err);
	}

	return async function cleanup() {
		for (const un of unlistens) {
			try {
				// Support unlisten functions that return void or Promise<void>
				await Promise.resolve(un());
			} catch (err) {
				console.warn("Failed to unlisten sidecar event", err);
			}
		}
	};
}
