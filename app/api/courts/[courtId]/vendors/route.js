import { NextResponse } from "next/server"
import { Vendor, MenuItem } from "@/models"
import { authenticateToken } from "@/middleware/auth"

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

    return NextResponse.json({
      success: true,
      data: {
        vendors: vendors.rows,
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

    const { courtId } = params
    const {
      stallName,
      vendorName,
      contactEmail,
      contactPhone,
      logoUrl,
      cuisineType,
      description,
      bankAccountNumber,
      bankIfscCode,
      bankAccountHolderName,
      operatingHours,
    } = await request.json()

    // Validation
    if (!stallName || !vendorName || !contactEmail || !contactPhone) {
      return NextResponse.json(
        {
          success: false,
          message: "Required fields: stallName, vendorName, contactEmail, contactPhone",
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

    // Create vendor
    const vendor = await Vendor.create({
      courtId,
      stallName,
      vendorName,
      contactEmail: contactEmail.toLowerCase(),
      contactPhone,
      logoUrl,
      cuisineType,
      description,
      bankAccountNumber,
      bankIfscCode,
      bankAccountHolderName,
      operatingHours: operatingHours || undefined,
      status: "inactive", // Will be activated when vendor completes onboarding
    })

    // TODO: Create Razorpay Fund Account
    // TODO: Send invitation email to vendor

    return NextResponse.json(
      {
        success: true,
        message: "Vendor created successfully",
        data: { vendor },
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
