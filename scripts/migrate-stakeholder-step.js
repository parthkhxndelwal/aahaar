/**
 * Database Migration Script for TiDB
 * Adds 'stakeholder' step to onboardingStep ENUM
 * 
 * Usage: node scripts/migrate-stakeholder-step.js
 */

require('dotenv').config()
const mysql = require('mysql2/promise')
const fs = require('fs')
const path = require('path')

async function runMigration() {
  let connection = null
  
  try {
    console.log('🚀 Starting stakeholder step migration...')
    
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
    
    console.log('✅ Database connection established')
    
    // Read migration SQL file
    const migrationPath = path.join(__dirname, '..', 'migrations', 'add-stakeholder-step-to-onboarding.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    // Split SQL into individual statements (filter out comments and empty statements)
    const statements = migrationSQL
      .split('\n')
      .filter(line => line.trim() && !line.trim().startsWith('--'))
      .join('\n')
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && stmt.length > 0)
    
    console.log(`📄 Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}`)
        console.log(`   SQL: ${statement.substring(0, 80)}${statement.length > 80 ? '...' : ''}`)
        
        await connection.execute(statement)
        console.log(`✅ Statement ${i + 1} completed successfully`)
      }
    }
    
    // Verify the migration by checking the ENUM values
    const [rows] = await connection.execute(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'Vendors' 
      AND COLUMN_NAME = 'onboardingStep'
    `, [process.env.DB_NAME])
    
    if (rows.length > 0) {
      console.log('✅ Migration verification:')
      console.log(`   onboardingStep ENUM: ${rows[0].COLUMN_TYPE}`)
      
      // Check if 'stakeholder' is in the ENUM
      if (rows[0].COLUMN_TYPE.includes('stakeholder')) {
        console.log('✅ CONFIRMED: stakeholder step has been added to the ENUM')
      } else {
        console.log('❌ WARNING: stakeholder step was not found in the ENUM')
      }
    }
    
    console.log('\n🎉 Migration completed successfully!')
    console.log('The stakeholder step has been added to the onboarding process.')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    })
    process.exit(1)
  } finally {
    if (connection) {
      await connection.end()
      console.log('📡 Database connection closed')
    }
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('✅ Migration script completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error)
      process.exit(1)
    })
}

module.exports = { runMigration }
