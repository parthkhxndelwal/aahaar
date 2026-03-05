import { NextResponse } from "next/server"
import { CourtSettings, Court } from "@/models"
import { authenticateToken } from "@/middleware/auth"

export async function GET(request, { params }) {
  try {
    const { courtId } = await params

    // Get both court and settings data
    const court = await Court.findOne({
      where: { courtId },
      include: [
        {
          model: CourtSettings,
          as: "settings",
        },
      ],
    })

    if (!court) {
      return NextResponse.json({ success: false, message: "Court not found" }, { status: 404 })
    }

    // Transform the data to match frontend expectations
    const settings = {
      // General Settings from Court model
      instituteName: court.instituteName || "",
      instituteType: court.instituteType || "college",
      logoUrl: court.logoUrl || "",
      address: court.address || "",
      contactPhone: court.contactPhone || "",
      
      // Operating Hours (transform from backend format to frontend format)
      operatingHours: court.operatingHours ? Object.entries(court.operatingHours).reduce((acc, [day, hours]) => {
        acc[day] = {
          isOpen: !hours.closed,
          startTime: hours.open || "09:00",
          endTime: hours.close || "17:00",
          breakStart: hours.breakStart || "",
          breakEnd: hours.breakEnd || "",
        }
        return acc
      }, {}) : {
        monday: { isOpen: true, startTime: "09:00", endTime: "17:00" },
        tuesday: { isOpen: true, startTime: "09:00", endTime: "17:00" },
        wednesday: { isOpen: true, startTime: "09:00", endTime: "17:00" },
        thursday: { isOpen: true, startTime: "09:00", endTime: "17:00" },
        friday: { isOpen: true, startTime: "09:00", endTime: "17:00" },
        saturday: { isOpen: true, startTime: "09:00", endTime: "17:00" },
        sunday: { isOpen: false, startTime: "09:00", endTime: "17:00" }
      },
      
      // Payment Settings from CourtSettings
      enableOnlinePayments: court.settings?.allowOnlinePayments ?? true,
      enableCOD: court.settings?.allowCOD ?? true,
      razorpayKeyId: court.settings?.integrationSettings?.razorpayKeyId || "",
      platformCommission: court.settings?.platformFeePercentage || 2.5,
      
      // Order Settings
      maxOrdersPerStall: court.settings?.metadata?.maxOrdersPerStall || 10,
      orderBufferTime: court.settings?.orderBufferTime || 15,
      autoConfirmOrders: court.settings?.autoAcceptOrders || false,
      allowAdvanceOrders: court.settings?.metadata?.allowAdvanceOrders ?? true,
      
      // User Settings
      requireEmailVerification: court.settings?.requireEmailVerification || false,
      requirePhoneVerification: court.settings?.requirePhoneVerification || true,
      allowedEmailDomains: court.settings?.allowedEmailDomains || [],
      maxOrdersPerUser: court.settings?.maxOrdersPerUser || 5,
      
      // Advanced Settings
      timezone: court.timezone || "Asia/Kolkata",
      minimumOrderAmount: court.settings?.minimumOrderAmount || 0,
      maximumOrderAmount: court.settings?.maximumOrderAmount || 5000,
      orderCancellationWindow: court.settings?.orderCancellationWindow || 5,
    }

    return NextResponse.json({
      success: true,
      data: { settings },
    })
  } catch (error) {
    console.error("Get court settings error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const authResult = await authenticateToken(request)
    const { user } = authResult;
    const { courtId } = await params
    
    const updateData = await request.json()

    if (user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 })
    }

    // Update Court basic information
    const courtUpdateData = {
      instituteName: updateData.instituteName,
      instituteType: updateData.instituteType,
      logoUrl: updateData.logoUrl,
      address: updateData.address,
      contactPhone: updateData.contactPhone && updateData.contactPhone.trim().length >= 8 ? updateData.contactPhone.trim() : null,
      timezone: updateData.timezone,
      // Transform operating hours from frontend format to backend format
      operatingHours: Object.entries(updateData.operatingHours || {}).reduce((acc, [day, hours]) => {
        acc[day] = {
          open: hours.startTime || "09:00",
          close: hours.endTime || "17:00",
          closed: !hours.isOpen,
          breakStart: hours.breakStart || null,
          breakEnd: hours.breakEnd || null,
        }
        return acc
      }, {}),
    }

    await Court.update(courtUpdateData, {
      where: { courtId },
    })

    // Update CourtSettings
    const settingsUpdateData = {
      courtId,
      allowOnlinePayments: updateData.enableOnlinePayments,
      allowCOD: updateData.enableCOD,
      platformFeePercentage: updateData.platformCommission,
      orderBufferTime: updateData.orderBufferTime,
      autoAcceptOrders: updateData.autoConfirmOrders,
      requireEmailVerification: updateData.requireEmailVerification,
      requirePhoneVerification: updateData.requirePhoneVerification,
      allowedEmailDomains: updateData.allowedEmailDomains,
      maxOrdersPerUser: updateData.maxOrdersPerUser,
      minimumOrderAmount: updateData.minimumOrderAmount,
      maximumOrderAmount: updateData.maximumOrderAmount,
      orderCancellationWindow: updateData.orderCancellationWindow,
      integrationSettings: {
        razorpayEnabled: updateData.enableOnlinePayments,
        razorpayKeyId: updateData.razorpayKeyId,
        cloudinaryEnabled: true,
      },
      metadata: {
        maxOrdersPerStall: updateData.maxOrdersPerStall,
        allowAdvanceOrders: updateData.allowAdvanceOrders,
      },
    }

    const [settings] = await CourtSettings.upsert(settingsUpdateData)

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
      data: { settings },
    })
  } catch (error) {
    console.error("Update court settings error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
