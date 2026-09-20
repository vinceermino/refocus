'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function ErrorPage({ retry }: { retry: () => void }) {
  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Unable to load this page</h1>
      <p className="mt-3 text-muted-foreground">Check your connection and try again.</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
        <Button onClick={retry}>Try again</Button>
        <Link href="/" className="text-sm text-accent-primary underline underline-offset-4">Back to home</Link>
      </div>
    </main>
  )
}
