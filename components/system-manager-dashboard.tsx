'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { setBusinessDisabledState, setBusinessMembershipPaid } from '@/app/actions/system-manager'
import { useLanguage } from '@/lib/i18n/language-context'
import { Building2, ShieldCheck, ShieldX, CreditCard, Users } from 'lucide-react'
import type { Business, User } from '@/lib/db/schema'

interface SystemBusinessRow {
  business: Business
  owner: User
}

interface SystemManagerDashboardProps {
  businesses: SystemBusinessRow[]
  admins: User[]
  adminBusinessCounts: Record<string, number>
}

function formatDate(value: Date | string | null) {
  if (!value) return 'N/A'
  const date = value instanceof Date ? value : new Date(value)
  return date.toLocaleDateString()
}

function getTrialMeta(trialEndsAt: Date | string | null) {
  if (!trialEndsAt) {
    return { isTrial: false, isExpired: false, daysLeft: null as number | null }
  }
  const end = trialEndsAt instanceof Date ? trialEndsAt.getTime() : new Date(trialEndsAt).getTime()
  const now = Date.now()
  if (Number.isNaN(end)) {
    return { isTrial: true, isExpired: true, daysLeft: 0 }
  }
  const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24))
  return {
    isTrial: true,
    isExpired: end < now,
    daysLeft,
  }
}

export function SystemManagerDashboard({
  businesses,
  admins,
  adminBusinessCounts,
}: SystemManagerDashboardProps) {
  const router = useRouter()
  const { t } = useLanguage()
  const [pendingBusinessId, setPendingBusinessId] = useState<number | null>(null)
  const [disableReasons, setDisableReasons] = useState<Record<number, string>>({})

  const handleMembershipToggle = async (business: Business) => {
    setPendingBusinessId(business.id)
    try {
      await setBusinessMembershipPaid(business.id, !business.membershipPaid)
      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : t.systemManager.failedMembership)
    } finally {
      setPendingBusinessId(null)
    }
  }

  const handleDisableToggle = async (business: Business) => {
    setPendingBusinessId(business.id)
    try {
      const reason = disableReasons[business.id] || undefined
      await setBusinessDisabledState(business.id, !business.isDisabled, reason)
      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : t.systemManager.failedDisable)
    } finally {
      setPendingBusinessId(null)
    }
  }

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">{t.systemManager.pageTitle}</h1>
        <p className="text-muted-foreground">{t.systemManager.pageSubtitle}</p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          {t.systemManager.businessesSection} ({businesses.length})
        </h2>

        {businesses.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">{t.systemManager.noBusinesses}</Card>
        ) : (
          <div className="space-y-4">
            {businesses.map(({ business, owner }) => {
              const isPending = pendingBusinessId === business.id
              const trial = getTrialMeta(business.trialEndsAt)

              return (
                <Card key={business.id} className="p-4 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground">{business.name}</p>
                      <p className="text-sm text-muted-foreground">/{business.slug}/book</p>
                      <p className="text-sm text-muted-foreground">
                        {t.systemManager.owner} {owner.name} ({owner.email || t.systemManager.noEmail})
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={business.membershipPaid ? 'default' : 'secondary'}>
                        {business.membershipPaid ? t.systemManager.membershipPaid : t.systemManager.membershipUnpaid}
                      </Badge>
                      <Badge variant={business.isDisabled ? 'destructive' : 'outline'}>
                        {business.isDisabled ? t.systemManager.disabled : t.systemManager.active}
                      </Badge>
                      {trial.isTrial && !trial.isExpired ? (
                        <Badge variant="outline" className="border-emerald-500/40 text-emerald-700">
                          Free Trial ({Math.max(trial.daysLeft ?? 0, 0)}d left)
                        </Badge>
                      ) : null}
                      {trial.isTrial && trial.isExpired ? (
                        <Badge variant="outline" className="border-amber-500/40 text-amber-700">
                          Trial Expired
                        </Badge>
                      ) : null}
                      {!trial.isTrial && business.membershipPaid ? (
                        <Badge variant="outline" className="border-primary/30 text-primary">
                          Paid Plan
                        </Badge>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-5">
                    <p>{t.systemManager.createdAt} {formatDate(business.createdAt)}</p>
                    <p>{t.systemManager.paidAt} {formatDate(business.membershipPaidAt)}</p>
                    <p>Trial Ends: {formatDate(business.trialEndsAt)}</p>
                    <p>{t.systemManager.disabledAt} {formatDate(business.disabledAt)}</p>
                    <p>{t.systemManager.reason} {business.disabledReason || t.systemManager.na}</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                    <Input
                      placeholder={t.systemManager.disableReasonPlaceholder}
                      value={disableReasons[business.id] ?? ''}
                      onChange={(event) =>
                        setDisableReasons((prev) => ({ ...prev, [business.id]: event.target.value }))
                      }
                    />
                    <Button
                      variant="outline"
                      onClick={() => handleMembershipToggle(business)}
                      disabled={isPending}
                    >
                      <CreditCard className="h-4 w-4" />
                      {business.membershipPaid ? t.systemManager.markUnpaid : t.systemManager.markPaid}
                    </Button>
                    <Button
                      variant={business.isDisabled ? 'outline' : 'destructive'}
                      onClick={() => handleDisableToggle(business)}
                      disabled={isPending}
                    >
                      {business.isDisabled ? (
                        <>
                          <ShieldCheck className="h-4 w-4" />
                          {t.systemManager.enable}
                        </>
                      ) : (
                        <>
                          <ShieldX className="h-4 w-4" />
                          {t.systemManager.disableBtn}
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          {t.systemManager.adminRecords} ({admins.length})
        </h2>

        {admins.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">{t.systemManager.noAdmins}</Card>
        ) : (
          <div className="space-y-3">
            {admins.map((admin) => (
              <Card key={admin.id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-foreground">{admin.name}</p>
                    <p className="text-sm text-muted-foreground">{admin.email || t.systemManager.noEmail} | {admin.phone || t.systemManager.noPhone}</p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>{t.systemManager.businessCount} {adminBusinessCounts[admin.id] ?? 0}</p>
                    <p>{t.systemManager.createdAt} {formatDate(admin.createdAt)}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
