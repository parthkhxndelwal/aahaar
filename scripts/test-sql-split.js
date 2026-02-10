/**
 * Test SQL splitting for migration
 */

const fs = require('fs')
const path = require('path')

// Read migration SQL file
const migrationPath = path.join(__dirname, '..', 'migrations', 'add-onboarding-tracking-to-vendors.sql')
const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

console.log('Raw SQL:')
console.log('='.repeat(50))
console.log(migrationSQL)
console.log('='.repeat(50))

// Split SQL commands (remove comments and empty lines)
const commands = migrationSQL
  .split(';')
  .map(cmd => cmd.trim())
  .filter(cmd => cmd && !cmd.startsWith('--') && cmd.length > 10)
  .map(cmd => cmd.replace(/\n\s*--.*$/gm, '').trim()) // Remove inline comments
  .filter(cmd => cmd.length > 10)

console.log(`\nFound ${commands.length} commands:`)
commands.forEach((cmd, i) => {
  console.log(`\nCommand ${i + 1}:`)
  console.log('-'.repeat(30))
  console.log(cmd)
})
