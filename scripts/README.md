# Database Cleanup Scripts

This directory contains scripts for safely managing and cleaning up user data from the database.

## ⚠️ IMPORTANT WARNING

These scripts can permanently delete data from your database. Always:
1. Test with `--dry-run` first
2. Create backups before running cleanup operations
3. Use these scripts only on development/staging environments unless absolutely necessary

## Database Wipe Scripts

### Complete Database Wipe Scripts

**Use these scripts with extreme caution as they permanently delete ALL data.**

#### 1. Basic Wipe Script (`wipe-database.js`)
Simple script that deletes all data from all tables in the correct order to handle foreign key constraints.

```bash
npm run db:wipe
```

#### 2. Advanced Wipe Script (`wipe-database-advanced.js`)
Enhanced script with additional safety features, dry-run capability, and detailed logging.

```bash
npm run db:wipe:advanced
npm run db:wipe:dry-run  # Safe dry-run mode
```

##### Advanced Script Options:
- `--dry-run, -d`: Show what would be deleted without actually deleting
- `--force, -f`: Skip confirmation prompt (use with caution!)
- `--quiet, -q`: Reduce output (errors still shown)
- `--help, -h`: Show help message

##### Examples:
```bash
# Safe dry run to see what would be deleted
npm run db:wipe:advanced -- --dry-run

# Force delete without confirmation (dangerous!)
npm run db:wipe:advanced -- --force

# Quiet mode with minimal output
npm run db:wipe:advanced -- --quiet

# Show help
npm run db:wipe:advanced -- --help
```

### Database Tables (Deletion Order)

The wipe scripts delete tables in this order to respect foreign key constraints:

#### Child Tables (Deleted First):
1. **audit_logs** - System audit logs
2. **otps** - One-time passwords for verification
3. **cart_items** - Individual items in shopping carts
4. **order_items** - Individual items in orders
5. **payments** - Payment records
6. **orders** - Customer orders
7. **menu_items** - Vendor menu items
8. **menu_categories** - Menu categories
9. **carts** - Shopping carts

#### Parent Tables (Deleted After Dependencies):
10. **vendors** - Vendor/stall information
11. **users** - User accounts (customers, vendors, admins)
12. **court_settings** - Court-specific settings
13. **courts** - Court/institution information

### Safety Features

#### Basic Wipe Script:
- ✅ Interactive confirmation prompt
- ✅ Connection verification
- ✅ Foreign key constraint handling
- ✅ Post-deletion verification
- ✅ Graceful error handling
- ✅ Auto-increment reset (MySQL)

#### Advanced Wipe Script:
- ✅ All basic script features
- ✅ **Dry-run mode** for safe testing
- ✅ Detailed logging with timestamps
- ✅ Pre-deletion database analysis
- ✅ Backup information generation
- ✅ Command-line options
- ✅ Force mode for automation
- ✅ Quiet mode for scripts
- ✅ Progress tracking

### Environment Safety

The wipe scripts respect your `NODE_ENV` setting:
- **development**: Uses development database
- **production**: Uses production database
- **test**: Uses test database

⚠️ **Always double-check your environment before running these scripts!**

### Usage Examples

#### Safe Testing (Recommended):
```bash
# 1. First, see what would be deleted
npm run db:wipe:dry-run

# 2. If satisfied, run the actual wipe
npm run db:wipe:advanced
```

#### Automated Scripts:
```bash
# For CI/CD or automated testing
npm run db:wipe:advanced -- --force --quiet
```

#### Manual Verification:
```bash
# Basic wipe with manual confirmation
npm run db:wipe
```

### WARNING ⚠️

**The wipe scripts permanently delete ALL data from your database.**

- ❌ No built-in backup creation
- ❌ No data recovery mechanism
- ❌ No partial deletion options
- ❌ No rollback capability

**Always ensure you have proper backups before running these scripts!**
4. Double-check your command line arguments

## Scripts Overview

### 1. `safe-cleanup.js` (Recommended)
The safest way to clean up data. Automatically creates backups before deletion.

```bash
# Test what would be deleted
node scripts/safe-cleanup.js --dry-run --test-users-only

# Clean test users (with backup)
node scripts/safe-cleanup.js --confirm --test-users-only

# Clean old orders (90+ days old)
node scripts/safe-cleanup.js --confirm --old-orders 90

# Clean specific user data
node scripts/safe-cleanup.js --confirm --specific-user "user-123"
```

### 2. `delete-user-data.js` (Main cleanup)
Comprehensive user data deletion script.

```bash
# Test deletion (dry run)
node scripts/delete-user-data.js --dry-run

# Delete all user data (DANGEROUS!)
node scripts/delete-user-data.js --confirm

# Delete all users except admins
node scripts/delete-user-data.js --confirm --exclude-admins

# Delete specific user
node scripts/delete-user-data.js --confirm --specific-user "user-123"
```

### 3. `selective-cleanup.js` (Targeted cleanup)
More granular control over what gets deleted.

