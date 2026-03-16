import { Link, useNavigate } from "@tanstack/react-router";
import {
	Activity,
	Building,
	FileText,
	LayoutDashboard,
	LogOut,
	Package,
	Truck,
	Users,
} from "lucide-react";
import { toast } from "sonner";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";

// Menu items.
const items = [
	{
		title: "Dashboard",
		url: "/app/dashboard",
		icon: LayoutDashboard,
	},
	{
		title: "Invoices",
		url: "/app/invoices",
		icon: FileText,
	},
	{
		title: "Stent Invoices",
		url: "/app/stent-invoices",
		icon: Activity,
	},
	{
		title: "Delivery Challan",
		url: "/app/delivery-challans",
		icon: Truck,
	},
	{
		title: "Products",
		url: "/app/products",
		icon: Package,
	},
	{
		title: "Buyers",
		url: "/app/buyers",
		icon: Users,
	},
	{
		title: "My Details",
		url: "/app/my-details",
		icon: Building,
	},
];

export function AppSidebar() {
	const navigate = useNavigate();
	return (
		<Sidebar>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Application</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{items.map((item) => (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton asChild>
										<Link
											to={item.url}
											className="flex items-center gap-2 pr-8"
										>
											<item.icon />
											<span>{item.title}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem key={"sign-out"}>
						<SidebarMenuButton
							onClick={async () => {
								await authClient.signOut(
									{},
									{
										onSuccess: () => {
											navigate({ to: "/login" });
											toast.success("Sign out successful");
										},
										onError: (error) => {
											toast.error(error.error?.message || "Sign out failed");
										},
									},
								);
							}}
							className="pr-4"
						>
							<LogOut />
							<span>Sign Out</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
}
