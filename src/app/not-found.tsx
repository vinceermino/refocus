import Link from 'next/link'

export default function NotFound() {
  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="mt-3 text-muted-foreground">Check the link or room code, or return to your dashboard.</p>
      <Link href="/dashboard" className="mt-6 inline-flex rounded-lg bg-accent-primary px-4 py-3 text-sm font-medium text-primary-foreground">Back to dashboard</Link>
    </main>
  )
}
