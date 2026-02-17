# @invoice-app/app-ui

Shared UI component library and application shell for the Invoice App.

## Purpose

This package provides:
- Reusable React components and UI primitives (shadcn/ui)
- Complete invoice management interface
- Authentication flows (sign-in/sign-up)
- TanStack Router setup with type-safe routing
- TanStack Query integration for data fetching
- Shared application state and context
- Theme support (light/dark mode)

## Tech Stack

- **UI Framework**: React 19
- **Routing**: TanStack Router (file-based, type-safe)
- **Data Fetching**: TanStack Query + oRPC
- **Forms**: TanStack Form with Zod validation
- **Styling**: TailwindCSS + shadcn/ui components
- **Drag & Drop**: fluid-dnd (line items reordering)
- **Notifications**: Sonner (toast notifications)
- **Authentication**: Better-Auth React client
- **Build Tool**: Bun with Tailwind plugin
- **Dev Server**: Bun serve (hot reload)

## Architecture

### Component Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui primitives
│   ├── invoices/       # Invoice-specific components
│   └── [forms/dialogs] # Feature components
├── routes/             # TanStack Router file-based routes
│   ├── __root.tsx      # Root layout with auth check
│   ├── app/            # Protected routes
│   └── [public].tsx    # Public routes
├── hooks/              # Custom React hooks
├── lib/                # Client configuration
├── utils/              # Utilities and helpers
└── orpc/               # oRPC client setup
```

### Key Routes

- `/` - Landing page
- `/login` - Authentication
- `/app/dashboard` - Dashboard overview
- `/app/invoices` - Invoice management (list/create/edit/preview)
- `/app/buyers` - Buyer management
- `/app/products` - Product management
- `/app/my-details` - Company settings

### State Management

Uses TanStack Query for server state:
- Automatic caching and revalidation
- Optimistic updates
- Background refetching
- Error handling with toast notifications

### Authentication

Better-Auth integration with:
- Session-based authentication
- Auto-disable for Tauri desktop app
- Configurable via `VITE_DISABLE_AUTH` env variable
- Protected route wrapper in `__root.tsx`

## Installation

This package is installed automatically as part of the monorepo workspace.

## Usage

### As Standalone Dev Server

```bash
# Development with hot reload
bun run dev

# Production mode
bun run start
```

Server runs on `http://localhost:4173` by default.

### As Library in Apps

**Web App:**
```typescript
import { App } from "@invoice-app/app-ui/App";
import { createAppRouter } from "@invoice-app/app-ui/router";

const router = createAppRouter();
const { queryClient } = createOrpcClient("http://localhost:3000");

root.render(<App router={router} queryClient={queryClient} />);
```

**Desktop App (Tauri):**
```typescript
import { App } from "@invoice-app/app-ui/App";
// Auth automatically disabled when window.__TAURI__ is detected
```

### Building for Production

```bash
# Build with Tailwind plugin
bun run build:internal

# Outputs to dist/ directory
# - index.html
# - index.js (bundled)
# - index.css (with Tailwind)
```

## Environment Variables

```env
# API server URL (defaults to http://127.0.0.1:3000)
VITE_SERVER_URL=http://localhost:3000

# Auth server URL (optional, uses VITE_SERVER_URL if not set)
VITE_AUTH_URL=http://localhost:3000

# Disable authentication (useful for demos)
VITE_DISABLE_AUTH=false
```

## Components

### UI Primitives (shadcn/ui)
- Button, Input, Label, Select, Checkbox
- Dialog, Sheet, Dropdown Menu, Tooltip
- Table, Tabs, Card, Separator
- Toast notifications (Sonner)

### Invoice Components
- **InvoiceList** - Filterable table with search
- **InvoiceRow** - Individual invoice row with actions
- **InvoiceFormShell** - Form wrapper with tabs (create/edit/preview)
- **InvoiceFormFields** - Invoice metadata fields
- **LineItems** - Product line items editor
- **LineItemRow** - Single line item with batch editor
- **BatchEditor** - Batch/expiry date management
- **BuyerSelector** - Searchable buyer dropdown
- **ProductSelector** - Searchable product dropdown
- **InvoicePreview** - PDF preview iframe

