module.exports = (sequelize, DataTypes) => {
  const MenuCategory = sequelize.define(
    "MenuCategory",
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
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [2, 50],
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      displayOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      color: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          is: /^#[0-9A-F]{6}$/i, // Hex color validation
        },
      },
      imageUrl: {
        type: DataTypes.TEXT,
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
      tableName: "menu_categories",
      indexes: [
        {
          fields: ["vendorId", "isActive"],
        },
        {
          fields: ["vendorId", "displayOrder"],
        },
        {
          unique: true,
          fields: ["vendorId", "name"],
          name: "unique_vendor_category_name",
        },
      ],
    },
  )

  return MenuCategory
}
