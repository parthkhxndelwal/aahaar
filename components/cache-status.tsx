"use client"
import React from "react"
import { useNetwork } from "@/contexts/network-context"
import { cn } from "@/lib/utils"

export default function CacheStatus() {
	const { status, serverReachable } = useNetwork()

		// Only show for degraded mode; offline is handled by the full-screen gate
		if (status !== "degraded") return null
		const text = "Connection unstable. Showing cached data where possible."

	return (
		<div
			role="status"
			aria-live="polite"
			className={cn(
				"fixed inset-x-0 top-0 z-50 flex items-center gap-2 px-3 py-2 text-sm",
				"backdrop-blur supports-[backdrop-filter]:bg-opacity-60",
						"bg-amber-500/90 text-black"
			)}
		>
			<span className="inline-flex h-2 w-2 rounded-full bg-current" aria-hidden />
			<span>{text}</span>
		</div>
	)
}

