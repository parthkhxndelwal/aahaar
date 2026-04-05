"use client"

import { use, useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  User, 
  CreditCard, 
  Bug, 
  MessageCircle, 
  ChevronRight,
  Power,
  PowerOff,
  AlertCircle,
  CheckCircle2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { useUnifiedAuth } from "@/contexts/unified-auth-context"
import { useRouter } from "next/navigation"
import { vendorApi } from "@/lib/api"

interface SettingsOption {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  href: string
}

export default function VendorSettings({ params }: { params: Promise<{ courtId: string }> }) {
  const { user } = useUnifiedAuth()
  const { courtId } = use(params)
  const router = useRouter()
  
  const [isOnline, setIsOnline] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const settingsOptions: SettingsOption[] = [
    {
      id: "account",
      title: "Account Settings",
      description: "Manage your profile, business information, and preferences",
      icon: <User className="h-6 w-6" />,
      href: `/vendor/${courtId}/settings/account`
    },
    {
      id: "payment",
      title: "Payment History",
      description: "View your payment history, settlements, and financial reports",
      icon: <CreditCard className="h-6 w-6" />,
      href: `/vendor/${courtId}/settings/payment-history`
    },
    {
      id: "bug",
      title: "Report a Bug",
      description: "Report technical issues or problems you're experiencing",
      icon: <Bug className="h-6 w-6" />,
      href: `/vendor/${courtId}/settings/report-bug`
    },
    {
      id: "contact",
      title: "Contact Customer Care",
      description: "Get help from our customer support team",
      icon: <MessageCircle className="h-6 w-6" />,
      href: `/vendor/${courtId}/settings/contact-support`
    }
  ]

  useEffect(() => {
    // Fetch current vendor online status
    fetchVendorStatus()
  }, [])

  const fetchVendorStatus = async () => {
    try {
      const data = await vendorApi.getMe()
      if (data.vendor) {
        setIsOnline((data.vendor as any).isOnline || false)
      }
    } catch (error) {
      console.error("Error fetching vendor status:", error)
    }
  }

  const handleOnlineToggle = async (checked: boolean) => {
    setUpdating(true)
    setError(null)
    setSuccess(null)
    
    try {
      console.log('Updating vendor status to:', checked)
      const data = await vendorApi.updateMyStatus(checked ? 'active' : 'inactive')
      console.log('Status update response:', data)

      setIsOnline(checked)
      setSuccess(`Successfully went ${checked ? 'online' : 'offline'}`)
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error("Error updating vendor status:", error)
      setError(error instanceof Error ? error.message : 'Failed to update status')
      // Clear error message after 5 seconds
      setTimeout(() => setError(null), 5000)
    } finally {
      setUpdating(false)
    }
  }

  const handleSettingClick = (href: string) => {
    router.push(href)
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-card border border-border rounded-2xl p-6">
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-destructive text-sm">{error}</span>
            </div>
          )}
          
          {/* Success Message */}
          {success && (
            <div className="mb-4 p-3 bg-muted border border-border rounded-lg flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-foreground" />
              <span className="text-foreground text-sm">{success}</span>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">Settings</h1>
              <p className="text-muted-foreground">
                Manage your vendor account and preferences
              </p>
              {user && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Logged in as:</span>
                  <span className="text-sm font-medium">{user.fullName || user.email}</span>
                </div>
              )}
            </div>
            
            {/* Online/Offline Toggle */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-medium">Vendor Status</div>
                <Badge 
                  className={isOnline 
                    ? "bg-muted text-foreground" 
                    : "bg-muted text-muted-foreground"
                  }
                >
                  {updating ? "Updating..." : (isOnline ? "Online" : "Offline")}
                </Badge>
              </div>
              <div className="flex flex-col items-center gap-2">
                {updating ? (
                  <div className="h-5 w-5 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
                ) : isOnline ? (
                  <Power className="h-5 w-5 text-foreground" />
                ) : (
                  <PowerOff className="h-5 w-5 text-muted-foreground" />
                )}
                <Switch
                  checked={isOnline}
                  onCheckedChange={handleOnlineToggle}
                  disabled={updating}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Settings Options */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            Settings & Support
          </h2>
          
          <div className="grid gap-4">
            {settingsOptions.map((option, index) => (
              <motion.div
                key={option.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className="cursor-pointer transition-all duration-200 hover:shadow-md hover:bg-muted"
                  onClick={() => handleSettingClick(option.href)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-muted rounded-xl">
                          {option.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{option.title}</h3>
                          <p className="text-muted-foreground text-sm">
                            {option.description}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Status Information */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-semibold mb-3">Vendor Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Court ID:</span>
              <span className="font-medium">{courtId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <Badge 
                className={isOnline 
                  ? "bg-muted text-foreground" 
                  : "bg-muted text-muted-foreground"
                }
              >
                {isOnline ? "Accepting Orders" : "Not Accepting Orders"}
              </Badge>
            </div>
            {isOnline && (
              <div className="mt-2 p-2 bg-muted rounded-lg">
                <div className="text-foreground text-xs">
                  ✓ Your vendor account is online and ready to receive orders
                </div>
              </div>
            )}
            {!isOnline && (
              <div className="mt-2 p-2 bg-muted rounded-lg">
                <div className="text-muted-foreground text-xs">
                  ⚠️ Your vendor account is offline. Toggle online to start receiving orders
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
