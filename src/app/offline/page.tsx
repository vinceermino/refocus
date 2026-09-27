/* eslint-disable @next/next/no-html-link-for-pages -- A document navigation must retry the network after the SW fallback; an RSC navigation cannot do that. */
import { PersonalTimer } from '@/components/timer/personal-timer'
import { StyleSelector } from '@/components/layout/style-selector'
import { MinimalModeToggle } from '@/components/layout/minimal-mode-toggle'

export const metadata = { title: 'Quiet focus · ReFocus', robots: { index: false, follow: false } }

export default function OfflinePage() {
  return <div className="landing-shell min-h-screen bg-background">
    <nav aria-label="Offline navigation" className="app-navbar flex min-h-16 items-center justify-between gap-3 border-b border-border px-4">
      <a href="/" className="font-handwriting text-2xl">Re-Focus</a>
      <div className="flex items-center gap-2"><MinimalModeToggle /><StyleSelector /></div>
    </nav>
    <main id="main-content" tabIndex={-1} className="mx-auto flex max-w-4xl flex-col items-center gap-8 px-4 py-10">
      <div className="max-w-md text-center">
        <h1 className="font-handwriting text-4xl">A quiet moment, anywhere.</h1>
        <p className="mt-3 text-sm text-muted-foreground">You can keep focusing here without a connection. This timer stays on this device; offline sessions aren’t saved to your account.</p>
        <a href="/" className="mt-4 inline-flex min-h-10 items-center rounded-lg border border-border px-4 text-sm">Try reconnecting</a>
      </div>
      <PersonalTimer />
    </main>
  </div>
}
