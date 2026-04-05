"use client"
import { use } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function ActivityLogsPage({ params }: { params: Promise<{ courtId: string }> }) {
  const { courtId } = use(params)

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center space-x-3 mb-6">
          <Link href={`/app/${courtId}/settings/account`}>
            <ArrowLeft className="h-6 w-6 text-foreground" />
          </Link>
          <h1 className="text-xl font-bold text-foreground">Activity Logs</h1>
        </div>
        
        <div className="text-center py-20">
          <p className="text-muted-foreground">Activity logs page coming soon...</p>
        </div>
      </div>
    </div>
  )
}
