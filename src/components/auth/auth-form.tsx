'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { signUp, signIn } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface AuthFormProps {
  mode: 'login' | 'signup'
}

export function AuthForm({ mode }: AuthFormProps) {
  const [loading, setLoading] = useState(false)
  const [genderPref, setGenderPref] = useState('neutral')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    if (mode === 'signup') {
      formData.set('genderPref', genderPref)
    }

    const result = mode === 'signup' ? await signUp(formData) : await signIn(formData)

    if (result && 'error' in result) {
      toast.error(result.error)
    }
    setLoading(false)
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">
          {mode === 'login' ? 'Welcome Back' : 'Join Re-Focus'}
        </CardTitle>
        <CardDescription>
          {mode === 'login' ? 'Sign in to your account' : 'Create an account to start studying'}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label htmlFor="username" className="text-sm font-medium mb-1.5 block">Username</label>
              <Input id="username" name="username" placeholder="Your display name" required />
            </div>
          )}
          <div>
            <label htmlFor="email" className="text-sm font-medium mb-1.5 block">Email</label>
            <Input id="email" name="email" type="email" placeholder="you@example.com" required />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium mb-1.5 block">Password</label>
            <Input id="password" name="password" type="password" placeholder="••••••••" minLength={6} required />
          </div>

          {mode === 'signup' && (
            <div>
              <label className="text-sm font-medium mb-2 block">Choose your style</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'pink', label: '✨ She', desc: 'Pink accent' },
                  { value: 'dark', label: '🌑 He', desc: 'Dark accent' },
                  { value: 'neutral', label: '🌈 Neutral', desc: 'Default accent' },
                ].map((opt) => (
                  <button
                    key={opt.value}
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
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            {mode === 'login' ? (
              <>Don&apos;t have an account?{' '}<a href="/signup" className="text-accent-primary hover:underline">Sign up</a></>
            ) : (
              <>Already have an account?{' '}<a href="/login" className="text-accent-primary hover:underline">Sign in</a></>
            )}
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
