const { Sequelize } = require("sequelize")
const config = require("../config/database")
const models = require("../models")

const env = process.env.NODE_ENV || "development"
const dbConfig = config[env]

console.log(`🗑️  Starting database wipe for environment: ${env}`)
console.log(`📊 Database: ${dbConfig.database}`)
console.log(`🌐 Host: ${dbConfig.host}`)

// Confirmation prompt for safety
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

async function confirmWipe() {
  return new Promise((resolve) => {
    rl.question('\n⚠️  WARNING: This will permanently delete ALL data from the database!\n   Type "CONFIRM_WIPE" to proceed: ', (answer) => {
      rl.close()
      resolve(answer === 'CONFIRM_WIPE')
    })
  })
}

async function wipeDatabase() {
  try {
    // Get confirmation from user
    const confirmed = await confirmWipe()
    if (!confirmed) {
      console.log('❌ Database wipe cancelled.')
      process.exit(0)
    }

    console.log('\n🔥 Starting database wipe...')
    
    // Test database connection
    await models.sequelize.authenticate()
    console.log('✅ Database connection established.')

    // Disable foreign key checks to avoid constraint issues during deletion
    if (dbConfig.dialect === 'mysql') {
      await models.sequelize.query('SET FOREIGN_KEY_CHECKS = 0;')
      console.log('🔓 Foreign key checks disabled.')
    }

    // Define the deletion order (child tables first, then parents)
    const deletionOrder = [
      // Child tables with foreign key dependencies (delete first)
      { name: 'audit_logs', model: models.AuditLog },
      { name: 'otps', model: models.OTP },
      { name: 'cart_items', model: models.CartItem },
      { name: 'order_items', model: models.OrderItem },
      { name: 'payments', model: models.Payment },
      { name: 'orders', model: models.Order },
      { name: 'menu_items', model: models.MenuItem },
      { name: 'menu_categories', model: models.MenuCategory },
      { name: 'carts', model: models.Cart },
      
      // Parent tables (delete after dependencies)
      { name: 'vendors', model: models.Vendor },
      { name: 'users', model: models.User },
      { name: 'court_settings', model: models.CourtSettings },
      { name: 'courts', model: models.Court },
    ]

    console.log('\n📋 Deletion plan:')
    deletionOrder.forEach((table, index) => {
      console.log(`   ${index + 1}. ${table.name}`)
    })

    let totalRecordsDeleted = 0

    // Execute deletions in order
    for (const table of deletionOrder) {
      try {
        console.log(`\n🗑️  Deleting data from ${table.name}...`)
        
        // Count records before deletion
        const recordCount = await table.model.count()
        console.log(`   📊 Found ${recordCount} records`)
        
        if (recordCount > 0) {
          // Delete all records from the table
          const result = await table.model.destroy({
            where: {},
            truncate: false,
            cascade: false,
            force: true // This ensures soft-deleted records are also removed if any
          })
          
          console.log(`   ✅ Deleted ${recordCount} records from ${table.name}`)
          totalRecordsDeleted += recordCount
        } else {
          console.log(`   ℹ️  No records found in ${table.name}`)
        }

        // Reset auto-increment if using MySQL
        if (dbConfig.dialect === 'mysql' && recordCount > 0) {
          try {
            await models.sequelize.query(`ALTER TABLE ${table.name} AUTO_INCREMENT = 1;`)
            console.log(`   🔄 Reset auto-increment for ${table.name}`)
          } catch (resetError) {
            console.log(`   ⚠️  Could not reset auto-increment for ${table.name}: ${resetError.message}`)
          }
        }

      } catch (error) {
        console.error(`   ❌ Error deleting from ${table.name}:`, error.message)
        throw error
      }
    }

    // Re-enable foreign key checks
    if (dbConfig.dialect === 'mysql') {
      await models.sequelize.query('SET FOREIGN_KEY_CHECKS = 1;')
      console.log('\n🔒 Foreign key checks re-enabled.')
    }

    // Verify all tables are empty
    console.log('\n🔍 Verifying database is clean...')
    let remainingRecords = 0
    
    for (const table of deletionOrder) {
      const count = await table.model.count()
      if (count > 0) {
        console.log(`   ⚠️  ${table.name} still has ${count} records`)
        remainingRecords += count
      }
    }

    if (remainingRecords === 0) {
      console.log('   ✅ All tables are empty')
    } else {
      console.log(`   ❌ ${remainingRecords} records still remain in database`)
    }

    console.log('\n📊 Database Wipe Summary:')
    console.log('='.repeat(40))
    console.log(`   Total records deleted: ${totalRecordsDeleted}`)
    console.log(`   Tables processed: ${deletionOrder.length}`)
    console.log(`   Remaining records: ${remainingRecords}`)
    console.log(`   Status: ${remainingRecords === 0 ? '✅ SUCCESS' : '❌ INCOMPLETE'}`)
    console.log('='.repeat(40))

    if (remainingRecords === 0) {
      console.log('\n🎉 Database successfully wiped clean!')
    } else {
      console.log('\n⚠️  Database wipe completed with some remaining records.')
      console.log('   Please check the logs above for details.')
    }

  } catch (error) {
    console.error('\n💥 Database wipe failed:', error.message)
    console.error('Stack trace:', error.stack)
    process.exit(1)
  } finally {
    // Close database connection
    await models.sequelize.close()
    console.log('\n🔌 Database connection closed.')
    process.exit(0)
  }
}

// Handle process termination gracefully
process.on('SIGINT', async () => {
  console.log('\n\n⚠️  Process interrupted by user.')
  await models.sequelize.close()
  process.exit(1)
})

process.on('SIGTERM', async () => {
  console.log('\n\n⚠️  Process terminated.')
  await models.sequelize.close()
  process.exit(1)
})

// Run the wipe function
wipeDatabase().catch(error => {
  console.error('💥 Unhandled error:', error)
  process.exit(1)
})
