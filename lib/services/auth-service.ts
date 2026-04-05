/**
 * Auth Service
 * Handles authentication business logic
 */

import * as bcrypt from 'bcryptjs'
import * as jwt from 'jsonwebtoken'
import { Op } from 'sequelize'
import { User, Court, Vendor, AuditLog, OTP } from '@/models'
import { ServiceError } from '@/lib/api-response'

const JWT_SECRET: string = process.env.JWT_SECRET as string
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export interface LoginCredentials {
  email?: string
  phone?: string
  password?: string
  otp?: string
  courtId?: string
  loginType?: 'password' | 'otp' | 'phone_otp'
}

export interface TokenPayload {
  userId: string
  courtId?: string
  role: string
  email?: string
}

export interface LoginResult {
  token?: string
  user: any
  requiresProfileCompletion?: boolean
  isNewUser?: boolean
}

export class AuthService {
  /**
   * Generate JWT token
   */
  static generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions)
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as TokenPayload
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new ServiceError('Token expired', 401, 'TOKEN_EXPIRED')
      }
      if (error.name === 'JsonWebTokenError') {
        throw new ServiceError('Invalid token', 401, 'TOKEN_INVALID')
      }
      throw new ServiceError('Token verification failed', 401, 'TOKEN_ERROR')
    }
  }

  /**
   * Hash password
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10)
  }

  /**
   * Verify password
   */
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword)
  }

  /**
   * Email OTP Login
   */
  static async loginWithEmailOtp(
    email: string, 
    otp: string, 
    courtId: string,
    requestInfo: { userAgent?: string; ipAddress?: string } = {}
  ): Promise<LoginResult> {
    const normalizedEmail = email.toLowerCase()

    // Find existing user
    let user = await User.findOne({
      where: { email: normalizedEmail }
    })

    const isExistingUser = !!user

    // Check if user has a non-customer role
    if (user && user.role !== 'user') {
      throw new ServiceError(
        `This email is registered as a ${user.role === 'vendor' ? 'vendor' : 'admin'} account. Please use the ${user.role} login portal instead.`,
        403,
        'ROLE_MISMATCH'
      )
    }

    // Build OTP query
    const otpQuery: any = {
      type: 'email',
      value: normalizedEmail,
      otp: otp,
      courtId: courtId,
      verified: false,
      expiresAt: { [Op.gt]: new Date() }
    }

    if (isExistingUser) {
      otpQuery.userId = user.id
    } else {
      otpQuery.userId = null
    }

    // Check what OTPs exist first
    const allOtps = await OTP.findAll({
      where: {
        type: 'email',
        value: normalizedEmail,
        courtId: courtId
      },
      order: [['createdAt', 'DESC']],
      limit: 3
    })
    console.log("📋 Debug - All OTPs for email:", allOtps.length)
    allOtps.forEach((o: any, i: number) => {
      console.log(`   ${i+1}. id=${o.id}, otp=${o.otp}, otpType=${typeof o.otp}, userId=${o.userId}, verified=${o.verified}, expiresAt=${o.expiresAt}`)
    })

    // Verify OTP
    const otpRecord = await OTP.findOne({
      where: otpQuery,
      order: [['createdAt', 'DESC']]
    })

    console.log("📋 Debug - OTP Query:", { otp: otp, otpType: typeof otp, userId: isExistingUser ? user.id : null })
    console.log("📋 Debug - OTP Record found:", otpRecord ? `id=${otpRecord.id}, otp=${otpRecord.otp}` : "null")

    if (!otpRecord) {
      await this.logAuditEvent({
        courtId,
        action: 'USER_OTP_VERIFICATION_FAILED',
        entityType: 'user',
        entityId: normalizedEmail,
        metadata: { failureReason: 'invalid_or_expired_otp', attemptedEmail: normalizedEmail },
        ...requestInfo
      })
      throw new ServiceError('Invalid or expired OTP', 401, 'INVALID_OTP')
    }

    // Mark OTP as verified and destroy it
    await otpRecord.update({ verified: true })
    await otpRecord.destroy()

    // Handle existing user
    if (isExistingUser) {
      user = await User.findOne({
        where: { email: normalizedEmail },
        include: [{ model: Court, as: 'court' }]
      })

      // Check if profile is complete
      if (!user.profileCompleted || !user.fullName || !user.password) {
        return {
          requiresProfileCompletion: true,
          isNewUser: false,
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName === 'Temporary User' ? null : user.fullName,
            hasPassword: !!user.password
          }
        }
      }

      // Generate token for complete user
      const token = this.generateToken({
        userId: user.id,
        courtId: user.courtId,
        role: user.role,
        email: user.email
      })

      await user.update({ lastLoginAt: new Date() })

      await this.logAuditEvent({
        courtId: user.courtId,
        userId: user.id,
        action: 'USER_LOGIN_OTP',
        entityType: 'user',
        entityId: user.id,
        metadata: { loginMethod: 'email_otp', email: normalizedEmail },
        ...requestInfo
      })

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          courtId: user.courtId,
          profileCompleted: user.profileCompleted,
          court: user.court
        }
      }
    }

    // Create new user
    user = await User.create({
      email: normalizedEmail,
      fullName: 'Temporary User',
      courtId: courtId,
      role: 'user',
      status: 'pending'
    })

    await this.logAuditEvent({
      courtId,
      action: 'USER_OTP_VERIFIED',
      entityType: 'user',
      entityId: normalizedEmail,
      metadata: { isNewUser: true, requiresProfileCompletion: true },
      ...requestInfo
    })

    return {
      requiresProfileCompletion: true,
      isNewUser: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: null,
        hasPassword: false
      }
    }
  }

  /**
   * Password Login
   */
  static async loginWithPassword(
    email: string,
    password: string,
    courtId?: string,
    requestInfo: { userAgent?: string; ipAddress?: string } = {}
  ): Promise<LoginResult> {
    const normalizedEmail = email.toLowerCase()

    // Find user
    const whereClause: any = { email: normalizedEmail }
    if (courtId) {
      whereClause.courtId = courtId
    }

    const user = await User.findOne({
      where: whereClause,
      include: [
        { model: Court, as: 'court', attributes: ['courtId', 'instituteName', 'status'] },
        { model: Vendor, as: 'vendorProfile', attributes: ['id', 'stallName', 'stallLocation', 'isOnline', 'status'] }
      ]
    })

    if (!user) {
      await this.logAuditEvent({
        courtId: courtId || 'system',
        action: 'USER_LOGIN_FAILED',
        entityType: 'user',
        entityId: normalizedEmail,
        metadata: { loginMethod: 'password', failureReason: 'user_not_found', attemptedEmail: normalizedEmail },
        ...requestInfo
      })
      throw new ServiceError('Invalid credentials', 401, 'INVALID_CREDENTIALS')
    }

    // For customer portal login, only allow 'user' role
    if (courtId && user.role !== 'user') {
      throw new ServiceError(
        `This email is registered as a ${user.role === 'vendor' ? 'vendor' : 'admin'} account. Please use the ${user.role} portal instead.`,
        403,
        'ROLE_MISMATCH'
      )
    }

    if (user.status !== 'active') {
      throw new ServiceError('Account is not active. Please contact your admin.', 401, 'ACCOUNT_INACTIVE')
    }

    // For vendor users, check vendor status
    if (user.role === 'vendor' && user.vendorProfile?.status !== 'active') {
      throw new ServiceError('Vendor account is not active. Please contact your admin.', 401, 'VENDOR_INACTIVE')
    }

    // Check court status
    if (user.court && user.court.status !== 'active') {
      throw new ServiceError('Court is not active', 401, 'COURT_INACTIVE')
    }

    // Verify password
    const isValidPassword = await this.verifyPassword(password, user.password)
    if (!isValidPassword) {
      await this.logAuditEvent({
        courtId: user.courtId || 'system',
        userId: user.id,
        action: 'USER_LOGIN_FAILED',
        entityType: 'user',
        entityId: user.id,
        metadata: { loginMethod: 'password', failureReason: 'invalid_password' },
        ...requestInfo
      })
      throw new ServiceError('Invalid credentials', 401, 'INVALID_CREDENTIALS')
    }

    // Generate token
    const token = this.generateToken({
      userId: user.id,
      courtId: user.courtId,
      role: user.role,
      email: user.email
    })

    await user.update({ lastLoginAt: new Date() })

    await this.logAuditEvent({
      courtId: user.courtId || 'system',
      userId: user.id,
      action: 'USER_LOGIN',
      entityType: 'user',
      entityId: user.id,
      metadata: { loginMethod: 'password' },
      ...requestInfo
    })

    // Prepare response
    const userData: any = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      courtId: user.courtId,
      court: user.court ? {
        courtId: user.court.courtId,
        instituteName: user.court.instituteName
      } : null
    }

    if (user.role === 'vendor' && user.vendorProfile) {
      userData.vendorProfile = {
        id: user.vendorProfile.id,
        stallName: user.vendorProfile.stallName,
        stallLocation: user.vendorProfile.stallLocation,
        isOnline: user.vendorProfile.isOnline
      }
    }

    return { token, user: userData }
  }

  /**
   * Log audit event
   */
  private static async logAuditEvent(data: {
    courtId?: string
    userId?: string
    action: string
    entityType: string
    entityId: string
    metadata?: any
    userAgent?: string
    ipAddress?: string
  }): Promise<void> {
    try {
      await AuditLog.create({
        courtId: data.courtId || 'system',
        userId: data.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        metadata: {
          ...data.metadata,
          userAgent: data.userAgent || 'unknown',
          ipAddress: data.ipAddress || 'unknown'
        },
        ipAddress: data.ipAddress || 'unknown',
        userAgent: data.userAgent || 'unknown'
      })
    } catch (error) {
      console.error('Failed to create audit log:', error)
    }
  }
}
