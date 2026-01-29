# Database Migration Guide

This guide explains how to migrate data from your local MySQL database to TiDB Cloud.

## Prerequisites

1. Ensure both databases are accessible
2. Install required dependencies: `npm install`
3. Set up environment variables in `.env` file

## Database Configurations

### Local MySQL Database
- **Host**: localhost
- **Port**: 3306
- **Database**: aahaar_dev
- **Username**: root
- **Password**: 12345

### TiDB Cloud Database
- **Host**: gateway01.ap-southeast-1.prod.aws.tidbcloud.com
- **Port**: 4000
- **Database**: test
- **Username**: SqeBMotKL3tqK77.root
- **Password**: kwsJJcZhk4US7vnN

## Migration Process

### Step 1: Test Database Connections
Before starting migration, test both database connections:

```bash
node scripts/migrate-to-tidb.js test
```

### Step 2: Create Backup (Recommended)
Create a backup of your local database before migration:

```bash
node scripts/backup-local-db.js
```

This will create a SQL dump file in the `backups/` directory. The script uses Sequelize to create the backup, so it doesn't require mysqldump to be installed.

### Step 3: Run Migration
Execute the migration script (this will clear all TiDB data first, then migrate):

```bash
node scripts/migrate-to-tidb.js migrate
```

**⚠️ Important**: The migration script now automatically clears ALL data from the TiDB database before migration to ensure a clean transfer. This uses Sequelize models to safely handle foreign key constraints.

### Step 4: Verify Migration
Check the migration results:

```bash
node scripts/migrate-to-tidb.js summary
```

## Migration Features

### ✅ What the Migration Script Does:
- Tests connections to both databases
- **Clears ALL data from TiDB database first** (using Sequelize models)
- Creates tables in TiDB Cloud if they don't exist
- Migrates data in correct order (respecting foreign key constraints)
- Handles large datasets with batch processing
- Provides detailed logging and progress updates
- Handles SSL connections for TiDB Cloud

### 🆕 Additional Commands:
- `clear` - Only clear TiDB database without migration
- `migrate` - Clear TiDB and run full migration
- `summary` - Compare record counts between databases
- `test` - Test database connections

### 📋 Migration Order:
The script migrates tables in this order to respect foreign key constraints:
1. Courts
2. Users
3. Vendors
4. MenuCategories
5. MenuItems
6. Orders
7. OrderItems
8. Payments
9. AuditLogs
10. CourtSettings

### 🔧 Customization Options:

#### To Only Clear Database (without migration):
```bash
node scripts/migrate-to-tidb.js clear
```

#### To Change Batch Size:
Modify the `batchSize` variable in the migration script:
```javascript
const batchSize = 1000; // Change this value
```

#### Database Clearing Process:
The script uses Sequelize models to safely clear data in reverse dependency order:
1. AuditLog → CourtSettings → Payment → OrderItem → Order
2. MenuItem → MenuCategory → Vendor → User → Court

## Troubleshooting

### Common Issues:

1. **Connection Timeout**
   - Increase the `acquire` timeout in pool configuration
   - Check network connectivity

2. **SSL Connection Errors**
   - Ensure TiDB Cloud credentials are correct
   - Verify SSL configuration in database config

3. **Foreign Key Constraints**
   - The script temporarily disables foreign key checks
   - Tables are migrated in dependency order

4. **Large Dataset Issues**
   - Increase batch size for faster processing
   - Monitor memory usage during migration

### Error Recovery:
If migration fails partway through:
1. Check the error message in console output
2. Fix the specific issue (e.g., data type mismatch)
3. Re-run the migration (it will clear and re-populate tables)

## Post-Migration Steps

1. **Update Application Configuration**
   - Update `NODE_ENV` to use production database
   - Verify all environment variables are set correctly

2. **Test Application**
   - Run your application against TiDB Cloud
   - Test all major functionalities
   - Verify data integrity

3. **Monitor Performance**
   - Check query performance on TiDB Cloud
   - Monitor connection pool usage
   - Adjust pool settings if needed

## Files Created

- `scripts/migrate-to-tidb.js` - Main migration script
- `scripts/backup-local-db.js` - Local database backup script
- `backups/` - Directory for database backups (created automatically)

## Environment Variables Required

Ensure these variables are set in your `.env` file:
```
DB_NAME=test
DB_USERNAME=SqeBMotKL3tqK77.root
DB_PASSWORD=kwsJJcZhk4US7vnN
DB_HOST=gateway01.ap-southeast-1.prod.aws.tidbcloud.com
DB_PORT=4000
```

## Security Notes

- The migration script uses SSL connections for TiDB Cloud
- Local database backup files contain sensitive data - store securely
- Consider rotating database passwords after migration
- Remove or secure the migration scripts in production

## Support

If you encounter issues during migration:
1. Check the console output for detailed error messages
2. Verify database credentials and connectivity
3. Ensure all required dependencies are installed
4. Check TiDB Cloud documentation for any specific requirements
