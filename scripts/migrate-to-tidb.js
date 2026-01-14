const { Sequelize } = require("sequelize");
const mysql2 = require("mysql2");
require("dotenv").config();

// Local MySQL Database Configuration
const localConfig = {
  database: "aahaar_dev",
  username: "root",
  password: "12345",
  host: "localhost",
  port: 3306,
  dialect: "mysql",
  logging: console.log,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};

// TiDB Cloud Database Configuration
const tidbConfig = {
  database: process.env.DB_NAME,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 4000,
  dialect: "mysql",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  logging: console.log,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};

// Initialize Sequelize connections
const localSequelize = new Sequelize(
  localConfig.database,
  localConfig.username,
  localConfig.password,
  {
    host: localConfig.host,
    port: localConfig.port,
    dialect: localConfig.dialect,
    dialectModule: mysql2,
    logging: false, // Disable logging for cleaner output
    pool: localConfig.pool,
  }
);

const tidbSequelize = new Sequelize(
  tidbConfig.database,
  tidbConfig.username,
  tidbConfig.password,
  {
    host: tidbConfig.host,
    port: tidbConfig.port,
    dialect: tidbConfig.dialect,
    dialectModule: mysql2,
    dialectOptions: tidbConfig.dialectOptions,
    logging: false, // Disable logging for cleaner output
    pool: tidbConfig.pool,
  }
);

// Define the migration order (to respect foreign key constraints)
const migrationOrder = [
  "Courts",
  "Users",
  "Vendors",
  "MenuCategories",
  "MenuItems",
  "Orders",
  "OrderItems",
  "Payments",
  "AuditLogs",
  "CourtSettings",
];

// Function to test database connections
async function testConnections() {
  console.log("🔄 Testing database connections...");
  
  try {
    await localSequelize.authenticate();
    console.log("✅ Local MySQL connection established successfully.");
  } catch (error) {
    console.error("❌ Unable to connect to local MySQL database:", error.message);
    throw error;
  }

  try {
    await tidbSequelize.authenticate();
    console.log("✅ TiDB Cloud connection established successfully.");
  } catch (error) {
    console.error("❌ Unable to connect to TiDB Cloud database:", error.message);
    throw error;
  }
}

// Function to get all tables from local database
async function getLocalTables() {
  const [results] = await localSequelize.query("SHOW TABLES");
  return results.map(row => Object.values(row)[0]);
}

// Function to check if table exists in TiDB
async function tableExistsInTiDB(tableName) {
  try {
    const [results] = await tidbSequelize.query(`SHOW TABLES LIKE '${tableName}'`);
    return results.length > 0;
  } catch (error) {
    return false;
  }
}

// Function to get table structure
async function getTableStructure(sequelize, tableName) {
  const [results] = await sequelize.query(`DESCRIBE ${tableName}`);
  return results;
}

// Function to create table in TiDB if it doesn't exist
async function createTableInTiDB(tableName) {
  try {
    const [createTableQuery] = await localSequelize.query(`SHOW CREATE TABLE ${tableName}`);
    const createStatement = createTableQuery[0]["Create Table"];
    
    // Modify the CREATE TABLE statement for TiDB compatibility
    let tidbCreateStatement = createStatement
      .replace(/AUTO_INCREMENT=\d+/gi, "") // Remove AUTO_INCREMENT value
      .replace(/ENGINE=InnoDB/gi, "ENGINE=InnoDB"); // Ensure InnoDB engine
    
    await tidbSequelize.query(tidbCreateStatement);
    console.log(`✅ Table ${tableName} created in TiDB`);
  } catch (error) {
    console.error(`❌ Error creating table ${tableName}:`, error.message);
    throw error;
  }
}

