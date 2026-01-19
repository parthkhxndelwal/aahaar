const { Sequelize } = require("sequelize");
const mysql2 = require("mysql2");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

// Local database configuration
const LOCAL_DB = {
  host: "localhost",
  port: 3306,
  username: "root",
  password: "12345",
  database: "aahaar_dev"
};

// Initialize Sequelize connection to local database
const localSequelize = new Sequelize(
  LOCAL_DB.database,
  LOCAL_DB.username,
  LOCAL_DB.password,
  {
    host: LOCAL_DB.host,
    port: LOCAL_DB.port,
    dialect: "mysql",
    dialectModule: mysql2,
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

// Create backups directory if it doesn't exist
const backupsDir = path.join(__dirname, "..", "backups");
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

// Generate backup filename with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, "-").split("T")[0] + "_" + 
                 new Date().toISOString().replace(/[:.]/g, "-").split("T")[1].split(".")[0];
const backupFile = path.join(backupsDir, `aahaar_dev_backup_${timestamp}.sql`);

// Function to escape SQL values
function escapeSQLValue(value) {
  if (value === null) return "NULL";
  if (typeof value === "string") return `'${value.replace(/'/g, "''").replace(/\\/g, "\\\\")}'`;
  if (value instanceof Date) return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
  if (typeof value === "boolean") return value ? "1" : "0";
  return value;
}

// Function to get table structure
async function getTableStructure(tableName) {
  try {
    const [createTableResult] = await localSequelize.query(`SHOW CREATE TABLE ${tableName}`);
    return createTableResult[0]["Create Table"];
  } catch (error) {
    console.error(`❌ Error getting structure for table ${tableName}:`, error.message);
    return null;
  }
}

// Function to backup table data
async function backupTableData(tableName) {
  try {
    const [data] = await localSequelize.query(`SELECT * FROM ${tableName}`);
    
    if (data.length === 0) {
      return `-- No data in table ${tableName}\n\n`;
    }

    const columns = Object.keys(data[0]);
    const columnNames = columns.join(", ");
    
    let insertStatements = `-- Data for table ${tableName}\n`;
    insertStatements += `INSERT INTO ${tableName} (${columnNames}) VALUES\n`;
    
    const values = data.map((row, index) => {
      const rowValues = columns.map(col => escapeSQLValue(row[col]));
      const isLast = index === data.length - 1;
      return `(${rowValues.join(", ")})${isLast ? ";" : ","}`;
    });
    
    insertStatements += values.join("\n");
    insertStatements += "\n\n";
    
    return insertStatements;
  } catch (error) {
    console.error(`❌ Error backing up data for table ${tableName}:`, error.message);
    return `-- Error backing up data for table ${tableName}: ${error.message}\n\n`;
  }
}

// Main backup function
async function createBackup() {
  console.log("🔄 Creating backup of local MySQL database...");
  console.log(`📁 Backup location: ${backupFile}`);

  try {
    // Test connection
    await localSequelize.authenticate();
    console.log("✅ Connected to local MySQL database");

    // Get all tables
    const [tables] = await localSequelize.query("SHOW TABLES");
    const tableNames = tables.map(row => Object.values(row)[0]);
    
    console.log(`📋 Found ${tableNames.length} tables:`, tableNames.join(", "));

    // Start building SQL backup
    let sqlBackup = `-- MySQL Database Backup\n`;
    sqlBackup += `-- Database: ${LOCAL_DB.database}\n`;
    sqlBackup += `-- Generated: ${new Date().toISOString()}\n`;
    sqlBackup += `-- Host: ${LOCAL_DB.host}:${LOCAL_DB.port}\n\n`;
    
    sqlBackup += `SET FOREIGN_KEY_CHECKS = 0;\n`;
    sqlBackup += `SET AUTOCOMMIT = 0;\n`;
    sqlBackup += `START TRANSACTION;\n\n`;

    // Backup each table
    for (const tableName of tableNames) {
      console.log(`🔄 Backing up table: ${tableName}`);
      
      // Get table structure
      const createTableSQL = await getTableStructure(tableName);
      if (createTableSQL) {
        sqlBackup += `-- Table structure for ${tableName}\n`;
        sqlBackup += `DROP TABLE IF EXISTS ${tableName};\n`;
        sqlBackup += createTableSQL + ";\n\n";
      }
      
      // Get table data
      const tableData = await backupTableData(tableName);
      sqlBackup += tableData;
    }

    sqlBackup += `COMMIT;\n`;
    sqlBackup += `SET FOREIGN_KEY_CHECKS = 1;\n`;
    sqlBackup += `SET AUTOCOMMIT = 1;\n`;

    // Write backup to file
    fs.writeFileSync(backupFile, sqlBackup, "utf8");
    
    // Check if backup file was created and has content
    const stats = fs.statSync(backupFile);
    if (stats.size > 0) {
      console.log(`✅ Backup completed successfully!`);
      console.log(`📊 Backup size: ${(stats.size / 1024).toFixed(2)} KB`);
      console.log(`📂 File: ${backupFile}`);
      console.log(`📄 Tables backed up: ${tableNames.length}`);
    } else {
      console.error("❌ Backup file is empty");
    }

  } catch (error) {
    console.error("❌ Backup failed:", error.message);
    console.error(error.stack);
  } finally {
    await localSequelize.close();
    console.log("🔒 Database connection closed");
  }
}

// Run the backup
createBackup();
