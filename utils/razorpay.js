const Razorpay = require("razorpay")

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

const createOrder = async (amount, currency = "INR", receipt, notes = {}) => {
  try {
    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      receipt,
      notes,
    }

    const order = await razorpay.orders.create(options)
    return { success: true, order }
  } catch (error) {
    console.error("Razorpay create order error:", error)
    return { success: false, error: error.message }
  }
}

const verifyPayment = (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
  try {
    const crypto = require("crypto")
    const body = razorpayOrderId + "|" + razorpayPaymentId
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex")

    return expectedSignature === razorpaySignature
  } catch (error) {
    console.error("Payment verification error:", error)
    return false
  }
}

const createFundAccount = async (contactId, accountDetails) => {
  try {
    const fundAccount = await razorpay.fundAccount.create({
      contact_id: contactId,
      account_type: "bank_account",
      bank_account: {
        name: accountDetails.accountHolderName,
        ifsc: accountDetails.ifscCode,
        account_number: accountDetails.accountNumber,
      },
    })

    return { success: true, fundAccount }
  } catch (error) {
    console.error("Create fund account error:", error)
    return { success: false, error: error.message }
  }
}

const createContact = async (name, email, contact, type = "vendor") => {
  try {
    const contactData = await razorpay.contacts.create({
      name,
      email,
      contact,
      type,
    })

    return { success: true, contact: contactData }
  } catch (error) {
    console.error("Create contact error:", error)
    return { success: false, error: error.message }
  }
}

const createPayout = async (fundAccountId, amount, currency = "INR", mode = "IMPS", purpose = "payout") => {
  try {
    const payout = await razorpay.payouts.create({
      account_number: process.env.RAZORPAY_ACCOUNT_NUMBER,
      fund_account_id: fundAccountId,
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      mode,
      purpose,
    })

    return { success: true, payout }
  } catch (error) {
    console.error("Create payout error:", error)
    return { success: false, error: error.message }
  }
}

const createRouteAccount = async (vendorData) => {
  try {
    const { 
      email, 
      phone, 
      vendorName, 
      stallName, 
      courtId,
      vendorId,
      panNumber,
      gstin
    } = vendorData

    // Create a shorter reference ID (max 20 chars)
    // Use timestamp + short hash of vendor ID
    const timestamp = Date.now().toString().slice(-8) // Last 8 digits of timestamp
    const vendorHash = vendorId.slice(0, 8) // First 8 chars of vendor UUID
    const shortReferenceId = `v${timestamp}${vendorHash}`.slice(0, 20) // Ensure max 20 chars

    const accountData = {
      email: email.toLowerCase(),
      phone: phone,
      type: "route",
      reference_id: shortReferenceId,
      legal_business_name: stallName,
      business_type: "proprietorship", // Default business type for food stalls
      contact_name: vendorName,
      profile: {
        category: "food",
        subcategory: "restaurant",
        addresses: {
          registered: {
            street1: "Food Court",
            street2: `Court ID: ${courtId}`,
            city: "Bangalore", // You might want to make this dynamic
            state: "KARNATAKA",
            postal_code: "560001", // You might want to make this dynamic
            country: "IN"
          }
        }
      },
      legal_info: {
        pan: panNumber
      }
    }

    // Add GSTIN if provided
    if (gstin) {
      accountData.legal_info.gst = gstin
    }

    console.log(`Creating Razorpay account with reference_id: ${shortReferenceId} (length: ${shortReferenceId.length})`)
    console.log(`PAN: ${panNumber}${gstin ? `, GSTIN: ${gstin}` : ''}`)

    // Make direct API call to Razorpay since the SDK might not support Route Accounts
    const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64')
    
    const response = await fetch('https://api.razorpay.com/v2/accounts', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(accountData)
    })

    const responseData = await response.json()

    if (!response.ok) {
      return { 
        success: false, 
        error: responseData.error?.description || 'Failed to create Razorpay account',
        errorCode: responseData.error?.code,
        errorDetails: responseData.error
      }
    }

    return { success: true, account: responseData }
  } catch (error) {
    console.error("Create route account error:", error)
    return { success: false, error: error.message }
  }
}

const updateRouteAccount = async (accountId, updateData) => {
  try {
    const { 
      vendorName, 
      stallName, 
      courtId,
      panNumber,
      gstin
    } = updateData

    const accountUpdateData = {
      legal_business_name: stallName,
      profile: {
        addresses: {
          operation: {
            street1: "Food Court",
            street2: `Court ID: ${courtId}`,
            city: "Bangalore", // You might want to make this dynamic
            state: "KARNATAKA",
            postal_code: "560001", // You might want to make this dynamic
            country: "IN"
          }
        }
      },
      legal_info: {
        pan: panNumber
      }
    }

    // Add GSTIN if provided
    if (gstin) {
      accountUpdateData.legal_info.gst = gstin
    }

    console.log(`Updating Razorpay account ${accountId} with data:`, accountUpdateData)

    // Make direct API call to Razorpay
    const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64')
    
    const response = await fetch(`https://api.razorpay.com/v2/accounts/${accountId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(accountUpdateData)
    })

    const responseData = await response.json()

    if (!response.ok) {
      return { 
        success: false, 
        error: responseData.error?.description || 'Failed to update Razorpay account',
        errorCode: responseData.error?.code,
        errorDetails: responseData.error
      }
    }

    return { success: true, account: responseData }
  } catch (error) {
    console.error("Update route account error:", error)
    return { success: false, error: error.message }
  }
}

const fetchRouteAccount = async (accountId) => {
  try {
    console.log(`Fetching Razorpay account details for: ${accountId}`)

    // Make direct API call to Razorpay
    const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64')
    
    const response = await fetch(`https://api.razorpay.com/v2/accounts/${accountId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    })

    const responseData = await response.json()

    if (!response.ok) {
      return { 
        success: false, 
        error: responseData.error?.description || 'Failed to fetch Razorpay account',
        errorCode: responseData.error?.code,
        errorDetails: responseData.error
      }
    }

    return { success: true, account: responseData }
  } catch (error) {
    console.error("Fetch route account error:", error)
    return { success: false, error: error.message }
  }
}

module.exports = {
  razorpay,
  createOrder,
  verifyPayment,
  createFundAccount,
  createContact,
  createPayout,
  createRouteAccount,
  updateRouteAccount,
  fetchRouteAccount,
}
