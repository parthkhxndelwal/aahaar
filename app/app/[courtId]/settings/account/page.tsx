"use client"
import { use } from "react"
import Link from "next/link"
import { ArrowLeft, User, Bell, ChevronRight, LogOut } from "lucide-react"
import { useUnifiedAuth } from "@/contexts/unified-auth-context"

export default function AccountSettingsPage({ params }: { params: Promise<{ courtId: string }> }) {
  const { courtId } = use(params)
  const { logout } = useUnifiedAuth()

  const accountOptions = [
    {
      title: "Profile Settings",
      description: "Update your personal information and preferences",
      icon: User,
      href: `/app/${courtId}/settings/account/profile`,
    },
    {
      title: "View Activity Log",
      description: "Review recent activity about your account activity",
      icon: Bell,
      href: `/app/${courtId}/settings/account/activity-logs`,
    }
  ]

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center space-x-3 mb-6">
          <Link href={`/app/${courtId}/settings`}>
            <ArrowLeft className="h-6 w-6 text-foreground" />
          </Link>
          <h1 className="text-xl font-bold text-foreground">Account Settings</h1>
        </div>
        
        <div className="space-y-3">
          {accountOptions.map((option, index) => {
            const Icon = option.icon
            return (
              <Link 
                key={index}
                href={option.href}
                className="block"
              >
                <div className="flex items-center justify-between p-4 bg-background border border-border rounded-lg hover:bg-muted transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{option.title}</h3>
                      <p className="text-muted-foreground text-sm">{option.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </Link>
            )
          })}
        </div>

        {/* Logout Button */}
        <div className="pt-6">
          <div className="flex justify-center">
            <button
              onClick={logout}
              className="flex items-center space-x-3 px-6 py-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive hover:bg-destructive/20 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Log out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
