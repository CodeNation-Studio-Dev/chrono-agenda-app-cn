'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useLanguage } from '@/lib/i18n/language-context'
import { createAvailabilitySlot, deleteAvailabilitySlot } from '@/app/actions/scheduling'
import { format } from 'date-fns'
import { es, enUS } from 'date-fns/locale'
import { Plus, Trash2, CalendarDays } from 'lucide-react'
import type { AvailabilitySlot } from '@/lib/db/schema'

interface AvailabilityManagerProps {
  slots: AvailabilitySlot[]
  businessId: number
}

export function AvailabilityManager({ slots, businessId }: AvailabilityManagerProps) {
  const router = useRouter()
  const { t, language } = useLanguage()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [loading, setLoading] = useState(false)

  const dateLocale = language === 'es' ? es : enUS

  // Group slots by date
  const slotsByDate = slots.reduce((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = []
    acc[slot.date].push(slot)
    return acc
  }, {} as Record<string, AvailabilitySlot[]>)

  // Slots for selected date
  const selectedDateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''
  const slotsForSelectedDate = slotsByDate[selectedDateStr] || []

  // Dates that have slots
  const datesWithSlots = Object.keys(slotsByDate)

  // KPI metrics for selected business availability
  const totalSlots = slots.length
  const bookedSlots = slots.filter((slot) => slot.isBooked).length
  const availableSlots = totalSlots - bookedSlots
  const utilizationRate = totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0

  const handleCreateSlot = async () => {
    if (!selectedDate) return
    setLoading(true)
    try {
      await createAvailabilitySlot(businessId, {
        date: format(selectedDate, 'yyyy-MM-dd'),
        startTime,
        endTime,
      })
      setDialogOpen(false)
      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to create slot')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSlot = async (id: number) => {
    if (!confirm(language === 'es' ? 'Estas seguro de que quieres eliminar este horario?' : 'Are you sure you want to delete this slot?')) return
    try {
      await deleteAvailabilitySlot(id, businessId)
      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete slot')
    }
  }

  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">
            {language === 'es' ? 'Total Horarios' : 'Total Slots'}
          </p>
          <p className="text-2xl font-semibold text-foreground">{totalSlots}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">
            {language === 'es' ? 'Reservados' : 'Booked'}
          </p>
          <p className="text-2xl font-semibold text-foreground">{bookedSlots}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">
            {language === 'es' ? 'Disponibles' : 'Available'}
          </p>
          <p className="text-2xl font-semibold text-foreground">{availableSlots}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">
            {language === 'es' ? 'Tasa de Ocupacion' : 'Utilization Rate'}
          </p>
          <p className="text-2xl font-semibold text-foreground">{utilizationRate}%</p>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Calendar */}
        <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            {language === 'es' ? 'Calendario' : 'Calendar'}
          </h2>
        </div>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          locale={dateLocale}
          modifiers={{
            hasSlots: (date) => datesWithSlots.includes(format(date, 'yyyy-MM-dd'))
          }}
          modifiersClassNames={{
            hasSlots: 'bg-primary/20 font-semibold'
          }}
          className="rounded-md"
        />
        <p className="text-xs text-muted-foreground mt-4">
          {language === 'es' ? 'Las fechas con horarios disponibles estan resaltadas' : 'Dates with availability slots are highlighted'}
        </p>
        </Card>

        {/* Slots for Selected Date */}
        <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-foreground">
              {selectedDate ? format(selectedDate, 'MMMM d, yyyy', { locale: dateLocale }) : t.admin.selectDate}
            </h2>
            <p className="text-sm text-muted-foreground">
              {slotsForSelectedDate.length} {language === 'es' ? 'horario(s) disponible(s)' : `slot${slotsForSelectedDate.length !== 1 ? 's' : ''} available`}
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" disabled={!selectedDate}>
                <Plus className="h-4 w-4 mr-1" />
                {t.admin.addSlot}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t.admin.addSlot}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">{t.booking.date}</p>
                  <p className="font-medium text-foreground">
                    {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy', { locale: dateLocale })}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime">{t.admin.startTime}</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">{t.admin.endTime}</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
                <Button onClick={handleCreateSlot} disabled={loading} className="w-full">
                  {loading ? t.admin.adding : t.admin.add}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {slotsForSelectedDate.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t.admin.noSlotsForDate}</p>
            <p className="text-sm">{language === 'es' ? 'Haz clic en "Agregar Horario" para crear uno' : 'Click "Add Slot" to create one'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {slotsForSelectedDate
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
              .map((slot) => (
                <div
                  key={slot.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    slot.isBooked ? 'bg-muted/50 border-muted' : 'border-border'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${slot.isBooked ? 'bg-orange-500' : 'bg-green-500'}`} />
                    <span className="font-medium text-foreground">
                      {slot.startTime} - {slot.endTime}
                    </span>
                    {slot.isBooked && (
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        {t.admin.booked}
                      </span>
                    )}
                  </div>
                  {!slot.isBooked && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSlot(slot.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
          </div>
        )}
        </Card>
      </div>
    </div>
  )
}
