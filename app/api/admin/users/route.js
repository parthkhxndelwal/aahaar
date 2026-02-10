import { NextResponse } from "next/server"
import { Op } from "sequelize"
import bcrypt from "bcryptjs"
import db from "@/models"

// GET - List all users with optional filters
export async function GET(request) {
  try {
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

    const user = await db.User.create({
      email,
      password: hashedPassword,
      fullName,
      phone,
      role,
      courtId,
      isActive: true,
    })

    // Return user without password
    const { password: _, ...userWithoutPassword } = user.toJSON()

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
