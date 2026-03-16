import { useRouteContext } from "@tanstack/react-router";
import type { RouterAppContext } from "@/routes/__root";
import { Route as RootRoute } from "@/routes/__root";

export function useAppContext(): RouterAppContext {
	return useRouteContext({ from: RootRoute.id });
}
