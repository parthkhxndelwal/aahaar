"use client"

import { useState, useEffect, use } from "react"
import { useAdminAuth } from "@/contexts/admin-auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Search, Filter, ChevronLeft, ChevronRight, Activity, User, ShoppingCart, Settings, Shield, AlertTriangle } from "lucide-react"
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

interface PaginationData {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export default function AuditLogsPage({ params }: { params: Promise<{ courtId: string }> }) {
  const { user, token } = useAdminAuth()
  const router = useRouter()
  const { courtId } = use(params)
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<PaginationData | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [actionFilter, setActionFilter] = useState("all")
  const [entityFilter, setEntityFilter] = useState("all")

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.push("/admin/auth")
      return
    }
    fetchAuditLogs()
  }, [user, currentPage, actionFilter, entityFilter])

  const fetchAuditLogs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10"
      })

      const response = await fetch(`/api/admin/audit-logs?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setLogs(data.data.logs)
        setPagination(data.data.pagination)
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error)
    } finally {
      setLoading(false)
    }
  }

  const getActionIcon = (action: string) => {
    if (action.includes("CREATE") || action.includes("ADD")) return <Activity className="h-4 w-4 text-green-500 dark:text-green-400" />
    if (action.includes("UPDATE") || action.includes("EDIT")) return <Settings className="h-4 w-4 text-blue-500 dark:text-blue-400" />
    if (action.includes("DELETE") || action.includes("REMOVE")) return <AlertTriangle className="h-4 w-4 text-red-500 dark:text-red-400" />
    if (action.includes("LOGIN") || action.includes("AUTH")) return <Shield className="h-4 w-4 text-purple-500 dark:text-purple-400" />
    if (action.includes("ORDER")) return <ShoppingCart className="h-4 w-4 text-orange-500 dark:text-orange-400" />
    return <User className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
  }

  const getActionColor = (action: string) => {
    if (action.includes("CREATE") || action.includes("ADD")) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    if (action.includes("UPDATE") || action.includes("EDIT")) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    if (action.includes("DELETE") || action.includes("REMOVE")) return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    if (action.includes("LOGIN") || action.includes("AUTH")) return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
    if (action.includes("ORDER")) return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
    return "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200"
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
    //  return `/admin/${courtId}/users/${log.entityId}`
        return null
    }
    if (log.entityType === "vendor" && log.entityId) {
      return `/admin/${courtId}/vendors/${log.entityId}`
    }
    return null
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchTerm === "" ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.user?.fullName && log.user.fullName.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesAction = actionFilter === "all" || log.action === actionFilter
    const matchesEntity = entityFilter === "all" || log.entityType === entityFilter

    return matchesSearch && matchesAction && matchesEntity
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/admin/${courtId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white dark:text-neutral-100">Audit Logs</h1>
            <p className="text-neutral-500 dark:text-neutral-400">Track all system activities and changes</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="USER_LOGIN">User Login</SelectItem>
                <SelectItem value="ORDER_CREATED">Order Created</SelectItem>
                <SelectItem value="ORDER_STATUS_UPDATED">Order Status Updated</SelectItem>
                <SelectItem value="VENDOR_CREATED">Vendor Created</SelectItem>
                <SelectItem value="COURT_UPDATED">Court Updated</SelectItem>
              </SelectContent>
            </Select>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                <SelectItem value="user">Users</SelectItem>
                <SelectItem value="order">Orders</SelectItem>
                <SelectItem value="vendor">Vendors</SelectItem>
                <SelectItem value="court">Court</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs List */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>
            {pagination && `Showing ${filteredLogs.length} of ${pagination.totalItems} logs`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-4 p-4 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
                <div className="flex-shrink-0 mt-1">
                  {getActionIcon(log.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={getActionColor(log.action)}>
                      {log.action.replace(/_/g, ' ')}
                    </Badge>
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">
                      {formatTimeAgo(log.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                    {log.action.replace(/_/g, ' ')} on {log.entityType}
                    {log.entityId && (
                      <span className="text-neutral-600 dark:text-neutral-300"> ({log.entityId})</span>
                    )}
                  </p>
                  {log.user && (
                    <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-2">
                      By: {log.user.fullName} ({log.user.email})
                    </p>
                  )}
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 p-2 rounded">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0">
                  {getEntityLink(log) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(getEntityLink(log)!)}
                    >
                      View Details
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                Page {pagination.currentPage} of {pagination.totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={!pagination.hasPrevPage}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                  disabled={!pagination.hasNextPage}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
