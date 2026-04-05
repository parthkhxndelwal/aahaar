"use client"

import { useEffect, useState } from "react"
import { useUnifiedAuth } from "@/contexts/unified-auth-context"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Building2, Settings, Store, LogOut, ArrowRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { CreateCourtDialog } from "@/components/admin/create-court-dialog"
import { adminCourtApi } from "@/lib/api"

interface Court {
  id?: string
  courtId: string
  instituteName: string
  instituteType: string
  status: string
  logoUrl?: string
}

export default function AdminDashboard() {
  const { user, token, logout, loading: authLoading } = useUnifiedAuth()
  const router = useRouter()
  const [courts, setCourts] = useState<Court[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (authLoading) return

    if (!user || user.role !== "admin") {
      router.push("/auth/login")
      return
    }

    fetchCourts()
  }, [user, authLoading, router])

  const fetchCourts = async () => {
    try {
      const response = await adminCourtApi.list()
      const courtsData = response.courts || []
      setCourts(courtsData as Court[])
    } catch (error) {
      console.error("Error fetching courts:", error)
      setError("Failed to fetch courts")
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-muted text-foreground hover:bg-muted/80"
      case "inactive":
        return "bg-muted text-muted-foreground hover:bg-muted/80"
      case "suspended":
        return "bg-destructive/10 text-destructive hover:bg-destructive/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getInstituteTypeIcon = (type: string) => {
    switch (type) {
      case "school": return "🏫"
      case "college": return "🎓"
      case "office": return "🏢"
      case "hospital": return "🏥"
      default: return "🏫"
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Spinner size={48} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Simple Header */}
      <header className="border-b border-border bg-background sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-foreground flex items-center justify-center overflow-hidden">
              <Image src="/logo.png" alt="Aahaar" width={24} height={24} className="object-contain" />
            </div>
            <span className="font-bold text-lg">Aahaar Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user?.fullName || user?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Your Food Courts</h1>
            <p className="text-muted-foreground mt-1">
              Select a court to manage or create a new one.
            </p>
          </div>
          <CreateCourtDialog token={token!} onCourtCreated={fetchCourts} />
        </div>

        {error && (
          <div className="bg-destructive/10 border-l-4 border-destructive p-4 mb-6">
            <p className="text-destructive font-medium">{error}</p>
          </div>
        )}

        {/* Courts Grid */}
        {courts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courts.map((court) => (
              <Card key={court.courtId} className="hover:shadow-md transition-shadow group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xl font-bold">
                    {court.instituteName}
                  </CardTitle>
                  <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center text-xl">
                    {court.logoUrl ? (
                      <img src={court.logoUrl} alt={court.instituteName} className="h-full w-full object-cover rounded-md" />
                    ) : (
                      getInstituteTypeIcon(court.instituteType)
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="outline" className={getStatusColor(court.status)}>
                      {court.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">
                      {court.instituteType}
                    </span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-4">
                    ID: {court.courtId}
                  </p>

                  <Button asChild className="w-full group-hover:bg-primary">
                    <Link href={`/admin/${court.courtId}`}>
                      Open Dashboard
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-muted/50 p-6 rounded-full mb-4">
              <Building2 className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">No courts yet</h2>
            <p className="text-muted-foreground max-w-sm mt-2 mb-6">
              Get started by creating your first food court environment.
            </p>
            <CreateCourtDialog token={token!} onCourtCreated={fetchCourts} />
          </div>
        )}
      </main>
    </div>
  )
}
