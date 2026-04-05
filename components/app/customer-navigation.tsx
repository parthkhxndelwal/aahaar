"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Package, Store, Settings, ShoppingCart, LogOut, Clock } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { useBottomNav } from "@/contexts/bottom-nav-context"
import { useUnifiedAuth } from "@/contexts/unified-auth-context"
import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useRef, useState } from "react"

interface CustomerNavigationProps {
  courtId: string
  user?: {
    name: string
    email: string
  }
}

export function CustomerNavigation({ courtId, user }: CustomerNavigationProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useUnifiedAuth()
  const { shouldOrderBeVisible, shouldCartBeVisible } = useBottomNav()
  const { getTotalItems } = useCart()
  
  const totalCartItems = getTotalItems()

  // Animation state for cart badge
  const [badgeAnim, setBadgeAnim] = useState(false)
  const prevCount = useRef(totalCartItems)

  useEffect(() => {
    if (totalCartItems !== prevCount.current) {
      setBadgeAnim(true)
      const timeout = setTimeout(() => setBadgeAnim(false), 500)
      prevCount.current = totalCartItems
      return () => clearTimeout(timeout)
    }
  }, [totalCartItems])

  const navigationItems = [
    { name: "Home", href: `/app/${courtId}`, icon: Home },
    { name: "Orders", href: `/app/${courtId}/orders`, icon: Package },
    { name: "Vendors", href: `/app/${courtId}/vendors`, icon: Store },
    { name: "Settings", href: `/app/${courtId}/settings`, icon: Settings },
  ]

  const isActive = (href: string) => {
    const hrefSegments = href.replace(/\/$/, "").split("/").filter(Boolean)
    const isRootItem = hrefSegments.length <= 2
    const normalizedPathname = pathname.replace(/\/$/, "")
    const normalizedHref = href.replace(/\/$/, "")

    return isRootItem
      ? normalizedPathname === normalizedHref
      : normalizedPathname === normalizedHref || pathname.startsWith(normalizedHref + "/")
  }

  const handleLogout = async () => {
    await logout()
    router.push(`/app/${courtId}/login`)
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col h-screen sticky top-0 border-r border-border bg-background">
        <div className="flex flex-col h-full w-[60px] lg:w-[280px] transition-all">
          {/* Logo */}
          <div className="flex items-center h-16 px-3 lg:px-5 border-b border-border shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-foreground flex items-center justify-center shrink-0 overflow-hidden">
                <Image src="/logo.png" alt="Aahaar" width={24} height={24} className="object-contain" />
              </div>
              <span className="hidden lg:block font-bold text-base tracking-tight truncate">
                Aahaar
              </span>
            </div>
          </div>

          {/* Main Navigation */}
          <nav className="flex-1 py-4 px-2 lg:px-3 space-y-1 overflow-y-auto custom-scrollbar">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    active
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="hidden lg:block truncate">{item.name}</span>
                </Link>
              )
            })}

            {/* Divider */}
            <div className="my-4 border-t border-border" />

            {/* Cart Link */}
            <Link
              href={`/app/${courtId}/cart`}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors relative",
                isActive(`/app/${courtId}/cart`)
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <div className="relative">
                <ShoppingCart className="h-5 w-5 shrink-0" />
                {totalCartItems > 0 && (
                  <motion.div
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center"
                    animate={badgeAnim ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <span className="text-[10px] font-bold">
                      {totalCartItems > 9 ? "9+" : totalCartItems}
                    </span>
                  </motion.div>
                )}
              </div>
              <span className="hidden lg:block truncate">Cart</span>
              {totalCartItems > 0 && (
                <span className="hidden lg:block ml-auto text-xs opacity-70">
                  {totalCartItems} items
                </span>
              )}
            </Link>

            {/* Active Order Status */}
            <AnimatePresence>
              {shouldOrderBeVisible && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link
                    href={`/app/${courtId}/orders`}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 transition-colors"
                  >
                    <div className="relative">
                      <Clock className="h-5 w-5 shrink-0" />
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                    </div>
                    <span className="hidden lg:block truncate">Active Order</span>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </nav>

          {/* User & Logout */}
          {user && (
            <div className="shrink-0 p-3 border-t border-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0 text-sm font-semibold text-foreground select-none">
                  {user.name?.charAt(0).toUpperCase() ?? "?"}
                </div>
                <div className="hidden lg:flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-medium truncate">{user.name}</span>
                  <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="hidden lg:flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Log out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 bg-background z-50 md:hidden border-t border-border"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="flex items-center justify-around h-16 px-2 max-w-md mx-auto">
          {/* Main Navigation Items */}
          {navigationItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 flex-1 py-2 transition-colors",
                  active ? "text-foreground" : "text-muted-foreground"
                )}
              >
                <div
                  className={cn(
                    "p-1.5 rounded-full transition-colors",
                    active ? "bg-foreground" : ""
                  )}
                >
                  <Icon className={cn("h-5 w-5", active ? "text-background" : "")} />
                </div>
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            )
          })}

          {/* Cart Button */}
          <Link
            href={`/app/${courtId}/cart`}
            className={cn(
              "flex flex-col items-center gap-0.5 flex-1 py-2 transition-colors relative",
              isActive(`/app/${courtId}/cart`) ? "text-foreground" : "text-muted-foreground"
            )}
          >
            <div
              className={cn(
                "p-1.5 rounded-full transition-colors relative",
                isActive(`/app/${courtId}/cart`) ? "bg-foreground" : ""
              )}
            >
              <ShoppingCart
                className={cn(
                  "h-5 w-5",
                  isActive(`/app/${courtId}/cart`) ? "text-background" : ""
                )}
              />
              {totalCartItems > 0 && (
                <motion.div
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center"
                  animate={badgeAnim ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="text-[9px] font-bold">
                    {totalCartItems > 9 ? "9+" : totalCartItems}
                  </span>
                </motion.div>
              )}
            </div>
            <span className="text-[10px] font-medium">Cart</span>
          </Link>
        </div>

        {/* Active Order Banner (above bottom nav) */}
        <AnimatePresence>
          {shouldOrderBeVisible && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-full left-0 right-0 mb-2 px-4"
            >
              <Link
                href={`/app/${courtId}/orders`}
                className="flex items-center justify-between px-4 py-3 bg-orange-500 text-white rounded-xl shadow-lg mx-auto max-w-md"
              >
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Clock className="h-5 w-5" />
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-white rounded-full animate-pulse" />
                  </div>
                  <span className="font-medium text-sm">Order in progress</span>
                </div>
                <span className="text-sm font-semibold">View Status →</span>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  )
}
