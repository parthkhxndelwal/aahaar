import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { User, Court, CourtSettings } from "@/models"

export async function POST(request) {
  try {
    const {
      email,
      password,
      fullName,
      phone,
      courtId,
      instituteName,
      instituteType = "college",
      role = "admin",
    } = await request.json()

    console.log("📝 Registration attempt:", { 
      email, 
      fullName, 
      phone, 
      courtId, 
      instituteName, 
      role 
    })

    // Basic validation for admin registration
    if (!email || !password || !fullName) {
      return NextResponse.json(
        {
          success: false,
          message: "Email, password, and full name are required",
        },
        { status: 400 },
      )
    }

    // For court creation (not admin registration), validate court fields
    if (courtId || instituteName) {
      if (!courtId || !instituteName) {
        return NextResponse.json(
          {
            success: false,
            message: "Both court ID and institute name are required for court creation",
          },
          { status: 400 },
        )
      }

      // Validate courtId format (alphanumeric, hyphens, underscores only)
      if (!/^[a-zA-Z0-9-_]+$/.test(courtId)) {
        return NextResponse.json(
          {
            success: false,
            message: "Court ID can only contain letters, numbers, hyphens, and underscores",
          },
          { status: 400 },
        )
      }

      // Check if court ID is already taken
      const existingCourt = await Court.findOne({
        where: { courtId },
      })

      if (existingCourt) {
        return NextResponse.json(
          {
            success: false,
            message: "Court ID is already taken",
          },
          { status: 400 },
        )
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        email: email.toLowerCase(),
      },
    })

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User with this email already exists",
        },
        { status: 400 },
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    let court = null
    let userCourtId = null

    // Create court if court information is provided
    if (courtId && instituteName) {
      console.log("🏢 Creating court during registration")
      court = await Court.create({
        courtId,
        instituteName,
        instituteType,
        contactEmail: email.toLowerCase(),
        contactPhone: phone,
        status: "active",
        subscriptionPlan: "trial",
        subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
      })

      // Create default court settings
      await CourtSettings.create({
        courtId,
        allowOnlinePayments: true,
        allowCOD: true,
        platformFeePercentage: 2.5,
        maxOrdersPerUser: 5,
        orderBufferTime: 5,
        minimumOrderAmount: 0,
        maximumOrderAmount: 5000,
        autoAcceptOrders: false,
        orderCancellationWindow: 5,
        themeSettings: {
          primaryColor: "#3B82F6",
          secondaryColor: "#10B981",
          accentColor: "#F59E0B",
        },
        notificationSettings: {
          emailNotifications: true,
          smsNotifications: false,
          pushNotifications: true,
        },
      })

      userCourtId = courtId
    } else {
      console.log("👑 Creating super admin - using system court")
      // For super admins, create or use a system court
      const systemCourtId = "system-admin"
      let systemCourt = await Court.findOne({ where: { courtId: systemCourtId } })
      
      if (!systemCourt) {
        systemCourt = await Court.create({
          courtId: systemCourtId,
          instituteName: "System Administration",
          instituteType: "system",
          contactEmail: email.toLowerCase(),
          contactPhone: phone,
          status: "active",
          subscriptionPlan: "unlimited",
          subscriptionExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        })
        
        // Create system court settings
        await CourtSettings.create({
          courtId: systemCourtId,
          allowOnlinePayments: true,
          allowCOD: true,
          platformFeePercentage: 0,
          maxOrdersPerUser: 999,
          orderBufferTime: 0,
          minimumOrderAmount: 0,
          maximumOrderAmount: 999999,
          autoAcceptOrders: false,
          orderCancellationWindow: 60,
          themeSettings: {
            primaryColor: "#3B82F6",
            secondaryColor: "#10B981",
            accentColor: "#F59E0B",
          },
          notificationSettings: {
            emailNotifications: true,
            smsNotifications: false,
            pushNotifications: true,
          },
        })
      }
      
      userCourtId = systemCourtId
      court = systemCourt
    }

    // Create admin user
    const user = await User.create({
      courtId: userCourtId,
      email: email.toLowerCase(),
      password: hashedPassword,
      fullName,
      phone,
      role,
      status: "active",
      emailVerified: true,
    })

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        courtId: user.courtId,
        role: user.role,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
    )

    return NextResponse.json(
      {
        success: true,
        message: "Registration successful",
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            courtId: user.courtId,
            court: court ? {
              courtId: court.courtId,
              instituteName: court.instituteName,
            } : null,
          },
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    )
  }
}
