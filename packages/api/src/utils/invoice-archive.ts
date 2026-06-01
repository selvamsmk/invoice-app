import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

const INVALID_PATH_SEGMENT_REGEX = /[<>:"/\\|?*\x00-\x1F]/g;

const DOCUMENT_TYPE_FILE_LABEL: Record<ArchiveDocumentType, string> = {
	invoice: "INV",
	"stent-invoice": "INV",
	"delivery-challan": "DC",
};

export type ArchiveDocumentType = "invoice" | "stent-invoice" | "delivery-challan";

export type ArchiveRecord = {
	documentId: string;
	documentType: ArchiveDocumentType;
	documentNumber: string;
	buyerName: string;
	documentDate: string;
	existingCanonicalPath?: string | null;
	previousLinkedPaths?: string[];
};

export type ArchiveWriteResult = {
	archiveRoot: string;
	canonicalPath: string;
	linkedPaths: string[];
	fileName: string;
};

export type LinkIntegrityResult = {
	canonicalPath: string;
	linkedPaths: string[];
	inode?: bigint;
	hardLinkCount?: bigint;
	allLinked: boolean;
	missingPaths: string[];
	mismatchedPaths: string[];
};

export type ArchiveOptions = {
	archiveRoot?: string;
};

function sanitizePathSegment(value: string): string {
	const sanitized = value
		.replace(INVALID_PATH_SEGMENT_REGEX, "")
		.replace(/\s+/g, " ")
		.trim();
	return sanitized.length > 0 ? sanitized : "unknown";
}

function sanitizeFilePart(value: string): string {
	return sanitizePathSegment(value).replace(/[\s/\\]+/g, "_");
}

function extractDocumentSequence(documentNumber: string): string {
	const digitGroups = documentNumber.match(/\d+/g) ?? [];
	let bestMatch = "";

	for (const digitGroup of digitGroups) {
		if (digitGroup.length > bestMatch.length) {
			bestMatch = digitGroup;
		}
	}

	return bestMatch || sanitizeFilePart(documentNumber);
}

function parseDate(input: string): Date {
	const parsed = new Date(input);
	if (Number.isNaN(parsed.getTime())) {
		throw new Error(`Invalid document date: ${input}`);
	}
	return parsed;
}

function formatMonthFolder(date: Date): string {
	const monthNumber = String(date.getMonth() + 1).padStart(2, "0");
	const monthName = date.toLocaleString("en-US", { month: "long" });
	return `${monthNumber}-${monthName}`;
}

function formatDatePart(date: Date): string {
	const year = String(date.getFullYear());
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

function resolveArchiveRoot(overrideArchiveRoot?: string): string {
	const configuredRoot = overrideArchiveRoot?.trim() || process.env.INVOICE_ARCHIVE_ROOT?.trim();
	if (configuredRoot) {
		return path.resolve(configuredRoot);
	}
	return path.join(os.homedir(), "Invoices");
}

function buildCanonicalFileName(record: ArchiveRecord): string {
	const documentDate = parseDate(record.documentDate);
	const normalizedBuyerName = sanitizeFilePart(record.buyerName);
	const normalizedNumber = extractDocumentSequence(record.documentNumber);
	const typeLabel = DOCUMENT_TYPE_FILE_LABEL[record.documentType];
	return `${formatDatePart(documentDate)}_${normalizedBuyerName}_${typeLabel}-${normalizedNumber}.pdf`;
}

function getArchivePaths(record: ArchiveRecord, archiveRoot: string, fileName: string) {
	const documentDate = parseDate(record.documentDate);
	const year = String(documentDate.getFullYear());
	const month = formatMonthFolder(documentDate);
	const buyerFolder = sanitizePathSegment(record.buyerName);

	const canonicalPath = path.join(archiveRoot, "All", fileName);
	const byBuyerPath = path.join(
		archiveRoot,
		"By_Buyer",
		buyerFolder,
		year,
		month,
		fileName,
	);
	const byPeriodPath = path.join(
		archiveRoot,
		"By_Period",
		year,
		month,
		fileName,
	);

	return {
		canonicalPath,
		desiredLinkedPaths: [byBuyerPath, byPeriodPath],
	};
}

async function ensureParentDirectory(filePath: string): Promise<void> {
	await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function writeCanonicalPdf(
	canonicalPath: string,
	pdfBuffer: Buffer,
): Promise<{ createdCanonical: boolean; backupPath?: string }> {
	try {
		await fs.access(canonicalPath);
		const backupPath = `${canonicalPath}.bak-${Date.now()}`;
		await fs.copyFile(canonicalPath, backupPath);
		const handle = await fs.open(canonicalPath, "r+");
		try {
			await handle.truncate(0);
			await handle.writeFile(pdfBuffer);
			await handle.sync();
		} finally {
			await handle.close();
		}
		return { createdCanonical: false, backupPath };
	} catch {
		await ensureParentDirectory(canonicalPath);
		const tempPath = `${canonicalPath}.tmp-${Date.now()}`;
		await fs.writeFile(tempPath, pdfBuffer);
		await fs.rename(tempPath, canonicalPath);
		return { createdCanonical: true };
	}
}

async function relocateCanonicalPath(
	fromPath: string,
	toPath: string,
): Promise<void> {
	if (path.resolve(fromPath) === path.resolve(toPath)) {
		return;
	}

	await ensureParentDirectory(toPath);

	try {
		await fs.rename(fromPath, toPath);
		return;
	} catch (error: any) {
		if (error?.code !== "EXDEV") {
			throw error;
		}
	}

	await fs.copyFile(fromPath, toPath);
	await unlinkIfExists(fromPath);
}

async function ensureHardLink(canonicalPath: string, linkPath: string): Promise<boolean> {
	await ensureParentDirectory(linkPath);
	try {
		const [canonicalStat, linkedStat] = await Promise.all([
			fs.stat(canonicalPath, { bigint: true }),
			fs.stat(linkPath, { bigint: true }),
		]);
		if (canonicalStat.ino === linkedStat.ino) {
			return false;
		}
		await fs.unlink(linkPath);
	} catch {
		// Link path does not exist yet.
	}
	await fs.link(canonicalPath, linkPath);
	return true;
}

async function unlinkIfExists(filePath: string): Promise<void> {
	try {
		await fs.unlink(filePath);
	} catch {
		// Ignore if already deleted.
	}
}

export async function archivePdfWithHardLinks(
	record: ArchiveRecord,
	pdfBuffer: Buffer,
	options?: ArchiveOptions,
): Promise<ArchiveWriteResult> {
	const archiveRoot = resolveArchiveRoot(options?.archiveRoot);
	const canonicalFileName = buildCanonicalFileName(record);
	const paths = getArchivePaths(record, archiveRoot, canonicalFileName);
	const canonicalPath = paths.canonicalPath;
	const desiredLinkedPaths = paths.desiredLinkedPaths;
	const previousLinkedPaths = record.previousLinkedPaths ?? [];
	const staleCanonicalPath =
		record.existingCanonicalPath &&
		path.resolve(record.existingCanonicalPath) !== path.resolve(canonicalPath)
			? record.existingCanonicalPath
			: undefined;
	const staleLinkedPaths = previousLinkedPaths.filter(
		(linkPath) => !desiredLinkedPaths.includes(linkPath),
	);

	let createdCanonical = false;
	let backupPath: string | undefined;
	const createdLinks: string[] = [];

	try {
		if (staleCanonicalPath) {
			await relocateCanonicalPath(staleCanonicalPath, canonicalPath);
		}

		const writeResult = await writeCanonicalPdf(canonicalPath, pdfBuffer);
		createdCanonical = writeResult.createdCanonical;
		backupPath = writeResult.backupPath;

		for (const linkPath of desiredLinkedPaths) {
			const linkCreated = await ensureHardLink(canonicalPath, linkPath);
			if (linkCreated) {
				createdLinks.push(linkPath);
			}
		}

		for (const staleLink of staleLinkedPaths) {
			await unlinkIfExists(staleLink);
		}

		if (backupPath) {
			await unlinkIfExists(backupPath);
		}

		return {
			archiveRoot,
			canonicalPath,
			linkedPaths: desiredLinkedPaths,
			fileName: path.basename(canonicalPath),
		};
	} catch (error) {
		for (const createdLinkPath of createdLinks) {
			await unlinkIfExists(createdLinkPath);
		}

		if (backupPath) {
			await fs.copyFile(backupPath, canonicalPath).catch(() => undefined);
			await unlinkIfExists(backupPath);
		} else if (createdCanonical) {
			await unlinkIfExists(canonicalPath);
		}

		throw error;
	}
}

export async function deleteArchivedPdf(
	canonicalPath: string,
	linkedPaths: string[],
): Promise<void> {
	for (const linkPath of linkedPaths) {
		await unlinkIfExists(linkPath);
	}
	await unlinkIfExists(canonicalPath);
}

export async function validateHardLinkIntegrity(
	canonicalPath: string,
	linkedPaths: string[],
): Promise<LinkIntegrityResult> {
	const missingPaths: string[] = [];
	const mismatchedPaths: string[] = [];

	let canonicalStat: Awaited<ReturnType<typeof fs.stat>> | undefined;
	try {
		canonicalStat = await fs.stat(canonicalPath, { bigint: true });
	} catch {
		return {
			canonicalPath,
			linkedPaths,
			allLinked: false,
			missingPaths: [canonicalPath, ...linkedPaths],
			mismatchedPaths,
		};
	}

	for (const linkPath of linkedPaths) {
		try {
			const linkStat = await fs.stat(linkPath, { bigint: true });
			if (linkStat.ino !== canonicalStat.ino) {
				mismatchedPaths.push(linkPath);
			}
		} catch {
			missingPaths.push(linkPath);
		}
	}

	return {
		canonicalPath,
		linkedPaths,
		inode: canonicalStat.ino,
		hardLinkCount: canonicalStat.nlink,
		allLinked: missingPaths.length === 0 && mismatchedPaths.length === 0,
		missingPaths,
		mismatchedPaths,
	};
}

export async function rebuildArchiveViews(
	records: Array<
		ArchiveRecord & {
			canonicalFilePath: string;
		}
	>,
	options?: ArchiveOptions,
): Promise<
	Array<{
		documentId: string;
		documentType: ArchiveDocumentType;
		canonicalFilePath: string;
		linkedPaths: string[];
	}>
> {
	const results: Array<{
		documentId: string;
		documentType: ArchiveDocumentType;
		canonicalFilePath: string;
		linkedPaths: string[];
	}> = [];
	const archiveRoot = resolveArchiveRoot(options?.archiveRoot);

	for (const record of records) {
		const canonicalFileName = path.basename(record.canonicalFilePath);
		const { desiredLinkedPaths } = getArchivePaths(record, archiveRoot, canonicalFileName);

		for (const linkPath of desiredLinkedPaths) {
			await ensureHardLink(record.canonicalFilePath, linkPath);
		}

		results.push({
			documentId: record.documentId,
			documentType: record.documentType,
			canonicalFilePath: record.canonicalFilePath,
			linkedPaths: desiredLinkedPaths,
		});
	}

	return results;
}
