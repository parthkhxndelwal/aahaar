import type React from "react"
import { AppAuthProvider } from "@/contexts/app-auth-context"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppAuthProvider>
      {children}
    </AppAuthProvider>
  )
}
