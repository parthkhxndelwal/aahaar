"use client"
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { getNetworkStatus, isBrowserOnline, onNetworkChange, type NetworkStatus } from "@/lib/network-monitor"

type Status = "online" | "offline" | "degraded"

interface NetworkContextValue {
  status: Status
  isOnline: boolean // navigator.onLine
  serverReachable: boolean // health endpoint reachable
  lastCheckedAt?: number
  refresh: () => Promise<void>
}

const NetworkContext = createContext<NetworkContextValue | undefined>(undefined)

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState<boolean>(true)
  const [serverReachable, setServerReachable] = useState<boolean>(true)
  const [lastCheckedAt, setLastCheckedAt] = useState<number | undefined>(undefined)
  const intervalRef = useRef<number | undefined>(undefined)
  const mountedRef = useRef(false)

  const computeStatus = useCallback((online: boolean, server: boolean): Status => {
    if (!online) return "offline"
    return server ? "online" : "degraded"
  }, [])

  const refresh = useCallback(async () => {
    const status: NetworkStatus = await getNetworkStatus()
    setIsOnline(status.state === "online")
    setServerReachable(status.state === "online" && status.serverReachable)
    setLastCheckedAt(Date.now())
  }, [])

  // Initial check on mount
  useEffect(() => {
    mountedRef.current = true
    // set initial from navigator to avoid flash
    setIsOnline(isBrowserOnline())
    setServerReachable(true)
    refresh()

    // subscribe to native events
    const unsubscribe = onNetworkChange((online) => {
      setIsOnline(online)
      // when coming online, immediately verify server
      if (online) refresh()
      else {
        setServerReachable(false)
        setLastCheckedAt(Date.now())
      }
    })

    // periodic health check while online
    const id = window.setInterval(() => {
      if (isBrowserOnline()) refresh()
    }, 30000) // 30s
    intervalRef.current = id

    return () => {
      mountedRef.current = false
      unsubscribe()
      if (intervalRef.current) window.clearInterval(intervalRef.current)
    }
  }, [refresh])

  const value = useMemo<NetworkContextValue>(() => ({
    status: computeStatus(isOnline, serverReachable),
    isOnline,
    serverReachable,
    lastCheckedAt,
    refresh,
  }), [computeStatus, isOnline, serverReachable, lastCheckedAt, refresh])

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  )
}

export function useNetwork() {
  const ctx = useContext(NetworkContext)
  if (!ctx) throw new Error("useNetwork must be used within NetworkProvider")
  return ctx
}
