export const formatCurrencyIntl = (amount?: number | null, isPaise = true) => {
	const raw = typeof amount === "number" && !Number.isNaN(amount) ? amount : 0;
	const value = isPaise ? raw / 100 : raw;
	const rounded = Math.ceil(value);
	return (
		"Rs. " +
		rounded.toLocaleString("en-IN", {
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		})
	);
};

// Treat values as rupees by default (no paise -> rupee division)
export const formatCurrency = (amount: number) =>
	formatCurrencyIntl(amount, false);

export const formatCurrencyRupees = (amount: number) =>
	formatCurrencyIntl(amount, false);

export const formatCurrencyPlain = (
	amount?: number | null,
	isPaise = false,
) => {
	const raw = typeof amount === "number" && !Number.isNaN(amount) ? amount : 0;
	const value = isPaise ? raw / 100 : raw;
	const rounded = Math.ceil(value);
	return rounded.toLocaleString("en-IN", {
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	});
};

export const formatDate = (dateString: string) =>
	new Date(dateString).toLocaleDateString("en-IN", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});

export const formatExpiry = (expiry?: string) => {
	if (!expiry) return "";
	const parts = expiry
		.split(",")
		.map((part) => part.trim())
		.filter(Boolean);
	return parts
		.map((part) => {
			const parsed = new Date(part);
			return Number.isNaN(parsed.getTime()) ? part : formatDate(part);
		})
		.join(", ");
};

export const capitalizeWords = (value?: string) => {
	if (!value) return "";
	return value.replace(/\b\w/g, (char) => char.toUpperCase());
};
