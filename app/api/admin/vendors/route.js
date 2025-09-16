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

    // Filter based on onboarding status - now based on onboardingStatus field
    if (onboarded === "true") {
      whereClause.onboardingStatus = "completed"
    } else if (onboarded === "false") {
      whereClause.onboardingStatus = { [Op.ne]: "completed" }
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
  console.log("🚀 API POST /api/admin/vendors called")
  try {
    const body = await request.json()
    console.log("📨 Request body received:", Object.keys(body))
    console.log("🏛️ Court ID:", body.courtId)
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
      onboardingStep,
      onboardingStatus,
      // Address fields (stored in metadata)
      addressStreet1,
      addressStreet2,
      addressCity,
      addressState,
      addressPostalCode,
      addressCountry,
      acceptTnC,
      acceptSettlementTerms,
      confirmAccuracy,
    } = body

    // Normalize
    const normalizedEmail = contactEmail?.toLowerCase?.() || contactEmail

    // Validate required fields
    const basicRequiredFields = !courtId || !stallName || !vendorName || !contactEmail || !contactPhone
    if (basicRequiredFields) {
      return NextResponse.json(
        { success: false, message: "Missing required fields: courtId, stallName, vendorName, contactEmail, contactPhone" },
        { status: 400 }
      )
    }

    // Check for duplicate email/phone/PAN within the same court
    const orChecks = []
    if (normalizedEmail) orChecks.push({ contactEmail: normalizedEmail })
    if (contactPhone) orChecks.push({ contactPhone })
    if (panNumber) orChecks.push({ panNumber })

    if (orChecks.length > 0) {
      const existingVendor = await db.Vendor.findOne({
        where: {
          courtId,
          [Op.or]: orChecks,
        },
        attributes: ['id', 'contactEmail', 'contactPhone', 'panNumber']
      })

      if (existingVendor) {
        let field = 'email'
        if (existingVendor.contactEmail === normalizedEmail) field = 'email'
        else if (existingVendor.contactPhone === contactPhone) field = 'phone'
        else if (panNumber && existingVendor.panNumber === panNumber) field = 'panNumber'
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

    // Create vendor directly without Razorpay integration
    const vendor = await db.Vendor.create({
      courtId,
      stallName,
      vendorName,
      contactEmail: normalizedEmail,
      contactPhone,
      stallLocation: stallLocation || null,
      cuisineType: cuisineType || "general",
      description: description || null,
      logoUrl: logoUrl || null,
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
      bankAccountNumber: bankAccountNumber || "",
      bankIfscCode: bankIfscCode || "",
      bankAccountHolderName: bankAccountHolderName || "",
      bankName: bankName || "",
      panNumber: panNumber || "",
      gstin,
      maxOrdersPerHour: maxOrdersPerHour || 10,
      averagePreparationTime: averagePreparationTime || 15,
      onboardingStatus: onboardingStatus || "in_progress",
      onboardingStep: onboardingStep || "password",
      onboardingStartedAt: new Date(),
      // No razorpayAccountId initially - will be set when payment request is approved
      metadata: {
        ...(businessType ? { businessType } : {}),
        ...(addressStreet1 || addressCity ? { 
          registeredAddress: { 
            addressStreet1, 
            addressStreet2, 
            addressCity, 
            addressState, 
            addressPostalCode, 
            addressCountry: addressCountry || 'IN' 
          } 
        } : {}),
        ...(acceptTnC !== undefined ? { acceptTnC } : {}),
        ...(acceptSettlementTerms !== undefined ? { acceptSettlementTerms } : {}),
        ...(confirmAccuracy !== undefined ? { confirmAccuracy } : {}),
        // Payment status will be tracked separately via PaymentRequest model
        paymentStatus: 'not_requested'
      },
    })

    // Create a corresponding User account for the vendor
    let vendorUser = null
    try {
      // Check if a user with this email already exists
      const existingUser = await db.User.findOne({
        where: { email: normalizedEmail }
      })

      if (existingUser) {
        // If user exists, check if they're already linked to a vendor
        if (existingUser.role === 'vendor' && existingUser.vendorProfile) {
          return NextResponse.json(
            { success: false, message: "A vendor user account already exists with this email" },
            { status: 409 }
          )
        } else {
          // Update existing user to be a vendor
          vendorUser = await existingUser.update({
            role: 'vendor',
            fullName: vendorName,
            phone: contactPhone,
            status: 'active', // Set to active when vendor is created
            phoneVerified: true,
            emailVerified: true,
          })
        }
      } else {
        // Create new vendor user
        vendorUser = await db.User.create({
          courtId,
          email: normalizedEmail,
          phone: contactPhone,
          fullName: vendorName,
          role: 'vendor',
          status: 'active', // Set to active when vendor is created
          phoneVerified: true,
          emailVerified: true,
        })
      }

      // Link the user to the vendor
      await vendor.update({ userId: vendorUser.id })

    } catch (userError) {
      console.error("Error creating vendor user account:", userError)
      // Don't fail the vendor creation if user creation fails
      // The vendor can still be created and user account can be created later
    }

    return NextResponse.json({
      success: true,
      message: "Vendor created successfully",
      data: { vendor },
    }, { status: 201 })
  } catch (error) {
    console.error("Create vendor error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
