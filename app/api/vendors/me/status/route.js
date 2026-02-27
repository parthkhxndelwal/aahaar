import { NextResponse } from "next/server"
import { Vendor } from "@/models"
import { authenticateToken } from "@/middleware/auth"

export async function PATCH(request) {
  try {
    console.log('🔍 [VendorStatusAPI] PATCH /api/vendors/me/status called')
    
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) {
      console.log('❌ [VendorStatusAPI] Authentication failed')
      return authResult
    }

    const { user } = authResult
    console.log('🔍 [VendorStatusAPI] Authenticated user:', { id: user.id, role: user.role, email: user.email })

    if (user.role !== "vendor") {
      console.log('❌ [VendorStatusAPI] User role is not vendor:', user.role)
      return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const { isOnline } = body

    console.log('🔍 [VendorStatusAPI] Request body:', { isOnline })

    if (typeof isOnline !== 'boolean') {
      console.log('❌ [VendorStatusAPI] Invalid isOnline value:', isOnline)
      return NextResponse.json({ 
        success: false, 
        message: "isOnline must be a boolean" 
      }, { status: 400 })
    }

    // Find vendor associated with this user
    console.log('🔍 [VendorStatusAPI] Looking for vendor with userId:', user.id)
    const vendor = await Vendor.findOne({
      where: { userId: user.id }
    })

    if (!vendor) {
      console.log('❌ [VendorStatusAPI] Vendor not found for userId:', user.id)
      return NextResponse.json({ success: false, message: "Vendor not found" }, { status: 404 })
    }

    console.log('🔍 [VendorStatusAPI] Current vendor status:', { 
      id: vendor.id, 
      stallName: vendor.stallName,
      currentIsOnline: vendor.isOnline 
    })

    // Update the vendor's online status
    await vendor.update({ isOnline })

    console.log('✅ [VendorStatusAPI] Vendor status updated successfully:', { 
      vendorId: vendor.id,
      newIsOnline: isOnline 
    })

    return NextResponse.json({
      success: true,
      message: `Vendor is now ${isOnline ? 'online' : 'offline'}`,
      data: {
        vendor: {
          id: vendor.id,
          stallName: vendor.stallName,
          isOnline: isOnline
        }
      }
    })

  } catch (error) {
    console.error("❌ [VendorStatusAPI] Update vendor status error:", error)
    return NextResponse.json({ 
      success: false, 
      message: "Internal server error" 
    }, { status: 500 })
  }
}
