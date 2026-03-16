import type { Company } from "@invoice-app/api";
import {
	Document,
	Page,
	Path,
	StyleSheet,
	Svg,
	Text,
	View,
} from "@react-pdf/renderer";
import { formatDate, formatExpiry } from "../utils/pdf-utils";
import { registerFonts } from "../utils/registerFonts";

registerFonts();

// Font size constants for easy customization
const FONT_SIZE_LARGE = 12;
const FONT_SIZE_BASE = 9;
const FONT_SIZE_SMALL = 9;
const FONT_SIZE_TINY = 8;

const CompanyLogoSvg = ({
	width = 60,
	height = 60,
}: {
	width?: number;
	height?: number;
}) => (
	<Svg
		width={width}
		height={height}
		viewBox="0 0 1098 955"
		preserveAspectRatio="xMidYMid meet"
		style={{ width, height }}
	>
		<Path
			d="M 120.00 581.60 L 120.00 208.19 L 116.65 202.35 C114.81,199.13 109.35,189.75 104.52,181.50 C99.68,173.25 87.53,152.32 77.51,135.00 C67.48,117.68 50.60,88.65 39.99,70.50 C8.74,17.06 -0.09,1.75 0.22,1.51 C0.37,1.38 54.35,0.97 120.16,0.61 L 239.83 -0.06 L 244.80 8.22 C247.53,12.77 258.53,31.80 269.25,50.50 C292.43,90.97 307.51,117.14 335.51,165.50 C346.98,185.30 359.48,206.90 363.31,213.50 C375.37,234.33 409.19,293.17 413.78,301.32 C416.21,305.62 418.04,309.28 417.85,309.46 C417.52,309.76 404.80,317.14 378.61,332.21 C372.07,335.97 366.62,338.93 366.51,338.78 C366.20,338.38 353.19,315.85 333.70,282.00 C324.36,265.77 313.34,246.65 309.21,239.50 C305.08,232.35 293.94,213.00 284.45,196.50 C274.95,180.00 259.01,152.32 249.01,135.00 C239.01,117.68 225.36,93.94 218.66,82.26 L 206.50 61.03 L 155.21 61.01 L 103.93 61.00 L 105.11 63.25 C106.32,65.55 133.98,113.27 152.79,145.50 C171.59,177.73 180.46,192.96 200.22,227.00 C210.92,245.43 226.21,271.75 234.20,285.50 C242.18,299.25 260.10,330.08 274.01,354.00 C287.93,377.92 312.13,419.55 327.80,446.50 C343.47,473.45 361.93,505.17 368.82,517.00 C375.71,528.83 382.43,540.41 383.76,542.75 C385.09,545.09 386.48,547.00 386.87,547.00 C387.25,547.00 401.12,522.59 417.69,492.75 C457.90,420.34 512.99,321.43 524.48,301.00 C535.77,280.92 554.41,247.71 563.38,231.67 C567.02,225.17 570.00,219.54 570.00,219.17 C570.00,218.80 550.76,218.63 527.25,218.79 L 484.50 219.09 L 482.37 215.29 C474.04,200.48 435.18,130.69 428.47,118.50 C423.93,110.25 416.20,96.30 411.28,87.50 C398.66,64.93 388.05,45.83 378.75,29.00 C374.35,21.02 369.66,12.59 368.33,10.25 L 365.92 6.00 L 667.83 6.00 L 969.74 6.00 L 973.70 12.75 C975.88,16.46 984.80,31.20 993.51,45.50 C1002.22,59.80 1017.53,85.00 1027.52,101.50 C1052.71,143.10 1068.34,168.75 1084.33,194.71 C1091.85,206.92 1098.00,217.16 1098.00,217.46 C1098.00,217.76 1043.78,218.00 977.50,218.00 L 857.00 218.00 L 857.00 585.50 L 857.00 953.00 L 741.50 953.00 L 626.00 953.00 L 626.00 767.30 C626.00,654.78 625.64,581.97 625.08,582.55 C624.23,583.44 614.76,599.72 553.03,706.50 C539.68,729.60 527.05,751.42 524.96,755.00 C522.88,758.58 512.54,776.35 501.98,794.50 C491.43,812.65 482.50,827.81 482.15,828.20 C481.79,828.58 468.32,806.30 452.22,778.70 C436.11,751.09 416.60,717.70 408.85,704.50 C401.10,691.30 382.39,659.12 367.28,633.00 C352.16,606.88 339.39,585.07 338.90,584.55 C338.37,583.99 338.00,659.77 338.00,769.30 L 338.00 955.00 L 229.00 955.00 L 120.00 955.00 L 120.00 581.60 ZM 278.00 688.15 L 278.00 480.29 L 261.67 452.40 C252.68,437.05 240.69,416.40 235.00,406.50 C229.32,396.60 221.66,383.33 217.97,377.00 C214.29,370.67 206.86,357.85 201.46,348.50 C196.06,339.15 189.02,327.02 185.82,321.55 L 180.00 311.61 L 180.01 503.05 C180.01,608.35 179.83,739.58 179.60,794.68 C179.38,849.78 179.45,895.11 179.76,895.43 C180.08,895.74 202.31,896.00 229.17,896.00 L 278.00 896.00 L 278.00 688.15 ZM 797.25 590.05 C797.39,422.88 797.19,286.41 796.82,286.80 C796.44,287.18 791.90,294.92 786.72,304.00 C770.97,331.60 718.22,422.78 703.99,447.00 C700.27,453.33 694.69,462.92 691.57,468.32 L 685.91 478.14 L 685.91 563.32 C685.91,610.17 685.93,703.74 685.96,771.25 L 686.00 894.00 L 741.50 894.00 L 796.99 894.00 L 797.25 590.05 ZM 491.80 693.00 C496.71,684.47 508.81,663.55 518.71,646.50 C537.58,613.97 546.77,598.05 569.50,558.50 C577.09,545.30 590.14,522.80 598.50,508.50 C606.87,494.20 617.08,476.65 621.20,469.50 C625.32,462.35 636.63,442.92 646.32,426.32 C656.01,409.72 671.31,383.40 680.31,367.82 C689.31,352.24 707.40,321.05 720.50,298.50 C746.25,254.20 757.20,235.28 781.31,193.50 C789.88,178.65 798.03,164.59 799.42,162.25 L 801.95 158.00 L 881.23 157.89 C977.27,157.76 990.99,157.64 990.99,157.00 C991.00,156.46 987.60,150.80 961.02,107.00 C951.50,91.32 942.94,77.15 941.99,75.50 C941.05,73.85 939.27,70.81 938.04,68.75 L 935.80 65.00 L 701.90 65.00 C568.65,65.00 468.00,65.38 468.00,65.88 C468.00,66.36 476.92,82.67 487.83,102.13 C498.74,121.58 509.83,141.55 512.48,146.50 C515.12,151.45 517.97,156.28 518.79,157.24 C520.20,158.87 525.44,159.00 596.13,159.24 L 671.96 159.50 L 665.35 171.50 C640.93,215.77 625.08,244.27 600.53,288.00 C595.43,297.08 586.54,313.05 580.77,323.50 C574.99,333.95 559.35,362.08 546.00,386.00 C532.66,409.92 518.48,435.35 514.50,442.50 C510.52,449.65 504.35,460.67 500.80,467.00 C477.12,509.20 470.15,521.66 460.53,539.00 C454.58,549.72 443.46,569.63 435.82,583.24 C423.35,605.43 422.04,608.21 423.10,610.24 C423.75,611.48 428.42,619.47 433.48,628.00 C438.53,636.53 451.36,658.49 461.97,676.81 C472.59,695.13 481.64,709.76 482.08,709.31 C482.52,708.87 486.89,701.53 491.80,693.00 Z"
			fill="rgba(0,0,0,1)"
		/>
	</Svg>
);

