import { NextResponse } from "next/server"
import { User } from "@/models"

export async function POST(request) {
  try {
    const { email, phone } = await request.json()

    if (!email && !phone) {
      return NextResponse.json(
        {
          success: false,
          message: "Email or phone is required",
        },
        { status: 400 },
      )
    }

    const checks = {}

    if (email) {
      const existingUserByEmail = await User.findOne({
        where: { email: email.toLowerCase() },
      })
      checks.email = {
        available: !existingUserByEmail,
        exists: !!existingUserByEmail,
        userType: existingUserByEmail ? existingUserByEmail.role : null,
        message: existingUserByEmail ? "Email is already registered" : "Email is available",
      }
    }

    if (phone) {
      const existingUserByPhone = await User.findOne({
        where: { phone },
      })
      checks.phone = {
        available: !existingUserByPhone,
        message: existingUserByPhone ? "Phone number is already registered" : "Phone number is available",
      }
    }

    return NextResponse.json({
      success: true,
      data: checks,
    })
  } catch (error) {
    console.error("Availability check error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    )
  }
}
