# Re-Focus

A personal and shared study timer with focus, rest and stopwatch modes, study analytics, and mathematics roadmaps.

Built with Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Supabase Auth/Realtime and Prisma/PostgreSQL. Inter supplies body typography; Indie Flower supplies the branding.

## Local setup

Configure `.env.local` using `.env.local.example` and your project's values for `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `DATABASE_URL` and `DIRECT_URL`. The database must match `prisma/schema.prisma`.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Installation generates the Prisma client. The guest timer works at `/`; shared rooms and recorded study data use authenticated profiles. Roadmap checklist and accent preferences are stored in the current browser.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run lint` | ESLint and accessibility rules |
| `npm run typecheck` | Strict TypeScript checks |
| `npm test` | Deterministic timer calculation/control regressions |
| `npm run build` | Production compilation and prerendering |
| `npm start` | Serve a production build |

The timer tests use the existing TypeScript compiler and Node test runner, with mocked hooks/clock. Browser focus, responsive layout, auth, session persistence and multi-user Realtime still require integration testing.

## Daily goals and room management

The dashboard has an editable daily focus goal and a goal-based streak. Goals are whole minutes from 1 to 480 (the existing eight-hour recording limit), defaulting to 120 each day. An edit applies only to the current UTC day. Completed focus sessions are credited on the UTC day they are saved, including sessions crossing midnight; breaks do not count. Historical sessions are backfilled with a 120-minute goal. Streaks are derived from daily records: meeting today's goal counts immediately, yesterday's streak remains while today is in progress, and any missed completed day breaks the streak. Raising today's goal can remove today's achievement. No cron or streak freeze is required.

`/discover` searches public room names and tags, with active membership counts based on authenticated heartbeats from the last minute. Reads are uncached and open directories refresh every two seconds. Visibility changes invalidate the directory immediately on the server, and joining from a stale public card rechecks visibility inside the room transaction. Invitation codes are never returned by discovery. Private rooms accept a shared code/direct link; a holder may also submit an approval request. Kicked members can explicitly rejoin with an invitation; banned members cannot join until an owner/admin lifts the ban.

Owners and admins can edit settings, promote/demote members, kick/ban other members (including admins), approve requests, and control timers. Only owners may transfer ownership or delete the room. No one can demote/kick/ban the owner or perform these actions on themselves. An owner must transfer ownership before leaving. Member controls appear in the member list's ellipsis dialog, including pending requests and bans. Transfers and other room mutations serialize under a database row lock.

Room clients read authorized state every two seconds instead of accepting untrusted client timer broadcasts. Membership removal takes effect on the next room read; every server mutation checks current authorization. Room focus time is credited to the timer's starter (including when another admin stops it), matching the app's single-session recording model. Stops are idempotent and capped at the configured duration; deleting a room preserves study records.

### Database setup / upgrade

Migrations are in `prisma/migrations`. Prisma requires a server-only database connection with ownership/bypass-RLS access. App tables have RLS enabled and browser `anon`/`authenticated` Data API privileges revoked; all app data access goes through authenticated Next.js server actions/routes. Supabase Auth remains unchanged.

For a **new, empty database**, configure `DATABASE_URL` and `DIRECT_URL` for the intended database and run:

```sh
npx prisma migrate deploy
npx prisma generate
```

For an **existing installation previously created with `prisma db push`**, first verify its schema matches the original baseline in `prisma/migrations/00000000000000_baseline/migration.sql`. Mark that baseline as already applied, then deploy the feature migration:

```sh
npx prisma migrate resolve --applied 00000000000000_baseline
npx prisma migrate deploy
npx prisma generate
```

Do not run the baseline's CREATE statements against existing tables, or mark the baseline applied on an empty database. Prisma CLI reads `.env`; ensure its database URLs point to the same intended database as the application. The feature migration preserves data and backfills daily records. Apply it before deploying this application version.

`npm test` includes goal/streak boundary cases, server authorization and room/timer regressions, and both fresh/upgrade migration checks against temporary PGlite PostgreSQL instances. No hosted database or authentication credentials are used by these tests. Live multi-user browser behavior still needs a smoke test after migration deployment.

See [UX-AUDIT.md](UX-AUDIT.md) for the prioritized audit, implemented changes and verification limits. Before editing Next.js code, follow `AGENTS.md` and consult the installed guides in `node_modules/next/dist/docs/`.
