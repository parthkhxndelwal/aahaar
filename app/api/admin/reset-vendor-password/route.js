import { NextResponse } from "next/server"
import { User } from "@/models"
import bcrypt from "bcryptjs"
import { authenticateToken } from "@/middleware/auth"

export async function POST(request) {
  try {
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) return authResult

    const { user } = authResult

    if (user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      )
    }

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

    console.log(`🔧 Admin ${user.id}: Resetting password for ${email} in court ${courtId}`)

    // Find user
    const vendorUser = await User.findOne({
      where: {
        email: email.toLowerCase(),
        courtId,
        role: "vendor"
      }
    })

    if (!vendorUser) {
      return NextResponse.json({
        success: false,
        message: "Vendor user not found",
      })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update password
    await vendorUser.update({ password: hashedPassword })

    console.log(`✅ Password reset for ${email} by admin ${user.id}`)

    return NextResponse.json({
      success: true,
      message: "Password reset successfully",
      data: {
        email: vendorUser.email,
        courtId: vendorUser.courtId,
        role: vendorUser.role
      }
    })

  } catch (error) {
    console.error('❌ Error resetting password:', error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    )
  }
}
