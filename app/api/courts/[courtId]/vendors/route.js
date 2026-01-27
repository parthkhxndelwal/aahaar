import { NextResponse } from "next/server"
import { Vendor, User } from "@/models"
import { authenticateTokenNextJS } from "@/middleware/auth"
import bcrypt from "bcryptjs"

export async function GET(request, { params }) {
  try {
    const authResult = await authenticateTokenNextJS(request)
    if (authResult.error) {
      return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status })
    }

    const { user } = authResult
    const { courtId } = await params

    // Only admin can access vendor list
    if (user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 })
    }

    // Verify admin has access to this court
    if (user.courtId !== courtId) {
      return NextResponse.json({ success: false, message: "Access denied for this court" }, { status: 403 })
    }

    const vendors = await Vendor.findAll({
      where: { courtId },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "fullName", "email", "phone", "status", "lastLoginAt"],
        },
      ],
      order: [["createdAt", "DESC"]],
    })

    const vendorsWithDetails = vendors.map(vendor => ({
      id: vendor.id,
      stallName: vendor.stallName,
      stallLocation: vendor.stallLocation,
      vendorName: vendor.vendorName,
      contactEmail: vendor.contactEmail,
      contactPhone: vendor.contactPhone,
      status: vendor.status,
      isOnline: vendor.isOnline,
      logoUrl: vendor.logoUrl,
      bannerUrl: vendor.bannerUrl,
      rating: vendor.averageRating,
      totalRatings: vendor.totalRatings,
      userId: vendor.userId,
      user: vendor.user ? {
        id: vendor.user.id,
        fullName: vendor.user.fullName,
        email: vendor.user.email,
        phone: vendor.user.phone,
        status: vendor.user.status,
        lastLogin: vendor.user.lastLoginAt,
      } : null,
      createdAt: vendor.createdAt,
      updatedAt: vendor.updatedAt,
    }))

    return NextResponse.json({
      success: true,
      data: { vendors: vendorsWithDetails },
    })
  } catch (error) {
    console.error("Get vendors error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  try {
    const authResult = await authenticateTokenNextJS(request)
    if (authResult.error) {
      return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status })
    }

    const { user } = authResult
    const { courtId } = await params

    // Only admin can create vendors
    if (user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 })
    }

    // Verify admin has access to this court
    if (user.courtId !== courtId) {
      return NextResponse.json({ success: false, message: "Access denied for this court" }, { status: 403 })
    }

    const requestData = await request.json()
    console.log("Received vendor creation request:", JSON.stringify(requestData, null, 2))

    const {
      stallName,
      stallLocation,
      vendorName,
      email, // Form sends 'email'
      phone, // Form sends 'phone'
      contactEmail,
      contactPhone,
      description,
      cuisineType,
      logoUrl,
      bannerUrl,
      operatingHours,
      accountHolderName,
      accountNumber,
      ifscCode,
      bankName,
      panNumber,
      gstin,
      maxOrdersPerHour,
      averagePreparationTime,
      isActive,
      password,
    } = requestData

    // Handle field mapping - form uses 'email' and 'phone', but we store as 'contactEmail' and 'contactPhone'
    const finalContactEmail = email || contactEmail
    const finalContactPhone = phone || contactPhone

    // Validate required fields
    if (!stallName || !vendorName || !finalContactEmail || !finalContactPhone) {
      return NextResponse.json(
        { success: false, message: "Missing required fields: stallName, vendorName, email, phone" },
        { status: 400 }
      )
    }

    // Validate PAN number if provided
    if (panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber)) {
      return NextResponse.json(
        { success: false, message: "Invalid PAN number format" },
        { status: 400 }
      )
    }

    // Validate GSTIN if provided
    if (gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin)) {
      return NextResponse.json(
        { success: false, message: "Invalid GSTIN format" },
        { status: 400 }
      )
    }

    // Check if vendor with same email already exists in this court
    const existingVendor = await Vendor.findOne({
      where: { courtId, contactEmail: finalContactEmail },
    })

    if (existingVendor) {
      return NextResponse.json(
        { success: false, message: "Vendor with this email already exists" },
        { status: 400 }
      )
    }

    // Create vendor data object
    const vendorData = {
      courtId,
      stallName,
      stallLocation: stallLocation || null,
      vendorName,
      contactEmail: finalContactEmail,
      contactPhone: finalContactPhone,
      description: description || null,
      cuisineType: cuisineType || null,
      logoUrl: logoUrl || null,
      bannerUrl: bannerUrl || null,
      operatingHours: operatingHours || {
        monday: { open: "09:00", close: "18:00", closed: false },
        tuesday: { open: "09:00", close: "18:00", closed: false },
        wednesday: { open: "09:00", close: "18:00", closed: false },
        thursday: { open: "09:00", close: "18:00", closed: false },
        friday: { open: "09:00", close: "18:00", closed: false },
        saturday: { open: "09:00", close: "18:00", closed: false },
        sunday: { open: "09:00", close: "18:00", closed: false },
      },
      bankAccountHolderName: accountHolderName || null,
      bankAccountNumber: accountNumber || null,
      bankIfscCode: ifscCode || null,
      bankName: bankName || null,
      panNumber: panNumber || null,
      gstin: gstin || null,
      maxOrdersPerHour: maxOrdersPerHour || 10,
      averagePreparationTime: averagePreparationTime || 15,
      status: isActive ? "active" : "pending",
      isOnline: false,
      averageRating: 0,
      totalRatings: 0,
    }

    console.log("Creating vendor with data:", JSON.stringify(vendorData, null, 2))

    const vendor = await Vendor.create(vendorData)

    // Create user account if password is provided
    if (password) {
      try {
        console.log("Creating user account for vendor:", finalContactEmail)
        
        // Check if user already exists
        const existingUser = await User.findOne({
          where: { email: finalContactEmail, courtId }
        })

        if (!existingUser) {
          const hashedPassword = await bcrypt.hash(password, 12)
          
          const user = await User.create({
            email: finalContactEmail,
            password: hashedPassword,
            fullName: vendorName,
            phone: finalContactPhone,
            role: "vendor",
            courtId,
            status: "active",
            emailVerified: false,
            phoneVerified: false,
          })

          // Link user to vendor
          await vendor.update({ userId: user.id })
          console.log("User account created and linked to vendor:", user.id)
        } else {
          console.log("User already exists, linking to vendor:", existingUser.id)
          await vendor.update({ userId: existingUser.id })
        }
      } catch (userError) {
        console.error("Error creating user account:", userError)
        // Don't fail vendor creation if user creation fails
      }
    }

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
