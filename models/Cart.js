const { DataTypes } = require("sequelize")

module.exports = (sequelize) => {
  const Cart = sequelize.define("Cart", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    courtId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: "courts",
        key: "courtId",
      },
    },
    status: {
      type: DataTypes.ENUM("active", "ordered", "abandoned"),
      defaultValue: "active",
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: "carts",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["userId", "courtId", "status"],
        where: {
          status: "active"
        }
      }
    ]
  })

  return Cart
}
