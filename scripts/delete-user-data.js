#!/usr/bin/env node

/**
 * Database User Data Cleanup Script
 * 
 * This script deletes all user-related data from the database.
 * Use with extreme caution - this action is irreversible!
 * 
 * Usage:
 *   node scripts/delete-user-data.js [options]
 * 
 * Options:
 *   --confirm          Required flag to confirm deletion
 *   --dry-run          Show what would be deleted without actually deleting
 *   --specific-user    Delete data for a specific user ID
 *   --exclude-admins   Keep admin users and their data
 * 
 * Examples:
 *   node scripts/delete-user-data.js --dry-run
 *   node scripts/delete-user-data.js --confirm --exclude-admins
 *   node scripts/delete-user-data.js --confirm --specific-user "user-123"
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
  excludeAdmins: process.argv.includes('--exclude-admins'),
  specificUser: null
}

// Get specific user ID if provided
const specificUserIndex = process.argv.indexOf('--specific-user')
if (specificUserIndex !== -1 && process.argv[specificUserIndex + 1]) {
  config.specificUser = process.argv[specificUserIndex + 1]
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

async function validateDatabase() {
  try {
    // Test database connection
    await User.sequelize.authenticate()
    logSuccess('Database connection successful')
    
    // Get database info
    const dialect = User.sequelize.getDialect()
    const dbName = User.sequelize.config.database
    const host = User.sequelize.config.host
    
    logInfo(`Connected to: ${dialect} database "${dbName}" on ${host}`)
    return true
  } catch (error) {
    logError(`Database connection failed: ${error.message}`)
    return false
  }
}

async function getUserStats() {
  try {
    const whereClause = {}
    
    if (config.specificUser) {
      whereClause.id = config.specificUser
    }
    
    if (config.excludeAdmins) {
      whereClause.role = { [Op.ne]: 'admin' }
    }
    
    const users = await User.findAll({
      where: whereClause,
      attributes: ['id', 'name', 'phoneNumber', 'role', 'createdAt']
    })
    
    if (users.length === 0) {
      logWarning('No users found matching the criteria')
      return []
    }
    
    logInfo(`Found ${users.length} user(s) to process:`)
    
    for (const user of users) {
      console.log(`  - ${user.name || 'Unnamed'} (${user.phoneNumber}) [${user.role}] - ID: ${user.id}`)
    }
    
    return users
  } catch (error) {
    logError(`Failed to get user stats: ${error.message}`)
    return []
  }
}

async function getDataStats(userIds) {
  try {
    const stats = {}
    
    // Count data for each table
    const tables = [
      { name: 'Orders', model: Order, field: 'userId' },
      { name: 'OrderItems', model: OrderItem, field: 'userId', include: [{ model: Order, as: 'order', where: { userId: { [Op.in]: userIds } } }] },
      { name: 'Carts', model: Cart, field: 'userId' },
      { name: 'CartItems', model: CartItem, field: 'userId', include: [{ model: Cart, as: 'cart', where: { userId: { [Op.in]: userIds } } }] },
      { name: 'Payments', model: Payment, field: 'userId' },
      { name: 'OTPs', model: OTP, field: 'userId' },
      { name: 'AuditLogs', model: AuditLog, field: 'userId' }
    ]
    
    for (const table of tables) {
      try {
        let whereClause = {}
        let options = { where: whereClause }
        
        if (table.include) {
          options.include = table.include
          // For related data, we use include instead of direct where
          delete options.where
          options.where = {}
        } else {
          whereClause[table.field] = { [Op.in]: userIds }
        }
        
        const count = await table.model.count(options)
        stats[table.name] = count
      } catch (error) {
        logWarning(`Could not count ${table.name}: ${error.message}`)
        stats[table.name] = 'Error'
      }
    }
    
    return stats
  } catch (error) {
    logError(`Failed to get data stats: ${error.message}`)
    return {}
  }
}

async function deleteUserData(userIds) {
  const results = {
    success: [],
    errors: []
  }
  
  try {
    // Start transaction for data consistency
    const transaction = await User.sequelize.transaction()
    
    try {
      // Delete in proper order to respect foreign key constraints
      const deletionSteps = [
        {
          name: 'AuditLogs',
          action: async () => {
            const count = await AuditLog.destroy({
              where: { userId: { [Op.in]: userIds } },
              transaction
            })
            return count
          }
        },
        {
          name: 'OTPs',
          action: async () => {
            const count = await OTP.destroy({
              where: { userId: { [Op.in]: userIds } },
              transaction
            })
            return count
          }
        },
        {
          name: 'CartItems (via Cart relation)',
          action: async () => {
            // Get cart IDs first
            const carts = await Cart.findAll({
              where: { userId: { [Op.in]: userIds } },
              attributes: ['id'],
              transaction
            })
            const cartIds = carts.map(cart => cart.id)
            
            if (cartIds.length === 0) return 0
            
            const count = await CartItem.destroy({
              where: { cartId: { [Op.in]: cartIds } },
              transaction
            })
            return count
          }
        },
        {
          name: 'Carts',
          action: async () => {
            const count = await Cart.destroy({
              where: { userId: { [Op.in]: userIds } },
              transaction
            })
            return count
          }
        },
        {
          name: 'OrderItems (via Order relation)',
          action: async () => {
            // Get order IDs first
            const orders = await Order.findAll({
              where: { userId: { [Op.in]: userIds } },
              attributes: ['id'],
              transaction
            })
            const orderIds = orders.map(order => order.id)
            
            if (orderIds.length === 0) return 0
            
            const count = await OrderItem.destroy({
              where: { orderId: { [Op.in]: orderIds } },
              transaction
            })
            return count
          }
        },
        {
          name: 'Payments',
          action: async () => {
            const count = await Payment.destroy({
              where: { userId: { [Op.in]: userIds } },
              transaction
            })
            return count
          }
        },
        {
          name: 'Orders',
          action: async () => {
            const count = await Order.destroy({
              where: { userId: { [Op.in]: userIds } },
              transaction
            })
            return count
          }
        },
        {
          name: 'Users',
          action: async () => {
            const count = await User.destroy({
              where: { id: { [Op.in]: userIds } },
              transaction
            })
            return count
          }
        }
      ]
      
      // Execute deletion steps
      for (const step of deletionSteps) {
        try {
          const deletedCount = await step.action()
          results.success.push(`${step.name}: ${deletedCount} records deleted`)
          
          if (config.dryRun) {
            logInfo(`[DRY RUN] Would delete ${deletedCount} records from ${step.name}`)
          } else {
            logSuccess(`Deleted ${deletedCount} records from ${step.name}`)
          }
        } catch (error) {
          const errorMsg = `Failed to delete ${step.name}: ${error.message}`
          results.errors.push(errorMsg)
          logError(errorMsg)
        }
      }
      
      if (config.dryRun) {
        await transaction.rollback()
        logInfo('[DRY RUN] Transaction rolled back - no actual changes made')
      } else {
        await transaction.commit()
        logSuccess('All deletions committed successfully')
      }
      
    } catch (error) {
      await transaction.rollback()
      throw error
    }
    
  } catch (error) {
    const errorMsg = `Transaction failed: ${error.message}`
    results.errors.push(errorMsg)
    logError(errorMsg)
  }
  
  return results
}

async function main() {
  logSection('Database User Data Cleanup Script')
  
  // Validate arguments
  if (!config.confirm && !config.dryRun) {
    logError('You must use either --confirm or --dry-run flag')
    logInfo('Use --dry-run to see what would be deleted without making changes')
    logInfo('Use --confirm to actually delete the data (IRREVERSIBLE!)')
    process.exit(1)
  }
  
  if (config.confirm && config.dryRun) {
    logError('Cannot use both --confirm and --dry-run flags together')
    process.exit(1)
  }
  
  // Show configuration
  logSection('Configuration')
  logInfo(`Mode: ${config.dryRun ? 'DRY RUN' : 'LIVE DELETION'}`)
  logInfo(`Exclude admins: ${config.excludeAdmins ? 'Yes' : 'No'}`)
  logInfo(`Specific user: ${config.specificUser || 'All users'}`)
  
  if (config.confirm) {
    logWarning('⚠️  LIVE DELETION MODE - DATA WILL BE PERMANENTLY DELETED! ⚠️')
  }
  
  // Validate database connection
  logSection('Database Validation')
  const dbValid = await validateDatabase()
  if (!dbValid) {
    process.exit(1)
  }
  
  // Get users to delete
  logSection('User Analysis')
  const users = await getUserStats()
  if (users.length === 0) {
    process.exit(0)
  }
  
  const userIds = users.map(user => user.id)
  
  // Get data statistics
  logSection('Data Analysis')
  const stats = await getDataStats(userIds)
  
  logInfo('Data to be deleted:')
  for (const [table, count] of Object.entries(stats)) {
    if (count === 'Error') {
      logWarning(`  ${table}: Unable to count`)
    } else {
      console.log(`  ${table}: ${count} records`)
    }
  }
  
  // Final confirmation for live deletion
  if (config.confirm) {
    logSection('Final Confirmation')
    logWarning('This will PERMANENTLY DELETE all the data shown above!')
    logWarning('This action cannot be undone!')
    
    // Add a 5-second delay for safety
    logInfo('Starting deletion in 5 seconds...')
    for (let i = 5; i > 0; i--) {
      process.stdout.write(`\r${i}... `)
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    console.log('\n')
  }
  
  // Perform deletion
  logSection(config.dryRun ? 'Dry Run Results' : 'Deletion Results')
  const results = await deleteUserData(userIds)
  
  // Summary
  logSection('Summary')
  logSuccess(`Successfully processed ${results.success.length} operations`)
  if (results.errors.length > 0) {
    logError(`Encountered ${results.errors.length} error(s)`)
    results.errors.forEach(error => logError(`  ${error}`))
  }
  
  if (config.dryRun) {
    logInfo('This was a dry run - no actual data was deleted')
    logInfo('Use --confirm flag to perform actual deletion')
  } else {
    logSuccess('User data cleanup completed!')
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logError('\nScript interrupted by user')
  process.exit(1)
})

process.on('unhandledRejection', (error) => {
  logError(`Unhandled error: ${error.message}`)
  process.exit(1)
})

// Run the script
main().catch(error => {
  logError(`Script failed: ${error.message}`)
  console.error(error)
  process.exit(1)
})
