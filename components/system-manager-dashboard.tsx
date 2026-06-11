'use client'

import { useEffect, useState } from 'react'
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

type BusinessStatusFilter = 'all' | 'trial-active' | 'trial-expired' | 'paid' | 'disabled'
const ITEMS_PER_PAGE = 10

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
  const [statusFilter, setStatusFilter] = useState<BusinessStatusFilter>('all')
  const [businessSearchQuery, setBusinessSearchQuery] = useState('')
  const [businessPage, setBusinessPage] = useState(1)
  const [adminSearchQuery, setAdminSearchQuery] = useState('')
  const [adminPage, setAdminPage] = useState(1)

  const getBusinessFilterStatus = (business: Business): Exclude<BusinessStatusFilter, 'all'> | 'unpaid' => {
    if (business.isDisabled) return 'disabled'
    const trial = getTrialMeta(business.trialEndsAt)
    if (trial.isTrial && !trial.isExpired) return 'trial-active'
    if (trial.isTrial && trial.isExpired) return 'trial-expired'
    if (business.membershipPaid) return 'paid'
    return 'unpaid'
  }

  const filteredBusinesses = businesses.filter(({ business }) => {
    if (statusFilter === 'all') return true
    return getBusinessFilterStatus(business) === statusFilter
  })

  const searchedBusinesses = filteredBusinesses.filter(({ business, owner }) => {
    const q = businessSearchQuery.trim().toLowerCase()
    if (!q) return true
    return (
      business.name.toLowerCase().includes(q)
      || business.slug.toLowerCase().includes(q)
      || owner.name.toLowerCase().includes(q)
      || (owner.email ?? '').toLowerCase().includes(q)
    )
  })

  const businessTotalPages = Math.max(1, Math.ceil(searchedBusinesses.length / ITEMS_PER_PAGE))
  const paginatedBusinesses = searchedBusinesses.slice(
    (businessPage - 1) * ITEMS_PER_PAGE,
    businessPage * ITEMS_PER_PAGE,
  )

  const filteredAdmins = admins.filter((admin) => {
    const q = adminSearchQuery.trim().toLowerCase()
    if (!q) return true
    return (
      admin.name.toLowerCase().includes(q)
      || (admin.email ?? '').toLowerCase().includes(q)
      || (admin.phone ?? '').toLowerCase().includes(q)
    )
  })

  const adminTotalPages = Math.max(1, Math.ceil(filteredAdmins.length / ITEMS_PER_PAGE))
  const paginatedAdmins = filteredAdmins.slice(
    (adminPage - 1) * ITEMS_PER_PAGE,
    adminPage * ITEMS_PER_PAGE,
  )

  useEffect(() => {
    if (businessPage > businessTotalPages) {
      setBusinessPage(businessTotalPages)
    }
  }, [businessPage, businessTotalPages])

  useEffect(() => {
    if (adminPage > adminTotalPages) {
      setAdminPage(adminTotalPages)
    }
  }, [adminPage, adminTotalPages])

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
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => {
                  setStatusFilter('all')
                  setBusinessPage(1)
                }}
              >
                {t.systemManager.filterAll}
              </Button>
              <Button
                size="sm"
                variant={statusFilter === 'trial-active' ? 'default' : 'outline'}
                onClick={() => {
                  setStatusFilter('trial-active')
                  setBusinessPage(1)
                }}
              >
                {t.systemManager.filterTrialActive}
              </Button>
              <Button
                size="sm"
                variant={statusFilter === 'trial-expired' ? 'default' : 'outline'}
                onClick={() => {
                  setStatusFilter('trial-expired')
                  setBusinessPage(1)
                }}
              >
                {t.systemManager.filterTrialExpired}
              </Button>
              <Button
                size="sm"
                variant={statusFilter === 'paid' ? 'default' : 'outline'}
                onClick={() => {
                  setStatusFilter('paid')
                  setBusinessPage(1)
                }}
              >
                {t.systemManager.filterPaid}
              </Button>
              <Button
                size="sm"
                variant={statusFilter === 'disabled' ? 'default' : 'outline'}
                onClick={() => {
                  setStatusFilter('disabled')
                  setBusinessPage(1)
                }}
              >
                {t.systemManager.filterDisabled}
              </Button>
            </div>

            <div className="w-full max-w-sm">
              <Input
                value={businessSearchQuery}
                onChange={(event) => {
                  setBusinessSearchQuery(event.target.value)
                  setBusinessPage(1)
                }}
                placeholder={t.systemManager.searchBusinessesPlaceholder}
              />
            </div>

            {searchedBusinesses.length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground">{t.systemManager.noBusinessesForFilter}</Card>
            ) : null}

            {paginatedBusinesses.map(({ business, owner }) => {
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
                          {t.systemManager.trialActiveBadge} ({Math.max(trial.daysLeft ?? 0, 0)}d)
                        </Badge>
                      ) : null}
                      {trial.isTrial && trial.isExpired ? (
                        <Badge variant="outline" className="border-amber-500/40 text-amber-700">
                          {t.systemManager.trialExpiredBadge}
                        </Badge>
                      ) : null}
                      {!trial.isTrial && business.membershipPaid ? (
                        <Badge variant="outline" className="border-primary/30 text-primary">
                          {t.systemManager.paidPlanBadge}
                        </Badge>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-5">
                    <p>{t.systemManager.createdAt} {formatDate(business.createdAt)}</p>
                    <p>{t.systemManager.paidAt} {formatDate(business.membershipPaidAt)}</p>
                    <p>{t.systemManager.trialEndsAt} {formatDate(business.trialEndsAt)}</p>
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

            {searchedBusinesses.length > 0 ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  {t.systemManager.pageLabel} {businessPage} / {businessTotalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setBusinessPage((prev) => Math.max(1, prev - 1))}
                    disabled={businessPage === 1}
                  >
                    {t.systemManager.prevPage}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setBusinessPage((prev) => Math.min(businessTotalPages, prev + 1))}
                    disabled={businessPage === businessTotalPages}
                  >
                    {t.systemManager.nextPage}
                  </Button>
                </div>
              </div>
            ) : null}
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
            <div className="w-full max-w-sm">
              <Input
                value={adminSearchQuery}
                onChange={(event) => {
                  setAdminSearchQuery(event.target.value)
                  setAdminPage(1)
                }}
                placeholder={t.systemManager.searchAdminsPlaceholder}
              />
            </div>

            {filteredAdmins.length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground">{t.systemManager.noAdminsForFilter}</Card>
            ) : null}

            {paginatedAdmins.map((admin) => (
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

            {filteredAdmins.length > 0 ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  {t.systemManager.pageLabel} {adminPage} / {adminTotalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setAdminPage((prev) => Math.max(1, prev - 1))}
                    disabled={adminPage === 1}
                  >
                    {t.systemManager.prevPage}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setAdminPage((prev) => Math.min(adminTotalPages, prev + 1))}
                    disabled={adminPage === adminTotalPages}
                  >
                    {t.systemManager.nextPage}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </section>
    </div>
  )
}
