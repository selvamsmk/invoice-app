import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { DollarSign, FileText } from "lucide-react";
import Loader from "@/components/loader";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useAppContext } from "@/hooks/useAppContext";

export const Route = createFileRoute("/app/dashboard")({
	component: Dashboard,
});

function Dashboard() {
	const { orpc } = useAppContext();

	// Fetch dashboard data from API
	const dashboardQuery = useQuery(orpc.getDashboardData.queryOptions());
	const dashboardData = dashboardQuery.data;

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat("en-IN", {
			style: "currency",
			currency: "INR",
			minimumFractionDigits: 2,
		}).format(amount);
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-IN", {
			day: "2-digit",
			month: "short",
			year: "numeric",
		});
	};

	if (dashboardQuery.isLoading) {
		return <Loader />;
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="font-bold text-3xl tracking-tight">Dashboard</h1>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Total Invoices
						</CardTitle>
						<FileText className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{dashboardData?.totalInvoices ?? 0}
						</div>
						<p className="text-muted-foreground text-xs">All time invoices</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Total Revenue</CardTitle>
						<DollarSign className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{formatCurrency(dashboardData?.totalRevenue ?? 0)}
						</div>
						<p className="text-muted-foreground text-xs">All time revenue</p>
					</CardContent>
				</Card>
			</div>

			<div className="grid gap-4">
				<Card>
					<CardHeader>
						<CardTitle>Recent Invoices</CardTitle>
						<CardDescription>Latest invoices created</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{dashboardData?.recentInvoices &&
							dashboardData.recentInvoices.length > 0 ? (
								dashboardData.recentInvoices.map((invoice) => (
									<div
										key={invoice.invoiceNumber}
										className="flex items-center"
									>
										<div className="ml-4 space-y-1">
											<p className="font-medium text-sm leading-none">
												{invoice.invoiceNumber}
											</p>
											<p className="text-muted-foreground text-sm">
												{invoice.buyer} • {formatDate(invoice.date)}
											</p>
										</div>
										<div className="ml-auto font-medium">
											{formatCurrency(invoice.totalAmount)}
										</div>
									</div>
								))
							) : (
								<p className="text-muted-foreground text-sm">
									No recent invoices
								</p>
							)}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
