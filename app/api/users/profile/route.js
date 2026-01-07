import { NextResponse } from "next/server"
import { User } from "@/models"
import { authenticateToken } from "@/middleware/auth"
import bcrypt from "bcryptjs"

export async function GET(request) {
  try {
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) return authResult

    const { user: authenticatedUser } = authResult
    const user = await User.findByPk(authenticatedUser.id, {
      attributes: { exclude: ["password"] },
    })

    return NextResponse.json({
      success: true,
      data: { user },
    })
  } catch (error) {
    console.error("Get profile error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) return authResult

    const { user: authenticatedUser } = authResult
    const { fullName, phone, preferences, currentPassword, newPassword } = await request.json()

    const user = await User.findByPk(authenticatedUser.id)

    const updateData = {}
    if (fullName) updateData.fullName = fullName
    if (phone) updateData.phone = phone
    if (preferences) updateData.preferences = { ...user.preferences, ...preferences }

    // Handle password change
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ success: false, message: "Current password is required" }, { status: 400 })
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user.password)
      if (!isValidPassword) {
        return NextResponse.json({ success: false, message: "Invalid current password" }, { status: 400 })
      }

      updateData.password = await bcrypt.hash(newPassword, 12)
    }

    await user.update(updateData)

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      data: { user: { ...user.toJSON(), password: undefined } },
    })
  } catch (error) {
    console.error("Update profile error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
