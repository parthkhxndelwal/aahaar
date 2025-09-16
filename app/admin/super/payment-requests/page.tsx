"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { CreditCard, CheckCircle, XCircle, Eye, AlertTriangle, Lock, Copy } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"

interface PaymentRequest {
  id: string
  vendorId: string
  courtId: string
  businessName: string
  beneficiaryName: string
  accountNumber: string
  ifscCode: string
  bankName?: string
  businessType: string
  businessCategory: string
  businessSubcategory: string
  status: 'pending' | 'approved' | 'rejected'
  razorpayAccountId?: string
  razorpayStakeholderId?: string
  razorpayProductId?: string
  rejectionReason?: string
  rejectedAt?: string
  rejectedBy?: string
  approvedAt?: string
  approvedBy?: string
  resubmissionMessage?: string
  createdAt: string
  updatedAt: string
  vendor: {
    id: string
    stallName: string
    vendorName: string
    contactEmail: string
    contactPhone: string
    logoUrl?: string
    cuisineType?: string
    onboardingStatus: string
  }
  court: {
    id: string
    name: string
  }
}

interface PaymentRequestsResponse {
  paymentRequests: PaymentRequest[]
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export default function SuperAdminPaymentRequestsPage() {
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    totalPages: 1,
    totalItems: 0,
    hasNext: false,
    hasPrev: false,
  })

  const { toast } = useToast()

  // Copy functionality state
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [pin, setPin] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)

  // Action dialogs
  const [approveDialog, setApproveDialog] = useState<{ open: boolean; request?: PaymentRequest }>({ open: false })
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; request?: PaymentRequest }>({ open: false })
  const [razorpayAccountId, setRazorpayAccountId] = useState("")
  const [rejectionReason, setRejectionReason] = useState("")

  useEffect(() => {
    if (isAuthenticated) {
      fetchPaymentRequests()
    }
  }, [isAuthenticated, currentPage])

  const handlePinAuthentication = async () => {
    if (pin !== "1199") {
      alert("Invalid PIN")
      return
    }

    setAuthLoading(true)
    // Simulate authentication delay
    setTimeout(() => {
      setIsAuthenticated(true)
      setAuthLoading(false)
    }, 1000)
  }

  const copyToClipboard = async (text: string, label: string, fieldId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(fieldId)
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      })
      // Reset the copied state after 1 second
      setTimeout(() => {
        setCopiedField(null)
      }, 1000)
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      })
    }
  }

  const fetchPaymentRequests = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
      })

      const response = await fetch(`/api/admin/payment-requests?${params}`)
      const result = await response.json()

      if (result.success) {
        setPaymentRequests(result.data.paymentRequests)
        setPagination(result.data.pagination)
      }
    } catch (error) {
      console.error("Failed to fetch payment requests:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!approveDialog.request || !razorpayAccountId.trim()) {
      alert("Razorpay Account ID is required")
      return
    }

    const buttonId = `approve-${approveDialog.request.id}`
    try {
      setActionLoading(buttonId)

      const response = await fetch('/api/admin/payment-requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: approveDialog.request.id,
          action: 'approve',
          razorpayAccountId: razorpayAccountId.trim(),
          pin: '1199',
        }),
      })

      const result = await response.json()

      if (result.success) {
        await fetchPaymentRequests()
        setApproveDialog({ open: false })
        setRazorpayAccountId("")
        alert('Payment request approved successfully!')
      } else {
        alert(`Failed to approve payment request: ${result.message}`)
      }
    } catch (error) {
      console.error('Failed to approve payment request:', error)
      alert('Failed to approve payment request. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async () => {
    if (!rejectDialog.request || !rejectionReason.trim()) {
      alert("Rejection reason is required")
      return
    }

    const buttonId = `reject-${rejectDialog.request.id}`
    try {
      setActionLoading(buttonId)

      const response = await fetch('/api/admin/payment-requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: rejectDialog.request.id,
          action: 'reject',
          rejectionReason: rejectionReason.trim(),
          pin: '1199',
        }),
      })

      const result = await response.json()

      if (result.success) {
        await fetchPaymentRequests()
        setRejectDialog({ open: false })
        setRejectionReason("")
        alert('Payment request rejected successfully!')
      } else {
        alert(`Failed to reject payment request: ${result.message}`)
      }
    } catch (error) {
      console.error('Failed to reject payment request:', error)
      alert('Failed to reject payment request. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-900">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
              <Lock className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-2xl">Super Admin Access</CardTitle>
            <CardDescription>
              Enter PIN to access payment request management
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pin">PIN Code</Label>
              <Input
                id="pin"
                type="password"
                placeholder="Enter PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handlePinAuthentication()}
              />
            </div>
            <Button
              onClick={handlePinAuthentication}
              disabled={authLoading || pin.length === 0}
              className="w-full"
            >
              {authLoading ? (
                <>
                  <Spinner size={16} variant="light" className="mr-2" />
                  Authenticating...
                </>
              ) : (
                'Access Dashboard'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold dark:text-neutral-200">Payment Requests</h1>
          <p className="text-muted-foreground dark:text-neutral-400">
            Review and manage vendor payment setup requests
          </p>
        </div>
        <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-200">
          Super Admin Access
        </Badge>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size={32} />
        </div>
      ) : paymentRequests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Payment Requests</h3>
            <p className="text-muted-foreground text-center">
              There are currently no pending payment requests to review.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {paymentRequests.map((request) => (
            <Card key={request.id} className="dark:bg-neutral-900 dark:border-neutral-800">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {request.vendor.logoUrl ? (
                      <Image
                        src={request.vendor.logoUrl}
                        alt={request.vendor.stallName}
                        width={48}
                        height={48}
                        className="rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-neutral-200 dark:bg-neutral-700 rounded-lg flex items-center justify-center">
                        <CreditCard className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-lg dark:text-white">{request.vendor.stallName}</CardTitle>
                      <CardDescription className="dark:text-neutral-400">
                        {request.vendor.vendorName} • {request.court.name}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(request.status)}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="font-semibold">Bank Details</Label>
                    <div className="space-y-1 mt-1">
                      <p className="flex items-center gap-2">
                        <span><strong>Account:</strong> {request.accountNumber}</span>
                        {copiedField === `${request.id}-accountNumber` ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy 
                            className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer" 
                            onClick={() => copyToClipboard(request.accountNumber, "Account Number", `${request.id}-accountNumber`)}
                          />
                        )}
                      </p>
                      <p className="flex items-center gap-2">
                        <span><strong>IFSC:</strong> {request.ifscCode}</span>
                        {copiedField === `${request.id}-ifscCode` ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy 
                            className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer" 
                            onClick={() => copyToClipboard(request.ifscCode, "IFSC Code", `${request.id}-ifscCode`)}
                          />
                        )}
                      </p>
                      <p className="flex items-center gap-2">
                        <span><strong>Holder:</strong> {request.beneficiaryName}</span>
                        {copiedField === `${request.id}-beneficiaryName` ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy 
                            className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer" 
                            onClick={() => copyToClipboard(request.beneficiaryName, "Account Holder Name", `${request.id}-beneficiaryName`)}
                          />
                        )}
                      </p>
                      <p className="flex items-center gap-2">
                        <span><strong>Bank:</strong> {request.bankName}</span>
                        {copiedField === `${request.id}-bankName` ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy 
                            className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer" 
                            onClick={() => copyToClipboard(request.bankName || "", "Bank Name", `${request.id}-bankName`)}
                          />
                        )}
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label className="font-semibold">Business Details</Label>
                    <div className="space-y-1 mt-1">
                      <p className="flex items-center gap-2">
                        <span><strong>Business Name:</strong> {request.businessName}</span>
                        {copiedField === `${request.id}-businessName` ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy 
                            className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer" 
                            onClick={() => copyToClipboard(request.businessName, "Business Name", `${request.id}-businessName`)}
                          />
                        )}
                      </p>
                      <p className="flex items-center gap-2">
                        <span><strong>Type:</strong> {request.businessType}</span>
                        {copiedField === `${request.id}-businessType` ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy 
                            className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer" 
                            onClick={() => copyToClipboard(request.businessType, "Business Type", `${request.id}-businessType`)}
                          />
                        )}
                      </p>
                      <p className="flex items-center gap-2">
                        <span><strong>Category:</strong> {request.businessCategory}</span>
                        {copiedField === `${request.id}-businessCategory` ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy 
                            className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer" 
                            onClick={() => copyToClipboard(request.businessCategory, "Business Category", `${request.id}-businessCategory`)}
                          />
                        )}
                      </p>
                      <p className="flex items-center gap-2">
                        <span><strong>Vendor Email:</strong> {request.vendor.contactEmail}</span>
                        {copiedField === `${request.id}-contactEmail` ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy 
                            className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer" 
                            onClick={() => copyToClipboard(request.vendor.contactEmail, "Vendor Email", `${request.id}-contactEmail`)}
                          />
                        )}
                      </p>
                      <p className="flex items-center gap-2">
                        <span><strong>Vendor Phone:</strong> {request.vendor.contactPhone}</span>
                        {copiedField === `${request.id}-contactPhone` ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy 
                            className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer" 
                            onClick={() => copyToClipboard(request.vendor.contactPhone, "Vendor Phone", `${request.id}-contactPhone`)}
                          />
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {request.resubmissionMessage && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Label className="font-semibold text-blue-800 dark:text-blue-200">Resubmission Message</Label>
                          {copiedField === `${request.id}-resubmissionMessage` ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy 
                              className="h-4 w-4 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 cursor-pointer" 
                              onClick={() => copyToClipboard(request.resubmissionMessage!, "Resubmission Message", `${request.id}-resubmissionMessage`)}
                            />
                          )}
                        </div>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">{request.resubmissionMessage}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t dark:border-neutral-700">
                  <div className="text-sm text-muted-foreground">
                    Requested on {new Date(request.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex gap-2">
                    {request.status === 'pending' && (
                      <>
                        <Dialog open={approveDialog.open && approveDialog.request?.id === request.id} onOpenChange={(open) => setApproveDialog({ open, request: open ? request : undefined })}>
                          <DialogTrigger asChild>
                            <Button variant="default" size="sm" className="gap-2 bg-green-600 hover:bg-green-700">
                              <CheckCircle className="h-4 w-4" />
                              Approve
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Approve Payment Request</DialogTitle>
                              <DialogDescription>
                                Enter the Razorpay account ID for {request.vendor.stallName}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="razorpay-account-id">Razorpay Account ID</Label>
                                <Input
                                  id="razorpay-account-id"
                                  placeholder="acc_xxxxxxxxxxxxxxxx"
                                  value={razorpayAccountId}
                                  onChange={(e) => setRazorpayAccountId(e.target.value)}
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setApproveDialog({ open: false })}>
                                Cancel
                              </Button>
                              <Button
                                onClick={handleApprove}
                                disabled={actionLoading === `approve-${request.id}` || !razorpayAccountId.trim()}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                {actionLoading === `approve-${request.id}` ? (
                                  <>
                                    <Spinner size={16} variant="light" className="mr-2" />
                                    Approving...
                                  </>
                                ) : (
                                  'Approve Request'
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        <Dialog open={rejectDialog.open && rejectDialog.request?.id === request.id} onOpenChange={(open) => setRejectDialog({ open, request: open ? request : undefined })}>
                          <DialogTrigger asChild>
                            <Button variant="destructive" size="sm" className="gap-2">
                              <XCircle className="h-4 w-4" />
                              Reject
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Reject Payment Request</DialogTitle>
                              <DialogDescription>
                                Provide a reason for rejecting the payment request for {request.vendor.stallName}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="rejection-reason">Rejection Reason</Label>
                                <Textarea
                                  id="rejection-reason"
                                  placeholder="Please provide a detailed reason for rejection..."
                                  value={rejectionReason}
                                  onChange={(e) => setRejectionReason(e.target.value)}
                                  rows={3}
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setRejectDialog({ open: false })}>
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={handleReject}
                                disabled={actionLoading === `reject-${request.id}` || !rejectionReason.trim()}
                              >
                                {actionLoading === `reject-${request.id}` ? (
                                  <>
                                    <Spinner size={16} variant="light" className="mr-2" />
                                    Rejecting...
                                  </>
                                ) : (
                                  'Reject Request'
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </>
                    )}
                    {request.status === 'approved' && request.razorpayAccountId && (
                      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                        <CheckCircle className="h-4 w-4" />
                        Account: {request.razorpayAccountId}
                      </div>
                    )}
                    {request.status === 'rejected' && request.rejectionReason && (
                      <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                        <AlertTriangle className="h-4 w-4" />
                        {request.rejectionReason}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                disabled={!pagination.hasPrev}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                disabled={!pagination.hasNext}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}