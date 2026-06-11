'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useLanguage } from '@/lib/i18n/language-context'
import { format } from 'date-fns'
import { es, enUS } from 'date-fns/locale'
import { Calendar, Clock, User, History, Mail, Phone } from 'lucide-react'
import type { AvailabilitySlot, MeetingType, Booking, User as UserType } from '@/lib/db/schema'

interface BookingWithDetails {
  booking: Booking
  slot: AvailabilitySlot
  meetingType: MeetingType
  client: UserType
}

interface MeetingHistoryProps {
  bookings: BookingWithDetails[]
}

const ITEMS_PER_PAGE = 10

export function MeetingHistory({ bookings }: MeetingHistoryProps) {
  const { t, language } = useLanguage()
  const dateLocale = language === 'es' ? es : enUS
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [exactDate, setExactDate] = useState('')

  // History = every booking, sorted by meeting date (most recent first)
  const sorted = [...bookings].sort((a, b) => {
    const aKey = `${a.slot.date} ${a.slot.startTime}`
    const bKey = `${b.slot.date} ${b.slot.startTime}`
    return bKey.localeCompare(aKey)
  })

  const filteredByStatus = statusFilter === 'all'
    ? sorted
    : sorted.filter(b => b.booking.status === statusFilter)
  const filtered = filteredByStatus.filter(({ slot }) => {
    if (exactDate && slot.date !== exactDate) return false
    return true
  })
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{t.bookings.confirmed}</Badge>
      case 'rescheduled':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">{t.bookings.rescheduled}</Badge>
      case 'completed':
        return <Badge className="bg-primary/10 text-primary hover:bg-primary/10">{t.bookings.completed}</Badge>
      case 'cancelled':
        return <Badge variant="secondary">{t.bookings.cancelled}</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (bookings.length === 0) {
    return (
      <Card className="p-12 text-center">
        <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">{t.admin.noHistory}</h3>
        <p className="text-muted-foreground">{t.admin.noHistoryDesc}</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            {t.admin.meetingHistory}
          </h2>
          <p className="text-sm text-muted-foreground">{t.admin.meetingHistoryDesc}</p>
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value)
            setCurrentPage(1)
          }}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder={t.admin.filterByStatus} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.admin.allStatuses}</SelectItem>
            <SelectItem value="confirmed">{t.bookings.confirmed}</SelectItem>
            <SelectItem value="rescheduled">{t.bookings.rescheduled}</SelectItem>
            <SelectItem value="completed">{t.bookings.completed}</SelectItem>
            <SelectItem value="cancelled">{t.bookings.cancelled}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 sm:grid-cols-1">
        <Input type="date" value={exactDate} onChange={(event) => {
          setExactDate(event.target.value)
          setCurrentPage(1)
        }} aria-label={t.bookings.filterDate} />
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          setExactDate('')
          setCurrentPage(1)
        }}
      >
        {t.bookings.clearDateFilters}
      </Button>

      {filtered.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">{t.bookings.noBookingsForDateFilter}</Card>
      ) : null}

      {filtered.length > 0 ? <div className="space-y-4">
        {paginated.map(({ booking, slot, meetingType, client }) => {
          const isClosed = booking.status === 'cancelled' || booking.status === 'completed'
          return (
            <Card key={booking.id} className={`p-6 ${booking.status === 'cancelled' ? 'opacity-60' : ''}`}>
              <div className="flex gap-4">
                <div
                  className="w-1 rounded-full flex-shrink-0"
                  style={{ backgroundColor: booking.status === 'cancelled' ? undefined : meetingType.color }}
                />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-semibold text-foreground ${booking.status === 'cancelled' ? 'line-through' : ''}`}>
                      {meetingType.name}
                    </h3>
                    {getStatusBadge(booking.status)}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(slot.date), 'EEE, MMM d, yyyy', { locale: dateLocale })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {slot.startTime} - {slot.endTime}
                    </span>
                  </div>
                  <div className={`flex flex-col gap-1 text-sm ${isClosed ? 'text-muted-foreground' : ''}`}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className={isClosed ? '' : 'text-foreground font-medium'}>{client.name}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-muted-foreground pl-6">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5" />
                        {client.email || t.admin.noEmail}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" />
                        {client.phone || t.admin.noPhone}
                      </span>
                    </div>
                  </div>
                  {booking.notes && (
                    <p className="text-sm text-muted-foreground bg-muted/50 rounded p-2">
                      {t.bookings.notes}: {booking.notes}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          )
        })}

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
      </div> : null}
    </div>
  )
}
