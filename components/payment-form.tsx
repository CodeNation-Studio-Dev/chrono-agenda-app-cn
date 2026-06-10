'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { upgradeUserToAdmin } from '@/app/actions/admin-upgrade'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { CreditCard, CheckCircle2, Loader2 } from 'lucide-react'

interface PaymentFormProps {
  onSuccess: () => void
  /** Custom async action to run on successful payment. Defaults to upgradeUserToAdmin + redirect /admin. */
  onPay?: () => Promise<void>
  successTitle?: string
  successDescription?: string
}

export function PaymentForm({ onSuccess, onPay, successTitle, successDescription }: PaymentFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [cvv, setCvv] = useState('')
  const [loading, setLoading] = useState(false)
  const [paymentComplete, setPaymentComplete] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Simulate payment processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    try {
      if (onPay) {
        await onPay()
      } else {
        // Default: upgrade user to admin role
        await upgradeUserToAdmin()
      }

      setPaymentComplete(true)
      toast({
        title: successTitle ?? 'Payment Successful!',
        description: successDescription ?? 'Your account has been upgraded to Admin.',
      })

      setTimeout(() => {
        onSuccess()
        if (!onPay) {
          router.push('/admin')
          router.refresh()
        }
      }, 1500)
    } catch (error) {
      toast({
        title: 'Payment Failed',
        description: error instanceof Error ? error.message : 'There was an error processing your payment. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (paymentComplete) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">{successTitle ?? 'Payment Successful!'}</CardTitle>
          <CardDescription>
            {successDescription ?? 'Your account has been upgraded to Admin. Redirecting...'}
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Complete Your Payment
        </CardTitle>
        <CardDescription>
          Enter your card details to upgrade to Admin access. This is a simulated payment for demonstration purposes.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cardName">Name on Card</Label>
            <Input
              id="cardName"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cardNumber">Card Number</Label>
            <Input
              id="cardNumber"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
              placeholder="4242 4242 4242 4242"
              maxLength={19}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiry">Expiry Date</Label>
              <Input
                id="expiry"
                value={expiryDate}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, '').slice(0, 4)
                  if (value.length >= 2) {
                    value = value.slice(0, 2) + '/' + value.slice(2)
                  }
                  setExpiryDate(value)
                }}
                placeholder="MM/YY"
                maxLength={5}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvv">CVV</Label>
              <Input
                id="cvv"
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="123"
                maxLength={4}
                required
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Pay $99.00 - Upgrade to Admin
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
