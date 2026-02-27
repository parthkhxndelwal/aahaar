import { NextResponse } from "next/server"
import { Vendor, MenuItem, MenuCategory, sequelize } from "@/models"

export async function GET(request, { params }) {
  try {
    const { courtId } = params

    console.log("🔍 [VendorsAPI] GET /api/app/[courtId]/vendors called", { courtId })

    if (!courtId) {
      return NextResponse.json(
        { error: "Court ID is required" },
        { status: 400 }
      )
    }

    // Fetch all active vendors for the specific court with actual item and category counts
    const vendors = await Vendor.findAll({
      where: {
        courtId: courtId,
        status: 'active'
      },
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
      vendorCount: vendors.length 
    })

    return NextResponse.json({
      success: true,
      vendors
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
