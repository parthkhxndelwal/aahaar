"use client"

import { use, useState } from "react"
import { ArrowLeft, Bug, Send, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUnifiedAuth } from "@/contexts/unified-auth-context"
import { useRouter } from "next/navigation"

export default function ReportBug({ params }: { params: Promise<{ courtId: string }> }) {
  const { user } = useUnifiedAuth()
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
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-card border border-border rounded-2xl p-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-foreground" />
              </div>
              <h2 className="text-xl font-semibold">Bug Report Submitted</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
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
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-card border border-border rounded-2xl p-6">
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
              <div className="p-2 bg-muted rounded-lg">
                <Bug className="h-6 w-6 text-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Report a Bug</h1>
                <p className="text-muted-foreground">
                  Help us improve by reporting any issues you encounter
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bug Report Form */}
        <div className="bg-card border border-border rounded-2xl p-6">
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

              <div className="p-4 bg-muted rounded-xl">
                <h4 className="font-medium text-foreground mb-2">
                  Tips for Better Bug Reports
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>â€¢ Be specific about what you were trying to do</li>
                  <li>â€¢ Include the exact error message if any</li>
                  <li>â€¢ Mention your device type (mobile/desktop)</li>
                  <li>â€¢ Include the time when the issue occurred</li>
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
                  <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                {submitting ? "Submitting..." : "Submit Bug Report"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
