import { NextResponse } from "next/server"
import db from "@/models"

export async function POST(request, { params }) {
  try {
    const { id } = await params
    const vendor = await db.Vendor.findByPk(id)
    if (!vendor) {
      return NextResponse.json({ success: false, message: "Vendor not found" }, { status: 404 })
    }

    const keyId = process.env.RAZORPAY_TEST_APIKEY || process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_API_SECRET || process.env.RAZORPAY_KEY_SECRET
    if (!keyId || !keySecret) {
      return NextResponse.json({ success: false, message: "Razorpay credentials missing in environment" }, { status: 500 })
    }
    const auth = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64')
    const headers = { 'Authorization': auth, 'Content-Type': 'application/json' }
    const base = 'https://api.razorpay.com/v2'

    let accountId = vendor.razorpayAccountId || null
    let stakeholderId = vendor.metadata?.stakeholderId || null
    let productId = vendor.metadata?.productConfiguration?.productId || null

    // 1) Create Linked Account if missing
    if (!accountId) {
      const businessType = vendor.metadata?.businessType || 'individual'
      // Force category/subcategory
      const category = 'food'
      const subcategory = 'restaurant'
      const addr = vendor.metadata?.registeredAddress || {}
      // Build short reference id (<20 chars)
      const stallSlug = (vendor.stallName || '').toLowerCase().replace(/[^a-z0-9]/g, '')
      const shortStall = stallSlug.slice(0, 6) || 'vendor'
      const shortCourt = (vendor.courtId || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 4) || 'ct'
      const ts = Date.now().toString(36).slice(-4)
      const refId = `${shortCourt}${shortStall}${ts}`.slice(0, 19)

      const payload = {
        email: vendor.contactEmail,
        phone: vendor.contactPhone?.startsWith('+') ? vendor.contactPhone : `+91${vendor.contactPhone}`,
        type: 'route',
        reference_id: refId,
        legal_business_name: vendor.stallName,
        business_type: businessType,
        contact_name: vendor.vendorName,
        profile: {
          category,
          subcategory,
          addresses: {
            registered: {
              street1: addr.addressStreet1 || vendor.stallLocation || 'Address Line 1',
              street2: addr.addressStreet2 || '',
              city: addr.addressCity || 'City',
              state: (addr.addressState || 'STATE').toUpperCase(),
              postal_code: addr.addressPostalCode || '000000',
              country: (addr.addressCountry || 'IN').toUpperCase(),
            }
          }
        },
        legal_info: vendor.panNumber ? { pan: vendor.panNumber } : undefined
      }
      const res = await fetch(`${base}/accounts`, { method: 'POST', headers, body: JSON.stringify(payload) })
      const json = await res.json()
      if (!res.ok) {
        return NextResponse.json({ success: false, message: json?.error?.description || json?.message || 'Failed to create account' }, { status: 400 })
      }
      accountId = json.id
      await vendor.update({ razorpayAccountId: accountId, metadata: { ...vendor.metadata, razorpayAccountStatus: json.status, razorpayReferenceId: refId, businessCategory: category, businessSubcategory: subcategory } })
    }

    // 2) Create Stakeholder if missing
    if (!stakeholderId) {
      const addr = vendor.metadata?.registeredAddress || {}
      const residentialStreet = [addr.addressStreet1, addr.addressStreet2].filter(Boolean).join(', ')
      const payload = {
        name: vendor.vendorName,
        email: vendor.contactEmail,
        addresses: {
          residential: {
            street: residentialStreet || (vendor.stallLocation || 'Address'),
            city: addr.addressCity || 'City',
            state: addr.addressState || 'State',
            postal_code: addr.addressPostalCode || '000000',
            country: (addr.addressCountry || 'IN').toLowerCase()
          }
        }
      }
      const res = await fetch(`${base}/accounts/${accountId}/stakeholders`, { method: 'POST', headers, body: JSON.stringify(payload) })
      const json = await res.json()
      if (!res.ok) {
        return NextResponse.json({ success: false, message: json?.error?.description || json?.message || 'Failed to create stakeholder' }, { status: 400 })
      }
      stakeholderId = json.id
      await vendor.update({ metadata: { ...vendor.metadata, stakeholderId } })
    }

    // 3a) Initialize Product if missing
    if (!productId) {
      const payload = { product_name: 'route', tnc_accepted: true }
      const res = await fetch(`${base}/accounts/${accountId}/products`, { method: 'POST', headers, body: JSON.stringify(payload) })
      const json = await res.json()
      if (!res.ok) {
        return NextResponse.json({ success: false, message: json?.error?.description || json?.message || 'Failed to init product' }, { status: 400 })
      }
      productId = json.id
      await vendor.update({ metadata: { ...vendor.metadata, productConfiguration: { productId, activation_status: json.activation_status, requirements: json.requirements || [] } } })
    }

    // 3b) Patch Product settlements
    const patchPayload = {
      settlements: {
        account_number: vendor.bankAccountNumber || '',
        ifsc_code: vendor.bankIfscCode || '',
        beneficiary_name: vendor.bankAccountHolderName || vendor.vendorName
      }
    }
    const patchRes = await fetch(`${base}/accounts/${accountId}/products/${productId}`, { method: 'PATCH', headers, body: JSON.stringify(patchPayload) })
    const patchJson = await patchRes.json()
    if (!patchRes.ok) {
      return NextResponse.json({ success: false, message: patchJson?.error?.description || patchJson?.message || 'Failed to update product' }, { status: 400 })
    }

    await vendor.update({ metadata: { ...vendor.metadata, productConfiguration: { productId, activation_status: patchJson.activation_status || patchJson.active_configuration?.activation_status || 'unknown', requirements: patchJson.requirements || [] } } })

    return NextResponse.json({ success: true, message: 'Razorpay account configured', data: { accountId, stakeholderId, productId } })
  } catch (error) {
    console.error('Razorpay account setup error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
