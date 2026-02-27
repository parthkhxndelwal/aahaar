import type React from "react"
import { VendorAuthProvider } from "@/contexts/vendor-auth-context"
import { SocketConnectionProvider } from "@/contexts/socket-connection-context"
import { ConnectionStatus, ConnectionRetryBanner } from "@/components/ui/connection-status"

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <VendorAuthProvider>
      <SocketConnectionProvider namespace="/vendor" showLoadingScreen={false} autoConnect={false}>
        <ConnectionRetryBanner />
        <ConnectionStatus position="bottom-right" compact />
        {children}
      </SocketConnectionProvider>
    </VendorAuthProvider>
  )
}
