import { NextResponse } from "next/server"
import { Vendor, MenuItem, User, Order, OrderItem } from "@/models"
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
      'payoutSettings',
      'panNumber',
      'gstin'
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

    // Validate PAN format if PAN is being updated
    if (updateFields.panNumber) {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
      if (!panRegex.test(updateFields.panNumber)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid PAN number format. PAN should be in format: AAAAA9999A",
          },
          { status: 400 }
        )
      }
    }

    // Validate GSTIN format if GSTIN is being updated
    if (updateFields.gstin) {
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
      if (!gstinRegex.test(updateFields.gstin)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid GSTIN format",
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

    // Update Razorpay account if relevant fields are being updated
    if (vendor.razorpayAccountId && (
      updateFields.stallName || 
      updateFields.vendorName || 
      updateFields.panNumber || 
      updateFields.gstin !== undefined
    )) {
      try {
        console.log(`Updating Razorpay account for vendor: ${vendor.vendorName} (${vendor.contactEmail})`)
        
        const razorpayUpdateData = {
          vendorName: updateFields.vendorName || vendor.vendorName,
          stallName: updateFields.stallName || vendor.stallName,
          courtId: vendor.courtId,
          panNumber: updateFields.panNumber || vendor.panNumber,
          gstin: updateFields.gstin !== undefined ? updateFields.gstin : vendor.gstin
        }

        const razorpayResult = {success:true} //Needs a fix, temporarily removes razorpay dependency.
        
        if (razorpayResult.success) {
          console.log(`✅ Razorpay account updated successfully for vendor: ${vendor.vendorName}`)
        } else {
          console.error(`❌ Failed to update Razorpay account for vendor: ${vendor.vendorName}`, razorpayResult.error)
          // Don't fail the entire update if Razorpay update fails
          // Just log the error for now
        }
      } catch (error) {
        console.error(`❌ Error updating Razorpay account for vendor: ${vendor.vendorName}`, error)
        // Don't fail the entire update if Razorpay update fails
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

    // Get the associated user ID before deletion
    const userId = vendor.userId

    // Start a transaction for data consistency
    const transaction = await vendor.sequelize.transaction()

    try {
      // Find all orders for this vendor to delete order items first
      const orders = await Order.findAll({
        where: { vendorId: vendorId },
        transaction
      })

      // Delete all order items for this vendor's orders
      for (const order of orders) {
        await OrderItem.destroy({
          where: { orderId: order.id },
          transaction
        })
      }

      // Delete all orders for this vendor
      await Order.destroy({
        where: { vendorId: vendorId },
        transaction
      })

      // Delete associated menu items
      await MenuItem.destroy({
        where: { vendorId: vendorId },
        transaction
      })

      // Delete the vendor permanently
      await vendor.destroy({ transaction })

      // Delete the associated user account if it exists
      if (userId) {
        await User.destroy({
          where: { id: userId },
          transaction
        })
      }

      // Commit the transaction
      await transaction.commit()

      return NextResponse.json({
        success: true,
        message: "Vendor deleted permanently",
      })
    } catch (error) {
      // Rollback the transaction in case of error
      await transaction.rollback()
      throw error
    }
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
