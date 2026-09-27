# Performance, PWA and fullscreen implementation

Implemented the three tasks together, following the instruction to finish them in one pass. Existing authentication and favicon edits in the working tree were preserved. No deployment, database change or commit was made.

The performance changes reduce downloaded assets and background work. **The requested LCP < 2 seconds and interaction < 150 ms budgets are not met by the measured throttled mobile runs.** CLS meets the requested budget. The numbers below are local lab measurements, not field Core Web Vitals.

## Changes to review

| Area | Files and resulting behavior |
| --- | --- |
| Clock and polling | `src/hooks/use-clock.ts`, `use-local-timer.ts`, `use-realtime-timer.ts`: one shared clock, hidden-page suspension, timestamp-based catch-up, stable end times, abortable/nonoverlapping room polling, stale-response protection and unchanged-snapshot reuse. |
| Rendering | Timer controls, daily goal, room members, notes and analytics use memoized boundaries. Member presence updates every 10 seconds. Notes and room lists use content visibility. Dashboard, analytics and room skeletons share layout-aware components. |
| Loading | Room settings and create/join dialogs load when opened. `user-data-context.ts` separates guest/offline timer reads from the account provider and authentication SDK. Routes retain Next's existing splitting and link prefetch. Existing discovery search already debounces requests by 200 ms; no scroll listener required throttling. |
| Styles and fonts | `preference-bootstrap.tsx`, `theme-assets.ts`, `scripts/prepare-theme-assets.mjs`: select the stored style/minimal preference before paint; load only the selected variant stylesheet initially. WOFF2 fonts are served and preloaded locally. The unused Indie Flower font is removed. |
| Animation | `progress-ring.tsx`, shared CSS and theme CSS: progress uses rotating clipped semicircles, bars use scaleX, and waves use translation. CSS transitions/keyframes use transform/opacity. Continuous decoration uses will-change only while active, with minimal/reduced-motion overrides. |
| Images | Avatars have explicit dimensions, lazy loading and async decoding. Existing decorative SVGs remain vectors. Required install icons are generated as PNGs from the existing sakura/ensō artwork, with safe-area padding. |
| PWA | `pwa-provider.tsx`, `pwa-updates.ts`, `scripts/build-service-worker.mjs`, `src/app/offline/page.tsx`: manifests, installation UI, offline timer and styles, deferred registration, guarded update prompt, versioned asset caching and cleanup. The Install slot is reserved to prevent navigation layout shifts. |
| Fullscreen | `use-timer-fullscreen.ts`, `fullscreen-toggle.tsx`, `fullscreen-chrome.tsx`, personal and room timer integrations: persist `fullscreenOnStart`; request native fullscreen synchronously on Start; retain pause; exit on confirmed stop, completion, failed room start and unmount; synchronize browser exits and announce state changes. Fullscreen has Mincho digits, an Exit button, and animated petals/ink. |

The pause policy is configurable through `useTimerFullscreen(status, complete, { keepOnPause: false })`; the default keeps fullscreen while paused. Existing Stop resets the timer, so there is no separate new Reset control. Unsupported browsers disable the option while keeping the ordinary timer available.

The two serif font files total **89,396 bytes in WOFF2**, down from **359,876 bytes in TTF** on disk (75% smaller). This is not an HTTP transfer comparison: the server also compressed the original TTFs. FontTools verification confirmed identical character maps, glyph order, advance widths and glyph outlines. Original fonts and licenses remain in `src/app/fonts`.

## Caching and updates

`npm run build` prepares theme assets/icons, runs the Next production build, and generates `public/sw.js` from that build's offline HTML and hashed assets. The worker precaches the offline shell, required JS/CSS, local fonts, theme artwork and install icons. The build currently includes 44 precache entries. Generated worker files are ignored by Git because they belong to one specific build. Use the normal build command on deployment and serve over HTTPS (localhost works for testing).

| Request | Policy |
| --- | --- |
| Offline shell and revisioned shell assets | Workbox precache |
| Other same-origin JS, CSS, fonts and theme assets | Stale-while-revalidate with bounded, versioned caches |
| Icons | Precache/cache-first |
| Public manifest data outside a matching precache entry | Network-first |
| All current `/api/` routes, auth, RSC, server actions and private documents | Network only; no persistent private cache |
| Document navigation during a network failure | Serve the anonymous offline timer |

