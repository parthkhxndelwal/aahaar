import { NextResponse } from "next/server"
import { authenticateToken } from "@/middleware/auth"

// Import the database-backed OTP store
const { otpStore } = require("@/lib/otp-store")

export async function POST(request) {
  try {
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) return authResult

    const { user: authenticatedUser } = authResult
    const { changedFields, emailValue, phoneValue, otp } = await request.json()

    const storeSize = await otpStore.getSize()
    const allKeys = await otpStore.keys()
    console.log("🔍 Verify OTP Debug:", {
      userId: authenticatedUser.id,
      changedFields,
      emailValue,
      phoneValue,
      otp,
      otpStoreSize: storeSize,
      allKeys: allKeys
    })

    if (!changedFields || !Array.isArray(changedFields) || changedFields.length === 0 || !otp) {
      return NextResponse.json({ success: false, message: "changedFields array and OTP are required" }, { status: 400 })
    }

    // Verify OTP for all changed fields
    const verificationResults = []
    
    for (const field of changedFields) {
      const value = field === 'email' ? emailValue : phoneValue
      const otpKey = `${authenticatedUser.id}-${field}-${value}`
      console.log(`🔑 Looking for OTP key: ${otpKey}`)
      
      const storedOTPData = await otpStore.get(otpKey)
      console.log(`📦 Stored OTP data:`, storedOTPData)

      if (!storedOTPData) {
        console.log(`❌ OTP not found for key: ${otpKey}`)
        return NextResponse.json({ 
          success: false, 
          message: `OTP not found or expired for ${field}` 
        }, { status: 400 })
      }

      if (Date.now() > storedOTPData.expiresAt) {
        await otpStore.delete(otpKey)
        return NextResponse.json({ 
          success: false, 
          message: "OTP expired" 
        }, { status: 400 })
      }

      if (storedOTPData.otp !== otp) {
        return NextResponse.json({ 
          success: false, 
          message: "Invalid OTP" 
        }, { status: 400 })
      }

      // Mark as verified
      await otpStore.markAsVerified(otpKey)
      verificationResults.push({ field, verified: true })
    }

    return NextResponse.json({
      success: true,
      message: `OTP verified successfully for ${changedFields.join(' and ')}`,
      data: { 
        verified: true,
        changedFields,
        verificationResults
      }
    })
  } catch (error) {
    console.error("Verify profile OTP error:", error)
    return NextResponse.json({ success: false, message: "Failed to verify OTP" }, { status: 500 })
  }
}
