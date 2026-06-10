import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getCurrentUser, getAdminSlots, getAllMeetingTypes, getAdminBookings, getBusinessUsers } from '@/app/actions/scheduling'
import { getAdminBusinesses } from '@/app/actions/business'
import { Navbar } from '@/components/navbar'
import { AdminDashboard } from '@/components/admin/admin-dashboard'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import type { AvailabilitySlot, MeetingType, Booking, User } from '@/lib/db/schema'

interface BookingWithDetails {
  booking: Booking
  slot: AvailabilitySlot
  meetingType: MeetingType
  client: User
}

export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')
  if (user.role !== 'admin') redirect('/book')

  const businesses = await getAdminBusinesses()

  // For each business, fetch slots, meeting types, bookings, and users in parallel
  const [slotsResults, meetingTypesResults, bookingsResults, usersResults] = await Promise.all([
    Promise.all(businesses.map((b) => getAdminSlots(b.id).then((s) => [b.id, s] as const))),
    Promise.all(businesses.map((b) => getAllMeetingTypes(b.id).then((m) => [b.id, m] as const))),
    Promise.all(businesses.map((b) => getAdminBookings(b.id).then((bks) => [b.id, bks] as const))),
    Promise.all(businesses.map((b) => getBusinessUsers(b.id).then((u) => [b.id, u] as const))),
  ])

  const slotsMap = Object.fromEntries(slotsResults) as Record<number, AvailabilitySlot[]>
  const meetingTypesMap = Object.fromEntries(meetingTypesResults) as Record<number, MeetingType[]>
  const bookingsMap = Object.fromEntries(bookingsResults) as Record<number, BookingWithDetails[]>
  const usersMap = Object.fromEntries(usersResults) as Record<number, User[]>

  return (
    <div className="min-h-svh bg-background">
      <Navbar user={user} />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <AdminPageHeader />

        <AdminDashboard
          businesses={businesses}
          slotsMap={slotsMap}
          meetingTypesMap={meetingTypesMap}
          bookingsMap={bookingsMap}
          usersMap={usersMap}
          currentUserId={user.id}
        />
      </main>
    </div>
  )
}
