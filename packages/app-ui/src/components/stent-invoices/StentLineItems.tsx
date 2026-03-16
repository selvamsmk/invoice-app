import { Plus, X } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { DatePickerInput } from "@/components/ui/date-picker";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import SizeEditor from "./SizeEditor";

type Size = {
	id: string;
	sizeDimension: string;
	serialNumber: string;
	expiryDate?: string;
	quantity: number;
};

type StentInvoiceLineItem = {
	id: string;
	productId: string;
	name: string;
	hsnCode: string;
	patientName: string;
	patientAge: number;
	patientDate: string;
	patientGender: string;
	sizes: Size[];
	rate: number;
	gstPercentage: number;
	amount: number;
};

type Props = {
	parent: any;
	lineItems: StentInvoiceLineItem[];
	onChange: (id: string, field: keyof StentInvoiceLineItem, value: any) => void;
	onRemove: (id: string) => void;
	onAddSize: (lineId: string) => void;
	onRemoveSize: (lineId: string, sizeId: string) => void;
	onSizeChange: (
		lineId: string,
		sizeId: string,
		field: string,
		value: any,
	) => void;
};

export default function StentLineItems({
	parent,
	lineItems,
	onChange,
	onRemove,
	onAddSize,
	onRemoveSize,
	onSizeChange,
}: Props) {
	return (
		<div ref={parent} className="space-y-4">
			{lineItems.map((item) => (
				<Card key={item.id} className="relative">
					<CardContent className="pt-6">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={() => onRemove(item.id)}
							className="absolute top-2 right-2 text-red-600 hover:text-red-700"
						>
							<X className="h-4 w-4" />
						</Button>

						<div className="space-y-4">
							{/* Product Info */}
							<div className="grid grid-cols-2 gap-4">
								<Field>
									<FieldLabel>Product Name</FieldLabel>
									<Input value={item.name} disabled className="bg-muted" />
								</Field>

								<Field>
									<FieldLabel>HSN Code</FieldLabel>
									<Input value={item.hsnCode} disabled className="bg-muted" />
								</Field>
							</div>

							{/* Patient Information */}
							<div className="grid grid-cols-4 gap-4 rounded-lg bg-blue-50 p-4 dark:bg-blue-950/20">
								<Field>
									<FieldLabel>Patient Name *</FieldLabel>
									<Input
										value={item.patientName}
										onChange={(e) =>
											onChange(item.id, "patientName", e.target.value)
										}
										placeholder="Enter patient name"
										required
									/>
								</Field>

								<Field>
									<FieldLabel>Patient Age *</FieldLabel>
									<Input
										type="number"
										min="0"
										max="150"
										value={item.patientAge}
										onChange={(e) =>
											onChange(
												item.id,
												"patientAge",
												Number.parseInt(e.target.value) || 0,
											)
										}
										placeholder="Enter age"
										required
									/>
								</Field>

								<Field>
									<FieldLabel>Date *</FieldLabel>
									<DatePickerInput
										value={item.patientDate}
										onChange={(value) => onChange(item.id, "patientDate", value)}
										placeholder="Select date"
									/>
								</Field>

								<Field>
									<FieldLabel>Patient Gender *</FieldLabel>
									<Select
										value={item.patientGender}
										onValueChange={(value) =>
											onChange(item.id, "patientGender", value)
										}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select gender" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="male">Male</SelectItem>
											<SelectItem value="female">Female</SelectItem>
										</SelectContent>
									</Select>
								</Field>
							</div>

							{/* Sizes Section */}
							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<FieldLabel>
										Sizes (Dimension, Serial Number, Expiry, Quantity)
									</FieldLabel>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => onAddSize(item.id)}
									>
										<Plus className="mr-1 h-3 w-3" />
										Add Size
									</Button>
								</div>

								<div className="space-y-2">
									{item.sizes.map((size) => (
										<SizeEditor
											key={size.id}
											lineItemId={item.id}
											size={size}
											onSizeChange={onSizeChange}
											onRemoveSize={onRemoveSize}
											canRemove={item.sizes.length > 1}
										/>
									))}
								</div>
							</div>

							{/* Rate and GST */}
							<div className="grid grid-cols-3 gap-4">
								<Field>
									<FieldLabel>Rate per unit (₹)</FieldLabel>
									<Input
										type="number"
										min="0"
										step="0.01"
										value={item.rate}
										onChange={(e) =>
											onChange(
												item.id,
												"rate",
												Number.parseFloat(e.target.value) || 0,
											)
										}
									/>
								</Field>

								<Field>
									<FieldLabel>GST %</FieldLabel>
									<Input
										type="number"
										min="0"
										max="100"
										step="0.01"
										value={item.gstPercentage}
										onChange={(e) =>
											onChange(
												item.id,
												"gstPercentage",
												Number.parseFloat(e.target.value) || 0,
											)
										}
									/>
								</Field>

								<Field>
									<FieldLabel>Total Amount</FieldLabel>
									<Input
										value={`₹${Math.round(item.amount)}`}
										disabled
										className="bg-muted font-semibold"
									/>
								</Field>
							</div>
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
