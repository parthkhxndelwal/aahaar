const { sequelize } = require('../models')

async function migrateInstituteType() {
  try {
    console.log('🔄 Starting migration to add "system" to instituteType ENUM...')
    
    // First, let's check the current ENUM values
    const [results] = await sequelize.query(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'aahaar_dev'}' 
      AND TABLE_NAME = 'courts' 
      AND COLUMN_NAME = 'instituteType'
    `)
    
    console.log('📋 Current ENUM definition:', results[0]?.COLUMN_TYPE)
    
    // Check if 'system' is already in the ENUM
    if (results[0]?.COLUMN_TYPE?.includes("'system'")) {
      console.log('✅ "system" is already included in the ENUM. No migration needed.')
      return
    }
    
    // Modify the ENUM to include 'system'
    await sequelize.query(`
      ALTER TABLE courts 
      MODIFY COLUMN instituteType ENUM('school', 'college', 'office', 'hospital', 'system', 'other') 
      NOT NULL DEFAULT 'college'
    `)
    
    console.log('✅ Successfully added "system" to instituteType ENUM')
    
    // Verify the change
    const [newResults] = await sequelize.query(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'aahaar_dev'}' 
      AND TABLE_NAME = 'courts' 
      AND COLUMN_NAME = 'instituteType'
    `)
    
    console.log('🔍 Updated ENUM definition:', newResults[0]?.COLUMN_TYPE)
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await sequelize.close()
  }
}

// Run the migration
migrateInstituteType()
  .then(() => {
    console.log('🎉 Migration completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error)
    process.exit(1)
  })
