"use client"

import { use, useState } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Bug, Send, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useVendorAuth } from "@/contexts/vendor-auth-context"
import { useRouter } from "next/navigation"

export default function ReportBug({ params }: { params: Promise<{ courtId: string }> }) {
  const { user } = useVendorAuth()
  const { courtId } = use(params)
  const router = useRouter()
  
  const [bugType, setBugType] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    
    // Simulate API call
    setTimeout(() => {
      setSubmitted(true)
      setSubmitting(false)
    }, 2000)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-neutral-900 rounded-2xl p-8"
          >
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold">Bug Report Submitted</h2>
              <p className="text-neutral-600 dark:text-neutral-400 max-w-md mx-auto">
                Thank you for reporting this issue. Our technical team will review your report and get back to you within 24-48 hours.
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => setSubmitted(false)} variant="outline">
                  Report Another Issue
                </Button>
                <Button onClick={() => router.back()}>
                  Back to Settings
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

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
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <Bug className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Report a Bug</h1>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Help us improve by reporting any issues you encounter
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bug Report Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-neutral-900 rounded-2xl p-6"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="bug-type">Issue Type</Label>
                <Select value={bugType} onValueChange={setBugType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select the type of issue" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ui">User Interface Problem</SelectItem>
                    <SelectItem value="functionality">Feature Not Working</SelectItem>
                    <SelectItem value="performance">Performance Issue</SelectItem>
                    <SelectItem value="data">Data Display Problem</SelectItem>
                    <SelectItem value="mobile">Mobile App Issue</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="title">Issue Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Brief description of the issue"
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Detailed Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please describe the issue in detail. Include steps to reproduce, expected behavior, and what actually happened."
                  className="mt-1 min-h-[120px]"
                  required
                />
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <h4 className="font-medium text-blue-800 dark:text-blue-400 mb-2">
                  Tips for Better Bug Reports
                </h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Be specific about what you were trying to do</li>
                  <li>• Include the exact error message if any</li>
                  <li>• Mention your device type (mobile/desktop)</li>
                  <li>• Include the time when the issue occurred</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!bugType || !title || !description || submitting}
                className="flex-1"
              >
                {submitting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                {submitting ? "Submitting..." : "Submit Bug Report"}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
