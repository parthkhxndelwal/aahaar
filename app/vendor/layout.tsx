import type React from "react"
import { VendorAuthProvider } from "@/contexts/vendor-auth-context"

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <VendorAuthProvider>
      {children}
    </VendorAuthProvider>
  )
}
