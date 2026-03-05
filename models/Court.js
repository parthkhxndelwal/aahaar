module.exports = (sequelize, DataTypes) => {
  const Court = sequelize.define(
    "Court",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      courtId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          is: /^[a-zA-Z0-9_-]+$/,
          len: [3, 50],
        },
      },
      instituteName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [2, 200],
        },
      },
      instituteType: {
        type: DataTypes.ENUM("school", "college", "university", "office", "corporate", "hospital", "system", "other"),
        allowNull: false,
        defaultValue: "college",
      },
      logoUrl: {
        type: DataTypes.TEXT,
        allowNull: true,
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
        allowNull: true,
        validate: {
          len: [8, 20], // More flexible range for international numbers
        },
      },
      address: {
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
      timezone: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Asia/Kolkata",
      },
      status: {
        type: DataTypes.ENUM("active", "inactive", "suspended"),
        allowNull: false,
        defaultValue: "active",
      },
      subscriptionPlan: {
        type: DataTypes.ENUM("trial", "basic", "premium", "enterprise"),
        allowNull: false,
        defaultValue: "trial",
      },
      subscriptionExpiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
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
      tableName: "courts",
      indexes: [
        {
          unique: true,
          fields: ["courtId"],
        },
        {
          fields: ["status"],
        },
      ],
    },
  )

  return Court
}
