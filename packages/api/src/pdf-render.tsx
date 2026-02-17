import { pdf } from "@react-pdf/renderer";
import InvoiceDocument, { type InvoiceProps } from "./pdf-template/invoice-document";

export async function renderInvoicePdf(selectedInvoice: InvoiceProps, companyData: any) {
  const doc = <InvoiceDocument selectedInvoice={selectedInvoice} companyData={companyData} />;
  const buffer = await pdf(doc).toBuffer();
  return buffer;
}

export default renderInvoicePdf;
