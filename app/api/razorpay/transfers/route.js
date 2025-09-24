import { NextResponse } from "next/server"
import Razorpay from "razorpay"

export async function POST(request) {
  try {
    const { razorpay_payment_id, razorpay_order_id, transfers } = await request.json()

    if (!razorpay_payment_id || !transfers || !Array.isArray(transfers)) {
      return NextResponse.json(
        { success: false, message: "Missing required parameters" },
        { status: 400 }
      )
    }

    // Initialize Razorpay
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('Razorpay keys missing for transfers')
      return NextResponse.json(
        { success: false, message: 'Payment gateway not configured' },
        { status: 500 }
      )
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })

    console.log('Creating transfers for payment:', razorpay_payment_id)
    console.log('Transfers data:', transfers)

    // Create transfers using Razorpay SDK
    try {
      const transferResult = await razorpay.payments.transfer(razorpay_payment_id, {
        transfers: transfers
      })

      console.log('Transfer result:', transferResult)

      return NextResponse.json({
        success: true,
        message: "Transfers created successfully",
        transfer: transferResult
      })
    } catch (transferError) {
      console.error('Transfer creation failed:', transferError)
      return NextResponse.json(
        { success: false, message: 'Failed to create transfers', error: transferError.message },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error("Error in transfers API:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}