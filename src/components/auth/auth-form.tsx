'use client'

import { useState } from 'react'
import { unstable_rethrow } from 'next/navigation'
import Link from 'next/link'
import { signUp, signIn } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface AuthFormProps {
  mode: 'login' | 'signup'
}

export function AuthForm({ mode }: AuthFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [genderPref, setGenderPref] = useState('neutral')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    if (mode === 'signup') {
      formData.set('genderPref', genderPref)
    }

    try {
      const result = mode === 'signup' ? await signUp(formData) : await signIn(formData)
      if (result && 'error' in result) setError(result.error)
    } catch (error) {
      unstable_rethrow(error)
      setError('Unable to connect. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <h1 className="text-2xl font-semibold">
          {mode === 'login' ? 'Welcome Back' : 'Join Re-Focus'}
        </h1>
        <CardDescription>
          {mode === 'login' ? 'Sign in to your account' : 'Create an account to start studying'}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit} aria-busy={loading} aria-describedby={error ? "auth-error" : undefined}>
        <CardContent className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label htmlFor="username" className="text-sm font-medium mb-1.5 block">Username</label>
              <Input id="username" name="username" placeholder="Your display name" autoComplete="nickname" required />
            </div>
          )}
          <div>
            <label htmlFor="email" className="text-sm font-medium mb-1.5 block">Email</label>
            <Input id="email" name="email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} placeholder="you@example.com" required />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium mb-1.5 block">Password</label>
            <Input id="password" name="password" type="password" placeholder="••••••••" autoComplete={mode === "signup" ? "new-password" : "current-password"} aria-describedby={mode === "signup" ? "password-hint" : undefined} minLength={6} required />
            {mode === 'signup' && <p id="password-hint" className="mt-1.5 text-xs text-muted-foreground">Use at least 6 characters.</p>}
          </div>

          {mode === 'signup' && (
            <fieldset>
              <legend className="text-sm font-medium mb-2">Choose your style</legend>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'pink', label: '✨ She', desc: 'Pink accent' },
                  { value: 'dark', label: '🌑 He', desc: 'Dark accent' },
                  { value: 'neutral', label: '🌈 Neutral', desc: 'Default accent' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    aria-pressed={genderPref === opt.value}
                    type="button"
                    onClick={() => setGenderPref(opt.value)}
                    className={cn(
                      'flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all text-sm',
                      genderPref === opt.value
                        ? 'border-accent-primary bg-accent-primary/10'
                        : 'border-border hover:border-muted-foreground'
                    )}
                  >
                    <span className="font-medium">{opt.label}</span>
                    <span className="text-xs text-muted-foreground">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </fieldset>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          {error && <p id="auth-error" role="alert" className="w-full rounded-lg border border-timer-danger/30 bg-timer-danger/5 p-3 text-sm text-timer-danger">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            {mode === 'login' ? (
              <>Don&apos;t have an account?{' '}<Link href="/signup" className="text-accent-primary hover:underline">Sign up</Link></>
            ) : (
              <>Already have an account?{' '}<Link href="/login" className="text-accent-primary hover:underline">Sign in</Link></>
            )}
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
