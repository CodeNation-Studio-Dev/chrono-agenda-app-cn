'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { useLanguage } from '@/app/context/language-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle2, Mail } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

function VerifyEmailFormContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { t } = useLanguage()
  const token = searchParams.get('token')

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)

  // Auto-verify if token is present
  useEffect(() => {
    if (token && !isVerifying) {
      verifyToken()
    }
  }, [token, isVerifying])

  const verifyToken = async () => {
    if (!token) return

    setIsVerifying(true)
    try {
      const result = await authClient.emailVerification.verifyEmail({
        token,
      })

      if (result.error) {
        setError(t.auth.invalidVerificationToken)
      } else {
        setSuccess(true)
        // Redirect to sign-in after 2 seconds
        setTimeout(() => {
          router.push('/sign-in')
        }, 2000)
      }
    } catch (err) {
      setError(t.auth.invalidVerificationToken)
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResendEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    setError('')

    try {
      // Use sendVerificationEmail if available, otherwise request sign-up again
      const result = await authClient.emailVerification.sendVerificationEmail({
        email,
      })

      if (result.error) {
        setError(t.auth.invalidVerificationToken)
      } else {
        setSuccess(true)
        setEmail('')
      }
    } catch (err) {
      setError(t.auth.invalidVerificationToken)
    } finally {
      setLoading(false)
    }
  }

  if (success && isVerifying) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <Card className="w-full max-w-md border-green-200 dark:border-green-800">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle>{t.auth.emailVerified}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-sm text-slate-600 dark:text-slate-400">
              Redirecting to sign in...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <Card className="w-full max-w-md border-green-200 dark:border-green-800">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle>{t.auth.emailVerified}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-sm text-slate-600 dark:text-slate-400">
              {t.auth.verifyEmailDesc}
            </p>
            <Button onClick={() => router.push('/sign-in')} className="w-full mt-4">
              {t.auth.signInBtn}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Mail className="h-12 w-12 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle>{t.auth.verifyEmail}</CardTitle>
          <CardDescription>{t.auth.verifyEmailDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!token ? (
            <form onSubmit={handleResendEmail} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t.auth.email}
                </label>
                <Input
                  type="email"
                  placeholder={t.auth.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="mt-1"
                  required
                />
              </div>
              <Button disabled={loading} className="w-full" type="submit">
                {loading ? t.auth.pleaseWait : t.auth.resendVerification}
              </Button>
            </form>
          ) : isVerifying ? (
            <div className="text-center py-8">
              <div className="inline-block">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
              </div>
              <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
                Verifying your email...
              </p>
            </div>
          ) : null}

          <Button
            variant="outline"
            onClick={() => router.push('/sign-in')}
            className="w-full"
          >
            {t.auth.signInBtn}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export function VerifyEmailForm() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <VerifyEmailFormContent />
    </Suspense>
  )
}
