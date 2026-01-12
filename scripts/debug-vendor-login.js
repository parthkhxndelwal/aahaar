import { NextResponse } from "next/server"
import { User, Vendor, Court } from "@/models"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")
    const courtId = searchParams.get("courtId")

    if (!email || !courtId) {
      return NextResponse.json(
        {
          success: false,
          message: "Email and courtId are required",
        },
        { status: 400 }
      )
    }

    console.log("🔍 Debug: Looking for user with email:", email, "courtId:", courtId)

    // Find user
    const user = await User.findOne({
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

    if (!user) {
      return NextResponse.json({
        success: false,
        message: "User not found",
        debug: {
          searchedEmail: email.toLowerCase(),
          searchedCourtId: courtId,
        }
      })
    }

    // Find associated vendor
    const vendor = await Vendor.findOne({
      where: { contactEmail: email.toLowerCase() }
    })

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          status: user.status,
          courtId: user.courtId,
          hasPassword: !!user.password,
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified,
        },
        court: user.court ? {
          courtId: user.court.courtId,
          instituteName: user.court.instituteName,
          status: user.court.status,
        } : null,
        vendor: vendor ? {
          id: vendor.id,
          stallName: vendor.stallName,
          status: vendor.status,
        } : null,
      }
    })
  } catch (error) {
    console.error("Debug API error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error.message,
      },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const { email, courtId } = await request.json()

    if (!email || !courtId) {
      return NextResponse.json(
        {
          success: false,
          message: "Email and courtId are required",
        },
        { status: 400 }
      )
    }

    // Find and update user status
    const user = await User.findOne({
      where: {
        email: email.toLowerCase(),
        courtId,
      },
    })

    if (!user) {
      return NextResponse.json({
        success: false,
        message: "User not found",
      })
    }

    await user.update({ status: 'active' })

    return NextResponse.json({
      success: true,
      message: "User status updated to active",
      data: {
        id: user.id,
        email: user.email,
        status: user.status,
      }
    })
  } catch (error) {
    console.error("Debug API error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error.message,
      },
      { status: 500 }
    )
  }
}
