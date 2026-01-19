/**
 * Database Migration Script for Cart Tables
 * Run this script to create the cart and cart_items tables
 */

const { sequelize, Cart, CartItem } = require("../models")

async function runMigration() {
  try {
    console.log("Starting database migration for cart tables...")
    
    // Only sync the new Cart and CartItem models without altering existing tables
    await Cart.sync({ force: false })
    await CartItem.sync({ force: false })
    
    console.log("✅ Database migration completed successfully!")
    console.log("✅ Cart and CartItem tables created")
    
    // Test the connection
    await sequelize.authenticate()
    console.log("✅ Database connection verified")
    
  } catch (error) {
    console.error("❌ Migration failed:", error)
    throw error
  } finally {
    await sequelize.close()
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log("Migration completed successfully!")
      process.exit(0)
    })
    .catch((error) => {
      console.error("Migration failed:", error)
      process.exit(1)
    })
}

module.exports = { runMigration }
