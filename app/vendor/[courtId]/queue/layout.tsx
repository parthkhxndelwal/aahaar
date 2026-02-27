import type React from "react"
import { SocketConnectionProvider } from "@/contexts/socket-connection-context"

export default function VendorQueueLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SocketConnectionProvider namespace="/vendor" showLoadingScreen={true} autoConnect={true}>
      {children}
    </SocketConnectionProvider>
  )
}