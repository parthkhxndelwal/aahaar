// Script to fix existing vendor user accounts
const { User, Vendor } = require('../models')

async function fixAllVendorUsers() {
  try {
    console.log('🔧 Fixing all vendor user accounts...')
    
    // Find all vendors
    const vendors = await Vendor.findAll({
      attributes: ['contactEmail', 'courtId', 'stallName']
    })
    
    console.log(`Found ${vendors.length} vendors to check`)
    
    for (const vendor of vendors) {
      console.log(`\n📋 Checking vendor: ${vendor.stallName} (${vendor.contactEmail})`)
      
      // Find associated user
      const user = await User.findOne({
        where: {
          email: vendor.contactEmail.toLowerCase(),
          courtId: vendor.courtId
        }
      })
      
      if (user) {
        if (user.status !== 'active') {
          console.log(`   ⚠️  User status is "${user.status}", updating to "active"`)
          await user.update({ status: 'active' })
          console.log(`   ✅ Fixed user status for ${vendor.contactEmail}`)
        } else {
          console.log(`   ✅ User status is already "active"`)
        }
        
        if (!user.password) {
          console.log(`   ❌ User has no password! This needs manual intervention.`)
        }
      } else {
        console.log(`   ❌ No user account found for ${vendor.contactEmail}`)
        console.log(`      This vendor was created without a user account!`)
      }
    }
    
    console.log('\n🎉 Done fixing vendor user accounts!')
    
  } catch (error) {
    console.error('❌ Error fixing vendor accounts:', error)
  }
}

async function fixSpecificVendor(email, courtId) {
  try {
    console.log(`🔧 Fixing specific vendor: ${email} in court ${courtId}`)
    
    const user = await User.findOne({
      where: {
        email: email.toLowerCase(),
        courtId
      }
    })
    
    if (user) {
      if (user.status !== 'active') {
        await user.update({ status: 'active' })
        console.log(`✅ Fixed user status for ${email}`)
      } else {
        console.log(`✅ User status is already "active"`)
      }
      
      console.log(`User details:`, {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        hasPassword: !!user.password
      })
      
    } else {
      console.log(`❌ User not found: ${email} in court ${courtId}`)
    }
    
  } catch (error) {
    console.error('❌ Error fixing vendor:', error)
  }
}

module.exports = {
  fixAllVendorUsers,
  fixSpecificVendor
}

// If running directly
if (require.main === module) {
  const args = process.argv.slice(2)
  if (args.length === 2) {
    const [email, courtId] = args
    fixSpecificVendor(email, courtId).then(() => process.exit())
  } else {
    fixAllVendorUsers().then(() => process.exit())
  }
}
