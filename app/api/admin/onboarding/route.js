import { NextResponse } from "next/server"
import { Court, CourtSettings, Vendor, AuditLog } from "@/models"
import { authenticateToken } from "@/middleware/auth"

export async function GET(request) {
  try {
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) return authResult

    const { user, courtId } = authResult

    if (user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 })
    }

    const court = await Court.findOne({
      where: { courtId },
      include: [{ model: CourtSettings, as: "settings" }],
    })

    // Check onboarding completion status
    const onboardingStatus = {
      courtSetup: !!court.instituteName && !!court.operatingHours,
      vendorsAdded: false, // Will be checked separately
      settingsConfigured: !!court.settings,
      completed: false,
    }

    return NextResponse.json({
      success: true,
      data: { onboardingStatus, court },
    })
  } catch (error) {
    console.error("Get onboarding status error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    // Authenticate user
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) return authResult

    const { user, courtId } = authResult

    // Only admin can complete onboarding
    if (user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 })
    }

    const { step, data } = await request.json()

    switch (step) {
      case "court_setup":
        await handleCourtSetup(courtId, data, user.id)
        break
      case "vendor_setup":
        await handleVendorSetup(courtId, data, user.id)
        break
      case "settings_setup":
        await handleSettingsSetup(courtId, data, user.id)
        break
      default:
        return NextResponse.json({ success: false, message: "Invalid onboarding step" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: "Onboarding step completed successfully",
    })
  } catch (error) {
    console.error("Onboarding error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

async function handleCourtSetup(courtId, data, userId) {
  const { instituteName, instituteType, logoUrl, address, operatingHours, timezone } = data

  await Court.update(
    {
      instituteName,
      instituteType,
      logoUrl,
      address,
      operatingHours,
      timezone: timezone || "Asia/Kolkata",
    },
    { where: { courtId } },
  )

  // Log audit
  await AuditLog.create({
    courtId,
    userId,
    action: "court_setup_completed",
    entityType: "court",
    entityId: courtId,
    newValues: data,
  })
}

async function handleVendorSetup(courtId, data, userId) {
  const { vendors } = data

  for (const vendorData of vendors) {
    const vendor = await Vendor.create({
      courtId,
      stallName: vendorData.stallName,
      vendorName: vendorData.vendorName,
      contactEmail: vendorData.contactEmail.toLowerCase(),
      contactPhone: vendorData.contactPhone,
      logoUrl: vendorData.logoUrl,
      cuisineType: vendorData.cuisineType,
      description: vendorData.description,
      bankAccountNumber: vendorData.bankAccountNumber,
      bankIfscCode: vendorData.bankIfscCode,
      bankAccountHolderName: vendorData.bankAccountHolderName,
      operatingHours: vendorData.operatingHours,
      status: "inactive", // Will be activated when vendor completes onboarding
    })

    // TODO: Create Razorpay Fund Account
    // TODO: Send invitation email to vendor

    // Log audit
    await AuditLog.create({
      courtId,
      userId,
      action: "vendor_created",
      entityType: "vendor",
      entityId: vendor.id,
      newValues: vendorData,
    })
  }
}

async function handleSettingsSetup(courtId, data, userId) {
  const {
    allowOnlinePayments,
    allowCOD,
    maxOrdersPerUser,
    orderBufferTime,
    allowedEmailDomains,
    requireEmailVerification,
    requirePhoneVerification,
    platformFeePercentage,
    minimumOrderAmount,
    maximumOrderAmount,
    autoAcceptOrders,
    orderCancellationWindow,
    themeSettings,
    notificationSettings,
  } = data

  await CourtSettings.update(
    {
      allowOnlinePayments,
      allowCOD,
      maxOrdersPerUser,
      orderBufferTime,
      allowedEmailDomains,
      requireEmailVerification,
      requirePhoneVerification,
      platformFeePercentage,
      minimumOrderAmount,
      maximumOrderAmount,
      autoAcceptOrders,
      orderCancellationWindow,
      themeSettings,
      notificationSettings,
    },
    { where: { courtId } },
  )

  // Log audit
  await AuditLog.create({
    courtId,
    userId,
    action: "court_settings_updated",
    entityType: "court_settings",
    entityId: courtId,
    newValues: data,
  })
}
