"use client"
import { motion, AnimatePresence } from "framer-motion"
import { usePathname } from "next/navigation"
import { ReactNode, useEffect, useState } from "react"

interface AnimatedLayoutProps {
  children: ReactNode
}

export function AnimatedLayout({ children }: AnimatedLayoutProps) {
  const pathname = usePathname()
  const [direction, setDirection] = useState<"left" | "right">("left")

  useEffect(() => {
    // Store previous path to determine animation direction
    const prevPath = sessionStorage.getItem('prevPath')
    const currentPath = pathname

    if (prevPath && currentPath) {
      // Determine direction based on navigation pattern
      const isGoingBack = isBackNavigation(prevPath, currentPath)
      setDirection(isGoingBack ? "right" : "left")
    }

    sessionStorage.setItem('prevPath', currentPath)
  }, [pathname])

  const isBackNavigation = (from: string, to: string) => {
    // Going back in settings hierarchy
    if (from.includes('/settings/') && to === from.substring(0, from.lastIndexOf('/'))) {
      return true
    }
    
    // Going from deeper settings to shallower
    const fromDepth = from.split('/').length
    const toDepth = to.split('/').length
    
    if (from.includes('/settings/') && to.includes('/settings/') && fromDepth > toDepth) {
      return true
    }

    return false
  }

  const slideVariants = {
    initial: (direction: string) => ({
      x: direction === "left" ? "100%" : "-100%",
      opacity: 0
    }),
    animate: {
      x: 0,
      opacity: 1
    },
    exit: (direction: string) => ({
      x: direction === "left" ? "-100%" : "100%",
      opacity: 0
    })
  }

  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={pathname}
        custom={direction}
        variants={slideVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{
          type: "tween",
          ease: [0.4, 0, 0.2, 1],
          duration: 0.3
        }}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
