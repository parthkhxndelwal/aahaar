import { NextResponse } from "next/server"
import { User, Vendor } from "@/models"

export async function POST(request) {
  try {
    console.log('🔧 Admin: Fixing all vendor user accounts...')
    
    // Find all vendors
    const vendors = await Vendor.findAll({
      attributes: ['contactEmail', 'courtId', 'stallName']
    })
    
    console.log(`Found ${vendors.length} vendors to check`)
    
    const results = []
    
    for (const vendor of vendors) {
      console.log(`📋 Checking vendor: ${vendor.stallName} (${vendor.contactEmail})`)
      
      // Find associated user
      const user = await User.findOne({
        where: {
          email: vendor.contactEmail.toLowerCase(),
          courtId: vendor.courtId
        }
      })
      
      if (user) {
        const userResult = {
          stallName: vendor.stallName,
          email: vendor.contactEmail,
          courtId: vendor.courtId,
          oldStatus: user.status,
          newStatus: user.status,
          fixed: false,
          hasPassword: !!user.password
        }
        
        if (user.status !== 'active') {
          console.log(`   ⚠️  User status is "${user.status}", updating to "active"`)
          await user.update({ status: 'active' })
          userResult.newStatus = 'active'
          userResult.fixed = true
          console.log(`   ✅ Fixed user status for ${vendor.contactEmail}`)
        } else {
          console.log(`   ✅ User status is already "active"`)
        }
        
        results.push(userResult)
      } else {
        console.log(`   ❌ No user account found for ${vendor.contactEmail}`)
        results.push({
          stallName: vendor.stallName,
          email: vendor.contactEmail,
          courtId: vendor.courtId,
          error: 'No user account found'
        })
      }
    }
    
    console.log('🎉 Done fixing vendor user accounts!')
    
    return NextResponse.json({
      success: true,
      message: "Vendor user accounts checked and fixed",
      data: {
        totalVendors: vendors.length,
        results: results,
        fixedCount: results.filter(r => r.fixed).length
      }
    })
    
  } catch (error) {
    console.error('❌ Error fixing vendor accounts:', error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error.message,
      },
      { status: 500 }
    )
  }
}
