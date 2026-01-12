import { NextResponse } from "next/server"
import { MenuCategory, Vendor } from "@/models"
import { authenticateToken } from "@/middleware/auth"

export async function GET(request, { params }) {
  try {
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) return authResult

    const { user } = authResult
    const { vendorId } = await params

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

    const categories = await MenuCategory.findAll({
      where: { vendorId },
      order: [
        ["displayOrder", "ASC"],
        ["name", "ASC"],
      ],
    })

    return NextResponse.json({
      success: true,
      data: { categories },
    })
  } catch (error) {
    console.error("Get categories error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  try {
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) return authResult

    const { user } = authResult
    const { vendorId } = await params
    const categoryData = await request.json()

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
    if (!categoryData.name) {
      return NextResponse.json({ 
        success: false, 
        message: "Category name is required" 
      }, { status: 400 })
    }

    // Check for duplicate category name for this vendor
    const existingCategory = await MenuCategory.findOne({
      where: { 
        vendorId, 
        name: categoryData.name 
      }
    })

    if (existingCategory) {
      return NextResponse.json({ 
        success: false, 
        message: "Category with this name already exists" 
      }, { status: 400 })
    }

    // Clean up the data before saving
    const cleanedData = {
      vendorId,
      name: categoryData.name,
      description: categoryData.description || null,
      displayOrder: parseInt(categoryData.displayOrder) || 0,
      isActive: categoryData.isActive !== false, // Default to true
      color: categoryData.color || null,
      imageUrl: categoryData.imageUrl || null,
    }

    const category = await MenuCategory.create(cleanedData)

    return NextResponse.json(
      {
        success: true,
        message: "Category created successfully",
        data: { category },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Create category error:", error)
    return NextResponse.json({ 
      success: false, 
      message: error.message || "Internal server error",
    }, { status: 500 })
  }
}
