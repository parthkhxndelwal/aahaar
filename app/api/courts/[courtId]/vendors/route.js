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
      
      // Settings
      maxOrdersPerHour,
      averagePreparationTime,
      isActive,
    } = await request.json()

    // Validation
    if (!stallName || !vendorName || !email || !phone || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Required fields: stallName, vendorName, email, phone, password",
        },
        { status: 400 },
      )
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
      operatingHours: operatingHours || undefined,
      maxOrdersPerHour: maxOrdersPerHour || 10,
      averagePreparationTime: averagePreparationTime || 15,
      status: isActive ? "active" : "inactive",
      isOnline: false,
    })

    // TODO: Create Razorpay Fund Account
    // TODO: Send invitation email to vendor

    return NextResponse.json(
      {
        success: true,
        message: "Vendor created successfully",
        data: { vendor, user: { id: user.id, email: user.email, fullName: user.fullName } },
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
