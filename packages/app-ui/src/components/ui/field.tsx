import type * as React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FieldProps {
	children: React.ReactNode;
	className?: string;
}

interface FieldLabelProps {
	children: React.ReactNode;
	htmlFor?: string;
	className?: string;
}

interface FieldMessageProps {
	children?: React.ReactNode;
	className?: string;
	type?: "error" | "info";
}

export function Field({ children, className }: FieldProps) {
	return <div className={cn("space-y-2", className)}>{children}</div>;
}

export function FieldLabel({ children, htmlFor, className }: FieldLabelProps) {
	return (
		<Label
			htmlFor={htmlFor}
			className={cn(
				"font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
				className,
			)}
		>
			{children}
		</Label>
	);
}

export function FieldMessage({
	children,
	className,
	type = "error",
}: FieldMessageProps) {
	if (!children) return null;

	return (
		<p
			className={cn(
				"text-sm",
				type === "error" ? "text-destructive" : "text-muted-foreground",
				className,
			)}
		>
			{children}
		</p>
	);
}
