import type { Company } from "@invoice-app/api";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { numberToWordsINR } from "../utils/num-to-words";
import {
	capitalizeWords,
	formatCurrencyPlain,
	formatDate,
} from "../utils/pdf-utils";
import { registerFonts } from "../utils/registerFonts";
import {
	AuthorizedSignSvg,
	CompanyLogoSvg,
	CompanySealSvg,
} from "./invoice-document";

registerFonts();

const FONT_SIZE_LARGE = 12;
const FONT_SIZE_BASE = 9;
const FONT_SIZE_SMALL = 9;
const FONT_SIZE_TINY = 8;

export type SupplyStatementLineItem = {
	id?: string;
	date: string;
	invoiceNo: string;
	quantity: number;
	amount: number;
};

export interface SupplyStatementProps {
	id: string;
	statementNumber: string;
	statementDate: string;
	statementTitle?: string;
	buyerName: string;
	buyerAddressLine1?: string;
	buyerAddressLine2?: string;
	buyerCity?: string;
	buyerState?: string;
	buyerPincode?: string;
	buyerPhone?: string;
	buyerGstin?: string;
	totalAmount: number;
	showSign?: boolean;
	showSeal?: boolean;
	lineItems?: SupplyStatementLineItem[];
}

interface SupplyStatementDocumentProps {
	selectedStatement: SupplyStatementProps;
	companyData?: Company;
}

