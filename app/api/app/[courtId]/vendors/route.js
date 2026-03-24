import { NextResponse } from "next/server"
import { Vendor, MenuItem, MenuCategory, sequelize } from "@/models"

export async function GET(request, { params }) {
  try {
    const { courtId } = await params
    const { searchParams } = new URL(request.url)
    const vendorIds = searchParams.get('ids')?.split(',').filter(Boolean)

    console.log("🔍 [VendorsAPI] GET /api/app/[courtId]/vendors called", { courtId, vendorIds })

    if (!courtId) {
      return NextResponse.json(
        { error: "Court ID is required" },
        { status: 400 }
      )
    }

    // Build where clause
    const whereClause = {
      courtId: courtId,
      status: 'active'
    }

    if (vendorIds && vendorIds.length > 0) {
      whereClause.id = vendorIds
    }

    // Fetch vendors for the specific court with actual item and category counts
    const vendors = await Vendor.findAll({
      where: whereClause,
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
        'razorpayAccountId',
        // Add subqueries for actual counts
        [
          sequelize.literal(`(
            SELECT COUNT(*)
            FROM menu_items
            WHERE menu_items.vendorId = Vendor.id
            AND menu_items.status = 'active'
          )`),
          'totalItems'
        ],
        [
          sequelize.literal(`(
            SELECT COUNT(*)
            FROM menu_categories
            WHERE menu_categories.vendorId = Vendor.id
            AND menu_categories.isActive = true
          )`),
          'totalCategories'
        ]
      ],
      order: [['stallName', 'ASC']]
    })

    console.log("✅ [VendorsAPI] Vendors fetched successfully", { 
      courtId, 
      vendorIds,
      vendorCount: vendors.length 
    })

    return NextResponse.json({
      success: true,
      data: { vendors }
    })

  } catch (error) {
    console.error("❌ [VendorsAPI] Error fetching vendors:", error)
    return NextResponse.json(
      { 
        error: "Failed to fetch vendors",
        details: error.message 
      },
      { status: 500 }
    )
  }
}
