const { Sequelize } = require("sequelize")
const mysql2 = require("mysql2")
const config = require("../config/database")

const env = process.env.NODE_ENV || "development"
const dbConfig = config[env]

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  host: dbConfig.host,
  port: dbConfig.port,
  dialect: dbConfig.dialect,
  dialectModule: mysql2,
  dialectOptions: dbConfig.dialectOptions,
  logging: dbConfig.logging,
  pool: dbConfig.pool,
})

// Import models
const Court = require("./Court")(sequelize, Sequelize.DataTypes)
const User = require("./User")(sequelize, Sequelize.DataTypes)
const Vendor = require("./Vendor")(sequelize, Sequelize.DataTypes)
const MenuItem = require("./MenuItem")(sequelize, Sequelize.DataTypes)
const MenuCategory = require("./MenuCategory")(sequelize, Sequelize.DataTypes)
const Order = require("./Order")(sequelize, Sequelize.DataTypes)
const OrderItem = require("./OrderItem")(sequelize, Sequelize.DataTypes)
const Payment = require("./Payment")(sequelize, Sequelize.DataTypes)
const AuditLog = require("./AuditLog")(sequelize, Sequelize.DataTypes)
const CourtSettings = require("./CourtSettings")(sequelize, Sequelize.DataTypes)

// Define associations
Court.hasMany(User, { foreignKey: "courtId", sourceKey: "courtId", as: "users" })
User.belongsTo(Court, { foreignKey: "courtId", targetKey: "courtId", as: "court" })

Court.hasMany(Vendor, { foreignKey: "courtId", sourceKey: "courtId", as: "vendors" })
Vendor.belongsTo(Court, { foreignKey: "courtId", targetKey: "courtId", as: "court" })

User.hasOne(Vendor, { foreignKey: "userId", as: "vendorProfile" })
Vendor.belongsTo(User, { foreignKey: "userId", as: "user" })

Vendor.hasMany(MenuItem, { foreignKey: "vendorId", as: "menuItems" })
MenuItem.belongsTo(Vendor, { foreignKey: "vendorId", as: "vendor" })

Vendor.hasMany(MenuCategory, { foreignKey: "vendorId", as: "menuCategories" })
MenuCategory.belongsTo(Vendor, { foreignKey: "vendorId", as: "vendor" })

MenuCategory.hasMany(MenuItem, { foreignKey: "categoryId", as: "menuItems" })
MenuItem.belongsTo(MenuCategory, { foreignKey: "categoryId", as: "menuCategory" })

Court.hasMany(Order, { foreignKey: "courtId", sourceKey: "courtId", as: "orders" })
Order.belongsTo(Court, { foreignKey: "courtId", targetKey: "courtId", as: "court" })

User.hasMany(Order, { foreignKey: "userId", as: "orders" })
Order.belongsTo(User, { foreignKey: "userId", as: "user" })

Vendor.hasMany(Order, { foreignKey: "vendorId", as: "orders" })
Order.belongsTo(Vendor, { foreignKey: "vendorId", as: "vendor" })

Order.hasMany(OrderItem, { foreignKey: "orderId", as: "items" })
OrderItem.belongsTo(Order, { foreignKey: "orderId", as: "order" })

MenuItem.hasMany(OrderItem, { foreignKey: "menuItemId", as: "orderItems" })
OrderItem.belongsTo(MenuItem, { foreignKey: "menuItemId", as: "menuItem" })

Order.hasOne(Payment, { foreignKey: "orderId", as: "payment" })
Payment.belongsTo(Order, { foreignKey: "orderId", as: "order" })

Court.hasMany(AuditLog, { foreignKey: "courtId", sourceKey: "courtId", as: "auditLogs" })
AuditLog.belongsTo(Court, { foreignKey: "courtId", targetKey: "courtId", as: "court" })

User.hasMany(AuditLog, { foreignKey: "userId", as: "auditLogs" })
AuditLog.belongsTo(User, { foreignKey: "userId", as: "user" })

Court.hasOne(CourtSettings, { foreignKey: "courtId", sourceKey: "courtId", as: "settings" })
CourtSettings.belongsTo(Court, { foreignKey: "courtId", targetKey: "courtId", as: "court" })

module.exports = {
  sequelize,
  Court,
  User,
  Vendor,
  MenuItem,
  MenuCategory,
  Order,
  OrderItem,
  Payment,
  AuditLog,
  CourtSettings,
}
