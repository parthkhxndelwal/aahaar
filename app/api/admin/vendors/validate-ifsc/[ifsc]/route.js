import { NextResponse } from "next/server"

// Validate IFSC code by calling Razorpay's API
export async function GET(request, { params }) {
  try {
    const { ifsc } = await params

    if (!ifsc || ifsc.length !== 11) {
      return NextResponse.json({ success: false, message: "Invalid IFSC code" }, { status: 400 })
    }

    const response = await fetch(`https://ifsc.razorpay.com/${ifsc}`)
    
    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ success: false, message: "Invalid IFSC code" }, { status: 404 })
      }
      throw new Error(`API returned ${response.status}`)
    }

    const bankData = await response.json()

    return NextResponse.json({
      success: true,
      data: bankData,
    })
  } catch (error) {
    console.error("IFSC validation error:", error)
    return NextResponse.json({ success: false, message: "Failed to validate IFSC code" }, { status: 500 })
  }
}
