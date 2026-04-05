import { NextResponse } from "next/server"
import { AuthService } from "@/lib/services/auth-service"
import { successResponse, errorResponse, handleServiceError } from "@/lib/api-response"

export async function POST(request) {
  try {
    // Check if request has body
    const contentLength = request.headers.get('content-length')
    if (!contentLength || contentLength === '0') {
      return errorResponse("Request body is empty", 400, "EMPTY_BODY")
    }

    // Parse JSON with error handling
    let requestData
    try {
      requestData = await request.json()
    } catch (parseError) {
      return errorResponse("Invalid JSON in request body", 400, "INVALID_JSON")
    }

    const { email, password, courtId, phone, otp, loginType = "password" } = requestData

    // Get request info for audit logging
    const requestInfo = {
      userAgent: request.headers.get("user-agent") || "unknown",
      ipAddress: request.headers.get("x-forwarded-for") || 
                request.headers.get("x-real-ip") || 
                request.headers.get("x-client-ip") || 
                "unknown"
    }

    // Email-based OTP verification
    if (loginType === "otp") {
      if (!email || !otp || !courtId) {
        return errorResponse("Email, OTP, and court ID are required", 400, "MISSING_FIELDS")
      }

      console.log("🔐 Email OTP verification attempt:", { email, otp, otpType: typeof otp, courtId })

      const result = await AuthService.loginWithEmailOtp(email, otp, courtId, requestInfo)

      if (result.requiresProfileCompletion) {
        return successResponse({
          requiresProfileCompletion: true,
          isNewUser: result.isNewUser,
          email: email.toLowerCase(),
          courtId: courtId,
          user: result.user
        }, "OTP verified successfully")
      }

      return successResponse({
        token: result.token,
        user: result.user
      }, "Login successful")
    }

    // Legacy phone-based OTP login (for backward compatibility)
    if (loginType === "phone_otp" && phone) {
      if (!phone || !otp || !courtId) {
        return errorResponse("Phone, OTP, and court ID are required", 400, "MISSING_FIELDS")
      }

      console.log("🔐 Phone OTP Login attempt:", { phone, otp, courtId })

      // TODO: Implement phone OTP login in AuthService
      // For now, return error as it's legacy
      return errorResponse("Phone OTP login is deprecated. Please use email OTP.", 400, "DEPRECATED_METHOD")
    }

    // Email/password login
    if (!email || !password) {
      return errorResponse("Email and password are required", 400, "MISSING_CREDENTIALS")
    }

    console.log("🔐 Password login attempt:", { email, courtId, hasPassword: !!password })

    const result = await AuthService.loginWithPassword(email, password, courtId, requestInfo)

    return successResponse({
      token: result.token,
      user: result.user
    }, "Login successful")

  } catch (error) {
    console.error("Login error:", error)
    return handleServiceError(error)
  }
}
