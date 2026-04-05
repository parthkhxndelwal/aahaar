import { NextRequest, NextResponse } from "next/server"
import { Court } from "@/models"
import { Op } from "sequelize"
import { authenticateRequest, requireAdmin, isSuperAdmin } from "@/lib/auth-helper"

export async function GET(request: NextRequest) {
  try {
    // Authenticate using NextAuth session or Bearer token
    const authResult = await authenticateRequest(request)
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      )
    }

    const user = authResult.user

    // Require admin role
    const adminError = requireAdmin(user)
    if (adminError) {
      return NextResponse.json(
        { success: false, message: adminError.error },
        { status: adminError.status }
      )
    }

    // For super admin, get all courts. For regular admin, get courts they manage
    let courts
    if (isSuperAdmin(user)) {
      courts = await Court.findAll({
        attributes: ['id', 'courtId', 'instituteName', 'instituteType', 'status', 'logoUrl'],
        order: [['createdAt', 'DESC']]
      })
    } else {
      // Get courts from managedCourtIds array, fallback to contactEmail for backward compatibility
      let whereCondition;
      if (user.managedCourtIds && user.managedCourtIds.length > 0) {
        whereCondition = { courtId: { [Op.in]: user.managedCourtIds } };
      } else if (user.courtId) {
        // Fallback to single courtId
        whereCondition = { courtId: user.courtId };
      } else {
        // No courts to show
        whereCondition = { courtId: '__none__' };
      }
      
      courts = await Court.findAll({
        where: whereCondition,
        attributes: ['id', 'courtId', 'instituteName', 'instituteType', 'status', 'logoUrl'],
        order: [['createdAt', 'DESC']]
      })
    }

    return NextResponse.json({
      success: true,
      data: { courts }
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
    // Authenticate using NextAuth session or Bearer token
    const authResult = await authenticateRequest(request)
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      )
    }

    const user = authResult.user

    // Require admin role
    const adminError = requireAdmin(user)
    if (adminError) {
      return NextResponse.json(
        { success: false, message: adminError.error },
        { status: adminError.status }
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

    // Import User model for updating
    const { User } = await import("@/models")

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
    const dbUser = await User.findByPk(user.id)
    if (dbUser) {
      const currentManagedCourts = dbUser.managedCourtIds || [];
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
    }

    return NextResponse.json({
      success: true,
      data: { court: newCourt },
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
