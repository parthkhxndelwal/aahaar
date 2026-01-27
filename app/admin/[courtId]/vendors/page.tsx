"use client"

import { useState, useEffect } from "react"
import { use } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, MoreVertical, Edit, Trash2, Eye, Copy } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"

interface Vendor {
  id: string
  stallName: string
  vendorName: string
  contactEmail: string
  contactPhone: string
  status: string
  isOnline: boolean
  logoUrl?: string
  bannerUrl?: string
  rating?: number
  totalRatings?: number
  userId?: string
}

export default function AdminVendorsPage({ params }: { params: Promise<{ courtId: string }> }) {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingVendor, setDeletingVendor] = useState<string | null>(null)
  const [selectedVendorCredentials, setSelectedVendorCredentials] = useState<Vendor | null>(null)
  const { toast } = useToast()
  const { token } = useAuth()
  const { courtId } = use(params)

  useEffect(() => {
    fetchVendors()
  }, [])

  const fetchVendors = async () => {
    try {
      const response = await fetch(`/api/courts/${courtId}/vendors`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const result = await response.json()

      if (result.success) {
        console.log("🔍 Fetched vendors:", result.data.vendors.map((v: Vendor) => ({ name: v.stallName, status: v.status })))
        setVendors(result.data.vendors)
      } else {
        throw new Error(result.message)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load vendors",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteVendor = async (vendorId: string) => {
    try {
      setDeletingVendor(vendorId)
      const response = await fetch(`/api/courts/${courtId}/vendors/${vendorId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: "Vendor deleted permanently",
        })
        // Refresh the vendors list
        fetchVendors()
      } else {
        throw new Error(result.message)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete vendor",
        variant: "destructive",
      })
    } finally {
      setDeletingVendor(null)
    }
  }

  const copyCredentialsToClipboard = async (vendor: Vendor) => {
    const credentials = `Login Credentials for ${vendor.stallName}

Email: ${vendor.contactEmail}
Stall Name: ${vendor.stallName}
Vendor Name: ${vendor.vendorName}

Dashboard URL: ${window.location.origin}/vendor/${courtId}/login

Please use your email to login. If you need to reset your password, use the "Forgot Password" option on the login page.`

    try {
      await navigator.clipboard.writeText(credentials)
      toast({
        title: "Copied!",
        description: "Vendor credentials copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy credentials",
        variant: "destructive",
      })
    }
  }

  const filteredVendors = vendors

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading vendors...</div>
  }

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <h1 className="text-3xl font-bold text-neutral-100">Vendors</h1>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button asChild>
            <Link href={`/admin/${courtId}/vendors/add`}>
              <Plus className="h-4 w-4 mr-2" />
              Add Vendor
            </Link>
          </Button>
        </motion.div>
      </motion.div>

      {/* Vendors Grid */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.2 }}
      >
        <AnimatePresence>
          {filteredVendors.map((vendor, index) => (
            <motion.div
              key={vendor.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <div className="flex items-start justify-between">
                <Link href={`/admin/${courtId}/vendors/${vendor.id}?mode=view`} className="flex items-center space-x-3 flex-1">
                  {/* Logo */}
                  <div className="w-12 h-12 rounded-lg bg-neutral-100 flex items-center justify-center overflow-hidden">
                    {vendor.logoUrl ? (
                      <img
                        src={vendor.logoUrl}
                        alt={`${vendor.stallName} logo`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement
                          const fallback = target.nextElementSibling as HTMLElement
                          target.style.display = 'none'
                          if (fallback) {
                            fallback.style.display = 'flex'
                          }
                        }}
                      />
                    ) : null}
                    <div 
                      className={`w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm ${vendor.logoUrl ? 'hidden' : 'flex'}`}
                    >
                      {vendor.stallName.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  
                  {/* Vendor Info */}
                  <div>
                    <CardTitle className="text-lg">{vendor.stallName}</CardTitle>
                    <CardDescription>{vendor.vendorName}</CardDescription>
                  </div>
                </Link>
                
                {/* Status and Actions */}
                <div className="flex items-center space-x-2">
                  <Badge variant={vendor.status === "active" ? "default" : "secondary"}>{vendor.status}</Badge>
                  {vendor.isOnline && <div className="w-2 h-2 bg-green-500 rounded-full" />}
                  
                  {/* 3-dot menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <Dialog>
                        <DialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => {
                            e.preventDefault()
                            setSelectedVendorCredentials(vendor)
                          }}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Credentials
                          </DropdownMenuItem>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Vendor Login Credentials</DialogTitle>
                            <DialogDescription>
                              Share these credentials with the vendor so they can access their dashboard.
                            </DialogDescription>
                          </DialogHeader>
                          {selectedVendorCredentials && (
                            <div className="space-y-4">
                              <div className="bg-neutral-50 rounded-lg p-4 space-y-3">
                                <div>
                                  <Label className="text-sm font-medium text-neutral-700">Stall Name</Label>
                                  <p className="text-sm font-mono bg-white px-2 py-1 rounded border">
                                    {selectedVendorCredentials.stallName}
                                  </p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-neutral-700">Login Email</Label>
                                  <p className="text-sm font-mono bg-white px-2 py-1 rounded border">
                                    {selectedVendorCredentials.contactEmail}
                                  </p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-neutral-700">Vendor Name</Label>
                                  <p className="text-sm font-mono bg-white px-2 py-1 rounded border">
                                    {selectedVendorCredentials.vendorName}
                                  </p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-neutral-700">Dashboard URL</Label>
                                  <p className="text-sm font-mono bg-white px-2 py-1 rounded border break-all">
                                    {typeof window !== 'undefined' ? `${window.location.origin}/vendor/${courtId}/login` : ''}
                                  </p>
                                </div>
                              </div>
                              <div className="bg-blue-50 rounded-lg p-4">
                                <p className="text-sm text-blue-800">
                                  <strong>Note:</strong> The vendor should use their email address to login. 
                                  If they need to reset their password, they can use the "Forgot Password" option on the login page.
                                </p>
                              </div>
                              <div className="flex justify-end space-x-2">
                                <Button 
                                  variant="outline" 
                                  onClick={() => copyCredentialsToClipboard(selectedVendorCredentials)}
                                >
                                  <Copy className="mr-2 h-4 w-4" />
                                  Copy All
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                        <Link 
                          href={`/admin/${courtId}/vendors/${vendor.id}?mode=edit`}
                          className="flex items-center w-full"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem 
                            onSelect={(e) => e.preventDefault()}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Vendor Permanently</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to permanently delete "{vendor.stallName}"? This action cannot be undone and will remove all vendor data including orders and menu items.
                              <br /><br />
                              <strong>Note:</strong> If you want to temporarily disable the vendor instead, you can suspend them from the edit page.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteVendor(vendor.id)}
                              disabled={deletingVendor === vendor.id}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {deletingVendor === vendor.id ? "Deleting..." : "Delete Permanently"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <Link href={`/admin/${courtId}/vendors/${vendor.id}?mode=view`}>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-neutral-400">
                    <strong>Email:</strong> {vendor.contactEmail}
                  </p>
                  <p className="text-sm text-neutral-400">
                    <strong>Phone:</strong> {vendor.contactPhone}
                  </p>
                  <p className="text-sm text-neutral-400">
                    <strong>Rating:</strong> {
                      typeof vendor.rating === 'number' && !isNaN(vendor.rating) 
                        ? vendor.rating.toFixed(1) 
                        : '0.0'
                    } ({vendor.totalRatings || 0} reviews)
                  </p>
                </div>
              </CardContent>
            </Link>
          </Card>
            </motion.div>
        ))}
        </AnimatePresence>
      </motion.div>

      {filteredVendors.length === 0 && (
        <motion.div 
          className="flex items-center justify-center min-h-[80vh]"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <motion.div 
            className="w-full max-w-md mx-auto"
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div className="text-center py-12">
              <motion.div 
                className="mb-6 flex justify-center"
                initial={{ opacity: 0, rotate: -10 }}
                animate={{ opacity: 1, rotate: 0 }}
                transition={{ duration: 0.7, delay: 0.6 }}
              >
                <svg 
                  className="w-24 h-24 opacity-60 text-white"
                  viewBox="0 0 122.88 120.47" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    fill="currentColor" 
                    fillRule="evenodd" 
                    clipRule="evenodd" 
                    d="M54.5,69.81c2.48,5.17,10,5.36,12.38,0.03c-0.65-0.66-1.13-1.36-1.61-2.06c-0.08-0.11-0.16-0.23-0.24-0.34 c-1.15,0.91-2.54,1.49-4.35,1.49c-1.96-0.01-3.43-0.75-4.64-1.86c-0.07-0.07-0.14-0.13-0.21-0.2c-0.17,0.48-0.39,1.06-0.63,1.59 C54.98,68.97,54.74,69.46,54.5,69.81L54.5,69.81L54.5,69.81z M115.51,37.52v42.09h5.02c0.82,0,1.5,0.67,1.5,1.49v37.87 c0,0.82-0.67,1.49-1.5,1.49H1.49c-0.82,0-1.49-0.67-1.49-1.49V81.1c0-0.82,0.67-1.49,1.49-1.49h5.02V36.26 c-0.5-0.38-0.97-0.79-1.42-1.23c-2.43-2.43-3.93-5.78-3.93-9.46v-5.2l0-0.07v-0.01c0-0.26,0.06-0.52,0.19-0.75L11.88,0.78 C12.16,0.28,12.68,0,13.21,0l96.78,0c0.61,0,1.13,0.35,1.38,0.86l11.29,18.63c0.14,0.22,0.21,0.47,0.22,0.71l0,0 c0.01,0.05,0.01,0.10,0.01,0.16v5.2c0,3.68-1.51,7.03-3.93,9.46C117.94,36.03,116.79,36.87,115.51,37.52L115.51,37.52z M103.83,79.61V37.7c-1.42-0.67-2.71-1.58-3.8-2.67c-0.96-0.96-1.77-2.06-2.41-3.27c-0.63,1.21-1.45,2.31-2.41,3.27 c-2.43,2.43-5.78,3.93-9.46,3.93c-3.68,0-7.03-1.51-9.46-3.93c-0.96-0.96-1.77-2.06-2.41-3.27c-0.63,1.21-1.45,2.31-2.41,3.27 c-2.43,2.43-5.78,3.93-9.46,3.93c-3.68,0-7.03-1.51-9.46-3.93c-0.96-0.96-1.77-2.06-2.41-3.27c-0.63,1.21-1.45,2.31-2.41,3.27 c-2.43,2.43-5.78,3.93-9.46,3.93c-3.68,0-7.03-1.51-9.46-3.93c-0.96-0.96-1.77-2.06-2.41-3.27c-0.63,1.21-1.45,2.31-2.41,3.27 c-1.6,1.6-3.59,2.8-5.82,3.43v41.16h19.98c0.19-1.83,1.23-3.94,1.89-4.82c0.6-0.79,1.34-1.37,2.16-1.83 c2.47-1.37,8.88-1.83,11.54-3.69c0.2-0.29,0.41-0.72,0.61-1.18c0.31-0.7,0.58-1.46,0.76-1.98c-0.75-0.88-1.38-1.87-1.99-2.84 l-2.02-3.21c-0.74-1.1-1.12-2.11-1.14-2.93c-0.01-0.39,0.05-0.74,0.2-1.05c0.15-0.32,0.38-0.6,0.69-0.81 c0.15-0.1,0.31-0.18,0.49-0.25c-0.13-1.74-0.18-3.93-0.1-5.77c0.04-0.44,0.13-0.87,0.25-1.31c0.52-1.84,1.81-3.32,3.41-4.34 c0.88-0.56,1.85-0.99,2.86-1.27c0.64-0.18-0.09-1.62,0.57-1.69c3.2-0.33,7.93,1.99,10.17,4.41c1.12,1.21,1.82,2.82,1.97,4.94 l-0.13,5.24l0,0c0.56,0.17,0.92,0.52,1.06,1.1c0.16,0.64-0.01,1.53-0.55,2.76l0,0c-0.01,0.02-0.02,0.04-0.03,0.07l-2.3,3.79 c-0.84,1.39-1.7,2.79-2.82,3.89c0.1,0.14,0.2,0.29,0.3,0.44c0.46,0.67,0.91,1.34,1.5,1.93c0.02,0.02,0.04,0.04,0.05,0.06l0,0 c2.65,1.87,9.09,2.32,11.56,3.7c0.82,0.46,1.56,1.04,2.16,1.83c0.67,0.88,1.7,2.99,1.89,4.82H103.83L103.83,79.61z M5.24,18.84 h19.97l3.67-15.79H14.1L5.24,18.84L5.24,18.84z M73.73,3.05l1.53,15.79h20.38L91.47,3.05H73.73L73.73,3.05z M72.2,18.84L70.68,3.05 H53.32l-1.5,15.79H72.2L72.2,18.84z M48.77,18.84l1.5-15.79H32.01l-3.67,15.79H48.77L48.77,18.84z M94.62,3.05l4.17,15.79h19.91 l-9.57-15.79H94.62L94.62,3.05z M99.15,21.89v3.67c0,2.84,1.16,5.43,3.04,7.3c1.87,1.87,4.46,3.04,7.3,3.04 c2.84,0,5.43-1.16,7.3-3.04c1.87-1.87,3.04-4.46,3.04-7.3v-3.67H99.15L99.15,21.89z M75.41,21.89v3.67c0,2.84,1.16,5.43,3.04,7.3 c1.87,1.87,4.46,3.04,7.3,3.04c2.84,0,5.43-1.16,7.3-3.04c1.87-1.87,3.04-4.46,3.04-7.3v-3.67H75.41L75.41,21.89z M51.68,21.89 v3.67c0,2.84,1.16,5.43,3.04,7.3c1.87,1.87,4.46,3.04,7.3,3.04c2.84,0,5.43-1.16,7.3-3.04c1.87-1.87,3.04-4.46,3.04-7.3v-3.67 H51.68L51.68,21.89z M27.95,21.89v3.67c0,2.84,1.16,5.43,3.04,7.3c1.87,1.87,4.46,3.04,7.3,3.04c2.84,0,5.43-1.16,7.3-3.04 c1.87-1.87,3.04-4.46,3.04-7.3v-3.67H27.95L27.95,21.89z M24.89,21.89H4.21v3.67c0,2.84,1.16,5.43,3.04,7.3 c1.87,1.87,4.46,3.04,7.3,3.04c2.84,0,5.43-1.16,7.3-3.04c1.87-1.87,3.04-4.46,3.04-7.3V21.89L24.89,21.89z M48.29,79.61h25.18 l0.68-7.58c-2.08-0.41-4.28-0.72-6.59-2.05c-1.42,6.25-11.07,7.14-13.85,0.17c-2.07,1.04-4.08,1.64-6.48,2.01L48.29,79.61 L48.29,79.61z M7.07,85.87h107.87c0.48,0,0.88,0.4,0.88,0.88v26.59c0,0.48-0.4,0.88-0.88,0.88H7.07c-0.48,0-0.88-0.39-0.88-0.88 V86.75C6.2,86.26,6.59,85.87,7.07,85.87L7.07,85.87z M52.52,55.96c-0.45,0.02-0.79,0.11-1.02,0.27c-0.13,0.09-0.23,0.2-0.29,0.34 c-0.07,0.15-0.1,0.33-0.1,0.54c0.02,0.61,0.34,1.42,0.96,2.34l0.01,0.01l2.02,3.21c0.81,1.29,1.66,2.6,2.71,3.56 c1.01,0.93,2.24,1.55,3.87,1.56c1.76,0,3.05-0.65,4.09-1.63c1.09-1.02,1.94-2.41,2.79-3.8l2.27-3.74c0.42-0.97,0.58-1.61,0.48-1.99 c-0.06-0.23-0.31-0.34-0.73-0.36c-0.09,0-0.18-0.01-0.28,0c-0.1,0-0.21,0.01-0.32,0.02c-0.06,0.01-0.12,0-0.18-0.01 c-0.2,0.01-0.41,0-0.62-0.03l0.78-3.44c-5.77,0.91-10.09-3.38-16.2-0.86l0.44,4.06C52.97,56,52.74,55.99,52.52,55.96L52.52,55.96 L52.52,55.96L52.52,55.96z"
                  />
                </svg>
              </motion.div>
              <motion.h3 
                className="text-xl font-semibold text-neutral-100 mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                No Vendors Yet
              </motion.h3>
              <motion.p 
                className="text-neutral-500 mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                Get started by adding your first vendor to the food court
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button asChild size="lg">
                  <Link href={`/admin/${courtId}/vendors/add`}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Vendor
                  </Link>
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  )
}
