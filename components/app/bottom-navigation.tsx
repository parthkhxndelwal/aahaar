"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Store, Settings, ShoppingCart, Clock, Package } from "lucide-react"
import { useBottomNav } from "@/contexts/bottom-nav-context"
import { useCart } from "@/contexts/cart-context"
import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useRef, useState } from "react"

interface BottomNavigationProps {
    courtId: string
}

export function BottomNavigation({ courtId }: BottomNavigationProps) {
    const pathname = usePathname()
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
        {
            name: "Home",
            href: `/app/${courtId}`,
            icon: Home,
        },
        {
            name: "Orders",
            href: `/app/${courtId}/orders`,
            icon: Package,
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
        <motion.div 
            className="fixed bottom-0 mb-3 left-0 right-0 bg-white dark:bg-neutral-950 z-50"
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
            <div className="w-full px-2 py-2">
                <motion.div 
                    className="flex items-center gap-3 justify-center h-16 w-full min-w-0"
                    layout
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    style={{ 
                        minWidth: "320px", // Ensure minimum space for all elements
                        maxWidth: "100vw"   // Prevent overflow beyond viewport
                    }}
                >
                    {/* Left section - Order Status (conditional with framer motion) */}
                    <AnimatePresence mode="popLayout">
                        {shouldOrderBeVisible && (
                            <motion.div
                                key="order-button"
                                initial={{ 
                                    opacity: 0, 
                                    x: -120, 
                                    width: 0,
                                    scale: 0.8
                                }}
                                animate={{ 
                                    opacity: 1, 
                                    x: 0, 
                                    width: 120,
                                    scale: 1
                                }}
                                exit={{ 
                                    opacity: 0, 
                                    x: -120, 
                                    width: 0,
                                    scale: 0.8
                                }}
                                transition={{
                                    type: "spring",
                                    stiffness: 400,
                                    damping: 25,
                                    opacity: { duration: 0.2 },
                                    width: { duration: 0.3, ease: "easeInOut" }
                                }}
                                layout
                                className="flex-shrink-0"
                                style={{ overflow: "visible" }}
                            >
                                <motion.button 
                                    className="flex items-center gap-1 px-2 py-2 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white justify-center"
                                    style={{ width: 120 }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    layout="position"
                                >
                                    <motion.svg 
                                        width="10" 
                                        height="10" 
                                        viewBox="0 0 21 21" 
                                        fill="none" 
                                        xmlns="http://www.w3.org/2000/svg"
                                        initial={{ rotate: 0 }}
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 0.5, ease: "easeOut" }}
                                    >
                                        <circle cx="10.5" cy="10.5" r="10.5" fill="#DD0000" />
                                        <circle cx="10.5" cy="10.5" r="7.5" fill="#FF0000" />
                                    </motion.svg>
                                    <motion.span 
                                        className="flex flex-col"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        <span className="text-[12px] font-bold">Order Status</span>
                                        <span className="text-[8px]">Tap to view Status</span>
                                    </motion.span>
                                    <motion.svg 
                                        xmlns="http://www.w3.org/2000/svg" 
                                        height="10px" 
                                        viewBox="0 -960 960 960" 
                                        width="10px" 
                                        className="flex-shrink-0 fill-black dark:fill-white"
                                        initial={{ x: -5, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 0.3 }}
                                    >
                                        <path d="m321-80-71-71 329-329-329-329 71-71 400 400L321-80Z" />
                                    </motion.svg>
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Center section - Main Navigation */}
                    <motion.div 
                        className="flex justify-center flex-shrink-0"
                        layout
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                        <motion.div 
                            className="flex items-center bg-white dark:bg-neutral-900 rounded-2xl px-1 py-1 h-14"
                            layout
                            style={{ minWidth: "180px" }} // Ensure nav links have minimum space
                        >
                            {navigationItems.map((item, index) => {
                                const isActive = pathname === item.href
                                const Icon = item.icon

                                return (
                                    <motion.div
                                        key={item.name}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 + 0.2 }}
                                        className="flex-1"
                                    >
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                "flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-2xl text-xs font-medium transition-colors min-w-[50px] h-12 w-full",
                                                isActive
                                                    ? "bg-black dark:bg-white text-white dark:text-black"
                                                    : "text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                            )}
                                        >
                                            <motion.div
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                transition={{ type: "spring", stiffness: 400 }}
                                            >
                                                <Icon className="h-4 w-4 flex-shrink-0" />
                                            </motion.div>
                                            <span className="text-[9px] truncate">{item.name}</span>
                                        </Link>
                                    </motion.div>
                                )
                            })}
                        </motion.div>
                    </motion.div>

                    {/* Right section - Cart (conditional with framer motion) */}
                    <AnimatePresence mode="popLayout">
                        {shouldCartBeVisible && (
                            <motion.div
                                key="cart-button"
                                initial={{ 
                                    opacity: 0, 
                                    x: 120, 
                                    width: 0,
                                    scale: 0.8
                                }}
                                animate={{ 
                                    opacity: 1, 
                                    x: 0, 
                                    width: shouldOrderBeVisible ? 60 : 120,
                                    scale: 1
                                }}
                                exit={{ 
                                    opacity: 0, 
                                    x: 120, 
                                    width: 0,
                                    scale: 0.8
                                }}
                                transition={{
                                    type: "spring",
                                    stiffness: 400,
                                    damping: 25,
                                    opacity: { duration: 0.2 },
                                    width: { duration: 0.3, ease: "easeInOut" }
                                }}
                                layout
                                className="flex-shrink-0"
                                style={{ overflow: "visible" }}
                            >
                                <Link href={`/app/${courtId}/cart`}>
                                    <motion.div
                                        className="flex items-center gap-1 px-2 py-2 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 active:bg-neutral-300 dark:active:bg-neutral-600 focus:bg-neutral-100 dark:focus:bg-neutral-800 transition-colors justify-center"
                                        style={{ width: shouldOrderBeVisible ? 60 : 120 }}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        layout="position"
                                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                    >
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: 0.1, type: "spring" }}
                                        >
                                            <ShoppingCart className="h-4 w-4 flex-shrink-0" />
                                        </motion.div>
                                        <AnimatePresence>
                                            {!shouldOrderBeVisible && (
                                                <motion.span 
                                                    className="text-xs truncate"
                                                    initial={{ opacity: 0, width: 0 }}
                                                    animate={{ opacity: 1, width: "auto" }}
                                                    exit={{ opacity: 0, width: 0 }}
                                                    transition={{ duration: 0.2, delay: 0.3 }} // 0.3 second delay for "Cart" text only
                                                >
                                                    Cart
                                                </motion.span>
                                            )}
                                        </AnimatePresence>
                                        {/* Cart badge - show count when items in cart */}
                                        {totalCartItems > 0 && (
                                            <motion.div
                                                className="w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center flex-shrink-0"
                                                animate={badgeAnim ? { scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] } : { scale: 1, rotate: 0 }}
                                                transition={{ duration: 0.5, ease: "easeInOut" }}
                                                initial={{ scale: 0 }}
                                                whileInView={{ scale: 1 }}
                                            >
                                                <span className="text-[10px] text-white font-bold">
                                                    {totalCartItems > 99 ? '99+' : totalCartItems}
                                                </span>
                                            </motion.div>
                                        )}
                                    </motion.div>
                                </Link>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </motion.div>
    )
}
