"use client"

import { use, useState } from "react"
import { motion } from "framer-motion"
import { 
  ArrowLeft, 
  MessageCircle, 
  Phone, 
  Mail, 
  Clock,
  Send,
  CheckCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useVendorAuth } from "@/contexts/vendor-auth-context"
import { useRouter } from "next/navigation"

export default function ContactSupport({ params }: { params: Promise<{ courtId: string }> }) {
  const { user } = useVendorAuth()
  const { courtId } = use(params)
  const router = useRouter()
  
  const [inquiryType, setInquiryType] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const contactMethods = [
    {
      icon: <Phone className="h-6 w-6" />,
      title: "Phone Support",
      description: "Call us for immediate assistance",
      value: "+91 99999-XXXXX",
      action: "Call Now",
      available: "Mon-Sat, 9 AM - 8 PM"
    },
    {
      icon: <Mail className="h-6 w-6" />,
      title: "Email Support",
      description: "Send us a detailed message",
      value: "vendor-support@aahaar.com",
      action: "Send Email",
      available: "24/7 - Response within 4 hours"
    }
  ]

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
              <h2 className="text-xl font-semibold">Message Sent Successfully</h2>
              <p className="text-neutral-600 dark:text-neutral-400 max-w-md mx-auto">
                Thank you for contacting us. Our support team will get back to you within 4 hours during business hours.
              </p>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <div className="text-sm text-blue-800 dark:text-blue-400">
                  <strong>Ticket ID:</strong> CS-{Math.random().toString(36).substr(2, 9).toUpperCase()}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                  Save this ID for future reference
                </div>
              </div>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => setSubmitted(false)} variant="outline">
                  Send Another Message
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
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <MessageCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Contact Customer Care</h1>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Get help from our customer support team
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Methods */}
        <div className="grid md:grid-cols-2 gap-4">
          {contactMethods.map((method, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
                      {method.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{method.title}</h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                        {method.description}
                      </p>
                      <div className="font-medium text-blue-600 mb-2">
                        {method.value}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-neutral-500 mb-3">
                        <Clock className="h-3 w-3" />
                        {method.available}
                      </div>
                      <Button size="sm" variant="outline" className="w-full">
                        {method.action}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-neutral-900 rounded-2xl p-6"
        >
          <h2 className="text-lg font-semibold mb-4">Send us a Message</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="inquiry-type">Inquiry Type</Label>
                <Select value={inquiryType} onValueChange={setInquiryType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select inquiry type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Technical Support</SelectItem>
                    <SelectItem value="account">Account Issues</SelectItem>
                    <SelectItem value="payment">Payment & Billing</SelectItem>
                    <SelectItem value="orders">Order Management</SelectItem>
                    <SelectItem value="features">Feature Request</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief subject line"
                  className="mt-1"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Please describe your issue or question in detail. Include any relevant information that might help us assist you better."
                className="mt-1 min-h-[120px]"
                required
              />
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <h4 className="font-medium text-green-800 dark:text-green-400 mb-2">
                Support Response Times
              </h4>
              <div className="grid md:grid-cols-2 gap-3 text-sm text-green-700 dark:text-green-300">
                <div>• Technical Issues: 2-4 hours</div>
                <div>• Account Problems: 1-2 hours</div>
                <div>• Payment Issues: 30 minutes</div>
                <div>• General Inquiries: 4-6 hours</div>
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
                disabled={!inquiryType || !subject || !message || submitting}
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
                {submitting ? "Sending..." : "Send Message"}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
