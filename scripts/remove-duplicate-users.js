require('dotenv').config();
const mysql = require('mysql2/promise');

async function removeDuplicateUsers() {
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
    console.log('🔍 Finding duplicate users...');
    
    // Find users with same email
    const [duplicates] = await connection.execute(`
      SELECT email, COUNT(*) as count 
      FROM users 
      WHERE role = 'admin' 
      GROUP BY email 
      HAVING count > 1
    `);
    
    console.log('📊 Duplicate emails found:', duplicates);
    
    // For each duplicate email, keep the one with a valid courtId and delete the others
    for (const duplicate of duplicates) {
      console.log(`\n🔧 Processing duplicates for: ${duplicate.email}`);
      
      const [users] = await connection.execute(`
        SELECT id, email, courtId, managedCourtIds 
        FROM users 
        WHERE email = ? AND role = 'admin'
        ORDER BY courtId IS NOT NULL DESC, createdAt ASC
      `, [duplicate.email]);
      
      console.log('👥 Users found:', users);
      
      if (users.length > 1) {
        // Keep the first one (should have a valid courtId)
        const keepUser = users[0];
        const deleteUsers = users.slice(1);
        
        console.log(`✅ Keeping user: ${keepUser.id} (courtId: ${keepUser.courtId})`);
        
        for (const deleteUser of deleteUsers) {
          console.log(`🗑️ Deleting user: ${deleteUser.id} (courtId: ${deleteUser.courtId})`);
          await connection.execute('DELETE FROM users WHERE id = ?', [deleteUser.id]);
        }
      }
    }
    
    console.log('\n🎉 Cleanup completed!');
    
    // Verify the cleanup
    const [finalUsers] = await connection.execute(`
      SELECT email, courtId, managedCourtIds 
      FROM users 
      WHERE role = 'admin'
    `);
    
    console.log('\n📊 Final admin users:');
    finalUsers.forEach(user => {
      console.log(`- ${user.email}: courtId=${user.courtId}, managedCourtIds=${JSON.stringify(user.managedCourtIds)}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

removeDuplicateUsers();
