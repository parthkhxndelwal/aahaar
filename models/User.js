module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      courtId: {
        type: DataTypes.STRING,
        allowNull: true, // Allow null for admin users during registration
        references: {
          model: "courts",
          key: "courtId",
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isEmail: true,
        },
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          len: [10, 15],
        },
      },
      fullName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [2, 100],
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: true, // Can be null for OTP-only users
      },
      role: {
        type: DataTypes.ENUM("admin", "vendor", "user"),
        allowNull: false,
        defaultValue: "user",
      },
      status: {
        type: DataTypes.ENUM("active", "inactive", "pending", "suspended"),
        allowNull: false,
        defaultValue: "pending",
      },
      emailVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      phoneVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      dateOfBirth: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      gender: {
        type: DataTypes.ENUM("male", "female", "other", "prefer-not-to-say"),
        allowNull: true,
      },
      managedCourtIds: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null,
      },
      profilePicture: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      lastLoginAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      preferences: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {
          notifications: {
            email: true,
            sms: false,
            push: true,
          },
          paymentMethod: "online",
        },
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {},
      },
      managedCourtIds: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null,
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
      tableName: "users",
      indexes: [
        {
          unique: true,
          fields: ["courtId", "email"],
        },
        {
          fields: ["courtId", "role"],
        },
        {
          fields: ["status"],
        },
      ],
    },
  )

  return User
}
