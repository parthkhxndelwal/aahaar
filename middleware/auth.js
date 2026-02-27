const jwt = require("jsonwebtoken")
const { NextResponse } = require("next/server")
const { User, Court } = require("../models")

const authenticateToken = async (request) => {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader && authHeader.split(" ")[1]

    if (!token) {
      return NextResponse.json({
        success: false,
        message: "Access token required",
      }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Fetch user with court information
    const user = await User.findByPk(decoded.userId, {
      include: [
        {
          model: Court,
          as: "court",
          attributes: ["courtId", "instituteName", "status"],
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
