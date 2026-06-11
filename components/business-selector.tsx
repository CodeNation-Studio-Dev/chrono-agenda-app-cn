'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Building2, Plus, Search } from 'lucide-react'
import type { Business } from '@/lib/db/schema'

interface BusinessSelectorProps {
  businesses: Business[]
}

export function BusinessSelector({ businesses }: BusinessSelectorProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredBusinesses = businesses.filter((business) =>
    business.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    business.slug.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-svh bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Choose a Business
          </CardTitle>
          <CardDescription>
            Select a business to sign up and schedule meetings, or create your own.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search businesses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Businesses List */}
          {filteredBusinesses.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery ? 'No businesses found' : 'No businesses available'}
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredBusinesses.map((business) => (
                <button
                  key={business.id}
                  onClick={() => router.push(`/${business.slug}/sign-in`)}
                  className="w-full text-left p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-foreground group-hover:text-primary">
                        {business.name}
                      </p>
                      <p className="text-xs text-muted-foreground">/{business.slug}/book</p>
                      {business.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {business.description}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>

          {/* Create Business Button */}
          <Button
            onClick={() => router.push('/create-business')}
            className="w-full"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Your Own Business
          </Button>

          {/* Sign In Link */}
          <div className="text-center text-xs text-muted-foreground">
            Already have an account?{' '}
            <button
              onClick={() => router.push('/sign-in')}
              className="text-primary hover:underline"
            >
              Sign in
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
