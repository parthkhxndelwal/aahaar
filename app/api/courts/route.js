import { NextResponse } from "next/server"
import { Court } from "@/models"
import { Op } from "sequelize"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    
    let whereCondition = { status: "active" }
    
    if (search) {
      whereCondition = {
        ...whereCondition,
        [Op.or]: [
          { instituteName: { [Op.iLike]: `%${search}%` } },
          { courtId: { [Op.iLike]: `%${search}%` } },
          { address: { [Op.iLike]: `%${search}%` } }
        ]
      }
    }

    const courts = await Court.findAll({
      where: whereCondition,
      attributes: ['courtId', 'instituteName', 'address', 'logoUrl'],
      order: [['instituteName', 'ASC']],
      limit: search ? 20 : 100 // Limit results when searching
    })

    return NextResponse.json({
      success: true,
      data: { courts },
    })
  } catch (error) {
    console.error("Get courts error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
