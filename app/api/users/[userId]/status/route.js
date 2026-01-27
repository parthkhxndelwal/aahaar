import { NextResponse } from "next/server"
import { User } from "@/models"
import { authenticateTokenNextJS } from "@/middleware/auth"

export async function PUT(request, { params }) {
  try {
    const authResult = await authenticateTokenNextJS(request)
    if (authResult.error) {
      return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status })
    }

    const { user } = authResult
    const { userId } = await params
    const { status } = await request.json()

    // Only admin can update user status
    if (user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 })
    }

    // Validate status value
    const validStatuses = ["active", "inactive", "pending", "suspended"]
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status. Must be one of: " + validStatuses.join(", ") },
        { status: 400 }
      )
    }

    const targetUser = await User.findOne({
      where: { id: userId, courtId: user.courtId },
    })

    if (!targetUser) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    await targetUser.update({ status })

    return NextResponse.json({
      success: true,
      message: "User status updated successfully",
      data: { 
        user: {
          id: targetUser.id,
          email: targetUser.email,
          fullName: targetUser.fullName,
          status: targetUser.status,
          role: targetUser.role,
        }
      },
    })
  } catch (error) {
    console.error("Update user status error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
