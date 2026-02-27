import Image from "next/image"
import { motion } from "framer-motion"

interface SpinnerProps {
  size?: number
  variant?: "dark" | "white"
  className?: string
  animate?: boolean
}

export function Spinner({ 
  size = 24, 
  variant = "dark", 
  className = "",
  animate = true 
}: SpinnerProps) {
  const spinnerSrc = variant === "white" ? "/Spinner_white_275x275.svg" : "/Spinner_dark_275x275.svg"
  
  if (animate) {
    return (
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ 
          duration: 1, 
          repeat: Infinity, 
          ease: "linear" 
        }}
        className={className}
      >
        <Image
          src={spinnerSrc}
          alt="Loading..."
          width={size}
          height={size}
          priority
        />
      </motion.div>
    )
  }
  
  return (
    <Image
      src={spinnerSrc}
      alt="Loading..."
      width={size}
      height={size}
      className={className}
      priority
    />
  )
}
