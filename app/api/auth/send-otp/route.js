import { NextResponse } from "next/server"
import { Court, AuditLog } from "@/models"

export async function POST(request) {
  try {
    const { phone, courtId } = await request.json()

    if (!phone || !courtId) {
      return NextResponse.json({ success: false, message: "Phone and court ID are required" }, { status: 400 })
    }

    // Verify court exists
    const court = await Court.findOne({ where: { courtId, status: "active" } })
    if (!court) {
      return NextResponse.json({ success: false, message: "Invalid court ID" }, { status: 404 })
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    // TODO: Store OTP in Redis/cache with expiration
    // TODO: Send SMS using your SMS provider

    console.log(`OTP for ${phone}: ${otp}`) // For development

    // Create audit log for OTP sent
    try {
      await AuditLog.create({
        courtId: courtId,
        action: "OTP_SENT",
        entityType: "user",
        entityId: phone,
        metadata: {
          phone: phone,
          otpLength: otp.length,
          environment: process.env.NODE_ENV,
          userAgent: request.headers.get("user-agent") || "unknown",
          ipAddress: request.headers.get("x-forwarded-for") || 
                    request.headers.get("x-real-ip") || 
                    request.headers.get("x-client-ip") || 
                    "unknown"
        },
        ipAddress: request.headers.get("x-forwarded-for") || 
                  request.headers.get("x-real-ip") || 
                  request.headers.get("x-client-ip") || 
                  "unknown",
        userAgent: request.headers.get("user-agent") || "unknown"
      })
      console.log("✅ Audit log created for OTP sent:", phone)
    } catch (auditError) {
      console.error("❌ Failed to create audit log for OTP sent:", auditError)
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
      data: { otp: process.env.NODE_ENV === "development" ? otp : undefined },
    })
  } catch (error) {
    console.error("Send OTP error:", error)
    return NextResponse.json({ success: false, message: "Failed to send OTP" }, { status: 500 })
  }
}
