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
      const res = await fetch(`/api/admin/vendors/${vendorId}?courtId=${courtId}`)
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to load vendor")
      }
      setVendor(json.data.vendor)
    } catch (e: any) {
      setError(e.message || "Failed to load vendor")
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
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "suspended":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    }
  }

  // Status change request
  const handleStatusChange = async (newStatus: string) => {
    try {
      setStatusLoading(true)
      setError(null)

      const res = await fetch(`/api/admin/vendors/${vendorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courtId, status: newStatus }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to update vendor status')
      await fetchVendor()
    } catch (e: any) {
      setError(e.message || 'Failed to update status')
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

      const res = await fetch(`/api/admin/vendors/${vendorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courtId, ...editData }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to update vendor')

      setEditMessage('Vendor details updated successfully')
      setIsEditing(false)
      setEditData({})
      await fetchVendor()
    } catch (e: any) {
      setError(e.message || 'Failed to update vendor')
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

      const response = await fetch('/api/admin/payment-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
        }),
      })

      const result = await response.json()
      if (result.success) {
        setPaymentRequestMessage('Payment request submitted successfully!')
        await fetchVendor()
      } else {
        setError(`Failed to submit payment request: ${result.message}`)
      }
    } catch (error) {
      console.error('Failed to submit payment request:', error)
      setError('Failed to submit payment request. Please try again.')
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
      const res = await fetch(`/api/admin/vendors/${vendorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courtId, [field]: imageUrl }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.message || `Failed to update ${imageEditorType}`)
      await fetchVendor()
      setEditMessage(`${imageEditorType === 'logo' ? 'Logo' : 'Banner'} updated successfully`)
    } catch (e: any) {
      setError(e.message || `Failed to update ${imageEditorType}`)
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
      const response = await fetch('/api/admin/reset-vendor-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: vendor.contactEmail, courtId: vendor.courtId, newPassword }),
      })
      const result = await response.json()
      if (result.success) {
        setPasswordResetStatus('success')
        setPasswordResetMessage('Password Reset Successfully')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setPasswordResetStatus('error')
        setPasswordResetMessage(result.message || 'Failed to reset password')
      }
    } catch (error) {
      console.error('Failed to reset password:', error)
      setPasswordResetStatus('error')
      setPasswordResetMessage('Failed to reset password. Please try again.')
    } finally {
      setPasswordResetLoading(false)
    }
  }

  // Small UI helpers (internal)
  const FieldRow: React.FC<{ icon?: React.ReactNode; label: string; value?: React.ReactNode }> = ({ icon, label, value }) => (
    <div className="flex items-start gap-3">
      <div className="mt-1 text-neutral-400">{icon}</div>
      <div className="flex-1">
        <div className="text-xs text-neutral-400">{label}</div>
        <div className="text-sm text-neutral-300">{value ?? '—'}</div>
      </div>
    </div>
  )

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => router.push(`/admin/${courtId}/vendors`)} className="dark:border-neutral-700 dark:text-neutral-300">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <div className="text-sm text-neutral-400">Court ID: <span className="text-neutral-200 ml-2">{courtId}</span></div>
        </div>

        <div className="flex items-center gap-2">
          {vendor && <div className={`px-2 py-1 rounded ${statusColor(vendor.status)} text-xs font-medium`}>{vendor.status}</div>}
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button onClick={handleSaveEdit} disabled={!hasChanges() || editLoading} className="bg-white text-neutral-900 hover:opacity-95">
                  {editLoading ? <Spinner size={16} variant="white" /> : <div className="flex items-center gap-2"><Save className="h-4 w-4" /> Save</div>}
                </Button>
                <Button variant="ghost" onClick={handleCancelEdit} className="text-neutral-300 hover:text-white">
                  <X className="h-4 w-4 mr-2" /> Cancel
                </Button>
              </>
            ) : (
              <Button variant="ghost" onClick={handleEdit} className="text-neutral-300 hover:text-white">
                <Edit className="h-4 w-4 mr-2" /> Edit
              </Button>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="dark:bg-neutral-900 dark:border-neutral-800">
              <CardContent className="py-10 text-center text-neutral-400">
                <div className="flex items-center justify-center gap-3">
                  <Spinner size={24} variant="white" />
                  <span>Loading vendor details...</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : error ? (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="dark:bg-neutral-900 dark:border-neutral-800">
              <CardContent className="py-6 text-center text-red-400">{error}</CardContent>
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
                  className="bg-green-900/30 border border-green-700 text-green-300 text-sm p-3 rounded mb-4"
                >
                  {editMessage}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Grid: Left (details) and Right (controls) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: details and media (spans 2 cols) */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="dark:bg-neutral-900 dark:border-neutral-800">
                  <CardHeader className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        {vendor.logoUrl ? (
                          <Image src={vendor.logoUrl} alt={vendor.stallName} width={72} height={72} className="rounded-lg object-cover" />
                        ) : (
                          <div className="w-18 h-18 bg-neutral-700 rounded-lg flex items-center justify-center"><Store className="h-6 w-6 text-neutral-300" /></div>
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
                            <Input value={editData.stallName || ''} onChange={(e) => setEditData(prev => ({ ...prev, stallName: e.target.value }))} className="text-xl font-semibold bg-neutral-800 border-neutral-700 text-white" placeholder="Stall name" />
                            <Input value={editData.vendorName || ''} onChange={(e) => setEditData(prev => ({ ...prev, vendorName: e.target.value }))} className="bg-neutral-800 border-neutral-700 text-neutral-400" placeholder="Vendor name" />
                          </div>
                        ) : (
                          <>
                            <CardTitle className="text-2xl text-white">{vendor.stallName}</CardTitle>
                            <div className="text-neutral-400">{vendor.vendorName}</div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`px-2 py-1 rounded text-xs font-medium ${statusColor(vendor.status)}`}>{vendor.status}</div>
                        {vendor.isOnline && <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-200">Online</Badge>}
                      </div>
                      <div className="text-xs text-neutral-400">{vendor.updatedAt ? `Updated ${new Date(vendor.updatedAt).toLocaleString()}` : null}</div>
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
                        <div className="w-full h-48 border-2 border-dashed border-neutral-600 rounded-lg flex items-center justify-center">
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
                          <Label className="text-neutral-300">Description</Label>
                          <Textarea value={editData.description || ''} onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))} className="bg-neutral-800 border-neutral-700 text-white" rows={3} placeholder="Brief description" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-neutral-300">Email</Label>
                            <Input type="email" value={editData.contactEmail || ''} onChange={(e) => setEditData(prev => ({ ...prev, contactEmail: e.target.value }))} className="bg-neutral-800 border-neutral-700 text-white" placeholder="contact@example.com" />
                          </div>
                          <div>
                            <Label className="text-neutral-300">Phone</Label>
                            <Input value={editData.contactPhone || ''} onChange={(e) => setEditData(prev => ({ ...prev, contactPhone: e.target.value }))} className="bg-neutral-800 border-neutral-700 text-white" placeholder="+91..." />
                          </div>

                          <div>
                            <Label className="text-neutral-300">Stall Location</Label>
                            <Input value={editData.stallLocation || ''} onChange={(e) => setEditData(prev => ({ ...prev, stallLocation: e.target.value }))} className="bg-neutral-800 border-neutral-700 text-white" placeholder="Stall #" />
                          </div>

                          <div>
                            <Label className="text-neutral-300">Cuisine Type</Label>
                            <Select value={editData.cuisineType || ''} onValueChange={(value) => setEditData(prev => ({ ...prev, cuisineType: value }))}>
                              <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                                <SelectValue placeholder="Select cuisine type" />
                              </SelectTrigger>
                              <SelectContent className="bg-neutral-800 border-neutral-700">
                                {["North Indian", "South Indian", "Chinese", "Italian", "Fast Food", "Snacks", "Beverages", "Desserts", "Multi-cuisine", "Other"].map((cuisine) => (
                                  <SelectItem key={cuisine} value={cuisine.toLowerCase()} className="text-white hover:bg-neutral-700">
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
                        {vendor.description && <p className="text-neutral-300">{vendor.description}</p>}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FieldRow icon={<Mail className="h-4 w-4 text-neutral-400" />} label="Email" value={vendor.contactEmail} />
                          <FieldRow icon={<Phone className="h-4 w-4 text-neutral-400" />} label="Phone" value={vendor.contactPhone} />
                          {vendor.stallLocation && <FieldRow icon={<MapPin className="h-4 w-4 text-neutral-400" />} label="Stall Location" value={vendor.stallLocation} />}
                          {vendor.cuisineType && <FieldRow icon={<Store className="h-4 w-4 text-neutral-400" />} label="Cuisine" value={vendor.cuisineType} />}
                        </div>
                      </>
                    )}

                    <Separator className="bg-neutral-700" />

                    {/* Legal / operational info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2"><IdCard className="h-4 w-4 text-neutral-400" /><span className="text-neutral-300">PAN: {vendor.panNumber || "—"}</span></div>
                      <div className="flex items-center gap-2"><IdCard className="h-4 w-4 text-neutral-400" /><span className="text-neutral-300">GSTIN: {vendor.gstin || "—"}</span></div>
                      <div className="flex items-center gap-2"><Banknote className="h-4 w-4 text-neutral-400" /><span className="text-neutral-300">Max/hr: {vendor.maxOrdersPerHour ?? 10}</span></div>
                      <div className="flex items-center gap-2"><Banknote className="h-4 w-4 text-neutral-400" /><span className="text-neutral-300">Prep (min): {vendor.averagePreparationTime ?? 15}</span></div>
                    </div>

                    <Separator className="bg-neutral-700" />

                    <div className="space-y-2 text-sm">
                      <div className="font-medium text-neutral-200">Bank Details</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="flex items-center gap-2"><Landmark className="h-4 w-4 text-neutral-400" /><span className="text-neutral-300">{vendor.bankName || "—"}</span></div>
                        <div className="text-neutral-300">IFSC: {vendor.bankIfscCode || "—"}</div>
                        <div className="text-neutral-300">A/C Holder: {vendor.bankAccountHolderName || "—"}</div>
                        <div className="text-neutral-300">A/C No: {vendor.bankAccountNumber || "—"}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right: controls / actions */}
              <div className="space-y-6">
                {/* Status & quick actions */}
                <Card className="dark:bg-neutral-900 dark:border-neutral-800">
                  <CardHeader>
                    <CardTitle className="text-white">Status & Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-sm text-neutral-300">Change Status</Label>
                      <Select value={vendor.status} onValueChange={handleStatusChange} disabled={statusLoading}>
                        <SelectTrigger className="w-full dark:bg-neutral-800 dark:border-neutral-700 dark:text-white">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-neutral-800 dark:border-neutral-700">
                          <SelectItem value="active" className="dark:text-white dark:hover:bg-neutral-700">
                            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full" />Active</div>
                          </SelectItem>
                          <SelectItem value="inactive" className="dark:text-white dark:hover:bg-neutral-700">
                            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-gray-500 rounded-full" />Inactive</div>
                          </SelectItem>
                          <SelectItem value="maintenance" className="dark:text-white dark:hover:bg-neutral-700">
                            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-yellow-500 rounded-full" />Maintenance</div>
                          </SelectItem>
                          <SelectItem value="suspended" className="dark:text-white dark:hover:bg-neutral-700">
                            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-red-500 rounded-full" />Suspended</div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <AnimatePresence>
                        {statusLoading && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs text-neutral-400 text-center flex items-center justify-center gap-2">
                            <Spinner size={12} variant="white" /> Updating status...
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="flex gap-2">
                      <Button className="flex-1 bg-white text-neutral-900" onClick={() => { setIsEditing(true); handleEdit() }}>
                        <Edit className="h-4 w-4 mr-2" /> Edit
                      </Button>
                      <Button className="flex-1 bg-white text-neutral-900" onClick={() => router.push(`/admin/${courtId}/vendors/${vendorId}/orders`)}>
                        Orders
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment setup */}
                <Card className="dark:bg-neutral-900 dark:border-neutral-800">
                  <CardHeader>
                    <CardTitle className="text-white">Payment Setup</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(() => {
                      const paymentStatus = vendor?.metadata?.paymentStatus
                      switch (paymentStatus) {
                        case 'requested':
                          return (
                            <div className="space-y-2">
                              <div className="text-sm text-neutral-300">Payment setup request submitted — pending approval.</div>
                              <div className="flex items-center gap-2 text-yellow-400"><div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />Request Pending</div>
                              <Button disabled className="w-full bg-neutral-800 text-neutral-300">Request Submitted</Button>
                            </div>
                          )
                        case 'approved':
                          return (
                            <div className="space-y-2">
                              <div className="text-sm text-neutral-300">Payment setup approved and configured for this vendor.</div>
                              <div className="flex items-center gap-2 text-green-400"><div className="w-2 h-2 bg-green-400 rounded-full" />Payment Configured</div>
                              <Button disabled className="w-full bg-neutral-800 text-neutral-300">Already Configured</Button>
                            </div>
                          )
                        case 'rejected':
                          return (
                            <div className="space-y-2">
                              <div className="text-sm text-neutral-300">Payment setup request was rejected.</div>
                              {vendor?.metadata?.paymentRejectionReason && <div className="text-red-400 text-xs">Reason: {vendor.metadata.paymentRejectionReason}</div>}
                              <div>
                                <Label htmlFor="resubmission-message" className="text-sm text-neutral-300">Resubmission Message (optional)</Label>
                                <Textarea id="resubmission-message" placeholder="Explain changes..." value={resubmissionMessage} onChange={(e) => setResubmissionMessage(e.target.value)} rows={3} className="bg-neutral-800 border-neutral-700 text-white" />
                              </div>
                              <Button onClick={handlePaymentRequest} disabled={paymentRequestLoading} className="w-full bg-white text-neutral-900">
                                {paymentRequestLoading ? <div className="flex items-center gap-2"><Spinner size={16} variant="white" /> Sending…</div> : <div className="flex items-center gap-2"><CreditCard className="h-4 w-4" /> Resubmit Request</div>}
                              </Button>
                            </div>
                          )
                        default:
                          return (
                            <div className="space-y-2">
                              <div className="text-sm text-neutral-300">Request online payments for this vendor.</div>
                              <Button onClick={handlePaymentRequest} disabled={paymentRequestLoading} className="w-full bg-white text-neutral-900">
                                {paymentRequestLoading ? <div className="flex items-center gap-2"><Spinner size={16} variant="white" /> Sending…</div> : <div className="flex items-center gap-2"><CreditCard className="h-4 w-4" /> Request Online Payments</div>}
                              </Button>
                            </div>
                          )
                      }
                    })()}

                    <AnimatePresence>
                      {paymentRequestMessage && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs text-green-400 text-center">
                          {paymentRequestMessage}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>

                {/* Password reset */}
                <Card className="dark:bg-neutral-900 dark:border-neutral-800">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2"><Key className="h-5 w-5 text-orange-400" /> Reset Password</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {passwordResetStatus === 'success' ? (
                      <div className="text-center py-4">
                        <div className="text-green-400 font-semibold">✓ Password Reset Successfully</div>
                        <p className="text-neutral-400 text-sm">The vendor's password has been updated.</p>
                        <Button onClick={() => { setPasswordResetStatus('idle'); setPasswordResetMessage('') }} className="mt-3 bg-white text-neutral-900">Reset Another</Button>
                      </div>
                    ) : passwordResetStatus === 'error' ? (
                      <div className="text-center py-4">
                        <div className="text-red-400 font-semibold">✗ Password Reset Failed</div>
                        <p className="text-neutral-400 text-sm mb-3">{passwordResetMessage}</p>
                        <Button onClick={() => setPasswordResetStatus('idle')} className="bg-white text-neutral-900">Try Again</Button>
                      </div>
                    ) : (
                      <>
                        <div>
                          <Label htmlFor="newPassword" className="text-neutral-300">New Password</Label>
                          <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" className="bg-neutral-800 border-neutral-700 text-white" />
                        </div>
                        <div>
                          <Label htmlFor="confirmPassword" className="text-neutral-300">Confirm Password</Label>
                          <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" className="bg-neutral-800 border-neutral-700 text-white" />
                        </div>
                        <Button onClick={handlePasswordReset} disabled={passwordResetLoading} className="w-full bg-white text-neutral-900">
                          {passwordResetLoading ? <><Spinner size={14} variant="white" /> Resetting...</> : 'Reset Password'}
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* small meta card */}
                <Card className="dark:bg-neutral-900 dark:border-neutral-800">
                  <CardHeader>
                    <CardTitle className="text-white">Meta</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="text-neutral-300">ID: <span className="text-neutral-200">{vendor.id}</span></div>
                    <div className="text-neutral-300">Razorpay: <span className="text-neutral-200">{vendor.razorpayAccountId || '—'}</span></div>
                    <div className="text-neutral-300">Created: <span className="text-neutral-200">{vendor.createdAt ? new Date(vendor.createdAt).toLocaleString() : '—'}</span></div>
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
    </motion.div>
  )
}
