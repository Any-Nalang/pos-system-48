# 48 Coffee POS

48 Coffee POS is a web-based point-of-sale and store operations system for **48 Coffee - Ledesma**. It includes a staff-facing checkout workflow and an admin portal for reporting, inventory, menu management, cash logs, and account administration.

Built with [TanStack Start](https://tanstack.com/start), the app runs as a full-stack React application with Better Auth, Prisma, Neon Postgres, realtime updates, thermal receipt printing, and PWA support.

## Product Overview

### Staff portal

- POS checkout with searchable menu, cart, receipt flow, and persisted in-progress cart state
- Payment handling for **Cash**, **GCash**, and **Grab**
- Menu item customization, add-ons, and discounts such as **PWD** and **Senior**
- Orders view with receipt access and realtime updates
- Cash logs for cash in, cash out, and expenses
- X-reading with daily reconciliation, cash counting by denomination, cup sales, and printable receipts
- Inventory access for storefront stock movements and activity logs

### Admin portal

- Dashboard with daily and monthly reporting, payment breakdowns, and printable summaries
- Menu and add-on management
- Inventory management for stockroom and storefront flows
- Cash log management across staff entries
- Account management for admin and staff users
- Order management with filters, editing flows, and cancellation controls

## Core Features

- **Role-based authentication** with Better Auth and guarded admin/staff route areas
- **Realtime order activity** with Pusher-backed updates
- **Thermal receipt printing** for POS and reporting flows
- **PWA support** with a web app manifest, service worker registration, and installable app assets
- **Timezone-aware reporting** using `Asia/Manila` by default, with optional override via `TIMEZONE`
- **Daily inventory rollover** through a protected cron endpoint that calls the Postgres ledger rollover function

## Stack

- [TanStack Start](https://tanstack.com/start) (React, file-based routing)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Better Auth](https://www.better-auth.com/) + [Prisma](https://www.prisma.io/) + [Neon](https://neon.com/)
- [TanStack Query](https://tanstack.com/query), [TanStack Table](https://tanstack.com/table), and [TanStack Form](https://tanstack.com/form)
- [Zustand](https://github.com/pmndrs/zustand) for persisted client state
- [Pusher](https://pusher.com/) for realtime events

## Quick Start

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in the required values:

   ```bash
   cp .env.example .env.local
   ```

3. Set the required environment variables in `.env.local`:

   ```env
   DATABASE_URL=<neon-pooled-url>
   DIRECT_URL=<neon-direct-url>

   BETTER_AUTH_SECRET=<generate via `npx -y @better-auth/cli secret`>
   BETTER_AUTH_URL=http://localhost:3000

   VITE_PUSHER_KEY=<pusher-client-key>
   VITE_PUSHER_CLUSTER=<pusher-cluster>
   PUSHER_APP_ID=<pusher-app-id>
   PUSHER_SECRET=<pusher-secret>

   CRON_SECRET=<shared-secret-for-cron-route>
   TIMEZONE=Asia/Manila
   ```

   Notes:
   - `TIMEZONE` is optional in code and defaults to `Asia/Manila` if omitted.
   - The Prisma and auth scripts in this repo read from `.env.local`, not `.env`.

4. Generate the Prisma client and push the schema:

   ```bash
   npm run db:generate
   npm run db:push
   ```

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | Pooled Neon/Postgres connection used by the app |
| `DIRECT_URL` | Yes | Direct Postgres connection used by Prisma CLI commands |
| `BETTER_AUTH_SECRET` | Yes | Better Auth signing secret |
| `BETTER_AUTH_URL` | Yes | Base URL for Better Auth callbacks and session flows |
| `VITE_PUSHER_KEY` | Yes | Pusher key used by the client and server integration setup |
| `VITE_PUSHER_CLUSTER` | Yes | Pusher cluster used by the client and server integration setup |
| `PUSHER_APP_ID` | Yes | Server-side Pusher app ID |
| `PUSHER_SECRET` | Yes | Server-side Pusher secret |
| `CRON_SECRET` | Yes | Shared secret that protects the inventory rollover cron route |
| `TIMEZONE` | Optional | Reporting timezone override; defaults to `Asia/Manila` |

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start the dev server on port `3000` |
| `npm run build` | Create a production build |
| `npm run start` | Run the production server from `.output/server/index.mjs` |
| `npm run preview` | Preview the Vite build locally |
| `npm run test` | Run the Vitest test suite |
| `npm run db:generate` | Generate the Prisma client using `.env.local` |
| `npm run db:push` | Push the Prisma schema to the database |
| `npm run db:pull` | Pull the database schema into Prisma |
| `npm run db:migrate` | Run Prisma development migrations |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:seed` | Run Prisma seed command if a seed file is present |
| `npm run auth:generate` | Regenerate the Better Auth schema from the auth config |

`db:seed` is wired in `package.json`, but this repository does not currently include a committed `prisma/seed.ts` file.

## Deployment and Operations

### Production runtime

The app builds with TanStack Start + Nitro and can be started with:

```bash
npm run build
npm run start
```

### Vercel cron

`vercel.json` schedules a daily request to:

```text
/api/cron/update-yesterday-stock
```

The route expects the shared `CRON_SECRET` token and executes the Postgres function:

```sql
select roll_inventory_daily_ledger();
```

This keeps the daily inventory ledger in sync for reporting and stock tracking.

## Project Structure

- `src/routes/` — Thin route files for auth, admin, staff, and API route wiring
- `src/features/<domain>/` — Feature-first modules for staff and admin workflows
- `src/integrations/` — Shared integrations such as Prisma, Better Auth, Pusher, Bixolon, TanStack Query, and TanStack Form
- `src/components/ui/` — Reusable UI primitives
- `public/` — PWA assets, icons, service worker, and offline fallback files
- `prisma/` — Prisma schema and SQL helpers

## Development Conventions

- Use `@/` imports for code under `src/`
- Keep route files thin and move business logic into feature modules
- Wire server functions into feature-level `queryOptions.ts` and `mutationOptions.ts`
- Use the shared Prisma client from `@/integrations/prisma/db`
- Use `useAppForm` for app forms and the shared table primitives for data tables

For deeper architecture rules and codebase conventions, see [`AGENTS.md`](./AGENTS.md).