export function SupplyStatementDocument({
	selectedStatement,
	companyData,
}: SupplyStatementDocumentProps) {
	const lineItems = selectedStatement.lineItems ?? [];
	const totalQuantity =
		lineItems.reduce((sum, item) => sum + (item.quantity ?? 0), 0) ?? 0;
	const totalAmount = selectedStatement.totalAmount ?? 0;

	return (
		<Document title={selectedStatement.statementNumber}>
			<Page size="A4" style={pdfStyles.page} wrap>
				<View style={pdfStyles.headerRow} fixed>
					<View style={pdfStyles.headerLeftGroup}>
						<View style={pdfStyles.logoBox}>
							<CompanyLogoSvg />
						</View>

						<View style={pdfStyles.companyDetails}>
							<Text style={pdfStyles.company}>
								{(
									companyData?.companyName ?? "Your Company Name"
								).toUpperCase()}
							</Text>
							{companyData?.addressLine1 ? (
								<Text style={pdfStyles.textSmall}>
									{companyData.addressLine1}
								</Text>
							) : null}
							{companyData?.addressLine2 ? (
								<Text style={pdfStyles.textSmall}>
									{companyData.addressLine2}
								</Text>
							) : null}
							{companyData?.city || companyData?.pincode ? (
								<Text style={pdfStyles.textSmall}>
									{[companyData?.city, companyData?.pincode]
										.filter(Boolean)
										.join(" - ")}
								</Text>
							) : null}
							{companyData?.gstin ? (
								<Text style={pdfStyles.textSmall}>
									GSTIN: {companyData.gstin}
								</Text>
							) : null}
							{companyData?.drugLicenseNumber ? (
								<Text style={pdfStyles.textSmall}>
									DL NO: {companyData.drugLicenseNumber}
								</Text>
							) : null}
							{companyData?.emailAddress ? (
								<Text style={pdfStyles.textSmall}>
									{companyData.emailAddress}
								</Text>
							) : null}
							{companyData?.phoneNumber ? (
								<Text style={pdfStyles.textSmall}>
									{companyData.phoneNumber}
								</Text>
							) : null}
						</View>
					</View>

					<View style={pdfStyles.statementInfo}>
						<Text style={pdfStyles.statementTypeText}>STATEMENT</Text>
					</View>
				</View>

				<View style={pdfStyles.sectionBlock} fixed>
					<View style={pdfStyles.infoRow}>
						<View style={[pdfStyles.infoColumn, pdfStyles.buyerColumn]}>
							<Text style={pdfStyles.sectionTitle}>Buyer</Text>
							<Text style={pdfStyles.bold}>{selectedStatement.buyerName}</Text>
							{selectedStatement.buyerAddressLine1 ? (
								<Text>{selectedStatement.buyerAddressLine1}</Text>
							) : null}
							{selectedStatement.buyerAddressLine2 ? (
								<Text>{selectedStatement.buyerAddressLine2}</Text>
							) : null}
							{selectedStatement.buyerCity ||
							selectedStatement.buyerState ||
							selectedStatement.buyerPincode ? (
								<Text>
									{[
										selectedStatement.buyerCity,
										selectedStatement.buyerState,
										selectedStatement.buyerPincode,
									]
										.filter(Boolean)
										.join(", ")}
								</Text>
							) : null}
							{selectedStatement.buyerPhone ? (
								<Text>Phone: {selectedStatement.buyerPhone}</Text>
							) : null}
							{selectedStatement.buyerGstin ? (
								<Text>GSTIN: {selectedStatement.buyerGstin}</Text>
							) : null}
						</View>

						<View style={[pdfStyles.infoColumn, pdfStyles.statementMetaColumn]}>
							<View style={pdfStyles.metaRow}>
								<Text style={pdfStyles.metaLabel}>Statement Name</Text>
								<Text style={pdfStyles.metaColon}>:</Text>
								<Text style={pdfStyles.metaValueMultiline}>
									{selectedStatement.statementTitle ?? "Supply Statement"}
								</Text>
							</View>
						</View>
					</View>
				</View>

				<View style={[pdfStyles.sectionBlock, pdfStyles.itemsTableContainer]}>
					<View style={pdfStyles.itemsTable}>
						<View style={[pdfStyles.itemsRow, pdfStyles.itemsHeaderRow]}>
							<Text
								style={[
									pdfStyles.itemsCell,
									pdfStyles.colSerialNo,
									pdfStyles.itemsHeaderCell,
								]}
							>
								S.No
							</Text>
							<Text
								style={[
									pdfStyles.itemsCell,
									pdfStyles.colDate,
									pdfStyles.itemsHeaderCell,
								]}
							>
								Date
							</Text>
							<Text
								style={[
									pdfStyles.itemsCell,
									pdfStyles.colInvoiceNo,
									pdfStyles.itemsHeaderCell,
								]}
							>
								Invoice no
							</Text>
							<Text
								style={[
									pdfStyles.itemsCell,
									pdfStyles.colQty,
									pdfStyles.itemsHeaderCell,
								]}
							>
								Quantity
							</Text>
							<Text
								style={[
									pdfStyles.itemsCell,
									pdfStyles.colAmount,
									pdfStyles.itemsCellLast,
									pdfStyles.itemsHeaderCell,
								]}
							>
								Amount
							</Text>
						</View>

						{lineItems.length > 0 ? (
							lineItems.map((item, index) => (
								<View
									style={pdfStyles.itemsRow}
									key={item.id ?? `${index}`}
									wrap={false}
								>
									<Text
										style={[
											pdfStyles.itemsCell,
											pdfStyles.colSerialNo,
											pdfStyles.textCenter,
										]}
									>
										{index + 1}
									</Text>
									<Text
										style={[
											pdfStyles.itemsCell,
											pdfStyles.colDate,
											pdfStyles.textCenter,
										]}
									>
										{formatDate(item.date)}
									</Text>
									<Text
										style={[
											pdfStyles.itemsCell,
											pdfStyles.colInvoiceNo,
											pdfStyles.textCenter,
										]}
									>
										{item.invoiceNo}
									</Text>
									<Text
										style={[
											pdfStyles.itemsCell,
											pdfStyles.colQty,
											pdfStyles.textCenter,
										]}
									>
										{item.quantity}
									</Text>
									<Text
										style={[
											pdfStyles.itemsCell,
											pdfStyles.colAmount,
											pdfStyles.itemsCellLast,
											pdfStyles.textRight,
										]}
									>
										{formatCurrencyPlain(item.amount)}
									</Text>
								</View>
							))
						) : (
							<View style={pdfStyles.itemsRow}>
								<Text
									style={[
										pdfStyles.itemsCell,
										pdfStyles.colInvoiceNo,
										pdfStyles.itemsCellLast,
										{ width: "100%", textAlign: "center" },
									]}
								>
									No statement rows
								</Text>
							</View>
						)}

						<View style={pdfStyles.itemsSpacerRow}>
							<View style={[pdfStyles.itemsCell, pdfStyles.colSerialNo]} />
							<View style={[pdfStyles.itemsCell, pdfStyles.colDate]} />
							<View style={[pdfStyles.itemsCell, pdfStyles.colInvoiceNo]} />
							<View style={[pdfStyles.itemsCell, pdfStyles.colQty]} />
							<View
								style={[
									pdfStyles.itemsCell,
									pdfStyles.colAmount,
									pdfStyles.itemsCellLast,
								]}
							/>
						</View>
					</View>
				</View>

				<View style={pdfStyles.summaryBlock} wrap={false}>
					<View
						style={[pdfStyles.itemsRow, pdfStyles.itemsFooterRow]}
						wrap={false}
					>
						<Text
							style={[
								pdfStyles.itemsCell,
								pdfStyles.colSerialNo,
								pdfStyles.itemsFooterCell,
							]}
						/>
						<Text
							style={[
								pdfStyles.itemsCell,
								pdfStyles.colDate,
								pdfStyles.itemsFooterCell,
							]}
						/>
						<Text
							style={[
								pdfStyles.itemsCell,
								pdfStyles.colInvoiceNo,
								pdfStyles.itemsFooterCell,
							]}
						>
							Total
						</Text>
						<Text
							style={[
								pdfStyles.itemsCell,
								pdfStyles.colQty,
								pdfStyles.textCenter,
								pdfStyles.itemsFooterCell,
							]}
						>
							{totalQuantity}
						</Text>
						<Text
							style={[
								pdfStyles.itemsCell,
								pdfStyles.colAmount,
								pdfStyles.itemsCellLast,
								pdfStyles.textRight,
								pdfStyles.itemsFooterCell,
							]}
						>
							{formatCurrencyPlain(totalAmount)}
						</Text>
					</View>

					<View style={pdfStyles.amountWordsTable}>
						<View style={pdfStyles.amountWordsRow}>
							<View style={pdfStyles.amountWordsLabelCell}>
								<Text style={pdfStyles.amountWordsLabelText}>
									Amount in words
								</Text>
							</View>
							<View style={pdfStyles.amountWordsValueCell}>
								<Text style={pdfStyles.amountWordsValueText}>
									Rupees {capitalizeWords(numberToWordsINR(totalAmount))} Only
								</Text>
							</View>
						</View>
					</View>
				</View>

				<View style={pdfStyles.footerRow} wrap={false}>
					<View style={pdfStyles.footerLeftColumn}>
						<View style={pdfStyles.bankRow}>
							<Text style={pdfStyles.bankLabel}>Bank</Text>
							<Text style={pdfStyles.bankColon}>:</Text>
							<Text style={pdfStyles.bankValue}>
								{companyData?.bankName || ""}
							</Text>
						</View>
						<View style={pdfStyles.bankRow}>
							<Text style={pdfStyles.bankLabel}>Account</Text>
							<Text style={pdfStyles.bankColon}>:</Text>
							<Text style={pdfStyles.bankValue}>
								{companyData?.bankAccountNumber || ""}
							</Text>
						</View>
						<View style={pdfStyles.bankRow}>
							<Text style={pdfStyles.bankLabel}>IFSC</Text>
							<Text style={pdfStyles.bankColon}>:</Text>
							<Text style={pdfStyles.bankValue}>
								{companyData?.ifscCode || ""}
							</Text>
						</View>
						<View style={pdfStyles.bankRow}>
							<Text style={pdfStyles.bankLabel}>Branch</Text>
							<Text style={pdfStyles.bankColon}>:</Text>
							<Text style={pdfStyles.bankValue}>
								{companyData?.branch || ""}
							</Text>
						</View>
					</View>

					<View style={pdfStyles.footerMiddleColumn}>
						<View style={pdfStyles.sealBox}>
							{selectedStatement.showSeal ? <CompanySealSvg /> : null}
						</View>
					</View>

					<View style={pdfStyles.footerRightColumn}>
						<Text style={pdfStyles.footerLabel}>
							For {companyData?.companyName}
						</Text>
						<View style={pdfStyles.signatureBox}>
							{selectedStatement.showSign ? <AuthorizedSignSvg /> : null}
						</View>
						<Text style={pdfStyles.footerLabel}>Authorized Signatory</Text>
					</View>
				</View>

				<View style={pdfStyles.pageFooter} fixed>
					<Text
						style={pdfStyles.pageNumber}
						render={({ pageNumber, totalPages }) =>
							totalPages > 1 ? `${pageNumber} / ${totalPages}` : ""
						}
					/>
				</View>
			</Page>
		</Document>
	);
}

