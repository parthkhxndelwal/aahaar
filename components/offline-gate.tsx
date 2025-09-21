"use client"
import React, { useState } from "react"
import { useNetwork } from "@/contexts/network-context"
import { cn } from "@/lib/utils"

export default function OfflineGate() {
  const { status, refresh, lastCheckedAt } = useNetwork()
  const [checking, setChecking] = useState(false)

  const isOffline = status === "offline"
  if (!isOffline) return null

  const onRetry = async () => {
    setChecking(true)
    try {
      await refresh()
    } finally {
      setChecking(false)
    }
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-[1000] flex flex-col items-center justify-center gap-6",
        "bg-black text-white p-6 text-center"
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Offline notice"
    >
      <div className="space-y-3 max-w-md">
        <h1 className="text-2xl font-semibold">You're offline</h1>
        <p className="opacity-100">
          No internet connection detected. Please check your network to continue using Aahaar.
        </p>
        {lastCheckedAt && (
          <p className="text-xs opacity-70">
            Last checked: {new Date(lastCheckedAt).toLocaleTimeString()}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onRetry}
        className={cn(
          "inline-flex items-center gap-2 rounded-md px-4 py-2",
          "bg-white text-black hover:bg-zinc-100 transition",
          checking && "opacity-70 cursor-wait"
        )}
        disabled={checking}
      >
        {checking ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Checking...
          </span>
        ) : (
          "Try again"
        )}
      </button>
    </div>
  )
}
