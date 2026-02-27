/**
 * Database Migration Script for TiDB
 * Adds onboarding tracking fields to Vendors table
 * 
 * Usage: node scripts/migrate-onboarding-tracking.js
 */

require('dotenv').config()
const mysql = require('mysql2/promise')
const fs = require('fs')
const path = require('path')

async function runMigration() {
  let connection = null
  
  try {
    console.log('🚀 Starting onboarding tracking migration...')
    
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: process.env.DB_HOST && process.env.DB_HOST.includes('tidbcloud') ? {
        require: true,
        rejectUnauthorized: false
      } : false,
    })

    console.log('✅ Connected to database:', process.env.DB_NAME)

    // Read migration SQL file
    const migrationPath = path.join(__dirname, '..', 'migrations', 'add-onboarding-tracking-to-vendors.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    // Split SQL commands (remove comments and empty lines)
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd && !cmd.startsWith('--') && cmd.length > 10)
      .map(cmd => cmd.replace(/\n\s*--.*$/gm, '').trim()) // Remove inline comments
      .filter(cmd => cmd.length > 10)

    console.log(`📋 Found ${commands.length} SQL commands to execute`)

    // Execute each command
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i]
      if (!command) continue

      try {
        console.log(`⏳ Executing command ${i + 1}/${commands.length}...`)
        console.log(`   ${command.substring(0, 80)}${command.length > 80 ? '...' : ''}`)
        
        const [results] = await connection.execute(command)
        
        // Log results for SELECT statements
        if (command.trim().toUpperCase().startsWith('SELECT')) {
          console.log('📊 Results:', results)
        } else if (results.affectedRows !== undefined) {
          console.log(`   ✅ Affected rows: ${results.affectedRows}`)
        } else {
          console.log('   ✅ Command executed successfully')
        }
      } catch (cmdError) {
        console.error(`❌ Error executing command ${i + 1}:`, cmdError.message)
        console.error(`   Command: ${command}`)
        throw cmdError
      }
    }

    console.log('🎉 Migration completed successfully!')
    
    // Verify the changes
    console.log('\n📋 Verifying migration results...')
    const [verificationResults] = await connection.execute(`
      SELECT 
        onboardingStatus,
        onboardingStep,
        COUNT(*) as vendor_count
      FROM Vendors 
      GROUP BY onboardingStatus, onboardingStep
      ORDER BY onboardingStatus, onboardingStep
    `)
    
    console.log('📊 Current onboarding status distribution:')
    console.table(verificationResults)

    // Check table structure
    const [tableStructure] = await connection.execute(`
      DESCRIBE Vendors
    `)
    
    const onboardingFields = tableStructure.filter(field => 
      field.Field.startsWith('onboarding')
    )
    
    console.log('\n🏗️  New onboarding fields added:')
    console.table(onboardingFields)

  } catch (error) {
    console.error('💥 Migration failed:', error.message)
    console.error('Stack trace:', error.stack)
    process.exit(1)
  } finally {
    if (connection) {
      await connection.end()
      console.log('🔌 Database connection closed')
    }
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n⚠️  Migration interrupted by user')
  process.exit(0)
})

process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught exception:', error)
  process.exit(1)
})

// Run the migration
if (require.main === module) {
  runMigration()
} else {
  module.exports = runMigration
}
