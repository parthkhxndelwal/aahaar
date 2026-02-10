import { NextResponse } from "next/server"
import { Vendor, User } from "@/models"
import { authenticateToken } from "@/middleware/auth"

export async function GET(request, { params }) {
  try {
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) return authResult

    const { user } = authResult
    const { vendorId } = params

    const vendor = await Vendor.findByPk(vendorId, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "email", "fullName", "phone"],
        },
      ],
    })

    if (!vendor) {
      return NextResponse.json({ success: false, message: "Vendor not found" }, { status: 404 })
    }

    const isOwner = vendor.userId === user.id
    const isAdmin = user.role === "admin"

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      data: { vendor },
    })
  } catch (error) {
    console.error("Get vendor profile error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request, { params }) {
  try {
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) return authResult

    const { user } = authResult
    const { vendorId } = params
    const updateData = await request.json()

    const vendor = await Vendor.findByPk(vendorId)
    if (!vendor) {
      return NextResponse.json({ success: false, message: "Vendor not found" }, { status: 404 })
    }

    const isOwner = vendor.userId === user.id
    const isAdmin = user.role === "admin"

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 })
    }

    // Update vendor profile
    await vendor.update(updateData)

    return NextResponse.json({
      success: true,
      message: "Vendor profile updated successfully",
      data: { vendor },
    })
  } catch (error) {
    console.error("Update vendor profile error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
