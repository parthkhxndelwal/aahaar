module.exports = (sequelize, DataTypes) => {
  const OTP = sequelize.define("OTP", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM('email', 'phone'),
      allowNull: false,
    },
    value: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Email address or phone number'
    },
    otp: {
      type: DataTypes.STRING(6),
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
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
  }, {
    tableName: "otps",
    timestamps: true,
    indexes: [
      {
        fields: ['userId', 'type', 'value'],
        name: 'otp_user_type_value_idx'
      },
      {
        fields: ['expiresAt'],
        name: 'otp_expires_at_idx'
      }
    ]
  })

  return OTP
}
