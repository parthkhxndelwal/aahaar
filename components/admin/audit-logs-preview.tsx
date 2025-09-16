"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Activity, User, ShoppingCart, Settings, Shield, AlertTriangle, Eye, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"

interface AuditLog {
  id: string
  action: string
  entityType: string
  entityId?: string
  oldValues?: any
  newValues?: any
  metadata?: any
  ipAddress?: string
  userAgent?: string
  createdAt: string
  user?: {
    id: string
    fullName: string
    email: string
    role: string
  }
  court?: {
    courtId: string
    instituteName: string
  }
}

interface AuditLogsPreviewProps {
  courtId: string
  token: string
}

export function AuditLogsPreview({ courtId, token }: AuditLogsPreviewProps) {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchAuditLogsPreview()
  }, [])

  const fetchAuditLogsPreview = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/audit-logs/preview`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setLogs(data.data.logs)
      }
    } catch (error) {
      console.error("Error fetching audit logs preview:", error)
    } finally {
      setLoading(false)
    }
  }

  const getActionIcon = (action: string) => {
    if (action.includes("CREATE") || action.includes("ADD")) return <Activity className="h-4 w-4 text-green-500" />
    if (action.includes("UPDATE") || action.includes("EDIT")) return <Settings className="h-4 w-4 text-blue-500" />
    if (action.includes("DELETE") || action.includes("REMOVE")) return <AlertTriangle className="h-4 w-4 text-red-500" />
    if (action.includes("LOGIN") || action.includes("AUTH")) return <Shield className="h-4 w-4 text-purple-500" />
    if (action.includes("ORDER")) return <ShoppingCart className="h-4 w-4 text-orange-500" />
    return <User className="h-4 w-4 text-gray-500" />
  }

  const getActionColor = (action: string) => {
    if (action.includes("CREATE") || action.includes("ADD")) return "bg-green-100 text-green-800"
    if (action.includes("UPDATE") || action.includes("EDIT")) return "bg-blue-100 text-blue-800"
    if (action.includes("DELETE") || action.includes("REMOVE")) return "bg-red-100 text-red-800"
    if (action.includes("LOGIN") || action.includes("AUTH")) return "bg-purple-100 text-purple-800"
    if (action.includes("ORDER")) return "bg-orange-100 text-orange-800"
    return "bg-gray-100 text-gray-800"
  }

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return `${diffInSeconds} second${diffInSeconds !== 1 ? 's' : ''} ago`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minute${Math.floor(diffInSeconds / 60) !== 1 ? 's' : ''} ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hour${Math.floor(diffInSeconds / 3600) !== 1 ? 's' : ''} ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} day${Math.floor(diffInSeconds / 86400) !== 1 ? 's' : ''} ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} week${Math.floor(diffInSeconds / 604800) !== 1 ? 's' : ''} ago`
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} month${Math.floor(diffInSeconds / 2592000) !== 1 ? 's' : ''} ago`
    return `${Math.floor(diffInSeconds / 31536000)} year${Math.floor(diffInSeconds / 31536000) !== 1 ? 's' : ''} ago`
  }

  const getEntityLink = (log: AuditLog) => {
    if (log.entityType === "order" && log.entityId) {
      return `/admin/${courtId}/orders/${log.entityId}`
    }
    if (log.entityType === "user" && log.entityId) {
      return `/admin/${courtId}/users/${log.entityId}`
    }
    if (log.entityType === "vendor" && log.entityId) {
      return `/admin/${courtId}/vendors/${log.entityId}`
    }
    return null
  }

  const getLogDescription = (log: AuditLog) => {
    const action = log.action.replace(/_/g, ' ').toLowerCase()
    const entity = log.entityType.toLowerCase()
    const userName = log.user?.fullName || 'Unknown user'

    switch (log.action) {
      case 'USER_LOGIN':
        return `${userName} logged into the system`
      case 'ORDER_CREATED':
        return `${userName} created a new order`
      case 'ORDER_STATUS_UPDATED':
        return `${userName} updated order status`
      case 'VENDOR_CREATED':
        return `${userName} added a new vendor`
      case 'COURT_UPDATED':
        return `${userName} updated court settings`
      default:
        return `${userName} performed ${action} on ${entity}`
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest system activities and changes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest system activities and changes</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/admin/${courtId}/audit-logs`)}
          >
            <Eye className="h-4 w-4 mr-2" />
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div
                key={log.id}
                className={`flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors ${
                  getEntityLink(log) ? 'hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer' : ''
                }`}
                onClick={() => {
                  const link = getEntityLink(log)
                  if (link) router.push(link)
                }}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getActionIcon(log.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={getActionColor(log.action)} variant="secondary">
                      {log.action.replace(/_/g, ' ')}
                    </Badge>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTimeAgo(log.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 dark:text-gray-100 leading-tight">
                    {getLogDescription(log)}
                  </p>
                  {log.entityId && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      ID: {log.entityId}
                    </p>
                  )}
                </div>
                {getEntityLink(log) && (
                  <div className="flex-shrink-0">
                    <ArrowRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
