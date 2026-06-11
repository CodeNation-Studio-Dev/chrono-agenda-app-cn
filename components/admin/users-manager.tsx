'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useLanguage } from '@/lib/i18n/language-context'
import { setUserRole, deleteUser, createClientUser } from '@/app/actions/scheduling'
import { ScheduleForClientDialog } from './schedule-for-client-dialog'
import { Shield, ShieldOff, Trash2, Users, UserPlus, Phone, Mail, CalendarPlus } from 'lucide-react'
import type { User, AvailabilitySlot, MeetingType } from '@/lib/db/schema'

interface UsersManagerProps {
  users: User[]
  currentUserId: string
  slots: AvailabilitySlot[]
  meetingTypes: MeetingType[]
  businessId: number
}

type UserFilter = 'all' | 'admin' | 'client'
const ITEMS_PER_PAGE = 10

export function UsersManager({ users, currentUserId, slots, meetingTypes, businessId }: UsersManagerProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [userFilter, setUserFilter] = useState<UserFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  // Add client dialog state
  const [addOpen, setAddOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Schedule dialog state
  const [scheduleClient, setScheduleClient] = useState<User | null>(null)

  const handleRoleToggle = async (u: User) => {
    setPendingId(u.id)
    try {
      await setUserRole(u.id, u.role === 'admin' ? 'client' : 'admin', businessId)
      router.refresh()
    } catch (error) {
      console.error('[v0] Failed to change role:', error)
    } finally {
      setPendingId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await deleteUser(deleteTarget.id, businessId)
      setDeleteTarget(null)
      router.refresh()
    } catch (error) {
      console.error('[v0] Failed to delete user:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleAddClient = async () => {
    if (!newName.trim()) return
    setIsSaving(true)
    try {
      await createClientUser(businessId, {
        name: newName,
        phone: newPhone || undefined,
        email: newEmail || undefined,
      })
      setNewName('')
      setNewPhone('')
      setNewEmail('')
      setAddOpen(false)
      router.refresh()
    } catch (error) {
      console.error('[v0] Failed to add client:', error)
      alert(error instanceof Error ? error.message : 'Failed to add client')
    } finally {
      setIsSaving(false)
    }
  }

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()

  const filteredUsers = users.filter((u) => {
    if (userFilter === 'all') return true
    return u.role === userFilter
  })

  const searchedUsers = filteredUsers.filter((u) => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return true
    return (
      u.name.toLowerCase().includes(q)
      || (u.email ?? '').toLowerCase().includes(q)
      || (u.phone ?? '').toLowerCase().includes(q)
    )
  })

  const totalPages = Math.max(1, Math.ceil(searchedUsers.length / ITEMS_PER_PAGE))
  const paginatedUsers = searchedUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  )

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          {t.admin.allUsers} ({users.length})
        </h2>
        <Button onClick={() => setAddOpen(true)} size="sm">
          <UserPlus className="h-4 w-4" />
          {t.admin.addClient}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={userFilter === 'all' ? 'default' : 'outline'}
          onClick={() => {
            setUserFilter('all')
            setCurrentPage(1)
          }}
        >
          {t.admin.filterAllUsers}
        </Button>
        <Button
          size="sm"
          variant={userFilter === 'admin' ? 'default' : 'outline'}
          onClick={() => {
            setUserFilter('admin')
            setCurrentPage(1)
          }}
        >
          {t.admin.roleAdmin}
        </Button>
        <Button
          size="sm"
          variant={userFilter === 'client' ? 'default' : 'outline'}
          onClick={() => {
            setUserFilter('client')
            setCurrentPage(1)
          }}
        >
          {t.admin.roleClient}
        </Button>
      </div>

      <div className="w-full max-w-sm">
        <Input
          value={searchQuery}
          onChange={(event) => {
            setSearchQuery(event.target.value)
            setCurrentPage(1)
          }}
          placeholder={t.admin.searchUsersPlaceholder}
        />
      </div>

      {users.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">{t.admin.noUsers}</h3>
          <p className="text-muted-foreground">{t.admin.noUsersDesc}</p>
        </Card>
      ) : searchedUsers.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground">{t.admin.noUsersForFilter}</p>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {paginatedUsers.map((u) => {
            const isSelf = u.id === currentUserId
            const isAdmin = u.role === 'admin'
            const isPending = u.role === 'pending'
            return (
              <Card key={u.id} className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {getInitials(u.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-foreground truncate">{u.name}</span>
                        {isSelf && (
                          <Badge variant="outline" className="text-xs">
                            {t.admin.you}
                          </Badge>
                        )}
                        <Badge
                          className={
                            isAdmin
                              ? 'bg-primary/10 text-primary hover:bg-primary/10'
                              : isPending
                                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                                : 'bg-muted text-muted-foreground hover:bg-muted'
                          }
                        >
                          {isAdmin ? t.admin.roleAdmin : isPending ? t.admin.rolePending : t.admin.roleClient}
                        </Badge>
                        {u.createdByAdmin && (
                          <Badge variant="outline" className="text-xs">
                            {t.admin.addedByAdmin}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-0.5">
                        <span className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                          <Mail className="h-3.5 w-3.5" />
                          {u.email || t.admin.noEmail}
                        </span>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />
                          {u.phone || t.admin.noPhone}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!isAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setScheduleClient(u)}
                      >
                        <CalendarPlus className="h-4 w-4" />
                        {t.admin.scheduleForClient}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRoleToggle(u)}
                      disabled={isSelf || pendingId === u.id}
                    >
                      {isAdmin ? (
                        <>
                          <ShieldOff className="h-4 w-4" />
                          {t.admin.removeAdminBtn}
                        </>
                      ) : (
                        <>
                          <Shield className="h-4 w-4" />
                          {t.admin.makeAdminBtn}
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget(u)}
                      disabled={isSelf}
                      aria-label={t.admin.deleteUser}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {t.admin.pageLabel} {currentPage} / {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                {t.admin.prevPage}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                {t.admin.nextPage}
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Add client dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.admin.newClient}</DialogTitle>
            <DialogDescription>{t.admin.addClient}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client-name">{t.admin.clientName}</Label>
              <Input
                id="client-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t.admin.clientName}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-phone">{t.admin.phoneOptional}</Label>
              <Input
                id="client-phone"
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="+1 555 123 4567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-email">{t.admin.emailOptional}</Label>
              <Input
                id="client-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={isSaving}>
              {t.common.cancel}
            </Button>
            <Button onClick={handleAddClient} disabled={isSaving || !newName.trim()}>
              {isSaving ? t.admin.saving : t.admin.addClient}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule for client dialog */}
      <ScheduleForClientDialog
        client={scheduleClient}
        slots={slots}
        meetingTypes={meetingTypes}
        businessId={businessId}
        onClose={() => setScheduleClient(null)}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.admin.deleteUser}</AlertDialogTitle>
            <AlertDialogDescription>{t.admin.deleteUserConfirm}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? t.admin.deleting : t.admin.deleteUser}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
