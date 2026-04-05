import { NextResponse } from "next/server"
import { VendorService } from "@/lib/services/vendor-service"
import { successResponse, errorResponse, handleServiceError } from "@/lib/api-response"
import { authenticateToken } from "@/middleware/auth"

// GET - List all vendors with optional filters
export async function GET(request) {
  try {
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) return authResult

    const { user } = authResult

    if (user.role !== "admin") {
      return errorResponse("Admin access required", 403, "ADMIN_REQUIRED")
    }

    const { searchParams } = new URL(request.url)
    const courtId = searchParams.get("courtId")
    const status = searchParams.get("status")
    const onboarded = searchParams.get("onboarded")
    const page = parseInt(searchParams.get("page")) || 1
    const limit = parseInt(searchParams.get("limit")) || 10
    
    // Validation query parameters
    const email = searchParams.get("email")
    const phone = searchParams.get("phone")
    const stallName = searchParams.get("stallName")

    if (!courtId) {
      return errorResponse("Court ID is required", 400, "MISSING_COURT_ID")
    }

    // Handle validation queries
    if (email || phone || stallName) {
      const result = await VendorService.checkExists(courtId, { email, phone, stallName })
      return successResponse(result)
    }

    // Get vendors list
    const result = await VendorService.getVendors({
      courtId,
      status: status || undefined,
      onboarded: onboarded === "true" ? true : onboarded === "false" ? false : undefined,
      page,
      limit,
    })

    return successResponse(result)
  } catch (error) {
    return handleServiceError(error)
  }
}

// POST - Create a new vendor
export async function POST(request) {
  try {
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) return authResult

    const { user } = authResult

    if (user.role !== "admin") {
      return errorResponse("Admin access required", 403, "ADMIN_REQUIRED")
    }

    console.log("🚀 API POST /api/admin/vendors called")
    const body = await request.json()
    console.log("📨 Request body received:", Object.keys(body))
    console.log("🏛️ Court ID:", body.courtId)
    
    const {
      courtId,
      stallName,
      vendorName,
      contactEmail,
      contactPhone,
      stallLocation,
      cuisineType,
      description,
      logoUrl,
      bannerUrl,
      operatingHours,
      bankAccountNumber,
      bankIfscCode,
      bankAccountHolderName,
      bankName,
      panNumber,
      gstin,
      maxOrdersPerHour,
      averagePreparationTime,
      businessType,
      onboardingStep,
      onboardingStatus,
      // Address fields
      addressStreet1,
      addressStreet2,
      addressCity,
      addressState,
      addressPostalCode,
      addressCountry,
    } = body

    // Validate required fields
    if (!courtId || !stallName || !vendorName || !contactEmail || !contactPhone) {
      return errorResponse(
        "Missing required fields: courtId, stallName, vendorName, contactEmail, contactPhone",
        400,
        "MISSING_REQUIRED_FIELDS"
      )
    }

    // Create vendor using service
    const vendor = await VendorService.createVendor({
      courtId,
      stallName,
      vendorName,
      contactEmail,
      contactPhone,
      stallLocation,
      cuisineType,
      description,
      logoUrl,
      bannerUrl,
      operatingHours,
      bankAccountNumber,
      bankIfscCode,
      bankAccountHolderName,
      bankName,
      panNumber,
      gstin,
      maxOrdersPerHour,
      averagePreparationTime,
      businessType,
      onboardingStep,
      onboardingStatus,
      addressStreet1,
      addressStreet2,
      addressCity,
      addressState,
      addressPostalCode,
      addressCountry,
    })

    return successResponse({ vendor }, "Vendor created successfully", 201)
  } catch (error) {
    console.error("Create vendor error:", error)
    return handleServiceError(error)
  }
}
