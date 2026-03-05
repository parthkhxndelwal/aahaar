require('dotenv').config();
const mysql = require('mysql2/promise');

async function updateUserCourtIdNullable() {
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
    console.log('🔄 Updating users table to allow courtId to be nullable...');
    
    // Modify the courtId column to allow NULL values
    await connection.execute(`
      ALTER TABLE users 
      MODIFY COLUMN courtId VARCHAR(255) NULL
    `);
    
    console.log('✅ Successfully updated users table - courtId can now be NULL');
    
  } catch (error) {
    console.error('❌ Error updating users table:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run the migration
updateUserCourtIdNullable()
  .then(() => {
    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });
