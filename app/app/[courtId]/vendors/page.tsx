"use client"
import { use } from "react"

export default function VendorsPage({ params }: { params: Promise<{ courtId: string }> }) {
  const { courtId } = use(params)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Vendors</h1>
        <p className="text-neutral-400">Browse food vendors in this court</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="p-6 bg-neutral-900 rounded-lg border border-neutral-800">
          <h3 className="font-semibold text-white mb-2">Vendor Management</h3>
          <p className="text-neutral-400 text-sm">Manage and browse food vendors.</p>
        </div>
        
        <div className="p-6 bg-neutral-900 rounded-lg border border-neutral-800">
          <h3 className="font-semibold text-white mb-2">Menu Items</h3>
          <p className="text-neutral-400 text-sm">View all available menu items.</p>
        </div>
        
        <div className="p-6 bg-neutral-900 rounded-lg border border-neutral-800">
          <h3 className="font-semibold text-white mb-2">Vendor Ratings</h3>
          <p className="text-neutral-400 text-sm">Check vendor ratings and reviews.</p>
        </div>
      </div>
    </div>
  )
}
