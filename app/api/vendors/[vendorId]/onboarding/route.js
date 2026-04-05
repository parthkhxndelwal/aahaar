import { NextResponse } from "next/server"
import { Vendor, User } from "@/models"
import bcrypt from "bcryptjs"

export async function POST(request, { params }) {
  try {
    const { vendorId } = params
    const { email, password, fullName, onboardingData } = await request.json()

    // Find vendor
    const vendor = await Vendor.findByPk(vendorId)
    if (!vendor) {
      return NextResponse.json({ success: false, message: "Vendor not found" }, { status: 404 })
    }

    // Create user account for vendor if not exists
    let user = await User.findOne({ where: { email: email.toLowerCase(), courtId: vendor.courtId } })

    if (!user) {
      const generateSecurePassword = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
        let password = ''
        for (let i = 0; i < 16; i++) {
          password += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return password
      }
      const vendorPassword = generateSecurePassword()
      const hashedPassword = await bcrypt.hash(vendorPassword, 12)

      user = await User.create({
        courtId: vendor.courtId,
        email: email.toLowerCase(),
        password: hashedPassword,
        fullName,
        role: "vendor",
        status: "active",
        emailVerified: true,
      })

      console.log(`✅ Vendor user created: ${email}`)
    }

    // Link vendor to user
    await vendor.update({
      userId: user.id,
      status: "active",
      ...onboardingData,
    })

    return NextResponse.json({
      success: true,
      message: "Vendor onboarding completed successfully. A secure password has been set.",
      data: {
        vendor,
        user: { ...user.toJSON(), password: undefined },
      },
    })
  } catch (error) {
    console.error("Vendor onboarding error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
