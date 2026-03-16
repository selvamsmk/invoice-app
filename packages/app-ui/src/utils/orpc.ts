import type { AppRouterClient } from "@invoice-app/api/routers/index";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function createOrpcClient(baseUrl: string) {
	const queryClient = new QueryClient({
		queryCache: new QueryCache({
			onError: (error) => {
				toast.error(`Error: ${error.message}`);
			},
		}),
	});

	const link = new RPCLink({
		url: `${baseUrl}/rpc`,
		fetch(url, options) {
			return fetch(url, {
				...options,
				credentials: "include",
			});
		},
	});

	const client = createORPCClient<AppRouterClient>(link);
	const orpc = createTanstackQueryUtils(client);

	return {
		client,
		queryClient,
		orpc,
	};
}
