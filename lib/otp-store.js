// Database-backed OTP store for profile verification
// Uses Sequelize ORM with MySQL database

const { OTP } = require("../models")
const { Op } = require("sequelize")

class OTPStore {
  constructor() {
    // Clean up expired OTPs on initialization
    this.cleanupExpiredOTPs()
  }

  // Store OTP in database
  async set(key, value) {
    try {
      // Parse the key: userId-type-value
      // Since userId is a UUID with hyphens, we need to be careful about splitting
      const keyParts = key.split('-')
      
      // UUID has 5 parts separated by hyphens, so we need to rejoin the first 5 parts
      const userId = keyParts.slice(0, 5).join('-')
      const type = keyParts[5]
      const emailOrPhone = keyParts.slice(6).join('-')
      
      console.log(`🔍 Parsed key: userId=${userId}, type=${type}, value=${emailOrPhone}`)
      
      // Delete any existing OTP for this user/type/value combination
      await OTP.destroy({
        where: {
          userId,
          type,
          value: emailOrPhone
        }
      })

      // Create new OTP record
      const otpRecord = await OTP.create({
        userId,
        type,
        value: emailOrPhone,
        otp: value.otp,
        expiresAt: new Date(value.expiresAt),
        verified: value.verified || false
      })

      console.log(`🔑 Stored OTP in database:`, {
        id: otpRecord.id,
        userId,
        type,
        value: emailOrPhone,
        expiresAt: otpRecord.expiresAt
      })

      return otpRecord
    } catch (error) {
      console.error('Error storing OTP in database:', error)
      throw error
    }
  }

  // Retrieve OTP from database
  async get(key) {
    try {
      // Parse the key: userId-type-value
      const keyParts = key.split('-')
      const userId = keyParts.slice(0, 5).join('-')
      const type = keyParts[5]
      const emailOrPhone = keyParts.slice(6).join('-')
      
      const otpRecord = await OTP.findOne({
        where: {
          userId,
          type,
          value: emailOrPhone,
          expiresAt: {
            [Op.gt]: new Date() // Only get non-expired OTPs
          }
        },
        order: [['createdAt', 'DESC']] // Get the most recent one
      })

      if (!otpRecord) {
        console.log(`📦 No valid OTP found for key: ${key}`)
        return undefined
      }

      console.log(`📦 Retrieved OTP from database:`, {
        id: otpRecord.id,
        otp: otpRecord.otp,
        expiresAt: otpRecord.expiresAt,
        verified: otpRecord.verified
      })

      // Return in the same format as the in-memory store
      return {
        otp: otpRecord.otp,
        expiresAt: otpRecord.expiresAt.getTime(),
        verified: otpRecord.verified
      }
    } catch (error) {
      console.error('Error retrieving OTP from database:', error)
      return undefined
    }
  }

  // Delete OTP from database
  async delete(key) {
    try {
      // Parse the key: userId-type-value
      const keyParts = key.split('-')
      const userId = keyParts.slice(0, 5).join('-')
      const type = keyParts[5]
      const emailOrPhone = keyParts.slice(6).join('-')
      
      const deletedCount = await OTP.destroy({
        where: {
          userId,
          type,
          value: emailOrPhone
        }
      })

      console.log(`🗑️ Deleted ${deletedCount} OTP record(s) for key: ${key}`)
      return deletedCount > 0
    } catch (error) {
      console.error('Error deleting OTP from database:', error)
      return false
    }
  }

  // Check if OTP exists in database
  async has(key) {
    try {
      // Parse the key: userId-type-value
      const keyParts = key.split('-')
      const userId = keyParts.slice(0, 5).join('-')
      const type = keyParts[5]
      const emailOrPhone = keyParts.slice(6).join('-')
      
      const count = await OTP.count({
        where: {
          userId,
          type,
          value: emailOrPhone,
          expiresAt: {
            [Op.gt]: new Date() // Only count non-expired OTPs
          }
        }
      })

      return count > 0
    } catch (error) {
      console.error('Error checking OTP existence in database:', error)
      return false
    }
  }

  // Get total count of active OTPs
  async getSize() {
    try {
      const count = await OTP.count({
        where: {
          expiresAt: {
            [Op.gt]: new Date() // Only count non-expired OTPs
          }
        }
      })
      return count
    } catch (error) {
      console.error('Error getting OTP count from database:', error)
      return 0
    }
  }

  // Get all active OTP keys (for debugging)
  async keys() {
    try {
      const otpRecords = await OTP.findAll({
        where: {
          expiresAt: {
            [Op.gt]: new Date() // Only get non-expired OTPs
          }
        },
        attributes: ['userId', 'type', 'value']
      })

      return otpRecords.map(record => `${record.userId}-${record.type}-${record.value}`)
    } catch (error) {
      console.error('Error getting OTP keys from database:', error)
      return []
    }
  }

  // Clear all OTPs (for testing purposes)
  async clear() {
    try {
      const deletedCount = await OTP.destroy({
        where: {},
        truncate: true
      })
      console.log(`🗑️ Cleared all OTP records from database`)
      return deletedCount
    } catch (error) {
      console.error('Error clearing OTPs from database:', error)
      return 0
    }
  }

  // Clean up expired OTPs (called periodically)
  async cleanupExpiredOTPs() {
    try {
      const deletedCount = await OTP.destroy({
        where: {
          expiresAt: {
            [Op.lt]: new Date() // Delete expired OTPs
          }
        }
      })

      if (deletedCount > 0) {
        console.log(`🧹 Cleaned up ${deletedCount} expired OTP records`)
      }

      // Schedule next cleanup in 1 hour
      setTimeout(() => {
        this.cleanupExpiredOTPs()
      }, 60 * 60 * 1000) // 1 hour

      return deletedCount
    } catch (error) {
      console.error('Error cleaning up expired OTPs:', error)
      return 0
    }
  }

  // Update OTP verification status
  async markAsVerified(key) {
    try {
      // Parse the key: userId-type-value
      const keyParts = key.split('-')
      const userId = keyParts.slice(0, 5).join('-')
      const type = keyParts[5]
      const emailOrPhone = keyParts.slice(6).join('-')
      
      const [updatedCount] = await OTP.update(
        { verified: true },
        {
          where: {
            userId,
            type,
            value: emailOrPhone,
            expiresAt: {
              [Op.gt]: new Date() // Only update non-expired OTPs
            }
          }
        }
      )

      console.log(`✅ Marked ${updatedCount} OTP record(s) as verified for key: ${key}`)
      return updatedCount > 0
    } catch (error) {
      console.error('Error marking OTP as verified:', error)
      return false
    }
  }
}

module.exports = { otpStore: new OTPStore() }
