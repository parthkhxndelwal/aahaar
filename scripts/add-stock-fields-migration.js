const { sequelize } = require('../models')

async function addStockFields() {
  try {
    console.log('Adding stock management fields to menu_items table...')
    
    // Add stock management fields to menu_items table
    await sequelize.query(`
      ALTER TABLE menu_items 
      ADD COLUMN IF NOT EXISTS hasStock BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS stockQuantity INTEGER DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS minStockLevel INTEGER DEFAULT 5,
      ADD COLUMN IF NOT EXISTS maxStockLevel INTEGER DEFAULT 100,
      ADD COLUMN IF NOT EXISTS stockUnit VARCHAR(20) DEFAULT 'pieces'
    `)
    
    console.log('Stock management fields added successfully!')
    
    // Update existing items to have default stock settings if they don't already
    await sequelize.query(`
      UPDATE menu_items 
      SET hasStock = FALSE,
          minStockLevel = 5,
          maxStockLevel = 100,
          stockUnit = 'pieces'
      WHERE hasStock IS NULL
    `)
    
    console.log('Updated existing menu items with default stock settings')
    
  } catch (error) {
    console.error('Error adding stock fields:', error)
    throw error
  }
}

// Run migration if script is executed directly
if (require.main === module) {
  addStockFields()
    .then(() => {
      console.log('Migration completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Migration failed:', error)
      process.exit(1)
    })
}

module.exports = addStockFields
