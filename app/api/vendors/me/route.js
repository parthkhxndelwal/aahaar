import { NextResponse } from "next/server"
import { Vendor } from "@/models"
import { authenticateToken } from "@/middleware/auth"

export async function GET(request) {
  try {
    console.log('🔍 [VendorAPI] GET /api/vendors/me called')
    
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) {
      console.log('❌ [VendorAPI] Authentication failed')
      return authResult
    }

    const { user } = authResult
    console.log('🔍 [VendorAPI] Authenticated user:', { id: user.id, role: user.role, email: user.email })

    if (user.role !== "vendor") {
      console.log('❌ [VendorAPI] User role is not vendor:', user.role)
      return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 })
    }

    // Find vendor associated with this user
    console.log('🔍 [VendorAPI] Looking for vendor with userId:', user.id)
    const vendor = await Vendor.findOne({
      where: { userId: user.id },
      attributes: ['id', 'stallName', 'vendorName', 'courtId', 'status', 'isOnline']
    })

    console.log('🔍 [VendorAPI] Vendor query result:', vendor ? { id: vendor.id, stallName: vendor.stallName } : 'null')

    if (!vendor) {
      console.log('❌ [VendorAPI] Vendor not found for userId:', user.id)
      return NextResponse.json({ success: false, message: "Vendor not found" }, { status: 404 })
    }

    console.log('✅ [VendorAPI] Vendor found, returning data')
    return NextResponse.json({
      success: true,
      data: {
        vendor: vendor
      },
    })
  } catch (error) {
    console.error("❌ [VendorAPI] Get vendor info error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
