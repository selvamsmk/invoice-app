# Invoice App - Server

Backend API server for the Invoice App built with Elysia, oRPC, and Bun.

## Overview

This is the backend server that powers both the web and desktop applications. It provides:
- Type-safe oRPC API endpoints
- Better-Auth authentication
- SQLite database with Drizzle ORM
- PDF invoice generation
- OpenAPI documentation
- Database migrations and seeding

## Tech Stack

- **Runtime**: Bun (fast JavaScript runtime)
- **Framework**: Elysia (high-performance web framework)
- **RPC**: oRPC with Zod validation
- **Database**: SQLite with Drizzle ORM
- **Authentication**: Better-Auth
- **PDF Generation**: @react-pdf/renderer
- **Migrations**: Drizzle Kit

## Architecture

### API Layers
1. **oRPC Endpoints** (`/rpc/*`) - Type-safe RPC procedures
2. **Auth Endpoints** (`/api/auth/*`) - Better-Auth routes
3. **OpenAPI Reference** (`/api-reference/*`) - Auto-generated API docs
4. **Health Check** (`/health`) - Simple health endpoint

### Database
- SQLite for local development and desktop app
- Migrations in `migrations/` directory
- Seeds for initial data (users, buyers, products, company)

### PDF Generation
- Server-side rendering with React-PDF
- Custom fonts loaded from `FONTS_DIR` or packaged assets
- Invoice templates with Indian GST calculations

## Development

### Prerequisites
- Bun v1.0+
- Node.js (for some tooling)

### Setup

```bash
# Install dependencies
bun install

# Create .env from example
cp .env.example .env

# Edit .env and add your BETTER_AUTH_SECRET
# Generate with: openssl rand -base64 32
```

### Environment Variables

Required:
```env
BETTER_AUTH_SECRET=your-secret-key-minimum-32-characters
BETTER_AUTH_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3001,http://localhost:1420
DATABASE_URL=./data/local.db
ENV=development
SEED=false
```

Optional:
```env
PORT=3000
FONTS_DIR=/custom/path/to/fonts
```

### Running

```bash
# Development mode with hot reload
bun run dev

# Production mode
bun run start
```

Server runs on `http://localhost:3000` by default.

### Database

**Run Migrations:**
Migrations run automatically on server startup.

Manual migration:
```bash
# From repo root
bun run db:migrate
```

**Seed Database:**

1. **Set up seed CSV files:**
   ```bash
   cd src/seed/
   
   # Copy example files
   cp user.csv.example user.csv
   cp company.csv.example company.csv
   cp buyers.csv.example buyers.csv      # If you have sample buyers
   cp products.csv.example products.csv  # If you have sample products
   ```

2. **Edit CSV files with your data:**
   - `user.csv` - Admin user credentials
   - `company.csv` - Your company details
   - `buyers.csv` - Optional sample buyers (for testing)
   - `products.csv` - Optional sample products (for testing)

   ⚠️ **These CSV files contain sensitive information and are excluded from git.**

3. **Enable seeding in `.env`:**
   ```env
   SEED=true
   ```

4. **Start the server** - seeds will run automatically on first launch.

5. **Disable seeding after initial run:**
   ```env
   SEED=false
   ```

⚠️ CSV files are tracked by seed-utils to prevent duplicate inserts.

## Building

### Standard Build
```bash
# TypeScript build (outputs to dist/)
bun run build

# Run built version
bun run start
```

### Compiled Binary (Tauri Sidecar)
```bash
# Build for Tauri desktop app
bun run compile:tauri

# Outputs platform-specific binary:
# - macOS ARM64: server-aarch64-apple-darwin
# - macOS Intel: server-x86_64-apple-darwin
# - Windows: server-x86_64-pc-windows-msvc.exe
# - Linux: server-x86_64-unknown-linux-gnu
```

Binary includes:
- Entire application code
- SQLite database migrations
- Font assets for PDF generation

## API Endpoints

### Health Check
```
GET /health
```

### RPC API
```
POST /rpc/<procedure-name>
```

Available procedures:
- `healthCheck` - Server health
- `listBuyers`, `createBuyer`, `updateBuyer`, `deleteBuyer`, `uploadBuyersCSV`
- `listProducts`, `createProduct`, `updateProduct`, `deleteProduct`, `uploadProductsCSV`
- `getCompany`, `updateCompany`
- `listInvoices`, `getInvoice`, `createInvoice`, `updateInvoice`, `deleteInvoice`, `finalizeInvoice`, `renderPDF`

### Authentication
```
POST /api/auth/sign-in/email
POST /api/auth/sign-up/email
POST /api/auth/sign-out
GET  /api/auth/session
```

### OpenAPI Documentation
```
GET /api-reference
```

Auto-generated documentation for all API endpoints.

## Project Structure

```
apps/server/
├── src/
│   ├── app.ts              # Elysia app setup
│   ├── index.ts            # Entry point
│   ├── migrate.ts          # Migration runner
│   ├── seed/               # Database seeding
│   │   ├── buyers.csv
│   │   ├── products.csv
│   │   ├── create-buyers.ts
│   │   ├── create-products.ts
│   │   ├── create-company.ts
│   │   └── create-user.ts
│   └── utils/
│       └── num-to-words.ts
├── migrations/             # Drizzle migrations
│   ├── *.sql
│   └── meta/
├── scripts/
│   └── build-tauri.ts     # Tauri build script
├── .env                   # Local environment (gitignored)
├── .env.example           # Template
└── package.json
```

