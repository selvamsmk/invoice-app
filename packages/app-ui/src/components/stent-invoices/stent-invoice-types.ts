export interface StentInvoice {
	id: string;
	invoiceNumber: string;
	buyerName: string;
	buyerCity: string;
	buyerState: string;
	amount: number;
	totalAmount: number;
	status: string;
	invoiceDate: string;
	dueDate?: string;
	dcDate?: string;
	dcNumber?: string;
	dispatchedThrough?: string;
	createdAt: string;
	isFinalized: boolean;
	invoiceType: string;
	lineItems?: {
		id?: string;
		name: string;
		hsnCode?: string;
		patientName: string;
		patientAge: number;
		patientDate: string;
		patientGender: string;
		quantity: number;
		sizes?: {
			id?: string;
			sizeDimension: string;
			serialNumber: string;
			expiryDate?: string;
			quantity: number;
		}[];
		rate: number;
		gstPercentage?: number;
		amount: number;
	}[];
}
