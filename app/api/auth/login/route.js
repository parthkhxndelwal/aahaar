import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { User, Court, Vendor, AuditLog, OTP } from "@/models"

// Ensure environment variables are loaded
if (typeof window === 'undefined') {
  require('dotenv').config()
}

export async function POST(request) {
  try {
    // Check if request has body
    const contentLength = request.headers.get('content-length')
    if (!contentLength || contentLength === '0') {
      console.log("❌ Empty request body")
      return NextResponse.json(
        {
          success: false,
          message: "Request body is empty",
        },
        { status: 400 },
      )
    }

    // Parse JSON with error handling
    let requestData
    try {
      requestData = await request.json()
    } catch (parseError) {
      console.error("❌ JSON parse error:", parseError)
      return NextResponse.json(
        {
          success: false,
          message: "Invalid JSON in request body",
        },
        { status: 400 },
      )
    }

    const { email, password, courtId, phone, otp, loginType = "password" } = requestData

    // Email-based OTP verification
    if (loginType === "otp") {
      if (!email || !otp || !courtId) {
        return NextResponse.json({ 
          success: false, 
          message: "Email, OTP, and court ID are required" 
        }, { status: 400 })
      }

      console.log("🔐 Email OTP verification attempt:", { email, otp, courtId })

      // First, find if user already exists
      let user = await User.findOne({
        where: { 
          email: email.toLowerCase()
        }
      })

      const isExistingUser = !!user

      console.log("👤 User lookup result:", { email, userExists: isExistingUser, userId: user?.id })

      // Check if user has a non-customer role
      if (user && user.role !== 'user') {
        console.log(`❌ ${user.role} account cannot use customer login:`, email)
        return NextResponse.json({ 
          success: false, 
          message: `This email is registered as a ${user.role === 'vendor' ? 'vendor' : 'admin'} account. Please use the ${user.role} login portal instead.` 
        }, { status: 403 })
      }

      // Look for OTP record - for existing users use userId, for new users search by email
      let otpQuery = {
        type: 'email',
        value: email.toLowerCase(),
        otp: otp,
        courtId: courtId,
        verified: false,
        expiresAt: {
          [require('sequelize').Op.gt]: new Date()
        }
      }

      if (isExistingUser) {
        otpQuery.userId = user.id
      } else {
        otpQuery.userId = null // For new users, userId should be null
      }

      console.log("🔍 Looking for OTP record with criteria:", otpQuery)

      const otpRecord = await OTP.findOne({
        where: otpQuery,
        order: [['createdAt', 'DESC']]
      })

      console.log("🔍 Found OTP record:", otpRecord ? {
        id: otpRecord.id,
        otp: otpRecord.otp,
        userId: otpRecord.userId,
        verified: otpRecord.verified,
        expiresAt: otpRecord.expiresAt,
        courtId: otpRecord.courtId
      } : null)

      if (!otpRecord) {
        console.log("❌ Invalid or expired OTP:", { email, otp, isExistingUser })
        
        // Create audit log for failed OTP verification
        try {
          await AuditLog.create({
            courtId: courtId,
            action: "USER_OTP_VERIFICATION_FAILED",
            entityType: "user",
            entityId: email,
            metadata: {
              failureReason: "invalid_or_expired_otp",
              attemptedEmail: email,
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
        } catch (auditError) {
          console.error("❌ Failed to create audit log for failed OTP verification:", auditError)
        }
        
        return NextResponse.json({ 
          success: false, 
          message: "Invalid or expired OTP" 
        }, { status: 401 })
      }

      // Mark OTP as verified and destroy it
      await otpRecord.update({ verified: true })
      await otpRecord.destroy()

      // Handle existing user vs new user
      if (isExistingUser) {
        console.log("✅ OTP verified for existing user")
        
        // Re-fetch user with court info for existing user
        user = await User.findOne({
          where: { 
            email: email.toLowerCase()
          },
          include: [{ model: Court, as: "court" }],
        })

        // Check if profile is complete
        if (!user.profileCompleted || !user.fullName || !user.password) {
          console.log("✅ Existing user needs profile completion")
          
          return NextResponse.json({
            success: true,
            message: "OTP verified successfully",
            data: {
              requiresProfileCompletion: true,
              isNewUser: false,
              email: email.toLowerCase(),
              courtId: courtId,
              user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName === 'Temporary User' ? null : user.fullName,
                hasPassword: !!user.password
              }
            },
          })
        }

        // Existing user with complete profile - generate token and login
        const token = jwt.sign({ 
          userId: user.id, 
          courtId: user.courtId, 
          role: user.role,
          email: user.email 
        }, process.env.JWT_SECRET || 'fallback-secret-for-dev', {
          expiresIn: process.env.JWT_EXPIRES_IN || "7d",
        })

        // Update last login
        await user.update({ lastLoginAt: new Date() })

        // Create audit log for successful OTP login
        try {
          await AuditLog.create({
            courtId: user.courtId,
            userId: user.id,
            action: "USER_LOGIN_OTP",
            entityType: "user",
            entityId: user.id,
            metadata: {
              loginMethod: "email_otp",
              email: email,
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
          console.log("✅ Audit log created for existing user OTP login:", email)
        } catch (auditError) {
          console.error("❌ Failed to create audit log for OTP login:", auditError)
        }

        return NextResponse.json({
          success: true,
          message: "Login successful",
          data: {
            token,
            user: {
              id: user.id,
              email: user.email,
              fullName: user.fullName,
              role: user.role,
              courtId: user.courtId,
              profileCompleted: user.profileCompleted,
              court: user.court,
            },
          },
        })
      } else {
        console.log("✅ OTP verified for new user, creating account")
        
        // Create new user account
        user = await User.create({
          email: email.toLowerCase(),
          fullName: 'Temporary User',
          courtId: courtId,
          role: 'user',
          status: 'pending' // Mark as pending until profile is completed
        })

        // Create audit log for new user OTP verification
        try {
          await AuditLog.create({
            courtId: courtId,
            action: "USER_OTP_VERIFIED",
            entityType: "user",
            entityId: email,
            metadata: {
              isNewUser: true,
              requiresProfileCompletion: true,
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
        } catch (auditError) {
          console.error("❌ Failed to create audit log for new user OTP verification:", auditError)
        }

        return NextResponse.json({
          success: true,
          message: "OTP verified successfully",
          data: {
            requiresProfileCompletion: true,
            isNewUser: true,
            email: email.toLowerCase(),
            courtId: courtId,
            user: {
              id: user.id,
              email: user.email,
              fullName: null, // New user needs to set name
              hasPassword: false // New user needs to set password
            }
          },
        })
      }
    }

    // Legacy phone-based OTP login (for backward compatibility)
    if (loginType === "phone_otp" && phone) {
      // OTP-based login for users
      if (!phone || !otp || !courtId) {
        return NextResponse.json({ success: false, message: "Phone, OTP, and court ID are required" }, { status: 400 })
      }

      console.log("🔐 OTP Login attempt:", { phone, otp, courtId, isDevelopment: process.env.NODE_ENV === "development" })

      // TODO: Verify OTP from Redis/cache
      // For demo purposes, accept any 6-digit OTP in development
      if (process.env.NODE_ENV === "development") {
        // In development, accept any 6-digit number as valid OTP
        if (!/^\d{6}$/.test(otp)) {
          console.log("❌ Invalid OTP format:", otp)
          
          // Create audit log for failed OTP attempt
          try {
            await AuditLog.create({
              courtId: courtId,
              action: "USER_LOGIN_OTP_FAILED",
              entityType: "user",
              entityId: phone,
              metadata: {
                loginMethod: "otp",
                failureReason: "invalid_format",
                attemptedPhone: phone,
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
            console.log("⚠️ Audit log created for failed OTP attempt (invalid format):", phone)
          } catch (auditError) {
            console.error("❌ Failed to create audit log for failed OTP:", auditError)
          }
          
          return NextResponse.json({ success: false, message: "Invalid OTP format" }, { status: 401 })
        }
        console.log("✅ OTP format valid in development mode")
      } else {
        // In production, you should verify against stored OTP
        if (otp !== "123456") {
          console.log("❌ Invalid OTP in production:", otp)
          
          // Create audit log for failed OTP attempt
          try {
            await AuditLog.create({
              courtId: courtId,
              action: "USER_LOGIN_OTP_FAILED",
              entityType: "user",
              entityId: phone,
              metadata: {
                loginMethod: "otp",
                failureReason: "invalid_otp",
                attemptedPhone: phone,
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
            console.log("⚠️ Audit log created for failed OTP attempt (invalid OTP):", phone)
          } catch (auditError) {
            console.error("❌ Failed to create audit log for failed OTP:", auditError)
          }
          
          return NextResponse.json({ success: false, message: "Invalid OTP" }, { status: 401 })
        }
        console.log("✅ OTP valid in production mode")
      }

      // Find or create user with phone
      let user = await User.findOne({
        where: { phone, courtId },
        include: [{ model: Court, as: "court" }],
      })

      if (!user) {
        // Create new user for OTP login
        user = await User.create({
          courtId,
          phone,
          fullName: `User ${phone}`,
          email: `${phone}@temp.com`,
          role: "user",
          status: "active",
          phoneVerified: true,
        })

        // Fetch court info
        const court = await Court.findOne({ where: { courtId } })
        user.court = court
      }

      // Generate token
      const token = jwt.sign({ userId: user.id, courtId: user.courtId, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
      })

      // Create audit log for successful OTP login
      try {
        await AuditLog.create({
          courtId: user.courtId,
          userId: user.id,
          action: "USER_LOGIN_OTP",
          entityType: "user",
          entityId: user.id,
          metadata: {
            loginMethod: "otp",
            phone: phone,
            isNewUser: !user.createdAt || (new Date() - user.createdAt) < 60000, // Created within last minute
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
        console.log("✅ Audit log created for OTP login:", phone)
      } catch (auditError) {
        console.error("❌ Failed to create audit log for OTP login:", auditError)
      }

      return NextResponse.json({
        success: true,
        message: "OTP login successful",
        data: {
          token,
          user: {
            id: user.id,
            phone: user.phone,
            fullName: user.fullName,
            role: user.role,
            courtId: user.courtId,
            court: user.court,
          },
        },
      })
    }

    // Email/password login
    if (!email || !password) {
      console.log("❌ Missing credentials:", { email: !!email, password: !!password })
      return NextResponse.json(
        {
          success: false,
          message: "Email and password are required",
        },
        { status: 400 },
      )
    }

    console.log("🔐 Login attempt:", { email, courtId, hasPassword: !!password })

    // For vendor login, find user without court restriction (email is unique)
    // For regular users, court ID is still required
    let user
    if (courtId) {
      console.log("🏢 Court-specific login")
      // Regular user login with specific court
      user = await User.findOne({
        where: {
          email: email.toLowerCase(),
          courtId,
        },
        include: [
          {
            model: Court,
          as: "court",
          attributes: ["courtId", "instituteName", "status"],
        },
        {
          model: Vendor,
          as: "vendorProfile",
          attributes: ["id", "stallName", "stallLocation", "isOnline", "status"],
        },
      ],
    })
    } else {
      console.log("�‍🍳 Vendor login without court restriction")
      // Vendor login without court restriction (email is unique)
      user = await User.findOne({
        where: {
          email: email.toLowerCase(),
        },
        include: [
          {
            model: Court,
            as: "court",
            attributes: ["courtId", "instituteName", "status"],
          },
          {
            model: Vendor,
            as: "vendorProfile",
            attributes: ["id", "stallName", "stallLocation", "isOnline", "status"],
          },
        ],
      })
    }

    console.log("👤 User found:", { 
      found: !!user, 
      role: user?.role, 
      courtId: user?.courtId,
      status: user?.status 
    })

    if (!user) {
      console.log("❌ No user found with email:", email)
      
      // Create audit log for failed login attempt (user not found)
      try {
        await AuditLog.create({
          courtId: courtId || "system",
          action: "USER_LOGIN_FAILED",
          entityType: "user",
          entityId: email, // Use email as entityId since user doesn't exist
          metadata: {
            loginMethod: "password",
            failureReason: "user_not_found",
            attemptedEmail: email,
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
        console.log("⚠️ Audit log created for failed login attempt (user not found):", email)
      } catch (auditError) {
        console.error("❌ Failed to create audit log for failed login:", auditError)
      }
      
      return NextResponse.json(
        {
          success: false,
          message: "Invalid credentials",
        },
        { status: 401 },
      )
    }

    // For customer portal login (with courtId), only allow 'user' role
    if (courtId && user.role !== 'user') {
      console.log(`❌ ${user.role} account cannot use customer portal:`, email)
      return NextResponse.json({ 
        success: false, 
        message: `This email is registered as a ${user.role === 'vendor' ? 'vendor' : 'admin'} account. Please use the ${user.role} portal instead.` 
      }, { status: 403 })
    }

    if (user.status !== "active") {
      return NextResponse.json(
        {
          success: false,
          message: "Account is not active. Please contact your admin.",
        },
        { status: 401 },
      )
    }

    // For vendor users, also check vendor status
    if (user.role === "vendor" && user.vendorProfile) {
      if (user.vendorProfile.status !== "active") {
        return NextResponse.json(
          {
            success: false,
            message: "Vendor account is not active. Please contact your admin.",
          },
          { status: 401 },
        )
      }
    }

    // Only check court status if user has a court (not for super admins)
    if (user.court && user.court.status !== "active") {
      return NextResponse.json(
        {
          success: false,
          message: "Court is not active",
        },
        { status: 401 },
      )
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    
    console.log("🔒 Password verification:", { isValid: isValidPassword })
    
    if (!isValidPassword) {
      console.log("❌ Invalid password for user:", email)
      
      // Create audit log for failed login attempt
      try {
        await AuditLog.create({
          courtId: user.courtId || "system",
          userId: user.id,
          action: "USER_LOGIN_FAILED",
          entityType: "user",
          entityId: user.id,
          metadata: {
            loginMethod: "password",
            failureReason: "invalid_password",
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
        console.log("⚠️ Audit log created for failed login attempt:", email)
      } catch (auditError) {
        console.error("❌ Failed to create audit log for failed login:", auditError)
      }
      
      return NextResponse.json(
        {
          success: false,
          message: "Invalid credentials",
        },
        { status: 401 },
      )
    }

    // Generate JWT token
    console.log("🎫 Generating token for user:", { 
      userId: user.id, 
      courtId: user.courtId, 
      role: user.role, 
      email: user.email 
    })
    
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-for-dev'
    if (!process.env.JWT_SECRET) {
      console.log("⚠️ Using fallback JWT secret - this should not happen in production!")
    }
    
    const token = jwt.sign(
      {
        userId: user.id,
        courtId: user.courtId,
        role: user.role,
        email: user.email,
      },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
    )

    // Update last login
    await user.update({ lastLoginAt: new Date() })

    // Create audit log for successful login
    try {
      await AuditLog.create({
        courtId: user.courtId || "system", // Use "system" for admin logins without court
        userId: user.id,
        action: "USER_LOGIN",
        entityType: "user",
        entityId: user.id,
        metadata: {
          loginMethod: "password",
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
      console.log("✅ Audit log created for user login:", user.email)
    } catch (auditError) {
      console.error("❌ Failed to create audit log for login:", auditError)
      // Don't fail the login if audit log creation fails
    }

    // Prepare user data for response
    const userData = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      courtId: user.courtId,
      court: user.court ? {
        courtId: user.court.courtId,
        instituteName: user.court.instituteName,
      } : null,
    }

    // Add vendor profile if user is a vendor
    if (user.role === "vendor" && user.vendorProfile) {
      userData.vendorProfile = {
        id: user.vendorProfile.id,
        stallName: user.vendorProfile.stallName,
        stallLocation: user.vendorProfile.stallLocation,
        isOnline: user.vendorProfile.isOnline,
      }
    }

    return NextResponse.json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: userData,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    )
  }
}