## CORS Configuration

The server accepts requests from:
1. **Environment variables**: Origins in `CORS_ORIGIN` (comma-separated)
2. **Hardcoded dev origins**: 
   - `http://localhost:3001` (web dev server)
   - `http://localhost:1420` (Tauri dev)
3. **Tauri protocol**: `tauri://localhost` and variations
4. **Server-to-server**: Requests without `Origin` header

**Production**: Update `CORS_ORIGIN` to your production domains only.

## Security Considerations

### Before Production

1. **Rotate Secret**: Generate new `BETTER_AUTH_SECRET`
   ```bash
   openssl rand -base64 32
   ```

2. **Update URLs**: Change `BETTER_AUTH_URL` to production domain

3. **Restrict CORS**: Set `CORS_ORIGIN` to only allowed domains

4. **Database**: 
   - Use remote database (Turso, PostgreSQL, etc.) instead of local SQLite
   - Never commit database files

5. **Environment**: Set `ENV=production`

6. **HTTPS**: Use TLS certificates for production

### Current Security State
- ⚠️ `.env` excluded from git (create from `.env.example`)
- ⚠️ Hardcoded localhost URLs in code (acceptable for dev)
- ⚠️ Admin seeding creates weak password (change after first login)

## Seeding

### Initial Data
Seeds are applied once and tracked in `app_seeds` table to prevent duplicates.

**Admin User:**
- Email: `admin@example.com`
- Password: `admin123`
- ⚠️ Change password after first login!

**Buyers/Products:**
Loaded from CSV files in `src/seed/`:
- `buyers.csv` - Sample buyer/customer data
- `products.csv` - Sample product catalog

### Custom Seeds
Add new seed files in `src/seed/` and call from `src/index.ts`:
```typescript
import customSeed from "./seed/custom-seed";
await customSeed();
```

## Migrations

**Location**: `migrations/` directory

**Schema Source**: Defined in `packages/db/src/schema/`

**Generate New Migration:**
```bash
# From repo root
bun run db:generate
```

**Apply Migrations:**
Automatic on server startup, or manually:
```bash
bun run db:migrate
```

## Compilation (Tauri Sidecar)

The server can be compiled into a single executable for desktop app distribution.

**Build Script**: `scripts/build-tauri.ts`

**Platform-specific builds:**
```bash
# macOS ARM64 (M1/M2)
bun --compile src/index.ts \
  --target=bun-darwin-arm64 \
  --outfile ../desktop/src-tauri/bin/server-aarch64-apple-darwin

# macOS Intel
bun --compile src/index.ts \
  --target=bun-darwin-x64 \
  --outfile ../desktop/src-tauri/bin/server-x86_64-apple-darwin

# Windows
bun --compile src/index.ts \
  --target=bun-windows-x64 \
  --outfile ../desktop/src-tauri/bin/server-x86_64-pc-windows-msvc.exe

# Linux
bun --compile src/index.ts \
  --target=bun-linux-x64 \
  --outfile ../desktop/src-tauri/bin/server-x86_64-unknown-linux-gnu
```

**Embedded Resources:**
- Migrations copied to `desktop/src-tauri/resources/migrations/`
- Fonts copied to `desktop/src-tauri/resources/fonts/`

## Scripts Reference

```bash
# Development
bun run dev              # Hot reload server
bun run check-types      # TypeScript type checking

# Building
bun run build            # Build to dist/
bun run build:tauri      # Build for Tauri (uncompiled)
bun run compile          # Compile to single binary
bun run compile:tauri    # Compile + copy to Tauri

# Production
bun run start            # Run built version
```

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Database Locked
- Close all connections to database
- Delete `.db-shm` and `.db-wal` files
- Restart server

### Migration Errors
- Check `migrations/meta/_journal.json` for consistency
- Verify database schema matches migration history
- Reset: Delete database file and restart (data loss!)

### CORS Issues
- Check browser console for origin errors
- Verify `CORS_ORIGIN` includes your frontend URL
- Ensure `credentials: 'include'` in frontend fetch

### PDF Generation Fails
- Check `FONTS_DIR` points to valid directory
- Verify fonts exist: OpenSans*.ttf files
- Check logs for font registration errors

## Performance Tips

- Use Bun's native APIs for file operations
- Enable HTTP/2 for production (requires HTTPS)
- Use connection pooling for remote databases
- Cache compiled PDFs for frequently accessed invoices
- Implement rate limiting for public endpoints

## Dependencies

**Core:**
- `elysia` - Web framework
- `@orpc/server` - RPC server
- `better-auth` - Authentication
- `@invoice-app/api` - API layer (workspace)
- `@invoice-app/auth` - Auth config (workspace)
- `@invoice-app/db` - Database layer (workspace)

**Development:**
- `typescript` - Type checking
- `tsdown` - TypeScript bundler
- `@types/bun` - Bun types

## Related Packages

- [packages/api](../../packages/api) - API procedures and types
- [packages/auth](../../packages/auth) - Auth configuration
- [packages/db](../../packages/db) - Database schema
- [apps/web](../web) - Web client
- [apps/desktop](../desktop) - Desktop client

## Resources

- [Bun Documentation](https://bun.sh/docs)
- [Elysia Documentation](https://elysiajs.com/)
- [oRPC Documentation](https://orpc.dev/)
- [Better-Auth Documentation](https://better-auth.com/)
