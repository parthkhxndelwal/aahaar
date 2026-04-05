"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { Label } from "@/components/ui/label"
import { Edit, ArrowLeft, Mail, Phone, Store, MapPin, IdCard, Landmark, Banknote, Save, X, CreditCard, Camera, Image as ImageIcon, Key } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { ImageEditorDrawer } from "@/components/image-editor-drawer"
import { adminVendorDetailApi, ApiError } from "@/lib/api"

interface Vendor {
  id: string
  courtId: string
  stallName: string
  vendorName: string
  contactEmail: string
  contactPhone: string
  stallLocation?: string
  cuisineType?: string
  description?: string
  status: "active" | "inactive" | "maintenance" | "suspended"
  isOnline?: boolean
  logoUrl?: string
  bannerUrl?: string
  rating?: number
  totalRatings?: number
  panNumber?: string
  gstin?: string
  bankAccountNumber?: string
  bankIfscCode?: string
  bankAccountHolderName?: string
  bankName?: string
  maxOrdersPerHour?: number
  averagePreparationTime?: number
  razorpayAccountId?: string
  metadata?: {
    businessType?: string
    paymentStatus?: 'not_requested' | 'requested' | 'approved' | 'rejected'
    paymentRequestId?: string
    paymentRejectionReason?: string
    productConfiguration?: any
    registeredAddress?: {
      addressStreet1?: string
      addressStreet2?: string
      addressCity?: string
      addressState?: string
      addressPostalCode?: string
      addressCountry?: string
    }
  }
  createdAt?: string
  updatedAt?: string
}

