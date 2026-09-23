# Re-Focus UX/UI review

This is a historical audit. The roadmap pages, checklist and navigation have since been removed. Minimal mode now also hides helper copy and uses shorter labels and prompts; see README.md for current behavior.

## 1. Codebase Analysis

- TypeScript (strict), React 19.2.8, Next.js 16.3.5 App Router; npm/package-lock.json. Next dev/build use Turbopack; PostCSS compiles Tailwind 4. Cache Components are enabled. Local Next guides were reviewed before implementation.
- Routes: guest personal timer `/`; `/login`, `/signup`, `/auth/callback`; `/dashboard`, `/dashboard/analytics`, `/room/[code]`; `/roadmap` and `/roadmap/[track]/[id]`. Shared app layout supplies navigation and user data.
- React state/context handles UI, themes, and user data. Server components seed the user-data context; fetch refreshes `/api/user-data`. Server actions handle authentication, room membership/settings and timer sessions. Supabase SSR handles auth/cookies, Realtime broadcasts timers and presence; Prisma queries PostgreSQL. Roadmap checklists and accent preference use localStorage.
- Custom Button/Input/Card/Badge/Dialog/Avatar primitives, Lucide icons, Sonner toasts, next-themes. Inter body font and Indie Flower branding (README incorrectly says Geist). Tailwind spacing uses its standard scale, chiefly 4/8/12/16/24/32px. CSS variables define light/dark surfaces, neutral/pink/slate accents and timer statuses. No Figma reference or additional design system found.
- Main flows: solo focus/stopwatch, sign in/up, create/join a shared room, control owner timer, inspect participants and analytics, select a mathematics track and mark topic familiarity.
- Commands: `npm ci` (postinstall generates Prisma client), `npm run dev`, `npm run lint`, `npm run build`, `npm start`. Initially no test/typecheck scripts or test suite; TypeScript can run with `npx tsc --noEmit`.
- Baseline: existing server at localhost:3000 returns HTTP 200. Lint: 12 errors/18 warnings. Typecheck: 3 personal-timer incompatibilities. Existing uncommitted room/timer/schema changes are preserved. Browser automation reports no connected browsers/apps, so visual/interactive verification is unavailable.

## 2. UX/UI Audit

| Priority | Location | Problem and impact | Suggested fix |
| --- | --- | --- | --- |
| Critical | `src/components/ui/dialog.tsx` | No dialog semantics, focus containment/restoration, Escape handling or named close control; keyboard users can operate the obscured page. | Native modal dialog with labelled title, focus management, scroll bounds and close control. |
| Critical | `src/components/roadmap/topic-checklist.tsx` | Click-only list items cannot be checked by keyboard and expose no checked state. | Native labelled checkboxes, keep the existing storage keys. |
| High | `src/components/timer/timer-display.tsx`, `personal-timer.tsx`, `timer-controls.tsx` | Fixed 320px dial plus 64px padding exceeds small screens; controls cannot wrap. Rest submits zero duration; personal timer types reject Rest. | Fluid dial/container, wrapping controls, preserve selected Rest duration and align local types. |
| High | `src/components/room/room-settings-modal.tsx` | Save stays disabled for duration-only changes; labels are unbound and number bounds are not enforced by a form. | Include durations in dirty state; labelled inputs and native form validation. |
| High | `src/app/globals.css`, `src/components/ui/button.tsx` | White text on light dark-mode accents and bright pink fails contrast; primary-foreground token is undefined; status text too light in light mode. | Semantic accent foreground token, darker light-mode accents/status colors, visible focus and reduced-motion support. |
| High | `src/components/layout/navbar.tsx` | Mobile links lose their names; no current-page indicator; accent dropdown lacks dismissal/focus behavior. | Named, sufficiently sized navigation and current-page state; accessible accent dialog. |
| High | `src/components/auth/auth-form.tsx`, room create/join dialogs | Toast-only errors disappear; thrown requests leave submit buttons busy. | Persistent inline alerts, pending cleanup, autocomplete and clear hints. |
| High | user-data provider, dashboard, analytics | Failed fetch looks like empty data; analytics can show a skeleton forever. | Expose failure state with retry/sign-in recovery; retain previously loaded data on refresh failure. |
| Medium | dashboard, room cards, analytics, roadmap | Headers/cards crowd narrow screens and long names; gradient headings lose contrast; link-wrapped buttons produce nested controls. | Stack/wrap at small sizes, allow text wrapping, solid headings and single semantic links. |
| Medium | root/app layouts and auth pages | Missing skip link/main targets and page headings; no application error/404 recovery. | Add landmarks and recoverable error/not-found views. |
| Medium | roadmap copy and checklist | Claims automatic unlocking although stages are static; local progress persistence is unexplained and storage failures can break interaction. | Accurate explanatory copy and guarded storage reads/writes. |
| Medium | shared room actions | Some action failures are silent; clipboard success appears before the write completes. | Explicit failure feedback and await clipboard completion. |
| Low | analytics/roadmap badges | Charts use small labels, stage status is static, remaining hard-coded colors need a wider contrast pass. | Accessible chart summary and future token cleanup; clarify whether stage progress should be derived. |
| Low | README, scripts | Scaffold README and no automated interaction suite make maintenance harder. | Document actual setup and add targeted browser coverage when a browser/test environment is available. |

