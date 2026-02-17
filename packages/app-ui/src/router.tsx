import {
	createRouter,
	RouterProvider,
} from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import Loader from "./components/loader";
import type { RouterAppContext } from "./routes/__root";

export function createAppRouter(context: RouterAppContext) {
	const router = createRouter({
		routeTree,
		defaultPreload: "intent",
		defaultPendingComponent: () => <Loader/>,
		context,
	});

	return router;
}

export function AppRouter({
	router,
}: {
	router: ReturnType<typeof createAppRouter>;
}) {
	return <RouterProvider router={router} />;
}
