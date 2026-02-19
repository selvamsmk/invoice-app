# Invoice App

A full-stack invoice management system with web and desktop apps. Built with modern TypeScript tools including React, TanStack Router, Elysia, oRPC, and Tauri.

![Invoice App Demo](./assets/invoice-app-demo.gif)

## Features

### Core Functionality
- 📄 **Invoice Management** - Create, edit, and manage invoices with line items
- 👥 **Buyer Management** - Track customers with CSV bulk import
- 📦 **Product Catalog** - Manage products with CSV bulk import
- 🏢 **Company Details** - Configure business information
- 📊 **PDF Generation** - Professional invoice PDFs with custom fonts
- 🔐 **Authentication** - Secure user accounts with Better-Auth

### Technical Stack
- **TypeScript** - Full type safety across frontend and backend
- **Frontend**: React 19, TanStack Router, TanStack Query, shadcn/ui, TailwindCSS
- **Backend**: Elysia, oRPC (end-to-end type-safe APIs)
- **Database**: SQLite with Drizzle ORM
- **Desktop**: Tauri v2 with Bun server sidecar
- **Runtime**: Bun for blazing-fast performance
- **Monorepo**: Turborepo with shared packages
- **Code Quality**: Biome for linting and formatting

## Getting Started

### Prerequisites
- [Bun](https://bun.sh/) (v1.0+)
- [Rust](https://rustup.rs/) (for desktop app builds only)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/invoice-app.git
   cd invoice-app
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Set up environment variables**
   
   Create `apps/server/.env` from the example:
   ```bash
   cp apps/server/.env.example apps/server/.env
   ```
   
   Generate a secure auth secret:
   ```bash
   openssl rand -base64 32
   ```
   
   Update `BETTER_AUTH_SECRET` in `apps/server/.env` with the generated value.

4. **Set up the database**
   ```bash
   # Start local SQLite database
   cd packages/db && bun run db:local
   
   # Push schema to database
   bun run db:push
   
   # Optional: Seed with sample data
   cd ../../apps/server
   bun run src/seed/create-user.ts
   bun run src/seed/create-company.ts
   bun run src/seed/create-buyers.ts
   bun run src/seed/create-products.ts
   ```

5. **Start development servers**
   ```bash
   # From repo root - starts both web and server
   bun run dev
   ```
   
   - Web app: [http://localhost:5173](http://localhost:5173)
   - API server: [http://localhost:3000](http://localhost:3000)

### Desktop App

To run the desktop app:

```bash
bun run dev:native
```

To build the desktop app:

```bash
bun run build:desktop:mac  # macOS
# Builds are output to apps/desktop/src-tauri/target/release/
```







## Project Structure

```
invoice-app/
├── apps/
│   ├── web/         # Web application (Vite + React)
│   ├── server/      # Backend API (Elysia + oRPC)
│   └── desktop/     # Desktop app (Tauri v2 + sidecar server)
├── packages/
│   ├── app-ui/      # Shared UI components and routes
│   ├── api/         # API routers and business logic
│   ├── auth/        # Better-Auth configuration
│   ├── db/          # Drizzle ORM schema and migrations
│   └── config/      # Shared configs (TypeScript, Tailwind)
├── data/            # SQLite database files (not in git)
└── scripts/         # Build and deployment scripts
```

### Key Packages

- **app-ui**: Shared React components, routes, and hooks used by both web and desktop apps
- **api**: oRPC routers for buyers, products, invoices, company, and PDF generation
- **auth**: Better-Auth setup with email/password authentication
- **db**: Database schema (8 tables) and Drizzle migrations
- **config**: Centralized tsconfig and Tailwind configuration

## Available Scripts

### Development
- `bun run dev` - Start web + server in development mode
- `bun run dev:web` - Start only the web app (port 5173)
- `bun run dev:server` - Start only the backend server (port 3000)
- `bun run dev:native` - Start the desktop app (Tauri)
- `bun run dev:fullstack` - Start server with hot reload

### Build
- `bun run build` - Build all packages and apps
- `bun run build:desktop` - Build desktop app
- `bun run build:desktop:mac` - Build desktop app for macOS

### Database
- `bun run db:push` - Push schema changes to database
- `bun run db:migrate` - Run database migrations
- `bun run db:generate` - Generate new migration from schema
- `bun run db:studio` - Open Drizzle Studio UI
- `cd packages/db && bun run db:local` - Start local SQLite database

### Code Quality
- `bun run check` - Run Biome linting and formatting with auto-fix
- `bun run check-types` - TypeScript type checking across all apps

## Architecture

### Type Safety
- **oRPC** provides end-to-end type safety between frontend and backend
- Server router types are automatically available in client code
- No manual API type definitions needed

### Shared UI Pattern
- Both web and desktop apps consume the `@invoice-app/app-ui` package
- Routes, components, and business logic are shared
- Platform-specific code is minimal (just entry points and build configs)

### Desktop App Design
- Uses Tauri v2 with a **sidecar pattern**
- Bun server is compiled to a standalone binary
- Binary runs as a background process managed by Tauri
- Frontend communicates with localhost server via HTTP
- Cross-platform builds supported (macOS, Windows, Linux)

### Authentication
- Better-Auth with email/password
- Session-based authentication
- Protected routes in TanStack Router
- Automatic token refresh

## Development Workflow

1. Make changes to shared packages (api, db, app-ui, auth)
2. Changes automatically hot-reload in web/desktop apps
3. Run `bun run check` before committing
4. TypeScript errors will show across the monorepo

## Deployment

### Web App
Deploy `apps/web` to any static hosting (Vercel, Netlify, Azure Static Web Apps).

### Server
Deploy `apps/server` to:
- Azure App Service
- Azure Container Instances
- Any Node.js/Bun-compatible host

Ensure environment variables are set in production:
- `BETTER_AUTH_SECRET` (generate with `openssl rand -base64 32`)
- `DATABASE_URL` (path to SQLite file or Turso connection string)

### Desktop App
Build native installers:
```bash
bun run build:desktop:mac  # macOS
```

Distribute the `.app` or `.dmg` from `apps/desktop/src-tauri/target/release/bundle/`.

## Contributing

This is a portfolio project. Feel free to use it as a reference or starting point for your own projects.

## License

MIT
