import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { User, Court } from "@/models"
import { Op } from "sequelize"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Authorization token required" },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET) as any

    if (!decoded.userId) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      )
    }

    // Get the current user to verify admin role
    const user = await User.findByPk(decoded.userId)
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      )
    }

    // For super admin, get all courts. For regular admin, get courts they manage
    let courts
    if (user.email === "superadmin@aahaar.com") { // Check if super admin
      courts = await Court.findAll({
        attributes: ['id', 'courtId', 'instituteName', 'instituteType', 'status', 'logoUrl'],
        order: [['createdAt', 'DESC']]
      })
    } else {
      // Get courts from managedCourtIds array, fallback to contactEmail for backward compatibility
      let whereCondition;
      if (user.managedCourtIds && user.managedCourtIds.length > 0) {
        whereCondition = { courtId: { [Op.in]: user.managedCourtIds } };
      } else {
        // Fallback to old method for users without managedCourtIds
        whereCondition = { contactEmail: user.email };
      }
      
      courts = await Court.findAll({
        where: whereCondition,
        attributes: ['id', 'courtId', 'instituteName', 'instituteType', 'status', 'logoUrl'],
        order: [['createdAt', 'DESC']]
      })
    }

    return NextResponse.json({
      success: true,
      data: courts
    })

  } catch (error) {
    console.error("Error fetching courts:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Authorization token required" },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET) as any

    if (!decoded.userId) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      )
    }

    // Get the current user to verify admin role
    const user = await User.findByPk(decoded.userId)
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { courtId, instituteName, instituteType, contactEmail, contactPhone, address } = body

    // Validate required fields - use user's email as default for contactEmail
    if (!courtId || !instituteName) {
      return NextResponse.json(
        { success: false, message: "Court ID and institute name are required" },
        { status: 400 }
      )
    }

    // Check if court ID already exists
    const existingCourt = await Court.findOne({
      where: { courtId }
    })

    if (existingCourt) {
      return NextResponse.json(
        { success: false, message: "Court ID already exists" },
        { status: 400 }
      )
    }

    // Create new court
    const newCourt = await Court.create({
      courtId,
      instituteName,
      instituteType: instituteType || 'college',
      contactEmail: contactEmail || user.email, // Use user's email as default
      contactPhone,
      address,
      status: 'active'
    })

    // Update user's managedCourtIds array and set courtId to the newest court
    const currentManagedCourts = user.managedCourtIds || [];
    const updatedManagedCourts = [...currentManagedCourts];
    
    // Add the new court to managed courts if not already present
    if (!updatedManagedCourts.includes(courtId)) {
      updatedManagedCourts.push(courtId);
    }
    
    await User.update(
      { 
        courtId: courtId, // Set as current active court
        managedCourtIds: updatedManagedCourts // Add to managed courts array
      },
      { where: { id: user.id } }
    )

    return NextResponse.json({
      success: true,
      data: newCourt,
      message: "Court created successfully"
    })

  } catch (error) {
    console.error("Error creating court:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}
