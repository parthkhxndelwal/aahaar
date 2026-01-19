import { NextResponse } from "next/server"
import { User } from "@/models"
import bcrypt from "bcryptjs"

export async function POST(request) {
  try {
    const { email, courtId, newPassword } = await request.json()

    if (!email || !courtId || !newPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Email, courtId, and newPassword are required",
        },
        { status: 400 }
      )
    }

    console.log(`🔧 Admin: Resetting password for ${email} in court ${courtId}`)

    // Find user
    const user = await User.findOne({
      where: {
        email: email.toLowerCase(),
        courtId,
        role: "vendor"
      }
    })

    if (!user) {
      return NextResponse.json({
        success: false,
        message: "Vendor user not found",
      })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update password
    await user.update({ password: hashedPassword })

    console.log(`✅ Password reset for ${email}`)

    return NextResponse.json({
      success: true,
      message: "Password reset successfully",
      data: {
        email: user.email,
        courtId: user.courtId,
        role: user.role
      }
    })

  } catch (error) {
    console.error('❌ Error resetting password:', error)
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
