import { Vendor, sequelize } from "@/models"
import { successResponse, errorResponse, handleServiceError } from "@/lib/api-response"

export async function GET(request, { params }) {
  try {
    const { courtId } = await params
    const { searchParams } = new URL(request.url)
    const vendorIds = searchParams.get('ids')?.split(',').filter(Boolean)

    console.log("🔍 [VendorsAPI] GET /api/app/[courtId]/vendors called", { courtId, vendorIds })

    if (!courtId) {
      return errorResponse("Court ID is required", 400, "MISSING_COURT_ID")
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

    return successResponse({ vendors })

  } catch (error) {
    console.error("❌ [VendorsAPI] Error fetching vendors:", error)
    return handleServiceError(error)
  }
}
