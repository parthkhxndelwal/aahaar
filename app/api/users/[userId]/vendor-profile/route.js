import { NextResponse } from "next/server"
import { User, Vendor } from "@/models"
import { authenticateToken } from "@/middleware/auth"

export async function GET(request, { params }) {
  try {
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) return authResult

    const { user } = authResult
    const { userId } = await params

    // Check if the authenticated user is requesting their own profile or is an admin
    if (user.id !== userId && user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 })
    }

    // Find the user with vendor profile
    const targetUser = await User.findOne({
      where: { id: userId },
      include: [
        {
          model: Vendor,
          as: "vendorProfile",
          attributes: ["id", "stallName", "stallLocation", "isOnline"],
        },
      ],
    })

    if (!targetUser) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    if (targetUser.role !== "vendor") {
      return NextResponse.json({ success: false, message: "User is not a vendor" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: {
        vendorProfile: targetUser.vendorProfile,
      },
    })
  } catch (error) {
    console.error("Get vendor profile error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
