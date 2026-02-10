import { NextResponse } from "next/server"
import db from "@/models"
import { createRouteAccount } from "@/utils/razorpay"

// Create Razorpay account for vendor
export async function POST(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()

    const vendor = await db.Vendor.findByPk(id)
    if (!vendor) {
      return NextResponse.json({ success: false, message: "Vendor not found" }, { status: 404 })
    }

    if (vendor.razorpayAccountId) {
      console.log(`[RAZORPAY ACCOUNT] Vendor ${id} already has Razorpay account: ${vendor.razorpayAccountId}`)
      
      // Try to fetch the existing account details from Razorpay
      try {
        const accountResponse = await fetch(`https://api.razorpay.com/v2/accounts/${vendor.razorpayAccountId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64')}`,
          },
        })

        if (accountResponse.ok) {
          const accountData = await accountResponse.json()
          console.log(`[RAZORPAY ACCOUNT] Successfully fetched existing account details for vendor ${id}`)
          
          // Update vendor metadata to ensure account is linked
          await vendor.update({
            metadata: {
              ...vendor.metadata,
              businessType: body.businessType || vendor.metadata?.businessType,
              panDocFileId: body.panDocFileId || vendor.metadata?.panDocFileId,
              onboardingCompleted: true,
              onboardingStep: 'completed',
              razorpayAccountData: accountData,
              accountLinkedAt: new Date().toISOString()
            },
            status: 'active',
            onboardingStatus: 'completed',
            onboardingStep: 'completed',
            onboardingCompletedAt: new Date()
          })

          return NextResponse.json({
            success: true,
            message: "Existing Razorpay account linked successfully",
            data: {
              account: accountData,
              vendor: await vendor.reload(),
              linked: true
            },
          })
        } else {
          console.log(`[RAZORPAY ACCOUNT] Could not fetch existing account details, but account ID exists: ${vendor.razorpayAccountId}`)
          return NextResponse.json({
            success: true,
            message: "Razorpay account already linked",
            data: {
              account: { id: vendor.razorpayAccountId },
              vendor: await vendor.reload(),
              linked: true
            },
          })
        }
      } catch (fetchError) {
        console.log(`[RAZORPAY ACCOUNT] Error fetching existing account, but linking anyway: ${fetchError.message}`)
        return NextResponse.json({
          success: true,
          message: "Razorpay account already linked",
          data: {
            account: { id: vendor.razorpayAccountId },
            vendor: await vendor.reload(),
            linked: true
          },
        })
      }
    }

    const { 
      businessType, 
      panDocFileId,
      stallAddress 
    } = body

    console.log(`[RAZORPAY ACCOUNT] Creating account for vendor ${id}:`, {
      vendorId: id,
      stallName: vendor.stallName,
      contactEmail: vendor.contactEmail,
      contactPhone: vendor.contactPhone,
      panNumber: vendor.panNumber,
      gstin: vendor.gstin,
      businessType,
      existingRazorpayAccountId: vendor.razorpayAccountId
    })

    // Prepare data for Razorpay account creation
    const vendorData = {
      email: vendor.contactEmail,
      phone: vendor.contactPhone,
      vendorName: vendor.vendorName,
      stallName: vendor.stallName,
      courtId: vendor.courtId,
      vendorId: vendor.id,
      panNumber: vendor.panNumber,
      gstin: vendor.gstin,
      accountHolderName: vendor.bankAccountHolderName,
      accountNumber: vendor.bankAccountNumber,
      ifscCode: vendor.bankIfscCode,
      businessType,
      panDocFileId,
      stallAddress: stallAddress || vendor.stallLocation
    }

    // Create Razorpay route account
    console.log(`[RAZORPAY ACCOUNT] Calling createRouteAccount with data:`, vendorData)
    const result = await createRouteAccount(vendorData)
    
    console.log(`[RAZORPAY ACCOUNT] createRouteAccount result:`, {
      success: result.success,
      error: result.error,
      accountId: result.account?.id,
      accountStatus: result.account?.status,
      fullResult: result
    })

    if (!result.success) {
      console.log(`[RAZORPAY ACCOUNT] Account creation failed for vendor ${id}:`, result.error)
      return NextResponse.json({
        success: false,
        message: result.error || "Failed to create Razorpay account",
      }, { status: 400 })
    }

    // Update vendor with Razorpay account details
    console.log(`[RAZORPAY ACCOUNT] Updating vendor ${id} with Razorpay account ID: ${result.account.id}`)
    await vendor.update({
      razorpayAccountId: result.account.id,
      metadata: {
        ...vendor.metadata,
        businessType,
        panDocFileId,
        onboardingCompleted: true,
        onboardingStep: 'completed',
        razorpayAccountData: result.account
      },
      status: 'active', // Mark as active once Razorpay account is created
      onboardingStatus: 'completed',
      onboardingStep: 'completed',
      onboardingCompletedAt: new Date()
    })

    console.log(`[RAZORPAY ACCOUNT] Successfully created and updated vendor ${id} with Razorpay account`)
    return NextResponse.json({
      success: true,
      message: "Razorpay account created successfully",
      data: {
        account: result.account,
        vendor: await vendor.reload()
      },
    })
  } catch (error) {
    console.error(`[RAZORPAY ACCOUNT] Error creating Razorpay account for vendor ${id}:`, {
      error: error.message,
      stack: error.stack,
      vendorId: id
    })
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

// Get Razorpay account details
export async function GET(request, { params }) {
  try {
    const { id } = await params

    const vendor = await db.Vendor.findByPk(id)
    if (!vendor) {
      return NextResponse.json({ success: false, message: "Vendor not found" }, { status: 404 })
    }

    if (!vendor.razorpayAccountId) {
      return NextResponse.json({ success: false, message: "Vendor doesn't have a Razorpay account" }, { status: 404 })
    }

    try {
      const response = await fetch(`https://api.razorpay.com/v2/accounts/${vendor.razorpayAccountId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Razorpay API returned ${response.status}`)
      }

      const accountData = await response.json()

      return NextResponse.json({
        success: true,
        data: accountData,
      })
    } catch (error) {
      console.error("Razorpay API error:", error)
      return NextResponse.json({ success: false, message: "Failed to fetch Razorpay account details" }, { status: 500 })
    }
  } catch (error) {
    console.error("Get Razorpay account error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
