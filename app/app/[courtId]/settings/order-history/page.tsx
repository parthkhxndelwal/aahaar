"use client"
import { use } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function OrderHistoryPage({ params }: { params: Promise<{ courtId: string }> }) {
  const { courtId } = use(params)

  return (
    <div className="min-h-screen bg-neutral-950 p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center space-x-3 mb-6">
          <Link href={`/app/${courtId}/settings`}>
            <ArrowLeft className="h-6 w-6 text-white" />
          </Link>
          <h1 className="text-xl font-bold text-white">Order History</h1>
        </div>
        
        <div className="text-center py-20">
          <p className="text-neutral-400">Order history page coming soon...</p>
        </div>
      </div>
    </div>
  )
}
