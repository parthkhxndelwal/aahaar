"use client"
import { use } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { motion } from "framer-motion"

export default function ChangePasswordPage({ params }: { params: Promise<{ courtId: string }> }) {
  const { courtId } = use(params)

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
            <Link href={`/app/${courtId}/settings/account`}>
              <ArrowLeft className="h-6 w-6 text-white" />
            </Link>
          </motion.div>
          <h1 className="text-xl font-bold text-white">Change Password</h1>
        </motion.div>
        
        <motion.div 
          className="text-center py-20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <p className="text-neutral-400">Change password page coming soon...</p>
        </motion.div>
      </div>
    </motion.div>
  )
}
