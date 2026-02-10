module.exports = (sequelize, DataTypes) => {
  const Vendor = sequelize.define(
    "Vendor",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      courtId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: "courts",
          key: "courtId",
        },
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: true, // Can be null initially
        references: {
          model: "users",
          key: "id",
        },
      },
      stallName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [2, 100],
        },
      },
      stallLocation: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          customStallLocation(value) {
            // Allow null or empty string, but validate length if provided
            if (value && value.trim() !== "") {
              if (value.length < 2 || value.length > 200) {
                throw new Error("Stall location must be between 2 and 200 characters");
              }
            }
          },
        },
      },
      vendorName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [2, 100],
        },
      },
      contactEmail: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isEmail: true,
        },
      },
      contactPhone: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [10, 15],
        },
      },
      logoUrl: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      bannerUrl: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      cuisineType: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          len: [2, 50],
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      operatingHours: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {
          monday: { open: "09:00", close: "18:00", closed: false },
          tuesday: { open: "09:00", close: "18:00", closed: false },
          wednesday: { open: "09:00", close: "18:00", closed: false },
          thursday: { open: "09:00", close: "18:00", closed: false },
          friday: { open: "09:00", close: "18:00", closed: false },
          saturday: { open: "09:00", close: "18:00", closed: false },
          sunday: { open: "09:00", close: "18:00", closed: true },
        },
      },
      breakTimes: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },
      status: {
        type: DataTypes.ENUM("active", "inactive", "maintenance", "suspended"),
        allowNull: false,
        defaultValue: "inactive",
      },
      isOnline: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      maxConcurrentOrders: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 10,
      },
      maxOrdersPerHour: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 10,
      },
      averagePreparationTime: {
        type: DataTypes.INTEGER, // in minutes
        allowNull: false,
        defaultValue: 15,
      },
      rating: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      totalRatings: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      // Bank details for Razorpay payouts
      bankAccountNumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      bankIfscCode: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      bankAccountHolderName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      bankName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      razorpayFundAccountId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      razorpayContactId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      razorpayAccountId: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "Razorpay Route Account ID for direct settlements",
      },
      // Legal Information
      panNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          customPan(value) {
            // Allow empty string during onboarding, but validate format if provided
            if (value && value.trim() !== "") {
              if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value)) {
                throw new Error("Invalid PAN format. Expected format: AAAAA9999A");
              }
            }
          },
        },
        comment: "PAN number for tax compliance",
      },
      gstin: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          customGstin(value) {
            if (value && value.trim() !== "") {
              if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(value)) {
                throw new Error("Invalid GSTIN format");
              }
            }
          },
        },
        comment: "GSTIN number for GST compliance (optional)",
      },
      payoutSettings: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {
          autoPayoutEnabled: true,
          payoutFrequency: "daily", // daily, weekly, manual
          minimumPayoutAmount: 100,
        },
      },
      settings: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {
          acceptCOD: true,
          acceptOnlinePayment: true,
          orderBufferTime: 5, // minutes
          autoAcceptOrders: false,
        },
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {},
      },
      // Onboarding tracking fields
      onboardingStatus: {
        type: DataTypes.ENUM("not_started", "in_progress", "completed", "suspended"),
        allowNull: false,
        defaultValue: "not_started",
        comment: "Current onboarding status"
      },
      onboardingStep: {
        type: DataTypes.ENUM("basic", "password", "stall", "hours", "bank", "legal", "account", "config", "success", "completed"),
        allowNull: true,
        comment: "Current step in onboarding process"
      },
      onboardingCompletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "Timestamp when onboarding was completed"
      },
      onboardingStartedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "Timestamp when onboarding was started"
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
      tableName: "vendors",
      indexes: [
        {
          unique: true,
          fields: ["courtId", "stallName"],
        },
        {
          fields: ["courtId", "status"],
        },
        {
          fields: ["isOnline"],
        },
      ],
    },
  )

  return Vendor
}
