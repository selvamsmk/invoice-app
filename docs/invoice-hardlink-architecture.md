# Offline Invoice Filesystem Architecture (Hard-Link Based)

## Goals

- Keep exactly one canonical PDF per document in `Invoices/All`.
- Expose multiple folder views with hard links (`By_Buyer`, `By_Period`).
- Treat PDF download as an archive sync event.
- Keep archive metadata in SQLite for integrity checks and rebuild.

## Canonical Layout

Archive root is resolved from `INVOICE_ARCHIVE_ROOT` (desktop sets this to `Documents/Invoices`).

- `Invoices/All/{canonical}.pdf` (single source of truth)
- `Invoices/By_Buyer/{Buyer}/{Year}/{Month}/{canonical}.pdf` (hard link)
- `Invoices/By_Period/{Year}/{Month}/{canonical}.pdf` (hard link)

No document-type subfolders are created under `All`.

## Naming

Canonical files are deterministic and sanitized:

- invoice: `VMT_INV_{normalized-number}.pdf`
- stent invoice: `VMT_SINV_{normalized-number}.pdf`
- delivery challan: `VMT_DC_{normalized-number}.pdf`

Normalization removes invalid filesystem characters and converts separators/whitespace to `_`.

## Trigger Behavior

### Create/Update on Download

When user clicks Download:

1. Server renders PDF.
2. UI still downloads from returned base64 (existing UX preserved).
3. If `archiveOnRender: true`, server:
   - upserts canonical PDF in `All`
   - upserts hard links in `By_Buyer` and `By_Period`
   - updates SQLite metadata row

### Update Strategy (Hard-link Safe)

For existing canonical files, content is replaced in-place:

- open canonical with `r+`
- truncate to 0
- write new bytes

This preserves inode and keeps all hard links valid.

## Metadata Model

Table: `invoice_document_archive`

- `document_id`
- `document_type`
- `document_number`
- `buyer_name`
- `document_date`
- `canonical_file_path`
- `linked_paths` (JSON array)
- `last_updated_at`

Use-cases:

- integrity checks
- stale-link cleanup on edits (buyer/date changes)
- rebuild view folders after manual damage

## Delete Behavior

Delete flow removes:

1. all link paths
2. canonical file
3. metadata row

`All` remains source of truth while record exists.

## Rebuild Utility

RPC: `rebuildArchiveViews`

- Reads all metadata rows.
- Re-creates expected `By_Buyer` and `By_Period` links from canonical files.
- Persists refreshed `linked_paths`.

## Integrity Utility

RPC: `checkArchiveIntegrity`

- Validates each linked path exists.
- Validates all links point to canonical inode.
- Returns missing/mismatched paths and hard-link count.

## Rollback and Failure Handling

Archive write operation is guarded by rollback:

- Existing canonical file is backed up before overwrite.
- Newly created links are tracked.
- On failure:
  - newly created links are removed
  - canonical is restored from backup (or removed if it was new)

## Edge Cases

- Filename collisions: normalized names are deterministic and safe.
- Buyer rename/date change: stale links are removed and new folder links are created.
- Month/year move on edit: metadata-driven stale link cleanup handles this.
- Cross-volume: hard links are only created inside archive root, avoiding cross-device link errors.
- Link-count validation: integrity API returns `nlink` from canonical stat.

## Rust Service Layer Integration

Desktop Rust sidecar launcher now injects:

- `INVOICE_ARCHIVE_ROOT` = `Documents/Invoices` (fallback `app_data_dir/Invoices`)

This keeps archive path deterministic per user profile while filesystem operations stay in Bun service code.
