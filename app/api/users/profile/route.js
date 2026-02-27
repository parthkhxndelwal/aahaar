import { NextResponse } from "next/server"
import { User } from "@/models"
import { authenticateToken } from "@/middleware/auth"
import bcrypt from "bcryptjs"

// Import the database-backed OTP store
const { otpStore } = require("@/lib/otp-store")

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
    const { 
      fullName, 
      email, 
      phone, 
      dateOfBirth, 
      gender, 
      profilePicture, 
      preferences, 
      currentPassword, 
      newPassword 
    } = await request.json()

    const user = await User.findByPk(authenticatedUser.id)
    const updateData = {}

    // Handle fields that don't require OTP
    if (fullName) updateData.fullName = fullName
    if (dateOfBirth) updateData.dateOfBirth = dateOfBirth
    if (gender) updateData.gender = gender
    if (profilePicture) updateData.profilePicture = profilePicture
    if (preferences) updateData.preferences = { ...user.preferences, ...preferences }

    // Handle email update (requires OTP verification)
    if (email && email !== user.email) {
      const otpKey = `${authenticatedUser.id}-email-${email}`
      const storedOTPData = await otpStore.get(otpKey)

      if (!storedOTPData || !storedOTPData.verified) {
        return NextResponse.json({ 
          success: false, 
          message: "Email change requires OTP verification. Please verify your new email first." 
        }, { status: 400 })
      }

      updateData.email = email
      updateData.emailVerified = false // Reset email verification status
      await otpStore.delete(otpKey) // Clean up used OTP
    }

    // Handle phone update (requires OTP verification)
    if (phone && phone !== user.phone) {
      const otpKey = `${authenticatedUser.id}-phone-${phone}`
      const storedOTPData = await otpStore.get(otpKey)

      if (!storedOTPData || !storedOTPData.verified) {
        return NextResponse.json({ 
          success: false, 
          message: "Phone change requires OTP verification. Please verify your new phone number first." 
        }, { status: 400 })
      }

      updateData.phone = phone
      updateData.phoneVerified = false // Reset phone verification status
      await otpStore.delete(otpKey) // Clean up used OTP
    }

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
