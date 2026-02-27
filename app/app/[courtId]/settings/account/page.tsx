"use client"
import { use } from "react"
import Link from "next/link"
import { ArrowLeft, User, Lock, Bell, HelpCircle, Info, ChevronRight, LogOut } from "lucide-react"
import { motion } from "framer-motion"
import { useAppAuth } from "@/contexts/app-auth-context"

export default function AccountSettingsPage({ params }: { params: Promise<{ courtId: string }> }) {
  const { courtId } = use(params)
  const { logout } = useAppAuth()

  const accountOptions = [
    {
      title: "Profile Settings",
      description: "Update your personal information and preferences",
      icon: User,
      href: `/app/${courtId}/settings/account/profile`,
    },
    {
      title: "View Activity Log",
      description: "Review recent activity about your account activity",
      icon: Bell,
      href: `/app/${courtId}/settings/account/activity-logs`,
    }
  ]

  return (
    <motion.div 
      className="min-h-screen bg-neutral-950 p-4"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <div className="max-w-md mx-auto space-y-6">
        <motion.div 
          className="flex items-center space-x-3 mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Link href={`/app/${courtId}/settings`}>
              <ArrowLeft className="h-6 w-6 text-white" />
            </Link>
          </motion.div>
          <h1 className="text-xl font-bold text-white">Account Settings</h1>
        </motion.div>
        
        <div className="space-y-3">
          {accountOptions.map((option, index) => {
            const Icon = option.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + (index * 0.08), duration: 0.3 }}
              >
                <Link 
                  href={option.href}
                  className="block"
                >
                  <motion.div 
                    className="flex items-center justify-between p-4 bg-neutral-950 rounded-lg border border-neutral-800 hover:bg-neutral-900 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-neutral-900 rounded-lg">
                        <Icon className="h-5 w-5 text-neutral-300" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{option.title}</h3>
                        <p className="text-neutral-400 text-sm">{option.description}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-neutral-600" />
                  </motion.div>
                </Link>
              </motion.div>
            )
          })}
        </div>

        {/* Logout Button */}
        <motion.div
          className="pt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          <div className="flex justify-center">
            <motion.button
              onClick={logout}
              className="flex items-center space-x-3 px-6 py-3 bg-red-600/10 border border-red-600/20 rounded-lg text-red-400 hover:bg-red-600/20 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Log out</span>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
