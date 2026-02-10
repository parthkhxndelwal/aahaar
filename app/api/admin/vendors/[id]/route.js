import { NextResponse } from "next/server"
import { Op } from "sequelize"
import db from "@/models"
import { createRouteAccount } from "@/utils/razorpay"

// GET - Get specific vendor
export async function GET(request, { params }) {
  try {
    const { id } = await params

    const vendor = await db.Vendor.findOne({
      where: { id },
      include: [
        {
          model: db.User,
          as: "user",
          attributes: ["id", "email", "fullName", "phone"],
          required: false,
        },
      ],
    })

    if (!vendor) {
      return NextResponse.json({ success: false, message: "Vendor not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: { vendor },
    })
  } catch (error) {
    console.error("Get vendor error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

// PATCH - Update vendor
export async function PATCH(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()

    const vendor = await db.Vendor.findByPk(id)
    if (!vendor) {
      return NextResponse.json({ success: false, message: "Vendor not found" }, { status: 404 })
    }

    // Check for duplicate email or phone if being updated
    if (body.contactEmail || body.contactPhone) {
      const whereClause = {
        id: { [Op.not]: id },
        [Op.or]: [],
      }

      if (body.contactEmail && body.contactEmail !== vendor.contactEmail) {
        whereClause[Op.or].push({ contactEmail: body.contactEmail })
      }
      
      if (body.contactPhone && body.contactPhone !== vendor.contactPhone) {
        whereClause[Op.or].push({ contactPhone: body.contactPhone })
      }

      if (whereClause[Op.or].length > 0) {
        const existingVendor = await db.Vendor.findOne({ where: whereClause })
        if (existingVendor) {
          const field = existingVendor.contactEmail === body.contactEmail ? "email" : "phone"
          return NextResponse.json(
            { 
              success: false, 
              message: `A vendor with this ${field} already exists`,
              field 
            },
            { status: 409 }
          )
        }
      }
    }

    // Check for duplicate stall name if being updated
    if (body.stallName && body.stallName !== vendor.stallName) {
      const existingStall = await db.Vendor.findOne({
        where: {
          id: { [Op.not]: id },
          courtId: vendor.courtId,
          stallName: body.stallName,
        },
      })

      if (existingStall) {
        return NextResponse.json(
          { 
            success: false, 
            message: "A stall with this name already exists in this court",
            field: "stallName"
          },
          { status: 409 }
        )
      }
    }

    // Handle onboarding step tracking
    const { razorpayAccountStatus, razorpayAccountId, ...validVendorData } = body
    const updateData = { ...validVendorData }
    
    // Validate status if provided
    const validStatuses = ['active', 'inactive', 'maintenance', 'suspended']
    if (updateData.status && !validStatuses.includes(updateData.status)) {
      console.error(`[VENDOR UPDATE] Invalid status value: ${updateData.status}. Valid values:`, validStatuses)
      return NextResponse.json({
        success: false,
        message: `Invalid status value. Must be one of: ${validStatuses.join(', ')}`
      }, { status: 400 })
    }
    
    // Handle Razorpay account ID separately if provided
    if (razorpayAccountId) {
      updateData.razorpayAccountId = razorpayAccountId
      // Store Razorpay status in metadata, not in vendor status
      updateData.metadata = {
        ...vendor.metadata,
        ...updateData.metadata,
        razorpayAccountStatus: razorpayAccountStatus
      }
    }
    
    // If this is an onboarding step update, track the progress
    if (body.onboardingStep || body.stallName || body.contactEmail || body.panNumber) {
      // Determine current step based on data completeness
      let currentStep = vendor.onboardingStep || 'basic'
      
      if (body.onboardingStep) {
        currentStep = body.onboardingStep
      } else {
        // Auto-detect step based on data provided
        if (body.maxOrdersPerHour !== undefined || body.averagePreparationTime !== undefined) {
          currentStep = 'config'
        } else if (body.panNumber || body.gstin || body.businessType) {
          currentStep = 'legal'
        } else if (body.bankAccountNumber || body.bankIfscCode) {
          currentStep = 'bank'
        } else if (body.operatingHours) {
          currentStep = 'hours'
        } else if (body.logoUrl || body.bannerUrl) {
          currentStep = 'stall'
        }
      }
      
      updateData.onboardingStep = currentStep
      updateData.onboardingStatus = 'in_progress'
      
      // Mark as started if not already
      if (!vendor.onboardingStartedAt) {
        updateData.onboardingStartedAt = new Date()
      }
    }

    console.log(`[VENDOR UPDATE] Updating vendor ${id} with data:`, {
      updateDataKeys: Object.keys(updateData),
      status: updateData.status,
      onboardingStep: updateData.onboardingStep,
      onboardingStatus: updateData.onboardingStatus
    })

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

// DELETE - Delete vendor
export async function DELETE(request, { params }) {
  try {
    const { id } = await params

    const vendor = await db.Vendor.findByPk(id)
    if (!vendor) {
      return NextResponse.json({ success: false, message: "Vendor not found" }, { status: 404 })
    }

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
