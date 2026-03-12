const { User, sequelize } = require('../models')

async function addProfileCompletedField() {
  try {
    console.log('🔍 Checking if profileCompleted column exists...')
    
    // Check if the column already exists
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Users' 
      AND COLUMN_NAME = 'profileCompleted'
      AND TABLE_SCHEMA = DATABASE()
    `)
    
    if (results.length > 0) {
      console.log('✅ profileCompleted column already exists!')
      return
    }
    
    console.log('➕ Adding profileCompleted column to Users table...')
    
    // Add the column
    await sequelize.query(`
      ALTER TABLE Users 
      ADD COLUMN profileCompleted TINYINT(1) DEFAULT 0 NOT NULL
    `)
    
    console.log('✅ Successfully added profileCompleted column!')
    
    // Update existing users to have profileCompleted = true if they have a password
    console.log('🔄 Updating existing users...')
    await sequelize.query(`
      UPDATE Users 
      SET profileCompleted = 1 
      WHERE password IS NOT NULL AND password != ''
    `)
    
    console.log('✅ Updated existing users with passwords to have profileCompleted = true')
    console.log('🎉 Migration completed successfully!')
    
  } catch (error) {
    console.error('❌ Error during migration:', error)
    throw error
  } finally {
    await sequelize.close()
  }
}

// Run the migration
addProfileCompletedField()
  .then(() => {
    console.log('Migration script finished')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Migration failed:', error)
    process.exit(1)
  })