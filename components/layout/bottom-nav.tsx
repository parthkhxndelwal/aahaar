"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import type { NavItem } from "./sidebar"

interface LayoutBottomNavProps {
  navItems: NavItem[]
}

export function LayoutBottomNav({ navItems }: LayoutBottomNavProps) {
  const pathname = usePathname()

  // Show at most 5 items in the bottom nav
  const visibleItems = navItems.slice(0, 5)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background border-t border-border">
      <div className="flex items-center justify-around h-16 px-2">
        {visibleItems.map((item) => {
          const Icon = item.icon
          const hrefSegments = item.href.replace(/\/$/, "").split("/").filter(Boolean)
          const isRootItem = hrefSegments.length <= 2
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
                "flex flex-col items-center gap-1 flex-1 py-2 px-1 rounded-xl transition-colors",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "p-1.5 rounded-full transition-colors",
                  isActive ? "bg-foreground" : ""
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5",
                    isActive ? "text-background" : ""
                  )}
                />
              </div>
              <span className="text-[10px] font-medium leading-none truncate max-w-[48px] text-center">
                {item.title}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
