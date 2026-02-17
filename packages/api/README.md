# @invoice-app/api

Type-safe API layer for the Invoice App using oRPC and Elysia.

## Purpose

This package defines the complete API surface for the Invoice App, including:
- Type-safe RPC procedures with Zod validation
- Authentication middleware
- CRUD operations for buyers, products, company, and invoices
- PDF invoice generation with React-PDF
- CSV upload/import capabilities

## Tech Stack

- **RPC Framework**: oRPC with Zod integration
- **Server Framework**: Elysia (runtime agnostic)
- **PDF Generation**: @react-pdf/renderer
- **Validation**: Zod schemas
- **Database**: Drizzle ORM via `@invoice-app/db`
- **Authentication**: Better-Auth via `@invoice-app/auth`

## Architecture

### Context System
All procedures receive an authenticated context with session information:

```typescript
type Context = {
  session: {
    user: { id: string; name: string; email: string } | null;
  };
};
```

### Procedure Types
- **publicProcedure** - No authentication required
- **protectedProcedure** - Requires valid session, throws `UNAUTHORIZED` if missing

### Router Structure

```
appRouter
├── healthCheck (public)
├── privateData (protected)
├── buyersRouter
│   ├── listBuyers
│   ├── createBuyer
│   ├── updateBuyer
│   ├── deleteBuyer
│   └── uploadBuyersCSV
├── productsRouter
│   ├── listProducts
│   ├── createProduct
│   ├── updateProduct
│   ├── deleteProduct
│   └── uploadProductsCSV
├── companyRouter
│   ├── getCompany
│   └── updateCompany
└── invoicesRouter
    ├── listInvoices
    ├── getInvoice
    ├── createInvoice
    ├── updateInvoice
    ├── deleteInvoice
    ├── finalizeInvoice
    └── renderPDF
```

## Key Features

### CSV Import
Both buyers and products support CSV upload with:
- Proper CSV parsing (handles quoted fields with commas)
- Validation against required fields
- Duplicate detection (both in file and existing records)
- Detailed error messages with row numbers
- Batch insert with unique ID generation

**CSV Format - Buyers:**
```csv
name,addressLine1,city,state,pincode
Acme Corp,"123, Main St",Mumbai,Maharashtra,400001
```

**CSV Format - Products:**
```csv
name,defaultRate,hsnCode,gstPercentage
Product A,100.50,1234,18
```

### PDF Invoice Generation
Generates professional PDF invoices with:
- Company logo (SVG embedded)
- Buyer and seller details
- Line items with HSN codes, batch numbers, expiry dates
- Tax calculations (CGST/SGST for intra-state, IGST for inter-state)
- Bank details and payment terms
- Amount in words (Indian numbering system)
- Custom fonts (OpenSans family)

**PDF Customization:**
- Font registration via `FONTS_DIR` environment variable
- Falls back to `assets/fonts` in development
- Supports multiple font weights (400, 500, 600, 700, 800)

### Type Safety
Full end-to-end type safety from server to client:

```typescript
// Server exports types
export type Buyer = typeof buyer.$inferSelect;
export type Product = typeof product.$inferSelect;
export type Invoice = typeof invoice.$inferSelect;
export type AppRouterClient = RouterClient<typeof appRouter>;

// Client imports and uses
import type { AppRouterClient } from "@invoice-app/api";
const client: AppRouterClient = createClient({ ... });
```

## Installation

This package is installed automatically as part of the monorepo workspace.

## Usage

### Server Integration (Elysia)

```typescript
import Elysia from "elysia";
import { appRouter } from "@invoice-app/api/routers";
import { createContext } from "@invoice-app/api/context";

const app = new Elysia()
  .onRequest(async (context) => {
    // Create oRPC context with session
    context.orpcContext = await createContext({ context });
  })
  .post("/api/*", async (context) => {
    // Handle oRPC calls
    const result = await appRouter[procedureName](
      input,
      context.orpcContext
    );
    return result;
  });
```

### Client Usage (React)

```typescript
import { createClient } from "@orpc/client";
import type { AppRouterClient } from "@invoice-app/api";

const client = createClient<AppRouterClient>({
  baseURL: "http://localhost:3000/api",
  fetch: window.fetch,
});

// Type-safe calls
const buyers = await client.listBuyers();
const newBuyer = await client.createBuyer({ 
  name: "Acme Corp",
  addressLine1: "123 Main St",
  city: "Mumbai",
  state: "Maharashtra",
  pincode: "400001"
});
```

