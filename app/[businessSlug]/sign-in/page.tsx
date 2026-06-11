import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getBusinessBySlug, getPublicBusinesses } from '@/app/actions/business'
import { getCurrentUser } from '@/app/actions/scheduling'
import { AuthForm } from '@/components/auth-form'
import { BusinessSelector } from '@/components/business-selector'

interface SignInPageProps {
  params: Promise<{ businessSlug: string }>
}

export async function generateMetadata({ params }: SignInPageProps): Promise<Metadata> {
  const { businessSlug } = await params
  const business = await getBusinessBySlug(businessSlug)

  if (!business) {
    return {
      title: 'Sign In',
      robots: { index: false, follow: false },
    }
  }

  return {
    title: `Sign In to ${business.name}`,
    description: `Sign in to book meetings with ${business.name}.`,
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical: `/${businessSlug}/sign-in`,
    },
  }
}

export default async function SignInPage({ params }: SignInPageProps) {
  const { businessSlug } = await params

  const business = await getBusinessBySlug(businessSlug)
  
  // If business doesn't exist, show selector instead of 404
  if (!business) {
    const businesses = await getPublicBusinesses()
    return <BusinessSelector businesses={businesses} />
  }

  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) {
    const user = await getCurrentUser()
    if (!user) redirect(`/${businessSlug}/sign-in`)

    if (user.role === 'system_manager') {
      redirect('/system-manager')
    }
    
    // Admin: check if owner of this business and redirect to admin
    if (user.role === 'admin' && business.ownerId === user.id) {
      redirect('/admin')
    }
    
    // Client: auto-join and go to booking
    redirect(`/${businessSlug}/book`)
  }

  return <AuthForm mode="sign-in" businessSlug={businessSlug} businessName={business.name} />
}

