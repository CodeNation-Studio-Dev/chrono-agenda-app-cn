'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { PaymentForm } from '@/components/payment-form'
import { Briefcase, ArrowRight } from 'lucide-react'

export function CreateBusinessRequest() {
  const router = useRouter()
  const [showPayment, setShowPayment] = useState(false)

  if (showPayment) {
    return <PaymentForm onSuccess={() => setShowPayment(false)} />
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          Request to Create Business
        </CardTitle>
        <CardDescription>
          Upgrade your account to Admin and create your own business. This requires a one-time payment.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 text-sm text-muted-foreground">
          <p>As an Admin, you will be able to:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Create and manage your own business</li>
            <li>Set up meeting types and availability</li>
            <li>Manage bookings and clients</li>
            <li>Access the admin dashboard</li>
          </ul>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={() => setShowPayment(true)} 
          className="w-full"
        >
          Continue to Payment
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
