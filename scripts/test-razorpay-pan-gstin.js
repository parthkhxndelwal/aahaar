const { createRouteAccount } = require('../utils/razorpay')

async function testRazorpayWithPanGstin() {
  console.log('🧪 Testing Razorpay Route Account creation with PAN and GSTIN...')
  
  const testVendorData = {
    email: 'test.vendor@example.com',
    phone: '9876543210',
    vendorName: 'Test Vendor',
    stallName: 'Test Food Stall',
    courtId: 'democourt',
    vendorId: 'test-12345678-1234-1234-1234-123456789abc',
    panNumber: 'ABCDE1234F',
    gstin: '29ABCDE1234F1Z5' // Optional test GSTIN
  }
  
  console.log('Test data:', {
    ...testVendorData,
    vendorId: testVendorData.vendorId.slice(0, 20) + '...' // Show truncated for clarity
  })
  
  try {
    const result = await createRouteAccount(testVendorData)
    
    if (result.success) {
      console.log('✅ Razorpay account created successfully!')
      console.log('Account details:', {
        id: result.account.id,
        status: result.account.status,
        reference_id: result.account.reference_id,
        legal_business_name: result.account.legal_business_name,
        legal_info: result.account.legal_info
      })
    } else {
      console.log('❌ Failed to create Razorpay account')
      console.log('Error:', result.error)
      console.log('Error code:', result.errorCode)
      console.log('Error details:', result.errorDetails)
    }
  } catch (error) {
    console.error('🔥 Exception occurred:', error.message)
  }
}

async function testWithoutGstin() {
  console.log('\n🧪 Testing without GSTIN (optional field)...')
  
  const testVendorData = {
    email: 'test.vendor2@example.com',
    phone: '9876543211',
    vendorName: 'Test Vendor 2',
    stallName: 'Test Food Stall 2',
    courtId: 'democourt',
    vendorId: 'test-87654321-1234-1234-1234-123456789xyz',
    panNumber: 'FGHIJ5678K'
    // No GSTIN provided
  }
  
  try {
    const result = await createRouteAccount(testVendorData)
    
    if (result.success) {
      console.log('✅ Razorpay account created successfully without GSTIN!')
      console.log('Account details:', {
        id: result.account.id,
        status: result.account.status,
        reference_id: result.account.reference_id,
        legal_business_name: result.account.legal_business_name,
        legal_info: result.account.legal_info
      })
    } else {
      console.log('❌ Failed to create Razorpay account')
      console.log('Error:', result.error)
      console.log('Error code:', result.errorCode)
    }
  } catch (error) {
    console.error('🔥 Exception occurred:', error.message)
  }
}

// Run tests
async function runTests() {
  await testRazorpayWithPanGstin()
  await testWithoutGstin()
  
  console.log('\n🎉 Test completed!')
}

if (require.main === module) {
  runTests()
}

module.exports = { testRazorpayWithPanGstin, testWithoutGstin }
