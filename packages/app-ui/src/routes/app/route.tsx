import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { authClient, DISABLE_AUTH } from "@/lib/auth-client";

export const Route = createFileRoute("/app")({
	component: AppLayout,
	beforeLoad: async (_ctx) => {
		if (DISABLE_AUTH) {
			// Skip session checks in disabled mode; return empty session to callers
			return { session: { data: null } } as any;
		}

		const session = await authClient.getSession();
		if (!session.data) {
			redirect({
				to: "/login",
				throw: true,
			});
		}
		return { session };
	},
});

function AppLayout() {
	return (
		<SidebarProvider>
			<div className="grid h-svh w-full grid-cols-[auto_1fr]">
				<AppSidebar />
				<div className="flex flex-1 flex-col overflow-hidden">
					<div className="flex min-h-0 flex-1 flex-col p-4 pt-6">
						<Outlet />
					</div>
				</div>
			</div>
		</SidebarProvider>
	);
}
