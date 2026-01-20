import { NextResponse } from "next/server"
import { authenticateToken } from "@/middleware/auth"

// Import the database-backed OTP store
const { otpStore } = require("@/lib/otp-store")

export async function POST(request) {
  try {
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) return authResult

    const { user: authenticatedUser } = authResult
    const { type, value } = await request.json()

    if (!type || !value) {
      return NextResponse.json({ success: false, message: "Type and value are required" }, { status: 400 })
    }

    if (type !== 'email' && type !== 'phone') {
      return NextResponse.json({ success: false, message: "Type must be 'email' or 'phone'" }, { status: 400 })
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Store OTP with expiration (5 minutes)
    const otpKey = `${authenticatedUser.id}-${type}-${value}`
    console.log("🔑 Storing OTP with key:", otpKey, "OTP:", otp)
    
    await otpStore.set(otpKey, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      verified: false
    })

    const storeSize = await otpStore.getSize()
    const allKeys = await otpStore.keys()
    console.log("📦 OTP Store after setting:", {
      size: storeSize,
      keys: allKeys,
      storedKey: otpKey
    })

    // TODO: Send actual email/SMS
    console.log(`OTP for ${type} ${value}: ${otp}`) // For development

    return NextResponse.json({
      success: true,
      message: `OTP sent to ${type}`,
      data: { 
        otp: process.env.NODE_ENV === "development" ? otp : undefined,
        expiresIn: 300 // 5 minutes in seconds
      },
    })
  } catch (error) {
    console.error("Send profile OTP error:", error)
    return NextResponse.json({ success: false, message: "Failed to send OTP" }, { status: 500 })
  }
}