### Layout Components
- **AppSidebar** - Main navigation sidebar
- **ThemeProvider** - Dark/light mode support
- **UserMenu** - User dropdown with sign out
- **ModeToggle** - Theme switcher

### Form Components
- **SignInForm** - Email/password sign in
- **SignUpForm** - User registration
- **AddBuyerDialog** - Quick buyer creation
- **AddProductDialog** - Quick product creation

## Custom Hooks

### useInvoices
```typescript
const { invoices, isLoading, createInvoice, updateInvoice, deleteInvoice } = useInvoices();
```

### useBuyersProducts
```typescript
const { buyers, products, isLoading } = useBuyersProducts();
```

### useAppContext
```typescript
const { orpc, queryClient } = useAppContext();
```

### useMobile
```typescript
const isMobile = useMobile();
```

## Utilities

### Number Formatting
```typescript
import { formatCurrency, formatNumber } from "@/lib/formatters";

formatCurrency(10050) // "100.50"
formatNumber(1234567) // "1,234,567"
```

### Number to Words
```typescript
import { numberToWordsINR } from "@/utils/num-to-words";

numberToWordsINR(150075) // "One Lakh Fifty Thousand..."
```

### Class Names
```typescript
import { cn } from "@/lib/utils";

cn("base-class", condition && "conditional-class")
```

## Route Generation

TanStack Router auto-generates route tree from file structure:

```bash
# Generate route tree
bun run generate-routes

# Watch mode (auto-regenerate on file changes)
bun run watch-routes
```

Outputs: `src/routeTree.gen.ts` (committed to git)

## Styling

### Tailwind Configuration
Uses `@invoice-app/config/tailwind.css` with:
- Custom CSS variables for theming
- shadcn/ui color tokens
- Dark mode support (class-based)
- Responsive breakpoints

### Theme Switching
```typescript
import { useTheme } from "next-themes";

const { theme, setTheme } = useTheme();
setTheme("dark"); // or "light", "system"
```

## Type Safety

### Route Types
```typescript
// Auto-generated from routes
import type { RoutePaths } from "@/routeTree.gen";

const path: RoutePaths = "/app/invoices";
```

### API Client Types
```typescript
import type { AppRouterClient } from "@invoice-app/api";
// Full type safety for all API calls
```

## Build Configuration

Custom build script ([build.ts](build.ts)) with:
- Tailwind CSS processing
- Asset optimization
- Sourcemap generation
- Bundle splitting
- Environment variable injection

**Build options:**
```bash
bun run build:internal --minify --sourcemap=external
```

## Development Tips

- Use `<Link>` from TanStack Router (not `<a>`)
- Keep route files lean, extract components
- Use `orpc.useQuery()` for data fetching (auto-caching)
- Avoid `console.log` in production code
- Use Sonner toast for user feedback
- Always validate forms with Zod schemas
- Keep monetary values in paise/cents (integer)

## Common Patterns

### Creating a New Route
1. Create file in `src/routes/` (e.g., `app/settings.tsx`)
2. Run `bun run generate-routes`
3. Export `Route` object with loader/component
4. Add link in sidebar

### Adding a Dialog
```typescript
const [open, setOpen] = useState(false);

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    {/* Form content */}
  </DialogContent>
</Dialog>
```

### Handling Mutations
```typescript
const mutation = orpc.createBuyer.useMutation({
  onSuccess: () => {
    toast.success("Buyer created!");
    queryClient.invalidateQueries(["buyers"]);
  },
  onError: (error) => {
    toast.error(`Error: ${error.message}`);
  },
});
```

## Dependencies

**Core:**
- `react` + `react-dom` - UI library
- `@tanstack/react-router` - Routing
- `@tanstack/react-query` - Data fetching
- `@tanstack/react-form` - Form management
- `@orpc/client` - oRPC client

**UI:**
- `@radix-ui/*` - Unstyled UI primitives
- `lucide-react` - Icon library
- `sonner` - Toast notifications
- `next-themes` - Theme management
- `class-variance-authority` - Component variants
- `tailwind-merge` + `clsx` - Class name utilities

**Workspace:**
- `@invoice-app/api` - API types and client
- `@invoice-app/auth` - Auth integration

## Related Packages

- [@invoice-app/api](../api) - Backend API
- [@invoice-app/auth](../auth) - Authentication
- [@invoice-app/config](../config) - Shared configuration
