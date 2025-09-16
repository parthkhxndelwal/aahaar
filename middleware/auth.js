const jwt = require("jsonwebtoken")
const { NextResponse } = require("next/server")
const { User, Court, Vendor } = require("../models")

// Ensure environment variables are loaded
if (typeof window === 'undefined') {
  require('dotenv').config()
}

const authenticateToken = async (request) => {
  try {
    const authHeader = request.headers.get("authorization")
    console.log("🔑 Auth header:", authHeader ? "present" : "missing")
    console.log("🔑 Auth header value:", authHeader)

    // Try to extract token - handle both "Bearer <token>" and just "<token>" formats
    let token
    if (authHeader) {
      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1]
      } else {
        // Fallback: use the entire header as token (in case Bearer prefix is missing)
        token = authHeader
        console.log("⚠️ Using auth header as token directly (no Bearer prefix)")
      }
    }

    console.log("🎫 Token:", token ? "present" : "missing")
    console.log("🎫 Token value (first 50 chars):", token ? token.substring(0, 50) + "..." : "null")

    if (!token) {
      console.log("❌ No token provided")
      return NextResponse.json({
        success: false,
        message: "Access token required",
      }, { status: 401 })
    }

    console.log("🔐 Verifying token with secret:", process.env.JWT_SECRET ? "present" : "missing")
    console.log("🔐 JWT_SECRET length:", process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0)

    // Use JWT_SECRET from env or fallback for development
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-for-dev'
    if (!process.env.JWT_SECRET) {
      console.log("⚠️ Using fallback JWT secret - this should not happen in production!")
    }

    let decoded
    try {
      decoded = jwt.verify(token, jwtSecret)
      console.log("✅ Token decoded successfully for user:", decoded.userId)
    } catch (jwtError) {
      console.error("❌ JWT verification failed:", jwtError.message)
      console.error("❌ JWT error name:", jwtError.name)
      console.error("❌ Token length:", token.length)
      console.error("❌ Token format check - contains dots:", token.split('.').length === 3)

      if (jwtError.name === "JsonWebTokenError") {
        return NextResponse.json({
          success: false,
          message: "Invalid token format",
        }, { status: 401 })
      }
      if (jwtError.name === "TokenExpiredError") {
        return NextResponse.json({
          success: false,
          message: "Token expired",
        }, { status: 401 })
      }

      return NextResponse.json({
        success: false,
        message: "Token verification failed",
      }, { status: 401 })
    }

    // Fetch user with court information
    const user = await User.findByPk(decoded.userId, {
      include: [
        {
          model: Court,
          as: "court",
          attributes: ["courtId", "instituteName", "status"],
        },
        {
          model: Vendor,
          as: "vendorProfile",
          attributes: ["id", "status"],
          required: false,
        },
      ],
    })

    if (!user) {
      return NextResponse.json({
        success: false,
        message: "Invalid token - user not found",
      }, { status: 401 })
    }

    if (user.status !== "active") {
      return NextResponse.json({
        success: false,
        message: "User account is not active",
      }, { status: 401 })
    }

    // For vendor users, also check vendor status
    if (user.role === "vendor" && user.vendorProfile) {
      if (user.vendorProfile.status !== "active") {
        return NextResponse.json({
          success: false,
          message: "Vendor account is not active. Please contact your admin.",
        }, { status: 401 })
      }
    }

    if (user.court && user.court.status !== "active") {
      return NextResponse.json({
        success: false,
        message: "Court is not active",
      }, { status: 401 })
    }

    // Return user data instead of modifying request object
    return { user, courtId: user.courtId }
  } catch (error) {
    console.error("Auth middleware error:", error)
    
    if (error.name === "JsonWebTokenError") {
      return NextResponse.json({
        success: false,
        message: "Invalid token",
      }, { status: 401 })
    }
    if (error.name === "TokenExpiredError") {
      return NextResponse.json({
        success: false,
        message: "Token expired",
      }, { status: 401 })
    }

    return NextResponse.json({
      success: false,
      message: "Authentication error",
    }, { status: 500 })
  }
}

// Wrapper function that provides error/success object instead of NextResponse
const authenticateTokenNextJS = async (request) => {
  try {
    const result = await authenticateToken(request)
    
    // If result is a NextResponse (error case), extract error info
    if (result instanceof NextResponse) {
      const errorData = await result.json()
      return {
        error: errorData.message,
        status: result.status
      }
    }
    
    // Success case - return user data
    return {
      user: result.user,
      courtId: result.courtId
    }
  } catch (error) {
    console.error("Auth wrapper error:", error)
    return {
      error: "Authentication error",
      status: 500
    }
  }
}

module.exports = { authenticateToken, authenticateTokenNextJS }
