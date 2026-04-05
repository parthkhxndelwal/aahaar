import { NextResponse } from "next/server"

export async function POST(request) {
  try {
    const body = await request.json()
    const { pin } = body

    if (!pin) {
      return NextResponse.json(
        { success: false, message: "PIN is required" },
        { status: 400 }
      )
    }

    const expectedPin = process.env.ADMIN_PAYMENT_PIN
    if (!expectedPin) {
      return NextResponse.json(
        { success: false, message: "Server configuration error" },
        { status: 500 }
      )
    }

    if (pin === expectedPin) {
      return NextResponse.json({ success: true, message: "PIN verified" })
    }

    return NextResponse.json(
      { success: false, message: "Invalid PIN" },
      { status: 403 }
    )
  } catch (error) {
    console.error("PIN verification error:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}
