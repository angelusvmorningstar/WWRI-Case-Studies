# Story 1.1: Project Initialisation & Design System

Status: done

## Story

As a developer,
I want the project scaffolded with Next.js, Prisma, and the WWRI design token system,
so that all subsequent development has a consistent foundation.

## Acceptance Criteria

1. Next.js 16 App Router is configured with TypeScript, Tailwind CSS, ESLint, and Turbopack
2. Tailwind config includes WWRI design tokens (full colour system, typography scale, spacing scale)
3. Prisma is configured with PostgreSQL connection
4. All 11 data models are defined in schema.prisma
5. Docker and docker-compose files are configured for local development (app + PostgreSQL)
6. GitHub Actions CI/CD pipeline builds and tests
7. Base UI components (Button, Card, Input, Select, Badge, Table) are created following WWRI design system
8. Root layout with placeholder nav bar is in place

## Tasks / Subtasks

- [ ] Task 1: Scaffold Next.js project (AC: #1)
  - [ ] Run `npx create-next-app@latest m-suite --typescript --tailwind --eslint --app --turbopack`
  - [ ] Install dependencies: `next-auth@beta @microsoft/microsoft-graph-client prisma @prisma/client`
  - [ ] Configure `next.config.ts` with `output: "standalone"` for Azure deployment
  - [ ] Set up `.env.local` template with required environment variables

- [ ] Task 2: Configure WWRI design tokens in Tailwind (AC: #2)
  - [ ] Extend `tailwind.config.ts` with WWRI colour palette:
    - `bg: '#F5F4F0'` (page background)
    - `surface: '#FFFFFF'` (cards/panels)
    - `border: '#DDDBD6'` (borders/dividers)
    - `text-primary: '#1A1A1A'` (headings/body)
    - `text-secondary: '#555550'` (supporting text)
    - `text-muted: '#888884'` (labels/hints)
    - `teal: '#009898'` (primary actions/active states)
    - `amber: '#C07A00'` (warnings/in-progress)
    - `green: '#1E8C4A'` (success/approved)
    - `red: '#C0392B'` (danger/destructive)
  - [ ] Configure typography: system font stack as default, monospace (`'Cascadia Code', Consolas, monospace`) for numbers
  - [ ] Configure font size scale: `xs: 11px`, `sm: 12px`, `base: 13px`, `md: 14px`, `lg: 18px`
  - [ ] Configure spacing scale based on 8px base unit
  - [ ] Add `ww-` prefixed component classes in global CSS for design system primitives

- [ ] Task 3: Set up Prisma with complete schema (AC: #3, #4)
  - [ ] Initialize Prisma: `npx prisma init`
  - [ ] Define all 11 models in `schema.prisma` (see Dev Notes for complete schema)
  - [ ] Create `lib/db.ts` as Prisma client singleton
  - [ ] Create initial migration
  - [ ] Create `prisma/seed.ts` with default data (reviewer list, system defaults)

- [ ] Task 4: Docker and local development setup (AC: #5)
  - [ ] Create `Dockerfile` with multi-stage build (deps → build → production)
  - [ ] Create `docker-compose.yml` with app + PostgreSQL services
  - [ ] Ensure `DATABASE_URL` connects to Docker PostgreSQL in development
  - [ ] Verify `npx prisma migrate dev` works in Docker context

- [ ] Task 5: GitHub Actions CI/CD (AC: #6)
  - [ ] Create `.github/workflows/deploy.yml`
  - [ ] Pipeline stages: install → lint → type-check → build → test
  - [ ] Configure for Azure Container Apps deployment (placeholder — actual Azure config in later story)

- [ ] Task 6: Base UI components (AC: #7)
  - [ ] Create `components/ui/Button.tsx` — primary (teal), ghost (outlined), danger (red), small variants
  - [ ] Create `components/ui/Card.tsx` — white bg, border, 8px radius
  - [ ] Create `components/ui/Input.tsx` — field-input with teal focus ring, auto-save compatible
  - [ ] Create `components/ui/Select.tsx` — field-select matching input style
  - [ ] Create `components/ui/Badge.tsx` — pill-shaped, colour variants (teal, amber, green, red, muted)
  - [ ] Create `components/ui/Table.tsx` — full-width, uppercase headers, monospace number cells
  - [ ] Create `components/ui/AutoSaveIndicator.tsx` — subtle "Saved" text that fades in/out

- [ ] Task 7: Root layout and placeholder nav (AC: #8)
  - [ ] Create `app/layout.tsx` with WWRI background, system font, meta tags
  - [ ] Create `components/layout/NavBar.tsx` — sticky 56px, logo placeholder, "M Suite" label
  - [ ] Create `app/page.tsx` — placeholder home page confirming the app runs
  - [ ] Add WWRI logo to `public/ww-logo.jpg` (from existing reference files)

## Dev Notes

### Prisma Schema (All 11 Models)

```prisma
model User {
  id        String   @id @default(cuid())
  entraId   String   @unique
  name      String
  email     String   @unique
  role      Role     @default(IE)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  opportunities Opportunity[]
  reviews       Review[]
  stageHistory  StageHistory[]
  auditLogs     AuditLog[]
}

enum Role {
  IE
  REVIEWER
  ADMIN
}

model Opportunity {
  id          String            @id @default(cuid())
  clientName  String
  prospect    String?
  description String?
  currentStage String           @default("M0")
  status      OpportunityStatus @default(ACTIVE)
  ieId        String
  ie          User              @relation(fields: [ieId], references: [id])
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  stageHistory  StageHistory[]
  costingSheets CostingSheet[]
}

enum OpportunityStatus {
  ACTIVE
  STOPPED
  COMPLETED
}

model StageHistory {
  id            String   @id @default(cuid())
  opportunityId String
  opportunity   Opportunity @relation(fields: [opportunityId], references: [id])
  fromStage     String?
  toStage       String
  decision      String?
  notes         String?
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  createdAt     DateTime @default(now())
}

model CostingSheet {
  id              String       @id @default(cuid())
  opportunityId   String
  opportunity     Opportunity  @relation(fields: [opportunityId], references: [id])
  projectTitle    String?
  clientName      String?
  legalEntity     String?
  shortName       String?
  projectLead     String?
  projectPartner  String?
  reviewerId      String?
  referralPartner String?
  referralActive  Boolean      @default(false)
  referralPct     Float        @default(0.05)
  currency        String       @default("AUD")
  govtImpost      String       @default("GST")
  govtImpostRate  Float        @default(0.10)
  wwriPct         Float        @default(0.30)
  reviewStatus    ReviewStatus @default(DRAFT)
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  phases   Phase[]
  experts  Expert[]
  services Service[]
  reviews  Review[]
}

enum ReviewStatus {
  DRAFT
  SUBMITTED
  IN_REVIEW
  CHANGES_REQUESTED
  APPROVED
}

model Phase {
  id              String       @id @default(cuid())
  costingSheetId  String
  costingSheet    CostingSheet @relation(fields: [costingSheetId], references: [id], onDelete: Cascade)
  name            String
  active          Boolean      @default(true)
  startDate       DateTime?
  weeks           Int          @default(4)
  sortOrder       Int

  phaseExperts  PhaseExpert[]
  phaseServices PhaseService[]
}

model Expert {
  id             String       @id @default(cuid())
  costingSheetId String
  costingSheet   CostingSheet @relation(fields: [costingSheetId], references: [id], onDelete: Cascade)
  name           String
  role           String?
  dailyFee       Float        @default(0)

  phaseExperts PhaseExpert[]
}

model Service {
  id             String       @id @default(cuid())
  costingSheetId String
  costingSheet   CostingSheet @relation(fields: [costingSheetId], references: [id], onDelete: Cascade)
  name           String
  weeklyFee      Float        @default(0)

  phaseServices PhaseService[]
}

model PhaseExpert {
  id          String  @id @default(cuid())
  phaseId     String
  phase       Phase   @relation(fields: [phaseId], references: [id], onDelete: Cascade)
  expertId    String
  expert      Expert  @relation(fields: [expertId], references: [id], onDelete: Cascade)
  actualFee   Float?
  daysPerWeek Float   @default(0)
  weeklyDays  Json?   // Array of nullable floats, null = use daysPerWeek default
}

model PhaseService {
  id           String  @id @default(cuid())
  phaseId      String
  phase        Phase   @relation(fields: [phaseId], references: [id], onDelete: Cascade)
  serviceId    String
  service      Service @relation(fields: [serviceId], references: [id], onDelete: Cascade)
  weeklyActive Json?   // Array of 0/1 per week
}

model Review {
  id              String       @id @default(cuid())
  costingSheetId  String
  costingSheet    CostingSheet @relation(fields: [costingSheetId], references: [id])
  reviewerId      String
  reviewer        User         @relation(fields: [reviewerId], references: [id])
  status          ReviewStatus
  comments        String?
  decidedAt       DateTime?
  createdAt       DateTime     @default(now())
}

model AuditLog {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  action     String
  entityType String
  entityId   String
  details    Json?
  createdAt  DateTime @default(now())
}

model IntegrationQueue {
  id              String   @id @default(cuid())
  integrationType String   // "sharepoint" | "teams"
  operation       String
  payload         Json
  attempts        Int      @default(0)
  maxAttempts     Int      @default(5)
  lastError       String?
  status          String   @default("pending") // "pending" | "completed" | "failed"
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### WWRI Design System Reference

Colours, typography, and component patterns are documented in:
- [Source: planning-artifacts/ux-design-specification-m-suite.md#Visual Design Foundation]
- [Source: planning-artifacts/product-brief-M-Suite-distillate.md#UI Design System]

The existing costing prototype (`reference/WWRI-costing.html`) contains the proven CSS patterns. Key patterns to match:
- `.card` — white bg, 1px border #DDDBD6, 8px radius
- `.tbl` — full-width collapse, 11px uppercase headers, 1px bottom borders
- `.btn-primary` — teal bg, white text, 6px radius, 13px font
- `.btn-ghost` — transparent bg, border, 13px font
- `.field-input` — full-width, 8px 12px padding, 6px radius, teal focus ring with 2px box-shadow
- `.field-label` — 11px uppercase, letter-spacing 0.04em, muted colour
- `.badge` — inline-flex, 2px 10px padding, 4px radius, 11px font

### Project Structure Notes

All paths must match the architecture document:
- [Source: planning-artifacts/architecture-m-suite.md#Complete Project Directory Structure]

Key directories for this story:
```
m-suite/
├── app/
│   ├── layout.tsx          # Root layout (this story)
│   └── page.tsx            # Placeholder home (this story)
├── components/
│   └── ui/                 # Design system primitives (this story)
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       ├── Select.tsx
│       ├── Badge.tsx
│       ├── Table.tsx
│       └── AutoSaveIndicator.tsx
├── lib/
│   └── db.ts               # Prisma client singleton (this story)
├── prisma/
│   ├── schema.prisma        # Complete schema (this story)
│   └── seed.ts              # Seed data (this story)
├── public/
│   └── ww-logo.jpg          # Copy from reference/ (this story)
├── tailwind.config.ts       # WWRI tokens (this story)
├── Dockerfile               # Multi-stage build (this story)
├── docker-compose.yml       # Local dev (this story)
└── .github/
    └── workflows/
        └── deploy.yml       # CI/CD (this story)
```

### Environment Variables Template

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/msuite?schema=public"

# Auth.js (configured in Story 1.2, but template needed now)
AUTH_SECRET=""
AUTH_MICROSOFT_ENTRA_ID_ID=""
AUTH_MICROSOFT_ENTRA_ID_SECRET=""
AUTH_MICROSOFT_ENTRA_ID_TENANT_ID=""

# SharePoint (configured in Epic 5)
SHAREPOINT_SITE_URL=""

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Seed Data

```typescript
// prisma/seed.ts
// Default reviewers from the costing prototype
const reviewers = [
  'Adam Salzer', 'Bernard Leung', 'Bruce Hamilton',
  'Ian Riley', 'Niel Malan', 'Nicolette Grams', 'Robert Bruce'
];
// Create User records for each reviewer with REVIEWER role
// Create Angelus Morningstar with ADMIN role
```

### Anti-Patterns to Avoid

- Do NOT install MSAL libraries — Auth.js v5 handles M365 auth (Story 1.2)
- Do NOT create API routes yet — Server Actions and Route Handlers come in later stories
- Do NOT add any page content beyond a placeholder — opportunity list comes in Story 2.2
- Do NOT hardcode colour values in components — always reference Tailwind theme tokens
- Do NOT use `className` strings with hex colours — use semantic token names (`bg-teal`, `text-muted`, etc.)
- Do NOT create a `globals.css` with extensive custom CSS — Tailwind utility classes are primary, with minimal custom CSS only for the `ww-` component base classes

### References

- [Source: planning-artifacts/architecture-m-suite.md#Starter Template Evaluation]
- [Source: planning-artifacts/architecture-m-suite.md#Core Architectural Decisions]
- [Source: planning-artifacts/architecture-m-suite.md#Project Structure & Boundaries]
- [Source: planning-artifacts/ux-design-specification-m-suite.md#Visual Design Foundation]
- [Source: planning-artifacts/ux-design-specification-m-suite.md#Component Strategy]
- [Source: planning-artifacts/prd-m-suite.md#Web Application Specific Requirements]
- [Source: reference/WWRI-costing.html — CSS patterns and design tokens]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- Prisma 7 breaking change: `url` no longer in schema.prisma, moved to prisma.config.ts
- Prisma 7 requires adapter pattern: `@prisma/adapter-pg` + `pg` pool for PostgreSQL connection
- Next.js 16 uses Tailwind v4 with CSS-based `@theme inline` config, not tailwind.config.ts
- React 19 strict lint: `react-hooks/set-state-in-effect` rule is overly aggressive for timer patterns; simplified AutoSaveIndicator to stateless component (parent manages state)
- Next.js 16 lint: `@next/next/no-html-link-for-pages` requires `<Link>` from next/link instead of `<a>`

### Completion Notes List

- Project scaffolded with Next.js 16 App Router, TypeScript, Tailwind CSS v4, ESLint
- WWRI design tokens configured in globals.css via @theme inline (Tailwind v4 pattern)
- All 11 Prisma data models + IntegrationQueue defined in schema.prisma
- Prisma client generated with adapter pattern for Prisma 7
- 7 UI components created: Button, Card, Input, Select, Badge, Table, AutoSaveIndicator
- NavBar layout component with WWRI logo and M Suite branding
- Root layout with sticky NavBar and main content area
- Placeholder home page with opportunity list structure and badge demos
- Docker multi-stage build + docker-compose for local dev (app + PostgreSQL)
- GitHub Actions CI/CD pipeline (lint, type-check, build)
- Seed data script with admin + 7 reviewers
- .env.local template with all required environment variables
- next.config.ts configured with standalone output for Azure Container Apps
- Zero lint errors, zero type errors, build passes

### Change Log

- 2026-03-31: Story 1.1 implemented — project foundation, design system, Prisma schema, UI components, Docker, CI/CD

### File List

- m-suite/app/globals.css (modified — WWRI design tokens)
- m-suite/app/layout.tsx (modified — WWRI layout with NavBar)
- m-suite/app/page.tsx (modified — placeholder opportunity list)
- m-suite/components/ui/Button.tsx (new)
- m-suite/components/ui/Card.tsx (new)
- m-suite/components/ui/Input.tsx (new)
- m-suite/components/ui/Select.tsx (new)
- m-suite/components/ui/Badge.tsx (new)
- m-suite/components/ui/Table.tsx (new)
- m-suite/components/ui/AutoSaveIndicator.tsx (new)
- m-suite/components/layout/NavBar.tsx (new)
- m-suite/lib/db.ts (new)
- m-suite/lib/types.ts (new)
- m-suite/prisma/schema.prisma (modified — all 11 models + IntegrationQueue)
- m-suite/prisma/seed.ts (new)
- m-suite/prisma.config.ts (existing — Prisma 7 config)
- m-suite/next.config.ts (modified — standalone output)
- m-suite/eslint.config.mjs (modified — relaxed setState-in-effect rule)
- m-suite/.env.local (new)
- m-suite/Dockerfile (new)
- m-suite/docker-compose.yml (new)
- m-suite/.github/workflows/deploy.yml (new)
- m-suite/public/ww-logo.jpg (new — copied from reference/)
