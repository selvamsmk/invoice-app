# Invoice App - Desktop (Tauri)

Cross-platform desktop application for Invoice App built with Tauri, React, and TypeScript.

## Overview

This is the desktop distribution of the Invoice App, packaged as a native application using Tauri v2. It includes:
- Native window chrome and system integration
- Embedded sidecar server (Bun-compiled Elysia backend)
- Local SQLite database with migrations
- Offline-first capability
- Auto-update support (configurable)

## Tech Stack

- **Desktop Framework**: Tauri v2 (Rust + WebView)
- **Frontend**: React 19 via `@invoice-app/app-ui`
- **Backend Sidecar**: Bun-compiled server executable
- **Database**: SQLite with embedded migrations
- **Build Tool**: Vite + TypeScript
- **Styling**: TailwindCSS

## Architecture

### Sidecar Server
The app bundles a compiled Bun server as a Tauri sidecar:
- Executable: `src-tauri/bin/server-aarch64-apple-darwin` (macOS ARM64)
- Starts automatically when app launches
- Runs on `http://127.0.0.1:3000`
- Includes SQLite database and migrations in `src-tauri/resources/`

### Frontend
Uses `@invoice-app/app-ui` shared component library with:
- Authentication disabled (local-only app)
- oRPC client pointing to `127.0.0.1:3000`
- Tauri-specific event listeners for sidecar monitoring

### Database
- Local SQLite file managed by sidecar server
- Migrations bundled in `src-tauri/resources/migrations/`
- Applied automatically on first run

## Development

### Prerequisites
- Bun (runtime and package manager)
- Rust and Cargo (for Tauri)
- Node.js (for some build tooling)
- Xcode Command Line Tools (macOS)

### Setup

```bash
# Install dependencies
bun install

# Build the sidecar server
bun run build:server

# Run in development mode
bun run dev
```

Development mode:
- Hot-reloads React frontend
- Sidecar server requires manual restart on changes
- Use `tauri dev` for full Tauri dev experience with window controls

### Environment Variables

Development (`.env`):
```env
TARGET=desktop
VITE_SERVER_URL=http://localhost:3000
VITE_DISABLE_AUTH=true
```

Production (`.env.production`):
```env
VITE_SERVER_URL=http://localhost:3000
VITE_DISABLE_AUTH=true
TARGET=desktop
```

## Building

### Development Build
```bash
# Build frontend only
bun run build

# Build everything (server + frontend + Tauri prep)
bun run build:tauri:prep
```

### Production Build
```bash
# Build native installer (DMG, AppImage, MSI, etc.)
bun tauri build

# Or use the full preparation script first
bun run build:tauri:prep && bun tauri build
```

Build outputs to:
- macOS: `src-tauri/target/release/bundle/dmg/`
- Executable: `src-tauri/target/release/invoice_app`

### Cross-Platform Builds

**Current sidecar binary:** `server-aarch64-apple-darwin` (macOS ARM64 only)

To build for other platforms:
1. Compile server for target platform: `bun --compile src/index.ts --target=bun-<platform>-<arch>`
2. Place binary in `src-tauri/bin/` with appropriate name
3. Update `tauri.conf.json` to include all target sidecars
4. Build with `bun tauri build --target <platform>`

Supported platforms:
- macOS: `aarch64-apple-darwin` (ARM64), `x86_64-apple-darwin` (Intel)
- Windows: `x86_64-pc-windows-msvc`
- Linux: `x86_64-unknown-linux-gnu`

## Project Structure

```
apps/desktop/
├── src/                    # React app source
│   ├── main.tsx           # Entry point
│   ├── orpc.ts            # oRPC client setup
│   └── tauri-debug.ts     # Sidecar event listeners
├── src-tauri/             # Tauri Rust app
│   ├── src/
│   │   ├── main.rs        # Tauri entry point
│   │   └── lib.rs         # Tauri library
│   ├── bin/               # Sidecar executables
│   │   └── server-*       # Compiled server binary
│   ├── resources/         # Bundled resources
│   │   ├── fonts/         # PDF fonts
│   │   └── migrations/    # SQLite migrations
│   ├── icons/             # App icons
│   ├── capabilities/      # Tauri permissions
│   └── tauri.conf.json    # Tauri configuration
├── .env                   # Development environment
├── .env.production        # Production environment
└── vite.config.ts         # Vite configuration
```

