import { NextResponse } from "next/server"
import { User, Order } from "@/models"
import { authenticateToken } from "@/middleware/auth"
import { Op, fn, col, literal } from "sequelize"

export async function GET(request, { params }) {
  try {
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) return authResult

    const { user } = authResult
    const { courtId } = await params
    const { searchParams } = new URL(request.url)
    const role = searchParams.get("role")
    const status = searchParams.get("status")
    const search = searchParams.get("search")
    const page = Number.parseInt(searchParams.get("page")) || 1
    const limit = Number.parseInt(searchParams.get("limit")) || 20
    const offset = (page - 1) * limit

    if (user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 })
    }

    const whereClause = {
      [Op.or]: [
        { courtId },
        literal(`JSON_CONTAINS(managedCourtIds, '"${courtId}"')`)
      ]
    }
    if (role) whereClause.role = role
    if (status) whereClause.status = status
    if (search) {
      whereClause[Op.and] = whereClause[Op.and] || []
      whereClause[Op.and].push({
        [Op.or]: [
          { fullName: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
          { phone: { [Op.like]: `%${search}%` } },
        ]
      })
    }

    const users = await User.findAndCountAll({
      where: whereClause,
      attributes: { 
        exclude: ["password"],
        include: [
          [
            literal('(SELECT COUNT(*) FROM orders WHERE orders.userId = User.id AND orders.paymentStatus = \'paid\')'),
            'totalOrders'
          ],
          [
            literal('(SELECT COALESCE(SUM(orders.totalAmount), 0) FROM orders WHERE orders.userId = User.id AND orders.paymentStatus = \'paid\')'),
            'totalSpent'
          ]
        ]
      },
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    })

    return NextResponse.json({
      success: true,
      data: {
        users: users.rows,
        pagination: {
          total: users.count,
          page,
          limit,
          totalPages: Math.ceil(users.count / limit),
        },
      },
    })
  } catch (error) {
    console.error("Get users error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