The requested generic API network-first policy was intentionally narrowed: every existing API serves account or room information and uses `private, no-store`. Caching those responses would conflict with sign-out and membership revocation. No offline write queue or account-session replay was added. Offline timer sessions are explicitly labeled as unsaved.

Registration happens after window load, only in production. A waiting worker triggers an update toast. Running and paused timers defer Refresh; accepting an update never automatically reloads another tab. A timer that starts during activation still prevents a reload. Workbox manages precache revisions; activation cleans only this app's older runtime caches. This uses Workbox's [waiting-worker message flow](https://developer.chrome.com/docs/workbox/handling-service-worker-updates).

She and He manifests share the same application ID and scope, so changing style does not create a second app. The selected manifest, browser theme color and Apple icon follow the variant. An OS may retain an already-installed icon/name until it checks the manifest again. iOS receives Add to Home Screen instructions; browsers exposing `beforeinstallprompt` use their native prompt.

## Validation and measurements

- Production build passes, including TypeScript, static offline generation and Workbox output.
- `npm run typecheck` and `npm run lint` pass.
- `npm test`: **85 passing tests**, including new shared-clock, polling, fullscreen-prefix/rejection/cleanup, update race and active-timer protection checks. Existing authentication, authorization, notes, timer-crediting and migration tests still pass.
- Chromium production browser checks pass with no page errors: both styles, preference reloads, native fullscreen/pause/exit/stop/completion, reduced motion, 320/390 px layouts, install event handling, fully offline navigation and timer/style switching, cache exclusions, a genuinely changed worker, update deferral and cache cleanup.
- Font conversion and icon dimensions (180/192/256/384/512) were verified. Screenshots are saved under `artifacts/browser`.

Lighthouse 13.5.0, mobile simulation, local production server, fresh browser profiles with saved variant preferences. The final harness seeds preferences on an inert resource so no service worker can warm the audit accidentally. The initial baseline seeded preferences by first visiting the app; it had no service worker. These are individual samples with different browser priming, so they are directional comparisons rather than controlled medians.

| Metric | He before | He after | She before | She after |
| --- | ---: | ---: | ---: | ---: |
| Performance score | 78 | 76 | 65 | 78 |
| LCP | 3.27 s | 3.31 s | 4.01 s | 3.59 s |
| CLS | 0 | 0 | 0 | 0 |
| Total blocking time | 561 ms | 653 ms | 1,064 ms | 501 ms |
| Transferred assets | 372 kB | 301 kB | 471 kB | 343 kB |

Both final variants score 100 for automated accessibility and best practices. Those scores do not replace manual accessibility testing. He shows no demonstrated LCP/TBT improvement in the final sample; reduced asset size should not be described as meeting the performance budgets.

Scripted timer interactions at 4× CPU slowdown measured maximum event durations of 496 ms (He windowed), 384 ms (She windowed), 560 ms (He fullscreen), and 416 ms (She fullscreen). These include Start and the native fullscreen transition; they exceed the 150 ms target and are **not field INP**. During each 120-frame active-timer sample, median frame intervals were 16.6–16.7 ms, p95 was 16.8–16.9 ms, and no interval exceeded 34 ms. This supports smooth sustained animation on this test machine, not a universal 60 fps guarantee. The remaining lab bottleneck is initial React work and the first timer/fullscreen interaction; the cold-load trace attributes most script time to React's shared bundle.

Physical iOS/Android installation, Safari fullscreen behavior and authenticated multi-user room browser flows were not tested on devices. Room control authorization, timer math and polling races are covered by the automated suite; native fullscreen was exercised with the shared personal timer. No hosted account or production database was used.

## Reproduce

Install the lockfile's dependencies (including dev dependencies for the build tools), then:

```sh
npm run build
npm run start -- -p 3100
```

In a second terminal:

```sh
npm run typecheck
npm run lint
npm test
npm run test:browser
npm run perf
npm run perf:interactions
```

Set `TEST_URL` and `CHROME_PATH` if needed. The browser verification script temporarily changes the generated worker to exercise a real update and restores it in `finally`; run it against the local production server, not a deployed site. Performance scripts should run alone to reduce measurement noise. Reports and screenshots are ignored under `artifacts/`.

Added development packages: `workbox-build@7.4.1` (worker generation), `sharp@0.35.4` (icons), `lighthouse@13.5.0` (audits; its installed Puppeteer dependency drives local browser checks). Existing direct production dependencies and installed production package versions are unchanged.
