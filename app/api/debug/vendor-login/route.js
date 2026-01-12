import { NextResponse } from "next/server"
import { User, Vendor, Court } from "@/models"
import { authenticateToken } from "@/middleware/auth"

export async function GET(request) {
  try {
    // Apply authentication middleware
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) return authResult

    const { user } = authResult
    
    // Only allow admin users to access this debug endpoint
    if (user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")
    const courtId = searchParams.get("courtId")

    if (!email || !courtId) {
      return NextResponse.json(
        { success: false, message: "Email and courtId are required" },
        { status: 400 }
      )
    }

    console.log("🔍 Debug vendor login for:", { email, courtId })

    // Check if user exists
    const userRecord = await User.findOne({
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
      ],
    })

    // Check if vendor profile exists
    const vendorRecord = await Vendor.findOne({
      where: {
        contactEmail: email.toLowerCase(),
        courtId,
      },
    })

    // Check if court exists
    const courtRecord = await Court.findOne({
      where: { courtId },
    })

    const debugInfo = {
      email: email.toLowerCase(),
      courtId,
      userExists: !!userRecord,
      vendorExists: !!vendorRecord,
      courtExists: !!courtRecord,
      userDetails: userRecord ? {
        id: userRecord.id,
        email: userRecord.email,
        role: userRecord.role,
        status: userRecord.status,
        emailVerified: userRecord.emailVerified,
        phoneVerified: userRecord.phoneVerified,
        hasPassword: !!userRecord.password,
        courtId: userRecord.courtId,
      } : null,
      vendorDetails: vendorRecord ? {
        id: vendorRecord.id,
        stallName: vendorRecord.stallName,
        vendorName: vendorRecord.vendorName,
        status: vendorRecord.status,
        contactEmail: vendorRecord.contactEmail,
        userId: vendorRecord.userId,
      } : null,
      courtDetails: courtRecord ? {
        courtId: courtRecord.courtId,
        instituteName: courtRecord.instituteName,
        status: courtRecord.status,
      } : null,
    }

    return NextResponse.json({
      success: true,
      data: debugInfo,
    })
  } catch (error) {
    console.error("Debug vendor login error:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) return authResult

    const { user } = authResult
    
    if (user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      )
    }

    const { email, courtId } = await request.json()

    if (!email || !courtId) {
      return NextResponse.json(
        { success: false, message: "Email and courtId are required" },
        { status: 400 }
      )
    }

    // Fix vendor user status
    const userRecord = await User.findOne({
      where: {
        email: email.toLowerCase(),
        courtId,
      },
    })

    if (userRecord) {
      await userRecord.update({ status: "active" })
      
      return NextResponse.json({
        success: true,
        message: `Fixed status for user: ${email}`,
        data: {
          id: userRecord.id,
          email: userRecord.email,
          status: "active",
        },
      })
    } else {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error("Fix vendor login error:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}
