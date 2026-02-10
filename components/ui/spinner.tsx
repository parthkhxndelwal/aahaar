import Image from "next/image"

interface SpinnerProps {
  size?: number
  variant?: "dark" | "white"
  className?: string
}

export function Spinner({ size = 24, variant = "dark", className = "" }: SpinnerProps) {
  const spinnerSrc = variant === "white" ? "/Spinner_white_275x275.svg" : "/Spinner_dark_275x275.svg"
  
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
