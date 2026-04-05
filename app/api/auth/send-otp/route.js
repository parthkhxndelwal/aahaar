import { Court, AuditLog, OTP, User } from "@/models"
import { successResponse, errorResponse, handleServiceError } from "@/lib/api-response"

export async function POST(request) {
  try {
    const { phone, email, courtId } = await request.json()

    if ((!phone && !email) || !courtId) {
      return errorResponse("Phone or email and court ID are required", 400)
    }

    // Define identifier early so it can be used in rate limiting
    const identifier = phone || email
    const type = phone ? 'phone' : 'email'

    // Verify court exists
    const court = await Court.findOne({ where: { courtId, status: "active" } })
    if (!court) {
      return errorResponse("Invalid court ID", 404)
    }

    // Rate limiting - check recent OTPs sent in last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const recentOtpsCount = await OTP.count({
      where: {
        value: identifier,
        createdAt: { [require("sequelize").Op.gte]: fiveMinutesAgo }
      }
    })
    if (recentOtpsCount >= 3) {
      return errorResponse("Too many OTP requests. Please try again later.", 429)
    }

    // Generate OTP using cryptographically secure random
    const otp = (await import('crypto')).randomInt(100000, 999999).toString()

    // Store OTP in database with expiration (15 minutes)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes from now
    
    try {
      // Find existing user for this email/phone
      let user = await User.findOne({
        where: {
          [type === 'email' ? 'email' : 'phone']: identifier,
        }
      })

      // Check if user exists and has a non-customer role
      if (user && user.role !== 'user') {
        console.log(`❌ ${user.role} account cannot use customer login:`, identifier)
        return errorResponse(
          `A ${user.role === 'vendor' ? 'vendor' : 'admin'} account email cannot be used to continue. Please use an alternate email instead.`,
          403
        )
      }

      // If user doesn't exist, we'll create them later during OTP verification
      // For now, just store the OTP with a temporary identifier
      let userId = null
      if (user) {
        userId = user.id
        // Delete any existing OTP for this user and type
        await OTP.destroy({ 
          where: { 
            userId: user.id,
            type: type,
            value: identifier,
            courtId: courtId
          } 
        })
      } else {
        // For new users, delete any OTPs for this identifier
        await OTP.destroy({ 
          where: { 
            type: type,
            value: identifier,
            courtId: courtId
          } 
        })
      }

      // Create new OTP record (userId can be null for new users)
      await OTP.create({
        userId: userId,
        type: type,
        value: identifier,
        otp: otp,
        courtId: courtId,
        expiresAt: expiresAt,
        verified: false
      })

      console.log(`✅ OTP stored for ${identifier} (existing user: ${!!user})`)
    } catch (dbError) {
      console.error("❌ Failed to store OTP in database:", dbError)
      return errorResponse("Failed to generate OTP", 500)
    }

    // TODO: Send SMS/Email using your provider
    if (type === 'phone') {
      // TODO: Send SMS
      console.log(`📱 SMS OTP for ${phone}: ${otp}`)
      console.log(`⏰ OTP expires at: ${expiresAt.toLocaleString()}`)
    } else {
      // TODO: Send Email
      console.log(`📧 Email OTP for ${email}: ${otp}`)
      console.log(`⏰ OTP expires at: ${expiresAt.toLocaleString()}`)
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

    return successResponse(
      {},
      "OTP sent successfully"
    )
  } catch (error) {
    console.error("Send OTP error:", error)
    return handleServiceError(error)
  }
}
