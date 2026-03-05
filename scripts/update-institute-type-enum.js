require('dotenv').config();
const mysql = require('mysql2/promise');

async function updateInstituteTypeEnum() {
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
    console.log('🔄 Updating instituteType ENUM to include university and corporate...');
    
    // Update the ENUM to include new values
    await connection.execute(`
      ALTER TABLE courts 
      MODIFY COLUMN instituteType ENUM('school', 'college', 'university', 'office', 'corporate', 'hospital', 'system', 'other') 
      NOT NULL DEFAULT 'college'
    `);

    console.log('✅ Successfully updated instituteType ENUM');
    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Error updating instituteType ENUM:', error);
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

updateInstituteTypeEnum();
