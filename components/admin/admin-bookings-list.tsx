'use client'

import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarPicker } from '@/components/ui/calendar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useLanguage } from '@/lib/i18n/language-context'
import { completeBooking } from '@/app/actions/scheduling'
import { format } from 'date-fns'
import { es, enUS } from 'date-fns/locale'
import { Calendar, CalendarDays, Clock, User, Users, CheckCircle2, Mail, Phone } from 'lucide-react'
import type { AvailabilitySlot, MeetingType, Booking, User as UserType } from '@/lib/db/schema'

interface BookingWithDetails {
  booking: Booking
  slot: AvailabilitySlot
  meetingType: MeetingType
  client: UserType
}

interface AdminBookingsListProps {
  bookings: BookingWithDetails[]
  businessId: number
}

export function AdminBookingsList({ bookings, businessId }: AdminBookingsListProps) {
  const { t, language } = useLanguage()
  const dateLocale = language === 'es' ? es : enUS
  const [completingId, setCompletingId] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null)

  const activeBookings = bookings.filter(b => b.booking.status === 'confirmed' || b.booking.status === 'rescheduled')

  const bookingsByDate = useMemo(() => {
    const grouped: Record<string, BookingWithDetails[]> = {}
    for (const item of activeBookings) {
      const key = item.slot.date
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(item)
    }

    for (const key of Object.keys(grouped)) {
      grouped[key].sort((a, b) => a.slot.startTime.localeCompare(b.slot.startTime))
    }

    return grouped
  }, [activeBookings])

  const bookedDateKeys = useMemo(() => new Set(Object.keys(bookingsByDate)), [bookingsByDate])
  const meetingTypeLegend = useMemo(() => {
    const unique = new Map<number, { id: number; name: string; color: string }>()
    for (const item of activeBookings) {
      unique.set(item.meetingType.id, {
        id: item.meetingType.id,
        name: item.meetingType.name,
        color: item.meetingType.color,
      })
    }
    return Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [activeBookings])
  const selectedDateKey = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null
  const selectedDateBookings = selectedDateKey ? (bookingsByDate[selectedDateKey] ?? []) : []
  const selectedBooking = selectedDateBookings.find((item) => item.booking.id === selectedBookingId)
    ?? selectedDateBookings[0]

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

  async function handleComplete(id: number) {
    setCompletingId(id)
    try {
      await completeBooking(id, businessId)
    } finally {
      setCompletingId(null)
    }
  }

  if (activeBookings.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">{t.admin.noBookingsYet}</h3>
        <p className="text-muted-foreground">
          {t.admin.noBookingsDesc}
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          {t.bookings.upcomingMeetings} ({activeBookings.length})
        </h2>
        <div className="inline-flex rounded-md border p-1 bg-card">
          <Button
            type="button"
            size="sm"
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            onClick={() => setViewMode('list')}
          >
            {t.admin.bookingViewList}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={viewMode === 'calendar' ? 'default' : 'ghost'}
            onClick={() => {
              if (!selectedDate && activeBookings.length > 0) {
                setSelectedDate(new Date(activeBookings[0].slot.date))
              }
              setSelectedBookingId(null)
              setViewMode('calendar')
            }}
          >
            {t.admin.bookingViewCalendar}
          </Button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="space-y-4">
          {activeBookings.map(({ booking, slot, meetingType, client }) => (
            <Card key={booking.id} className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex gap-4">
                  <div
                    className="w-1 rounded-full flex-shrink-0"
                    style={{ backgroundColor: meetingType.color }}
                  />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{meetingType.name}</h3>
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
                    <div className="flex flex-col gap-1 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground font-medium">{client.name}</span>
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

                <div className="flex-shrink-0">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" disabled={completingId === booking.id}>
                        <CheckCircle2 className="h-4 w-4" />
                        {completingId === booking.id ? t.admin.completing : t.admin.completeMeeting}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t.admin.markComplete}</AlertDialogTitle>
                        <AlertDialogDescription>{t.admin.completeConfirm}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleComplete(booking.id)}>
                          {t.admin.markComplete}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          <Card className="p-4">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              {t.admin.bookingCalendarTitle}
            </h3>
            {meetingTypeLegend.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-muted-foreground mb-2">{t.admin.meetingTypes}</p>
                <div className="flex flex-wrap gap-2">
                  {meetingTypeLegend.map((type) => (
                    <span
                      key={type.id}
                      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs text-foreground"
                    >
                      <span
                        className="inline-block size-2 rounded-full"
                        style={{ backgroundColor: type.color }}
                      />
                      <span className="max-w-[150px] truncate">{type.name}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
            <CalendarPicker
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                setSelectedDate(date)
                setSelectedBookingId(null)
              }}
              locale={dateLocale}
              modifiers={{
                hasBookings: (date) => bookedDateKeys.has(format(date, 'yyyy-MM-dd')),
              }}
              modifiersClassNames={{
                hasBookings: 'bg-primary/20 font-semibold',
              }}
              className="rounded-md border"
            />
          </Card>

          <div className="space-y-4">
            {!selectedDate ? (
              <Card className="p-6 text-sm text-muted-foreground">{t.admin.selectDate}</Card>
            ) : selectedDateBookings.length === 0 ? (
              <Card className="p-6 text-sm text-muted-foreground">{t.admin.noBookingsOnDate}</Card>
            ) : (
              <>
                <Card className="p-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    {t.admin.selectBookingFromDate} {format(selectedDate, 'EEE, MMM d, yyyy', { locale: dateLocale })}
                  </p>
                  <div className="space-y-2">
                    {selectedDateBookings.map((item) => (
                      <Button
                        key={item.booking.id}
                        variant={selectedBooking?.booking.id === item.booking.id ? 'default' : 'outline'}
                        className="w-full justify-between"
                        onClick={() => setSelectedBookingId(item.booking.id)}
                      >
                        <span>{item.slot.startTime} - {item.slot.endTime}</span>
                        <span className="truncate max-w-[180px]">{item.meetingType.name}</span>
                      </Button>
                    ))}
                  </div>
                </Card>

                {selectedBooking && (
                  <Card className="p-6 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-semibold text-foreground">{selectedBooking.meetingType.name}</h3>
                      {getStatusBadge(selectedBooking.booking.status)}
                    </div>

                    <div className="text-sm text-muted-foreground flex flex-col gap-2">
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {selectedBooking.slot.startTime} - {selectedBooking.slot.endTime}
                      </span>
                      <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(selectedBooking.slot.date), 'EEE, MMM d, yyyy', { locale: dateLocale })}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">{t.admin.clientInformation}</p>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {selectedBooking.client.name}
                        </p>
                        <p className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {selectedBooking.client.email || t.admin.noEmail}
                        </p>
                        <p className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {selectedBooking.client.phone || t.admin.noPhone}
                        </p>
                      </div>
                    </div>

                    {selectedBooking.booking.notes && (
                      <p className="text-sm text-muted-foreground bg-muted/50 rounded p-2">
                        {t.bookings.notes}: {selectedBooking.booking.notes}
                      </p>
                    )}

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" disabled={completingId === selectedBooking.booking.id}>
                          <CheckCircle2 className="h-4 w-4" />
                          {completingId === selectedBooking.booking.id ? t.admin.completing : t.admin.completeMeeting}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t.admin.markComplete}</AlertDialogTitle>
                          <AlertDialogDescription>{t.admin.completeConfirm}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleComplete(selectedBooking.booking.id)}>
                            {t.admin.markComplete}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
