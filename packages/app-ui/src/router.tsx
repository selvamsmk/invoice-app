import { createRouter, RouterProvider } from "@tanstack/react-router";
import Loader from "./components/loader";
import type { RouterAppContext } from "./routes/__root";
import { routeTree } from "./routeTree.gen";

// Menu order for intelligent view transitions
const menuOrder: Record<string, number> = {
	"/app/dashboard": 0,
	"/app/invoices": 1,
	"/app/stent-invoices": 2,
	"/app/delivery-challans": 3,
	"/app/products": 4,
	"/app/buyers": 5,
	"/app/my-details": 6,
	"/app/settings": 7,
};

export function createAppRouter(context: RouterAppContext) {
	const router = createRouter({
		routeTree,
		defaultPreload: "intent",
		defaultPendingComponent: () => <Loader />,
		defaultViewTransition: {
			types: ({ fromLocation, toLocation }) => {
				let direction = "none";

				if (fromLocation) {
					const fromPath = fromLocation.pathname;
					const toPath = toLocation.pathname;
					const fromIndex = menuOrder[fromPath] ?? -1;
					const toIndex = menuOrder[toPath] ?? -1;

					// If both routes are in the menu, compare their positions
					if (fromIndex !== -1 && toIndex !== -1) {
						direction = toIndex > fromIndex ? "left" : "right";
					}
				}

				return [`slide-${direction}`];
			},
		},
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
