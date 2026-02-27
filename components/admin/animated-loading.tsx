import { motion } from "framer-motion"
import { Spinner } from "@/components/ui/spinner"

interface AnimatedLoadingProps {
  message?: string
  size?: number
  className?: string
}

export function AnimatedLoading({ 
  message = "Loading...", 
  size = 32,
  className = ""
}: AnimatedLoadingProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col items-center justify-center py-12 ${className}`}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="mb-4"
      >
        <Spinner size={size} variant="white" />
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-muted-foreground dark:text-neutral-400"
      >
        {message}
      </motion.p>
    </motion.div>
  )
}
