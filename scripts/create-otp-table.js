const { sequelize } = require("../models")

async function createOTPTable() {
  try {
    console.log("🔄 Creating OTP table...")
    
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`otps\` (
        \`id\` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
        \`userId\` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
        \`type\` enum('email','phone') NOT NULL,
        \`value\` varchar(255) NOT NULL COMMENT 'Email address or phone number',
        \`otp\` varchar(6) NOT NULL,
        \`expiresAt\` datetime NOT NULL,
        \`verified\` tinyint(1) NOT NULL DEFAULT '0',
        \`createdAt\` datetime NOT NULL,
        \`updatedAt\` datetime NOT NULL,
        PRIMARY KEY (\`id\`),
        KEY \`otp_user_type_value_idx\` (\`userId\`,\`type\`,\`value\`),
        KEY \`otp_expires_at_idx\` (\`expiresAt\`),
        CONSTRAINT \`otps_userId_foreign_idx\` FOREIGN KEY (\`userId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `)
    
    console.log("✅ OTP table created successfully!")
    
    // Test the table
    const [results] = await sequelize.query("DESCRIBE otps")
    console.log("📋 OTP table structure:")
    console.table(results)
    
    process.exit(0)
  } catch (error) {
    console.error("❌ Error creating OTP table:", error)
    process.exit(1)
  }
}

createOTPTable()
