/**
 * Test script for Razorpay Route Account integration
 * 
 * This script tests:
 * 1. Creating a vendor with PAN/GSTIN
 * 2. Updating vendor details and Razorpay account
 * 3. Fetching Razorpay account details
 */

const { createRouteAccount, updateRouteAccount, fetchRouteAccount } = require('../utils/razorpay')

async function testRazorpayIntegration() {
  console.log('🧪 Testing Razorpay Route Account Integration...\n')

  // Test data
  const testVendorData = {
    email: 'test@example.com',
    phone: '9876543210',
    vendorName: 'Test Vendor',
    stallName: 'Test Food Stall',
    courtId: 'test-court-123',
    vendorId: 'test-vendor-456',
    panNumber: 'ABCDE1234F',
    gstin: '18AABCU9603R1ZM'
  }

  try {
    // Test 1: Create Razorpay Account
    console.log('1️⃣ Testing Account Creation...')
    const createResult = await createRouteAccount(testVendorData)
    
    if (createResult.success) {
      console.log('✅ Account created successfully!')
      console.log('📄 Account ID:', createResult.account.id)
      console.log('📧 Email:', createResult.account.email)
      console.log('📱 Phone:', createResult.account.phone)
      console.log('🏢 Business Name:', createResult.account.legal_business_name)
      console.log('📊 Status:', createResult.account.status)
      
      const accountId = createResult.account.id

      // Test 2: Fetch Account Details
      console.log('\n2️⃣ Testing Account Fetch...')
      const fetchResult = await fetchRouteAccount(accountId)
      
      if (fetchResult.success) {
        console.log('✅ Account fetched successfully!')
        console.log('📄 Fetched Account ID:', fetchResult.account.id)
        console.log('📊 Current Status:', fetchResult.account.status)
        console.log('🆔 Reference ID:', fetchResult.account.reference_id)
      } else {
        console.log('❌ Failed to fetch account:', fetchResult.error)
      }

      // Test 3: Update Account
      console.log('\n3️⃣ Testing Account Update...')
      const updateData = {
        vendorName: 'Updated Test Vendor',
        stallName: 'Updated Food Stall',
        courtId: testVendorData.courtId,
        panNumber: 'FGHIJ5678K', // Updated PAN
        gstin: '19AABCU9603R1ZN' // Updated GSTIN
      }

      const updateResult = await updateRouteAccount(accountId, updateData)
      
      if (updateResult.success) {
        console.log('✅ Account updated successfully!')
        console.log('🏢 Updated Business Name:', updateResult.account.legal_business_name)
        console.log('🆔 Updated PAN:', updateResult.account.legal_info?.pan)
        console.log('📊 Updated GSTIN:', updateResult.account.legal_info?.gst)
      } else {
        console.log('❌ Failed to update account:', updateResult.error)
      }

      console.log('\n🎉 All tests completed!')
      
    } else {
      console.log('❌ Account creation failed:', createResult.error)
      console.log('Error details:', createResult.errorDetails)
    }

  } catch (error) {
    console.error('💥 Test failed with error:', error)
  }
}

// Only run if called directly
if (require.main === module) {
  testRazorpayIntegration()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Test suite failed:', error)
      process.exit(1)
    })
}

module.exports = { testRazorpayIntegration }
