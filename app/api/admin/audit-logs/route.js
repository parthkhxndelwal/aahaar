import { NextResponse } from "next/server"
import { AuditLog, User, Court } from "@/models"
import { authenticateToken } from "@/middleware/auth"

export async function GET(request) {
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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page")) || 1
    const limit = parseInt(searchParams.get("limit")) || 10
    const offset = (page - 1) * limit

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

  } catch (error) {
    console.error("Audit logs list API error:", error)
    return NextResponse.json({
      success: false,
      message: "Internal server error"
    }, { status: 500 })
  }
}
