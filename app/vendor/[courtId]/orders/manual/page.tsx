"use client"

import { use } from "react"
import { useVendorAuth } from "@/contexts/vendor-auth-context"

export default function QuickOrder({ params }: { params: Promise<{ courtId: string }> }) {
  const { user } = useVendorAuth()
  const { courtId } = use(params)

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Quick Order</h1>
      <div className="space-y-4">
        <p className="text-lg text-gray-600">Create a manual order quickly.</p>
        <p className="text-sm text-gray-500">Court ID: {courtId}</p>
        {user && (
          <p className="text-sm text-gray-500">Vendor: {user.fullName || user.email}</p>
        )}
      </div>
    </div>
  )
}
