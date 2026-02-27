const { Court, Vendor } = require('./models')

async function checkDatabase() {
  try {
    console.log('🔍 Checking database for courts and vendors...')
    
    // Check courts
    const courts = await Court.findAll({
      attributes: ['id', 'courtId', 'instituteName'],
      limit: 5
    })
    
    console.log(`📍 Found ${courts.length} courts:`)
    courts.forEach(court => {
      console.log(`  - ${court.courtId}: ${court.instituteName}`)
    })
    
    // Check vendors
    const vendors = await Vendor.findAll({
      attributes: ['id', 'stallName', 'courtId', 'status'],
      limit: 5
    })
    
    console.log(`🏪 Found ${vendors.length} vendors:`)
    vendors.forEach(vendor => {
      console.log(`  - ${vendor.stallName} (Court: ${vendor.courtId}, Status: ${vendor.status})`)
    })
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Database check failed:', error)
    process.exit(1)
  }
}

checkDatabase()
