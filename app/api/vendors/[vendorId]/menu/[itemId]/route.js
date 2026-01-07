import { NextResponse } from "next/server"
import { MenuItem, Vendor } from "@/models"
import { authenticateToken } from "@/middleware/auth"

export async function PATCH(request, { params }) {
  try {
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) return authResult

    const { user } = authResult
    const { vendorId, itemId } = params
    const updateData = await request.json()

    // Verify ownership
    const vendor = await Vendor.findByPk(vendorId)
    const menuItem = await MenuItem.findByPk(itemId)

    if (!vendor || !menuItem) {
      return NextResponse.json({ success: false, message: "Vendor or menu item not found" }, { status: 404 })
    }

    const isVendorOwner = vendor.userId === user.id
    const isAdmin = user.role === "admin"

    if (!isVendorOwner && !isAdmin) {
      return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 })
    }

    await menuItem.update(updateData)

    return NextResponse.json({
      success: true,
      message: "Menu item updated successfully",
      data: { menuItem },
    })
  } catch (error) {
    console.error("Update menu item error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) return authResult

    const { user } = authResult
    const { vendorId, itemId } = params

    // Verify ownership
    const vendor = await Vendor.findByPk(vendorId)
    const menuItem = await MenuItem.findByPk(itemId)

    if (!vendor || !menuItem) {
      return NextResponse.json({ success: false, message: "Vendor or menu item not found" }, { status: 404 })
    }

    const isVendorOwner = vendor.userId === user.id
    const isAdmin = user.role === "admin"

    if (!isVendorOwner && !isAdmin) {
      return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 })
    }

    await menuItem.destroy()

    return NextResponse.json({
      success: true,
      message: "Menu item deleted successfully",
    })
  } catch (error) {
    console.error("Delete menu item error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
