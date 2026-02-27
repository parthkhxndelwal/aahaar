// ✅ Razorpay / Platform Fee Calculation Script with Bill Split
// ------------------------------------------------------------

// Constants (can be configured)
const RAZORPAY_FEE_RATE = 0.02;       // 2% Razorpay base fee
const GST_RATE = 0.18;                // GST on Razorpay fee (18%)
const PLATFORM_DEDUCTION_RATE = 0.06; // 6% total deduction (customer + merchant share)

/**
 * Calculate and generate breakdown for customer, vendors, platform
 * @param {number} totalAmount - Total cart amount
 * @param {number[]} vendorAmounts - Array of vendor shares
 * @returns {object} - Complete breakdown
 */

function calculateSplit(totalAmount, vendorAmounts) {
  // 🔢 Step 1: Razorpay fee calculation
  const razorpayFee = totalAmount * RAZORPAY_FEE_RATE;
  const razorpayFeeWithGST = razorpayFee * (1 + GST_RATE);  // Razorpay fee + GST

  // 🔢 Step 2: Total platform deduction (6%)
  const totalDeduction = totalAmount * PLATFORM_DEDUCTION_RATE;

  // 🔢 Step 3: Customer pays (3% extra)
  const customerPay = totalAmount * (1 + PLATFORM_DEDUCTION_RATE / 2);

  // 🔢 Step 4: Vendor payouts (each vendor bears 3% equally)
  const vendorPayouts = vendorAmounts.map(amount => {
    const deduction = amount * (PLATFORM_DEDUCTION_RATE / 2);
    return {
      vendorAmount: amount,
      deduction,
      payout: amount - deduction
    };
  });

  // 🔢 Step 5: Platform share (6% - Razorpay fee)
  const platformShare = totalDeduction - razorpayFeeWithGST;

  // 📄 Bill split for customer
  const customerBill = {
    baseAmount: totalAmount,
    platformCharge: totalAmount * (PLATFORM_DEDUCTION_RATE / 2),
    totalPayable: customerPay
  };

  // 📄 Bill split for vendors (array for each vendor)
  const vendorBills = vendorPayouts.map(v => ({
    vendorAmount: v.vendorAmount,
    merchantDeduction: v.deduction,
    finalPayout: v.payout
  }));

  // 📄 Summary object
  return {
    totals: {
      totalAmount,
      customerPays: customerPay.toFixed(2),
      razorpayFee: razorpayFeeWithGST.toFixed(2),
      platformKeeps: platformShare.toFixed(2)
    },
    customerBill: {
      Base_Price: `₹${customerBill.baseAmount.toFixed(2)}`,
      Platform_Charge: `₹${customerBill.platformCharge.toFixed(2)}`,
      Total_Payable: `₹${customerBill.totalPayable.toFixed(2)}`
    },
    vendorBills: vendorBills.map((bill, i) => ({
      Vendor: `Vendor ${i + 1}`,
      Item_Value: `₹${bill.vendorAmount.toFixed(2)}`,
      Deduction: `₹${bill.merchantDeduction.toFixed(2)}`,
      Final_Payout: `₹${bill.finalPayout.toFixed(2)}`
    }))
  };
}


// ✅ Example Usage
const totalAmount = 98;            // Total cart value
const vendorAmounts = [59, 39];     // Two vendors

const result = calculateSplit(totalAmount, vendorAmounts);

// Display nicely
console.log("💳 PAYMENT SUMMARY");
console.log("-----------------");
console.log("Total Amount:", `₹${result.totals.totalAmount}`);
console.log("Customer Pays:", `₹${result.totals.customerPays}`);
console.log("Platform Keeps (after Razorpay fee):", `₹${result.totals.platformKeeps}`);
console.log("Razorpay Fee:", `₹${result.totals.razorpayFee}`);
console.log("\n🧾 CUSTOMER BILL:", result.customerBill);
console.log("\n🏪 VENDOR BILLS:", result.vendorBills);
