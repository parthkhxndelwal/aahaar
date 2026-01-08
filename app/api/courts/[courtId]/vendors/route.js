import { NextResponse } from "next/server"
import { Vendor, MenuItem, User } from "@/models"
import { authenticateToken } from "@/middleware/auth"
import { createRouteAccount } from "@/utils/razorpay"
import bcrypt from "bcryptjs"

export async function GET(request, { params }) {
  try {
    // Apply middleware manually (Next.js App Router doesn't support middleware chaining like Express)
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) return authResult

    // Extract user and courtId from auth result
    const { user, courtId: authCourtId } = authResult

    const { courtId } = await params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const page = Number.parseInt(searchParams.get("page")) || 1
    const limit = Number.parseInt(searchParams.get("limit")) || 10
    const offset = (page - 1) * limit

    // Build where clause
    const whereClause = { courtId }
    if (status) {
      whereClause.status = status
    }

    const vendors = await Vendor.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: MenuItem,
          as: "menuItems",
          attributes: ["id", "name", "price", "isAvailable"],
          where: { status: "active" },
          required: false,
        },
      ],
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    })

    // Transform vendor data to ensure proper numeric values
    const transformedVendors = vendors.rows.map(vendor => ({
      ...vendor.toJSON(),
      rating: typeof vendor.rating === 'number' ? vendor.rating : 0.0,
      totalRatings: typeof vendor.totalRatings === 'number' ? vendor.totalRatings : 0,
    }))

    return NextResponse.json({
      success: true,
      data: {
        vendors: transformedVendors,
        pagination: {
          total: vendors.count,
          page,
          limit,
          totalPages: Math.ceil(vendors.count / limit),
        },
      },
    })
  } catch (error) {
    console.error("Get vendors error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request, { params }) {
  try {
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) return authResult

    const { courtId } = await params
    const {
      // Basic Information
      stallName,
      vendorName,
      email,
      phone,
      password,
      
      // Stall Details
      stallLocation,
      cuisineType,
      description,
      logoUrl,
      bannerUrl,
      operatingHours,
      
      // Bank Details
      accountHolderName,
      accountNumber,
      ifscCode,
      bankName,
      
      // Legal Information
      panNumber,
      gstin,
      
      // Settings
      maxOrdersPerHour,
      averagePreparationTime,
      isActive,
    } = await request.json()

    // Validation
    if (!stallName || !vendorName || !email || !phone || !password || !panNumber) {
      return NextResponse.json(
        {
          success: false,
          message: "Required fields: stallName, vendorName, email, phone, password, panNumber",
        },
        { status: 400 },
      )
    }

    // Validate PAN number format
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
    if (!panRegex.test(panNumber)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid PAN number format. PAN should be in format: AAAAA9999A",
        },
        { status: 400 },
      )
    }

    // Validate GSTIN format if provided
    if (gstin) {
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
      if (!gstinRegex.test(gstin)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid GSTIN format",
          },
          { status: 400 },
        )
      }
    }

    // Check if stall name already exists in this court
    const existingVendor = await Vendor.findOne({
      where: { courtId, stallName },
    })

    if (existingVendor) {
      return NextResponse.json(
        {
          success: false,
          message: "Stall name already exists in this court",
        },
        { status: 400 },
      )
    }

    // Check if email already exists
    const existingEmail = await Vendor.findOne({
      where: { contactEmail: email.toLowerCase() },
    })

    if (existingEmail) {
      return NextResponse.json(
        {
          success: false,
          message: "Email already exists",
        },
        { status: 400 },
      )
    }

    // Create vendor user account first
    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await User.create({
      fullName: vendorName,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      role: "vendor",
      courtId,
      isEmailVerified: false,
      isPhoneVerified: false,
    })

    // Create vendor profile
    const vendor = await Vendor.create({
      userId: user.id,
      courtId,
      stallName,
      vendorName,
      contactEmail: email.toLowerCase(),
      contactPhone: phone,
      stallLocation,
      logoUrl,
      bannerUrl,
      cuisineType,
      description,
      bankAccountNumber: accountNumber,
      bankIfscCode: ifscCode,
      bankAccountHolderName: accountHolderName,
      bankName,
      panNumber,
      gstin: gstin || null,
      operatingHours: operatingHours || undefined,
      maxOrdersPerHour: maxOrdersPerHour || 10,
      averagePreparationTime: averagePreparationTime || 15,
      status: isActive ? "active" : "inactive",
      isOnline: false,
    })

    // Create Razorpay Route Account
    let razorpayAccountId = null
    let razorpayError = null

    try {      
      const razorpayResult = await createRouteAccount({
        email: email.toLowerCase(),
        phone,
        vendorName,
        stallName,
        courtId,
        vendorId: vendor.id,
        panNumber,
        gstin
      })

      if (razorpayResult.success) {
        razorpayAccountId = razorpayResult.account.id
        
        // Update vendor with Razorpay account ID
        await vendor.update({
          razorpayAccountId: razorpayAccountId
        })
        
        console.log(`✅ Razorpay account created for vendor ${vendor.id}: ${razorpayAccountId}`)
        console.log(`Account status: ${razorpayResult.account.status}`)
      } else {
        console.error(`❌ Failed to create Razorpay account for vendor ${vendor.id}:`, {
          error: razorpayResult.error,
          errorCode: razorpayResult.errorCode,
          errorDetails: razorpayResult.errorDetails
        })
        razorpayError = {
          message: razorpayResult.error,
          code: razorpayResult.errorCode,
          details: razorpayResult.errorDetails
        }
        
        // Log the error but don't fail vendor creation
        // This allows manual retry later or alternative payment setup
      }
    } catch (error) {
      console.error(`❌ Exception while creating Razorpay account for vendor ${vendor.id}:`, error)
      razorpayError = {
        message: error.message,
        code: 'EXCEPTION_ERROR',
        details: error.stack
      }
    }

    // TODO: Send invitation email to vendor
    const responseData = {
      vendor: {
        ...vendor.toJSON(),
        razorpayAccountId
      },
      user: { 
        id: user.id, 
        email: user.email, 
        fullName: user.fullName 
      }
    }

    // Include Razorpay information in response
    if (razorpayError) {
      responseData.razorpayError = razorpayError
      responseData.razorpayWarning = "Vendor created successfully but Razorpay account creation failed. Please create manually or retry later."
    } else if (razorpayAccountId) {
      responseData.razorpaySuccess = true
      responseData.razorpayAccountId = razorpayAccountId
    }

    const statusCode = 201
    const message = razorpayError 
      ? "Vendor created successfully but with Razorpay account creation error" 
      : "Vendor and Razorpay account created successfully"

    return NextResponse.json(
      {
        success: true,
        message,
        data: responseData,
      },
      { status: statusCode },
    )
  } catch (error) {
    console.error("Create vendor error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    )
  }
}
