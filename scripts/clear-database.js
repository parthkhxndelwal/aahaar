#!/usr/bin/env node

/**
 * Database Clear Script
 * 
 * This script deletes all data from the database while preserving table structures.
 * It handles foreign key constraints by deleting records in the correct order.
 * 
 * Usage:
 * node scripts/clear-database.js [environment]
 * 
 * Examples:
 * node scripts/clear-database.js development
 * node scripts/clear-database.js production
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

const readline = require('readline')

// Color codes for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
}

function askQuestion(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer)
    })
  })
}

async function confirmAction(environment) {
  const rl = createInterface()
  
  log(`${colors.bold}⚠️  WARNING: This will delete ALL data from the ${environment} database!${colors.reset}`, 'red')
  log('Table structures will be preserved, but all records will be permanently deleted.', 'yellow')
  log('')
  
  const dbName = process.env.DB_NAME || 'aahaar_dev'
  const dbHost = process.env.DB_HOST || 'localhost'
  log(`Database: ${dbName} on ${dbHost}`, 'cyan')
  log('')
  
  const answer = await askQuestion(rl, 'Are you absolutely sure you want to continue? Type "DELETE ALL DATA" to confirm: ')
  rl.close()
  
  return answer === 'DELETE ALL DATA'
}

async function getTableCounts() {
  const counts = {}
  const models = [
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
  
  for (const { name, model } of models) {
    try {
      counts[name] = await model.count()
    } catch (error) {
      counts[name] = 'Error'
    }
  }
  
  return counts
}

async function displayTableCounts(title, counts) {
  log(`\n${title}:`, 'bold')
  log('─'.repeat(40), 'cyan')
  
  for (const [tableName, count] of Object.entries(counts)) {
    const countStr = count === 'Error' ? 'Error' : count.toString()
    log(`${tableName.padEnd(20)} | ${countStr.padStart(10)}`, 'cyan')
  }
  log('─'.repeat(40), 'cyan')
}

async function clearDatabase() {
  const environment = process.env.NODE_ENV || 'development'
  
  log(`${colors.bold}🗃️  Database Clear Script${colors.reset}`, 'blue')
  log(`Environment: ${environment}`, 'blue')
  
  try {
    // Test database connection
    await sequelize.authenticate()
    log('✅ Database connection established', 'green')
    
    // Get initial counts
    const initialCounts = await getTableCounts()
    await displayTableCounts('Current Record Counts', initialCounts)
    
    // Confirm action
    const confirmed = await confirmAction(environment)
    if (!confirmed) {
      log('❌ Operation cancelled by user', 'yellow')
      process.exit(0)
    }
    
    log('\n🚀 Starting database cleanup...', 'blue')
    
    // Disable foreign key checks temporarily (MySQL specific)
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0')
    log('⚙️  Disabled foreign key checks', 'yellow')
    
    // Delete records in order to respect foreign key constraints
    const deletionOrder = [
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
    
    const deletionResults = {}
    
    for (const { name, model } of deletionOrder) {
      try {
        const count = await model.count()
        if (count > 0) {
          await model.destroy({ where: {}, truncate: true })
          deletionResults[name] = `${count} records deleted`
          log(`✅ ${name}: ${count} records deleted`, 'green')
        } else {
          deletionResults[name] = 'No records to delete'
          log(`ℹ️  ${name}: No records to delete`, 'cyan')
        }
      } catch (error) {
        deletionResults[name] = `Error: ${error.message}`
        log(`❌ ${name}: Error - ${error.message}`, 'red')
      }
    }
    
    // Re-enable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1')
    log('⚙️  Re-enabled foreign key checks', 'yellow')
    
    // Get final counts to verify
    const finalCounts = await getTableCounts()
    await displayTableCounts('Final Record Counts', finalCounts)
    
    // Summary
    log('\n📊 Deletion Summary:', 'bold')
    log('─'.repeat(50), 'cyan')
    for (const [tableName, result] of Object.entries(deletionResults)) {
      log(`${tableName.padEnd(20)} | ${result}`, 'cyan')
    }
    log('─'.repeat(50), 'cyan')
    
    // Check if all tables are empty
    const totalRecords = Object.values(finalCounts).reduce((sum, count) => {
      return typeof count === 'number' ? sum + count : sum
    }, 0)
    
    if (totalRecords === 0) {
      log('\n🎉 Database successfully cleared! All tables are now empty.', 'green')
    } else {
      log(`\n⚠️  Warning: ${totalRecords} records still remain in the database.`, 'yellow')
    }
    
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red')
    console.error(error)
    process.exit(1)
  } finally {
    await sequelize.close()
    log('\n🔌 Database connection closed', 'blue')
  }
}

// Handle command line arguments
const args = process.argv.slice(2)
if (args.length > 0) {
  process.env.NODE_ENV = args[0]
}

// Run the script
clearDatabase().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
