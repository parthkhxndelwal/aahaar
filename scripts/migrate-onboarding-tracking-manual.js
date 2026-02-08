/**
 * Simple manual migration for onboarding tracking
 */

require('dotenv').config()
const mysql = require('mysql2/promise')

async function runMigration() {
  let connection = null
  
  try {
    console.log('🚀 Starting manual onboarding tracking migration...')
    
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

    // Define commands manually to avoid parsing issues
    const commands = [
      `ALTER TABLE \`Vendors\` 
       ADD COLUMN \`onboardingStatus\` ENUM('not_started', 'in_progress', 'completed', 'suspended') NOT NULL DEFAULT 'not_started' COMMENT 'Current onboarding status' AFTER \`metadata\``,
      
      `ALTER TABLE \`Vendors\` 
       ADD COLUMN \`onboardingStep\` ENUM('basic', 'password', 'stall', 'hours', 'bank', 'legal', 'account', 'config', 'success', 'completed') NULL COMMENT 'Current step in onboarding process' AFTER \`onboardingStatus\``,
      
      `ALTER TABLE \`Vendors\` 
       ADD COLUMN \`onboardingCompletedAt\` DATETIME NULL COMMENT 'Timestamp when onboarding was completed' AFTER \`onboardingStep\``,
      
      `ALTER TABLE \`Vendors\` 
       ADD COLUMN \`onboardingStartedAt\` DATETIME NULL COMMENT 'Timestamp when onboarding was started' AFTER \`onboardingCompletedAt\``,
      
      `UPDATE \`Vendors\` 
       SET 
         \`onboardingStatus\` = 'completed',
         \`onboardingStep\` = 'completed',
         \`onboardingCompletedAt\` = \`updatedAt\`,
         \`onboardingStartedAt\` = \`createdAt\`
       WHERE \`razorpayAccountId\` IS NOT NULL`,
      
      `UPDATE \`Vendors\` 
       SET 
         \`onboardingStatus\` = 'in_progress',
         \`onboardingStep\` = 'basic',
         \`onboardingStartedAt\` = \`createdAt\`
       WHERE \`razorpayAccountId\` IS NULL 
         AND (\`stallName\` IS NOT NULL AND \`stallName\` != '')
         AND (\`vendorName\` IS NOT NULL AND \`vendorName\` != '')
         AND (\`contactEmail\` IS NOT NULL AND \`contactEmail\` != '')`,
      
      `CREATE INDEX \`idx_vendors_onboarding_status\` ON \`Vendors\` (\`onboardingStatus\`, \`onboardingStep\`)`,
      
      `CREATE INDEX \`idx_vendors_onboarding_dates\` ON \`Vendors\` (\`onboardingStartedAt\`, \`onboardingCompletedAt\`)`,
      
      `SELECT 
         onboardingStatus,
         onboardingStep,
         COUNT(*) as vendor_count
       FROM \`Vendors\` 
       GROUP BY onboardingStatus, onboardingStep
       ORDER BY onboardingStatus, onboardingStep`
    ]

    console.log(`📋 Executing ${commands.length} SQL commands`)

    // Execute each command
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i].trim()
      if (!command) continue

      try {
        console.log(`⏳ Executing command ${i + 1}/${commands.length}...`)
        console.log(`   ${command.substring(0, 60).replace(/\s+/g, ' ')}...`)
        
        const [results] = await connection.execute(command)
        
        // Log results for SELECT statements
        if (command.trim().toUpperCase().startsWith('SELECT')) {
          console.log('📊 Results:')
          console.table(results)
        } else if (results.affectedRows !== undefined) {
          console.log(`   ✅ Affected rows: ${results.affectedRows}`)
        } else {
          console.log('   ✅ Command executed successfully')
        }
      } catch (cmdError) {
        console.error(`❌ Error executing command ${i + 1}:`, cmdError.message)
        console.error(`   Command: ${command}`)
        
        // Continue with next command if it's a non-critical error
        if (cmdError.message.includes('Duplicate column name') || 
            cmdError.message.includes('already exists')) {
          console.log('   ⚠️  Continuing with next command...')
          continue
        }
        
        throw cmdError
      }
    }

    console.log('🎉 Migration completed successfully!')

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

// Run the migration
if (require.main === module) {
  runMigration()
} else {
  module.exports = runMigration
}
