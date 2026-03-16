import { pdf } from "@react-pdf/renderer";
import DeliveryChallanDocument, {
	type DeliveryChallanProps,
} from "./pdf-template/delivery-challan-document";
import InvoiceDocument, {
	type InvoiceProps,
} from "./pdf-template/invoice-document";
import StentInvoiceDocument, {
	type StentInvoiceProps,
} from "./pdf-template/stent-invoice-document";

export async function renderInvoicePdf(
	selectedInvoice: InvoiceProps,
	companyData: any,
) {
	const doc = (
		<InvoiceDocument
			selectedInvoice={selectedInvoice}
			companyData={companyData}
		/>
	);
	const buffer = await pdf(doc).toBuffer();
	return buffer;
}

export async function renderStentInvoicePdf(
	selectedInvoice: StentInvoiceProps,
	companyData: any,
) {
	const doc = (
		<StentInvoiceDocument
			selectedInvoice={selectedInvoice}
			companyData={companyData}
		/>
	);
	const buffer = await pdf(doc).toBuffer();
	return buffer;
}

export async function renderDeliveryChallanPdf(
	selectedChallan: DeliveryChallanProps,
	companyData: any,
) {
	const doc = (
		<DeliveryChallanDocument
			selectedChallan={selectedChallan}
			companyData={companyData}
		/>
	);
	const buffer = await pdf(doc).toBuffer();
	return buffer;
}

export default renderInvoicePdf;
