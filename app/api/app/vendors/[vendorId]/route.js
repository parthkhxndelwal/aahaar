import { NextResponse } from "next/server"
import { Vendor } from "@/models"

export async function GET(request, { params }) {
  try {
    const { vendorId } = await params

    console.log("🔍 [PublicVendorAPI] GET /api/app/vendors/[vendorId] called", { vendorId })

    if (!vendorId) {
      return NextResponse.json(
        { error: "Vendor ID is required" },
        { status: 400 }
      )
    }

    // Fetch vendor details for public viewing
    const vendor = await Vendor.findByPk(vendorId, {
      attributes: [
        'id',
        'stallName',
        'vendorName',
        'logoUrl',
        'bannerUrl',
        'cuisineType',
        'description',
        'rating',
        'isOnline',
        'status',
        'contactPhone',
        'contactEmail'
      ]
    })

    if (!vendor) {
      console.log("❌ [PublicVendorAPI] Vendor not found", { vendorId })
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      )
    }

    if (!vendor.status || vendor.status === 'inactive') {
      console.log("❌ [PublicVendorAPI] Vendor is inactive", { vendorId })
      return NextResponse.json(
        { error: "Vendor is not available" },
        { status: 404 }
      )
    }

    console.log("✅ [PublicVendorAPI] Vendor details fetched successfully", { 
      vendorId, 
      stallName: vendor.stallName 
    })

    return NextResponse.json({
      success: true,
      data: { vendor }
    })

  } catch (error) {
    console.error("❌ [PublicVendorAPI] Error fetching vendor details:", error)
    return NextResponse.json(
      { 
        error: "Failed to fetch vendor details",
        details: error.message 
      },
      { status: 500 }
    )
  }
}
