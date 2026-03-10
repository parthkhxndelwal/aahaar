"use client"

import { useEffect, useState } from "react"
import { useAdminAuth } from "@/contexts/admin-auth-context"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Building2, Settings, Users, Store, LayoutDashboard } from "lucide-react"
import Link from "next/link"
import { CreateCourtDialog } from "@/components/admin/create-court-dialog"
import { DashboardShell } from "@/components/dashboard-shell"

interface Court {
  id: string
  courtId: string
  instituteName: string
  instituteType: string
  status: string
  logoUrl?: string
}

export default function AdminDashboard() {
  const { user, token, logout } = useAdminAuth()
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
        return "bg-green-500/10 text-green-500 hover:bg-green-500/20"
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Spinner size={48} />
      </div>
    )
  }

  const navItems = [
    { title: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { title: "Settings", href: "/admin/profile", icon: Settings },
  ]

  return (
    <DashboardShell 
      navItems={navItems} 
      user={{ name: user?.fullName || 'Admin', email: user?.email || '', role: 'Super Admin' }}
      onLogout={logout}
      appName="Aahaar Admin"
    >
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Court Management</h2>
            <p className="text-muted-foreground">
              Manage all your food courts from one central dashboard.
            </p>
          </div>
          <CreateCourtDialog token={token!} onCourtCreated={fetchCourts} />
        </div>

        {error && (
          <div className="bg-destructive/10 border-l-4 border-destructive p-4 my-6">
            <p className="text-destructive font-medium">{error}</p>
          </div>
        )}

        {/* Courts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
          {courts.map((court) => (
            <Card key={court.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-bold">
                  {court.instituteName}
                </CardTitle>
                <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center text-lg">
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
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">{court.instituteType}</span>
                </div>
                
                <p className="text-sm text-muted-foreground mb-4">
                  ID: {court.courtId}
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <Button asChild className="w-full">
                    <Link href={`/admin/${court.courtId}`}>
                      <Settings className="h-4 w-4 mr-2" />
                      Manage
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/admin/${court.courtId}/vendors`}>
                      <Store className="h-4 w-4 mr-2" />
                      Vendors
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {courts.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center container">
             <div className="bg-muted/50 p-6 rounded-full mb-4">
               <Building2 className="h-10 w-10 text-muted-foreground" />
             </div>
             <h2 className="text-2xl font-semibold tracking-tight">No courts found</h2>
             <p className="text-muted-foreground max-w-sm mt-2 mb-6">
               Get started by creating your first food court environment.
             </p>
             <CreateCourtDialog token={token!} onCourtCreated={fetchCourts} />
          </div>
        )}
    </DashboardShell>
  )
}
