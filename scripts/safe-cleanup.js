#!/usr/bin/env node

/**
 * Safe Database Cleanup Script
 * 
 * This script safely deletes user data by first creating a backup.
 * 
 * Usage:
 *   node scripts/safe-cleanup.js [options]
 * 
 * Options:
 *   --confirm                    Required flag to confirm deletion
 *   --dry-run                   Show what would be deleted without actually deleting
 *   --skip-backup              Skip backup creation (not recommended)
 *   --backup-dir <path>        Custom backup directory
 *   --specific-user <id>       Clean data for specific user only
 *   --test-users-only          Clean only test users
 *   --old-orders <days>        Clean orders older than specified days
 *   --cancelled-orders-only    Clean only cancelled orders
 *   --completed-orders-only    Clean only completed orders
 * 
 * Examples:
 *   node scripts/safe-cleanup.js --dry-run --test-users-only
 *   node scripts/safe-cleanup.js --confirm --old-orders 90
 *   node scripts/safe-cleanup.js --confirm --specific-user "user-123"
 */

const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs').promises

// Configuration from command line arguments
const config = {
  dryRun: process.argv.includes('--dry-run'),
  confirm: process.argv.includes('--confirm'),
  skipBackup: process.argv.includes('--skip-backup'),
  testUsersOnly: process.argv.includes('--test-users-only'),
  cancelledOrdersOnly: process.argv.includes('--cancelled-orders-only'),
  completedOrdersOnly: process.argv.includes('--completed-orders-only'),
  backupDir: null,
  specificUser: null,
  oldOrders: null
}

// Parse additional arguments
const backupDirIndex = process.argv.indexOf('--backup-dir')
if (backupDirIndex !== -1 && process.argv[backupDirIndex + 1]) {
  config.backupDir = process.argv[backupDirIndex + 1]
}

const specificUserIndex = process.argv.indexOf('--specific-user')
if (specificUserIndex !== -1 && process.argv[specificUserIndex + 1]) {
  config.specificUser = process.argv[specificUserIndex + 1]
}

const oldOrdersIndex = process.argv.indexOf('--old-orders')
if (oldOrdersIndex !== -1 && process.argv[oldOrdersIndex + 1]) {
  config.oldOrders = parseInt(process.argv[oldOrdersIndex + 1])
}

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
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

async function createBackup() {
  if (config.skipBackup) {
    logWarning('Skipping backup as requested')
    return null
  }
  
  logSection('Creating Backup')
  
  try {
    const backupArgs = ['node', 'scripts/backup-user-data.js']
    
    if (config.backupDir) {
      backupArgs.push('--output', config.backupDir)
    }
    
    if (config.specificUser) {
      backupArgs.push('--user-id', config.specificUser)
    }
    
    backupArgs.push('--format', 'json', '--compress')
    
    logInfo(`Running backup command: ${backupArgs.join(' ')}`)
    
    const result = execSync(backupArgs.join(' '), { 
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: 'pipe'
    })
    
    logSuccess('Backup completed successfully')
    console.log(result)
    
    return true
  } catch (error) {
    logError(`Backup failed: ${error.message}`)
    if (error.stdout) console.log(error.stdout)
    if (error.stderr) console.error(error.stderr)
    throw error
  }
}

