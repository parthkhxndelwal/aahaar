import { NextResponse } from "next/server"
import { Court, AuditLog, OTP, User } from "@/models"

export async function POST(request) {
  try {
    const { phone, email, courtId } = await request.json()

    if ((!phone && !email) || !courtId) {
      return NextResponse.json({ success: false, message: "Phone or email and court ID are required" }, { status: 400 })
    }

    // Verify court exists
    const court = await Court.findOne({ where: { courtId, status: "active" } })
    if (!court) {
      return NextResponse.json({ success: false, message: "Invalid court ID" }, { status: 404 })
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const identifier = phone || email
    const type = phone ? 'phone' : 'email'

    // Store OTP in database with expiration (15 minutes)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes from now
    
    try {
      // Find or create a user for this email/phone and court
      let user = await User.findOne({
        where: {
          [type === 'email' ? 'email' : 'phone']: identifier,
        }
      })

      // Check if user exists and has a non-customer role
      if (user && user.role !== 'user') {
        console.log(`❌ ${user.role} account cannot use customer login:`, identifier)
        return NextResponse.json({ 
          success: false, 
          message: `A ${user.role === 'vendor' ? 'vendor' : 'admin'} account email cannot be used to continue. Please use an alternate email instead.` 
        }, { status: 403 })
      }

      // If user doesn't exist, create a temporary placeholder user
      if (!user) {
        user = await User.create({
          email: type === 'email' ? identifier : `temp_${Date.now()}@temp.com`,
          phone: type === 'phone' ? identifier : null,
          fullName: 'Temporary User',
          courtId: courtId,
          role: 'user',
          status: 'pending' // Mark as pending until profile is completed
        })
      }

      // Delete any existing OTP for this user and type
      await OTP.destroy({ 
        where: { 
          userId: user.id,
          type: type,
          value: identifier,
          courtId: courtId
        } 
      })

      // Create new OTP record
      await OTP.create({
        userId: user.id,
        type: type,
        value: identifier,
        otp: otp,
        courtId: courtId,
        expiresAt: expiresAt,
        verified: false
      })

      console.log(`✅ OTP stored for ${identifier}: ${otp}`)
    } catch (dbError) {
      console.error("❌ Failed to store OTP in database:", dbError)
      return NextResponse.json({ success: false, message: "Failed to generate OTP" }, { status: 500 })
    }

    // TODO: Send SMS/Email using your provider
    if (type === 'phone') {
      // TODO: Send SMS
      console.log(`📱 SMS OTP for ${phone}: ${otp}`)
    } else {
      // TODO: Send Email
      console.log(`📧 Email OTP for ${email}: ${otp}`)
    }

    // Create audit log for OTP sent
    try {
      await AuditLog.create({
        courtId: courtId,
        action: "OTP_SENT",
        entityType: "user",
        entityId: identifier,
        metadata: {
          identifier: identifier,
          type: type,
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
      console.log("✅ Audit log created for OTP sent:", identifier)
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
