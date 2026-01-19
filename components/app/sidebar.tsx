"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Store, Settings, Building2 } from "lucide-react"

interface SidebarProps {
  courtId: string
}

export function Sidebar({ courtId }: SidebarProps) {
  const pathname = usePathname()

  const navigationItems = [
    {
      name: "Home",
      href: `/app/${courtId}`,
      icon: Home,
    },
    {
      name: "Vendors",
      href: `/app/${courtId}/vendors`,
      icon: Store,
    },
    {
      name: "Settings",
      href: `/app/${courtId}/settings`,
      icon: Settings,
    },
  ]

  return (
    <div className="w-64 h-screen bg-neutral-900 border-r border-neutral-800 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-white">Food Court</h2>
            <p className="text-sm text-neutral-400">{courtId}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-neutral-300 hover:text-white hover:bg-neutral-800"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-neutral-800">
        <div className="text-xs text-neutral-500 text-center">
          Aahaar Food Court
        </div>
      </div>
    </div>
  )
}
