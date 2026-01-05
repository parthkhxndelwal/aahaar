const { sequelize } = require("../models")
const bcrypt = require("bcryptjs")

async function initializeDatabase() {
  try {
    console.log("🔄 Connecting to database...")

    // Test the connection
    await sequelize.authenticate()
    console.log("✅ Database connection established successfully.")

    console.log("🔄 Synchronizing database models...")

    // Sync all models (create tables if they don't exist)
    await sequelize.sync({ force: false, alter: true })
    console.log("✅ Database models synchronized successfully.")

    console.log("🔄 Creating default data...")

    // Create default super admin if not exists
    const { User, Court, CourtSettings } = require("../models")

    // Check if any admin exists
    const existingAdmin = await User.findOne({
      where: { role: "admin" },
    })

    if (!existingAdmin) {
      // Create a demo court for testing
      const demoCourt = await Court.create({
        courtId: "democourt",
        instituteName: "Demo Institute",
        instituteType: "college",
        contactEmail: "admin@democourt.com",
        contactPhone: "9999999999",
        status: "active",
        subscriptionPlan: "premium",
      })

      // Create default settings for demo court
      await CourtSettings.create({
        courtId: "democourt",
        allowOnlinePayments: true,
        allowCOD: true,
        platformFeePercentage: 2.5,
      })

      // Create demo admin user
      const hashedPassword = await bcrypt.hash("admin123", 12)
      await User.create({
        courtId: "democourt",
        email: "admin@democourt.com",
        fullName: "Demo Admin",
        password: hashedPassword,
        role: "admin",
        status: "active",
        emailVerified: true,
      })

      console.log("✅ Demo court and admin user created successfully.")
      console.log("📧 Demo Admin Email: admin@democourt.com")
      console.log("🔑 Demo Admin Password: admin123")
      console.log("🏢 Demo Court ID: democourt")
    }

    console.log("🎉 Database initialization completed successfully!")
  } catch (error) {
    console.error("❌ Database initialization failed:", error)
    throw error
  } finally {
    await sequelize.close()
  }
}

// Run initialization if this file is executed directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log("Database initialization completed.")
      process.exit(0)
    })
    .catch((error) => {
      console.error("Database initialization failed:", error)
      process.exit(1)
    })
}

module.exports = { initializeDatabase }
