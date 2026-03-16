import { QueryClientProvider } from "@tanstack/react-query";
import { AppRouter } from "./router";
import "./router-register";

export function App({
	router,
	queryClient,
}: {
	router: ReturnType<typeof import("./router").createAppRouter>;
	queryClient: import("@tanstack/react-query").QueryClient;
}) {
	return (
		<QueryClientProvider client={queryClient}>
			<AppRouter router={router} />
		</QueryClientProvider>
	);
}
