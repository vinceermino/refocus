# Re-Focus improvement audit — 24 September 2026

## Existing architecture

- Next.js 16.3.5 App Router with Cache Components, React 19.2.8, strict TypeScript and Tailwind CSS 4. The installed server/client, fetching and navigation guides were consulted before edits.
- Routes: guest timer `/`; `/login`, `/signup`, `/auth/callback`; `/dashboard`, `/dashboard/analytics`, `/discover`, `/room/[code]`, `/profile/[userId]`; authenticated JSON APIs for user data, discovery, room snapshots, notes and profiles.
- The authenticated server layout loads the initial profile, rooms and analytics. A React context shares that snapshot with navigation, timers, daily goals and dashboards; refreshes use `/api/user-data`. No external state library is needed.
- Local state owns timer controls, form drafts, dialog visibility and pending/error feedback. Theme, accent and minimal-mode preferences are shared client preferences. Discovery search and pagination now belong to the URL. Timer calculations, goal progress and room permissions remain derived values.
- Supabase SSR validates authentication; server actions and API handlers check current profile/membership/role. Prisma accesses PostgreSQL on the server. Room snapshots are polled every two seconds; Supabase Realtime presence is a separate existing hook. Browser access to application tables remains restricted by the existing migrations.
- Forms use native controls, validation constraints and local pending/error state. Notes/profiles use `useApiResource`; room/timer writes use server actions. Existing custom Button, Input, Card, Badge, Avatar and native Dialog primitives are retained, with Lucide icons and Sonner feedback.
- Shared layout/route fallbacks, error/404 boundaries, inline alerts, retry actions and offline feedback already exist. Existing room/profile/note authorization, focus recording and UTC goal/streak rules are preserved.

## Prioritized findings and implementation plan

| Priority | Problem and cause | Incremental change | Benefit |
| --- | --- | --- | --- |
| High | Three independent user-data fetch paths can resolve out of order, restore data after sign-out, or overwrite a saved goal. | One typed snapshot, cancellable refresh path, request identity guards, auth invalidation and stats revision protection. | Predictable state across refreshes, mutations and account changes. |
| High | Room analytics transfers every historical timer session to Node to compute ten totals. | Bound SQL aggregation in PostgreSQL with a top-ten limit. Keep grouping by room name and deleted-room history semantics. | Application transfer and aggregation cost no longer grow with session count. |
| Medium | Memberships and analytics, then independent analytics reads, run sequentially. Full room/timer rows are returned unnecessarily. | Parallel independent reads after auth; select consumed fields. | Shorter request dependency chain and smaller response payloads. |
| Medium | `useApiResource` retains previous URL data during navigation. | Associate state with its URL and ignore obsolete callbacks/results. | Consumers immediately hide data from the prior resource. Profile pages already remount by ID; the hook is now safe independently. |
| Medium | Discovery filters/pages are local and disappear on reload/back/share. Results lack query-change feedback. | URL parameters as source of truth, native history navigation and query-owned results with debounced fetching. | Shareable navigation and clear localized loading. |
| Medium | Discovery polls hidden/offline tabs, clears useful results on temporary failures, and shares load/join errors. | Pause polling when unavailable, resume immediately, keep two-second visible cadence, preserve current results on transient failure, expose retry, and isolate join feedback. | Fewer unnecessary requests and stable feedback. |
| Medium | Dashboard totals blur on every refresh; timer glow, decorative motion and many metric cards compete with content. | Keep readable totals, use restrained border/divider sections, consistent headings/radii, remove timer glow and decoration. | Cleaner hierarchy and less distracting background work. |
| Low | Timer modes/presets lack semantic grouping, small buttons vary in height, Rest rooms say Countdown, and empty states lack direct actions. | Labeled control groups, consistent 40px small buttons, correct mode labels and discovery/focus links. | Clearer, more accessible and more consistent controls. |
| Low | Unused glow/slide animation rules and redundant presentation code remain. | Remove unused rules and simplify affected components. | Less code to maintain. |

No new critical issue was established in this scoped audit. These priorities describe observed code paths, not measured production latency or a full security/accessibility certification.

## Implementation boundaries

The existing architecture, routes, APIs, schema, auth policy, storage keys, timer modes and recording rules remain in place. No dependencies were added. The shared provider still owns the server snapshot because several sibling features consume it; its duplicated fetching/state handling was simplified instead of replacing it with a new store. All authenticated database reads remain server-side.

Database aggregation retains same-name room merging, Personal/deleted-room grouping and numeric totals. Equal room totals now have a deterministic alphabetical tie-break. Lifetime daily records are still needed for the longest streak. No hosted database migration or data mutation was performed.

The visual pass covers the guest timer, dashboard, analytics, shared controls, room cards and navigation active states. Existing light/dark accents, minimal mode, visible focus styles, native dialogs and reduced-motion handling are retained. Native form validation and existing CRUD flows remain intact.

## Verification

Baseline: TypeScript passed, 43 tests passed, ESLint had zero errors and one existing `next/no-img-element` warning in the avatar component.

Final checks will be recorded after integration. Focused regressions cover request ordering/auth clearing, URL resource boundaries, discovery lifecycle and real PostgreSQL aggregation in temporary PGlite databases, alongside the existing timer, goal, room authorization, note/profile CRUD/privacy and migration suites.

## Verification limits and follow-up

- The browser tool reported no connected browser and could not open the in-app browser. Live viewport, keyboard/focus, visual rendering and console checks are therefore unavailable in this environment; responsive classes were reviewed statically.
- Temporary PostgreSQL tests and mocks do not establish live Supabase email-confirmation/login/logout behavior. Verify those with configured test accounts before release.
- Shared timers and membership changes still need a two-account integration smoke test with disconnect/reconnect and overlapping actions.
- No production latency claim is made. The improvements are evidenced by reduced payload/query work and regression checks, not a before/after hosted benchmark.