```bash
# Clean only orders and related data
node scripts/selective-cleanup.js --confirm --orders-only

# Clean only cart data
node scripts/selective-cleanup.js --confirm --carts-only

# Clean cancelled orders
node scripts/selective-cleanup.js --confirm --cancelled-orders

# Clean completed orders
node scripts/selective-cleanup.js --confirm --completed-orders

# Clean data older than 30 days
node scripts/selective-cleanup.js --confirm --old-data 30

# Clean test users only
node scripts/selective-cleanup.js --confirm --test-users-only
```

### 4. `backup-user-data.js` (Backup only)
Create backups without deleting anything.

```bash
# Backup all user data
node scripts/backup-user-data.js

# Backup specific user
node scripts/backup-user-data.js --user-id "user-123"

# Backup to custom directory
node scripts/backup-user-data.js --output ./my-backups

# Create compressed backup
node scripts/backup-user-data.js --compress

# Create SQL format backup
node scripts/backup-user-data.js --format sql
```

## Common Use Cases

### Development Environment Reset
```bash
# Backup everything first
node scripts/backup-user-data.js --compress

# Clean all data except admins
node scripts/delete-user-data.js --confirm --exclude-admins
```

### Test Data Cleanup
```bash
# Clean only test users (phone numbers starting with 'test')
node scripts/safe-cleanup.js --confirm --test-users-only
```

### Old Data Cleanup
```bash
# Clean orders older than 6 months
node scripts/safe-cleanup.js --confirm --old-orders 180
```

### Specific User Cleanup
```bash
# Remove specific user and all their data
node scripts/safe-cleanup.js --confirm --specific-user "user-123"
```

## Command Line Flags

### Common Flags
- `--confirm` - Required for actual deletion (safety measure)
- `--dry-run` - Show what would be deleted without deleting
- `--specific-user <id>` - Target specific user ID
- `--exclude-admins` - Keep admin users and their data

### Data Selection Flags
- `--test-users-only` - Only users with test phone numbers
- `--old-data <days>` - Data older than specified days
- `--cancelled-orders` - Only cancelled orders
- `--completed-orders` - Only completed orders
- `--orders-only` - Only order-related data
- `--carts-only` - Only cart-related data

### Backup Flags
- `--skip-backup` - Skip backup creation (not recommended)
- `--backup-dir <path>` - Custom backup directory
- `--output <path>` - Output directory for backups
- `--format <json|sql>` - Backup format
- `--compress` - Compress backup files

## Safety Features

### Dry Run Mode
All scripts support `--dry-run` to preview operations:
```bash
node scripts/delete-user-data.js --dry-run
```

### Automatic Backups
The `safe-cleanup.js` script automatically creates backups:
```bash
node scripts/safe-cleanup.js --confirm --test-users-only
# Creates backup in ./backups/ before deletion
```

### Transaction Safety
All deletion operations use database transactions to ensure data consistency.

### Confirmation Requirements
Live deletion requires explicit `--confirm` flag to prevent accidents.

## Data Deletion Order

Scripts follow proper foreign key constraints by deleting in this order:
1. AuditLogs
2. OTPs  
3. CartItems
4. Carts
5. OrderItems
6. Payments
7. Orders
8. Users

## Backup Storage

Backups are stored in:
- Default: `./backups/` directory
- Custom: Use `--output` or `--backup-dir` flags
- Format: JSON (default) or SQL
- Compression: Optional with `--compress` flag

## Error Handling

- All operations use database transactions
- Detailed error logging with colored output
- Graceful rollback on failures
- Summary reports of operations

## Examples by Environment

### Local Development
```bash
# Quick test data reset
node scripts/safe-cleanup.js --confirm --test-users-only
```

### Staging Environment
```bash
# Clean old completed orders
node scripts/safe-cleanup.js --confirm --completed-orders-only --old-orders 30
```

### Production (Use with extreme caution!)
```bash
# Backup everything first
node scripts/backup-user-data.js --compress

# Clean only very old cancelled orders
node scripts/selective-cleanup.js --confirm --cancelled-orders --old-data 365
```

## Troubleshooting

### Permission Errors
Ensure the Node.js process has write permissions to the backup directory.

### Database Connection Issues
Check your `.env` file for correct database credentials.

### Foreign Key Constraint Errors
Scripts handle this automatically, but custom databases might need schema adjustments.

### Out of Memory
For large datasets, consider using `--specific-user` to process users individually.

## Recovery

If you accidentally delete data:
1. Check the `./backups/` directory for recent backups
2. Use the backup files to restore data
3. SQL backups can be imported directly
4. JSON backups can be processed with custom scripts

## Contributing

When modifying these scripts:
1. Always test with `--dry-run` first
2. Add proper error handling
3. Use database transactions
4. Update this documentation
5. Test with various data scenarios

---

**Remember: These scripts are powerful tools. Always backup your data and test thoroughly before use in production environments.**
