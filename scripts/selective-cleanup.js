#!/usr/bin/env node

/**
 * Selective Database Cleanup Script
 * 
 * This script provides more granular control over database cleanup operations.
 * 
 * Usage:
 *   node scripts/selective-cleanup.js [options]
 * 
 * Options:
 *   --confirm              Required flag to confirm deletion
 *   --dry-run             Show what would be deleted without actually deleting
 *   --orders-only         Delete only orders and related data
 *   --carts-only          Delete only cart data
 *   --old-data <days>     Delete data older than specified days
 *   --test-users-only     Delete only users with phone numbers starting with 'test'
 *   --cancelled-orders    Delete only cancelled orders
 *   --completed-orders    Delete only completed orders
 *   --user-id <id>        Delete data for specific user ID
 * 
 * Examples:
 *   node scripts/selective-cleanup.js --dry-run --old-data 30
 *   node scripts/selective-cleanup.js --confirm --test-users-only
 *   node scripts/selective-cleanup.js --confirm --cancelled-orders
 */

const { Sequelize, Op } = require('sequelize')
require('dotenv').config()

// Import all models
const { 
  User, 
  Order, 
  OrderItem, 
  Cart, 
  CartItem, 
  Payment, 
  OTP,
  AuditLog
} = require('../models')

// Configuration
const config = {
  dryRun: process.argv.includes('--dry-run'),
  confirm: process.argv.includes('--confirm'),
  ordersOnly: process.argv.includes('--orders-only'),
  cartsOnly: process.argv.includes('--carts-only'),
  testUsersOnly: process.argv.includes('--test-users-only'),
  cancelledOrders: process.argv.includes('--cancelled-orders'),
  completedOrders: process.argv.includes('--completed-orders'),
  oldData: null,
  userId: null
}

// Get old data threshold
const oldDataIndex = process.argv.indexOf('--old-data')
if (oldDataIndex !== -1 && process.argv[oldDataIndex + 1]) {
  config.oldData = parseInt(process.argv[oldDataIndex + 1])
}

// Get specific user ID
const userIdIndex = process.argv.indexOf('--user-id')
if (userIdIndex !== -1 && process.argv[userIdIndex + 1]) {
  config.userId = process.argv[userIdIndex + 1]
}

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
}

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

function logSection(title) {
  console.log('\n' + '='.repeat(60))
  log(`  ${title}`, colors.bold + colors.cyan)
  console.log('='.repeat(60))
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow)
}

function logError(message) {
  log(`❌ ${message}`, colors.red)
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green)
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue)
}

async function buildWhereClause() {
  const whereClause = {}
  
  if (config.userId) {
    whereClause.userId = config.userId
  }
  
  if (config.oldData) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - config.oldData)
    whereClause.createdAt = { [Op.lt]: cutoffDate }
  }
  
  if (config.testUsersOnly) {
    // Find test users first
    const testUsers = await User.findAll({
      where: {
        [Op.or]: [
          { phoneNumber: { [Op.like]: 'test%' } },
          { phoneNumber: { [Op.like]: '1234567890' } },
          { phoneNumber: { [Op.like]: '0000000000' } }
        ]
      },
      attributes: ['id']
    })
    
    if (testUsers.length === 0) {
      logWarning('No test users found')
      return null
    }
    
    whereClause.userId = { [Op.in]: testUsers.map(u => u.id) }
  }
  
  if (config.cancelledOrders) {
    whereClause.status = 'cancelled'
  }
  
  if (config.completedOrders) {
    whereClause.status = 'completed'
  }
  
  return whereClause
}

async function cleanupOrders() {
  const whereClause = await buildWhereClause()
  if (!whereClause) return { deleted: 0, errors: [] }
  
  const results = { deleted: 0, errors: [] }
  
  try {
    const transaction = await User.sequelize.transaction()
    
    try {
      // Find orders to delete
      const orders = await Order.findAll({
        where: whereClause,
        attributes: ['id'],
        transaction
      })
      
      const orderIds = orders.map(o => o.id)
      logInfo(`Found ${orderIds.length} orders matching criteria`)
      
      if (orderIds.length === 0) {
        await transaction.rollback()
        return results
      }
      
      // Delete order items first
      const orderItemsDeleted = await OrderItem.destroy({
        where: { orderId: { [Op.in]: orderIds } },
        transaction
      })
      
      // Delete payments
      const paymentsDeleted = await Payment.destroy({
        where: { orderId: { [Op.in]: orderIds } },
        transaction
      })
      
      // Delete orders
      const ordersDeleted = await Order.destroy({
        where: { id: { [Op.in]: orderIds } },
        transaction
      })
      
      if (config.dryRun) {
        await transaction.rollback()
        logInfo(`[DRY RUN] Would delete: ${orderItemsDeleted} order items, ${paymentsDeleted} payments, ${ordersDeleted} orders`)
      } else {
        await transaction.commit()
        logSuccess(`Deleted: ${orderItemsDeleted} order items, ${paymentsDeleted} payments, ${ordersDeleted} orders`)
      }
      
      results.deleted = ordersDeleted
      
    } catch (error) {
      await transaction.rollback()
      throw error
    }
    
  } catch (error) {
    results.errors.push(`Order cleanup failed: ${error.message}`)
    logError(results.errors[results.errors.length - 1])
  }
  
  return results
}

