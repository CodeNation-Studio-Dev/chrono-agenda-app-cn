"use client"

import Link from "next/link"
import { Calendar, Mail, Globe } from "lucide-react"
import { useLanguage } from "@/lib/i18n/language-context"

export function Footer() {
  const { t } = useLanguage()
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
                <Calendar className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold text-foreground">Chrono</span>
            </div>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">{t.footer.tagline}</p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">{t.footer.companyDesc}</p>
          </div>

          {/* Product links */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">{t.footer.product}</h3>
            <ul className="mt-4 flex flex-col gap-3">
              <li>
                <Link href="/book" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  {t.nav.book}
                </Link>
              </li>
              <li>
                <Link href="/bookings" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  {t.nav.myBookings}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">{t.footer.contact}</h3>
            <ul className="mt-4 flex flex-col gap-3">
              <li>
                <a
                  href="mailto:info@codenation-studio.com"
                  className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Mail className="h-4 w-4" />
                  info@codenation-studio.com
                </a>
              </li>
              <li>
                <a
                  href="https://codenation-studio.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Globe className="h-4 w-4" />
                  codenation-studio.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {year} CodeNation-studio. {t.footer.rights}
          </p>
          <p className="text-sm text-muted-foreground">
            {t.footer.developedBy}{" "}
            <a
              href="https://codenation-studio.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary transition-colors hover:underline"
            >
              CodeNation-studio
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
