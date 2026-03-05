"use client"

import { useState, useEffect, use } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Spinner } from "@/components/ui/spinner"
import { useToast } from "@/hooks/use-toast"
import { Search, Download, RefreshCw, CreditCard, TrendingUp } from "lucide-react"
import { useAdminAuth } from "@/contexts/admin-auth-context"
import { motion, AnimatePresence } from "framer-motion"

interface Payment {
  id: string
  orderId: string
  orderNumber: string
  amount: number
  razorpayOrderId?: string
  razorpayPaymentId?: string
  vendorName: string
  customerName: string
  paymentMethod: "online" | "cod"
  status: "pending" | "completed" | "failed" | "refunded"
  createdAt: string
  updatedAt: string
}

interface PayoutLog {
  id: string
  vendorId: string
  vendorName: string
  amount: number
  razorpayTransferId?: string
  status: "pending" | "processed" | "reversed"
  transferDate: string
  ordersCount: number
}

const paymentStatusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  refunded: "bg-neutral-100 text-neutral-800"
}

const payoutStatusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  processed: "bg-green-100 text-green-800",
  reversed: "bg-red-100 text-red-800"
}

export default function AdminPaymentsPage({ params }: { params: Promise<{ courtId: string }> }) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [payouts, setPayouts] = useState<PayoutLog[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"payments" | "payouts">("payments")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const { toast } = useToast()
  const { token } = useAdminAuth()
  const { courtId } = use(params)

  useEffect(() => {
    fetchPayments()
    fetchPayouts()
  }, [])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/courts/${courtId}/payments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      const result = await response.json()
      if (result.success) {
        setPayments(result.data.payments)
      } else {
        throw new Error(result.message)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch payments",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchPayouts = async () => {
    try {
      const response = await fetch(`/api/courts/${courtId}/payouts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      const result = await response.json()
      if (result.success) {
        setPayouts(result.data.payouts)
      }
    } catch (error: any) {
      console.error("Failed to fetch payouts:", error)
    }
  }

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         payment.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         payment.vendorName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const filteredPayouts = payouts.filter(payout => {
    const matchesSearch = payout.vendorName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || payout.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalRevenue = payments
    .filter(p => p.status === "completed")
    .reduce((sum, p) => sum + Number(p.amount || 0), 0)
  
  const totalPayouts = payouts
    .filter(p => p.status === "processed")
    .reduce((sum, p) => sum + Number(p.amount || 0), 0)

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <motion.div 
        className="flex justify-between items-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-neutral-100">Payments & Payouts</h1>
          <p className="text-neutral-400">Monitor payment flows and vendor payouts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
            fetchPayments()
            fetchPayouts()
          }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center min-h-[400px]"
          >
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <Spinner size={32} variant="white" />
              </div>
              <p className="text-neutral-400">Loading payments data...</p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >

            {/* Stats Cards */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-4 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {[
                { 
                  title: "Total Revenue", 
                  value: `₹${totalRevenue.toLocaleString()}`, 
                  subtitle: "From completed payments",
                  icon: CreditCard
                },
                { 
                  title: "Total Payouts", 
                  value: `₹${totalPayouts.toLocaleString()}`, 
                  subtitle: "Transferred to vendors",
                  icon: TrendingUp
                },
                { 
                  title: "Platform Revenue", 
                  value: `₹${(totalRevenue - totalPayouts).toLocaleString()}`, 
                  subtitle: "Commission earned",
                  icon: TrendingUp
                },
                { 
                  title: "Online Payments", 
                  value: payments.filter(p => p.paymentMethod === "online").length,
                  subtitle: "Digital transactions",
                  icon: CreditCard
                }
              ].map((stat, index) => (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                >
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                      <stat.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            {/* Tab Navigation */}
            <motion.div 
              className="flex space-x-1 bg-neutral-900 p-1 rounded-lg w-fit"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <button
                onClick={() => setActiveTab("payments")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "payments"
                    ? "bg-black text-neutral-100 shadow-sm"
                    : "text-neutral-400 hover:text-neutral-100"
                }`}
              >
                Payments
              </button>
              <button
                onClick={() => setActiveTab("payouts")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "payouts"
                    ? "bg-black text-neutral-100 shadow-sm"
                    : "text-neutral-400 hover:text-neutral-100"
                }`}
              >
                Vendor Payouts
              </button>
            </motion.div>

            {/* Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Input
                        placeholder={`Search ${activeTab}...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="max-w-sm"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        {activeTab === "payments" ? (
                          <>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                            <SelectItem value="refunded">Refunded</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="processed">Processed</SelectItem>
                            <SelectItem value="reversed">Reversed</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.9 }}
            >
              {activeTab === "payments" ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Transactions</CardTitle>
                    <CardDescription>All payment transactions from customers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order #</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Vendor</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Razorpay ID</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPayments.map((payment, index) => (
                          <motion.tr
                            key={payment.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="border-b border-neutral-800 hover:bg-neutral-900/50"
                            style={{ display: "table-row" }}
                          >
                            <TableCell className="font-medium">{payment.orderNumber}</TableCell>
                            <TableCell>{payment.customerName}</TableCell>
                            <TableCell>{payment.vendorName}</TableCell>
                            <TableCell>₹{Number(payment.amount || 0).toFixed(2)}</TableCell>
                            <TableCell className="capitalize">{payment.paymentMethod}</TableCell>
                            <TableCell>
                              <Badge className={paymentStatusColors[payment.status]}>
                                {payment.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-neutral-500">
                              {payment.razorpayPaymentId || payment.razorpayOrderId || "-"}
                            </TableCell>
                            <TableCell>
                              {new Date(payment.createdAt).toLocaleDateString()}
                            </TableCell>
                          </motion.tr>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Vendor Payouts</CardTitle>
                    <CardDescription>Money transferred to vendor accounts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Vendor</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Orders</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Transfer ID</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPayouts.map((payout, index) => (
                          <motion.tr
                            key={payout.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="border-b border-neutral-800 hover:bg-neutral-900/50"
                            style={{ display: "table-row" }}
                          >
                            <TableCell className="font-medium">{payout.vendorName}</TableCell>
                            <TableCell>₹{Number(payout.amount || 0).toFixed(2)}</TableCell>
                            <TableCell>{payout.ordersCount} orders</TableCell>
                            <TableCell>
                              <Badge className={payoutStatusColors[payout.status]}>
                                {payout.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-neutral-500">
                              {payout.razorpayTransferId || "-"}
                            </TableCell>
                            <TableCell>
                              {new Date(payout.transferDate).toLocaleDateString()}
                            </TableCell>
                          </motion.tr>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
