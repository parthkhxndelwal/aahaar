import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { User, Court, Vendor } from "@/models"

export async function POST(request) {
  try {
    const { email, password, courtId, phone, otp, loginType = "password" } = await request.json()

    if (loginType === "otp") {
      // OTP-based login for users
      if (!phone || !otp || !courtId) {
        return NextResponse.json({ success: false, message: "Phone, OTP, and court ID are required" }, { status: 400 })
      }

      console.log("🔐 OTP Login attempt:", { phone, otp, courtId, isDevelopment: process.env.NODE_ENV === "development" })

      // TODO: Verify OTP from Redis/cache
      // For demo purposes, accept any 6-digit OTP in development
      if (process.env.NODE_ENV === "development") {
        // In development, accept any 6-digit number as valid OTP
        if (!/^\d{6}$/.test(otp)) {
          console.log("❌ Invalid OTP format:", otp)
          return NextResponse.json({ success: false, message: "Invalid OTP format" }, { status: 401 })
        }
        console.log("✅ OTP format valid in development mode")
      } else {
        // In production, you should verify against stored OTP
        if (otp !== "123456") {
          console.log("❌ Invalid OTP in production:", otp)
          return NextResponse.json({ success: false, message: "Invalid OTP" }, { status: 401 })
        }
        console.log("✅ OTP valid in production mode")
      }

      // Find or create user with phone
      let user = await User.findOne({
        where: { phone, courtId },
        include: [{ model: Court, as: "court" }],
      })

      if (!user) {
        // Create new user for OTP login
        user = await User.create({
          courtId,
          phone,
          fullName: `User ${phone}`,
          email: `${phone}@temp.com`,
          role: "user",
          status: "active",
          phoneVerified: true,
        })

        // Fetch court info
        const court = await Court.findOne({ where: { courtId } })
        user.court = court
      }

      // Generate token
      const token = jwt.sign({ userId: user.id, courtId: user.courtId, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
      })

      return NextResponse.json({
        success: true,
        message: "OTP login successful",
        data: {
          token,
          user: {
            id: user.id,
            phone: user.phone,
            fullName: user.fullName,
            role: user.role,
            courtId: user.courtId,
            court: user.court,
          },
        },
      })
    }

    // Email/password login
    if (!email || !password) {
      console.log("❌ Missing credentials:", { email: !!email, password: !!password })
      return NextResponse.json(
        {
          success: false,
          message: "Email and password are required",
        },
        { status: 400 },
      )
    }

    console.log("🔐 Admin login attempt:", { email, courtId })

    // For admin login, find user without court restriction
    // For regular users, court ID is still required
    let user
    if (courtId) {
      console.log("🏢 Court-specific login")
      // Regular user login with specific court
      user = await User.findOne({
        where: {
          email: email.toLowerCase(),
          courtId,
        },
        include: [
          {
            model: Court,
          as: "court",
          attributes: ["courtId", "instituteName", "status"],
        },
        {
          model: Vendor,
          as: "vendorProfile",
          attributes: ["id", "stallName", "stallLocation", "isOnline"],
        },
      ],
    })
    } else {
      console.log("👑 Admin login without court restriction")
      // Admin login without court restriction
      user = await User.findOne({
        where: {
          email: email.toLowerCase(),
        },
        include: [
          {
            model: Vendor,
            as: "vendorProfile",
            attributes: ["id", "stallName", "stallLocation", "isOnline"],
          },
        ],
      })
    }

    console.log("👤 User found:", { 
      found: !!user, 
      role: user?.role, 
      courtId: user?.courtId,
      status: user?.status 
    })

    if (!user) {
      console.log("❌ No user found with email:", email)
      return NextResponse.json(
        {
          success: false,
          message: "Invalid credentials",
        },
        { status: 401 },
      )
    }

    if (user.status !== "active") {
      return NextResponse.json(
        {
          success: false,
          message: "Account is not active. Please contact your admin.",
        },
        { status: 401 },
      )
    }

    // Only check court status if user has a court (not for super admins)
    if (user.court && user.court.status !== "active") {
      return NextResponse.json(
        {
          success: false,
          message: "Court is not active",
        },
        { status: 401 },
      )
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    
    console.log("🔒 Password verification:", { isValid: isValidPassword })
    
    if (!isValidPassword) {
      console.log("❌ Invalid password for user:", email)
      return NextResponse.json(
        {
          success: false,
          message: "Invalid credentials",
        },
        { status: 401 },
      )
    }

    // Generate JWT token
    console.log("🎫 Generating token for user:", { 
      userId: user.id, 
      courtId: user.courtId, 
      role: user.role, 
      email: user.email 
    })
    
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

    // Update last login
    await user.update({ lastLoginAt: new Date() })

    // Prepare user data for response
    const userData = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      courtId: user.courtId,
      court: user.court ? {
        courtId: user.court.courtId,
        instituteName: user.court.instituteName,
      } : null,
    }

    // Add vendor profile if user is a vendor
    if (user.role === "vendor" && user.vendorProfile) {
      userData.vendorProfile = {
        id: user.vendorProfile.id,
        stallName: user.vendorProfile.stallName,
        stallLocation: user.vendorProfile.stallLocation,
        isOnline: user.vendorProfile.isOnline,
      }
    }

    return NextResponse.json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: userData,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    )
  }
}
