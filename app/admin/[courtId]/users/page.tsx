"use client"

import { useState, useEffect, use } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Search, UserPlus, Mail, Phone, MoreVertical, Ban, CheckCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface User {
  id: string
  fullName: string
  email?: string
  phone?: string
  role: "user" | "vendor" | "admin"
  status: "active" | "inactive" | "pending" | "suspended"
  createdAt: string
  lastLoginAt?: string
  totalOrders: number
  totalSpent: number
}

const statusColors = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
  pending: "bg-yellow-100 text-yellow-800",
  suspended: "bg-red-100 text-red-800"
}

const roleColors = {
  user: "bg-blue-100 text-blue-800",
  vendor: "bg-purple-100 text-purple-800",
  admin: "bg-orange-100 text-orange-800"
}

export default function AdminUsersPage({ params }: { params: Promise<{ courtId: string }> }) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const { toast } = useToast()
  const { token } = useAuth()
  const { courtId } = use(params)

  useEffect(() => {
    fetchUsers()
  }, [roleFilter, statusFilter])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (roleFilter !== "all") params.append("role", roleFilter)
      if (statusFilter !== "all") params.append("status", statusFilter)
      
      const response = await fetch(`/api/courts/${courtId}/users?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      const result = await response.json()
      if (result.success) {
        setUsers(result.data.users)
      } else {
        throw new Error(result.message)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch users",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateUserStatus = async (userId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })
      
      const result = await response.json()
      if (result.success) {
        setUsers(users.map(user => 
          user.id === userId ? { ...user, status: newStatus as any } : user
        ))
        toast({
          title: "Success",
          description: `User ${newStatus === "active" ? "activated" : "deactivated"}`,
        })
      } else {
        throw new Error(result.message)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user status",
        variant: "destructive",
      })
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         (user.phone && user.phone.includes(searchQuery))
    return matchesSearch
  })

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === "active").length,
    newUsersThisMonth: users.filter(u => {
      const userDate = new Date(u.createdAt)
      const now = new Date()
      return userDate.getMonth() === now.getMonth() && userDate.getFullYear() === now.getFullYear()
    }).length,
    totalSpent: users.reduce((sum, u) => sum + (Number(u.totalSpent) || 0), 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-neutral-100">User Management</h1>
          <p className="text-neutral-400">Manage users and their access to the food court</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <UserPlus className="h-4 w-4 mr-2" />
            Invite User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newUsersThisMonth}</div>
            <p className="text-xs text-muted-foreground">New registrations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(stats.totalSpent || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">By all users</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="user">Users</SelectItem>
                <SelectItem value="vendor">Vendors</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>All registered users in your food court</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.fullName}</TableCell>
                  <TableCell>
                    <div>
                      {user.email && (
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </div>
                      )}
                      {user.phone && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          {user.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={roleColors[user.role]}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[user.status]}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.totalOrders || 0}</TableCell>
                  <TableCell>₹{(Number(user.totalSpent) || 0).toLocaleString()}</TableCell>
                  <TableCell>
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : "Never"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={user.status === "active"}
                        onCheckedChange={(checked) => {
                          const newStatus = checked ? "active" : "inactive"
                          updateUserStatus(user.id, newStatus)
                        }}
                        disabled={user.role === "admin"} // Don't allow disabling admin accounts
                      />
                      <span className="text-sm text-muted-foreground">
                        {user.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