// Function to clear all data from TiDB database
async function clearTiDBDatabase() {
  console.log("\n🗑️  Clearing all data from TiDB database...");
  console.log("=" .repeat(50));
  
  try {
    // Import Sequelize models from the application
    const models = require("../models");
    
    // Get all model names in reverse dependency order for safe deletion
    const modelNames = [
      "AuditLog",
      "CourtSettings", 
      "Payment",
      "OrderItem",
      "Order",
      "MenuItem",
      "MenuCategory",
      "Vendor",
      "User",
      "Court"
    ];

    // Disable foreign key checks
    await tidbSequelize.query("SET FOREIGN_KEY_CHECKS = 0");
    console.log("� Disabled foreign key checks");

    let totalDeleted = 0;

    // Clear each table using Sequelize models
    for (const modelName of modelNames) {
      try {
        if (models[modelName]) {
          // Get current count
          const currentCount = await models[modelName].count();
          
          if (currentCount > 0) {
            // Delete all records
            const deletedCount = await models[modelName].destroy({
              where: {},
              truncate: true,
              cascade: true,
              force: true
            });
            
            console.log(`🗑️  Cleared ${currentCount} records from ${modelName}`);
            totalDeleted += currentCount;
          } else {
            console.log(`ℹ️  Table ${modelName} is already empty`);
          }
        } else {
          console.log(`⚠️  Model ${modelName} not found, skipping...`);
        }
      } catch (error) {
        console.error(`❌ Error clearing ${modelName}:`, error.message);
        // Try with raw SQL as fallback using correct table names
        try {
          const tableNameMap = {
            'AuditLog': 'audit_logs',
            'CourtSettings': 'court_settings', 
            'Payment': 'payments',
            'OrderItem': 'order_items',
            'Order': 'orders',
            'MenuItem': 'menu_items',
            'MenuCategory': 'menu_categories',
            'Vendor': 'vendors',
            'User': 'users',
            'Court': 'courts'
          };
          
          const tableName = tableNameMap[modelName] || modelName.toLowerCase() + 's';
          await tidbSequelize.query(`DELETE FROM \`${tableName}\``);
          console.log(`🔄 Cleared ${modelName} using raw SQL fallback`);
        } catch (sqlError) {
          console.error(`❌ Fallback also failed for ${modelName}:`, sqlError.message);
        }
      }
    }

    // Re-enable foreign key checks
    await tidbSequelize.query("SET FOREIGN_KEY_CHECKS = 1");
    console.log("🔒 Re-enabled foreign key checks");
    
    console.log(`✅ Successfully cleared ${totalDeleted} total records from TiDB database`);
    console.log("=" .repeat(50));
    
  } catch (error) {
    console.error("❌ Error clearing TiDB database:", error.message);
    throw error;
  }
}

// Function to properly escape and format SQL values
function formatSQLValue(value) {
  if (value === null || value === undefined) {
    return "NULL";
  }
  
  if (typeof value === "string") {
    return `'${value.replace(/'/g, "''").replace(/\\/g, "\\\\")}'`;
  }
  
  if (value instanceof Date) {
    return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
  }
  
  if (typeof value === "boolean") {
    return value ? "1" : "0";
  }
  
  if (typeof value === "object") {
    // Handle JSON objects/arrays
    return `'${JSON.stringify(value).replace(/'/g, "''").replace(/\\/g, "\\\\")}'`;
  }
  
  if (typeof value === "number") {
    return value.toString();
  }
  
  // For any other type, convert to string and escape
  return `'${String(value).replace(/'/g, "''").replace(/\\/g, "\\\\")}'`;
}

// Function to migrate data for a specific table
async function migrateTableData(tableName) {
  console.log(`🔄 Migrating data for table: ${tableName}`);
  
  try {
    // Get data from local database
    const [localData] = await localSequelize.query(`SELECT * FROM ${tableName}`);
    
    if (localData.length === 0) {
      console.log(`ℹ️  No data found in table ${tableName}`);
      return;
    }

    console.log(`📊 Found ${localData.length} records in ${tableName}`);

    // Disable foreign key checks temporarily
    await tidbSequelize.query("SET FOREIGN_KEY_CHECKS = 0");

    // Insert data in batches
    const batchSize = 100; // Smaller batch size for better error handling
    let insertedCount = 0;

    for (let i = 0; i < localData.length; i += batchSize) {
      const batch = localData.slice(i, i + batchSize);
      
      // Get column names and escape them
      const columns = Object.keys(batch[0]);
      const columnNames = columns.map(col => `\`${col}\``).join(", ");
      
      // Prepare values with proper formatting
      const values = batch.map(row => {
        const rowValues = columns.map(col => {
          return formatSQLValue(row[col]);
        });
        return `(${rowValues.join(", ")})`;
      });

      const insertQuery = `INSERT INTO \`${tableName}\` (${columnNames}) VALUES ${values.join(", ")}`;
      
      try {
        await tidbSequelize.query(insertQuery);
        insertedCount += batch.length;
        console.log(`   📝 Inserted ${insertedCount}/${localData.length} records`);
      } catch (error) {
        console.error(`❌ Error inserting batch for ${tableName}:`, error.message);
        
        // Try inserting records one by one to identify problematic records
        console.log(`🔄 Attempting individual record insertion for batch...`);
        for (const row of batch) {
          try {
            const singleValues = columns.map(col => formatSQLValue(row[col]));
            const singleQuery = `INSERT INTO \`${tableName}\` (${columnNames}) VALUES (${singleValues.join(", ")})`;
            await tidbSequelize.query(singleQuery);
            insertedCount++;
          } catch (singleError) {
            console.error(`❌ Failed to insert record in ${tableName}:`, JSON.stringify(row, null, 2));
            console.error(`   Error:`, singleError.message);
          }
        }
        console.log(`   📝 Recovered: ${insertedCount}/${localData.length} records processed`);
      }
    }

    // Re-enable foreign key checks
    await tidbSequelize.query("SET FOREIGN_KEY_CHECKS = 1");

    console.log(`✅ Successfully migrated ${insertedCount} records for table ${tableName}`);
  } catch (error) {
    console.error(`❌ Error migrating table ${tableName}:`, error.message);
    throw error;
  }
}

