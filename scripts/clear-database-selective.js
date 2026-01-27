#!/usr/bin/env node

/**
 * Selective Database Clear Script
 * 
 * This script allows you to clear specific tables or groups of tables.
 * 
 * Usage:
 * node scripts/clear-database-selective.js [options]
 * 
 * Options:
 * --orders       Clear all order-related data (OrderItem, Payment, Order)
 * --carts        Clear all cart-related data (CartItem, Cart)
 * --users        Clear all user data (User, OTP)
 * --vendors      Clear all vendor data (MenuItem, MenuCategory, Vendor)
 * --logs         Clear audit logs
 * --all          Clear all data (same as clear-database-quick.js)
 * --help         Show this help message
 * 
 * Examples:
 * node scripts/clear-database-selective.js --orders --carts
 * node scripts/clear-database-selective.js --users
 * node scripts/clear-database-selective.js --all
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

const args = process.argv.slice(2)

function showHelp() {
  console.log(`
📖 Selective Database Clear Script Help

Usage: node scripts/clear-database-selective.js [options]

Options:
  --orders       Clear order-related data (OrderItem, Payment, Order)
  --carts        Clear cart-related data (CartItem, Cart)  
  --users        Clear user data (User, OTP)
  --vendors      Clear vendor data (MenuItem, MenuCategory, Vendor)
  --logs         Clear audit logs
  --settings     Clear court settings
  --courts       Clear court data (requires clearing all other data first)
  --all          Clear all data
  --help         Show this help message

Examples:
  node scripts/clear-database-selective.js --orders --carts
  node scripts/clear-database-selective.js --users
  node scripts/clear-database-selective.js --all
  `)
}

function parseArguments() {
  if (args.includes('--help') || args.length === 0) {
    showHelp()
    process.exit(0)
  }
  
  return {
    orders: args.includes('--orders'),
    carts: args.includes('--carts'),
    users: args.includes('--users'),
    vendors: args.includes('--vendors'),
    logs: args.includes('--logs'),
    settings: args.includes('--settings'),
    courts: args.includes('--courts'),
    all: args.includes('--all')
  }
}

async function clearTables(tablesToClear, groupName) {
  console.log(`🧹 Clearing ${groupName}...`)
  
  for (const { name, model } of tablesToClear) {
    try {
      const count = await model.count()
      if (count > 0) {
        await model.destroy({ where: {}, truncate: true })
        console.log(`  ✅ ${name}: ${count} records deleted`)
      } else {
        console.log(`  ℹ️  ${name}: No records to delete`)
      }
    } catch (error) {
      console.log(`  ❌ ${name}: Error - ${error.message}`)
    }
  }
}

async function selectiveClearDatabase() {
  const options = parseArguments()
  
  try {
    console.log('🚀 Selective database clear starting...')
    
    // Test database connection
    await sequelize.authenticate()
    console.log('✅ Database connected')
    
    // Disable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0')
    console.log('⚙️  Disabled foreign key checks')
    
    if (options.all) {
      // Clear everything
      const allTables = [
        { name: 'OrderItem', model: OrderItem },
        { name: 'CartItem', model: CartItem },
        { name: 'Payment', model: Payment },
        { name: 'Order', model: Order },
        { name: 'Cart', model: Cart },
        { name: 'OTP', model: OTP },
        { name: 'AuditLog', model: AuditLog },
        { name: 'MenuItem', model: MenuItem },
        { name: 'MenuCategory', model: MenuCategory },
        { name: 'Vendor', model: Vendor },
        { name: 'User', model: User },
        { name: 'CourtSettings', model: CourtSettings },
        { name: 'Court', model: Court }
      ]
      await clearTables(allTables, 'all tables')
    } else {
      // Clear specific groups
      if (options.orders) {
        const orderTables = [
          { name: 'OrderItem', model: OrderItem },
          { name: 'Payment', model: Payment },
          { name: 'Order', model: Order }
        ]
        await clearTables(orderTables, 'order data')
      }
      
      if (options.carts) {
        const cartTables = [
          { name: 'CartItem', model: CartItem },
          { name: 'Cart', model: Cart }
        ]
        await clearTables(cartTables, 'cart data')
      }
      
      if (options.users) {
        // Note: This will also clear vendor profiles since they reference users
        const userTables = [
          { name: 'OTP', model: OTP },
          { name: 'User', model: User }
        ]
        await clearTables(userTables, 'user data')
      }
      
      if (options.vendors) {
        const vendorTables = [
          { name: 'MenuItem', model: MenuItem },
          { name: 'MenuCategory', model: MenuCategory },
          { name: 'Vendor', model: Vendor }
        ]
        await clearTables(vendorTables, 'vendor data')
      }
      
      if (options.logs) {
        const logTables = [
          { name: 'AuditLog', model: AuditLog }
        ]
        await clearTables(logTables, 'audit logs')
      }
      
      if (options.settings) {
        const settingTables = [
          { name: 'CourtSettings', model: CourtSettings }
        ]
        await clearTables(settingTables, 'court settings')
      }
      
      if (options.courts) {
        const courtTables = [
          { name: 'Court', model: Court }
        ]
        await clearTables(courtTables, 'court data')
      }
    }
    
    // Re-enable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1')
    console.log('⚙️  Re-enabled foreign key checks')
    
    console.log('✅ Selective database clear completed!')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await sequelize.close()
    console.log('🔌 Database connection closed')
  }
}

selectiveClearDatabase()
