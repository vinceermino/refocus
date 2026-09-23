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

## Study notes, profiles and minimal mode

Study rooms now include a Notes panel with personal notes by default and an optional **Share with group** checkbox. Notes support add, edit and delete, are shown newest first, and persist in PostgreSQL. Use **Refresh** to fetch other members' latest changes. Both the server and editor enforce nonempty text and a 500-character limit. Only the author can change a note, including when another member is a room owner/admin. Every room note read/write checks current active membership; pending, kicked and banned members have no access.

Avatars and displayed names link to `/profile/:userId`. Here `userId` means the existing application **Profile.id**, the same ID used by room membership, rather than the Supabase auth ID. Existing initial-based avatars are reused. Profiles show the username, join date and a public plain-text note of up to 300 characters. **Edit profile** opens the note/bio editor; username/avatar editing is outside this feature. An empty profile note deletes it. Visitors see read-only profile notes; the server limits editing to the owner. Group activity and recent study notes are restricted to rooms the viewer currently belongs to, even when those rooms are public. Other viewers never see personal notes, private invitation codes or unrelated memberships. A profile shows at most the latest 50 accessible notes. Deleting a room cascades its notes, consistent with the room's existing dependent data.

The header's **Minimal mode** button persists `refocus-minimal-mode` in browser storage, including across tabs. It reduces accent colors and shadows, hides supplementary dashboard stats and decoration, and adds whitespace. The study-room sidebar becomes a simple member section below the timer so profile navigation, membership controls, room settings, daily goals, timers and notes remain accessible. The existing light/dark preference remains independent. Reduced-motion preferences are respected.

API routes (all responses use `private, no-store`):

| Route | Behavior |
| --- | --- |
| `GET /api/group-study/:id/notes` | Own personal notes and shared room notes; requires active membership |
| `POST /api/group-study/:id/notes` | `{ content, visibility?: "personal" \| "group" }`; author comes from auth |
| `PATCH /api/notes/:id` | Update `content` and/or `visibility`; author and active membership required |
| `DELETE /api/notes/:id` | Delete an owned note; active membership required |
| `GET /api/users/:id` | Public profile fields plus activity/notes authorized for the current viewer |
| `PATCH /api/users/:id/profile-note` | `{ profileNote: string }`; owner only; `""` deletes the note |

Apply `20260923000000_notes_profiles` with `npx prisma migrate deploy` **before running this application version against an existing database**, then run `npx prisma generate`. The migration adds a default-empty `profiles.profile_note` column and a `group_study_notes` table with length/visibility constraints, indexes, RLS and revoked browser Data API privileges. No existing rows are removed. The repository tests cover fresh and existing-database upgrades in temporary PGlite instances, note API CRUD/privacy/validation, profile ownership and public visibility, and minimal-mode/profile-link behavior. Hosted migration deployment and live multi-user authentication are separate from these local checks.
