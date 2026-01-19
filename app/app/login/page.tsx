"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Search, MapPin, ArrowRight, Building2, ArrowLeft } from "lucide-react"
import { api } from "@/lib/api"

interface Court {
  courtId: string
  instituteName: string
  address?: string
  logoUrl?: string
}

export default function AppLogin() {
  const router = useRouter()
  
  const [courts, setCourts] = useState<Court[]>([])
  const [filteredCourts, setFilteredCourts] = useState<Court[]>([])
  const [loading, setLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null)
  const [open, setOpen] = useState(false)
  const [courtIdInput, setCourtIdInput] = useState("")

  useEffect(() => {
    fetchCourts()
  }, [])

  useEffect(() => {
    // Filter courts based on search query
    if (searchQuery.trim()) {
      const filtered = courts.filter(court =>
        court.instituteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        court.courtId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (court.address && court.address.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      setFilteredCourts(filtered)
    } else {
      setFilteredCourts(courts)
    }
  }, [searchQuery, courts])

  const fetchCourts = async () => {
    try {
      setSearchLoading(true)
      const response = await fetch('/api/courts')
      
      if (response.ok) {
        const data = await response.json()
        setCourts(data.data?.courts || [])
        setFilteredCourts(data.data?.courts || [])
      } else {
        throw new Error('Failed to fetch courts')
      }
    } catch (error) {
      console.error("Error fetching courts:", error)
      setError("Failed to load courts. Please try again.")
    } finally {
      setSearchLoading(false)
    }
  }

  const handleCourtSelection = (court: Court) => {
    setSelectedCourt(court)
    setCourtIdInput(court.courtId)
    setOpen(false)
    setError("")
  }

  const handleDirectCourtIdSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!courtIdInput.trim()) {
      setError("Please enter a court ID or select from the list")
      return
    }
    
    proceedToLogin(courtIdInput.trim())
  }

  const proceedToLogin = (courtId: string) => {
    setLoading(true)
    // Navigate to the court-specific login page
    router.push(`/app/${courtId}/login`)
  }

  const goHome = () => {
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="mb-6">
          <Button variant="ghost" onClick={goHome} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle>Customer Login</CardTitle>
            <CardDescription>Select your food court to continue</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Court Selection */}
            <div className="space-y-4">
              <Label htmlFor="court-search">Find Your Food Court</Label>
              
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                  >
                    {selectedCourt ? (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span className="truncate">{selectedCourt.instituteName}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Search className="h-4 w-4" />
                        <span>Search food courts...</span>
                      </div>
                    )}
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput 
                      placeholder="Search food courts..." 
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                    />
                    <CommandList>
                      {searchLoading ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="ml-2">Loading courts...</span>
                        </div>
                      ) : (
                        <>
                          <CommandEmpty>No food courts found.</CommandEmpty>
                          <CommandGroup>
                            {filteredCourts.map((court) => (
                              <CommandItem
                                key={court.courtId}
                                value={court.courtId}
                                onSelect={() => handleCourtSelection(court)}
                                className="cursor-pointer"
                              >
                                <div className="flex flex-col gap-1 w-full">
                                  <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4" />
                                    <span className="font-medium">{court.instituteName}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {court.courtId}
                                    </Badge>
                                  </div>
                                  {court.address && (
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground ml-6">
                                      <MapPin className="h-3 w-3" />
                                      {court.address}
                                    </div>
                                  )}
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {selectedCourt && (
                <div className="p-4 bg-blue-50 rounded-lg border">
                  <div className="flex items-start gap-3">
                    {selectedCourt.logoUrl ? (
                      <img
                        src={selectedCourt.logoUrl}
                        alt={selectedCourt.instituteName}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-blue-600" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium text-blue-900">{selectedCourt.instituteName}</h3>
                      <p className="text-sm text-blue-700 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {selectedCourt.address || 'No address provided'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or enter court ID directly</span>
              </div>
            </div>

            {/* Direct Court ID Input */}
            <form onSubmit={handleDirectCourtIdSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="courtId">Court ID</Label>
                <Input
                  id="courtId"
                  type="text"
                  placeholder="Enter court ID (e.g., vbs-ghamroj)"
                  value={courtIdInput}
                  onChange={(e) => {
                    setCourtIdInput(e.target.value)
                    setError("")
                    // Clear selected court if user starts typing manually
                    if (selectedCourt && e.target.value !== selectedCourt.courtId) {
                      setSelectedCourt(null)
                    }
                  }}
                />
                <p className="text-xs text-gray-500">
                  Ask your food court staff for the court ID if you don't know it
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || !courtIdInput.trim()}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Continue to Login
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="text-center text-sm text-gray-600">
              <p>
                Don't see your food court? Contact the food court admin to get it listed.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
