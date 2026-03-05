require('dotenv').config();
const mysql = require('mysql2/promise');

async function addManagedCourtsField() {
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
    console.log('🔄 Populating managedCourtIds field for existing admins...');
    
    // Get all courts grouped by contactEmail
    const [courts] = await connection.execute(`
      SELECT contactEmail, GROUP_CONCAT(courtId) as courtIds 
      FROM courts 
      GROUP BY contactEmail
    `);

    for (const court of courts) {
      const courtIds = court.courtIds.split(',');
      const courtIdsJson = JSON.stringify(courtIds);
      
      await connection.execute(`
        UPDATE users 
        SET managedCourtIds = ? 
        WHERE email = ? AND role = 'admin'
      `, [courtIdsJson, court.contactEmail]);
      
      console.log(`✅ Updated ${court.contactEmail} with courts: ${courtIds.join(', ')}`);
    }

    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

addManagedCourtsField();
