import { NextRequest, NextResponse } from "next/server"
import { AuditLog, User, Court } from "@/models"
import { authenticateRequest, requireAdmin } from "@/lib/auth-helper"

export async function GET(request: NextRequest) {
  try {
    // Authenticate using NextAuth session or Bearer token
    const authResult = await authenticateRequest(request)
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      )
    }

    const user = authResult.user

    // Require admin role
    const adminError = requireAdmin(user)
    if (adminError) {
      return NextResponse.json(
        { success: false, message: adminError.error },
        { status: adminError.status }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "5")
    const courtId = searchParams.get("courtId") || user.courtId

    if (!courtId) {
      return NextResponse.json({
        success: false,
        message: "Court ID is required"
      }, { status: 400 })
    }

    // Get recent audit logs for preview
    const logs = await AuditLog.findAll({
      where: { courtId },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "fullName", "email", "role"],
          required: false
        },
        {
          model: Court,
          as: "court",
          attributes: ["courtId", "instituteName"],
          required: false
        }
      ],
      order: [["createdAt", "DESC"]],
      limit
    })

    return NextResponse.json({
      success: true,
      data: { auditLogs: logs }
    })

  } catch (error) {
    console.error("Audit logs preview API error:", error)
    return NextResponse.json({
      success: false,
      message: "Internal server error"
    }, { status: 500 })
  }
}
