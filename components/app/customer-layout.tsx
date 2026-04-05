"use client"

import type React from "react"
import Image from "next/image"
import { CustomerNavigation } from "@/components/app/customer-navigation"

interface CustomerLayoutProps {
  children: React.ReactNode
  courtId: string
  user?: {
    name: string
    email: string
  }
}

export function CustomerLayout({ children, courtId, user }: CustomerLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex max-w-[1200px] mx-auto">
        {/* Sidebar Navigation (Desktop) */}
        <CustomerNavigation courtId={courtId} user={user} />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 md:border-r md:border-border h-screen overflow-y-auto custom-scrollbar">
          {/* Mobile Header */}
          <div className="md:hidden flex items-center h-14 px-4 border-b border-border bg-background sticky top-0 z-40">
            <div className="w-7 h-7 rounded-full bg-foreground flex items-center justify-center overflow-hidden mr-2.5">
              <Image src="/logo.png" alt="Aahaar" width={18} height={18} className="object-contain" />
            </div>
            <span className="font-bold text-base">Aahaar</span>
          </div>

          {/* Page Content */}
          <div className="pb-20 md:pb-8">
            {children}
          </div>
        </main>

        {/* Right Sidebar - Quick Info (Desktop XL only) */}
        <aside className="hidden xl:flex flex-col h-screen sticky top-0 w-[300px] shrink-0 bg-background">
          <div className="flex flex-col h-full p-4 overflow-y-auto custom-scrollbar">
            {/* Court Info */}
            <div className="rounded-2xl border border-border bg-muted/40 p-4 mb-4">
              <h2 className="font-bold text-sm mb-2">Your Food Court</h2>
              <p className="text-xs text-muted-foreground font-mono">{courtId}</p>
            </div>

            {/* User Info */}
            {user && (
              <div className="rounded-2xl border border-border bg-muted/40 p-4 mb-4">
                <h2 className="font-bold text-sm mb-3">Signed in as</h2>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center text-background text-sm font-bold select-none">
                    {user.name?.charAt(0).toUpperCase() ?? "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Help */}
            <div className="rounded-2xl border border-border bg-muted/40 p-4">
              <h2 className="font-bold text-sm mb-2">Need Help?</h2>
              <p className="text-xs text-muted-foreground">
                Contact support for any issues with your orders.
              </p>
            </div>

            {/* Footer */}
            <div className="mt-auto pt-4">
              <p className="text-xs text-muted-foreground">
                &copy; {new Date().getFullYear()} Aahaar
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
