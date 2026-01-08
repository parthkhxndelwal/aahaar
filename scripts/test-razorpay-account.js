const { createRouteAccount } = require("../utils/razorpay")

// Test function for Razorpay account creation
async function testRazorpayAccountCreation() {
  try {
    console.log("🔄 Testing Razorpay Route Account creation...")

    const testVendorData = {
      email: "test.vendor@example.com",
      phone: "9876543210",
      vendorName: "Test Vendor",
      stallName: "Test Food Stall",
      courtId: "democourt",
      vendorId: "test-vendor-id-123"
    }

    const result = await createRouteAccount(testVendorData)

    if (result.success) {
      console.log("✅ Razorpay account created successfully!")
      console.log("Account ID:", result.account.id)
      console.log("Account Status:", result.account.status)
      console.log("Reference ID:", result.account.reference_id)
    } else {
      console.log("❌ Failed to create Razorpay account:")
      console.log("Error:", result.error)
      if (result.errorDetails) {
        console.log("Error Details:", JSON.stringify(result.errorDetails, null, 2))
      }
    }
  } catch (error) {
    console.error("❌ Test failed with error:", error)
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testRazorpayAccountCreation()
    .then(() => {
      console.log("Test completed")
      process.exit(0)
    })
    .catch((error) => {
      console.error("Test failed:", error)
      process.exit(1)
    })
}

module.exports = { testRazorpayAccountCreation }
