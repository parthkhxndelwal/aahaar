#!/usr/bin/env node

/**
 * Database Backup Script
 * 
 * Creates a backup of the database before clearing it.
 * Useful for creating restore points.
 * 
 * Usage:
 * node scripts/backup-database.js [options]
 * 
 * Options:
 * --output-dir   Directory to save backup files (default: ./backups)
 * --clear-after  Clear database after creating backup
 * --help         Show help message
 */

require("dotenv").config()
const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const { promisify } = require('util')

const execAsync = promisify(exec)

const args = process.argv.slice(2)

function showHelp() {
  console.log(`
📖 Database Backup Script Help

Usage: node scripts/backup-database.js [options]

Options:
  --output-dir DIR   Directory to save backup files (default: ./backups)
  --clear-after      Clear database after creating backup  
  --help             Show this help message

Examples:
  node scripts/backup-database.js
  node scripts/backup-database.js --output-dir ./my-backups
  node scripts/backup-database.js --clear-after
  `)
}

function parseArguments() {
  if (args.includes('--help')) {
    showHelp()
    process.exit(0)
  }
  
  const outputDirIndex = args.indexOf('--output-dir')
  const outputDir = outputDirIndex !== -1 && args[outputDirIndex + 1] 
    ? args[outputDirIndex + 1] 
    : './backups'
  
  return {
    outputDir,
    clearAfter: args.includes('--clear-after')
  }
}

async function createBackup() {
  const options = parseArguments()
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                   new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].split('.')[0]
  
  try {
    console.log('🚀 Database backup starting...')
    
    // Get database configuration
    const dbHost = process.env.DB_HOST || 'localhost'
    const dbPort = process.env.DB_PORT || 3306
    const dbUser = process.env.DB_USERNAME || 'root'
    const dbPassword = process.env.DB_PASSWORD || ''
    const dbName = process.env.DB_NAME || 'aahaar_dev'
    const environment = process.env.NODE_ENV || 'development'
    
    console.log(`📊 Database: ${dbName} on ${dbHost}:${dbPort} (${environment})`)
    
    // Create backup directory if it doesn't exist
    if (!fs.existsSync(options.outputDir)) {
      fs.mkdirSync(options.outputDir, { recursive: true })
      console.log(`📁 Created backup directory: ${options.outputDir}`)
    }
    
    // Generate backup filename
    const backupFilename = `${dbName}_${environment}_${timestamp}.sql`
    const backupPath = path.join(options.outputDir, backupFilename)
    
    console.log(`💾 Creating backup: ${backupFilename}`)
    
    // Build mysqldump command
    let dumpCommand = `mysqldump`
    
    if (dbHost !== 'localhost') {
      dumpCommand += ` -h ${dbHost}`
    }
    
    if (dbPort !== 3306) {
      dumpCommand += ` -P ${dbPort}`
    }
    
    dumpCommand += ` -u ${dbUser}`
    
    if (dbPassword) {
      dumpCommand += ` -p${dbPassword}`
    }
    
    // Add SSL options if needed (for cloud databases)
    if (dbHost.includes('tidbcloud') || dbHost.includes('amazonaws.com') || dbHost.includes('digitalocean.com')) {
      dumpCommand += ' --ssl-mode=REQUIRED'
    }
    
    dumpCommand += ` --routines --triggers --single-transaction --add-drop-table`
    dumpCommand += ` ${dbName} > "${backupPath}"`
    
    // Execute backup
    console.log('⏳ Running mysqldump...')
    await execAsync(dumpCommand)
    
    // Check if backup file was created and has content
    if (fs.existsSync(backupPath)) {
      const stats = fs.statSync(backupPath)
      if (stats.size > 0) {
        console.log(`✅ Backup created successfully!`)
        console.log(`   File: ${backupPath}`)
        console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`)
      } else {
        throw new Error('Backup file is empty')
      }
    } else {
      throw new Error('Backup file was not created')
    }
    
    // Clear database if requested
    if (options.clearAfter) {
      console.log('\n🧹 Clearing database as requested...')
      const { spawn } = require('child_process')
      
      const clearProcess = spawn('node', ['scripts/clear-database-quick.js'], {
        stdio: 'inherit',
        cwd: process.cwd()
      })
      
      clearProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Database cleared successfully!')
        } else {
          console.log('❌ Error clearing database')
        }
      })
    }
    
    console.log('\n📋 Backup Summary:')
    console.log(`   Database: ${dbName} (${environment})`)
    console.log(`   File: ${backupPath}`)
    console.log(`   Timestamp: ${new Date().toISOString()}`)
    
  } catch (error) {
    console.error('❌ Backup failed:', error.message)
    
    if (error.message.includes('mysqldump')) {
      console.log('\n💡 Troubleshooting tips:')
      console.log('   • Ensure mysqldump is installed and in your PATH')
      console.log('   • Check database connection parameters')
      console.log('   • Verify database user has SELECT privileges')
    }
    
    process.exit(1)
  }
}

createBackup()
