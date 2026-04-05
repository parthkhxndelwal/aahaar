"use client"

import type React from "react"
import Image from "next/image"
import { LayoutSidebar, type NavItem } from "./sidebar"
import { LayoutBottomNav } from "./bottom-nav"
import { RightSidebar } from "./right-sidebar"

interface MainLayoutProps {
  children: React.ReactNode
  navItems: NavItem[]
  user?: {
    name: string
    email: string
    role?: string
  }
  onLogout?: () => void
  appName?: string
  courtId?: string
  courtName?: string
  hideBottomNav?: boolean
}

export function MainLayout({
  children,
  navItems,
  user,
  onLogout,
  appName,
  courtId,
  courtName,
  hideBottomNav,
}: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex max-w-[1400px] mx-auto">
        {/* Left Sidebar — hidden on mobile */}
        <LayoutSidebar
          navItems={navItems}
          user={user}
          onLogout={onLogout}
          appName={appName}
        />

        {/* Center feed */}
        <main className="flex-1 min-w-0 border-x border-border h-screen overflow-y-auto custom-scrollbar-visible">
          {/* Mobile top bar */}
          <div className="md:hidden flex items-center h-14 px-4 border-b border-border bg-background sticky top-0 z-40">
            <div className="w-7 h-7 rounded-full bg-foreground flex items-center justify-center overflow-hidden mr-2.5">
              <Image src="/logo.png" alt="Aahaar" width={18} height={18} className="object-contain" />
            </div>
            <span className="font-bold text-base">{appName ?? "Aahaar"}</span>
          </div>

          {/* Content with padding and bottom spacing on mobile for bottom nav */}
          <div className="px-4 py-6 md:px-6 md:py-8 pb-20 md:pb-8">
            {children}
          </div>
        </main>

        {/* Right Sidebar — visible only on xl */}
        <RightSidebar
          courtId={courtId}
          courtName={courtName}
          role={user?.role}
          userEmail={user?.email}
        />
      </div>

      {/* Mobile bottom nav - can be hidden when using custom bottom nav */}
      {!hideBottomNav && <LayoutBottomNav navItems={navItems} />}
    </div>
  )
}
