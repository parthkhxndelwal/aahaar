require("dotenv").config()

module.exports = {
  development: {
    username: process.env.TEST_DB_USERNAME || "root",
    password: process.env.TEST_DB_PASSWORD || "",
    database: process.env.TEST_DB_NAME || "aahaar_dev",
    host: process.env.TEST_DB_HOST || "localhost",
    port: process.env.TEST_DB_PORT || 3306,
    dialect: "mysql",
    logging: false,
    dialectOptions: {
      ssl: process.env.TEST_DB_HOST && process.env.TEST_DB_HOST.includes('tidbcloud') ? {
        require: true,
        rejectUnauthorized: false
      } : false,
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
  
  production: {
    username: process.env.PROD_DB_USERNAME,
    password: process.env.PROD_DB_PASSWORD,
    database: process.env.PROD_DB_NAME,
    host: process.env.PROD_DB_HOST,
    port: process.env.PROD_DB_PORT || 3306,
    dialect: "mysql",
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      },
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
}