async function performCleanup() {
  logSection('Performing Cleanup')
  
  try {
    let cleanupArgs = []
    
    if (config.testUsersOnly || config.oldOrders || config.cancelledOrdersOnly || config.completedOrdersOnly) {
      // Use selective cleanup script
      cleanupArgs = ['node', 'scripts/selective-cleanup.js']
      
      if (config.testUsersOnly) {
        cleanupArgs.push('--test-users-only')
      }
      
      if (config.oldOrders) {
        cleanupArgs.push('--old-data', config.oldOrders.toString())
      }
      
      if (config.cancelledOrdersOnly) {
        cleanupArgs.push('--cancelled-orders')
      }
      
      if (config.completedOrdersOnly) {
        cleanupArgs.push('--completed-orders')
      }
      
    } else {
      // Use main cleanup script
      cleanupArgs = ['node', 'scripts/delete-user-data.js']
      
      if (config.specificUser) {
        cleanupArgs.push('--specific-user', config.specificUser)
      }
    }
    
    if (config.dryRun) {
      cleanupArgs.push('--dry-run')
    } else {
      cleanupArgs.push('--confirm')
    }
    
    logInfo(`Running cleanup command: ${cleanupArgs.join(' ')}`)
    
    const result = execSync(cleanupArgs.join(' '), { 
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: 'pipe'
    })
    
    logSuccess('Cleanup completed successfully')
    console.log(result)
    
    return true
  } catch (error) {
    logError(`Cleanup failed: ${error.message}`)
    if (error.stdout) console.log(error.stdout)
    if (error.stderr) console.error(error.stderr)
    throw error
  }
}

async function validateScripts() {
  const requiredScripts = [
    'scripts/backup-user-data.js',
    'scripts/delete-user-data.js',
    'scripts/selective-cleanup.js'
  ]
  
  for (const script of requiredScripts) {
    try {
      await fs.access(script)
    } catch (error) {
      logError(`Required script not found: ${script}`)
      return false
    }
  }
  
  return true
}

async function main() {
  logSection('Safe Database Cleanup Script')
  
  // Validate arguments
  if (!config.confirm && !config.dryRun) {
    logError('You must use either --confirm or --dry-run flag')
    process.exit(1)
  }
  
  if (config.confirm && config.dryRun) {
    logError('Cannot use both --confirm and --dry-run flags together')
    process.exit(1)
  }
  
  // Validate required scripts exist
  const scriptsValid = await validateScripts()
  if (!scriptsValid) {
    process.exit(1)
  }
  
  // Show configuration
  logSection('Configuration')
  logInfo(`Mode: ${config.dryRun ? 'DRY RUN' : 'LIVE CLEANUP'}`)
  logInfo(`Skip backup: ${config.skipBackup}`)
  logInfo(`Backup directory: ${config.backupDir || 'Default (./backups)'}`)
  logInfo(`Test users only: ${config.testUsersOnly}`)
  logInfo(`Cancelled orders only: ${config.cancelledOrdersOnly}`)
  logInfo(`Completed orders only: ${config.completedOrdersOnly}`)
  logInfo(`Old orders threshold: ${config.oldOrders ? `${config.oldOrders} days` : 'None'}`)
  logInfo(`Specific user: ${config.specificUser || 'None'}`)
  
  if (config.confirm && !config.skipBackup) {
    logWarning('LIVE CLEANUP MODE - Data will be permanently deleted!')
    logInfo('A backup will be created first for safety.')
  }
  
  try {
    // Step 1: Create backup (unless skipped or dry run)
    if (!config.dryRun && !config.skipBackup) {
      await createBackup()
    } else if (config.dryRun) {
      logInfo('Skipping backup for dry run')
    }
    
    // Step 2: Perform cleanup
    await performCleanup()
    
    // Step 3: Summary
    logSection('Summary')
    if (config.dryRun) {
      logInfo('Dry run completed - no actual changes made')
      logInfo('Use --confirm to perform actual cleanup')
    } else {
      logSuccess('Safe cleanup completed successfully!')
      if (!config.skipBackup) {
        logSuccess('Backup was created before deletion')
      }
    }
    
  } catch (error) {
    logSection('Error Summary')
    logError(`Safe cleanup failed: ${error.message}`)
    
    if (!config.skipBackup && !config.dryRun) {
      logInfo('If backup was created, your data is still safe in the backup files')
    }
    
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logError('\nScript interrupted by user')
  process.exit(1)
})

// Run the script
main().catch(error => {
  logError(`Script failed: ${error.message}`)
  console.error(error)
  process.exit(1)
})
