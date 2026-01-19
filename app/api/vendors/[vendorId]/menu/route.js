import { NextResponse } from "next/server"
import { MenuItem, MenuCategory, Vendor } from "@/models"
import { authenticateToken } from "@/middleware/auth"

export async function GET(request, { params }) {
  try {
    const { vendorId } = await params
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const status = searchParams.get("status")

    const whereClause = { vendorId }
    if (category) whereClause.category = category
    if (status) whereClause.status = status

    const menuItems = await MenuItem.findAll({
      where: whereClause,
      include: [
        {
          model: MenuCategory,
          as: "menuCategory",
          attributes: ["id", "name", "color"],
        },
      ],
      order: [
        ["displayOrder", "ASC"],
        ["createdAt", "DESC"],
      ],
    })

    // Also fetch categories for this vendor
    const categories = await MenuCategory.findAll({
      where: { vendorId, isActive: true },
      order: [
        ["displayOrder", "ASC"],
        ["name", "ASC"],
      ],
    })

    return NextResponse.json({
      success: true,
      data: { menuItems, categories },
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
    const { vendorId } = await params
    const menuItemData = await request.json()

    console.log("Creating menu item with data:", menuItemData)

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

    // Validate required fields
    if (!menuItemData.name || !menuItemData.price) {
      return NextResponse.json({ 
        success: false, 
        message: "Name and selling price are required fields" 
      }, { status: 400 })
    }

    // Validate price values
    if (menuItemData.mrp && parseFloat(menuItemData.price) > parseFloat(menuItemData.mrp)) {
      return NextResponse.json({ 
        success: false, 
        message: "Selling price cannot be greater than MRP" 
      }, { status: 400 })
    }

    // Clean up the data before saving
    const cleanedData = {
      vendorId,
      name: menuItemData.name,
      description: menuItemData.description || null,
      price: parseFloat(menuItemData.price),
      mrp: menuItemData.mrp ? parseFloat(menuItemData.mrp) : null,
      category: menuItemData.category || null,
      categoryId: menuItemData.categoryId || null,
      imageUrl: menuItemData.imageUrl || null,
      isAvailable: menuItemData.isAvailable !== false, // Default to true
      isVegetarian: menuItemData.isVegetarian !== false, // Default to true
      preparationTime: parseInt(menuItemData.preparationTime) || 15,
      ingredients: Array.isArray(menuItemData.ingredients) 
        ? menuItemData.ingredients.join(', ') 
        : (menuItemData.ingredients || null),
      allergens: Array.isArray(menuItemData.allergens) 
        ? menuItemData.allergens 
        : [],
      tags: Array.isArray(menuItemData.tags) 
        ? menuItemData.tags 
        : [],
      nutritionInfo: menuItemData.nutritionalInfo || {},
      // Stock management fields
      hasStock: menuItemData.hasStock || false,
      stockQuantity: menuItemData.hasStock ? (parseInt(menuItemData.stockQuantity) || null) : null,
      minStockLevel: menuItemData.hasStock ? (parseInt(menuItemData.minStockLevel) || 5) : null,
      maxStockLevel: menuItemData.hasStock ? (parseInt(menuItemData.maxStockLevel) || 100) : null,
      stockUnit: menuItemData.hasStock ? (menuItemData.stockUnit || 'pieces') : null,
      status: menuItemData.hasStock && (parseInt(menuItemData.stockQuantity) || 0) === 0 ? 'out_of_stock' : 'active',
    }

    const menuItem = await MenuItem.create(cleanedData)

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
    console.error("Menu item data:", menuItemData)
    console.error("Vendor ID:", vendorId)
    return NextResponse.json({ 
      success: false, 
      message: error.message || "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.toString() : undefined
    }, { status: 500 })
  }
}
