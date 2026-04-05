import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { User, Court, CourtSettings, AuditLog } from "@/models"
import { successResponse, errorResponse, handleServiceError } from "@/lib/api-response"

export async function POST(request) {
  try {
    // Check if request has body
    const contentLength = request.headers.get('content-length')
    if (!contentLength || contentLength === '0') {
      console.log("❌ Empty request body")
      return errorResponse("Request body is empty", 400)
    }

    // Parse JSON with error handling
    let requestData
    try {
      requestData = await request.json()
    } catch (parseError) {
      console.error("❌ JSON parse error:", parseError)
      return errorResponse("Invalid JSON in request body", 400)
    }

    const {
      email,
      password,
      fullName,
      phone,
      courtId,
      instituteName,
      instituteType = "college",
    } = requestData

    console.log("📝 Registration attempt:", { 
      email, 
      fullName, 
      phone, 
      courtId, 
      instituteName
    })

    // Basic validation for admin registration
    if (!email || !password || !fullName) {
      return errorResponse("Email, password, and full name are required", 400)
    }

    // For court creation (not admin registration), validate court fields
    if (courtId || instituteName) {
      if (!courtId || !instituteName) {
        return errorResponse("Both court ID and institute name are required for court creation", 400)
      }

      // Validate courtId format (alphanumeric, hyphens, underscores only)
      if (!/^[a-zA-Z0-9-_]+$/.test(courtId)) {
        return errorResponse("Court ID can only contain letters, numbers, hyphens, and underscores", 400)
      }

      // Check if court ID is already taken
      const existingCourt = await Court.findOne({
        where: { courtId },
      })

      if (existingCourt) {
        return errorResponse("Court ID is already taken", 400)
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        email: email.toLowerCase(),
      },
    })

    if (existingUser) {
      return errorResponse("User with this email already exists", 400)
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    let court = null
    let userCourtId = null

    // Create court if court information is provided (from onboarding)
    if (courtId && instituteName) {
      console.log("🏢 Creating court during registration")
      court = await Court.create({
        courtId,
        instituteName,
        instituteType,
        contactEmail: email.toLowerCase(),
        contactPhone: phone,
        status: "active",
        subscriptionPlan: "trial",
        subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
      })

      // Create default court settings
      await CourtSettings.create({
        courtId,
        allowOnlinePayments: true,
        allowCOD: true,
        platformFeePercentage: 2.5,
        maxOrdersPerUser: 5,
        orderBufferTime: 5,
        minimumOrderAmount: 0,
        maximumOrderAmount: 5000,
        autoAcceptOrders: false,
        orderCancellationWindow: 5,
        themeSettings: {
          primaryColor: "#3B82F6",
          secondaryColor: "#10B981",
          accentColor: "#F59E0B",
        },
        notificationSettings: {
          emailNotifications: true,
          smsNotifications: false,
          pushNotifications: true,
        },
      })

      userCourtId = courtId
    }
    // For admin registration without court info, leave courtId as null
    // They will create their court in the onboarding process

    // Create user with hardcoded "user" role - never accept role from client input
    const user = await User.create({
      courtId: userCourtId,
      email: email.toLowerCase(),
      password: hashedPassword,
      fullName,
      phone,
      role: "user",
      status: "active",
      emailVerified: true,
    })

    // Create audit log for successful registration
    try {
      await AuditLog.create({
        courtId: userCourtId || "system", // Use "system" for registrations without court
        userId: user.id,
        action: "USER_REGISTER",
        entityType: "user",
        entityId: user.id,
        metadata: {
          registrationMethod: "admin",
          hasCourt: !!court,
          courtId: userCourtId,
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
      console.log("✅ Audit log created for user registration:", user.email)
    } catch (auditError) {
      console.error("❌ Failed to create audit log for registration:", auditError)
      // Don't fail the registration if audit log creation fails
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        courtId: user.courtId,
        role: user.role,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
    )

    return successResponse({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        courtId: user.courtId,
        court: court ? {
          courtId: court.courtId,
          instituteName: court.instituteName,
        } : null,
      },
    }, "Registration successful", 201)
  } catch (error) {
    console.error("Registration error:", error)
    return handleServiceError(error)
  }
}