## 3. Implementation Plan

1. Repair shared accessibility and theme primitives.
2. Fix mobile layouts, navigation and checklists without changing routes or storage keys.
3. Add form/data recovery and repair duration controls while preserving API/schema contracts.
4. Run lint, typecheck, build and HTTP checks; record baseline issues and verification limits separately.

## 4. Changes Made

- Replaced the custom overlay with a native modal dialog: named title/close control, Escape dismissal, background inertness, focus restoration and bounded scrolling. Native behavior follows [MDN dialog guidance](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog); live browser verification remains outstanding.
- Added semantic accent foreground colors, darker light-mode text/status tokens, shared focus styles, reduced-motion support and larger mobile input text. Updated buttons, presets and status badges to use these tokens.
- Named mobile navigation, marked active destinations and reused the modal for accent selection. Added skip links, main landmarks, auth headings and loading announcements.
- Made timer dials fluid, allowed controls/cards/headers to wrap, simplified low-contrast gradient headings and removed nested back-link buttons.
- Converted roadmap rows to native labelled checkboxes. Kept storage keys and added guarded storage with an in-memory fallback. Corrected the unsupported roadmap-unlocking claim.
- Added persistent auth/create/join/settings errors, pending cleanup, autocomplete/hints and an offline notice. Data failures now expose retry/sign-in recovery; dashboard retries retain the personal timer.
- Fixed duration-only Save, native duration validation and Rest start parameters. Aligned personal-timer types and excluded Rest from study logging, consistent with shared Rest sessions. The clock now uses an external subscription, retaining elapsed-time calculations and daily caps.
- Added application error/404 recovery; retained Next internal prerender/redirect signals through `unstable_rethrow` as documented by the installed framework.
- Preserved Supabase API payloads, routes, database schema and existing user edits. Realtime channel storage now uses a ref. Removed unused imports and fixed two pre-existing `prefer-const` errors.
- Added `npm run typecheck`, `npm test` and five deterministic timer regression tests using existing dependencies.

## 5. Verification Results

- Production build: passed; 27 pages generated. The earlier prerender warning disappeared after preserving the framework's internal exception.
- Typecheck: passed after correcting the three baseline personal-timer errors.
- Timer tests: 5 passed. Covers focus/rest elapsed time, pause/reset, completion, stopwatch cap, stale clock ticks and Start duration forwarding. React hooks/clock are mocked; these tests do not verify browser events or Realtime behavior.
- Lint: passed with 0 errors and 1 existing avatar image-optimization warning (baseline: 12 errors, 18 warnings).
- HTTP smoke checks on a production server: home, login, signup, dashboard, analytics, roadmap and a roadmap stage returned 200; unknown page returned 404; unauthenticated data API returned 401. Stage HTML contains 59 native checkboxes and a single main target. Authenticated data and room interaction are unverified; streamed room responses are not evidence of successful access.
- Token contrast calculations: all six light/dark + accent combinations pass 4.5:1 for primary button labels, accent/muted text and timer status text against base/card surfaces. Lowest checked ratio: 4.71:1; button labels range from 5.98:1 to 7.58:1. This is not a full WCAG audit of every composited surface, chart or interactive state.
- Responsive sizing reviewed statically for 320px widths: timer SVG/container scale to available width, presets wrap, dashboard header stacks and cards wrap metadata. No live viewport, zoom, keyboard, screen-reader or multi-user test was possible because computer-use found no connected browser/app.
- `git diff --check`: passed. No new dependencies or database mutations.

## 6. Remaining Recommendations

- Confirm email-verification onboarding with the project's Supabase auth settings.
- Review server-side room authorization and private-room join policy separately: UI owner controls alone are not authorization. No auth policy/schema changes are part of this visual/accessibility pass.
- Test shared timers, reconnects and session recording with two authenticated test accounts.
- Run device, zoom, screen-reader and full palette contrast checks before claiming WCAG conformance.
