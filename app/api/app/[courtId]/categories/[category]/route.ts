import { NextRequest, NextResponse } from "next/server"
import { MenuItem, Vendor } from "@/models"
import { Op } from "sequelize"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courtId: string; category: string }> }
) {
  try {
    const { courtId, category } = await params
    const decodedCategory = decodeURIComponent(category).replace(/-/g, " ")

    // Get all active vendors in this court
    const activeVendors = await Vendor.findAll({
      where: {
        courtId,
        status: "active",
      },
      attributes: ["id"],
    })

    const vendorIds = activeVendors.map((v: any) => v.id)

    if (vendorIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: { items: [], category: decodedCategory },
      })
    }

    // Get menu items matching the category (case-insensitive)
    const menuItems = await MenuItem.findAll({
      where: {
        vendorId: { [Op.in]: vendorIds },
        status: "active",
        isAvailable: true,
        [Op.or]: [
          { category: { [Op.iLike]: decodedCategory } },
          { category: { [Op.iLike]: decodedCategory.replace(/ /g, "-") } },
        ],
      },
      include: [
        {
          model: Vendor,
          as: "vendor",
          attributes: ["id", "stallName", "cuisineType", "isOnline"],
          required: true,
        },
      ],
      attributes: [
        "id",
        "name",
        "description",
        "price",
        "mrp",
        "imageUrl",
        "vendorId",
        "category",
        "hasStock",
        "stockQuantity",
        "stockUnit",
        "status",
        "isVegetarian",
        "isVegan",
        "spiceLevel",
        "preparationTime",
      ],
      order: [
        ["totalOrders", "DESC"],
        ["rating", "DESC"],
      ],
      limit: 50,
    })

    // Transform data for frontend
    const items = menuItems.map((item: any) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: parseFloat(item.price) || 0,
      mrp: item.mrp ? parseFloat(item.mrp) : undefined,
      imageUrl: item.imageUrl,
      vendorId: item.vendorId,
      category: item.category,
      hasStock: item.hasStock,
      stockQuantity: item.stockQuantity,
      stockUnit: item.stockUnit,
      status: item.status,
      isVegetarian: item.isVegetarian,
      isVegan: item.isVegan,
      spiceLevel: item.spiceLevel,
      preparationTime: item.preparationTime,
      vendor: {
        stallName: item.vendor?.stallName,
        cuisineType: item.vendor?.cuisineType,
        isOnline: item.vendor?.isOnline,
      },
    }))

    return NextResponse.json({
      success: true,
      data: {
        category: decodedCategory,
        items,
        total: items.length,
      },
    })
  } catch (error) {
    console.error("Category items API error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch category items" },
      { status: 500 }
    )
  }
}
