#!/usr/bin/env node

/**
 * Quick Database Clear Script
 * 
 * This is a simplified version that quickly deletes all data from the database.
 * Use this when you want to clear the database without prompts (useful for development).
 * 
 * Usage:
 * node scripts/clear-database-quick.js
 */

require("dotenv").config()
const { 
  sequelize, 
  OrderItem, 
  CartItem, 
  Payment, 
  Order, 
  Cart, 
  OTP, 
  AuditLog, 
  MenuItem, 
  MenuCategory, 
  Vendor, 
  User, 
  CourtSettings, 
  Court 
} = require("../models")

async function quickClearDatabase() {
  try {
    console.log('🚀 Quick database clear starting...')
    
    // Test database connection
    await sequelize.authenticate()
    console.log('✅ Database connected')
    
    // Disable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0')
    
    // Delete all records using TRUNCATE for better performance
    const tables = [
      OrderItem, CartItem, Payment, Order, Cart, OTP, 
      AuditLog, MenuItem, MenuCategory, Vendor, User, 
      CourtSettings, Court
    ]
    
    for (const table of tables) {
      await table.destroy({ where: {}, truncate: true })
    }
    
    // Re-enable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1')
    
    console.log('✅ Database cleared successfully!')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await sequelize.close()
    console.log('🔌 Database connection closed')
  }
}

quickClearDatabase()
