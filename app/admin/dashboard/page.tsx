"use client"

import { useEffect, useState } from "react"
import { useAdminAuth } from "@/contexts/admin-auth-context"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Building2, Plus, Settings, Users, Store } from "lucide-react"
import Link from "next/link"
import { CreateCourtDialog } from "@/components/admin/create-court-dialog"

interface Court {
  id: string
  courtId: string
  instituteName: string
  instituteType: string
  status: string
  logoUrl?: string
}

export default function AdminDashboard() {
  const { user, token } = useAdminAuth()
  const router = useRouter()
  const [courts, setCourts] = useState<Court[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!user || !token) {
      router.push("/admin/auth")
      return
    }

    fetchCourts()
  }, [user, token, router])

  const fetchCourts = async () => {
    try {
      const response = await fetch("/api/admin/courts", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })

      const data = await response.json()
      
      if (data.success) {
        setCourts(data.data)
        // If no courts exist, redirect to onboarding
        if (data.data.length === 0) {
          router.push("/admin/onboarding")
          return
        }
      } else {
        setError(data.message || "Failed to fetch courts")
      }
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
        return "bg-green-500/20 text-green-400 border-green-500/50"
      case "inactive":
        return "bg-gray-500/20 text-gray-400 border-gray-500/50"
      case "suspended":
        return "bg-red-500/20 text-red-400 border-red-500/50"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50"
    }
  }

  const getInstituteTypeIcon = (type: string) => {
    switch (type) {
      case "school":
        return "🏫"
      case "college":
        return "🎓"
      case "office":
        return "🏢"
      case "hospital":
        return "🏥"
      default:
        return "🏫"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-950">
        <div className="flex flex-col items-center gap-4">
          <Spinner size={48} variant="dark" />
          <p className="text-neutral-400">Loading courts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Court Management</h1>
            <p className="text-neutral-400">
              Manage all your food courts from one central dashboard
            </p>
          </div>
          <CreateCourtDialog token={token!} onCourtCreated={fetchCourts} />
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Courts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courts.map((court) => (
            <Card key={court.id} className="bg-neutral-900 border-neutral-800 hover:border-neutral-700 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-neutral-800 rounded-lg flex items-center justify-center text-2xl">
                      {court.logoUrl ? (
                        <img src={court.logoUrl} alt={court.instituteName} className="w-8 h-8 rounded" />
                      ) : (
                        getInstituteTypeIcon(court.instituteType)
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-white text-lg">{court.instituteName}</CardTitle>
                      <CardDescription className="text-neutral-400 text-sm">
                        {court.courtId}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={getStatusColor(court.status)}>
                    {court.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2 text-neutral-400 text-sm">
                    <Building2 className="h-4 w-4" />
                    <span className="capitalize">{court.instituteType}</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    asChild
                    size="sm"
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <Link href={`/admin/${court.courtId}`}>
                      <Settings className="h-4 w-4 mr-2" />
                      Manage
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                  >
                    <Link href={`/admin/${court.courtId}/vendors`}>
                      <Store className="h-4 w-4 mr-2" />
                      Vendors
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                  >
                    <Link href={`/admin/${court.courtId}/users`}>
                      <Users className="h-4 w-4 mr-2" />
                      Users
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {courts.length === 0 && !loading && (
          <div className="text-center py-12">
            <Building2 className="h-16 w-16 text-neutral-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No courts found</h3>
            <p className="text-neutral-400 mb-6">
              Get started by creating your first food court
            </p>
            <CreateCourtDialog token={token!} onCourtCreated={fetchCourts} />
          </div>
        )}
      </div>
    </div>
  )
}