async function cleanupCarts() {
  const whereClause = await buildWhereClause()
  if (!whereClause) return { deleted: 0, errors: [] }
  
  const results = { deleted: 0, errors: [] }
  
  try {
    const transaction = await User.sequelize.transaction()
    
    try {
      // Find carts to delete
      const carts = await Cart.findAll({
        where: whereClause,
        attributes: ['id'],
        transaction
      })
      
      const cartIds = carts.map(c => c.id)
      logInfo(`Found ${cartIds.length} carts matching criteria`)
      
      if (cartIds.length === 0) {
        await transaction.rollback()
        return results
      }
      
      // Delete cart items first
      const cartItemsDeleted = await CartItem.destroy({
        where: { cartId: { [Op.in]: cartIds } },
        transaction
      })
      
      // Delete carts
      const cartsDeleted = await Cart.destroy({
        where: { id: { [Op.in]: cartIds } },
        transaction
      })
      
      if (config.dryRun) {
        await transaction.rollback()
        logInfo(`[DRY RUN] Would delete: ${cartItemsDeleted} cart items, ${cartsDeleted} carts`)
      } else {
        await transaction.commit()
        logSuccess(`Deleted: ${cartItemsDeleted} cart items, ${cartsDeleted} carts`)
      }
      
      results.deleted = cartsDeleted
      
    } catch (error) {
      await transaction.rollback()
      throw error
    }
    
  } catch (error) {
    results.errors.push(`Cart cleanup failed: ${error.message}`)
    logError(results.errors[results.errors.length - 1])
  }
  
  return results
}

async function cleanupTestUsers() {
  if (!config.testUsersOnly) return { deleted: 0, errors: [] }
  
  const results = { deleted: 0, errors: [] }
  
  try {
    const transaction = await User.sequelize.transaction()
    
    try {
      // Find test users
      const testUsers = await User.findAll({
        where: {
          [Op.or]: [
            { phoneNumber: { [Op.like]: 'test%' } },
            { phoneNumber: { [Op.like]: '1234567890' } },
            { phoneNumber: { [Op.like]: '0000000000' } }
          ]
        },
        transaction
      })
      
      logInfo(`Found ${testUsers.length} test users`)
      
      if (testUsers.length === 0) {
        await transaction.rollback()
        return results
      }
      
      const userIds = testUsers.map(u => u.id)
      
      // Delete all related data first
      await AuditLog.destroy({ where: { userId: { [Op.in]: userIds } }, transaction })
      await OTP.destroy({ where: { userId: { [Op.in]: userIds } }, transaction })
      
      // Delete users
      const usersDeleted = await User.destroy({
        where: { id: { [Op.in]: userIds } },
        transaction
      })
      
      if (config.dryRun) {
        await transaction.rollback()
        logInfo(`[DRY RUN] Would delete ${usersDeleted} test users and their data`)
      } else {
        await transaction.commit()
        logSuccess(`Deleted ${usersDeleted} test users and their data`)
      }
      
      results.deleted = usersDeleted
      
    } catch (error) {
      await transaction.rollback()
      throw error
    }
    
  } catch (error) {
    results.errors.push(`Test user cleanup failed: ${error.message}`)
    logError(results.errors[results.errors.length - 1])
  }
  
  return results
}

async function main() {
  logSection('Selective Database Cleanup Script')
  
  // Validate arguments
  if (!config.confirm && !config.dryRun) {
    logError('You must use either --confirm or --dry-run flag')
    process.exit(1)
  }
  
  if (config.confirm && config.dryRun) {
    logError('Cannot use both --confirm and --dry-run flags together')
    process.exit(1)
  }
  
  // Show configuration
  logSection('Configuration')
  logInfo(`Mode: ${config.dryRun ? 'DRY RUN' : 'LIVE DELETION'}`)
  logInfo(`Orders only: ${config.ordersOnly}`)
  logInfo(`Carts only: ${config.cartsOnly}`)
  logInfo(`Test users only: ${config.testUsersOnly}`)
  logInfo(`Cancelled orders: ${config.cancelledOrders}`)
  logInfo(`Completed orders: ${config.completedOrders}`)
  logInfo(`Old data threshold: ${config.oldData ? `${config.oldData} days` : 'None'}`)
  logInfo(`Specific user: ${config.userId || 'None'}`)
  
  let totalDeleted = 0
  let allErrors = []
  
  // Execute cleanup operations
  if (config.ordersOnly || (!config.cartsOnly && !config.testUsersOnly)) {
    logSection('Order Cleanup')
    const orderResults = await cleanupOrders()
    totalDeleted += orderResults.deleted
    allErrors = allErrors.concat(orderResults.errors)
  }
  
  if (config.cartsOnly || (!config.ordersOnly && !config.testUsersOnly)) {
    logSection('Cart Cleanup')
    const cartResults = await cleanupCarts()
    totalDeleted += cartResults.deleted
    allErrors = allErrors.concat(cartResults.errors)
  }
  
  if (config.testUsersOnly) {
    logSection('Test User Cleanup')
    const userResults = await cleanupTestUsers()
    totalDeleted += userResults.deleted
    allErrors = allErrors.concat(userResults.errors)
  }
  
  // Summary
  logSection('Summary')
  logSuccess(`Total records processed: ${totalDeleted}`)
  
  if (allErrors.length > 0) {
    logError(`Encountered ${allErrors.length} error(s):`)
    allErrors.forEach(error => logError(`  ${error}`))
  }
  
  if (config.dryRun) {
    logInfo('This was a dry run - no actual data was deleted')
  } else {
    logSuccess('Selective cleanup completed!')
  }
}

// Run the script
main().catch(error => {
  logError(`Script failed: ${error.message}`)
  console.error(error)
  process.exit(1)
})
