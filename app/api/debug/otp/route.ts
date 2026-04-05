import { NextResponse } from "next/server"
import { OTP } from "@/models"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const courtId = searchParams.get("courtId")
    const value = searchParams.get("value")
    const limit = parseInt(searchParams.get("limit") || "10")

    const where: Record<string, string> = {}
    if (courtId) where.courtId = courtId
    if (value) where.value = value

    const otps = await OTP.findAll({
      where,
      order: [["createdAt", "DESC"]],
      limit,
      attributes: ["id", "type", "value", "otp", "courtId", "userId", "verified", "expiresAt", "createdAt"]
    })

    return NextResponse.json({
      success: true,
      data: {
        otps: otps.map((otp: any) => ({
          id: otp.id,
          type: otp.type,
          value: otp.value,
          otp: otp.otp,
          courtId: otp.courtId,
          userId: otp.userId,
          verified: otp.verified,
          expiresAt: otp.expiresAt,
          createdAt: otp.createdAt
        }))
      }
    })
  } catch (error) {
    console.error("Error fetching OTPs:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch OTPs" }, { status: 500 })
  }
}
