import { NextResponse } from "next/server"
import { Vendor } from "@/models"
import { authenticateToken } from "@/middleware/auth"
import { fetchRouteAccount } from "@/utils/razorpay"

export async function GET(request, { params }) {
  try {
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) return authResult

    const { courtId, vendorId } = await params

    // Find the vendor
    const vendor = await Vendor.findOne({
      where: { 
        id: vendorId,
        courtId 
      }
    })

    if (!vendor) {
      return NextResponse.json(
        {
          success: false,
          message: "Vendor not found",
        },
        { status: 404 }
      )
    }

    if (!vendor.razorpayAccountId) {
      return NextResponse.json(
        {
          success: false,
          message: "No Razorpay account linked to this vendor",
        },
        { status: 404 }
      )
    }

    // Fetch Razorpay account details
    const razorpayResult = await fetchRouteAccount(vendor.razorpayAccountId)

    if (!razorpayResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to fetch Razorpay account details",
          error: razorpayResult.error
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        vendor: {
          id: vendor.id,
          stallName: vendor.stallName,
          vendorName: vendor.vendorName,
          razorpayAccountId: vendor.razorpayAccountId
        },
        razorpayAccount: razorpayResult.account
      }
    })
  } catch (error) {
    console.error("Get Razorpay account error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    )
  }
}
