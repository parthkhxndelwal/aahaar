# Database Clearing Scripts

This directory contains scripts to clear data from the database while preserving table structures.

## Available Scripts

### 1. Interactive Clear Script (`clear-database.js`)
The safest option with confirmation prompts and detailed logging.

```bash
# Run with confirmation prompts
node scripts/clear-database.js

# Specify environment
node scripts/clear-database.js production

# Using npm script
npm run db:clear
```

**Features:**
- ✅ Requires confirmation before deletion
- ✅ Shows before/after record counts
- ✅ Detailed logging and error handling
- ✅ Works with all environments

### 2. Quick Clear Script (`clear-database-quick.js`)
Fast clearing without prompts - ideal for development.

```bash
# Quick clear without prompts
node scripts/clear-database-quick.js

# Using npm scripts
npm run db:clear:quick
npm run db:clear:dev  # Forces development environment
```

**Features:**
- ⚡ Fast execution
- ⚠️  No confirmation prompts
- ✅ Minimal logging

### 3. Selective Clear Script (`clear-database-selective.js`)
Clear specific groups of tables.

```bash
# Clear specific data types
node scripts/clear-database-selective.js --orders
node scripts/clear-database-selective.js --carts
node scripts/clear-database-selective.js --users
node scripts/clear-database-selective.js --vendors
node scripts/clear-database-selective.js --logs

# Clear multiple types at once
node scripts/clear-database-selective.js --orders --carts

# Clear everything
node scripts/clear-database-selective.js --all

# Using npm scripts
npm run db:clear:selective -- --orders
npm run db:clear:orders    # Shortcut for clearing orders
npm run db:clear:carts     # Shortcut for clearing carts
```

**Available Options:**
- `--orders`: Order-related data (OrderItem, Payment, Order)
- `--carts`: Cart-related data (CartItem, Cart)
- `--users`: User data (User, OTP)
- `--vendors`: Vendor data (MenuItem, MenuCategory, Vendor)
- `--logs`: Audit logs
- `--settings`: Court settings
- `--courts`: Court data (requires clearing dependent data first)
- `--all`: All data
- `--help`: Show help message

## Table Deletion Order

The scripts handle foreign key constraints by deleting tables in this order:

1. **OrderItem** - Order line items
2. **CartItem** - Cart line items  
3. **Payment** - Payment records
4. **Order** - Orders
5. **Cart** - Shopping carts
6. **OTP** - One-time passwords
7. **AuditLog** - Audit trail
8. **MenuItem** - Menu items
9. **MenuCategory** - Menu categories
10. **Vendor** - Vendor profiles
11. **User** - User accounts
12. **CourtSettings** - Court configuration
13. **Court** - Court/location data

## Safety Features

- 🔒 **Foreign Key Handling**: Temporarily disables FK checks during deletion
- 🛡️ **Environment Awareness**: Shows which database will be affected
- 📊 **Record Counting**: Shows before/after counts
- ⚠️ **Confirmation Prompts**: Interactive script requires explicit confirmation
- 🔄 **Rollback Safety**: Uses transactions where possible

## Environment Configuration

Scripts respect the `NODE_ENV` environment variable and use the corresponding database configuration from `config/database.js`.

```bash
# Development (default)
NODE_ENV=development npm run db:clear:quick

# Production (use with extreme caution!)
NODE_ENV=production npm run db:clear
```

## Warning ⚠️

**These scripts permanently delete data!** 

- Always backup your database before running in production
- Test scripts in development environment first
- Use the interactive script (`clear-database.js`) for production
- Double-check your environment variables

## Examples

```bash
# Safe development workflow
npm run db:clear:dev

# Clear only user orders for testing
npm run db:clear:orders

# Full interactive clear with confirmations
npm run db:clear

# Clear multiple data types
npm run db:clear:selective -- --orders --carts --logs

# Get help on selective clearing
node scripts/clear-database-selective.js --help
```

## Troubleshooting

### Foreign Key Constraint Errors
If you encounter FK constraint errors:
1. Ensure MySQL user has permissions to disable FK checks
2. Check that all model relationships are properly defined
3. Verify the deletion order in the script

### Connection Errors
1. Check your `.env` file configuration
2. Ensure database server is running
3. Verify network connectivity to database host

### Permission Errors
1. Ensure database user has DELETE privileges
2. For production databases, may need SUPER privileges to disable FK checks
