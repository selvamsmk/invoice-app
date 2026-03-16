import type { Product } from "@invoice-app/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Edit, Loader2, Package, Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { AddProductDialog } from "@/components/add-product-dialog";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAppContext } from "@/hooks/useAppContext";

export const Route = createFileRoute("/app/products")({
	component: Products,
});

function Products() {
	const { orpc } = useAppContext();
	// Fetch products from API
	const products = useQuery(orpc.listProducts.queryOptions());

	// Mutations
	const createMutation = useMutation(
		orpc.createProduct.mutationOptions({
			onSuccess: () => {
				products.refetch();
			},
		}),
	);

	const updateMutation = useMutation(
		orpc.updateProduct.mutationOptions({
			onSuccess: () => {
				products.refetch();
			},
		}),
	);

	const deleteMutation = useMutation(
		orpc.deleteProduct.mutationOptions({
			onSuccess: () => {
				products.refetch();
			},
		}),
	);

	const uploadMutation = useMutation(
		orpc.uploadProductsCSV?.mutationOptions?.({
			onSuccess: (res: any) => {
				products.refetch();
				// Handle server-returned validation / conflict info gracefully
				if (res?.duplicateNamesInFile?.length) {
					const names = res.duplicateNamesInFile.join(", ");
					toast.error(`Duplicate names in file: ${names}`, {
						position: "top-left",
					});
				}
				if (res?.existingNames?.length) {
					const names = res.existingNames.join(", ");
					toast.error(`Products already exist: ${names}`, {
						position: "top-left",
					});
				}
				if (res?.insertedCount) {
					const names = res.insertedNames?.join(", ") || "";
					const description = names.length > 0 ? names : undefined;
					toast.success(`Inserted ${res.insertedCount} products`, {
						description,
						position: "top-right",
					});
				} else {
					toast("No products inserted", { position: "top-right" });
				}
			},
			onError: (err: any) => {
				const extract = (e: any) => {
					if (!e) return "Failed to upload CSV";
					if (typeof e === "string") return e;
					if (e?.message) return e.message;
					if (e?.data?.message) return e.data.message;
					if (e?.response?.data?.message) return e.response.data.message;
					try {
						return JSON.stringify(e);
					} catch {
						return String(e);
					}
				};
				toast.error(extract(err), { position: "top-left" });
			},
		}) ?? {},
	);

	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [editingProduct, setEditingProduct] = useState<Product | null>(null);
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
	const [productToDelete, setProductToDelete] = useState<Product | null>(null);
	const [activeTab, setActiveTab] = useState("list");
	const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

	const handleAddProduct = async (
		newProduct: Omit<Product, "id" | "createdAt" | "updatedAt">,
	) => {
		try {
			await createMutation.mutateAsync({
				name: newProduct.name,
				defaultRate: newProduct.defaultRate,
				hsnCode: newProduct.hsnCode,
				gstPercentage: newProduct.gstPercentage,
			});
		} catch (error) {
			console.error("Failed to create product:", error);
		}
	};

	const handleEditProduct = async (updatedProduct: Product) => {
		try {
			await updateMutation.mutateAsync({
				id: updatedProduct.id,
				name: updatedProduct.name,
				defaultRate: updatedProduct.defaultRate,
				hsnCode: updatedProduct.hsnCode,
				gstPercentage: updatedProduct.gstPercentage,
			});
			setEditingProduct(null);
		} catch (error) {
			console.error("Failed to update product:", error);
		}
	};

	const handleOpenEditDialog = (product: Product) => {
		setEditingProduct(product);
		setIsAddDialogOpen(true);
	};

	const handleOpenAddDialog = () => {
		setEditingProduct(null);
		setIsAddDialogOpen(true);
	};

	const handleCloseDialog = (open: boolean) => {
		setIsAddDialogOpen(open);
		if (!open) {
			setEditingProduct(null);
		}
	};

	const handleOpenDeleteDialog = (product: Product) => {
		setProductToDelete(product);
		setDeleteConfirmOpen(true);
	};

	const handleConfirmDelete = async () => {
		if (productToDelete) {
			try {
				await deleteMutation.mutateAsync({ id: productToDelete.id });
			} catch (error) {
				console.error("Failed to delete product:", error);
			}
		}
		setDeleteConfirmOpen(false);
		setProductToDelete(null);
	};

	const handleCancelDelete = () => {
		setDeleteConfirmOpen(false);
		setProductToDelete(null);
	};

	const handleViewProduct = (product: Product) => {
		setSelectedProduct(product);
		setActiveTab("details");
	};

	const fileInputRef = useRef<HTMLInputElement | null>(null);

	const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const text = await file.text();
		try {
			await uploadMutation.mutateAsync({ csv: text });
		} catch (err: any) {
			console.error("Upload failed", err);
			const extract = (e: any) => {
				if (!e) return "Upload failed";
				if (typeof e === "string") return e;
				if (e?.message) return e.message;
				if (e?.data?.message) return e.data.message;
				if (e?.response?.data?.message) return e.response.data.message;
				try {
					return JSON.stringify(e);
				} catch {
					return String(e);
				}
			};
			toast.error(extract(err), { position: "top-left" });
		} finally {
			// reset input
			if (fileInputRef.current) fileInputRef.current.value = "";
		}
	};

	return (
		<div className="flex h-full flex-col">
			<div className="mb-6 flex items-center justify-between">
				<div className="flex items-center gap-3">
					<Package className="h-8 w-8 text-primary" />
					<div>
						<h1 className="font-bold text-3xl tracking-tight">Products</h1>
						<p className="text-muted-foreground">
							Manage your product catalog and pricing information
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Button
						onClick={handleOpenAddDialog}
						className="cursor-pointer"
						disabled={createMutation.isPending}
					>
						{createMutation.isPending ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : (
							<Plus className="mr-2 h-4 w-4" />
						)}
						Add Product
					</Button>
					<Button
						onClick={() => fileInputRef.current?.click()}
						className="cursor-pointer"
						disabled={uploadMutation.isPending}
					>
						{uploadMutation.isPending ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : (
							<Package className="mr-2 h-4 w-4" />
						)}
						Import CSV
					</Button>
				</div>
			</div>

			<Tabs
				value={activeTab}
				onValueChange={setActiveTab}
				className="flex min-h-0 w-full flex-1 flex-col"
			>
				<TabsList className="mb-4 shrink-0">
					<TabsTrigger value="list" className="flex items-center gap-2">
						<Package className="h-4 w-4" />
						Product List
					</TabsTrigger>
					<TabsTrigger value="details" className="flex items-center gap-2">
						<Package className="h-4 w-4" />
						Product Details
					</TabsTrigger>
				</TabsList>

				<TabsContent value="list" className="flex min-h-0 flex-1 flex-col">
					{products.isLoading ? (
						<div className="flex flex-1 items-center justify-center">
							<Loader2 className="h-8 w-8 animate-spin" />
							<span className="ml-2">Loading products...</span>
						</div>
					) : products.error ? (
						<div className="flex flex-1 items-center justify-center">
							<p className="text-red-500">
								Failed to load products. Please try again.
							</p>
						</div>
					) : (
						<>
							<div className="min-h-0 flex-1 overflow-hidden rounded-md border">
								<div className="h-full overflow-y-auto">
									<Table className="relative table-fixed">
										<TableHeader className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
											<TableRow>
												<TableHead className="w-[250px]">
													Product Name
												</TableHead>
												<TableHead className="w-[120px]">Rate (₹)</TableHead>
												<TableHead className="w-[120px]">HSN Code</TableHead>
												<TableHead className="w-[100px]">GST (%)</TableHead>
												<TableHead className="w-[120px] text-right">
													Actions
												</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{products.data?.map((product) => (
												<TableRow key={product.id}>
													<TableCell className="w-[250px] font-medium">
														<Tooltip>
															<TooltipTrigger asChild>
																<div className="cursor-help truncate">
																	{product.name}
																</div>
															</TooltipTrigger>
															<TooltipContent>
																<p>{product.name}</p>
															</TooltipContent>
														</Tooltip>
													</TableCell>
													<TableCell className="w-[120px]">
														₹{product.defaultRate.toFixed(2)}
													</TableCell>
													<TableCell className="w-[120px]">
														<Tooltip>
															<TooltipTrigger asChild>
																<div className="cursor-help truncate">
																	{product.hsnCode}
																</div>
															</TooltipTrigger>
															<TooltipContent>
																<p>{product.hsnCode}</p>
															</TooltipContent>
														</Tooltip>
													</TableCell>
													<TableCell className="w-[100px]">
														{product.gstPercentage}%
													</TableCell>
													<TableCell className="w-[120px] text-right">
														<div className="flex justify-end gap-2">
															<Tooltip>
																<TooltipTrigger asChild>
																	<Button
																		variant="outline"
																		size="sm"
																		onClick={() => handleViewProduct(product)}
																		className="cursor-pointer"
																	>
																		<Package className="h-4 w-4" />
																	</Button>
																</TooltipTrigger>
																<TooltipContent>
																	<p>View Details</p>
																</TooltipContent>
															</Tooltip>
															<Button
																variant="outline"
																size="sm"
																onClick={() => handleOpenEditDialog(product)}
																className="cursor-pointer"
															>
																<Edit className="h-4 w-4" />
															</Button>
															<Button
																variant="outline"
																size="sm"
																onClick={() => handleOpenDeleteDialog(product)}
																className="cursor-pointer"
															>
																<Trash2 className="h-4 w-4" />
															</Button>
														</div>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							</div>
						</>
					)}
				</TabsContent>

				<TabsContent value="details" className="flex min-h-0 flex-1 flex-col">
					{selectedProduct ? (
						<div className="flex-1 overflow-y-auto">
							<div className="space-y-6 pb-6">
								<div className="flex items-center justify-between">
									<h2 className="font-bold text-2xl">Product Details</h2>
									<Button
										variant="outline"
										onClick={() => setActiveTab("list")}
									>
										Back to List
									</Button>
								</div>

								<div className="grid gap-6">
									<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
										<div className="space-y-2">
											<label className="font-medium text-muted-foreground text-sm">
												Product Name
											</label>
											<p className="font-semibold text-lg">
												{selectedProduct.name}
											</p>
										</div>

										<div className="space-y-2">
											<label className="font-medium text-muted-foreground text-sm">
												Default Rate
											</label>
											<p className="font-semibold text-lg">
												₹{selectedProduct.defaultRate.toFixed(2)}
											</p>
										</div>

										<div className="space-y-2">
											<label className="font-medium text-muted-foreground text-sm">
												HSN Code
											</label>
											<p className="text-lg">{selectedProduct.hsnCode}</p>
										</div>

										<div className="space-y-2">
											<label className="font-medium text-muted-foreground text-sm">
												GST Percentage
											</label>
											<p className="text-lg">
												{selectedProduct.gstPercentage}%
											</p>
										</div>

										<div className="space-y-2">
											<label className="font-medium text-muted-foreground text-sm">
												Product ID
											</label>
											<p className="text-muted-foreground text-sm">
												{selectedProduct.id}
											</p>
										</div>

										<div className="space-y-2">
											<label className="font-medium text-muted-foreground text-sm">
												Created At
											</label>
											<p className="text-muted-foreground text-sm">
												{new Date(selectedProduct.createdAt).toLocaleString(
													"en-IN",
												)}
											</p>
										</div>

										{selectedProduct.updatedAt && (
											<div className="space-y-2">
												<label className="font-medium text-muted-foreground text-sm">
													Updated At
												</label>
												<p className="text-muted-foreground text-sm">
													{new Date(selectedProduct.updatedAt).toLocaleString(
														"en-IN",
													)}
												</p>
											</div>
										)}
									</div>

									<div className="flex gap-2 pt-4">
										<Button
											onClick={() => handleOpenEditDialog(selectedProduct)}
											className="cursor-pointer"
										>
											<Edit className="mr-2 h-4 w-4" />
											Edit Product
										</Button>
										<Button
											variant="destructive"
											onClick={() => handleOpenDeleteDialog(selectedProduct)}
											className="cursor-pointer"
										>
											<Trash2 className="mr-2 h-4 w-4" />
											Delete Product
										</Button>
									</div>
								</div>
							</div>
						</div>
					) : (
						<div className="flex flex-1 items-center justify-center">
							<div className="text-center">
								<Package className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
								<h2 className="mb-2 font-semibold text-xl">
									No Product Selected
								</h2>
								<p className="mb-4 text-muted-foreground">
									Select a product from the list to view its details
								</p>
								<Button variant="outline" onClick={() => setActiveTab("list")}>
									Go to Product List
								</Button>
							</div>
						</div>
					)}
				</TabsContent>
			</Tabs>

			{/* Dialogs - moved outside tabs so they work from both list and details tabs */}
			<AddProductDialog
				open={isAddDialogOpen}
				onOpenChange={handleCloseDialog}
				onAddProduct={handleAddProduct}
				onEditProduct={handleEditProduct}
				editingProduct={editingProduct}
				mode={editingProduct ? "edit" : "add"}
			/>
			{/* Hidden file input for CSV import */}
			<input
				ref={fileInputRef}
				type="file"
				accept=".csv,text/csv"
				onChange={handleFileSelected}
				style={{ display: "none" }}
			/>

			{/* Delete Confirmation Dialog */}
			<Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Delete Product</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete{" "}
							<strong>{productToDelete?.name}</strong>? This action cannot be
							undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={handleCancelDelete}
							className="cursor-pointer"
						>
							Cancel
						</Button>
						<Button
							type="button"
							variant="destructive"
							onClick={handleConfirmDelete}
							className="cursor-pointer"
						>
							Delete
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
