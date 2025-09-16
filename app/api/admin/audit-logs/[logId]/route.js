import { NextResponse } from "next/server"
import { AuditLog, User, Court } from "@/models"
import { authenticateToken } from "@/middleware/auth"
import { Op } from "sequelize"

export async function GET(request, { params }) {
  try {
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) return authResult

    const { user, courtId } = authResult

    // Check if user is admin
    if (user.role !== "admin") {
      return NextResponse.json({
        success: false,
        message: "Admin access required"
      }, { status: 403 })
    }

    const { logId } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page")) || 1
    const limit = parseInt(searchParams.get("limit")) || 10
    const offset = (page - 1) * limit

    // Handle different logId scenarios
    if (logId === "preview") {
      // Return last 5 logs for preview
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
        limit: 5
      })

      return NextResponse.json({
        success: true,
        data: {
          logs,
          total: logs.length,
          isPreview: true
        }
      })
    } else if (logId && logId !== "list") {
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
        data: { log }
      })
    } else {
      // Return paginated list of logs
      const { count, rows: logs } = await AuditLog.findAndCountAll({
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
        limit,
        offset
      })

      const totalPages = Math.ceil(count / limit)

      return NextResponse.json({
        success: true,
        data: {
          logs,
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
    }

  } catch (error) {
    console.error("Audit logs API error:", error)
    return NextResponse.json({
      success: false,
      message: "Internal server error"
    }, { status: 500 })
  }
}

// Optional: POST endpoint for creating audit logs (if needed)
export async function POST(request, { params }) {
  try {
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) return authResult

    const { user, courtId } = authResult

    // Check if user is admin
    if (user.role !== "admin") {
      return NextResponse.json({
        success: false,
        message: "Admin access required"
      }, { status: 403 })
    }

    const body = await request.json()
    const { action, entityType, entityId, oldValues, newValues, metadata } = body

    // Validate required fields
    if (!action || !entityType) {
      return NextResponse.json({
        success: false,
        message: "Action and entityType are required"
      }, { status: 400 })
    }

    // Create audit log
    const auditLog = await AuditLog.create({
      courtId,
      userId: user.id,
      action,
      entityType,
      entityId,
      oldValues,
      newValues,
      metadata: metadata || {},
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown"
    })

    return NextResponse.json({
      success: true,
      data: { auditLog },
      message: "Audit log created successfully"
    }, { status: 201 })

  } catch (error) {
    console.error("Create audit log error:", error)
    return NextResponse.json({
      success: false,
      message: "Internal server error"
    }, { status: 500 })
  }
}
