"use client"
import { use } from "react"
import Link from "next/link"
import { ArrowLeft, User, Lock, Bell, HelpCircle, Info, ChevronRight } from "lucide-react"

export default function AccountSettingsPage({ params }: { params: Promise<{ courtId: string }> }) {
  const { courtId } = use(params)

  const accountOptions = [
    {
      title: "Profile Settings",
      description: "Update your personal information and preferences",
      icon: User,
      href: `/app/${courtId}/settings/account/profile`,
    },
    {
      title: "Change Password",
      description: "Update your account password for security",
      icon: Lock,
      href: `/app/${courtId}/settings/account/change-password`,
    },
    {
      title: "Receive Activity Log",
      description: "Get notifications about your account activity",
      icon: Bell,
      href: `/app/${courtId}/settings/account/activity-logs`,
    },
    {
      title: "Security",
      description: "Manage your account security settings",
      icon: Lock,
      href: `/app/${courtId}/settings/account/security`,
    },
    {
      title: "Notifications",
      description: "Control how you receive notifications",
      icon: Bell,
      href: `/app/${courtId}/settings/account/notifications`,
    },
    {
      title: "Help",
      description: "Get help and support for your account",
      icon: HelpCircle,
      href: `/app/${courtId}/settings/account/help`,
    },
    {
      title: "About",
      description: "Learn more about the app and terms",
      icon: Info,
      href: `/app/${courtId}/settings/account/about`,
    },
  ]

  return (
    <div className="min-h-screen bg-neutral-950 p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center space-x-3 mb-6">
          <Link href={`/app/${courtId}/settings`}>
            <ArrowLeft className="h-6 w-6 text-white" />
          </Link>
          <h1 className="text-xl font-bold text-white">Account Settings</h1>
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
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-neutral-100 rounded-lg">
                      <Icon className="h-5 w-5 text-neutral-700" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-black">{option.title}</h3>
                      <p className="text-neutral-600 text-sm">{option.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-neutral-400" />
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
