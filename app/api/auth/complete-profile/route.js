import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { User, Court, AuditLog } from "@/models"

// Ensure environment variables are loaded
if (typeof window === 'undefined') {
  require('dotenv').config()
}

export async function POST(request) {
  try {
    // Check if request has body
    const contentLength = request.headers.get('content-length')
    if (!contentLength || contentLength === '0') {
      console.log("❌ Empty request body")
      return NextResponse.json(
        {
          success: false,
          message: "Request body is empty",
        },
        { status: 400 },
      )
    }

    // Parse JSON with error handling
    let requestData
    try {
      requestData = await request.json()
    } catch (parseError) {
      console.error("❌ JSON parse error:", parseError)
      return NextResponse.json(
        {
          success: false,
          message: "Invalid JSON in request body",
        },
        { status: 400 },
      )
    }

    const { email, fullName, password, courtId } = requestData

    // Validate required fields
    if (!email || !fullName || !password || !courtId) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Email, full name, password, and court ID are required" 
        }, 
        { status: 400 }
      )
    }

    // Validate password strength (minimum 8 characters)
    if (password.length < 8) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Password must be at least 8 characters long" 
        }, 
        { status: 400 }
      )
    }

    console.log("🔧 Complete profile attempt:", { email, fullName, courtId })

    // Check if court exists and is active
    const court = await Court.findOne({ where: { courtId, status: "active" } })
    if (!court) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Invalid or inactive court" 
        }, 
        { status: 400 }
      )
    }

    // Find user by email (don't filter by courtId since we might have a temporary user)
    let user = await User.findOne({
      where: {
        email: email.toLowerCase(),
      },
      include: [
        {
          model: Court,
          as: "court",
          attributes: ["courtId", "instituteName", "status"],
        },
      ],
    })

    if (!user) {
      // Create new user if they don't exist
      const hashedPassword = await bcrypt.hash(password, 10)
      
      user = await User.create({
        email: email.toLowerCase(),
        fullName,
        password: hashedPassword,
        courtId,
        role: "user",
        status: "active",
        emailVerified: true, // Since they completed OTP verification
        profileCompleted: true,
      })

      // Fetch court info for response
      user.court = court

      console.log("✅ New user created:", { 
        id: user.id, 
        email: user.email, 
        courtId: user.courtId 
      })
    } else {
      // Update existing user's profile (including temporary users)
      const hashedPassword = await bcrypt.hash(password, 10)
      
      await user.update({
        fullName,
        password: hashedPassword,
        courtId, // Update courtId in case it was a temporary user
        status: "active", // Change from pending to active
        emailVerified: true, // Since they completed OTP verification
        profileCompleted: true,
      })

      console.log("✅ Existing user profile updated:", { 
        id: user.id, 
        email: user.email 
      })
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-for-dev'
    if (!process.env.JWT_SECRET) {
      console.log("⚠️ Using fallback JWT secret - this should not happen in production!")
    }
    
    const token = jwt.sign(
      {
        userId: user.id,
        courtId: user.courtId,
        role: user.role,
        email: user.email,
      },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
    )

    // Update last login
    await user.update({ lastLoginAt: new Date() })

    // Create audit log for profile completion
    try {
      await AuditLog.create({
        courtId: user.courtId,
        userId: user.id,
        action: "USER_PROFILE_COMPLETED",
        entityType: "user",
        entityId: user.id,
        metadata: {
          isNewUser: user.createdAt && (new Date() - user.createdAt) < 60000, // Created within last minute
          userAgent: request.headers.get("user-agent") || "unknown",
          ipAddress: request.headers.get("x-forwarded-for") || 
                    request.headers.get("x-real-ip") || 
                    request.headers.get("x-client-ip") || 
                    "unknown"
        },
        ipAddress: request.headers.get("x-forwarded-for") || 
                  request.headers.get("x-real-ip") || 
                  request.headers.get("x-client-ip") || 
                  "unknown",
        userAgent: request.headers.get("user-agent") || "unknown"
      })
      console.log("✅ Audit log created for profile completion:", user.email)
    } catch (auditError) {
      console.error("❌ Failed to create audit log for profile completion:", auditError)
      // Don't fail the request if audit log creation fails
    }

    // Prepare user data for response
    const userData = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      courtId: user.courtId,
      profileCompleted: true,
      court: {
        courtId: user.court.courtId,
        instituteName: user.court.instituteName,
      },
    }

    return NextResponse.json({
      success: true,
      message: "Profile completed successfully",
      data: {
        token,
        user: userData,
      },
    })

  } catch (error) {
    console.error("Complete profile error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    )
  }
}