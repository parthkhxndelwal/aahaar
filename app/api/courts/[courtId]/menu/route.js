import { NextResponse } from "next/server"
import { MenuItem, Vendor } from "@/models"
import { Op } from "sequelize"

export async function GET(request, { params }) {
  try {
    const { courtId } = await params
    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get("vendorId")
    const category = searchParams.get("category")
    const isAvailable = searchParams.get("isAvailable")
    const search = searchParams.get("search")

    // Build where clause
    const whereClause = { status: "active" }

    if (isAvailable !== null) {
      whereClause.isAvailable = isAvailable === "true"
    }

    if (category) {
      whereClause.category = category
    }

    if (search) {
      whereClause.name = { [Op.iLike]: `%${search}%` }
    }

    const vendorWhere = { courtId, status: "active" }
    if (vendorId) {
      vendorWhere.id = vendorId
    }

    const menuItems = await MenuItem.findAll({
      where: whereClause,
      include: [
        {
          model: Vendor,
          as: "vendor",
          where: vendorWhere,
          attributes: ["id", "stallName", "cuisineType", "isOnline", "averagePreparationTime"],
        },
      ],
      order: [
        ["displayOrder", "ASC"],
        ["createdAt", "DESC"],
      ],
    })

    return NextResponse.json({
      success: true,
      data: { menuItems },
    })
  } catch (error) {
    console.error("Get menu error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
