"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Save } from "lucide-react"

export default function AdminVendorEditPage() {
  const params = useParams()
  const router = useRouter()
  const courtId = params.courtId as string
  const vendorId = params.vendorId as string

  const [form, setForm] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchVendor = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`/api/admin/vendors/${vendorId}?courtId=${courtId}`)
        const json = await res.json()
        if (!res.ok || !json.success) throw new Error(json.message || 'Failed to load vendor')
        setForm(json.data.vendor)
      } catch (e: any) {
        setError(e.message || 'Failed to load vendor')
      } finally {
        setLoading(false)
      }
    }
    if (vendorId && courtId) fetchVendor()
  }, [vendorId, courtId])

  const update = (key: string, value: any) => setForm((p: any) => ({ ...p, [key]: value }))

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/vendors/${vendorId}?courtId=${courtId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stallName: form.stallName,
          vendorName: form.vendorName,
          contactEmail: form.contactEmail,
          contactPhone: form.contactPhone,
          stallLocation: form.stallLocation,
          cuisineType: form.cuisineType,
          description: form.description,
          status: form.status,
          panNumber: form.panNumber,
          gstin: form.gstin,
          bankAccountNumber: form.bankAccountNumber,
          bankIfscCode: form.bankIfscCode,
          bankAccountHolderName: form.bankAccountHolderName,
          bankName: form.bankName,
          maxOrdersPerHour: form.maxOrdersPerHour,
          averagePreparationTime: form.averagePreparationTime,
        })
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to save vendor')
      router.push(`/admin/${courtId}/vendors/${vendorId}`)
    } catch (e: any) {
      setError(e.message || 'Failed to save vendor')
    } finally {
      setSaving(false)
    }
  }

  const cuisineOptions = [
    "north indian", "south indian", "chinese", "italian", "fast food",
    "snacks", "beverages", "desserts", "multi-cuisine", "other"
  ]
  const statusOptions = ["active", "inactive", "maintenance", "suspended"]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={() => router.push(`/admin/${courtId}/vendors/${vendorId}`)} className="dark:border-neutral-700 dark:text-neutral-300">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <div className="flex-1" />
        <Button onClick={save} disabled={saving || loading} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
          <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {loading ? (
        <Card className="dark:bg-neutral-900 dark:border-neutral-800"><CardContent className="py-10 text-center text-neutral-400">Loading...</CardContent></Card>
      ) : error ? (
        <Card className="dark:bg-neutral-900 dark:border-neutral-800"><CardContent className="py-10 text-center text-red-400">{error}</CardContent></Card>
      ) : form ? (
        <Card className="dark:bg-neutral-900 dark:border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white">Edit Vendor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Stall Name</Label>
                <Input value={form.stallName || ''} onChange={e => update('stallName', e.target.value)} className="bg-neutral-800 border-neutral-700 text-white" />
              </div>
              <div>
                <Label className="text-white">Vendor Name</Label>
                <Input value={form.vendorName || ''} onChange={e => update('vendorName', e.target.value)} className="bg-neutral-800 border-neutral-700 text-white" />
              </div>
              <div>
                <Label className="text-white">Contact Email</Label>
                <Input type="email" value={form.contactEmail || ''} onChange={e => update('contactEmail', e.target.value)} className="bg-neutral-800 border-neutral-700 text-white" />
              </div>
              <div>
                <Label className="text-white">Contact Phone</Label>
                <Input value={form.contactPhone || ''} onChange={e => update('contactPhone', e.target.value)} className="bg-neutral-800 border-neutral-700 text-white" />
              </div>
              <div>
                <Label className="text-white">Stall Location</Label>
                <Input value={form.stallLocation || ''} onChange={e => update('stallLocation', e.target.value)} className="bg-neutral-800 border-neutral-700 text-white" />
              </div>
              <div>
                <Label className="text-white">Cuisine Type</Label>
                <Select value={form.cuisineType || ''} onValueChange={(v) => update('cuisineType', v)}>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                    <SelectValue placeholder="Select cuisine type" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
                    {cuisineOptions.map(c => (
                      <SelectItem key={c} value={c} className="text-white hover:bg-neutral-700">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label className="text-white">Description</Label>
                <Textarea value={form.description || ''} onChange={e => update('description', e.target.value)} className="bg-neutral-800 border-neutral-700 text-white" rows={3} />
              </div>
            </div>

            <Separator className="bg-neutral-700" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Status</Label>
                <Select value={form.status || 'inactive'} onValueChange={(v) => update('status', v)}>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
                    {statusOptions.map(s => (
                      <SelectItem key={s} value={s} className="text-white hover:bg-neutral-700">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white">PAN Number</Label>
                <Input value={form.panNumber || ''} onChange={e => update('panNumber', e.target.value.toUpperCase())} className="bg-neutral-800 border-neutral-700 text-white" />
              </div>
              <div>
                <Label className="text-white">GSTIN</Label>
                <Input value={form.gstin || ''} onChange={e => update('gstin', e.target.value.toUpperCase())} className="bg-neutral-800 border-neutral-700 text-white" />
              </div>
            </div>

            <Separator className="bg-neutral-700" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Bank Name</Label>
                <Input value={form.bankName || ''} onChange={e => update('bankName', e.target.value)} className="bg-neutral-800 border-neutral-700 text-white" />
              </div>
              <div>
                <Label className="text-white">IFSC Code</Label>
                <Input value={form.bankIfscCode || ''} onChange={e => update('bankIfscCode', e.target.value.toUpperCase())} className="bg-neutral-800 border-neutral-700 text-white" />
              </div>
              <div>
                <Label className="text-white">Account Holder</Label>
                <Input value={form.bankAccountHolderName || ''} onChange={e => update('bankAccountHolderName', e.target.value)} className="bg-neutral-800 border-neutral-700 text-white" />
              </div>
              <div>
                <Label className="text-white">Account Number</Label>
                <Input value={form.bankAccountNumber || ''} onChange={e => update('bankAccountNumber', e.target.value)} className="bg-neutral-800 border-neutral-700 text-white" />
              </div>
              <div>
                <Label className="text-white">Max Orders / Hour</Label>
                <Input type="number" value={form.maxOrdersPerHour ?? 10} onChange={e => update('maxOrdersPerHour', parseInt(e.target.value))} className="bg-neutral-800 border-neutral-700 text-white" />
              </div>
              <div>
                <Label className="text-white">Avg Prep (minutes)</Label>
                <Input type="number" value={form.averagePreparationTime ?? 15} onChange={e => update('averagePreparationTime', parseInt(e.target.value))} className="bg-neutral-800 border-neutral-700 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
