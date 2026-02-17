import { authClient, DISABLE_AUTH } from '@/lib/auth-client';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'

export const Route = createFileRoute('/app')({
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
  }
})

function AppLayout() {
  return (
    <SidebarProvider>
      <div className="grid grid-cols-[auto_1fr] h-svh w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 pt-6 flex-1 flex flex-col min-h-0">
            <Outlet />
          </div>
        </div>
      </div>
    </SidebarProvider>
  )
}
