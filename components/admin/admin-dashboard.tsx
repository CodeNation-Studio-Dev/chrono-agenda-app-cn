'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { AvailabilityManager } from './availability-manager'
import { MeetingTypesManager } from './meeting-types-manager'
import { AdminBookingsList } from './admin-bookings-list'
import { MeetingHistory } from './meeting-history'
import { BrandingManager } from './branding-manager'
import { UsersManager } from './users-manager'
import { BusinessesManager } from './businesses-manager'
import { useLanguage } from '@/lib/i18n/language-context'
import { CalendarDays, Clock, Users, Palette, UserCog, History, Building2, ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { AvailabilitySlot, MeetingType, Booking, User, Business } from '@/lib/db/schema'

interface BookingWithDetails {
  booking: Booking
  slot: AvailabilitySlot
  meetingType: MeetingType
  client: User
}

interface AdminDashboardProps {
  businesses: Business[]
  slotsMap: Record<number, AvailabilitySlot[]>
  meetingTypesMap: Record<number, MeetingType[]>
  bookingsMap: Record<number, BookingWithDetails[]>
  usersMap: Record<number, User[]>
  currentUserId: string
}

export function AdminDashboard({
  businesses,
  slotsMap,
  meetingTypesMap,
  bookingsMap,
  usersMap,
  currentUserId,
}: AdminDashboardProps) {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState('businesses')
  const [selectedBusinessId, setSelectedBusinessId] = useState<number | null>(
    businesses[0]?.id ?? null,
  )

  const selectedBusiness = businesses.find((b) => b.id === selectedBusinessId) ?? null
  const slots = selectedBusinessId ? (slotsMap[selectedBusinessId] ?? []) : []
  const meetingTypes = selectedBusinessId ? (meetingTypesMap[selectedBusinessId] ?? []) : []
  const bookings = selectedBusinessId ? (bookingsMap[selectedBusinessId] ?? []) : []
  const users = selectedBusinessId ? (usersMap[selectedBusinessId] ?? []) : []

  const activeBookings = bookings.filter(
    (b) => b.booking.status === 'confirmed' || b.booking.status === 'rescheduled',
  )

  return (
    <div className="space-y-6">
      {/* Business Switcher */}
      {businesses.length > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
          <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm text-muted-foreground">Business:</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                {selectedBusiness?.name ?? 'Select a business'}
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {businesses.map((biz) => (
                <DropdownMenuItem
                  key={biz.id}
                  onClick={() => setSelectedBusinessId(biz.id)}
                  className={selectedBusinessId === biz.id ? 'font-semibold' : ''}
                >
                  {biz.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {selectedBusiness && (
            <a
              href={`/${selectedBusiness.slug}/book`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-auto"
            >
              /{selectedBusiness.slug}/book ↗
            </a>
          )}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 sm:grid-cols-7 lg:w-auto lg:inline-grid">
          <TabsTrigger value="businesses" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Businesses</span>
          </TabsTrigger>
          <TabsTrigger value="availability" className="flex items-center gap-2" disabled={!selectedBusinessId}>
            <CalendarDays className="h-4 w-4" />
            <span className="hidden sm:inline">{t.admin.availability}</span>
          </TabsTrigger>
          <TabsTrigger value="meeting-types" className="flex items-center gap-2" disabled={!selectedBusinessId}>
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">{t.admin.meetingTypes}</span>
          </TabsTrigger>
          <TabsTrigger value="bookings" className="flex items-center gap-2" disabled={!selectedBusinessId}>
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">{t.admin.allBookings}</span>
            {activeBookings.length > 0 && (
              <span className="ml-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                {activeBookings.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2" disabled={!selectedBusinessId}>
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">{t.admin.history}</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2" disabled={!selectedBusinessId}>
            <UserCog className="h-4 w-4" />
            <span className="hidden sm:inline">{t.admin.users}</span>
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2" disabled={!selectedBusinessId}>
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">{t.admin.branding}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="businesses">
          <BusinessesManager
            businesses={businesses}
            selectedBusinessId={selectedBusinessId}
            onSelectBusiness={(id) => {
              setSelectedBusinessId(id)
              setActiveTab('availability')
            }}
          />
        </TabsContent>

        {selectedBusinessId && (
          <>
            <TabsContent value="availability">
              <AvailabilityManager slots={slots} businessId={selectedBusinessId} />
            </TabsContent>

            <TabsContent value="meeting-types">
              <MeetingTypesManager meetingTypes={meetingTypes} businessId={selectedBusinessId} />
            </TabsContent>

            <TabsContent value="bookings">
              <AdminBookingsList bookings={bookings} businessId={selectedBusinessId} />
            </TabsContent>

            <TabsContent value="history">
              <MeetingHistory bookings={bookings} />
            </TabsContent>

            <TabsContent value="users">
              <UsersManager
                users={users}
                currentUserId={currentUserId}
                slots={slots}
                meetingTypes={meetingTypes}
                businessId={selectedBusinessId}
              />
            </TabsContent>

            <TabsContent value="branding">
              <BrandingManager business={selectedBusiness} />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  )
}

