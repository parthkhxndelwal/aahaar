import { NextResponse } from "next/server"
import { Vendor } from "@/models"
import { authenticateToken } from "@/middleware/auth"
import { createRouteAccount } from "@/utils/razorpay"

export async function POST(request, { params }) {
  try {
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) return authResult

    const { courtId } = await params
    const { vendorId } = await request.json()

    if (!vendorId) {
      return NextResponse.json(
        {
          success: false,
          message: "Vendor ID is required",
        },
        { status: 400 },
      )
    }

    // Find the vendor
    const vendor = await Vendor.findOne({
      where: { 
        id: vendorId, 
        courtId 
      },
    })

    if (!vendor) {
      return NextResponse.json(
        {
          success: false,
          message: "Vendor not found",
        },
        { status: 404 },
      )
    }

    // Check if vendor already has a Razorpay account
    if (vendor.razorpayAccountId) {
      return NextResponse.json(
        {
          success: false,
          message: "Vendor already has a Razorpay account",
          data: { razorpayAccountId: vendor.razorpayAccountId },
        },
        { status: 400 },
      )
    }

    // Create Razorpay Route Account
    console.log(`Retrying Razorpay account creation for vendor: ${vendor.vendorName} (${vendor.contactEmail})`)
    
    const razorpayResult = await createRouteAccount({
      email: vendor.contactEmail,
      phone: vendor.contactPhone,
      vendorName: vendor.vendorName,
      stallName: vendor.stallName,
      courtId: vendor.courtId,
      vendorId: vendor.id,
      panNumber: vendor.panNumber,
      gstin: vendor.gstin
    })

    if (razorpayResult.success) {
      const razorpayAccountId = razorpayResult.account.id
      
      // Update vendor with Razorpay account ID
      await vendor.update({
        razorpayAccountId: razorpayAccountId
      })
      
      console.log(`✅ Razorpay account created for vendor ${vendor.id}: ${razorpayAccountId}`)

      return NextResponse.json(
        {
          success: true,
          message: "Razorpay account created successfully",
          data: {
            vendorId: vendor.id,
            razorpayAccountId: razorpayAccountId,
            accountStatus: razorpayResult.account.status,
            referenceId: razorpayResult.account.reference_id
          },
        },
        { status: 200 },
      )
    } else {
      console.error(`❌ Failed to create Razorpay account for vendor ${vendor.id}:`, {
        error: razorpayResult.error,
        errorCode: razorpayResult.errorCode,
        errorDetails: razorpayResult.errorDetails
      })

      return NextResponse.json(
        {
          success: false,
          message: "Failed to create Razorpay account",
          error: {
            message: razorpayResult.error,
            code: razorpayResult.errorCode,
            details: razorpayResult.errorDetails
          },
        },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("Retry Razorpay account creation error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    )
  }
}
