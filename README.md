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

See [UX-AUDIT.md](UX-AUDIT.md) for the prioritized audit, implemented changes and verification limits. Before editing Next.js code, follow `AGENTS.md` and consult the installed guides in `node_modules/next/dist/docs/`.
