'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { useLanguage } from '@/lib/i18n/language-context'
import { Button } from '@/components/ui/button'
import { LanguageSelector } from '@/components/language-selector'
import { CalendarDays, LogOut, Settings, Calendar, User } from 'lucide-react'
import type { User as UserType } from '@/lib/db/schema'

interface NavbarProps {
  user: UserType | null
  businessSlug?: string
}


export function Navbar({ user, businessSlug }: NavbarProps) {
  const router = useRouter()
  const { t } = useLanguage()

  const handleSignOut = async () => {
    await authClient.signOut()
    const destination = businessSlug ? `/${businessSlug}/sign-in` : '/sign-in'
    router.push(destination)
    router.refresh()
  }

  return (
    <header className="border-b border-border bg-card">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <CalendarDays className="h-5 w-5 text-primary" />
          </div>
          <span className="font-semibold text-foreground">Chrono</span>
        </Link>

        <nav className="flex items-center gap-2">
          <LanguageSelector />
          {user ? (
            <>
              {user.role === 'admin' ? (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/admin" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span className="hidden sm:inline">{t.nav.admin}</span>
                  </Link>
                </Button>
              ) : (
                <>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={businessSlug ? `/${businessSlug}/book` : '/book'} className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span className="hidden sm:inline">{t.nav.book}</span>
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={businessSlug ? `/${businessSlug}/bookings` : '/bookings'} className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="hidden sm:inline">{t.nav.myBookings}</span>
                    </Link>
                  </Button>
                </>
              )}
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">{t.nav.signOut}</span>
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/sign-in">{t.nav.signIn}</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/sign-up">{t.nav.getStarted}</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
