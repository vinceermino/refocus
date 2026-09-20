import { AuthForm } from '@/components/auth/auth-form'
import { Timer } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <Timer className="h-6 w-6 text-accent-primary" />
        <span className="font-handwriting font-bold text-2xl">Re-Focus</span>
      </Link>
      <AuthForm mode="login" />
    </main>
  )
}
