import { createFileRoute, redirect } from "@tanstack/react-router";
import SignInForm from "@/components/sign-in-form";
import { authClient, DISABLE_AUTH } from "@/lib/auth-client";

export const Route = createFileRoute("/login")({
	component: RouteComponent,
	beforeLoad: async () => {
		if (DISABLE_AUTH) {
			throw redirect({ to: "/app/dashboard" });
		}
		const session = await authClient.getSession();
		if (session.data) {
			throw redirect({
				to: "/app/dashboard",
			});
		}
	},
});

function RouteComponent() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-background p-4">
			<div className="mx-auto w-full max-w-md">
				<SignInForm />
			</div>
		</div>
	);
}
