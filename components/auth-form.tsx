'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { useLanguage } from '@/lib/i18n/language-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { LanguageSelector } from '@/components/language-selector'
import { CalendarDays } from 'lucide-react'
import { CreateBusinessRequest } from '@/components/create-business-request'

export function AuthForm({
  mode,
  businessSlug,
  businessName,
}: {
  mode: 'sign-in' | 'sign-up'
  businessSlug?: string
  businessName?: string
}) {
  const router = useRouter()
  const { t } = useLanguage()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showBusinessRequest, setShowBusinessRequest] = useState(false)

  const isSignUp = mode === 'sign-up'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = isSignUp
      ? await authClient.signUp.email({ email, password, name, phone })
      : await authClient.signIn.email({ email, password })

    setLoading(false)

    if (error) {
      setError(error.message ?? 'Something went wrong')
      return
    }

    // After sign up, show the business request option
    if (isSignUp) {
      setShowBusinessRequest(true)
      return
    }

    // After sign in, redirect to the business booking page (or home for admin)
    const destination = businessSlug ? `/${businessSlug}/book` : '/'
    router.push(destination)
    router.refresh()
  }

  const signInHref = businessSlug ? `/${businessSlug}/sign-in` : '/sign-in'
  const signUpHref = businessSlug ? `/${businessSlug}/sign-up` : '/sign-up'

  if (showBusinessRequest) {
    return (
      <main className="min-h-svh bg-background flex items-center justify-center px-4">
        <CreateBusinessRequest />
      </main>
    )
  }

  return (
    <main className="min-h-svh bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-sm p-8">
        <div className="absolute top-4 right-4">
          <LanguageSelector />
        </div>
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <CalendarDays className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {isSignUp ? t.auth.createAccount : t.auth.welcomeBack}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {businessName
              ? isSignUp
                ? `Sign up to book with ${businessName}`
                : `Sign in to book with ${businessName}`
              : isSignUp
                ? t.auth.signUpSubtitle
                : t.auth.signInSubtitle}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isSignUp && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">{t.auth.name}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                placeholder={t.auth.namePlaceholder}
              />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">{t.auth.email}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder={t.auth.emailPlaceholder}
            />
          </div>
          {isSignUp && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">{t.admin.phoneOptional}</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                placeholder="+1 555 123 4567"
              />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">{t.auth.password}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              placeholder={t.auth.passwordPlaceholder}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading} className="w-full mt-2">
            {loading
              ? t.auth.pleaseWait
              : isSignUp
                ? t.auth.createAccountBtn
                : t.auth.signInBtn}
          </Button>
        </form>

        <p className="text-sm text-muted-foreground text-center mt-6">
          {isSignUp ? t.auth.alreadyHaveAccount : t.auth.dontHaveAccount}
          <Link
            href={isSignUp ? signInHref : signUpHref}
            className="text-primary font-medium underline-offset-4 hover:underline"
          >
            {isSignUp ? t.auth.signInBtn : t.auth.signUp}
          </Link>
        </p>
      </Card>
    </main>
  )
}
