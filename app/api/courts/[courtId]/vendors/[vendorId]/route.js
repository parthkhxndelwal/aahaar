import { NextResponse } from "next/server"
import { Vendor, MenuItem, User } from "@/models"
import { authenticateToken } from "@/middleware/auth"

export async function GET(request, { params }) {
  try {
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) return authResult

    const { courtId, vendorId } = await params

    const vendor = await Vendor.findOne({
      where: { 
        id: vendorId,
        courtId 
      },
      include: [
        {
          model: MenuItem,
          as: "menuItems",
          attributes: ["id", "name", "price", "isAvailable", "imageUrl"],
          where: { status: "active" },
          required: false,
        },
        {
          model: User,
          as: "user",
          attributes: ["id", "fullName", "email", "phone", "status"],
          required: false,
        },
      ],
    })

    if (!vendor) {
      return NextResponse.json(
        {
          success: false,
          message: "Vendor not found",
        },
        { status: 404 }
      )
    }

    // Transform vendor data to ensure proper numeric values
    const transformedVendor = {
      ...vendor.toJSON(),
      rating: typeof vendor.rating === 'number' ? vendor.rating : 0.0,
      totalRatings: typeof vendor.totalRatings === 'number' ? vendor.totalRatings : 0,
    }

    return NextResponse.json({
      success: true,
      data: transformedVendor,
    })
  } catch (error) {
    console.error("Get vendor error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    )
  }
}

export async function PUT(request, { params }) {
  try {
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) return authResult

    const { courtId, vendorId } = await params
    const updateData = await request.json()

    // Find the vendor
    const vendor = await Vendor.findOne({
      where: { 
        id: vendorId,
        courtId 
      }
    })

    if (!vendor) {
      return NextResponse.json(
        {
          success: false,
          message: "Vendor not found",
        },
        { status: 404 }
      )
    }

    // Prepare update data - only allow specific fields to be updated
    const allowedFields = [
      'stallName',
      'vendorName', 
      'contactEmail',
      'contactPhone',
      'stallLocation',
      'logoUrl',
      'bannerUrl',
      'cuisineType',
      'description',
      'status',
      'isOnline',
      'maxConcurrentOrders',
      'maxOrdersPerHour',
      'averagePreparationTime',
      'operatingHours',
      'breakTimes',
      'bankAccountNumber',
      'bankIfscCode',
      'bankAccountHolderName',
      'bankName',
      'payoutSettings'
    ]

    const updateFields = {}
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        updateFields[field] = updateData[field]
      }
    })

    // Validate email format if email is being updated
    if (updateFields.contactEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(updateFields.contactEmail)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid email format",
          },
          { status: 400 }
        )
      }
    }

    // Validate phone format if phone is being updated
    if (updateFields.contactPhone) {
      const phoneRegex = /^\d{10,15}$/
      if (!phoneRegex.test(updateFields.contactPhone.replace(/\D/g, ''))) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid phone number format",
          },
          { status: 400 }
        )
      }
    }

    // Update the vendor
    await vendor.update(updateFields)

    // If user details are being updated, update the associated user record
    if (updateFields.vendorName || updateFields.contactEmail || updateFields.contactPhone) {
      if (vendor.userId) {
        const userUpdateFields = {}
        if (updateFields.vendorName) userUpdateFields.fullName = updateFields.vendorName
        if (updateFields.contactEmail) userUpdateFields.email = updateFields.contactEmail
        if (updateFields.contactPhone) userUpdateFields.phone = updateFields.contactPhone

        await User.update(userUpdateFields, {
          where: { id: vendor.userId }
        })
      }
    }

    // Fetch updated vendor data
    const updatedVendor = await Vendor.findOne({
      where: { 
        id: vendorId,
        courtId 
      },
      include: [
        {
          model: MenuItem,
          as: "menuItems",
          attributes: ["id", "name", "price", "isAvailable", "imageUrl"],
          where: { status: "active" },
          required: false,
        },
        {
          model: User,
          as: "user",
          attributes: ["id", "fullName", "email", "phone", "status"],
          required: false,
        },
      ],
    })

    // Transform vendor data to ensure proper numeric values
    const transformedVendor = {
      ...updatedVendor.toJSON(),
      rating: typeof updatedVendor.rating === 'number' ? updatedVendor.rating : 0.0,
      totalRatings: typeof updatedVendor.totalRatings === 'number' ? updatedVendor.totalRatings : 0,
    }

    return NextResponse.json({
      success: true,
      message: "Vendor updated successfully",
      data: transformedVendor,
    })
  } catch (error) {
    console.error("Update vendor error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) return authResult

    const { courtId, vendorId } = await params

    // Find the vendor
    const vendor = await Vendor.findOne({
      where: { 
        id: vendorId,
        courtId 
      }
    })

    if (!vendor) {
      return NextResponse.json(
        {
          success: false,
          message: "Vendor not found",
        },
        { status: 404 }
      )
    }

    // Soft delete - just update status to suspended
    await vendor.update({ status: 'suspended' })

    return NextResponse.json({
      success: true,
      message: "Vendor suspended successfully",
    })
  } catch (error) {
    console.error("Delete vendor error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    )
  }
}
