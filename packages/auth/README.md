# @invoice-app/auth

Authentication layer for the Invoice App using Better-Auth.

## Purpose

This package configures and exports the Better-Auth instance used across all apps in the monorepo. It provides type-safe authentication with email/password support, session management, and OAuth capabilities.

## Tech Stack

- **Auth Framework**: Better-Auth
- **Database Adapter**: Drizzle adapter for Better-Auth
- **Database**: SQLite via `@invoice-app/db`
- **Session Storage**: Database-backed sessions with JWT tokens

## Features

- ✅ Email and password authentication
- ✅ Session management with secure HTTP-only cookies
- ✅ Database-backed user accounts and sessions
- ✅ CORS configuration for multiple origins
- ✅ OAuth-ready schema (accounts table)
- ✅ Flexible base URL configuration for multi-app support

## Configuration

The auth instance is configured with:

### Base URL
Defaults to `http://localhost:3000` for development. Override with environment variable:

```env
BETTER_AUTH_URL=https://your-domain.com
```

### Trusted Origins
CORS-enabled origins for authentication requests. Configured via:

```env
CORS_ORIGIN=http://localhost:3001,http://localhost:1420
```

Multiple origins are comma-separated. Defaults to `http://localhost:3000` (server).

### Cookie Settings
- **sameSite**: `lax` - Prevents CSRF attacks while allowing some cross-site navigation
- **secure**: `false` - Allows cookies over HTTP for localhost and Tauri desktop app
- **httpOnly**: `true` - Prevents JavaScript access to cookies, mitigating XSS attacks

## Database Schema

Uses the following tables from `@invoice-app/db`:
- **user** - User accounts (id, name, email, emailVerified, image)
- **session** - Active sessions (id, token, expiresAt, userId, ipAddress, userAgent)
- **account** - OAuth provider accounts (id, accountId, providerId, userId, tokens)
- **verification** - Email verification and password reset tokens

See [packages/db/README.md](../db/README.md) for detailed schema documentation.

## Installation

This package is installed automatically as part of the monorepo workspace.

## Usage

### In Server (Elysia)

```typescript
import { auth } from "@invoice-app/auth";

// Mount Better-Auth routes
app.use("/api/auth/*", ({ request }) =>
  auth.handler(request)
);
```

### In Client (React/Vite)

```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000"
});

// Use hooks
const { data: session, isLoading } = authClient.useSession();
```

### In Desktop App (Tauri)

```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: "http://localhost:3001" // Tauri sidecar server
});
```

## Environment Variables

Required for production:

```env
# Better-Auth base URL (where auth endpoints are hosted)
BETTER_AUTH_URL=https://api.yourdomain.com

# Secret key for signing tokens and cookies (min 32 chars)
BETTER_AUTH_SECRET=your-secret-key-here

# Allowed CORS origins (comma-separated)
CORS_ORIGIN=https://app.yourdomain.com,https://admin.yourdomain.com
```

### Generating a Secret

```bash
# Generate a random 32-byte secret
openssl rand -base64 32
```

## Security Considerations

### Development vs Production

**Development (current config):**
- `secure: false` - allows HTTP cookies for localhost and Tauri
- `baseURL: localhost:3000` - single-origin development

**Production (recommended changes):**
- Set `secure: true` when using HTTPS
- Update `BETTER_AUTH_URL` to production domain
- Rotate `BETTER_AUTH_SECRET` regularly
- Restrict `CORS_ORIGIN` to known domains only

### Important Notes

1. **Never commit** `.env` files with real secrets
2. **Rotate secrets** if they are exposed or compromised
3. **Use HTTPS** in production (`secure: true` for cookies)
4. **Validate CORS origins** - only add trusted domains
5. **Monitor sessions** - implement session invalidation on password change

## API Routes

Better-Auth automatically provides these endpoints:

- `POST /api/auth/sign-in/email` - Email/password sign-in
- `POST /api/auth/sign-up/email` - Create new account
- `POST /api/auth/sign-out` - End session
- `GET /api/auth/session` - Get current session
- `POST /api/auth/forget-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

See [Better-Auth documentation](https://better-auth.com/docs) for complete API reference.

## Type Safety

Better-Auth provides full TypeScript support:

```typescript
import type { Session, User } from "better-auth/types";

// Infer types from auth instance
type AuthSession = typeof auth.$Infer.Session;
```

## Development Tips

- Use Better-Auth's built-in session management - avoid custom JWT implementation
- The Drizzle adapter automatically creates/migrates auth tables
- Session tokens are stored as HTTP-only cookies by default
- Use `authClient.useSession()` hook for reactive session state in React
- Better-Auth handles token refresh automatically

## Dependencies

- `better-auth` - Core authentication framework
- `better-auth/adapters/drizzle` - Drizzle ORM adapter
- `@invoice-app/db` - Database client and schema
- `dotenv` - Environment variable loading
- `zod` - Schema validation (peer dependency of Better-Auth)

## Related Packages

- [@invoice-app/db](../db) - Database schema and client
- [@invoice-app/api](../api) - API routes that use auth context
