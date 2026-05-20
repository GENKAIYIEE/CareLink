# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start development server**: `npm run dev` (or `pnpm dev`, `yarn dev`, `bun dev`)
- **Build for production**: `npm run build`
- **Start production server**: `npm run start`
- **Lint code**: `npm run lint` (uses ESLint)
- **Generate Prisma client**: `npx prisma generate` (runs automatically after install via postinstall script)
- **Prisma Studio**: `npx prisma studio` to view and edit data
- **Database migrations**: 
  - Create: `npx prisma migrate dev --name <migration-name>`
  - Apply to production: `npx prisma migrate deploy`
  - Reset dev database: `npx prisma migrate reset`

## Code Architecture & Structure

### Application Layout
- **App Router**: Uses Next.js 16 App Router (`src/app`)
- **Route Groups**: 
  - `(admin)`: Admin-protected routes (`/app/(admin)/admin/...`)
  - `(senior)`: Senior/user-protected routes (`/app/(senior)/senior/...`)
  - Public routes: `/app/login`, `/app/admin/register`, `/app/page.tsx` (home)
- **Layouts**: 
  - Root layout (`src/app/layout.tsx`) provides base HTML, fonts, and metadata
  - Admin layout: `src/app/(admin)/admin/layout.tsx` (if exists)
  - Senior layout: `src/app/(senior)/layout.tsx`

### Key Directories
- `src/components`: Reusable UI components organized by feature (`admin`, `auth`, `senior`)
- `src/lib`: Utilities, Prisma client wrapper (`src/lib/prisma.ts`), session helpers, password hashing, action utilities
- `src/actions`: Server actions (authentication, admin functions) – note: some actions also in `src/lib/actions`
- `src/app/(admin)/admin/dashboard`: Admin dashboard modules (announcements, claims, distribution, programs, seniors, activity)
- `src/app/(senior)/senior`: Senior portal modules (dashboard, profile, settings, benefits, delegate, announcements)
- `prisma`: Prisma schema (`schema.prisma`), migrations, and generated client
- `public`: Static assets (favicon, images)

### Authentication
- **Admin login**: `/app/login` (email/password) – uses `src/actions/auth/login.ts`
- **Admin registration**: `/app/admin/register` – uses `src/actions/auth/registerAdmin.ts`
- **Senior login**: Likely custom flow via senior session (`src/lib/senior-session.ts`) – check senior routes
- **Protected routes**: Route groups likely use middleware or route guards (check for `middleware.ts` or layout-based protection)

### Styling
- **Tailwind CSS**: Configured via `tailwindcss` and `@tailwindcss/postcss` in devDependencies
- **Global styles**: `src/app/globals.css`
- **Font**: Uses Next.js font optimization with Geist and Geist Mono

### Data Layer
- **ORM**: Prisma ORM with PostgreSQL provider (see `prisma/schema.prisma`)
- **Generated client**: Available at `@/lib/prisma.ts` (wrapper) and `node_modules/@prisma/client`
- **Seeding**: Admin seeding script at `src/scripts/seed-admin.ts`

### Common Patterns
- **Forms**: React Hook Form (`react-hook-form`) with Zod validation (`zod`)
- **Server Actions**: Used for form submissions and mutations (`'use server'`)
- **Client Components**: Marked with `'use client'` directive where needed
- **Charts**: Recharts library (`recharts`) for admin dashboard visuals
- **Animations**: Framer Motion (`framer-motion`)

## Notes
- This project does not currently have a test script configured; consider adding Jest or Vitest for unit/integration tests.
- Environment variables are stored in `.env` (not committed); ensure required variables are set for Supabase/JWT/etc.
- The `.next` directory contains build outputs and should be ignored by version control.