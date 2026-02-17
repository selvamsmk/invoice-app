# @invoice-app/db

Database layer for the Invoice App using Drizzle ORM with SQLite/Turso.

## Purpose

This package defines the database schema, manages migrations, and provides a type-safe database client for all apps and packages in the monorepo.

## Tech Stack

- **ORM**: Drizzle ORM with Bun SQLite driver
- **Database**: SQLite (local development) / Turso (production-ready)
- **Schema Language**: TypeScript with Drizzle's type-safe schema builders
- **Migrations**: Drizzle Kit for schema generation and migrations

## Database Schema

### Core Tables

#### `user` (auth.ts)
User accounts managed by Better-Auth.
- Primary authentication table
- Fields: id, name, email, emailVerified, image, timestamps

#### `session` (auth.ts)
Active user sessions with security tracking.
- Fields: id, token, expiresAt, userId, ipAddress, userAgent, timestamps

#### `account` (auth.ts)
OAuth provider accounts linked to users.
- Fields: id, accountId, providerId, userId, accessToken, refreshToken, timestamps

#### `verification` (auth.ts)
Email verification and password reset tokens.
- Fields: id, identifier, value, expiresAt, timestamps

#### `company` (company.ts)
Seller/company information for invoice generation.
- Business details: name, address, contact info
- Tax info: GSTIN, drug license number
- Banking: account number, IFSC code, bank name, branch
- Branding: logoUrl

#### `buyer` (buyer.ts)
Customer/buyer records.
- Contact details: name, address, phone, email
- Business info: GSTIN, drug license number, state code
- Tracking: totalInvoices counter
- Indexes on GSTIN for quick lookups

#### `product` (product.ts)
Product catalog with pricing and tax information.
- Fields: name, defaultRate, hsnCode, gstPercentage
- Indexes on HSN code and product name

#### `invoice` (invoice.ts)
Invoice master records.
- Invoice metadata: invoiceNumber (unique), invoiceType, status, dates
- Delivery challan: dcDate, dcNumber, dispatchedThrough
- Financial: subtotal, tax, total amounts (stored in paise/cents)
- Buyer snapshot: stores editable buyer details at invoice time
- Flags: isFinalized (prevents editing)
- Indexes on invoice number, buyer ID, status, and date

#### `invoice_line_item` (invoice.ts)
Individual line items for each invoice.
- Product snapshot: productName, hsnCode
- Pricing: rate (in paise), gstPercentage
- Calculated totals: baseAmount, taxAmount, totalAmount
- Display: sortOrder for custom ordering
- Indexes on invoiceId and productId

#### `invoice_quantity` (invoice.ts)
Quantity breakdown for line items (batch/expiry tracking).
- Fields: lineItemId, quantity, batchNumber, expiryDate, manufactureDate
- Display: sortOrder

#### `app_seeds` (app_seeds.ts)
Tracks applied database seeds to prevent duplicate seeding.
- Fields: seedKey (unique), applied flag, appliedAt timestamp, checksum, notes

## Installation & Setup

This package is installed automatically as part of the monorepo workspace.

### Environment Variables

Create a `.env` file in `apps/server/`:

```env
DATABASE_URL=./data/local.db
```

Or use an absolute path:

```env
DATABASE_URL=/absolute/path/to/database.db
```

For Turso (cloud SQLite):

```env
DATABASE_URL=libsql://your-database.turso.io
DATABASE_AUTH_TOKEN=your-auth-token
```

## Available Scripts

Run from repo root or from `packages/db/`:

### Development

```bash
# Start local Turso dev server (SQLite)
bun run db:local

# Open Drizzle Studio (database GUI)
bun run db:studio
```

### Schema Management

```bash
# Generate migrations from schema changes
bun run db:generate

# Push schema changes directly to database (no migrations)
bun run db:push

# Apply pending migrations
bun run db:migrate
```

## Usage

### Import the database client

```typescript
import { db } from "@invoice-app/db";
import { user, invoice, invoiceLineItem } from "@invoice-app/db";

// Query with type safety
const users = await db.select().from(user);

// Insert
await db.insert(invoice).values({
  id: "inv_123",
  invoiceNumber: "INV-2026-001",
  invoiceDate: "2026-02-13",
  buyerId: "buyer_123",
  // ...other fields
});
```

### Using schema types

```typescript
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { invoice } from "@invoice-app/db";

// Type for reading from database
type Invoice = InferSelectModel<typeof invoice>;

// Type for inserting new records
type NewInvoice = InferInsertModel<typeof invoice>;
```

## Key Design Decisions

### Money Storage
All monetary values are stored as **integers in paise/cents** (e.g., ₹100.50 = 10050). This prevents floating-point precision errors in financial calculations.

### Snapshot Pattern
Invoices store a snapshot of buyer and product details at the time of creation. This ensures historical accuracy even if the buyer/product master records change later.

### Soft Schema
Uses `text` fields for dates (ISO 8601 strings) instead of SQLite's native date types for better portability and JSON compatibility.

### Timestamps
All tables include `createdAt` and `updatedAt` timestamps using millisecond precision (`timestamp_ms` mode) for consistency with JavaScript Date objects.

## Migration Workflow

1. **Modify schema** in `src/schema/*.ts`
2. **Generate migration**: `bun run db:generate`
3. **Review migration** in `apps/server/migrations/`
4. **Apply migration**: `bun run db:migrate`

Migrations are stored in `apps/server/migrations/` and should be committed to version control.

## Configuration

See [drizzle.config.ts](drizzle.config.ts) for Drizzle Kit configuration:
- Schema path: `./src/schema`
- Migration output: `../../apps/server/migrations`
- Dialect: SQLite
- Loads `DATABASE_URL` from `apps/server/.env`

## Development Tips

- Use `db:studio` to visually inspect and edit data during development
- Use `db:push` for rapid iteration (skips migrations)
- Use `db:generate` + `db:migrate` for production-safe schema changes
- The database file location is logged on startup: "🗄️ Using DB: /path/to/db"
