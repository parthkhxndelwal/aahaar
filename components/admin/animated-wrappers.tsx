import { motion } from "framer-motion"
import { ReactNode } from "react"

interface AnimatedPageProps {
  children: ReactNode
  className?: string
  delay?: number
}

export function AnimatedPage({ 
  children, 
  className = "space-y-6",
  delay = 0 
}: AnimatedPageProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ 
        duration: 0.5, 
        delay,
        ease: [0.22, 1, 0.36, 1] // Custom easing for smooth feel
      }}
    >
      {children}
    </motion.div>
  )
}

interface AnimatedCardProps {
  children: ReactNode
  className?: string
  delay?: number
  index?: number
}

export function AnimatedCard({ 
  children, 
  className = "",
  delay = 0,
  index = 0 
}: AnimatedCardProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ 
        duration: 0.4, 
        delay: delay + (index * 0.1),
        ease: [0.22, 1, 0.36, 1]
      }}
      whileHover={{ 
        y: -2, 
        transition: { duration: 0.2 } 
      }}
    >
      {children}
    </motion.div>
  )
}

interface StaggeredListProps {
  children: ReactNode
  className?: string
  staggerDelay?: number
}

export function StaggeredList({ 
  children, 
  className = "",
  staggerDelay = 0.1 
}: StaggeredListProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay
          }
        }
      }}
    >
      {children}
    </motion.div>
  )
}