## Sidecar Management

### Debug Listeners
The app includes event listeners for sidecar monitoring:
- `sidecar:error` - Critical errors from server
- `sidecar:stdout` - Server logs
- `sidecar:stderr` - Server errors
- `sidecar:terminated` - Server shutdown events

Logs appear in the browser console and as native alerts for critical events.

### Server Lifecycle
- **Start**: Automatic on app launch
- **Stop**: Automatic on app quit
- **Restart**: Requires app restart

## Tauri Configuration

Key settings in `tauri.conf.json`:
- **App Name**: Invoice App
- **Bundle Identifier**: com.invoice.app
- **Window**: 1200x800 default, resizable
- **Security**: CSP configured for localhost server
- **Permissions**: File system, shell (for sidecar)
- **Auto-update**: Configurable endpoints

## Distribution

### macOS
- **DMG**: Drag-and-drop installer
- **Gatekeeper**: Requires code signing for distribution
- **Notarization**: Recommended for public release

### Windows
- **MSI**: Windows Installer package
- **Portable**: Single executable (optional)
- **Code Signing**: Required to avoid SmartScreen warnings

### Linux
- **AppImage**: Universal Linux package
- **deb**: Debian/Ubuntu package
- **rpm**: Fedora/RHEL package

## Environment Configuration

### Build-time Variables
Injected via Vite:
- `VITE_SERVER_URL` - Backend server URL
- `VITE_DISABLE_AUTH` - Disable authentication
- `TARGET` - Build target (desktop)

### Runtime Detection
```typescript
// Detect Tauri environment
const isTauri = !!(window as any).__TAURI__;

// Auth is auto-disabled in Tauri
```

## Troubleshooting

### Sidecar Not Starting
- Check `src-tauri/bin/` has correct executable
- Verify executable permissions: `chmod +x server-*`
- Check logs in console for error events
- Ensure port 3000 is not in use

### Database Errors
- Migrations in `src-tauri/resources/migrations/`
- Database file location logged on server start
- Delete local DB file to reset (will lose data)

### Build Failures
- Ensure Rust toolchain is up to date: `rustup update`
- Clear Cargo cache: `cargo clean`
- Rebuild sidecar: `bun run build:server`
- Check Tauri CLI version: `bunx @tauri-apps/cli --version`

## Security Considerations

### Production Checklist
- [ ] Code sign all binaries (app + sidecar)
- [ ] Notarize macOS app before distribution
- [ ] Use HTTPS for auto-update endpoints
- [ ] Configure CSP appropriately
- [ ] Review Tauri permissions and capabilities
- [ ] Test on clean machines (no dev tools)

### Current State
- ⚠️ `.env` files are excluded from git (create `.env.example` templates)
- ⚠️ Sidecar binary is platform-specific (include build docs for all platforms)
- ⚠️ No code signing configured (required for production)

## Scripts Reference

```bash
# Development
bun run dev              # Start Vite dev server only
bun tauri dev            # Start Tauri in dev mode (full app)

# Building
bun run build            # Build frontend
bun run build:server     # Compile sidecar server
bun run build:tauri:prep # Build everything for Tauri
bun tauri build          # Create native installer

# Utilities
bun run preview          # Preview production build
bun tauri info           # Show system/Tauri info
```

## Dependencies

**Frontend:**
- `@invoice-app/app-ui` - Shared UI components
- `@orpc/client` + `@tanstack/react-query` - Data fetching
- `@tauri-apps/api` - Tauri JavaScript API
- `react` + `react-dom` - UI framework

**Tauri:**
- `@tauri-apps/cli` - Build tooling
- `@tauri-apps/plugin-opener` - System browser integration

**Dev:**
- `@vitejs/plugin-react` - Vite React plugin
- `typescript` - Type checking
- `tailwindcss` - Styling

## Resources

- [Tauri Documentation](https://tauri.app/v2/)
- [Tauri Sidecar Guide](https://tauri.app/v2/guides/sidecar/)
- [Bun Compiler](https://bun.sh/docs/bundler/executables)

## Related Packages

- [apps/server](../server) - Backend server (source for sidecar)
- [apps/web](../web) - Web version of the app
- [packages/app-ui](../../packages/app-ui) - Shared UI library
