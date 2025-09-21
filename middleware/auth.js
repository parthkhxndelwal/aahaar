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

    // Try to extract token - handle both "Bearer <token>" and just "<token>" formats
    let token
    if (authHeader) {
      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1]
      } else {
        // Fallback: use the entire header as token (in case Bearer prefix is missing)
        token = authHeader
      }
    }

    if (!token) {
      return NextResponse.json({
        success: false,
        message: "Access token required",
      }, { status: 401 })
    }

    // Use JWT_SECRET from env or fallback for development
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-for-dev'

    let decoded
    try {
      decoded = jwt.verify(token, jwtSecret)
    } catch (jwtError) {
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
    return {
      error: "Authentication error",
      status: 500
    }
  }
}

module.exports = { authenticateToken, authenticateTokenNextJS }
