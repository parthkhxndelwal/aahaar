require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkCourts() {
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
    console.log('🔍 Checking courts in database...');
    
    const [courts] = await connection.execute('SELECT courtId, instituteName, contactEmail, createdAt FROM courts ORDER BY createdAt DESC LIMIT 10');
    
    console.log('📊 Recent courts:');
    courts.forEach(court => {
      console.log(`- ${court.courtId}: ${court.instituteName} (${court.contactEmail}) - ${court.createdAt}`);
    });

    console.log('\n🔍 Checking users...');
    const [users] = await connection.execute('SELECT id, email, courtId, role, managedCourtIds FROM users WHERE role = "admin"');
    
    console.log('👥 Admin users:');
    users.forEach(user => {
      console.log(`- ${user.email}: courtId=${user.courtId}, role=${user.role}, managedCourtIds=${JSON.stringify(user.managedCourtIds)}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

checkCourts();
