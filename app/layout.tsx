import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "@/app/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/toaster"
import { NetworkProvider } from "@/contexts/network-context"
import CacheStatus from "@/components/cache-status"
import OfflineGate from "@/components/offline-gate"
import { Providers } from "./providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Aahaar",
  description: "Complete SaaS solution for Food court management",
  manifest: "/app-manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Aahaar App'
  },
  openGraph: {
    type: 'website',
    title: 'Aahaar',
    description: 'Order food from your favorite food court vendors',
    siteName: 'Aahaar'
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'msapplication-TileColor': '#3B82F6',
    'msapplication-config': '/browserconfig.xml'
  }
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#ffffff',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} overflow-x-hidden w-full max-w-full touch-manipulation`} style={{ touchAction: 'manipulation' }}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <Providers>
            <NetworkProvider>
              <OfflineGate />
              <CacheStatus />
              {children}
              <Toaster />
            </NetworkProvider>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
