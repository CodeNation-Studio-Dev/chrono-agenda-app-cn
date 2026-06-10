'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { createBusiness, deleteBusiness } from '@/app/actions/business'
import { PaymentForm } from '@/components/payment-form'
import { Building2, Plus, Trash2, ExternalLink, ArrowRight, CreditCard } from 'lucide-react'
import type { Business } from '@/lib/db/schema'

interface BusinessesManagerProps {
  businesses: Business[]
  selectedBusinessId: number | null
  onSelectBusiness: (id: number) => void
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

type DialogStep = 'details' | 'payment'

export function BusinessesManager({
  businesses,
  selectedBusinessId,
  onSelectBusiness,
}: BusinessesManagerProps) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogStep, setDialogStep] = useState<DialogStep>('details')
  const [deleteTarget, setDeleteTarget] = useState<Business | null>(null)

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')

  const handleNameChange = (value: string) => {
    setName(value)
    setSlug(slugify(value))
  }

  const resetDialog = () => {
    setDialogStep('details')
    setName('')
    setSlug('')
    setDescription('')
  }

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open)
    if (!open) resetDialog()
  }

  const handleProceedToPayment = () => {
    if (!name.trim()) return
    setDialogStep('payment')
  }

  const handlePay = async () => {
    const biz = await createBusiness({ name, slug, description, membershipPaid: true })
    onSelectBusiness(biz.id)
  }

  const handlePaymentSuccess = () => {
    setDialogOpen(false)
    resetDialog()
    router.refresh()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteBusiness(deleteTarget.id)
      setDeleteTarget(null)
      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete business')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            My Businesses
          </h2>
          <p className="text-sm text-muted-foreground">
            Create and manage your businesses. Clients book via their unique URL.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              New Business
            </Button>
          </DialogTrigger>
          <DialogContent>
            {dialogStep === 'details' ? (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    New Business — Step 1 of 2
                  </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="biz-name">Business Name</Label>
                    <Input
                      id="biz-name"
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="My Salon"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="biz-slug">
                      URL Slug
                      <span className="text-muted-foreground font-normal ml-1">
                        (/{slug || 'your-slug'}/book)
                      </span>
                    </Label>
                    <Input
                      id="biz-slug"
                      value={slug}
                      onChange={(e) => setSlug(slugify(e.target.value))}
                      placeholder="my-salon"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="biz-desc">Description (optional)</Label>
                    <Textarea
                      id="biz-desc"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                      placeholder="A short description shown on the booking page"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleProceedToPayment} disabled={!name.trim()}>
                    <CreditCard className="h-4 w-4" />
                    Proceed to Payment
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <div className="space-y-4">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    New Business — Step 2 of 2: Payment
                  </DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">
                  Complete the membership payment to create <strong>{name}</strong>.
                </p>
                <PaymentForm
                  onPay={handlePay}
                  onSuccess={handlePaymentSuccess}
                  successTitle="Business Created!"
                  successDescription={`"${name}" has been added to your account.`}
                />
                <Button variant="ghost" size="sm" className="w-full" onClick={() => setDialogStep('details')}>
                  ← Back to Details
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {businesses.length === 0 ? (
        <Card className="p-12 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No businesses yet</h3>
          <p className="text-muted-foreground">
            Create your first business to start accepting bookings.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {businesses.map((biz) => (
            <Card
              key={biz.id}
              className={`p-4 cursor-pointer transition-colors ${
                selectedBusinessId === biz.id
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'hover:border-primary/50'
              }`}
              onClick={() => onSelectBusiness(biz.id)}
            >
              <CardHeader className="p-0 mb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary shrink-0" />
                  <span className="truncate">{biz.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 space-y-2">
                {biz.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{biz.description}</p>
                )}
                <p className="text-xs text-muted-foreground font-mono">/{biz.slug}/book</p>
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    variant={selectedBusinessId === biz.id ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectBusiness(biz.id)
                    }}
                  >
                    {selectedBusinessId === biz.id ? 'Selected' : 'Select'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    asChild
                    onClick={(e) => e.stopPropagation()}
                  >
                    <a href={`/${biz.slug}/book`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteTarget(biz)
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Business</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.name}</strong> and all its
              meeting types, availability slots, and bookings. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

}