### PDF Rendering

```typescript
import { renderInvoicePdf } from "@invoice-app/api/pdf-render";
import type { InvoiceProps } from "@invoice-app/api/pdf-template/invoice-document";

const invoiceData: InvoiceProps = {
  invoiceNumber: "INV-2026-001",
  buyerName: "Acme Corp",
  // ...other fields
};

const pdfBuffer = await renderInvoicePdf(invoiceData, companyData);
// Returns Buffer that can be sent as response or saved to file
```

## Environment Variables

```env
# Font directory for PDF generation (optional)
FONTS_DIR=/path/to/fonts

# Falls back to ./assets/fonts in development
```

## Data Validation

All inputs are validated with Zod schemas:

### Buyer Schema
```typescript
{
  name: z.string().min(1),
  addressLine1: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().regex(/^\d{6}$/), // 6-digit Indian pincode
  gstin: z.string().optional(),
  // ... optional fields
}
```

### Product Schema
```typescript
{
  name: z.string().min(1),
  defaultRate: z.number().positive(),
  hsnCode: z.string().min(1),
  gstPercentage: z.number().min(0).max(100),
}
```

### Invoice Schema
```typescript
{
  invoiceNumber: z.string(),
  invoiceDate: z.string(), // ISO date
  dueDate: z.string().optional(),
  dcDate: z.string().optional(), // Delivery challan date
  dcNumber: z.string().optional(),
  dispatchedThrough: z.string().optional(),
  buyerId: z.string(),
  lineItems: z.array({
    productId: z.string(),
    quantities: z.array({
      quantity: z.number().positive(),
      batchNumber: z.string().optional(),
      expiryDate: z.string().optional(),
    }),
  }),
}
```

## Assets

### Fonts (included)
- OpenSans.ttf (400)
- OpenSans-Medium.ttf (500)
- OpenSans-SemiBold.ttf (600)
- OpenSans-Bold.ttf (700)
- OpenSans-ExtraBold.ttf (800)

**License:** Open Font License (OFL)
Fonts are used for PDF generation only.

## Error Handling

### Standard Errors
```typescript
// Unauthorized access
throw new ORPCError("UNAUTHORIZED");

// Validation errors (automatic from Zod)
// Returns detailed field-level errors

// CSV upload errors
throw new Error("Row 3: pincode must be 6 digits");
throw new Error("Missing required columns: name, city");
```

### CSV Upload Response
```typescript
{
  insertedCount: number,
  insertedNames: string[],
  duplicateNamesInFile?: string[], // Names appearing multiple times
  existingNames?: string[], // Names already in database
}
```

## PDF Utilities

### Number Formatting
```typescript
formatCurrency(10050) // "100.50"
formatCurrencyRupees(10050) // "₹100.50"
formatCurrencyPlain(10050) // "100.50" (no symbols)
```

### Date Formatting
```typescript
formatDate("2026-02-15") // "15-Feb-2026"
formatExpiry("2027-06") // "Jun-2027"
```

### Number to Words
```typescript
numberToWordsINR(150075) // "One Lakh Fifty Thousand Seventy Five Rupees Only"
```

## Development Tips

- All monetary amounts use **paise/cents** (integer values)
- Invoices store buyer/product snapshots for historical accuracy
- Use `finalizeInvoice` to lock an invoice (prevents further edits)
- CSV parser handles quoted fields containing commas
- PDF generation registers fonts on first render (cached thereafter)

## Type Exports

```typescript
// Database record types
export type Buyer = typeof buyer.$inferSelect;
export type Product = typeof product.$inferSelect;
export type Company = typeof company.$inferSelect;
export type Invoice = typeof invoice.$inferSelect;

// Router client type (for frontend)
export type AppRouterClient = RouterClient<typeof appRouter>;

// PDF props
export type { InvoiceProps } from "./pdf-template/invoice-document";
```

## Dependencies

- `@orpc/server` - oRPC server runtime
- `@orpc/client` - oRPC client (peer)
- `@orpc/zod` - Zod integration for oRPC
- `@react-pdf/renderer` - PDF generation
- `react` - Required for React-PDF
- `zod` - Schema validation
- `@invoice-app/db` - Database layer
- `@invoice-app/auth` - Authentication layer

## Related Packages

- [@invoice-app/db](../db) - Database schema and ORM
- [@invoice-app/auth](../auth) - Authentication layer
- [@invoice-app/app-ui](../app-ui) - UI components that consume this API
