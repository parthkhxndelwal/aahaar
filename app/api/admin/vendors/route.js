import { NextResponse } from "next/server"
import { Op } from "sequelize"
import db from "@/models"

// GET - List all vendors with optional filters
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const courtId = searchParams.get("courtId")
    const status = searchParams.get("status")
    const onboarded = searchParams.get("onboarded")
    const page = parseInt(searchParams.get("page")) || 1
    const limit = parseInt(searchParams.get("limit")) || 10
    const offset = (page - 1) * limit
    
    // Validation query parameters
    const email = searchParams.get("email")
    const phone = searchParams.get("phone")
    const stallName = searchParams.get("stallName")

    if (!courtId) {
      return NextResponse.json({ success: false, message: "Court ID is required" }, { status: 400 })
    }

    const whereClause = { courtId }

    // Handle validation queries
    if (email || phone || stallName) {
      const orConditions = []
      if (email) orConditions.push({ contactEmail: email })
      if (phone) orConditions.push({ contactPhone: phone })
      if (stallName) orConditions.push({ stallName: stallName })
      
      whereClause[Op.or] = orConditions
      
      // For validation, we only need to check existence
      const existingVendor = await db.Vendor.findOne({
        where: whereClause,
        attributes: ['id', 'contactEmail', 'contactPhone', 'stallName'],
      })
      
      return NextResponse.json({
        success: true,
        data: {
          exists: !!existingVendor,
          vendor: existingVendor,
        },
      })
    }

    if (status) {
      whereClause.status = status
    }

    // Filter based on onboarding status
    if (onboarded === "true") {
      whereClause.razorpayAccountId = { [Op.not]: null }
    } else if (onboarded === "false") {
      whereClause.razorpayAccountId = null
    }

    const vendors = await db.Vendor.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: db.User,
          as: "user",
          attributes: ["id", "email", "fullName", "phone"],
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    })

    const totalPages = Math.ceil(vendors.count / limit)

    return NextResponse.json({
      success: true,
      data: {
        vendors: vendors.rows,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: vendors.count,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    })
  } catch (error) {
    console.error("Get vendors error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

// POST - Create a new vendor
export async function POST(request) {
  try {
    const body = await request.json()
    const {
      courtId,
      stallName,
      vendorName,
      contactEmail,
      contactPhone,
      stallLocation,
      cuisineType,
      description,
      logoUrl,
      bannerUrl,
      operatingHours,
      bankAccountNumber,
      bankIfscCode,
      bankAccountHolderName,
      bankName,
      panNumber,
      gstin,
      maxOrdersPerHour,
      averagePreparationTime,
      businessType,
    } = body

    // Validate required fields
    if (!courtId || !stallName || !vendorName || !contactEmail || !contactPhone || !panNumber) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check for duplicate email or phone
    const existingVendor = await db.Vendor.findOne({
      where: {
        [Op.or]: [
          { contactEmail },
          { contactPhone },
        ],
      },
    })

    if (existingVendor) {
      const field = existingVendor.contactEmail === contactEmail ? "email" : "phone"
      return NextResponse.json(
        { 
          success: false, 
          message: `A vendor with this ${field} already exists`,
          field 
        },
        { status: 409 }
      )
    }

    // Check for duplicate stall name in the same court
    const existingStall = await db.Vendor.findOne({
      where: {
        courtId,
        stallName,
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

    const vendor = await db.Vendor.create({
      courtId,
      stallName,
      vendorName,
      contactEmail,
      contactPhone,
      stallLocation,
      cuisineType,
      description,
      logoUrl,
      bannerUrl,
      operatingHours: operatingHours || {
        monday: { open: "09:00", close: "18:00", closed: false },
        tuesday: { open: "09:00", close: "18:00", closed: false },
        wednesday: { open: "09:00", close: "18:00", closed: false },
        thursday: { open: "09:00", close: "18:00", closed: false },
        friday: { open: "09:00", close: "18:00", closed: false },
        saturday: { open: "09:00", close: "18:00", closed: false },
        sunday: { open: "09:00", close: "18:00", closed: true },
      },
      bankAccountNumber,
      bankIfscCode,
      bankAccountHolderName,
      bankName,
      panNumber,
      gstin,
      maxOrdersPerHour: maxOrdersPerHour || 10,
      averagePreparationTime: averagePreparationTime || 15,
      // Initialize onboarding tracking
      onboardingStatus: "in_progress",
      onboardingStep: "basic",
      onboardingStartedAt: new Date(),
      metadata: businessType ? { businessType } : {},
    })

    return NextResponse.json({
      success: true,
      message: "Vendor created successfully",
      data: { vendor },
    })
  } catch (error) {
    console.error("Create vendor error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
