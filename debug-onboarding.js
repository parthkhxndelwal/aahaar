// Debug script to check vendor onboarding steps
// Run this in the browser console on the vendors page to see detailed step analysis

console.log('=== ONBOARDING DEBUG SCRIPT ===');

// Function to analyze a vendor's onboarding status
function analyzeVendor(vendor) {
  console.log(`\n--- VENDOR: ${vendor.stallName} ---`);
  console.log('Raw data:', vendor);
  
  const stepChecks = [
    { step: "basic", isComplete: !!(vendor.stallName && vendor.vendorName && vendor.contactEmail && vendor.contactPhone) },
    { step: "password", isComplete: !!vendor.userId },
    { step: "stall", isComplete: !!vendor.logoUrl },
    { step: "hours", isComplete: !!vendor.operatingHours },
    { step: "bank", isComplete: !!(vendor.bankAccountNumber && vendor.bankIfscCode) },
    { step: "legal", isComplete: !!vendor.panNumber },
    { step: "account", isComplete: !!vendor.razorpayAccountId },
    { step: "config", isComplete: !!(vendor.maxOrdersPerHour && vendor.averagePreparationTime) },
    { step: "success", isComplete: vendor.onboardingStatus === 'completed' }
  ];
  
  console.log('Step completion:');
  stepChecks.forEach(check => {
    console.log(`  ${check.step}: ${check.isComplete ? '✅' : '❌'}`);
  });
  
  // Find next incomplete step
  const nextStep = stepChecks.find(check => !check.isComplete)?.step || 'success';
  console.log(`Next incomplete step: ${nextStep}`);
  console.log(`Vendor onboardingStep field: ${vendor.onboardingStep}`);
  console.log(`Should redirect to: ${nextStep}`);
  
  return nextStep;
}

// If you're on the vendors page, this will analyze all vendors
if (typeof vendors !== 'undefined') {
  vendors.forEach(analyzeVendor);
} else {
  console.log('Run this script on the vendors page where vendor data is available');
  console.log('Or manually call analyzeVendor(vendorObject) with a vendor object');
}

console.log('=== END DEBUG SCRIPT ===');