export default function AdminVendorViewPage() {
  const params = useParams()
  const router = useRouter()
  const courtId = params.courtId as string
  const vendorId = params.vendorId as string

  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusLoading, setStatusLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<Vendor>>({})
  const [editMessage, setEditMessage] = useState<string | null>(null)
  const [editLoading, setEditLoading] = useState(false)

  // Payment request state
  const [paymentRequestLoading, setPaymentRequestLoading] = useState(false)
  const [paymentRequestMessage, setPaymentRequestMessage] = useState<string | null>(null)
  const [resubmissionMessage, setResubmissionMessage] = useState("")

  // Image editor state
  const [imageEditorOpen, setImageEditorOpen] = useState(false)
  const [imageEditorType, setImageEditorType] = useState<'logo' | 'banner'>('logo')

  // Password reset state
  const [passwordResetLoading, setPasswordResetLoading] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordResetStatus, setPasswordResetStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [passwordResetMessage, setPasswordResetMessage] = useState("")

  // Fetch vendor
  const fetchVendor = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await adminVendorDetailApi.getById(vendorId, courtId)
      setVendor(response.vendor as Vendor)
    } catch (e) {
      console.error('[fetchVendor] Error:', e)
      const errorMessage = e instanceof ApiError ? e.message : "Failed to load vendor"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (vendorId && courtId) fetchVendor()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorId, courtId])

  // status color helper for badges
  const statusColor = (status?: string) => {
    switch (status) {
      case "active":
        return "bg-muted text-foreground"
      case "inactive":
        return "bg-muted text-muted-foreground"
      case "maintenance":
        return "bg-muted text-muted-foreground"
      case "suspended":
        return "bg-destructive/10 text-destructive"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  // Status change request
  const handleStatusChange = async (newStatus: string) => {
    try {
      setStatusLoading(true)
      setError(null)

      await adminVendorDetailApi.update(vendorId, { courtId, status: newStatus as any })
      await fetchVendor()
    } catch (e) {
      const errorMessage = e instanceof ApiError ? e.message : 'Failed to update status'
      setError(errorMessage)
    } finally {
      setStatusLoading(false)
    }
  }

  // Editing helpers
  const handleEdit = () => {
    setError(null)
    setEditMessage(null)
    setEditData({
      stallName: vendor?.stallName || '',
      vendorName: vendor?.vendorName || '',
      contactEmail: vendor?.contactEmail || '',
      contactPhone: vendor?.contactPhone || '',
      stallLocation: vendor?.stallLocation || '',
      cuisineType: vendor?.cuisineType || '',
      description: vendor?.description || '',
    })
    setIsEditing(true)
  }

  const hasChanges = () => {
    if (!vendor) return false
    return (
      (editData.stallName !== undefined && editData.stallName !== (vendor.stallName || '')) ||
      (editData.vendorName !== undefined && editData.vendorName !== (vendor.vendorName || '')) ||
      (editData.contactEmail !== undefined && editData.contactEmail !== (vendor.contactEmail || '')) ||
      (editData.contactPhone !== undefined && editData.contactPhone !== (vendor.contactPhone || '')) ||
      (editData.stallLocation !== undefined && editData.stallLocation !== (vendor.stallLocation || '')) ||
      (editData.cuisineType !== undefined && editData.cuisineType !== (vendor.cuisineType || '')) ||
      (editData.description !== undefined && editData.description !== (vendor.description || ''))
    )
  }

  const handleSaveEdit = async () => {
    try {
      setEditLoading(true)
      setError(null)
      setEditMessage(null)

      await adminVendorDetailApi.update(vendorId, { courtId, ...editData } as any)

      setEditMessage('Vendor details updated successfully')
      setIsEditing(false)
      setEditData({})
      await fetchVendor()
    } catch (e) {
      const errorMessage = e instanceof ApiError ? e.message : 'Failed to update vendor'
      setError(errorMessage)
    } finally {
      setEditLoading(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditData({})
    setEditMessage(null)
    setError(null)
  }

  // Payment request
  const handlePaymentRequest = async () => {
    if (!vendor) return
    const paymentStatus = vendor.metadata?.paymentStatus
    if (paymentStatus === 'requested' || paymentStatus === 'approved') {
      setError('Payment request already exists for this vendor')
      return
    }

    try {
      setPaymentRequestLoading(true)
      setError(null)
      setPaymentRequestMessage(null)

      await adminVendorDetailApi.createPaymentRequest({
        vendorId: vendor.id,
        courtId,
        bankAccountNumber: vendor.bankAccountNumber,
        bankIfscCode: vendor.bankIfscCode,
        bankAccountHolderName: vendor.bankAccountHolderName,
        bankName: vendor.bankName,
        panNumber: vendor.panNumber,
        gstin: vendor.gstin,
        businessType: vendor.metadata?.businessType,
        addressStreet1: vendor.metadata?.registeredAddress?.addressStreet1,
        addressStreet2: vendor.metadata?.registeredAddress?.addressStreet2,
        addressCity: vendor.metadata?.registeredAddress?.addressCity,
        addressState: vendor.metadata?.registeredAddress?.addressState,
        addressPostalCode: vendor.metadata?.registeredAddress?.addressPostalCode,
        addressCountry: vendor.metadata?.registeredAddress?.addressCountry,
        resubmissionMessage: resubmissionMessage.trim() || null,
      })

      // If we reach here, the request succeeded (apiClient throws on error)
      setPaymentRequestMessage('Payment request submitted successfully!')
      await fetchVendor()
    } catch (e) {
      const errorMessage = e instanceof ApiError ? e.message : 'Failed to submit payment request. Please try again.'
      setError(errorMessage || 'Failed to submit payment request (no error message)')
    } finally {
      setPaymentRequestLoading(false)
    }
  }

  // Image editor
  const handleOpenImageEditor = (type: 'logo' | 'banner') => {
    setImageEditorType(type)
    setImageEditorOpen(true)
  }

  const handleSaveImage = async (imageUrl: string) => {
    try {
      const field = imageEditorType === 'logo' ? 'logoUrl' : 'bannerUrl'
      await adminVendorDetailApi.update(vendorId, { courtId, [field]: imageUrl } as any)
      await fetchVendor()
      setEditMessage(`${imageEditorType === 'logo' ? 'Logo' : 'Banner'} updated successfully`)
    } catch (e) {
      const errorMessage = e instanceof ApiError ? e.message : `Failed to update ${imageEditorType}`
      setError(errorMessage)
    }
  }

  // Password reset
  const handlePasswordReset = async () => {
    if (!vendor) return

    if (!newPassword || !confirmPassword) {
      setPasswordResetStatus('error')
      setPasswordResetMessage('Please fill in both password fields')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordResetStatus('error')
      setPasswordResetMessage('Passwords do not match')
      return
    }
    if (newPassword.length < 6) {
      setPasswordResetStatus('error')
      setPasswordResetMessage('Password must be at least 6 characters long')
      return
    }

    setPasswordResetLoading(true)
    setPasswordResetStatus('idle')
    setPasswordResetMessage('')

    try {
      await adminVendorDetailApi.resetPassword({
        email: vendor.contactEmail,
        courtId: vendor.courtId,
        newPassword,
      })
      // If we reach here, password reset was successful
      setPasswordResetStatus('success')
      setPasswordResetMessage('Password Reset Successfully')
      setNewPassword('')
      setConfirmPassword('')
    } catch (e) {
      console.error('Failed to reset password:', e)
      setPasswordResetStatus('error')
      const errorMessage = e instanceof ApiError ? e.message : 'Failed to reset password. Please try again.'
      setPasswordResetMessage(errorMessage)
    } finally {
      setPasswordResetLoading(false)
    }
  }

  // Small UI helpers (internal)
  const FieldRow: React.FC<{ icon?: React.ReactNode; label: string; value?: React.ReactNode }> = ({ icon, label, value }) => (
    <div className="flex items-start gap-3">
      <div className="mt-1 text-muted-foreground">{icon}</div>
      <div className="flex-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm text-foreground">{value ?? 'â€”'}</div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => router.push(`/admin/${courtId}/vendors`)}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <div className="text-sm text-muted-foreground">Court ID: <span className="text-foreground ml-2">{courtId}</span></div>
        </div>

        <div className="flex items-center gap-2">
          {vendor && <div className={`px-2 py-1 rounded ${statusColor(vendor.status)} text-xs font-medium`}>{vendor.status}</div>}
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button onClick={handleSaveEdit} disabled={!hasChanges() || editLoading} className="bg-foreground text-background hover:bg-foreground/90">
                  {editLoading ? <Spinner size={16} variant="white" /> : <div className="flex items-center gap-2"><Save className="h-4 w-4" /> Save</div>}
                </Button>
                <Button variant="ghost" onClick={handleCancelEdit}>
                  <X className="h-4 w-4 mr-2" /> Cancel
                </Button>
              </>
            ) : (
              <Button variant="ghost" onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" /> Edit
              </Button>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                <div className="flex items-center justify-center gap-3">
                  <Spinner size={24} variant="white" />
                  <span>Loading vendor details...</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : error ? (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card>
              <CardContent className="py-6 text-center text-destructive">{error}</CardContent>
            </Card>
          </motion.div>
        ) : vendor ? (
          <motion.div key="vendor" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Optional success message */}
            <AnimatePresence>
              {editMessage && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                className="bg-muted border border-border text-foreground text-sm p-3 rounded mb-4"
                >
                  {editMessage}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Grid: Left (details) and Right (controls) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: details and media (spans 2 cols) */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        {vendor.logoUrl ? (
                          <Image src={vendor.logoUrl} alt={vendor.stallName} width={72} height={72} className="rounded-lg object-cover" />
                        ) : (
                          <div className="w-18 h-18 bg-muted rounded-lg flex items-center justify-center"><Store className="h-6 w-6 text-muted-foreground" /></div>
                        )}
                        {isEditing && (
                          <Button size="sm" variant="secondary" className="absolute -top-2 -right-2 h-8 w-8 p-0 rounded-full" onClick={() => handleOpenImageEditor('logo')}>
                            <Camera className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div>
                        {isEditing ? (
                          <div className="space-y-2">
                            <Input value={editData.stallName || ''} onChange={(e) => setEditData(prev => ({ ...prev, stallName: e.target.value }))} className="text-xl font-semibold" placeholder="Stall name" />
                            <Input value={editData.vendorName || ''} onChange={(e) => setEditData(prev => ({ ...prev, vendorName: e.target.value }))} className="text-muted-foreground" placeholder="Vendor name" />
                          </div>
                        ) : (
                          <>
                            <CardTitle className="text-2xl">{vendor.stallName}</CardTitle>
                            <div className="text-muted-foreground">{vendor.vendorName}</div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`px-2 py-1 rounded text-xs font-medium ${statusColor(vendor.status)}`}>{vendor.status}</div>
                        {vendor.isOnline && <Badge variant="outline" className="bg-muted text-foreground">Online</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground">{vendor.updatedAt ? `Updated ${new Date(vendor.updatedAt).toLocaleString()}` : null}</div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Banner */}
                    {vendor.bannerUrl ? (
                      <div className="relative w-full h-48 rounded-lg overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={vendor.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                        {isEditing && (
                          <Button size="sm" variant="secondary" className="absolute top-3 right-3 h-8 w-8 p-0 rounded-full" onClick={() => handleOpenImageEditor('banner')}>
                            <ImageIcon className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ) : (
                      isEditing && (
                          <div className="w-full h-48 border-2 border-dashed border-border rounded-lg flex items-center justify-center">
                          <Button variant="outline" onClick={() => handleOpenImageEditor('banner')} className="flex items-center gap-2">
                            <ImageIcon className="h-5 w-5" /> Add Banner
                          </Button>
                        </div>
                      )
                    )}

                    {/* Description & quick info */}
                    {isEditing ? (
                      <div className="space-y-3">
                        <div>
                          <Label>Description</Label>
                          <Textarea value={editData.description || ''} onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))} rows={3} placeholder="Brief description" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Label>Email</Label>
                            <Input type="email" value={editData.contactEmail || ''} onChange={(e) => setEditData(prev => ({ ...prev, contactEmail: e.target.value }))} placeholder="contact@example.com" />
                          </div>
                          <div>
                            <Label>Phone</Label>
                            <Input value={editData.contactPhone || ''} onChange={(e) => setEditData(prev => ({ ...prev, contactPhone: e.target.value }))} placeholder="+91..." />
                          </div>

                          <div>
                            <Label>Stall Location</Label>
                            <Input value={editData.stallLocation || ''} onChange={(e) => setEditData(prev => ({ ...prev, stallLocation: e.target.value }))} placeholder="Stall #" />
                          </div>

                          <div>
                            <Label>Cuisine Type</Label>
                            <Select value={editData.cuisineType || ''} onValueChange={(value) => setEditData(prev => ({ ...prev, cuisineType: value }))}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select cuisine type" />
                              </SelectTrigger>
                              <SelectContent>
                                {["North Indian", "South Indian", "Chinese", "Italian", "Fast Food", "Snacks", "Beverages", "Desserts", "Multi-cuisine", "Other"].map((cuisine) => (
                                  <SelectItem key={cuisine} value={cuisine.toLowerCase()}>
                                    {cuisine}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        {vendor.description && <p className="text-foreground">{vendor.description}</p>}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FieldRow icon={<Mail className="h-4 w-4 text-muted-foreground" />} label="Email" value={vendor.contactEmail} />
                          <FieldRow icon={<Phone className="h-4 w-4 text-muted-foreground" />} label="Phone" value={vendor.contactPhone} />
                          {vendor.stallLocation && <FieldRow icon={<MapPin className="h-4 w-4 text-muted-foreground" />} label="Stall Location" value={vendor.stallLocation} />}
                          {vendor.cuisineType && <FieldRow icon={<Store className="h-4 w-4 text-muted-foreground" />} label="Cuisine" value={vendor.cuisineType} />}
                        </div>
                      </>
                    )}

                    <Separator />

                    {/* Legal / operational info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2"><IdCard className="h-4 w-4 text-muted-foreground" /><span className="text-foreground">PAN: {vendor.panNumber || "â€”"}</span></div>
                      <div className="flex items-center gap-2"><IdCard className="h-4 w-4 text-muted-foreground" /><span className="text-foreground">GSTIN: {vendor.gstin || "â€”"}</span></div>
                      <div className="flex items-center gap-2"><Banknote className="h-4 w-4 text-muted-foreground" /><span className="text-foreground">Max/hr: {vendor.maxOrdersPerHour ?? 10}</span></div>
                      <div className="flex items-center gap-2"><Banknote className="h-4 w-4 text-muted-foreground" /><span className="text-foreground">Prep (min): {vendor.averagePreparationTime ?? 15}</span></div>
                    </div>

                    <Separator />

                    <div className="space-y-2 text-sm">
                      <div className="font-medium text-foreground">Bank Details</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="flex items-center gap-2"><Landmark className="h-4 w-4 text-muted-foreground" /><span className="text-foreground">{vendor.bankName || "â€”"}</span></div>
                        <div className="text-foreground">IFSC: {vendor.bankIfscCode || "â€”"}</div>
                        <div className="text-foreground">A/C Holder: {vendor.bankAccountHolderName || "â€”"}</div>
                        <div className="text-foreground">A/C No: {vendor.bankAccountNumber || "â€”"}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right: controls / actions */}
              <div className="space-y-6">
                {/* Status & quick actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Status &amp; Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-sm">Change Status</Label>
                      <Select value={vendor.status} onValueChange={handleStatusChange} disabled={statusLoading}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">
                            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-foreground rounded-full" />Active</div>
                          </SelectItem>
                          <SelectItem value="inactive">
                            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-muted-foreground rounded-full" />Inactive</div>
                          </SelectItem>
                          <SelectItem value="maintenance">
                            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-foreground/60 rounded-full" />Maintenance</div>
                          </SelectItem>
                          <SelectItem value="suspended">
                            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-destructive rounded-full" />Suspended</div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <AnimatePresence>
                        {statusLoading && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs text-muted-foreground text-center flex items-center justify-center gap-2">
                            <Spinner size={12} variant="white" /> Updating status...
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="flex gap-2">
                      <Button className="flex-1" variant="outline" onClick={() => { setIsEditing(true); handleEdit() }}>
                        <Edit className="h-4 w-4 mr-2" /> Edit
                      </Button>
                      <Button className="flex-1" variant="outline" onClick={() => router.push(`/admin/${courtId}/vendors/${vendorId}/orders`)}>
                        Orders
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment setup */}
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Setup</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(() => {
                      const paymentStatus = vendor?.metadata?.paymentStatus
                      switch (paymentStatus) {
                        case 'requested':
                          return (
                            <div className="space-y-2">
                              <div className="text-sm text-foreground">Payment setup request submitted â€” pending approval.</div>
                              <div className="flex items-center gap-2 text-muted-foreground"><div className="w-2 h-2 bg-foreground/60 rounded-full animate-pulse" />Request Pending</div>
                              <Button disabled className="w-full bg-muted text-muted-foreground">Request Submitted</Button>
                            </div>
                          )
                        case 'approved':
                          return (
                            <div className="space-y-2">
                              <div className="text-sm text-foreground">Payment setup approved and configured for this vendor.</div>
                              <div className="flex items-center gap-2 text-foreground"><div className="w-2 h-2 bg-foreground rounded-full" />Payment Configured</div>
                              <Button disabled className="w-full bg-muted text-muted-foreground">Already Configured</Button>
                            </div>
                          )
                        case 'rejected':
                          return (
                            <div className="space-y-2">
                              <div className="text-sm text-foreground">Payment setup request was rejected.</div>
                              {vendor?.metadata?.paymentRejectionReason && <div className="text-destructive text-xs">Reason: {vendor.metadata.paymentRejectionReason}</div>}
                              <div>
                                <Label htmlFor="resubmission-message">Resubmission Message (optional)</Label>
                                <Textarea id="resubmission-message" placeholder="Explain changes..." value={resubmissionMessage} onChange={(e) => setResubmissionMessage(e.target.value)} rows={3} />
                              </div>
                              <Button onClick={handlePaymentRequest} disabled={paymentRequestLoading} className="w-full bg-foreground text-background hover:bg-foreground/90">
                                {paymentRequestLoading ? <div className="flex items-center gap-2"><Spinner size={16} variant="white" /> Sendingâ€¦</div> : <div className="flex items-center gap-2"><CreditCard className="h-4 w-4" /> Resubmit Request</div>}
                              </Button>
                            </div>
                          )
                        default:
                          return (
                            <div className="space-y-2">
                              <div className="text-sm text-foreground">Request online payments for this vendor.</div>
                              <Button onClick={handlePaymentRequest} disabled={paymentRequestLoading} className="w-full bg-foreground text-background hover:bg-foreground/90">
                                {paymentRequestLoading ? <div className="flex items-center gap-2"><Spinner size={16} variant="white" /> Sendingâ€¦</div> : <div className="flex items-center gap-2"><CreditCard className="h-4 w-4" /> Request Online Payments</div>}
                              </Button>
                            </div>
                          )
                      }
                    })()}

                    <AnimatePresence>
                      {paymentRequestMessage && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs text-foreground text-center">
                          {paymentRequestMessage}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>

                {/* Password reset */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5 text-muted-foreground" /> Reset Password</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {passwordResetStatus === 'success' ? (
                      <div className="text-center py-4">
                        <div className="text-foreground font-semibold">âœ“ Password Reset Successfully</div>
                        <p className="text-muted-foreground text-sm">The vendor's password has been updated.</p>
                        <Button onClick={() => { setPasswordResetStatus('idle'); setPasswordResetMessage('') }} className="mt-3" variant="outline">Reset Another</Button>
                      </div>
                    ) : passwordResetStatus === 'error' ? (
                      <div className="text-center py-4">
                        <div className="text-destructive font-semibold">âœ— Password Reset Failed</div>
                        <p className="text-muted-foreground text-sm mb-3">{passwordResetMessage}</p>
                        <Button onClick={() => setPasswordResetStatus('idle')} variant="outline">Try Again</Button>
                      </div>
                    ) : (
                      <>
                        <div>
                          <Label htmlFor="newPassword">New Password</Label>
                          <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" />
                        </div>
                        <div>
                          <Label htmlFor="confirmPassword">Confirm Password</Label>
                          <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
                        </div>
                        <Button onClick={handlePasswordReset} disabled={passwordResetLoading} className="w-full bg-foreground text-background hover:bg-foreground/90">
                          {passwordResetLoading ? <><Spinner size={14} variant="white" /> Resetting...</> : 'Reset Password'}
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* small meta card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Meta</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="text-foreground">ID: <span className="text-muted-foreground">{vendor.id}</span></div>
                    <div className="text-foreground">Razorpay: <span className="text-muted-foreground">{vendor.razorpayAccountId || 'â€”'}</span></div>
                    <div className="text-foreground">Created: <span className="text-muted-foreground">{vendor.createdAt ? new Date(vendor.createdAt).toLocaleString() : 'â€”'}</span></div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Image Editor Drawer */}
      <ImageEditorDrawer
        isOpen={imageEditorOpen}
        onClose={() => setImageEditorOpen(false)}
        onSave={handleSaveImage}
        title={imageEditorType === 'logo' ? 'Edit Logo' : 'Edit Banner'}
        description={imageEditorType === 'logo' ? 'Upload and crop your vendor logo. Recommended size: 200x200px' : 'Upload and crop your banner image. Recommended aspect ratio: 16:9'}
        aspect={imageEditorType === 'logo' ? 1 : 16 / 9}
        circularCrop={imageEditorType === 'logo'}
        uploadPreset={imageEditorType === 'logo' ? 'vendor_logos' : 'menu_items'}
        currentImageUrl={imageEditorType === 'logo' ? vendor?.logoUrl : vendor?.bannerUrl}
      />
    </div>
  )
}
