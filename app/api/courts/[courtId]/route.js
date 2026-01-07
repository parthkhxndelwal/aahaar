import { NextResponse } from "next/server"
import { Court, CourtSettings } from "@/models"
import { authenticateToken } from "@/middleware/auth"

export async function GET(request, { params }) {
  try {
    const { courtId } = await params

    const court = await Court.findOne({
      where: { courtId, status: "active" },
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

    return NextResponse.json({
      success: true,
      data: { court },
    })
  } catch (error) {
    console.error("Get court error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request, { params }) {
  try {
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) return authResult

    const { courtId } = await params
    const updateData = await request.json()

    // Only admin can update court details
    if (request.user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 })
    }

    const court = await Court.findOne({ where: { courtId } })
    if (!court) {
      return NextResponse.json({ success: false, message: "Court not found" }, { status: 404 })
    }

    await court.update(updateData)

    return NextResponse.json({
      success: true,
      message: "Court updated successfully",
      data: { court },
    })
  } catch (error) {
    console.error("Update court error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
