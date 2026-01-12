import { NextResponse } from "next/server"
import { MenuCategory, MenuItem, Vendor } from "@/models"
import { authenticateToken } from "@/middleware/auth"

export async function PUT(request, { params }) {
  try {
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) return authResult

    const { user } = authResult
    const { vendorId, categoryId } = await params
    const updateData = await request.json()

    // Verify ownership
    const vendor = await Vendor.findByPk(vendorId)
    const category = await MenuCategory.findByPk(categoryId)

    if (!vendor || !category) {
      return NextResponse.json({ success: false, message: "Vendor or category not found" }, { status: 404 })
    }

    const isVendorOwner = vendor.userId === user.id
    const isAdmin = user.role === "admin"

    if (!isVendorOwner && !isAdmin) {
      return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 })
    }

    // Ensure category belongs to the vendor
    if (category.vendorId !== vendorId) {
      return NextResponse.json({ success: false, message: "Category does not belong to this vendor" }, { status: 403 })
    }

    // Check for duplicate name if name is being updated
    if (updateData.name && updateData.name !== category.name) {
      const existingCategory = await MenuCategory.findOne({
        where: { 
          vendorId, 
          name: updateData.name,
          id: { [MenuCategory.sequelize.Sequelize.Op.ne]: categoryId } // Exclude current category
        }
      })

      if (existingCategory) {
        return NextResponse.json({ 
          success: false, 
          message: "Category with this name already exists" 
        }, { status: 400 })
      }
    }

    await category.update(updateData)

    return NextResponse.json({
      success: true,
      message: "Category updated successfully",
      data: { category },
    })
  } catch (error) {
    console.error("Update category error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) return authResult

    const { user } = authResult
    const { vendorId, categoryId } = await params

    // Verify ownership
    const vendor = await Vendor.findByPk(vendorId)
    const category = await MenuCategory.findByPk(categoryId)

    if (!vendor || !category) {
      return NextResponse.json({ success: false, message: "Vendor or category not found" }, { status: 404 })
    }

    const isVendorOwner = vendor.userId === user.id
    const isAdmin = user.role === "admin"

    if (!isVendorOwner && !isAdmin) {
      return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 })
    }

    // Ensure category belongs to the vendor
    if (category.vendorId !== vendorId) {
      return NextResponse.json({ success: false, message: "Category does not belong to this vendor" }, { status: 403 })
    }

    // Check if category has menu items
    const itemCount = await MenuItem.count({
      where: { categoryId }
    })

    if (itemCount > 0) {
      return NextResponse.json({ 
        success: false, 
        message: `Cannot delete category. ${itemCount} menu items are using this category. Please move or delete those items first.` 
      }, { status: 400 })
    }

    await category.destroy()

    return NextResponse.json({
      success: true,
      message: "Category deleted successfully",
    })
  } catch (error) {
    console.error("Delete category error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
