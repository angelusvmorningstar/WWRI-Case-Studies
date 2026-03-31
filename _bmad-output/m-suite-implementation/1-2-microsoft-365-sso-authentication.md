# Story 1.2: Microsoft 365 SSO Authentication

Status: ready-for-dev

## Story

As an IE,
I want to access the M Suite using my existing Microsoft 365 account without a separate login,
so that I can start using the app immediately.

## Acceptance Criteria

1. Auth.js v5 authenticates via Microsoft Entra ID transparently (SSO)
2. Only WWRI tenant accounts are accepted (single-tenant restriction)
3. User's name and email are displayed in the nav bar after authentication
4. A User record is created in the database on first login (auto-provisioning)
5. Unauthenticated users are redirected to Microsoft login
6. Access tokens are acquired and refreshed for future Graph API calls
7. All app routes are protected by default (except the auth callback route)

## Tasks / Subtasks

- [ ] Task 1: Configure Auth.js with Microsoft Entra ID provider (AC: #1, #2, #6)
  - [ ] Create `auth.ts` at project root with NextAuth config
  - [ ] Configure MicrosoftEntraID provider with tenant-restricted settings
  - [ ] Implement JWT callback to persist access_token, refresh_token, expiresAt
  - [ ] Implement session callback to expose accessToken to session
  - [ ] Implement token refresh logic for expired access tokens
  - [ ] Create type augmentation file `types/next-auth.d.ts` for custom session fields
  - [ ] Create route handler at `app/api/auth/[...nextauth]/route.ts`

- [ ] Task 2: Create auth middleware for route protection (AC: #5, #7)
  - [ ] Create `middleware.ts` at project root
  - [ ] Protect all routes except `/api/auth/*`, `/_next/*`, static files
  - [ ] Redirect unauthenticated users to Microsoft sign-in
  - [ ] Ensure middleware works with Edge runtime (JWT strategy)

- [ ] Task 3: Auto-provision users on first login (AC: #4)
  - [ ] In the `signIn` callback or `jwt` callback, check if User exists in database by entraId
  - [ ] If not exists, create User record with entraId, name, email, default role IE
  - [ ] If exists, update name/email if changed (profile sync)
  - [ ] Use the Prisma client from `lib/db.ts`

- [ ] Task 4: Update NavBar with authenticated user info (AC: #3)
  - [ ] Modify `components/layout/NavBar.tsx` to display user name from session
  - [ ] Use `auth()` server-side to get session in the layout
  - [ ] Show "Welcome, [Name]" in the nav bar
  - [ ] Pass session to NavBar as a prop (keep NavBar as server component)

- [ ] Task 5: Environment variables and documentation (AC: #1, #2)
  - [ ] Update `.env.local` with correct variable names for Auth.js v5
  - [ ] Generate AUTH_SECRET using `npx auth secret`
  - [ ] Document Azure App Registration steps in a README section or comment
  - [ ] Add `.env.example` with all required auth variables (no secrets)

- [ ] Task 6: Verify build and lint pass (AC: all)
  - [ ] Run `npm run lint` — zero errors
  - [ ] Run `npx tsc --noEmit` — zero type errors
  - [ ] Run `npm run build` — passes
  - [ ] Verify auth flow works with dev server (manual check if DB available)

## Dev Notes

### Previous Story Learnings (from Story 1.1)

- **Prisma 7 adapter pattern**: Use `@prisma/adapter-pg` + `pg.Pool`. Import from `@/app/generated/prisma/client`.
- **Next.js 16 uses Tailwind v4**: CSS-based `@theme inline`, not tailwind.config.ts.
- **Next.js 16 lint strictness**: `<Link>` required instead of `<a>` for internal navigation. React 19 strict hooks rules.
- **Existing files to modify**: `app/layout.tsx`, `components/layout/NavBar.tsx`, `.env.local`

### Auth.js v5 Configuration Pattern

```typescript
// auth.ts
import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
      authorization: {
        params: {
          scope: "openid profile email User.Read",
        },
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, account }) { /* persist tokens */ },
    session({ session, token }) { /* expose accessToken */ },
  },
});
```

### Key Technical Details

- **Provider import**: `next-auth/providers/microsoft-entra-id` (NOT the deprecated `azure-ad`)
- **Callback URL for Azure**: `http://localhost:3000/api/auth/callback/microsoft-entra-id` — must match exactly in Azure App Registration
- **Tenant restriction**: Set `tenantId` to WWRI's specific tenant ID (not "common" or "organizations")
- **Token refresh**: Must implement refresh logic in JWT callback — access tokens expire in ~60-90 minutes
- **AUTH_SECRET**: Required by Auth.js v5. Generate with `npx auth secret` or `openssl rand -base64 33`
- **Edge runtime**: JWT strategy works in Edge middleware. Do NOT use database session strategy.

### Environment Variables

```env
AZURE_AD_CLIENT_ID=       # From Azure App Registration
AZURE_AD_CLIENT_SECRET=   # From Certificates & secrets
AZURE_AD_TENANT_ID=       # WWRI tenant ID (single-tenant)
AUTH_SECRET=              # Generated secret for Auth.js
```

### Azure App Registration Steps (for documentation)

1. Go to Azure Portal → Microsoft Entra ID → App registrations → New registration
2. Name: "M Suite"
3. Supported account types: "Accounts in this organizational directory only" (single tenant)
4. Redirect URI: Web → `http://localhost:3000/api/auth/callback/microsoft-entra-id`
5. After creation: Certificates & secrets → New client secret → copy value
6. API permissions: Add `User.Read` (delegated) — this is added by default
7. Copy: Application (client) ID, Directory (tenant) ID, Client secret value

### Middleware Pattern

```typescript
// middleware.ts
export { auth as middleware } from "@/auth";
export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|ww-logo.jpg).*)"],
};
```

### User Auto-Provisioning

On first sign-in, create a User record:
- `entraId`: from `profile.sub` or `token.sub`
- `name`: from `profile.name`
- `email`: from `profile.email`
- `role`: default `IE`
- Check by `entraId` (unique), not email, for identity matching

### Project Structure Impact

```
m-suite/
├── auth.ts                              # NEW — Auth.js config
├── middleware.ts                         # NEW — Route protection
├── types/
│   └── next-auth.d.ts                   # NEW — Type augmentation
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts             # NEW — Auth route handler
│   ├── layout.tsx                        # MODIFIED — pass session to NavBar
│   └── page.tsx                         # No change
├── components/
│   └── layout/
│       └── NavBar.tsx                   # MODIFIED — show user name
└── .env.local                           # MODIFIED — auth variables
```

### Anti-Patterns to Avoid

- Do NOT use MSAL directly — Auth.js v5 wraps it properly
- Do NOT use database session strategy — use JWT (works in Edge middleware)
- Do NOT hardcode tenant ID — use environment variable
- Do NOT skip token refresh — access tokens expire and Graph API calls will fail
- Do NOT import `auth()` in client components — it's server-only. Use `useSession()` from `next-auth/react` if client-side session is needed (but prefer server components)
- Do NOT forget to add `next-auth` to `serverExternalPackages` in next.config.ts if build fails with crypto module errors

### References

- [Source: planning-artifacts/architecture-m-suite.md#Authentication & Security]
- [Source: planning-artifacts/prd-m-suite.md#Functional Requirements — FR1, FR2]
- [Source: planning-artifacts/ux-design-specification-m-suite.md#Platform Strategy — SSO transparent]
- Auth.js docs: https://authjs.dev/getting-started/providers/microsoft-entra-id

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
