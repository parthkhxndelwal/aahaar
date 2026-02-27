import type React from "react"
import { AppAuthProvider } from "@/contexts/app-auth-context"
import { SocketConnectionProvider } from "@/contexts/socket-connection-context"
import { ConnectionStatus, ConnectionRetryBanner } from "@/components/ui/connection-status"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppAuthProvider>
      <SocketConnectionProvider namespace="/app" showLoadingScreen={false} autoConnect={false}>
        <ConnectionRetryBanner />
        <ConnectionStatus position="bottom-right" compact />
        {children}
      </SocketConnectionProvider>
    </AppAuthProvider>
  )
}
