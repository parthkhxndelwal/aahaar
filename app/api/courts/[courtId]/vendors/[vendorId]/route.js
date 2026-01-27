import { NextResponse } from "next/server"
import { Vendor, User, MenuItem, MenuCategory } from "@/models"
import { authenticateTokenNextJS } from "@/middleware/auth"

export async function GET(request, { params }) {
  try {
    const authResult = await authenticateTokenNextJS(request)
    if (authResult.error) {
      return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status })
    }

    const { user } = authResult
    const { courtId, vendorId } = await params

    // Only admin can access vendor details
    if (user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 })
    }

    // Verify admin has access to this court
    if (user.courtId !== courtId) {
      return NextResponse.json({ success: false, message: "Access denied for this court" }, { status: 403 })
    }

    const vendor = await Vendor.findOne({
      where: { id: vendorId, courtId },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "fullName", "email", "phone", "status", "lastLoginAt", "createdAt"],
        },
        {
          model: MenuItem,
          as: "menuItems",
          include: [
            {
              model: MenuCategory,
              as: "menuCategory",
              attributes: ["id", "name"],
            },
          ],
        },
        {
          model: MenuCategory,
          as: "menuCategories",
        },
      ],
    })

    if (!vendor) {
      return NextResponse.json({ success: false, message: "Vendor not found" }, { status: 404 })
    }

    const vendorDetails = {
      id: vendor.id,
      stallName: vendor.stallName,
      stallLocation: vendor.stallLocation,
      vendorName: vendor.vendorName,
      contactEmail: vendor.contactEmail,
      contactPhone: vendor.contactPhone,
      description: vendor.description,
      cuisineType: vendor.cuisineType,
      status: vendor.status,
      isOnline: vendor.isOnline,
      logoUrl: vendor.logoUrl,
      bannerUrl: vendor.bannerUrl,
      rating: vendor.averageRating,
      totalRatings: vendor.totalRatings,
      paymentMethods: vendor.paymentMethods,
      operatingHours: vendor.operatingHours,
      maxConcurrentOrders: vendor.maxConcurrentOrders || 10,
      maxOrdersPerHour: vendor.maxOrdersPerHour || 50,
      averagePreparationTime: vendor.averagePreparationTime || 15,
      payoutSettings: vendor.payoutSettings || {
        autoPayoutEnabled: false,
        payoutFrequency: "manual",
        minimumPayoutAmount: 100
      },
      bankAccountNumber: vendor.bankAccountNumber,
      bankIfscCode: vendor.bankIfscCode,
      bankAccountHolderName: vendor.bankAccountHolderName,
      bankName: vendor.bankName,
      panNumber: vendor.panNumber,
      gstin: vendor.gstin,
      razorpayAccountId: vendor.razorpayAccountId,
      breakTimes: vendor.breakTimes || [],
      userId: vendor.userId,
      user: vendor.user ? {
        id: vendor.user.id,
        fullName: vendor.user.fullName,
        email: vendor.user.email,
        phone: vendor.user.phone,
        status: vendor.user.status,
        lastLogin: vendor.user.lastLoginAt,
        createdAt: vendor.user.createdAt,
      } : null,
      menuItems: vendor.menuItems || [],
      menuCategories: vendor.menuCategories || [],
      createdAt: vendor.createdAt,
      updatedAt: vendor.updatedAt,
    }

    return NextResponse.json({
      success: true,
      data: { vendor: vendorDetails },
    })
  } catch (error) {
    console.error("Get vendor details error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request, { params }) {
  try {
    const authResult = await authenticateTokenNextJS(request)
    if (authResult.error) {
      return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status })
    }

    const { user } = authResult
    const { courtId, vendorId } = await params

    // Only admin can update vendors
    if (user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 })
    }

    // Verify admin has access to this court
    if (user.courtId !== courtId) {
      return NextResponse.json({ success: false, message: "Access denied for this court" }, { status: 403 })
    }

    const updateData = await request.json()

    const vendor = await Vendor.findOne({
      where: { id: vendorId, courtId },
    })

    if (!vendor) {
      return NextResponse.json({ success: false, message: "Vendor not found" }, { status: 404 })
    }

    await vendor.update(updateData)

    return NextResponse.json({
      success: true,
      message: "Vendor updated successfully",
      data: { vendor },
    })
  } catch (error) {
    console.error("Update vendor error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const authResult = await authenticateTokenNextJS(request)
    if (authResult.error) {
      return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status })
    }

    const { user } = authResult
    const { courtId, vendorId } = await params

    // Only admin can delete vendors
    if (user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 })
    }

    // Verify admin has access to this court
    if (user.courtId !== courtId) {
      return NextResponse.json({ success: false, message: "Access denied for this court" }, { status: 403 })
    }

    const vendor = await Vendor.findOne({
      where: { id: vendorId, courtId },
    })

    if (!vendor) {
      return NextResponse.json({ success: false, message: "Vendor not found" }, { status: 404 })
    }

    // Delete associated data first (menu items, categories, etc.)
    await MenuItem.destroy({ where: { vendorId } })
    await MenuCategory.destroy({ where: { vendorId } })

    // Delete the vendor
    await vendor.destroy()

    return NextResponse.json({
      success: true,
      message: "Vendor deleted successfully",
    })
  } catch (error) {
    console.error("Delete vendor error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
