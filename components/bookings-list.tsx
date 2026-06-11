'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useLanguage } from '@/lib/i18n/language-context'
import { cancelBooking, rescheduleBooking } from '@/app/actions/scheduling'
import { format } from 'date-fns'
import { es, enUS } from 'date-fns/locale'
import { Calendar, Clock, X, RefreshCw, CalendarDays } from 'lucide-react'
import type { AvailabilitySlot, MeetingType, Booking } from '@/lib/db/schema'
import Link from 'next/link'

interface BookingWithDetails {
  booking: Booking
  slot: AvailabilitySlot
  meetingType: MeetingType
}

interface BookingsListProps {
  bookings: BookingWithDetails[]
  availableSlots: AvailabilitySlot[]
}

export function BookingsList({ bookings, availableSlots }: BookingsListProps) {
  const router = useRouter()
  const { t, language } = useLanguage()
  const [cancelDialog, setCancelDialog] = useState<BookingWithDetails | null>(null)
  const [rescheduleDialog, setRescheduleDialog] = useState<BookingWithDetails | null>(null)
  const [selectedNewSlot, setSelectedNewSlot] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [exactDate, setExactDate] = useState('')

  const dateLocale = language === 'es' ? es : enUS

  const filteredBookings = bookings.filter(({ slot }) => {
    if (exactDate && slot.date !== exactDate) return false
    return true
  })

  const activeBookings = filteredBookings.filter(b => b.booking.status === 'confirmed' || b.booking.status === 'rescheduled')
  const pastBookings = filteredBookings.filter(b => b.booking.status === 'cancelled')

  const handleCancel = async () => {
    if (!cancelDialog) return
    setLoading(true)
    try {
      await cancelBooking(cancelDialog.booking.id)
      setCancelDialog(null)
      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to cancel booking')
    } finally {
      setLoading(false)
    }
  }

  const handleReschedule = async () => {
    if (!rescheduleDialog || !selectedNewSlot) return
    setLoading(true)
    try {
      await rescheduleBooking(rescheduleDialog.booking.id, selectedNewSlot)
      setRescheduleDialog(null)
      setSelectedNewSlot(null)
      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to reschedule booking')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{t.bookings.confirmed}</Badge>
      case 'rescheduled':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">{t.bookings.rescheduled}</Badge>
      case 'cancelled':
        return <Badge variant="secondary">{t.bookings.cancelled}</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (bookings.length === 0) {
    return (
      <Card className="p-12 text-center">
        <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">{t.bookings.noBookings}</h3>
        <p className="text-muted-foreground mb-6">{t.bookings.noBookingsDesc}</p>
        <Button asChild>
          <Link href="/book">{t.bookings.bookMeeting}</Link>
        </Button>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-1">
          <Input type="date" value={exactDate} onChange={(event) => setExactDate(event.target.value)} aria-label={t.bookings.filterDate} />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setExactDate('')
          }}
        >
          {t.bookings.clearDateFilters}
        </Button>
      </section>

      {filteredBookings.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">{t.bookings.noBookingsForDateFilter}</Card>
      ) : null}

      {/* Active Bookings */}
      {activeBookings.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">{t.bookings.upcomingMeetings}</h2>
          <div className="space-y-4">
            {activeBookings.map(({ booking, slot, meetingType }) => (
              <Card key={booking.id} className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <div
                      className="w-1 rounded-full flex-shrink-0"
                      style={{ backgroundColor: meetingType.color }}
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{meetingType.name}</h3>
                        {getStatusBadge(booking.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(slot.date), 'EEE, MMM d, yyyy', { locale: dateLocale })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {slot.startTime} - {slot.endTime}
                        </span>
                      </div>
                      {booking.notes && (
                        <p className="text-sm text-muted-foreground mt-2">{t.bookings.notes}: {booking.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 sm:flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRescheduleDialog({ booking, slot, meetingType })}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      {t.bookings.reschedule}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCancelDialog({ booking, slot, meetingType })}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4 mr-1" />
                      {t.bookings.cancel}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Past/Cancelled Bookings */}
      {pastBookings.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">{t.bookings.cancelledMeetings}</h2>
          <div className="space-y-4">
            {pastBookings.map(({ booking, slot, meetingType }) => (
              <Card key={booking.id} className="p-6 opacity-60">
                <div className="flex gap-4">
                  <div
                    className="w-1 rounded-full flex-shrink-0 bg-muted"
                  />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground line-through">{meetingType.name}</h3>
                      {getStatusBadge(booking.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(slot.date), 'EEE, MMM d, yyyy', { locale: dateLocale })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {slot.startTime} - {slot.endTime}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Cancel Dialog */}
      <Dialog open={!!cancelDialog} onOpenChange={() => setCancelDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.bookings.cancelBooking}</DialogTitle>
            <DialogDescription>
              {t.bookings.cancelConfirm}
            </DialogDescription>
          </DialogHeader>
          {cancelDialog && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="font-medium text-foreground">{cancelDialog.meetingType.name}</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(cancelDialog.slot.date), 'EEEE, MMMM d, yyyy', { locale: dateLocale })} {t.common.at} {cancelDialog.slot.startTime}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialog(null)}>
              {t.bookings.keepBooking}
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={loading}>
              {loading ? t.bookings.cancelling : t.bookings.cancelBtn}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={!!rescheduleDialog} onOpenChange={() => { setRescheduleDialog(null); setSelectedNewSlot(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t.bookings.rescheduleBooking}</DialogTitle>
            <DialogDescription>
              {t.bookings.rescheduleDesc}
            </DialogDescription>
          </DialogHeader>
          {rescheduleDialog && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">{t.bookings.currentTime}</p>
                <p className="font-medium text-foreground">
                  {format(new Date(rescheduleDialog.slot.date), 'EEE, MMM d', { locale: dateLocale })} {t.common.at} {rescheduleDialog.slot.startTime}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-foreground mb-3">{t.bookings.availableSlots}</p>
                {availableSlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t.bookings.noAvailableSlots}</p>
                ) : (
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => setSelectedNewSlot(slot.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          selectedNewSlot === slot.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <p className="font-medium text-foreground text-sm">
                          {format(new Date(slot.date), 'EEE, MMM d, yyyy', { locale: dateLocale })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {slot.startTime} - {slot.endTime}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRescheduleDialog(null); setSelectedNewSlot(null) }}>
              {t.common.cancel}
            </Button>
            <Button onClick={handleReschedule} disabled={loading || !selectedNewSlot}>
              {loading ? t.bookings.rescheduling : t.bookings.confirmReschedule}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
