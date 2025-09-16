import { NextResponse } from "next/server"
import { Op } from "sequelize"
import db from "@/models"

// POST - Create a new payment request
export async function POST(request) {
  try {
    const body = await request.json()
    const {
      vendorId,
      courtId,
      bankAccountNumber,
      bankIfscCode,
      bankAccountHolderName,
      bankName,
      panNumber,
      gstin,
      businessType,
      addressStreet1,
      addressStreet2,
      addressCity,
      addressState,
      addressPostalCode,
      addressCountry,
      resubmissionMessage,
    } = body

    // Validate required fields
    if (!vendorId || !courtId) {
      return NextResponse.json(
        { success: false, message: "Vendor ID and Court ID are required" },
        { status: 400 }
      )
    }

    // Check if vendor exists
    const vendor = await db.Vendor.findOne({
      where: { id: vendorId, courtId },
    })

    if (!vendor) {
      return NextResponse.json(
        { success: false, message: "Vendor not found" },
        { status: 404 }
      )
    }

    // Check if payment request already exists for this vendor
    const existingRequest = await db.PaymentRequest.findOne({
      where: { vendorId, status: { [Op.in]: ['pending', 'approved'] } },
    })

    if (existingRequest) {
      return NextResponse.json(
        { success: false, message: "Payment request already exists for this vendor" },
        { status: 409 }
      )
    }

    // Create payment request
    const paymentRequest = await db.PaymentRequest.create({
      vendorId,
      courtId,
      businessName: vendor.vendorName || vendor.stallName,
      beneficiaryName: bankAccountHolderName || vendor.bankAccountHolderName,
      accountNumber: bankAccountNumber || vendor.bankAccountNumber,
      ifscCode: bankIfscCode || vendor.bankIfscCode,
      bankName: bankName || vendor.bankName,
      businessType: businessType || vendor.metadata?.businessType || "individual",
      businessCategory: "food_and_beverages",
      businessSubcategory: "restaurant",
      status: 'pending',
      resubmissionMessage: resubmissionMessage || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Update vendor metadata to indicate payment request submitted
    await vendor.update({
      metadata: {
        ...vendor.metadata,
        paymentStatus: 'requested',
        paymentRequestId: paymentRequest.id,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Payment request submitted successfully",
      data: { paymentRequest },
    }, { status: 201 })
  } catch (error) {
    console.error("Create payment request error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

// GET - List payment requests (for super admin)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const courtId = searchParams.get("courtId")
    const status = searchParams.get("status")
    const page = parseInt(searchParams.get("page")) || 1
    const limit = parseInt(searchParams.get("limit")) || 10
    const offset = (page - 1) * limit

    const whereClause = {}
    if (courtId) whereClause.courtId = courtId
    if (status) whereClause.status = status

    const paymentRequests = await db.PaymentRequest.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: db.Vendor,
          as: "vendor",
          attributes: [
            "id", "stallName", "vendorName", "contactEmail", "contactPhone",
            "logoUrl", "cuisineType", "onboardingStatus"
          ],
        },
        {
          model: db.Court,
          as: "court",
          attributes: ["id", ["instituteName", "name"]],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    })

    const totalPages = Math.ceil(paymentRequests.count / limit)

    return NextResponse.json({
      success: true,
      data: {
        paymentRequests: paymentRequests.rows,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: paymentRequests.count,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    })
  } catch (error) {
    console.error("Get payment requests error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

// PUT - Approve or reject payment request (super admin only)
export async function PUT(request) {
  try {
    const body = await request.json()
    const { id, action, razorpayAccountId, rejectionReason, pin } = body

    // Validate PIN
    if (pin !== "1199") {
      return NextResponse.json(
        { success: false, message: "Invalid PIN" },
        { status: 403 }
      )
    }

    // Validate action
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, message: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 }
      )
    }

    // Find payment request
    const paymentRequest = await db.PaymentRequest.findOne({
      where: { id },
      include: [
        {
          model: db.Vendor,
          as: "vendor",
        },
      ],
    })

    if (!paymentRequest) {
      return NextResponse.json(
        { success: false, message: "Payment request not found" },
        { status: 404 }
      )
    }

    if (paymentRequest.status !== 'pending') {
      return NextResponse.json(
        { success: false, message: "Payment request has already been processed" },
        { status: 400 }
      )
    }

    const updateData = {
      status: action === 'approve' ? 'approved' : 'rejected',
      processedAt: new Date(),
    }

    if (action === 'approve') {
      if (!razorpayAccountId) {
        return NextResponse.json(
          { success: false, message: "Razorpay account ID is required for approval" },
          { status: 400 }
        )
      }
      updateData.razorpayAccountId = razorpayAccountId
      updateData.approvedBy = 'super_admin'
    } else {
      if (!rejectionReason) {
        return NextResponse.json(
          { success: false, message: "Rejection reason is required" },
          { status: 400 }
        )
      }
      updateData.rejectionReason = rejectionReason
    }

    // Update payment request
    await paymentRequest.update(updateData)

    // If approved, update vendor with Razorpay account ID
    if (action === 'approve') {
      await paymentRequest.vendor.update({
        razorpayAccountId,
        onboardingStatus: 'completed',
        metadata: {
          ...paymentRequest.vendor.metadata,
          paymentStatus: 'approved',
          razorpayAccountCreatedAt: new Date(),
        },
      })
    } else {
      // If rejected, update vendor metadata
      await paymentRequest.vendor.update({
        metadata: {
          ...paymentRequest.vendor.metadata,
          paymentStatus: 'rejected',
          paymentRejectionReason: rejectionReason,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: `Payment request ${action}d successfully`,
      data: { paymentRequest },
    })
  } catch (error) {
    console.error("Process payment request error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}