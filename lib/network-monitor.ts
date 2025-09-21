"use client"

export type NetworkStatus =
	| { state: "online"; serverReachable: boolean }
	| { state: "offline"; serverReachable: false }

/** Lightweight utility to check browser online status. */
export const isBrowserOnline = (): boolean => {
	if (typeof navigator === "undefined") return true // assume online during SSR
	return navigator.onLine
}

/** Ping the app's health endpoint with a timeout to detect captive portals or backend outages. */
export async function pingServer(options?: { timeoutMs?: number; path?: string }): Promise<boolean> {
	const timeoutMs = options?.timeoutMs ?? 4000
	const path = options?.path ?? "/api/health"

	if (typeof fetch === "undefined") return true

	const controller = new AbortController()
	const timer = setTimeout(() => controller.abort(), timeoutMs)
	try {
		const res = await fetch(path, {
			method: "GET",
			cache: "no-store",
			headers: { "x-network-check": "1" },
			signal: controller.signal,
		})
		clearTimeout(timer)
		return res.ok
	} catch {
		clearTimeout(timer)
		return false
	}
}

/** Get combined network status: navigator.onLine and server reachability. */
export async function getNetworkStatus(): Promise<NetworkStatus> {
	const online = isBrowserOnline()
	if (!online) return { state: "offline", serverReachable: false }
	const serverReachable = await pingServer().catch(() => false)
	return serverReachable
		? { state: "online", serverReachable: true }
		: { state: "online", serverReachable: false }
}

/** Subscribe to native online/offline events. Returns an unsubscribe function. */
export function onNetworkChange(cb: (online: boolean) => void): () => void {
	if (typeof window === "undefined") return () => {}
	const handleOnline = () => cb(true)
	const handleOffline = () => cb(false)
	window.addEventListener("online", handleOnline)
	window.addEventListener("offline", handleOffline)
	return () => {
		window.removeEventListener("online", handleOnline)
		window.removeEventListener("offline", handleOffline)
	}
}