export const pdfStyles = StyleSheet.create({
	page: {
		padding: 12,
		fontSize: FONT_SIZE_BASE,
		fontFamily: "OpenSans",
		fontWeight: 500,
		display: "flex",
		flexDirection: "column",
	},
	textSmall: { fontSize: FONT_SIZE_SMALL },
	textCenter: { textAlign: "center" },
	textRight: { textAlign: "right" },
	bold: { fontWeight: "bold" },

	headerRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		width: "100%",
		alignItems: "flex-start",
		marginBottom: 5,
		gap: 12,
	},
	headerLeftGroup: {
		flex: 1,
		flexDirection: "row",
		justifyContent: "flex-start",
		alignItems: "center",
		gap: 10,
	},
	logoBox: { width: 60, height: 60 },
	companyDetails: { textAlign: "left" },
	company: { fontSize: FONT_SIZE_LARGE, fontWeight: "700", textAlign: "right" },
	statementInfo: { alignItems: "flex-start" },
	statementTypeText: { fontWeight: 700, fontSize: 12 },

	sectionBlock: { marginBottom: 0 },
	sectionTitle: {
		fontSize: FONT_SIZE_BASE,
		marginBottom: 4,
		fontWeight: "bold",
	},
	infoRow: {
		flexDirection: "row",
		width: "100%",
		borderWidth: 1,
		borderColor: "rgba(0,0,0,0)",
		borderBottomWidth: 1,
	},
	infoColumn: { width: "100%", padding: 6 },
	buyerColumn: { borderRightWidth: 1, borderRightColor: "rgba(0,0,0,0)" },
	statementMetaColumn: {
		flexDirection: "column",
		justifyContent: "flex-start",
		gap: 2,
	},
	metaRow: { flexDirection: "row", alignItems: "flex-start" },
	metaLabel: { width: "34%", textAlign: "left" },
	metaColon: { width: "5%", textAlign: "center" },
	metaValueMultiline: {
		width: "61%",
		textAlign: "left",
		lineHeight: 0.8,
		paddingRight: 2,
		wordBreak: "break-word",
	},

	itemsTableContainer: {
		display: "flex",
		flexDirection: "column",
		paddingBottom: 0,
		marginTop: 0,
		flexGrow: 1,
	},
	itemsTable: {
		width: "100%",
		borderColor: "rgba(0,0,0,0)",
		marginTop: 0,
		borderTopWidth: 0,
		display: "flex",
		flexDirection: "column",
		flex: 1,
	},
	itemsRow: {
		flexDirection: "row",
		borderColor: "rgba(0,0,0,0.12)",
		borderRightWidth: 1,
		borderLeftWidth: 1,
		borderTopWidth: 0,
		borderBottomWidth: 0,
	},
	itemsHeaderRow: {
		backgroundColor: "rgba(0,0,0,0)",
		fontWeight: "bold",
		borderTopWidth: 0,
		borderBottomWidth: 1,
	},
	itemsCell: {
		paddingTop: 2,
		paddingBottom: 2,
		paddingRight: 2,
		paddingLeft: 2,
		borderRightWidth: 1,
		borderRightColor: "rgba(0,0,0,0.12)",
		fontSize: FONT_SIZE_TINY,
	},
	itemsHeaderCell: { textAlign: "center", fontWeight: "bold" },
	itemsCellLast: { borderRightWidth: 0 },
	colSerialNo: { width: "10%" },
	colDate: { width: "18%" },
	colInvoiceNo: { width: "38%" },
	colQty: { width: "14%" },
	colAmount: { width: "20%" },
	itemsSpacerRow: {
		flexGrow: 1,
		flexDirection: "row",
		borderLeftWidth: 1,
		borderRightWidth: 1,
		borderColor: "rgba(0,0,0,0.12)",
	},
	itemsFooterRow: {
		borderTopWidth: 1,
		borderTopColor: "rgba(0,0,0,0)",
		marginTop: 0,
		paddingTop: 0,
		borderBottomWidth: 1,
	},
	itemsFooterCell: { fontWeight: "bold", textTransform: "uppercase" },

	amountWordsTable: { width: "100%", marginTop: 0, paddingBottom: 0 },
	amountWordsRow: {
		flexDirection: "row",
		borderWidth: 1,
		borderColor: "rgba(0,0,0,0.12)",
		borderTopWidth: 0,
	},
	amountWordsLabelCell: {
		width: "25%",
		padding: 8,
		borderRightWidth: 1,
		borderRightColor: "rgba(0,0,0,0.12)",
		justifyContent: "center",
	},
	amountWordsValueCell: { width: "75%", padding: 8, justifyContent: "center" },
	amountWordsLabelText: { fontSize: FONT_SIZE_SMALL },
	amountWordsValueText: { fontSize: FONT_SIZE_SMALL, fontWeight: "bold" },
	summaryBlock: { width: "100%", marginTop: 0 },

	footerRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		borderWidth: 1,
		borderColor: "rgba(0,0,0,0)",
		paddingTop: 0,
		paddingBottom: 0,
		paddingLeft: 8,
		paddingRight: 8,
		backgroundColor: "white",
		borderTopWidth: 0,
		fontWeight: 600,
	},
	footerLeftColumn: {
		width: "35%",
		paddingLeft: 8,
		paddingRight: 4,
		borderRightWidth: 1,
		borderRightColor: "rgba(0,0,0,0.12)",
		paddingTop: 13,
		paddingBottom: 13,
		justifyContent: "center",
	},
	footerMiddleColumn: {
		width: "30%",
		alignItems: "center",
		justifyContent: "center",
		paddingLeft: 8,
		paddingRight: 8,
		borderRightWidth: 1,
		borderRightColor: "rgba(0,0,0,0.12)",
		paddingTop: 4,
		paddingBottom: 4,
	},
	sealBox: {
		width: 100,
		height: 80,
		alignItems: "center",
		justifyContent: "center",
	},
	footerRightColumn: {
		width: "35%",
		alignItems: "center",
		justifyContent: "space-between",
		paddingLeft: 8,
		paddingRight: 8,
		borderRightWidth: 0,
		paddingTop: 4,
		paddingBottom: 4,
	},
	footerLabel: {
		fontSize: FONT_SIZE_SMALL,
		textAlign: "center",
		textTransform: "uppercase",
		fontWeight: "bold",
	},
	signatureBox: {
		width: "100%",
		height: 37,
		alignItems: "center",
		justifyContent: "center",
	},
	bankRow: { flexDirection: "row", marginBottom: 2, alignItems: "center" },
	bankLabel: {
		width: "20%",
		fontSize: FONT_SIZE_SMALL,
		color: "rgba(0,0,0,0.8)",
	},
	bankColon: {
		width: "10%",
		fontSize: FONT_SIZE_SMALL,
		textAlign: "right",
		paddingRight: 2,
	},
	bankValue: {
		flex: 1,
		fontSize: FONT_SIZE_SMALL,
		fontWeight: "bold",
		paddingLeft: 2,
	},

	pageFooter: {
		borderTopWidth: 1,
		borderTopColor: "rgba(0,0,0,1)",
		paddingTop: 4,
		paddingBottom: 4,
		paddingRight: 8,
		flexDirection: "row",
		justifyContent: "flex-end",
	},
	pageNumber: { fontSize: FONT_SIZE_TINY, textAlign: "right" },
});

export default SupplyStatementDocument;
