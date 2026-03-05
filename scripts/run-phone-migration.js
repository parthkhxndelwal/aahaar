require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 4000,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true
    }
  });

  try {
    console.log('🔧 Running contactPhone migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'migrations', 'fix-contactphone-length.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = migrationSQL.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('📝 Executing:', statement.trim().substring(0, 50) + '...');
        await connection.execute(statement);
      }
    }
    
    console.log('✅ Migration completed successfully!');
    
    // Check the results
    const [courts] = await connection.execute(`
      SELECT courtId, instituteName, contactPhone 
      FROM courts 
      WHERE contactPhone IS NOT NULL
    `);
    
    console.log('\n📊 Courts with valid phone numbers:');
    courts.forEach(court => {
      console.log(`- ${court.courtId}: ${court.instituteName} (${court.contactPhone})`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await connection.end();
  }
}

runMigration();
