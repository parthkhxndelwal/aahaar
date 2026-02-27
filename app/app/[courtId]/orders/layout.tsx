import type React from "react"
import { SocketConnectionProvider } from "@/contexts/socket-connection-context"

export default function AppOrdersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SocketConnectionProvider namespace="/app" showLoadingScreen={true} autoConnect={true}>
      {children}
    </SocketConnectionProvider>
  )
}
