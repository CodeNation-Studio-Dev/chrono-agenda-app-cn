'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getSessionUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

// Upgrade user role to admin after successful payment
export async function upgradeUserToAdmin() {
  const userId = await getSessionUserId()
  
  await db
    .update(user)
    .set({ 
      role: 'admin',
      updatedAt: new Date(),
    })
    .where(eq(user.id, userId))
  
  revalidatePath('/admin')
  return { success: true }
}

// Check if current user is already an admin
export async function checkIfUserIsAdmin(): Promise<boolean> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return false
  
  const userRecord = await db.select().from(user).where(eq(user.id, session.user.id)).limit(1)
  return userRecord.length > 0 && userRecord[0].role === 'admin'
}
