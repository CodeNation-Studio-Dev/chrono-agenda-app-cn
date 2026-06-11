'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { useLanguage } from '@/lib/i18n/language-context'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LanguageSelector } from '@/components/language-selector'
import { LogOut, Settings, Calendar, User } from 'lucide-react'
import type { User as UserType } from '@/lib/db/schema'

interface NavbarProps {
  user: UserType | null
  businessSlug?: string
}


export function Navbar({ user, businessSlug }: NavbarProps) {
  const router = useRouter()
  const { t } = useLanguage()

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()

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
            <Image
              src="/icon.jpg"
              alt="Chrono"
              width={20}
              height={20}
              className="h-5 w-5 rounded-sm object-cover"
              priority
            />
          </div>
          <span className="font-semibold text-foreground">Chrono</span>
        </Link>

        <nav className="flex items-center gap-2">
          <LanguageSelector />
          {user ? (
            <>
              {user.role === 'system_manager' ? (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/system-manager" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span className="hidden sm:inline">{t.nav.system}</span>
                  </Link>
                </Button>
              ) : user.role === 'admin' ? (
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

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Avatar className="size-7">
                      <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline max-w-[120px] truncate">{user.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground truncate">{user.name}</span>
                      <span className="text-xs text-muted-foreground truncate">{user.email || t.admin.noEmail}</span>
                      <span className="text-xs text-muted-foreground truncate">{user.phone || t.profile.noPhone}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2 w-full">
                      <User className="h-4 w-4" />
                      {t.nav.profile}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-muted-foreground">
                    <LogOut className="h-4 w-4" />
                    {t.nav.signOut}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
