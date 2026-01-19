"use client"
import { use } from "react"
import Link from "next/link"
import { User, Settings as SettingsIcon, Clock, ChevronRight } from "lucide-react"

export default function SettingsPage({ params }: { params: Promise<{ courtId: string }> }) {
  const { courtId } = use(params)

  const settingsOptions = [
    {
      title: "Account Settings",
      description: "Manage your personal information and account preferences",
      icon: User,
      href: `/app/${courtId}/settings/account`,
    },
    {
      title: "Order History",
      description: "View your past orders and track current ones",
      icon: Clock,
      href: `/app/${courtId}/settings/order-history`,
    },
    {
      title: "Manage Orders",
      description: "Cancel, modify or reorder from your recent orders",
      icon: SettingsIcon,
      href: `/app/${courtId}/settings/manage-orders`,
    },
    {
      title: "Contact Customer Care",
      description: "Get help and support for your orders and account",
      icon: SettingsIcon,
      href: `/app/${courtId}/settings/contact-care`,
    },
  ]

"use client"
import { use } from "react"
import Link from "next/link"
import { User, Settings as SettingsIcon, Clock, ChevronRight } from "lucide-react"

export default function SettingsPage({ params }: { params: Promise<{ courtId: string }> }) {
  const { courtId } = use(params)

  const settingsOptions = [
    {
      title: "Account Settings",
      description: "Manage your personal information and account preferences",
      icon: User,
      href: `/app/${courtId}/settings/account`,
    },
    {
      title: "Order History",
      description: "View your past orders and track current ones",
      icon: Clock,
      href: `/app/${courtId}/settings/order-history`,
    },
    {
      title: "Manage Orders",
      description: "Cancel, modify or reorder from your recent orders",
      icon: SettingsIcon,
      href: `/app/${courtId}/settings/manage-orders`,
    },
    {
      title: "Contact Customer Care",
      description: "Get help and support for your orders and account",
      icon: SettingsIcon,
      href: `/app/${courtId}/settings/contact-care`,
    },
  ]

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Settings</h1>
        <p className="text-neutral-400">Manage your account and preferences</p>
      </div>
      
      <div className="space-y-3">
        {settingsOptions.map((option, index) => {
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
  )
}
}
