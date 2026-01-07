import { NextResponse } from "next/server"
import { Vendor } from "@/models"
import { authenticateToken } from "@/middleware/auth"

export async function GET(request, { params }) {
  try {
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) return authResult

    const { courtId } = await params

    // Get all vendors for this court
    const allVendors = await Vendor.findAll({
      where: { courtId },
      attributes: ['id', 'stallName', 'status', 'isOnline', 'createdAt'],
      order: [['createdAt', 'DESC']]
    })

    // Get active vendors count
    const activeVendorsCount = await Vendor.count({
      where: { courtId, status: "active" },
    })

    // Get vendors by status
    const vendorsByStatus = await Vendor.findAll({
      where: { courtId },
      attributes: ['status', [Vendor.sequelize.fn('COUNT', Vendor.sequelize.col('id')), 'count']],
      group: ['status'],
      raw: true
    })

    return NextResponse.json({
      success: true,
      data: {
        courtId,
        totalVendors: allVendors.length,
        activeVendorsCount,
        vendorsByStatus,
        allVendors: allVendors.map(v => ({
          id: v.id,
          stallName: v.stallName,
          status: v.status,
          isOnline: v.isOnline,
          createdAt: v.createdAt
        }))
      },
    })
  } catch (error) {
    console.error("Debug vendors error:", error)
    return NextResponse.json({ 
      success: false, 
      message: "Internal server error",
      error: error.message 
    }, { status: 500 })
  }
}
