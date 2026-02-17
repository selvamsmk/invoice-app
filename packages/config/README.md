# @invoice-app/config

Shared configuration package for the Invoice App monorepo.

## Purpose

This package centralizes common configuration files used across all apps and packages in the monorepo, ensuring consistency and reducing duplication.

## Contents

### `tsconfig.base.json`

Base TypeScript configuration that all packages and apps extend. Provides strict type-checking rules and modern ESNext settings optimized for Bun runtime.

**Key settings:**
- Strict mode enabled with additional safety checks (`noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`)
- Module resolution: bundler
- Target: ESNext
- Bun types included

**Usage:**
```json
{
  "extends": "@invoice-app/config/tsconfig.base.json",
  "compilerOptions": {
    // App-specific overrides
  }
}
```

### `tailwind.css`

Centralized Tailwind CSS configuration and theme variables using the new Tailwind v4 syntax with `@theme` and `@source` directives.

**Features:**
- Design tokens defined with OKLCH color space for better color consistency
- Light and dark mode themes
- Custom CSS variables for shadcn/ui components
- Sidebar, chart, and semantic color tokens
- Sources apps/web, apps/desktop, and packages/app-ui for class scanning

**Consumed by:**
- `apps/web` - Web application
- `apps/desktop` - Tauri desktop application  
- `packages/app-ui` - Shared UI component library

## Installation

This package is private and installed automatically as part of the monorepo workspace.

## Dependencies

- `tailwindcss` - Uses the catalog version defined in `package.json` at the root
