"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FloatingInput } from "@/components/ui/floating-input"
import { FloatingSelect } from "@/components/ui/floating-select"
import { useToast } from "@/hooks/use-toast"
import { Plus } from "lucide-react"
import { adminCourtApi } from "@/lib/api"

interface CreateCourtDialogProps {
  token: string
  onCourtCreated: () => void
}

export function CreateCourtDialog({ token, onCourtCreated }: CreateCourtDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    courtId: "",
    instituteName: "",
    instituteType: "college",
    contactEmail: "",
    contactPhone: "",
    address: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { toast } = useToast()

  const validateField = (field: string, value: string) => {
    let error = ""
    switch (field) {
      case "courtId":
        if (!value) error = "Court ID is required"
        else if (!/^[a-z0-9-]+$/.test(value)) error = "Court ID can only contain lowercase letters, numbers, and hyphens"
        else if (value.length < 3) error = "Court ID must be at least 3 characters long"
        break
      case "instituteName":
        if (!value) error = "Institute name is required"
        else if (value.length < 2) error = "Institute name must be at least 2 characters long"
        break
      case "contactEmail":
        if (!value) error = "Contact email is required"
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = "Please enter a valid email address"
        break
    }
    
    setErrors(prev => ({ ...prev, [field]: error }))
    return error === ""
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Debounced validation
    setTimeout(() => validateField(field, value), 300)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate all required fields
    const requiredFields = ["courtId", "instituteName", "contactEmail"]
    let hasErrors = false
    
    requiredFields.forEach(field => {
      const isValid = validateField(field, formData[field as keyof typeof formData])
      if (!isValid) hasErrors = true
    })

    if (hasErrors) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const response = await adminCourtApi.create({
        courtId: formData.courtId,
        instituteName: formData.instituteName,
        instituteType: formData.instituteType,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
      })

      toast({
        title: "Success",
        description: "Court created successfully!"
      })
      setOpen(false)
      setFormData({
        courtId: "",
        instituteName: "",
        instituteType: "college",
        contactEmail: "",
        contactPhone: "",
        address: "",
      })
      setErrors({})
      onCourtCreated()
    } catch (error: any) {
      console.error("Error creating court:", error)
      toast({
        title: "Error",
        description: error.message || "An error occurred while creating the court",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-foreground hover:bg-foreground/90 text-background">
          <Plus className="h-4 w-4 mr-2" />
          Add New Court
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-background border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Create New Court</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Add a new food court to your management system
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <FloatingInput
            label="Court ID (e.g. vbs-ghamroj)"
            value={formData.courtId}
            onChange={(e) => handleInputChange("courtId", e.target.value.toLowerCase())}
            error={errors.courtId}
            required
          />

          <FloatingInput
            label="Institute Name"
            value={formData.instituteName}
            onChange={(e) => handleInputChange("instituteName", e.target.value)}
            error={errors.instituteName}
            required
          />

          <FloatingSelect
            label="Institute Type"
            value={formData.instituteType}
            onValueChange={(value) => setFormData(prev => ({ ...prev, instituteType: value }))}
            options={[
              { value: "school", label: "School" },
              { value: "college", label: "College" },
              { value: "office", label: "Office" },
              { value: "hospital", label: "Hospital" },
              { value: "other", label: "Other" }
            ]}
          />

          <FloatingInput
            label="Contact Email"
            type="email"
            value={formData.contactEmail}
            onChange={(e) => handleInputChange("contactEmail", e.target.value)}
            error={errors.contactEmail}
            required
          />

          <FloatingInput
            label="Contact Phone (Optional)"
            type="tel"
            value={formData.contactPhone}
            onChange={(e) => handleInputChange("contactPhone", e.target.value)}
            error={errors.contactPhone}
          />

          <FloatingInput
            label="Address (Optional)"
            value={formData.address}
            onChange={(e) => handleInputChange("address", e.target.value)}
            error={errors.address}
          />

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-foreground hover:bg-foreground/90 text-background"
            >
              {loading ? "Creating..." : "Create Court"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
