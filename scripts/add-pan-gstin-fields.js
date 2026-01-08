const { Sequelize } = require('sequelize')
const dbConfig = require('../config/database')

async function addPanGstinFields() {
  const config = dbConfig[process.env.NODE_ENV || 'development']
  const sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    logging: false
  })
  
  try {
    console.log('🔄 Adding PAN and GSTIN fields to vendors table...')
    
    // Add panNumber field
    await sequelize.query(`
      ALTER TABLE vendors 
      ADD COLUMN panNumber VARCHAR(255) DEFAULT NULL
    `)
    console.log('✅ Added panNumber field')
    
    // Add gstin field  
    await sequelize.query(`
      ALTER TABLE vendors 
      ADD COLUMN gstin VARCHAR(255) DEFAULT NULL
    `)
    console.log('✅ Added gstin field')
    
    console.log('🎉 Migration completed successfully!')
    
  } catch (error) {
    if (error.message.includes('Duplicate column name')) {
      console.log('ℹ️ Fields already exist, skipping migration')
    } else {
      console.error('❌ Migration failed:', error.message)
      throw error
    }
  } finally {
    await sequelize.close()
  }
}

// Run migration if called directly
if (require.main === module) {
  addPanGstinFields()
    .then(() => {
      console.log('Migration completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Migration failed:', error)
      process.exit(1)
    })
}

module.exports = { addPanGstinFields }
