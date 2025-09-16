module.exports = (sequelize, DataTypes) => {
  const PaymentRequest = sequelize.define(
    "PaymentRequest",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      vendorId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "vendors",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      courtId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("pending", "approved", "rejected"),
        allowNull: false,
        defaultValue: "pending",
      },

      // Business details submitted by admin
      businessName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [2, 255],
        },
      },
      beneficiaryName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [2, 255],
        },
      },
      accountNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [8, 20], // Account numbers are typically 8-20 digits
        },
      },
      ifscCode: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [11, 11], // IFSC codes are exactly 11 characters
          is: /^[A-Z]{4}0[A-Z0-9]{6}$/, // IFSC format validation
        },
      },
      bankName: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      // Razorpay details filled by super admin on approval
      razorpayAccountId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      razorpayStakeholderId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      razorpayProductId: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      // Rejection details
      rejectionReason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      rejectedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      rejectedBy: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      // Resubmission details
      resubmissionMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      // Approval details
      approvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      approvedBy: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      // Metadata
      businessCategory: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "food_and_beverages",
      },
      businessSubcategory: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "restaurant",
      },
      businessType: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "individual",
      },

      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "payment_requests",
      indexes: [
        {
          fields: ["vendorId"],
        },
        {
          fields: ["courtId"],
        },
        {
          fields: ["status"],
        },
        {
          fields: ["createdAt"],
        },
        {
          unique: true,
          fields: ["vendorId"],
          where: {
            status: "pending",
          },
        },
      ],
    },
  )

  PaymentRequest.associate = (models) => {
    PaymentRequest.belongsTo(models.Vendor, {
      foreignKey: "vendorId",
      as: "vendor",
    })
  }

  return PaymentRequest
}