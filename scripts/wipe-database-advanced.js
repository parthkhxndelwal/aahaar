const { Sequelize } = require("sequelize")
const config = require("../config/database")
const models = require("../models")
const fs = require('fs')
const path = require('path')

const env = process.env.NODE_ENV || "development"
const dbConfig = config[env]

// Command line arguments
const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run') || args.includes('-d')
const isForced = args.includes('--force') || args.includes('-f')
const isQuiet = args.includes('--quiet') || args.includes('-q')

console.log(`🗑️  Database Wipe Utility`)
console.log(`📊 Environment: ${env}`)
console.log(`📊 Database: ${dbConfig.database}`)
console.log(`🌐 Host: ${dbConfig.host}`)
console.log(`🔍 Mode: ${isDryRun ? 'DRY RUN' : 'LIVE EXECUTION'}`)

if (isDryRun) {
  console.log(`ℹ️  This is a dry run - no data will be deleted.`)
}

// Confirmation prompt for safety
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

async function confirmWipe() {
  if (isForced) {
    console.log('⚠️  --force flag detected, skipping confirmation.')
    return true
  }
  
  return new Promise((resolve) => {
    const warningMessage = isDryRun 
      ? '\n🔍 This is a DRY RUN. No data will be deleted.\n   Type "YES" to proceed with dry run: '
      : '\n⚠️  WARNING: This will permanently delete ALL data from the database!\n   Type "CONFIRM_WIPE" to proceed: '
    
    const expectedAnswer = isDryRun ? 'YES' : 'CONFIRM_WIPE'
    
    rl.question(warningMessage, (answer) => {
      rl.close()
      resolve(answer === expectedAnswer)
    })
  })
}

async function generateBackupInfo() {
  if (isDryRun) return null
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupInfo = {
    timestamp,
    environment: env,
    database: dbConfig.database,
    host: dbConfig.host,
    tablesProcessed: []
  }
  
  const backupDir = path.join(__dirname, '../backups')
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }
  
  return backupInfo
}

async function logOperation(message, isError = false) {
  if (isQuiet && !isError) return
  
  const timestamp = new Date().toISOString()
  const logMessage = `[${timestamp}] ${message}`
  
  if (isError) {
    console.error(logMessage)
  } else {
    console.log(logMessage)
  }
}

async function getTableStats() {
  const stats = {}
  
  // Define the tables in dependency order
  const tables = [
    { name: 'audit_logs', model: models.AuditLog },
    { name: 'otps', model: models.OTP },
    { name: 'cart_items', model: models.CartItem },
    { name: 'order_items', model: models.OrderItem },
    { name: 'payments', model: models.Payment },
    { name: 'orders', model: models.Order },
    { name: 'menu_items', model: models.MenuItem },
    { name: 'menu_categories', model: models.MenuCategory },
    { name: 'carts', model: models.Cart },
    { name: 'vendors', model: models.Vendor },
    { name: 'users', model: models.User },
    { name: 'court_settings', model: models.CourtSettings },
    { name: 'courts', model: models.Court },
  ]
  
  for (const table of tables) {
    try {
      const count = await table.model.count()
      stats[table.name] = {
        count,
        model: table.model
      }
    } catch (error) {
      stats[table.name] = {
        count: 'ERROR',
        error: error.message,
        model: table.model
      }
    }
  }
  
  return stats
}

