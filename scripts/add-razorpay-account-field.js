const { sequelize, Vendor } = require("../models")

async function addRazorpayAccountField() {
  try {
    console.log("🔄 Adding razorpayAccountId field to Vendor table...")

    // Check if the column already exists
    const queryInterface = sequelize.getQueryInterface()
    const tableDescription = await queryInterface.describeTable('Vendors')
    
    if (!tableDescription.razorpayAccountId) {
      // Add the column if it doesn't exist
      await queryInterface.addColumn('Vendors', 'razorpayAccountId', {
        type: sequelize.Sequelize.DataTypes.STRING,
        allowNull: true,
        comment: "Razorpay Route Account ID for direct settlements",
      })
      console.log("✅ razorpayAccountId field added successfully.")
    } else {
      console.log("✅ razorpayAccountId field already exists.")
    }

  } catch (error) {
    console.error("❌ Error adding razorpayAccountId field:", error)
    throw error
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  addRazorpayAccountField()
    .then(() => {
      console.log("Migration completed successfully")
      process.exit(0)
    })
    .catch((error) => {
      console.error("Migration failed:", error)
      process.exit(1)
    })
}

module.exports = { addRazorpayAccountField }