// Main migration function
async function runMigration() {
  console.log("🚀 Starting database migration from Local MySQL to TiDB Cloud");
  console.log("=" .repeat(60));

  try {
    // Test connections
    await testConnections();

    // Clear all data from TiDB database first
    await clearTiDBDatabase();

    // Get all tables from local database
    const localTables = await getLocalTables();
    console.log(`📋 Found ${localTables.length} tables in local database:`, localTables);

    // Create tables in TiDB if they don't exist
    for (const tableName of localTables) {
      const exists = await tableExistsInTiDB(tableName);
      if (!exists) {
        console.log(`🔧 Creating table ${tableName} in TiDB...`);
        await createTableInTiDB(tableName);
      } else {
        console.log(`✅ Table ${tableName} already exists in TiDB`);
      }
    }

    // Migrate data in the correct order
    const tablesToMigrate = migrationOrder.filter(table => localTables.includes(table));
    const remainingTables = localTables.filter(table => !migrationOrder.includes(table));
    const allTablesToMigrate = [...tablesToMigrate, ...remainingTables];

    console.log("\n🔄 Starting data migration...");
    for (const tableName of allTablesToMigrate) {
      await migrateTableData(tableName);
    }

    console.log("\n🎉 Migration completed successfully!");
    console.log("=" .repeat(60));

  } catch (error) {
    console.error("\n💥 Migration failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    // Close connections
    await localSequelize.close();
    await tidbSequelize.close();
    console.log("🔒 Database connections closed");
  }
}

// Function to show migration summary
async function showMigrationSummary() {
  console.log("\n📊 Migration Summary:");
  console.log("=" .repeat(40));
  
  try {
    await testConnections();
    
    const localTables = await getLocalTables();
    
    for (const tableName of localTables) {
      try {
        const [localCount] = await localSequelize.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        const [tidbCount] = await tidbSequelize.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        
        const localRecords = localCount[0].count;
        const tidbRecords = tidbCount[0].count;
        const status = localRecords === tidbRecords ? "✅" : "⚠️";
        
        console.log(`${status} ${tableName}: ${localRecords} → ${tidbRecords}`);
      } catch (error) {
        console.log(`❌ ${tableName}: Error checking count`);
      }
    }
  } catch (error) {
    console.error("Error generating summary:", error.message);
  } finally {
    await localSequelize.close();
    await tidbSequelize.close();
  }
}

// Function to only clear TiDB database
async function clearDatabaseOnly() {
  console.log("🗑️  Starting TiDB database cleanup...");
  console.log("=" .repeat(50));

  try {
    // Test TiDB connection only
    await tidbSequelize.authenticate();
    console.log("✅ TiDB Cloud connection established successfully.");

    // Clear all data
    await clearTiDBDatabase();

    console.log("\n🎉 Database cleanup completed successfully!");
    console.log("=" .repeat(50));

  } catch (error) {
    console.error("\n💥 Database cleanup failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await tidbSequelize.close();
    console.log("🔒 Database connection closed");
  }
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case "migrate":
    runMigration();
    break;
  case "clear":
    clearDatabaseOnly();
    break;
  case "summary":
    showMigrationSummary();
    break;
  case "test":
    testConnections().then(() => {
      console.log("✅ Both database connections are working!");
      process.exit(0);
    }).catch(() => {
      process.exit(1);
    });
    break;
  default:
    console.log(`
🔧 TiDB Migration Tool

Usage:
  node scripts/migrate-to-tidb.js <command>

Commands:
  migrate   - Clear TiDB database and run full migration from local MySQL
  clear     - Only clear all data from TiDB database (no migration)
  summary   - Show migration summary comparing record counts
  test      - Test database connections

Examples:
  node scripts/migrate-to-tidb.js test
  node scripts/migrate-to-tidb.js clear
  node scripts/migrate-to-tidb.js migrate
  node scripts/migrate-to-tidb.js summary
`);
    process.exit(0);
}
