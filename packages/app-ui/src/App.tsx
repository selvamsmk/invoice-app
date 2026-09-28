import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { AppRouter } from "./router";
import "./router-register";

function isTextEditableTarget(target: EventTarget | null): boolean {
	if (!(target instanceof Element)) return false;

	const editableElement = target.closest(
		"input, textarea, [contenteditable=''], [contenteditable='true'], [role='textbox']",
	);
	if (!editableElement) return false;

	if (editableElement instanceof HTMLTextAreaElement) {
		return !editableElement.disabled && !editableElement.readOnly;
	}

	if (editableElement instanceof HTMLInputElement) {
		const nonTextInputTypes = new Set([
			"button",
			"checkbox",
			"color",
			"file",
			"hidden",
			"image",
			"radio",
			"range",
			"reset",
			"submit",
		]);

		return (
			!editableElement.disabled &&
			!editableElement.readOnly &&
			!nonTextInputTypes.has(editableElement.type)
		);
	}

	return true;
}

function useBackspaceNavigationGuard() {
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key !== "Backspace") return;
			if (isTextEditableTarget(event.target)) return;

			event.preventDefault();
		};

		window.addEventListener("keydown", handleKeyDown, { capture: true });
		return () => {
			window.removeEventListener("keydown", handleKeyDown, { capture: true });
		};
	}, []);
}

export function App({
	router,
	queryClient,
}: {
	router: ReturnType<typeof import("./router").createAppRouter>;
	queryClient: import("@tanstack/react-query").QueryClient;
}) {
	useBackspaceNavigationGuard();

	return (
		<QueryClientProvider client={queryClient}>
			<AppRouter router={router} />
		</QueryClientProvider>
	);
}
