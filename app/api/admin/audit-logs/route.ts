import { NextRequest, NextResponse } from "next/server"
import { AuditLog, User, Court } from "@/models"
import { authenticateRequest, requireAdmin } from "@/lib/auth-helper"
import { Op } from "sequelize"

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
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const offset = (page - 1) * limit
    const courtId = searchParams.get("courtId") || user.courtId

    if (!courtId) {
      return NextResponse.json({
        success: false,
        message: "Court ID is required"
      }, { status: 400 })
    }

    // Build where condition - admin can only see logs for courts they manage
    const whereCondition: Record<string, unknown> = { courtId }

    // Return paginated list of logs
    const { count, rows: logs } = await AuditLog.findAndCountAll({
      where: whereCondition,
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
      limit,
      offset
    })

    const totalPages = Math.ceil(count / limit)

    return NextResponse.json({
      success: true,
      data: {
        auditLogs: logs,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: count,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    })

  } catch (error) {
    console.error("Audit logs list API error:", error)
    return NextResponse.json({
      success: false,
      message: "Internal server error"
    }, { status: 500 })
  }
}
