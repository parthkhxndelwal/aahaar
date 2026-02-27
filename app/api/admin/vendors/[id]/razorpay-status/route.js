import { NextResponse } from "next/server"
import db from "@/models"

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const vendor = await db.Vendor.findByPk(id)
    if (!vendor) return NextResponse.json({ success: false, message: 'Vendor not found' }, { status: 404 })
    if (!vendor.razorpayAccountId || !vendor.metadata?.productConfiguration?.productId) {
      return NextResponse.json({ success: true, data: { activated: false } })
    }

    const keyId = process.env.RAZORPAY_TEST_APIKEY || process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_API_SECRET || process.env.RAZORPAY_KEY_SECRET
    const auth = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64')
    const headers = { 'Authorization': auth }

    const accountId = vendor.razorpayAccountId
    const productId = vendor.metadata.productConfiguration.productId

    const res = await fetch(`https://api.razorpay.com/v2/accounts/${accountId}/products/${productId}`, { headers })
    const json = await res.json()
    if (!res.ok) {
      return NextResponse.json({ success: false, message: json?.error?.description || json?.message || 'Failed to fetch status' }, { status: 400 })
    }

    const activation_status = json.activation_status || json.active_configuration?.activation_status
    const activated = activation_status === 'activated'

    // persist the latest status
    await vendor.update({ metadata: { ...vendor.metadata, productConfiguration: { ...(vendor.metadata?.productConfiguration || {}), activation_status } } })

    return NextResponse.json({ success: true, data: { activated, activation_status, raw: json } })
  } catch (error) {
    console.error('Razorpay status fetch error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
