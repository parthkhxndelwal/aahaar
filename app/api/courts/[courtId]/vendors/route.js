import { NextResponse } from "next/server"
import { Vendor, MenuItem, User } from "@/models"
import { authenticateToken } from "@/middleware/auth"
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
    const transformedVendors = vendors.rows.map(vendor => {
      const transformed = {
        ...vendor.toJSON(),
        rating: typeof vendor.rating === 'number' ? vendor.rating : 0.0,
        totalRatings: typeof vendor.totalRatings === 'number' ? vendor.totalRatings : 0,
      }
      console.log("📊 Vendor status in GET:", vendor.stallName, "status:", transformed.status)
      return transformed
    })

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

    // Create Razorpay Route Account first to ensure payment setup
    console.log("🚀 Creating Razorpay account before vendor creation...")
    let razorpayAccountId = null

    try {
      // Prepare Razorpay account data
      const razorpayAccountData = {
        email: email.toLowerCase(),
        phone,
        legal_business_name: stallName,
        contact_name: vendorName,
        business_type: 'proprietorship',
        profile: {
          category: 'food',
          subcategory: 'restaurant',
          addresses: {
            registered: {
              street1: stallLocation || 'Food Court',
              city: 'Sohna',
              state: 'Haryana',
              postal_code: '122103',
              country: 'IN'
            }
          }
        },
        bank_account: accountNumber && ifscCode && accountHolderName ? {
          account_number: accountNumber,
          ifsc_code: ifscCode,
          beneficiary_name: accountHolderName
        } : undefined,
        courtId,
        vendorId: null, // Will be updated after vendor creation
        tnc_accepted: true
      }

      // Call the Razorpay API route
      const razorpayResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/razorpay/accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('Authorization'), // Forward the auth token
        },
        body: JSON.stringify(razorpayAccountData)
      })

      const razorpayResult = await razorpayResponse.json()

      if (!razorpayResponse.ok || !razorpayResult.success) {
        console.error(`❌ Razorpay account creation failed:`, {
          status: razorpayResponse.status,
          error: razorpayResult.error,
          errorCode: razorpayResult.errorCode,
          errorDetails: razorpayResult.errorDetails
        })
        
        return NextResponse.json(
          {
            success: false,
            message: `Vendor creation failed: ${razorpayResult.error || 'Unable to create payment account'}`,
            razorpayError: {
              message: razorpayResult.error,
              code: razorpayResult.errorCode,
              details: razorpayResult.errorDetails
            }
          },
          { status: 400 }
        )
      }

      razorpayAccountId = razorpayResult.account.id
      console.log(`✅ Razorpay account created successfully: ${razorpayAccountId}`)
      console.log(`Account status: ${razorpayResult.account.status}`)
      
    } catch (error) {
      console.error(`❌ Exception while creating Razorpay account:`, error)
      return NextResponse.json(
        {
          success: false,
          message: `Vendor creation failed: ${error.message || 'Payment account creation error'}`,
          razorpayError: {
            message: error.message,
            code: 'EXCEPTION_ERROR',
            details: error.stack
          }
        },
        { status: 500 }
      )
    }

    // Only proceed with vendor creation if Razorpay account was created successfully
    console.log("📝 Creating vendor user account and profile...")
    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await User.create({
      fullName: vendorName,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      role: "vendor",
      courtId,
      status: "active", // Set status to active so they can login
      emailVerified: false, // Fixed field name
      phoneVerified: false, // Fixed field name
    })

    // Create vendor profile with Razorpay account ID
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
      razorpayAccountId: razorpayAccountId, // Store the Razorpay account ID
      operatingHours: operatingHours || undefined,
      maxOrdersPerHour: maxOrdersPerHour || 10,
      averagePreparationTime: averagePreparationTime || 15,
      status: isActive ? "active" : "inactive",
      isOnline: false,
    })

    console.log("📝 Vendor created with status:", vendor.status, "isActive was:", isActive)
    console.log("💳 Vendor linked to Razorpay account:", razorpayAccountId)

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
      },
      razorpaySuccess: true,
      razorpayAccountId: razorpayAccountId
    }

    return NextResponse.json(
      {
        success: true,
        message: "Vendor and Razorpay account created successfully",
        data: responseData,
      },
      { status: 201 },
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