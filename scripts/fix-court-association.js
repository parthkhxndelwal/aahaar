require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixCourtAssociation() {
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
    console.log('🔧 Fixing court association for democourt3...');
    
    // Update the user's courtId to democourt3
    const [result] = await connection.execute(
      'UPDATE users SET courtId = ? WHERE email = ? AND role = "admin" AND (courtId = "democourt2" OR courtId IS NULL)',
      ['democourt3', 'parthkhandelwal111@gmail.com']
    );
    
    console.log(`✅ Updated ${result.affectedRows} user record(s)`);
    
    // Verify the update
    const [users] = await connection.execute(
      'SELECT email, courtId FROM users WHERE email = ? AND role = "admin"',
      ['parthkhandelwal111@gmail.com']
    );
    
    console.log('📊 Updated user records:');
    users.forEach(user => {
      console.log(`- ${user.email}: courtId=${user.courtId}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

fixCourtAssociation();