export interface DeliveryChallanProps {
	id: string;
	challanNumber: string;
	challanDate: string;
	dcDate?: string;
	dcNumber?: string;
	dispatchedThrough?: string;
	buyerName: string;
	buyerAddressLine1: string;
	buyerAddressLine2?: string;
	buyerCity: string;
	buyerState: string;
	buyerPincode: string;
	buyerPhone?: string;
	buyerGstin?: string;
	lineItems?: {
		id: string;
		name: string;
		hsnCode?: string;
		quantity: number;
		batches?: {
			batchNo?: string;
			expiryDate?: string;
			quantity: number;
		}[];
	}[];
}

interface DeliveryChallanDocumentProps {
	selectedChallan: DeliveryChallanProps;
	companyData?: Company;
}

export function DeliveryChallanDocument({
	selectedChallan,
	companyData,
}: DeliveryChallanDocumentProps) {
	return (
		<Document title={selectedChallan.challanNumber}>
			<Page size="A4" style={pdfStyles.page} wrap>
				{/* Header first row: logo (left), then company details and challan info to the right */}

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
							{companyData?.addressLine1 && (
								<Text style={pdfStyles.textSmall}>
									{companyData.addressLine1}
								</Text>
							)}
							{companyData?.addressLine2 && (
								<Text style={pdfStyles.textSmall}>
									{companyData.addressLine2}
								</Text>
							)}
							{(companyData?.city || companyData?.pincode) && (
								<Text style={pdfStyles.textSmall}>
									{[companyData?.city, companyData?.pincode]
										.filter(Boolean)
										.join(" - ")}
								</Text>
							)}
							{companyData?.gstin && (
								<Text style={pdfStyles.textSmall}>
									GSTIN: {companyData.gstin}
								</Text>
							)}
							{companyData?.drugLicenseNumber && (
								<Text style={pdfStyles.textSmall}>
									DL NO: {companyData.drugLicenseNumber}
								</Text>
							)}
							{companyData?.emailAddress && (
								<Text style={pdfStyles.textSmall}>
									{companyData.emailAddress}
								</Text>
							)}
							{companyData?.phoneNumber && (
								<Text style={pdfStyles.textSmall}>
									{companyData.phoneNumber}
								</Text>
							)}
						</View>
					</View>

					<View style={pdfStyles.challanInfo}>
						<Text style={pdfStyles.challanTypeText}>DELIVERY CHALLAN</Text>
					</View>
				</View>

				<View style={pdfStyles.sectionBlock} fixed>
					<View style={pdfStyles.infoRow}>
						<View style={[pdfStyles.infoColumn, pdfStyles.billToColumn]}>
							<Text style={pdfStyles.sectionTitle}>Bill To</Text>
						<Text style={{ fontWeight: "bold" }}>{selectedChallan.buyerName}</Text>
							{selectedChallan.buyerAddressLine1 && (
								<Text>{selectedChallan.buyerAddressLine1}</Text>
							)}
							{selectedChallan.buyerAddressLine2 && (
								<Text>{selectedChallan.buyerAddressLine2}</Text>
							)}
							{(selectedChallan.buyerCity ||
								selectedChallan.buyerState ||
								selectedChallan.buyerPincode) && (
								<Text>
									{[
										selectedChallan.buyerCity,
										selectedChallan.buyerState,
										selectedChallan.buyerPincode,
									]
										.filter(Boolean)
										.join(", ")}
								</Text>
							)}
							{selectedChallan.buyerPhone && (
								<Text>Phone: {selectedChallan.buyerPhone}</Text>
							)}
							{selectedChallan.buyerGstin && (
								<Text>GSTIN: {selectedChallan.buyerGstin}</Text>
							)}
						</View>

						<View style={[pdfStyles.infoColumn, pdfStyles.challanMetaColumn]}>
							<View style={pdfStyles.challanMetaGroup}>
								<View style={pdfStyles.metaRow}>
									<Text style={pdfStyles.metaLabel}>D.C number</Text>
									<Text style={pdfStyles.metaColon}>:</Text>
									<Text style={pdfStyles.metaValue}>
										{selectedChallan.challanNumber}
									</Text>
								</View>
								<View style={pdfStyles.metaRow}>
									<Text style={pdfStyles.metaLabel}>D.C date</Text>
									<Text style={pdfStyles.metaColon}>:</Text>
									<Text style={pdfStyles.metaValue}>
										{formatDate(selectedChallan.challanDate)}
									</Text>
								</View>
                                <View style={pdfStyles.metaRow}>
									<Text style={pdfStyles.metaLabel}>Dispatched through</Text>
									<Text style={pdfStyles.metaColon}>:</Text>
									<Text style={pdfStyles.metaValue}>
										{selectedChallan.dispatchedThrough ?? ""}
									</Text>
								</View>
							</View>
						</View>
					</View>
				</View>

				{/* Products table - only 5 columns for DC */}
				<View style={[pdfStyles.sectionBlock, pdfStyles.itemsTableContainer]}>
					<View style={pdfStyles.itemsTable}>
						<View style={[pdfStyles.itemsRow, pdfStyles.itemsHeaderRow]}>
							<Text
								style={[
									pdfStyles.itemsCell,
									pdfStyles.colSerial,
									pdfStyles.itemsHeaderCell,
									pdfStyles.cellPaddingNarrowX,
								]}
							>
								S.No
							</Text>
							<Text
								style={[
									pdfStyles.itemsCell,
									pdfStyles.colItem,
									pdfStyles.itemsHeaderCell,
								]}
							>
								Description of goods
							</Text>
							<Text
								style={[
									pdfStyles.itemsCell,
									pdfStyles.colHsn,
									pdfStyles.itemsHeaderCell,
									pdfStyles.cellPaddingNarrowX,
								]}
							>
								HSN
							</Text>
							<Text
								style={[
									pdfStyles.itemsCell,
									pdfStyles.colBatches,
									pdfStyles.itemsHeaderCell,
									pdfStyles.cellPaddingNarrowX,
								]}
							>
								Batch No.
							</Text>
							<Text
								style={[
									pdfStyles.itemsCell,
									pdfStyles.colExpiry,
									pdfStyles.itemsHeaderCell,
									pdfStyles.cellPaddingNarrowX,
								]}
							>
								Expiry
							</Text>
							<Text
								style={[
									pdfStyles.itemsCell,
									pdfStyles.colQty,
									pdfStyles.itemsCellLast,
									pdfStyles.itemsHeaderCell,
									pdfStyles.cellPaddingNarrowX,
								]}
							>
								Qty
							</Text>
						</View>

						{selectedChallan.lineItems &&
						selectedChallan.lineItems.length > 0 ? (
							(() => {
								return (
									<>
										{selectedChallan.lineItems!.map((item, idx) => {
											const batches = item.batches || [];
											const validBatches = batches.filter(
												(bb: any) => bb && bb.batchNo,
											);

											const rowStyles: any = [pdfStyles.itemsRow];
											const isLastItem =
												idx === selectedChallan.lineItems!.length - 1;
											if (validBatches.length > 0 || isLastItem)
												rowStyles.push(pdfStyles.itemsRowNoBorder);

											return (
												<View key={item.id ?? idx}>
													<View style={rowStyles} wrap={false}>
														<Text
															style={[
																pdfStyles.itemsCell,
																pdfStyles.colSerial,
																pdfStyles.cellPaddingNarrowX,
																pdfStyles.textCenter,
															]}
														>
															{idx + 1}
														</Text>
														<Text
															style={[pdfStyles.itemsCell, pdfStyles.colItem]}
														>
															{item.name}
														</Text>
														<Text
															style={[
																pdfStyles.itemsCell,
																pdfStyles.colHsn,
																pdfStyles.textCenter,
																pdfStyles.cellPaddingNarrowX,
															]}
														>
															{item.hsnCode ?? ""}
														</Text>
														<Text
															style={[
																pdfStyles.itemsCell,
																pdfStyles.colBatches,
																pdfStyles.textCenter,
																pdfStyles.cellPaddingNarrowX,
															]}
														>
															{validBatches
																.map((b) => b.batchNo)
																.filter(Boolean)
																.join("\n")}
														</Text>
														<Text
															style={[
																pdfStyles.itemsCell,
																pdfStyles.colExpiry,
																pdfStyles.textCenter,
																pdfStyles.cellPaddingNarrowX,
															]}
														>
															{validBatches
																.map((b) =>
																	formatExpiry(b.expiryDate ?? undefined),
																)
																.filter(Boolean)
																.join("\n")}
														</Text>
														<Text
															style={[
																pdfStyles.itemsCell,
																pdfStyles.colQty,
																pdfStyles.itemsCellLast,
																pdfStyles.textCenter,
																pdfStyles.cellPaddingNarrowX,
															]}
														>
															{item.quantity}
														</Text>
													</View>
												</View>
											);
										})}
									</>
								);
							})()
						) : (
							<View style={pdfStyles.itemsRow}>
								<Text
									style={[
										pdfStyles.itemsCell,
										pdfStyles.colItem,
										{ width: "100%" },
									]}
								>
									No line items
								</Text>
							</View>
						)}

						{/* Empty spacer row that grows to fill remaining space */}
						<View style={pdfStyles.itemsSpacerRow}>
							<View style={[pdfStyles.itemsCell, pdfStyles.colSerial]} />
							<View style={[pdfStyles.itemsCell, pdfStyles.colItem]} />
							<View style={[pdfStyles.itemsCell, pdfStyles.colHsn]} />
							<View style={[pdfStyles.itemsCell, pdfStyles.colBatches]} />
							<View style={[pdfStyles.itemsCell, pdfStyles.colExpiry]} />
							<View
								style={[
									pdfStyles.itemsCell,
									pdfStyles.colQty,
									pdfStyles.itemsCellLast,
								]}
							/>
						</View>
					</View>
				</View>

				{/* Bottom summary: totals row */}
				<View style={pdfStyles.summaryBlock} wrap={false}>
					{/* Totals row */}
					{(() => {
						const totalQuantity =
							selectedChallan.lineItems?.reduce(
								(s, it) => s + (it.quantity ?? 0),
								0,
							) ?? 0;
						return (
							<View
								style={[pdfStyles.itemsRow, pdfStyles.itemsFooterRow]}
								wrap={false}
							>
								<Text
									style={[
										pdfStyles.itemsCell,
										pdfStyles.colSerial,
										pdfStyles.itemsFooterCell,
										pdfStyles.cellPaddingNarrowX,
									]}
								/>
								<Text
									style={[
										pdfStyles.itemsCell,
										pdfStyles.colItem,
										pdfStyles.itemsFooterCell,
									]}
								>
									{"Total"}
								</Text>
								<Text
									style={[
										pdfStyles.itemsCell,
										pdfStyles.colHsn,
										pdfStyles.itemsFooterCell,
										pdfStyles.cellPaddingNarrowX,
									]}
								/>
								<Text
									style={[
										pdfStyles.itemsCell,
										pdfStyles.colBatches,
										pdfStyles.itemsFooterCell,
										pdfStyles.cellPaddingNarrowX,
									]}
								/>
								<Text
									style={[
										pdfStyles.itemsCell,
										pdfStyles.colExpiry,
										pdfStyles.itemsFooterCell,
										pdfStyles.cellPaddingNarrowX,
									]}
								/>
								<Text
									style={[
										pdfStyles.itemsCell,
										pdfStyles.colQty,
										pdfStyles.itemsCellLast,
										pdfStyles.textCenter,
										pdfStyles.itemsFooterCell,
										pdfStyles.cellPaddingNarrowX,
									]}
								>
									{totalQuantity}
								</Text>
							</View>
						);
					})()}
				</View>

				{/* Fixed footer shown on every page */}
				<View style={pdfStyles.footerRow} wrap={false}>
					<View style={pdfStyles.footerLeftColumn}>
						<Text style={pdfStyles.dcAcknowledgmentText}>
							Products received in good condition
						</Text>
						<View style={pdfStyles.dcSignatureSpace} />
						<Text style={pdfStyles.dcSignatureLabel}>Signature / Seal</Text>
					</View>

					<View style={pdfStyles.footerMiddleColumn} />

					<View style={pdfStyles.footerRightColumn}>
						<Text style={pdfStyles.footerLabel}>
							For {companyData?.companyName}
						</Text>
						<Text style={pdfStyles.footerLabel}>Authorized Signatory</Text>
					</View>
				</View>

				{/* Page footer with page number */}
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
	// Layout
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
	// Header
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
	challanInfo: { alignItems: "flex-start" },
	challanTypeText: { fontWeight: 700 },
	// Sections
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
	billToColumn: { borderRightWidth: 1, borderRightColor: "rgba(0,0,0,0)" },
	challanMetaColumn: { flexDirection: "column", justifyContent: "flex-start" },
	challanMetaGroup: { flex: 1, justifyContent: "flex-start", gap: 2 },
	metaRow: { flexDirection: "row", alignItems: "center" },
	metaLabel: { width: "45%", textAlign: "left" },
	metaColon: { width: "5%", textAlign: "center" },
	metaValue: { width: "50%", textAlign: "left" },
	// Items table
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
		paddingRight: 1,
		paddingLeft: 2,
		borderRightWidth: 1,
		borderRightColor: "rgba(0,0,0,0.12)",
		fontSize: FONT_SIZE_TINY,
	},
	itemsHeaderCell: { textAlign: "center", fontWeight: "bold" },
	itemsCellLast: { borderRightWidth: 0 },
	cellPaddingNarrowX: { paddingLeft: 1, paddingRight: 1 },
	// DC column widths - only 5 columns
	colSerial: { width: "8%" },
	colItem: { width: "42%" },
	colHsn: { width: "14.55%" },
	colBatches: { width: "15.45%" },
	colExpiry: { width: "13%" },
	colQty: { width: "7%" },
	itemsRowNoBorder: {
		borderLeftWidth: 1,
		borderRightWidth: 1,
		borderTopWidth: 0,
		borderBottomWidth: 0,
	},
	itemsSpacerRow: {
		flexGrow: 1,
		flexDirection: "row",
		borderLeftWidth: 1,
		borderRightWidth: 1,
		borderColor: "rgba(0,0,0,0.12)",
	},
	// Footer
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
		paddingTop: 4,
		paddingBottom: 4,
	},
	footerMiddleColumn: {
		width: "30%",
		paddingLeft: 8,
		paddingRight: 8,
		borderRightWidth: 1,
		borderRightColor: "rgba(0,0,0,0.12)",
		paddingTop: 4,
		paddingBottom: 4,
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
	// DC acknowledgment styles
	dcAcknowledgmentText: {
		fontSize: FONT_SIZE_BASE,
		marginBottom: 4,
		fontWeight: 600,
		textAlign: "center",
	},
	dcSignatureSpace: { height: 24, marginBottom: 4 },
	dcSignatureLabel: {
		fontSize: FONT_SIZE_SMALL,
		color: "rgba(0,0,0,0.6)",
		textAlign: "center",
		fontWeight: "bold",
	},
	itemsFooterRow: {
		borderTopWidth: 1,
		borderTopColor: "rgba(0,0,0,0)",
		marginTop: 0,
		paddingTop: 0,
		borderBottomWidth: 1,
	},
	itemsFooterCell: { fontWeight: "bold", textTransform: "uppercase" },
	// Summary
	summaryBlock: { width: "100%", marginTop: 0 },
	// Page footer
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

export default DeliveryChallanDocument;
