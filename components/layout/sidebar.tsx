"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LogOut } from "lucide-react"
import type { LucideIcon } from "lucide-react"

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
}

interface LayoutSidebarProps {
  navItems: NavItem[]
  user?: {
    name: string
    email: string
    role?: string
  }
  onLogout?: () => void
  appName?: string
}

export function LayoutSidebar({
  navItems,
  user,
  onLogout,
  appName = "Aahaar",
}: LayoutSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col h-screen sticky top-0 border-r border-border bg-background">
      {/* Icon-only on md, full on lg */}
      <div className="flex flex-col h-full w-[60px] lg:w-[240px] transition-all">
        {/* Logo */}
        <div className="flex items-center h-16 px-3 lg:px-5 border-b border-border shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-foreground flex items-center justify-center shrink-0 overflow-hidden">
              <Image src="/logo.png" alt="Aahaar" width={24} height={24} className="object-contain" />
            </div>
            <span className="hidden lg:block font-bold text-base tracking-tight truncate">
              {appName}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 lg:px-3 space-y-0.5 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon
            // Count path segments to detect "root" nav items like Dashboard
            // e.g. /admin/courtId has 2 segments, /admin/courtId/orders has 3
            const hrefSegments = item.href.replace(/\/$/, "").split("/").filter(Boolean)
            const isRootItem = hrefSegments.length <= 2 // e.g. /admin/{courtId}
            const normalizedPathname = pathname.replace(/\/$/, "")
            const normalizedHref = item.href.replace(/\/$/, "")

            const isActive = isRootItem
              ? normalizedPathname === normalizedHref
              : normalizedPathname === normalizedHref ||
                pathname.startsWith(normalizedHref + "/")

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-2 lg:px-3 py-2.5 rounded-full text-sm font-medium transition-colors",
                  isActive
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="hidden lg:block truncate">{item.title}</span>
              </Link>
            )
          })}
        </nav>

        {/* User / Logout */}
        {user && (
          <div className="shrink-0 p-2 lg:p-3 border-t border-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0 text-sm font-semibold text-foreground select-none">
                {user.name?.charAt(0).toUpperCase() ?? "?"}
              </div>
              <div className="hidden lg:flex flex-col min-w-0 flex-1">
                <span className="text-sm font-medium truncate">{user.name}</span>
                <span className="text-xs text-muted-foreground truncate">
                  {user.role ?? user.email}
                </span>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="hidden lg:flex h-8 w-8 items-center justify-center rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Log out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
