import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
	archivePdfWithHardLinks,
	rebuildArchiveViews,
	validateHardLinkIntegrity,
} from "./invoice-archive";

let tempRoot = "";

async function copyDirectory(
	sourceDir: string,
	destinationDir: string,
): Promise<void> {
	await fs.mkdir(destinationDir, { recursive: true });
	const entries = await fs.readdir(sourceDir, { withFileTypes: true });
	for (const entry of entries) {
		const sourcePath = path.join(sourceDir, entry.name);
		const destinationPath = path.join(destinationDir, entry.name);
		if (entry.isDirectory()) {
			await copyDirectory(sourcePath, destinationPath);
		} else {
			await fs.copyFile(sourcePath, destinationPath);
		}
	}
}

describe("invoice hard-link archive", () => {
	beforeEach(async () => {
		tempRoot = await fs.mkdtemp(
			path.join(os.tmpdir(), "invoice-archive-test-"),
		);
		process.env.INVOICE_ARCHIVE_ROOT = tempRoot;
	});

	afterEach(async () => {
		await fs.rm(tempRoot, { recursive: true, force: true });
		delete process.env.INVOICE_ARCHIVE_ROOT;
	});

	it("creates canonical file with buyer and period hard links", async () => {
		const buffer = Buffer.from("invoice-v1");
		const result = await archivePdfWithHardLinks(
			{
				documentId: "inv-1",
				documentType: "invoice",
				documentNumber: "VMT/INV-101/26-27",
				buyerName: "Acme Hospitals",
				documentDate: "2026-04-27",
			},
			buffer,
		);

		const canonical = await fs.stat(result.canonicalPath, { bigint: true });
		expect(path.basename(result.canonicalPath)).toBe(
			"2026-04-27_Acme_Hospitals_INV-101.pdf",
		);
		expect(result.linkedPaths).toHaveLength(2);

		for (const linkedPath of result.linkedPaths) {
			const linked = await fs.stat(linkedPath, { bigint: true });
			expect(linked.ino).toBe(canonical.ino);
		}
	});

	it("updates canonical content in-place and moves links when buyer/date change", async () => {
		const first = await archivePdfWithHardLinks(
			{
				documentId: "inv-2",
				documentType: "invoice",
				documentNumber: "VMT/INV-102/26-27",
				buyerName: "Buyer One",
				documentDate: "2026-04-27",
			},
			Buffer.from("v1"),
		);

		const originalCanonicalStat = await fs.stat(first.canonicalPath, {
			bigint: true,
		});

		const second = await archivePdfWithHardLinks(
			{
				documentId: "inv-2",
				documentType: "invoice",
				documentNumber: "VMT/INV-102/26-27",
				buyerName: "Buyer Two",
				documentDate: "2026-05-02",
				existingCanonicalPath: first.canonicalPath,
				previousLinkedPaths: first.linkedPaths,
			},
			Buffer.from("v2"),
		);

		const updatedCanonicalStat = await fs.stat(second.canonicalPath, {
			bigint: true,
		});
		expect(updatedCanonicalStat.ino).toBe(originalCanonicalStat.ino);

		const content = await fs.readFile(second.canonicalPath, "utf8");
		expect(content).toBe("v2");

		for (const oldPath of first.linkedPaths) {
			await expect(fs.access(oldPath)).rejects.toThrow();
		}

		for (const newPath of second.linkedPaths) {
			const linked = await fs.stat(newPath, { bigint: true });
			expect(linked.ino).toBe(updatedCanonicalStat.ino);
		}
	});

	it("supports copying monthly folders as independent backups", async () => {
		const result = await archivePdfWithHardLinks(
			{
				documentId: "dc-1",
				documentType: "delivery-challan",
				documentNumber: "VMT/DC-12/26-27",
				buyerName: "Buyer Three",
				documentDate: "2026-04-27",
			},
			Buffer.from("dc-pdf"),
		);

		const periodPath = result.linkedPaths.find((entry) =>
			entry.includes("By_Period"),
		);
		expect(periodPath).toBeTruthy();
		expect(path.basename(result.canonicalPath)).toBe(
			"2026-04-27_Buyer_Three_DC-12.pdf",
		);

		const monthFolder = path.dirname(periodPath!);
		const backupFolder = path.join(tempRoot, "Backups", "2026", "04-April");
		await copyDirectory(monthFolder, backupFolder);

		const backupFile = path.join(backupFolder, path.basename(periodPath!));
		const backupContent = await fs.readFile(backupFile, "utf8");
		expect(backupContent).toBe("dc-pdf");
	});

	it("validates hard-link integrity and reports consistent inode", async () => {
		const result = await archivePdfWithHardLinks(
			{
				documentId: "s-1",
				documentType: "stent-invoice",
				documentNumber: "VMT/INV-205/26-27",
				buyerName: "Cardio Center",
				documentDate: "2026-04-27",
			},
			Buffer.from("stent"),
		);

		const integrity = await validateHardLinkIntegrity(
			result.canonicalPath,
			result.linkedPaths,
		);

		expect(integrity.allLinked).toBe(true);
		expect(integrity.missingPaths).toHaveLength(0);
		expect(integrity.mismatchedPaths).toHaveLength(0);
		expect(Number(integrity.hardLinkCount ?? 0n)).toBeGreaterThanOrEqual(3);
	});

	it("rebuilds missing view links from canonical metadata", async () => {
		const archived = await archivePdfWithHardLinks(
			{
				documentId: "inv-9",
				documentType: "invoice",
				documentNumber: "VMT/INV-999/26-27",
				buyerName: "Rebuild Buyer",
				documentDate: "2026-04-27",
			},
			Buffer.from("rebuild"),
		);

		const removedPath = archived.linkedPaths[0];
		expect(removedPath).toBeDefined();
		if (!removedPath) {
			throw new Error("Expected at least one linked path to remove");
		}
		await fs.unlink(removedPath);

		const before = await validateHardLinkIntegrity(
			archived.canonicalPath,
			archived.linkedPaths,
		);
		expect(before.allLinked).toBe(false);

		const rebuilt = await rebuildArchiveViews([
			{
				documentId: "inv-9",
				documentType: "invoice",
				documentNumber: "VMT/INV-999/26-27",
				buyerName: "Rebuild Buyer",
				documentDate: "2026-04-27",
				canonicalFilePath: archived.canonicalPath,
			},
		]);
		expect(rebuilt).toHaveLength(1);
		const rebuiltItem = rebuilt[0];
		expect(rebuiltItem).toBeDefined();
		if (!rebuiltItem) {
			throw new Error("Expected rebuilt archive record");
		}

		const after = await validateHardLinkIntegrity(
			archived.canonicalPath,
			rebuiltItem.linkedPaths,
		);
		expect(after.allLinked).toBe(true);
	});
});
