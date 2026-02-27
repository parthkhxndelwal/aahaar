"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { Edit, ArrowLeft, Mail, Phone, Store, MapPin, IdCard, Landmark, Banknote, ToggleLeft, ToggleRight, Save, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"

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
  // Added to consume backend metadata fields like productConfiguration
  metadata?: any
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
  // Razorpay related UI state
  const [rpChecking, setRpChecking] = useState(false)
  const [rpActivated, setRpActivated] = useState<boolean | null>(null)
  const [rpStatus, setRpStatus] = useState<string | null>(null)
  const [rpActionLoading, setRpActionLoading] = useState(false)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [statusLoading, setStatusLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<Vendor>>({})
  const [editMessage, setEditMessage] = useState<string | null>(null)
  const [editLoading, setEditLoading] = useState(false)

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

  useEffect(() => {
    const shouldCheck = !!(vendor?.razorpayAccountId && vendor?.metadata?.productConfiguration?.productId)
    if (!shouldCheck) {
      setRpActivated(null)
      setRpStatus(null)
      return
    }
    const checkStatus = async () => {
      try {
        setRpChecking(true)
        setRpStatus(null)
        const res = await fetch(`/api/admin/vendors/${vendorId}/razorpay-status`)
        const json = await res.json()
        if (!res.ok || !json.success) throw new Error(json.message || "Failed to fetch Razorpay status")
        setRpActivated(!!json.data?.activated)
        setRpStatus(json.data?.activation_status || null)
      } catch (e: any) {
        // keep status unknown but don't block page
        setRpActivated(null)
      } finally {
        setRpChecking(false)
      }
    }
    checkStatus()
  }, [vendorId, vendor?.razorpayAccountId, vendor?.metadata?.productConfiguration?.productId])

  const handleRazorpayAccount = async () => {
    try {
      setRpActionLoading(true)
      setActionMessage(null)
      setError(null)
      const res = await fetch(`/api/admin/vendors/${vendorId}/razorpay-account`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to create/sync Razorpay account')
      setActionMessage('Razorpay account synced')
      await fetchVendor()
    } catch (e: any) {
      setError(e.message || 'Razorpay action failed')
    } finally {
      setRpActionLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      setStatusLoading(true)
      setError(null)
      setActionMessage(null)
      setEditMessage(null)
      
      const res = await fetch(`/api/admin/vendors/${vendorId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courtId,
          status: newStatus,
        }),
      })
      
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to update vendor status')
      }
      
      setActionMessage(`Vendor status updated to ${newStatus}`)
      await fetchVendor() // Refresh vendor data
    } catch (e: any) {
      setError(e.message || 'Failed to update status')
    } finally {
      setStatusLoading(false)
    }
  }

  const handleEdit = () => {
    setError(null)
    setActionMessage(null)
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

  const handleSaveEdit = async () => {
    try {
      setEditLoading(true)
      setError(null)
      setActionMessage(null)
      setEditMessage(null)
      
      const res = await fetch(`/api/admin/vendors/${vendorId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courtId,
          ...editData,
        }),
      })
      
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to update vendor')
      }
      
      setEditMessage('Vendor details updated successfully')
      setIsEditing(false)
      await fetchVendor() // Refresh vendor data
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
  }

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

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="flex items-center gap-3"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Button variant="outline" onClick={() => router.push(`/admin/${courtId}/vendors`)} className="dark:border-neutral-700 dark:text-neutral-300">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
      </motion.div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center py-20"
          >
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
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="dark:bg-neutral-900 dark:border-neutral-800">
              <CardContent className="py-10 text-center text-red-400">{error}</CardContent>
            </Card>
          </motion.div>
        ) : vendor ? (
          <motion.div
            key="vendor"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            {/* Error and Success Messages */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-900/30 border border-red-700 text-red-300 text-sm p-3 rounded mb-6"
                >
                  {error}
                </motion.div>
              )}
              {actionMessage && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-green-900/30 border border-green-700 text-green-300 text-sm p-3 rounded mb-6"
                >
                  {actionMessage}
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div
              className="lg:col-span-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="dark:bg-neutral-900 dark:border-neutral-800">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                {vendor.logoUrl ? (
                  <Image src={vendor.logoUrl} alt={vendor.stallName} width={64} height={64} className="rounded-lg object-cover" />
                ) : (
                  <div className="w-16 h-16 bg-neutral-700 rounded-lg flex items-center justify-center"><Store className="h-6 w-6 text-neutral-300" /></div>
                )}
                <div className="flex-1">
                  {isEditing ? (
                    <div className="space-y-2">
                      <Input
                        value={editData.stallName || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, stallName: e.target.value }))}
                        className="text-xl font-semibold bg-neutral-800 border-neutral-700 text-white"
                        placeholder="Stall Name"
                      />
                      <Input
                        value={editData.vendorName || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, vendorName: e.target.value }))}
                        className="bg-neutral-800 border-neutral-700 text-neutral-400"
                        placeholder="Vendor Name"
                      />
                    </div>
                  ) : (
                    <>
                      <CardTitle className="text-2xl text-white">{vendor.stallName}</CardTitle>
                      <div className="text-neutral-400">{vendor.vendorName}</div>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="flex gap-2">
                  <Badge className={statusColor(vendor.status)}>{vendor.status}</Badge>
                  {vendor.isOnline && <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-200">Online</Badge>}
                </div>
                <div className="flex gap-1">
                  <AnimatePresence mode="wait">
                    {isEditing ? (
                      <motion.div
                        key="edit-buttons"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                        className="flex gap-1"
                      >
                        <Button size="sm" variant="ghost" onClick={handleSaveEdit} disabled={editLoading} className="h-8 w-8 p-0 text-green-400 hover:text-green-300 hover:bg-green-900/20">
                          {editLoading ? <Spinner size={16} variant="white" /> : <Save className="h-4 w-4" />}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={handleCancelEdit} className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/20">
                          <X className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="edit-button"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Button size="sm" variant="ghost" onClick={handleEdit} className="h-8 w-8 p-0 text-neutral-400 hover:text-white hover:bg-neutral-800">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Edit Success Message */}
              <AnimatePresence>
                {editMessage && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-green-900/30 border border-green-700 text-green-300 text-sm p-3 rounded"
                  >
                    {editMessage}
                  </motion.div>
                )}
              </AnimatePresence>
              
              {vendor.bannerUrl && (
                <div className="relative w-full h-40 overflow-hidden rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={vendor.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                </div>
              )}
              
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-neutral-300 mb-1 block">Description</label>
                    <Textarea
                      value={editData.description || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                      className="bg-neutral-800 border-neutral-700 text-white"
                      placeholder="Enter vendor description"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-neutral-300 mb-1 block">Email</label>
                      <Input
                        type="email"
                        value={editData.contactEmail || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, contactEmail: e.target.value }))}
                        className="bg-neutral-800 border-neutral-700 text-white"
                        placeholder="Enter email address"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-neutral-300 mb-1 block">Phone</label>
                      <Input
                        value={editData.contactPhone || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, contactPhone: e.target.value }))}
                        className="bg-neutral-800 border-neutral-700 text-white"
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-neutral-300 mb-1 block">Stall Location</label>
                      <Input
                        value={editData.stallLocation || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, stallLocation: e.target.value }))}
                        className="bg-neutral-800 border-neutral-700 text-white"
                        placeholder="Enter stall location"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-neutral-300 mb-1 block">Cuisine Type</label>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-neutral-400" /><span className="text-neutral-300">{vendor.contactEmail}</span></div>
                    <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-neutral-400" /><span className="text-neutral-300">{vendor.contactPhone}</span></div>
                    {vendor.stallLocation && (<div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-neutral-400" /><span className="text-neutral-300">{vendor.stallLocation}</span></div>)}
                    {vendor.cuisineType && (<div className="flex items-center gap-2"><Store className="h-4 w-4 text-neutral-400" /><span className="text-neutral-300">{vendor.cuisineType}</span></div>)}
                  </div>
                </>
              )}

              <Separator className="bg-neutral-700" />

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
          </motion.div>

          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="dark:bg-neutral-900 dark:border-neutral-800">
              <CardHeader>
                <CardTitle className="text-white">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Change Status</label>
                  <Select 
                    value={vendor.status} 
                    onValueChange={handleStatusChange}
                    disabled={statusLoading}
                  >
                    <SelectTrigger className="w-full dark:bg-neutral-800 dark:border-neutral-700 dark:text-white">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-neutral-800 dark:border-neutral-700">
                      <SelectItem value="active" className="dark:text-white dark:hover:bg-neutral-700">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Active
                        </div>
                      </SelectItem>
                      <SelectItem value="inactive" className="dark:text-white dark:hover:bg-neutral-700">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                          Inactive
                        </div>
                      </SelectItem>
                      <SelectItem value="maintenance" className="dark:text-white dark:hover:bg-neutral-700">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          Maintenance
                        </div>
                      </SelectItem>
                      <SelectItem value="suspended" className="dark:text-white dark:hover:bg-neutral-700">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          Suspended
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <AnimatePresence>
                    {statusLoading && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-xs text-neutral-400 text-center flex items-center justify-center gap-2"
                      >
                        <Spinner size={12} variant="white" />
                        <span>Updating status...</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                {/* Only show Razorpay button if account is not already configured */}
                <AnimatePresence>
                  {!vendor.razorpayAccountId && !rpChecking && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Button onClick={handleRazorpayAccount} disabled={rpActionLoading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                        {rpActionLoading ? (
                          <div className="flex items-center gap-2">
                            <Spinner size={16} variant="white" />
                            <span>Working…</span>
                          </div>
                        ) : (
                          'Setup Razorpay Account'
                        )}
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <AnimatePresence>
                  {actionMessage && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-xs text-green-400 text-center"
                    >
                      {actionMessage}
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>

            <Card className="dark:bg-neutral-900 dark:border-neutral-800">
              <CardHeader>
                <CardTitle className="text-white">Payment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-neutral-300">
                <div className="flex items-center justify-between">
                  <span>Razorpay Account</span>
                  <span className="truncate ml-2">{vendor.razorpayAccountId ? vendor.razorpayAccountId : "Not linked"}</span>
                </div>
                {rpChecking ? (
                  <div className="text-xs text-neutral-400">Checking Razorpay status…</div>
                ) : rpActivated ? (
                  <Badge className="w-fit bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Razorpay Configured</Badge>
                ) : vendor.razorpayAccountId ? (
                  <div className="text-xs text-neutral-400">Razorpay status: {rpStatus || 'pending'}</div>
                ) : null}
              </CardContent>
            </Card>
          </motion.div>
          </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  )
}
