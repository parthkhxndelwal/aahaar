"use client"

import { use } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useVendorAuth } from "@/contexts/vendor-auth-context"
import { useRouter } from "next/navigation"

export default function AccountSettings({ params }: { params: Promise<{ courtId: string }> }) {
  const { user } = useVendorAuth()
  const { courtId } = use(params)
  const router = useRouter()

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Account Settings</h1>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Manage your profile and business information
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Coming Soon Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-neutral-900 rounded-2xl p-8"
        >
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold">Account Settings</h2>
            <p className="text-neutral-600 dark:text-neutral-400 max-w-md mx-auto">
              This page is currently under development. Soon you'll be able to manage your profile information, business details, and account preferences.
            </p>
            
            {user && (
              <div className="mt-6 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                <h3 className="font-medium mb-2">Current Account Information</h3>
                <div className="space-y-1 text-sm">
                  <div><span className="text-neutral-500">Name:</span> {user.fullName || "Not set"}</div>
                  <div><span className="text-neutral-500">Email:</span> {user.email}</div>
                  <div><span className="text-neutral-500">Court ID:</span> {courtId}</div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
