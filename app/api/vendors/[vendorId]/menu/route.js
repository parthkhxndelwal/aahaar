import { NextResponse } from "next/server"
import { MenuItem, Vendor } from "@/models"
import { authenticateToken } from "@/middleware/auth"

export async function GET(request, { params }) {
  try {
    const { vendorId } = params
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const status = searchParams.get("status")

    const whereClause = { vendorId }
    if (category) whereClause.category = category
    if (status) whereClause.status = status

    const menuItems = await MenuItem.findAll({
      where: whereClause,
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
    console.error("Get vendor menu error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  try {
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) return authResult

    const { user } = authResult
    const { vendorId } = params
    const menuItemData = await request.json()

    // Verify vendor ownership
    const vendor = await Vendor.findByPk(vendorId)
    if (!vendor) {
      return NextResponse.json({ success: false, message: "Vendor not found" }, { status: 404 })
    }

    const isVendorOwner = vendor.userId === user.id
    const isAdmin = user.role === "admin"

    if (!isVendorOwner && !isAdmin) {
      return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 })
    }

    const menuItem = await MenuItem.create({
      vendorId,
      ...menuItemData,
    })

    return NextResponse.json(
      {
        success: true,
        message: "Menu item created successfully",
        data: { menuItem },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Create menu item error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
