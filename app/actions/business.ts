'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { user, businesses, businessMembers } from '@/lib/db/schema'
import { and, asc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  const userRecord = await db.select().from(user).where(eq(user.id, session.user.id)).limit(1)
  if (userRecord.length === 0 || userRecord[0].role !== 'admin') {
    throw new Error('Admin access required')
  }
  return session.user.id
}

async function getSessionUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

// Slugify a business name into a URL-safe identifier
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

// Admin: list all businesses owned by the current admin
export async function getAdminBusinesses() {
  const adminId = await requireAdmin()
  return db
    .select()
    .from(businesses)
    .where(and(eq(businesses.ownerId, adminId), eq(businesses.isDisabled, false)))
}

// Public: fetch a business by its slug (used on booking pages)
export async function getBusinessBySlug(slug: string) {
  const rows = await db
    .select()
    .from(businesses)
    .where(and(eq(businesses.slug, slug), eq(businesses.isDisabled, false)))
    .limit(1)
  return rows[0] ?? null
}

// Get the first business slug a user belongs to (used for default client redirects)
export async function getFirstBusinessSlugForUser(userId: string): Promise<string | null> {
  const rows = await db
    .select({ slug: businesses.slug })
    .from(businessMembers)
    .innerJoin(businesses, eq(businessMembers.businessId, businesses.id))
    .where(eq(businessMembers.userId, userId))
    .orderBy(asc(businessMembers.joinedAt))
    .limit(1)

  return rows[0]?.slug ?? null
}

// Admin: create a new business
export async function createBusiness(data: {
  name: string
  description?: string
  logoUrl?: string | null
  slug?: string
  membershipPaid?: boolean
}) {
  const adminId = await requireAdmin()

  const name = data.name.trim()
  if (!name) throw new Error('Business name is required')

  const slug = data.slug?.trim() ? slugify(data.slug) : slugify(name)
  if (!slug) throw new Error('Could not generate a valid slug')

  // Check slug uniqueness
  const existing = await db.select().from(businesses).where(eq(businesses.slug, slug)).limit(1)
  if (existing.length > 0) throw new Error('A business with this URL slug already exists')

  const result = await db
    .insert(businesses)
    .values({
      name,
      description: data.description?.trim() || null,
      logoUrl: data.logoUrl || null,
      slug,
      ownerId: adminId,
      membershipPaid: data.membershipPaid ?? false,
      membershipPaidAt: data.membershipPaid ? new Date() : null,
    })
    .returning()

  revalidatePath('/admin')
  return result[0]
}

// Admin: update an owned business
export async function updateBusiness(
  businessId: number,
  data: { name?: string; description?: string; logoUrl?: string | null },
) {
  const adminId = await requireAdmin()

  // Verify ownership
  const biz = await db
    .select()
    .from(businesses)
    .where(and(eq(businesses.id, businessId), eq(businesses.ownerId, adminId)))
    .limit(1)
  if (biz.length === 0) throw new Error('Business not found')

  await db
    .update(businesses)
    .set({
      name: data.name?.trim() ?? biz[0].name,
      description: data.description !== undefined ? (data.description?.trim() || null) : biz[0].description,
      logoUrl: data.logoUrl !== undefined ? (data.logoUrl || null) : biz[0].logoUrl,
      updatedAt: new Date(),
    })
    .where(eq(businesses.id, businessId))

  revalidatePath('/admin')
  return { success: true }
}

// Admin: delete an owned business (cascades to all related data)
export async function deleteBusiness(businessId: number) {
  const adminId = await requireAdmin()

  const biz = await db
    .select()
    .from(businesses)
    .where(and(eq(businesses.id, businessId), eq(businesses.ownerId, adminId)))
    .limit(1)
  if (biz.length === 0) throw new Error('Business not found')

  await db.delete(businesses).where(eq(businesses.id, businessId))
  revalidatePath('/admin')
}

// Client or admin: join a business (idempotent — safe to call multiple times)
// This also updates the user's role to 'client' if they were 'pending'
export async function joinBusiness(businessId: number) {
  const userId = await getSessionUserId()

  const biz = await db.select().from(businesses).where(eq(businesses.id, businessId)).limit(1)
  if (biz.length === 0) throw new Error('Business not found')

  // Upsert via insert-or-ignore pattern
  await db
    .insert(businessMembers)
    .values({ businessId, userId })
    .onConflictDoNothing()

  // Update user role from 'pending' to 'client' if needed
  const userRecord = await db.select().from(user).where(eq(user.id, userId)).limit(1)
  if (userRecord.length > 0 && userRecord[0].role === 'pending') {
    await db.update(user).set({ role: 'client', updatedAt: new Date() }).where(eq(user.id, userId))
  }
}

// Check whether the current user is a member of a business
export async function isBusinessMember(businessId: number): Promise<boolean> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return false
  const rows = await db
    .select()
    .from(businessMembers)
    .where(and(eq(businessMembers.businessId, businessId), eq(businessMembers.userId, session.user.id)))
    .limit(1)
  return rows.length > 0
}

// Admin: list members of a business (clients)
export async function getBusinessMembers(businessId: number) {
  const adminId = await requireAdmin()

  // Verify ownership
  const biz = await db
    .select()
    .from(businesses)
    .where(and(eq(businesses.id, businessId), eq(businesses.ownerId, adminId)))
    .limit(1)
  if (biz.length === 0) throw new Error('Business not found')

  return db
    .select({ member: businessMembers, user })
    .from(businessMembers)
    .innerJoin(user, eq(businessMembers.userId, user.id))
    .where(eq(businessMembers.businessId, businessId))
}
