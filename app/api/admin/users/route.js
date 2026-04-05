import { NextResponse } from "next/server"
import { Op } from "sequelize"
import bcrypt from "bcryptjs"
import db from "@/models"
import { authenticateToken } from "@/middleware/auth"

// GET - List all users with optional filters
export async function GET(request) {
  try {
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) return authResult

    const { user } = authResult

    if (user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const courtId = searchParams.get("courtId")
    const role = searchParams.get("role")
    const page = parseInt(searchParams.get("page")) || 1
    const limit = parseInt(searchParams.get("limit")) || 10
    const offset = (page - 1) * limit

    const whereClause = {}

    if (courtId) {
      whereClause.courtId = courtId
    }

    if (role) {
      whereClause.role = role
    }

    const users = await db.User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      include: [
        {
          model: db.Vendor,
          as: "vendorProfile",
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    })

    const totalPages = Math.ceil(users.count / limit)

    return NextResponse.json({
      success: true,
      data: {
        users: users.rows,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: users.count,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    })
  } catch (error) {
    console.error("Get users error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

// POST - Create a new user
export async function POST(request) {
  try {
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) return authResult

    const { user } = authResult

    if (user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const {
      email,
      password,
      fullName,
      phone,
      role,
      courtId,
    } = body

    // Validate required fields
    if (!email || !password || !fullName || !role) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      )
    }

    // Only allow user and vendor roles to be created through this endpoint
    // Prevent creation of admin or superadmin accounts
    const allowedRoles = ["user", "vendor"]
    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        { success: false, message: "Only 'user' or 'vendor' roles can be created through this endpoint" },
        { status: 403 }
      )
    }

    // Only superadmins can create admin-level accounts
    if (user.role !== "superadmin" && (role === "admin" || role === "superadmin")) {
      return NextResponse.json(
        { success: false, message: "Insufficient permissions to create admin-level accounts" },
        { status: 403 }
      )
    }

    // Check for duplicate email
    const existingUser = await db.User.findOne({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { 
          success: false, 
          message: "A user with this email already exists",
          field: "email"
        },
        { status: 409 }
      )
    }

    // Check for duplicate phone if provided
    if (phone) {
      const existingPhone = await db.User.findOne({
        where: { phone },
      })

      if (existingPhone) {
        return NextResponse.json(
          { 
            success: false, 
            message: "A user with this phone number already exists",
            field: "phone"
          },
          { status: 409 }
        )
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    const newUser = await db.User.create({
      email,
      password: hashedPassword,
      fullName,
      phone,
      role,
      courtId,
      isActive: true,
    })

    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser.toJSON()

    return NextResponse.json({
      success: true,
      message: "User created successfully",
      data: { user: userWithoutPassword },
    })
  } catch (error) {
    console.error("Create user error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
