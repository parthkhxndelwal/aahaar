/**
 * Razorpay utility functions for vendor onboarding
 */

/**
 * Create a Razorpay Route Account for a vendor
 * @param {Object} vendorData - Vendor information for account creation
 * @returns {Promise<Object>} - Account creation result
 */
export async function createRouteAccount(vendorData) {
  try {
    console.log('[RAZORPAY UTIL] Starting account creation with vendor data:', {
      vendorId: vendorData.vendorId,
      email: vendorData.email,
      phone: vendorData.phone,
      stallName: vendorData.stallName,
      panNumber: vendorData.panNumber,
      gstin: vendorData.gstin,
      businessType: vendorData.businessType
    })

    const {
      email,
      phone,
      vendorName,
      stallName,
      courtId,
      vendorId,
      panNumber,
      gstin,
      accountHolderName,
      accountNumber,
      ifscCode,
      businessType,
      panDocFileId,
      stallAddress
    } = vendorData

    // Create a short reference ID (max 20 characters)
    const shortVendorId = vendorId.replace(/-/g, '').substring(0, 8) // Remove hyphens and take first 8 chars
    const timestamp = Date.now().toString().slice(-6) // Last 6 digits of timestamp
    const shortReferenceId = `v${shortVendorId}${timestamp}` // Format: v12345678123456 (max 15 chars)
    
    console.log(`[RAZORPAY UTIL] Generated reference_id: ${shortReferenceId} (${shortReferenceId.length} chars)`)

    // Ensure field length limits for Razorpay
    const truncateString = (str, maxLength) => {
      if (!str) return str
      return str.length > maxLength ? str.substring(0, maxLength) : str
    }

    // Prepare the account creation payload
    const accountPayload = {
      email,
      phone,
      type: "route",
      reference_id: shortReferenceId,
      legal_business_name: truncateString(stallName, 50), // Razorpay limit for business name
      business_type: businessType || "partnership",
      contact_name: truncateString(vendorName, 50), // Razorpay limit for contact name
      profile: {
        category: "food",
        subcategory: "restaurant",
        addresses: {
          registered: {
            street1: truncateString(stallAddress || "Food Court Stall", 100),
            street2: truncateString(`Court ID: ${courtId}`, 100),
            city: "Mumbai",
            state: "Maharashtra",
            postal_code: "400001",
            country: "IN"
          }
        }
      },
      legal_info: {
        pan: panNumber,
        gst: gstin || undefined
      },
      brand: {
        color: "000000"
      },
      notes: {
        vendor_id: truncateString(vendorId, 50),
        court_id: truncateString(courtId, 50),
        created_via: "admin_panel"
      }
    }

    console.log('[RAZORPAY UTIL] Account payload prepared:', JSON.stringify(accountPayload, null, 2))
    
    // Log field lengths for debugging
    console.log('[RAZORPAY UTIL] Field lengths:', {
      reference_id: accountPayload.reference_id.length,
      legal_business_name: accountPayload.legal_business_name.length,
      contact_name: accountPayload.contact_name.length,
      street1: accountPayload.profile.addresses.registered.street1.length,
      street2: accountPayload.profile.addresses.registered.street2.length,
      vendor_id: accountPayload.notes.vendor_id.length,
      court_id: accountPayload.notes.court_id.length
    })

    // Make the API call to Razorpay
    console.log('[RAZORPAY UTIL] Making API call to Razorpay accounts endpoint')
    const response = await fetch("https://api.razorpay.com/v2/accounts", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64")}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(accountPayload)
    })

    const responseData = await response.json()
    
    console.log('[RAZORPAY UTIL] Razorpay API response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      responseData: JSON.stringify(responseData, null, 2)
    })

    if (!response.ok) {
      console.error("[RAZORPAY UTIL] Razorpay account creation failed:", {
        status: response.status,
        statusText: response.statusText,
        error: responseData
      })
      return {
        success: false,
        error: responseData.error?.description || responseData.message || "Failed to create Razorpay account"
      }
    }

    // If bank account details are provided, add them to the account
    if (accountNumber && ifscCode && accountHolderName) {
      console.log('[RAZORPAY UTIL] Adding bank account details to Razorpay account:', {
        accountId: responseData.id,
        accountNumber: `****${accountNumber.slice(-4)}`,
        ifscCode,
        beneficiaryName: accountHolderName
      })
      
      try {
        const bankAccountPayload = {
          account_number: accountNumber,
          ifsc_code: ifscCode,
          beneficiary_name: accountHolderName
        }

        const bankResponse = await fetch(`https://api.razorpay.com/v2/accounts/${responseData.id}/bank_account`, {
          method: "POST",
          headers: {
            "Authorization": `Basic ${Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64")}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(bankAccountPayload)
        })

        const bankData = await bankResponse.json()
        
        console.log('[RAZORPAY UTIL] Bank account addition response:', {
          status: bankResponse.status,
          ok: bankResponse.ok,
          bankData: JSON.stringify(bankData, null, 2)
        })
        
        if (bankResponse.ok) {
          responseData.bank_account = bankData
          console.log('[RAZORPAY UTIL] Bank account successfully added to Razorpay account')
        } else {
          console.warn("[RAZORPAY UTIL] Bank account addition failed:", bankData)
        }
      } catch (bankError) {
        console.warn("[RAZORPAY UTIL] Bank account addition error:", bankError)
      }
    } else {
      console.log('[RAZORPAY UTIL] No bank account details provided, skipping bank account addition')
    }

    console.log('[RAZORPAY UTIL] Account creation completed successfully:', {
      accountId: responseData.id,
      status: responseData.status,
      type: responseData.type
    })

    return {
      success: true,
      account: responseData
    }

  } catch (error) {
    console.error("[RAZORPAY UTIL] Create Razorpay account error:", {
      error: error.message,
      stack: error.stack,
      vendorId: vendorData?.vendorId
    })
    return {
      success: false,
      error: error.message || "Internal server error"
    }
  }
}

/**
 * Update a Razorpay Route Account
 * @param {string} accountId - Razorpay account ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} - Update result
 */
export async function updateRouteAccount(accountId, updateData) {
  try {
    const response = await fetch(`https://api.razorpay.com/v2/accounts/${accountId}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Basic ${Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64")}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(updateData)
    })

    const responseData = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: responseData.error?.description || "Failed to update Razorpay account"
      }
    }

    return {
      success: true,
      account: responseData
    }

  } catch (error) {
    console.error("Update Razorpay account error:", error)
    return {
      success: false,
      error: error.message || "Internal server error"
    }
  }
}

/**
 * Get Razorpay account details
 * @param {string} accountId - Razorpay account ID
 * @returns {Promise<Object>} - Account details
 */
export async function getRouteAccount(accountId) {
  try {
    const response = await fetch(`https://api.razorpay.com/v2/accounts/${accountId}`, {
      method: "GET",
      headers: {
        "Authorization": `Basic ${Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64")}`,
        "Content-Type": "application/json"
      }
    })

    const responseData = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: responseData.error?.description || "Failed to fetch Razorpay account"
      }
    }

    return {
      success: true,
      account: responseData
    }

  } catch (error) {
    console.error("Get Razorpay account error:", error)
    return {
      success: false,
      error: error.message || "Internal server error"
    }
  }
}