async function wipeDatabase() {
  let backupInfo = null
  
  try {
    // Get confirmation from user
    const confirmed = await confirmWipe()
    if (!confirmed) {
      await logOperation('❌ Database wipe cancelled.')
      process.exit(0)
    }

    await logOperation(`🔥 Starting database wipe (${isDryRun ? 'DRY RUN' : 'LIVE'})...`)
    
    // Test database connection
    await models.sequelize.authenticate()
    await logOperation('✅ Database connection established.')
    
    // Generate backup info
    backupInfo = await generateBackupInfo()
    if (backupInfo) {
      await logOperation(`📋 Backup info generated: ${backupInfo.timestamp}`)
    }

    // Get initial table statistics
    await logOperation('📊 Analyzing database structure...')
    const initialStats = await getTableStats()
    
    const totalRecordsBefore = Object.values(initialStats)
      .reduce((sum, stat) => sum + (typeof stat.count === 'number' ? stat.count : 0), 0)
    
    await logOperation(`📈 Found ${totalRecordsBefore} total records across all tables`)

    // Show table breakdown
    if (!isQuiet) {
      console.log('\n📋 Current database state:')
      console.log('Table Name'.padEnd(20) + 'Record Count')
      console.log('-'.repeat(35))
      Object.entries(initialStats).forEach(([tableName, stat]) => {
        const count = typeof stat.count === 'number' ? stat.count.toString() : 'ERROR'
        console.log(tableName.padEnd(20) + count)
      })
    }

    if (totalRecordsBefore === 0) {
      await logOperation('ℹ️  Database is already empty. Nothing to delete.')
      return
    }

    if (isDryRun) {
      await logOperation('\n🔍 DRY RUN: Would delete the following:')
      Object.entries(initialStats).forEach(([tableName, stat]) => {
        if (stat.count > 0) {
          console.log(`   - ${stat.count} records from ${tableName}`)
        }
      })
      await logOperation(`\n📊 Total records that would be deleted: ${totalRecordsBefore}`)
      return
    }

    // Proceed with actual deletion
    await logOperation('🚀 Proceeding with database wipe...')

    // Disable foreign key checks to avoid constraint issues during deletion
    if (dbConfig.dialect === 'mysql') {
      await models.sequelize.query('SET FOREIGN_KEY_CHECKS = 0;')
      await logOperation('🔓 Foreign key checks disabled.')
    }

    // Define the deletion order (child tables first, then parents)
    const deletionOrder = Object.entries(initialStats).map(([name, stat]) => ({
      name,
      model: stat.model,
      initialCount: stat.count
    }))

    let totalRecordsDeleted = 0

    // Execute deletions in order
    for (const table of deletionOrder) {
      try {
        if (table.initialCount === 0) {
          await logOperation(`   ℹ️  Skipping ${table.name} (already empty)`)
          continue
        }

        await logOperation(`🗑️  Deleting data from ${table.name}...`)
        
        if (backupInfo) {
          backupInfo.tablesProcessed.push({
            name: table.name,
            recordsDeleted: table.initialCount,
            timestamp: new Date().toISOString()
          })
        }

        // Delete all records from the table
        const result = await table.model.destroy({
          where: {},
          truncate: false,
          cascade: false,
          force: true // This ensures soft-deleted records are also removed if any
        })
        
        await logOperation(`   ✅ Deleted ${table.initialCount} records from ${table.name}`)
        totalRecordsDeleted += table.initialCount

        // Reset auto-increment if using MySQL
        if (dbConfig.dialect === 'mysql') {
          try {
            await models.sequelize.query(`ALTER TABLE ${table.name} AUTO_INCREMENT = 1;`)
          } catch (resetError) {
            await logOperation(`   ⚠️  Could not reset auto-increment for ${table.name}: ${resetError.message}`)
          }
        }

      } catch (error) {
        await logOperation(`   ❌ Error deleting from ${table.name}: ${error.message}`, true)
        throw error
      }
    }

    // Re-enable foreign key checks
    if (dbConfig.dialect === 'mysql') {
      await models.sequelize.query('SET FOREIGN_KEY_CHECKS = 1;')
      await logOperation('🔒 Foreign key checks re-enabled.')
    }

    // Verify all tables are empty
    await logOperation('🔍 Verifying database is clean...')
    const finalStats = await getTableStats()
    let remainingRecords = 0
    
    for (const [tableName, stat] of Object.entries(finalStats)) {
      if (stat.count > 0) {
        await logOperation(`   ⚠️  ${tableName} still has ${stat.count} records`, true)
        remainingRecords += stat.count
      }
    }

    if (remainingRecords === 0) {
      await logOperation('   ✅ All tables are empty')
    }

    // Save backup info
    if (backupInfo) {
      backupInfo.totalRecordsDeleted = totalRecordsDeleted
      backupInfo.remainingRecords = remainingRecords
      backupInfo.completedAt = new Date().toISOString()
      
      const backupPath = path.join(__dirname, '../backups', `wipe_info_${backupInfo.timestamp}.json`)
      fs.writeFileSync(backupPath, JSON.stringify(backupInfo, null, 2))
      await logOperation(`💾 Wipe info saved to: ${backupPath}`)
    }

    await logOperation('\n📊 Database Wipe Summary:')
    await logOperation('='.repeat(50))
    await logOperation(`   Total records deleted: ${totalRecordsDeleted}`)
    await logOperation(`   Tables processed: ${deletionOrder.length}`)
    await logOperation(`   Remaining records: ${remainingRecords}`)
    await logOperation(`   Status: ${remainingRecords === 0 ? '✅ SUCCESS' : '❌ INCOMPLETE'}`)
    await logOperation('='.repeat(50))

    if (remainingRecords === 0) {
      await logOperation('🎉 Database successfully wiped clean!')
    } else {
      await logOperation('⚠️  Database wipe completed with some remaining records.', true)
      await logOperation('   Please check the logs above for details.', true)
    }

  } catch (error) {
    await logOperation(`💥 Database wipe failed: ${error.message}`, true)
    await logOperation(`Stack trace: ${error.stack}`, true)
    
    if (backupInfo) {
      backupInfo.error = error.message
      backupInfo.failedAt = new Date().toISOString()
      
      const backupPath = path.join(__dirname, '../backups', `wipe_error_${backupInfo.timestamp}.json`)
      fs.writeFileSync(backupPath, JSON.stringify(backupInfo, null, 2))
      await logOperation(`💾 Error info saved to: ${backupPath}`)
    }
    
    process.exit(1)
  } finally {
    // Close database connection
    await models.sequelize.close()
    await logOperation('🔌 Database connection closed.')
    process.exit(0)
  }
}

// Show help
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: node scripts/wipe-database-advanced.js [options]

Options:
  --dry-run, -d     Show what would be deleted without actually deleting
  --force, -f       Skip confirmation prompt (use with caution!)
  --quiet, -q       Reduce output (errors still shown)
  --help, -h        Show this help message

Examples:
  node scripts/wipe-database-advanced.js --dry-run
  node scripts/wipe-database-advanced.js --force --quiet
  npm run db:wipe:advanced -- --dry-run
`)
  process.exit(0)
}

// Handle process termination gracefully
process.on('SIGINT', async () => {
  await logOperation('\n⚠️  Process interrupted by user.')
  await models.sequelize.close()
  process.exit(1)
})

process.on('SIGTERM', async () => {
  await logOperation('\n⚠️  Process terminated.')
  await models.sequelize.close()
  process.exit(1)
})

// Run the wipe function
wipeDatabase().catch(error => {
  console.error('💥 Unhandled error:', error)
  process.exit(1)
})
