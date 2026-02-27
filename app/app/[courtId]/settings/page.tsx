"use client"
import { use } from "react"
import Link from "next/link"
import { User, Settings as SettingsIcon, Clock, ChevronRight } from "lucide-react"
import { motion } from "framer-motion"

export default function SettingsPage({ params }: { params: Promise<{ courtId: string }> }) {
  const { courtId } = use(params)

  const settingsOptions = [
    {
      title: "Account Settings",
      description: "Manage your personal information and account preferences",
      icon: User,
      href: `/app/${courtId}/settings/account`,
    },
    {
      title: "Order History",
      description: "View your past orders and track current ones",
      icon: Clock,
      href: `/app/${courtId}/settings/order-history`,
    },
    {
      title: "Manage Orders",
      description: "Cancel, modify or reorder from your recent orders",
      icon: SettingsIcon,
      href: `/app/${courtId}/settings/manage-orders`,
    },
    {
      title: "Contact Customer Care",
      description: "Get help and support for your orders and account",
      icon: SettingsIcon,
      href: `/app/${courtId}/settings/contact-care`,
    },
  ]

  return (
    <motion.div 
      className="min-h-screen bg-neutral-950 p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <div className="max-w-md mx-auto space-y-6">
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <h1 className="text-2xl font-bold text-white mb-2">Settings</h1>
          <p className="text-neutral-400">Manage your account and preferences</p>
        </motion.div>
        
        <div className="space-y-3">
          {settingsOptions.map((option, index) => {
            const Icon = option.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + (index * 0.1), duration: 0.3 }}
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
      </div>
    </motion.div>
  )
}
