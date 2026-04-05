import { NextRequest, NextResponse } from "next/server"
import { AuditLog, User, Court } from "@/models"
import { authenticateRequest, requireAdmin } from "@/lib/auth-helper"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ logId: string }> }
) {
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

    const { logId } = await params
    const { searchParams } = new URL(request.url)
    const courtId = searchParams.get("courtId") || user.courtId

    if (!courtId) {
      return NextResponse.json({
        success: false,
        message: "Court ID is required"
      }, { status: 400 })
    }

    // Return specific log by ID
    const log = await AuditLog.findOne({
      where: {
        id: logId,
        courtId // Ensure log belongs to user's court
      },
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
      ]
    })

    if (!log) {
      return NextResponse.json({
        success: false,
        message: "Audit log not found"
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: { auditLog: log }
    })

  } catch (error) {
    console.error("Audit log detail API error:", error)
    return NextResponse.json({
      success: false,
      message: "Internal server error"
    }, { status: 500 })
  }
}
