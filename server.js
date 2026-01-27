const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')
const jwt = require('jsonwebtoken')

// Import models - ensure they're loaded before using
const models = require('./models')
const { User, Court } = models

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3000

// When using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port })
const handler = app.getRequestHandler()

const authenticateSocketUser = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token
    
    console.log('[Socket Auth] Attempting to authenticate socket user:', {
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      tokenPreview: token ? token.substring(0, 20) + '...' : null
    })
    
    if (!token) {
      console.error('[Socket Auth] No token provided')
      return next(new Error('Authentication error: No token provided'))
    }
    
    // Check if JWT_SECRET exists
    if (!process.env.JWT_SECRET) {
      console.error('[Socket Auth] JWT_SECRET not found in environment variables')
      return next(new Error('Server configuration error'))
    }
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    console.log('[Socket Auth] Token decoded successfully:', {
      userId: decoded.userId,
      hasUserId: !!decoded.userId
    })
    
    // Check if userId exists in decoded token
    if (!decoded.userId) {
      console.error('[Socket Auth] Invalid token - no userId found in decoded token')
      return next(new Error('Invalid token - no userId found'))
    }

    // Fetch user with court information (similar to auth middleware)
    const user = await User.findByPk(decoded.userId, {
      include: [
        {
          model: Court,
          as: "court",
          attributes: ["courtId", "instituteName", "status"],
        },
      ],
    })

    if (!user) {
      console.error('[Socket Auth] User not found in database:', decoded.userId)
      return next(new Error('Invalid token - user not found'))
    }

    console.log('[Socket Auth] User found:', {
      userId: user.id,
      role: user.role,
      status: user.status,
      courtId: user.courtId
    })

    if (user.status !== "active") {
      console.error('[Socket Auth] User account is not active:', user.status)
      return next(new Error('User account is not active'))
    }

    if (user.court && user.court.status !== "active") {
      console.error('[Socket Auth] Court is not active:', user.court.status)
      return next(new Error('Court is not active'))
    }

    // Attach user info to socket
    socket.userId = user.id
    socket.userRole = user.role
    socket.courtId = user.courtId
    socket.user = user // Store full user object for reference
    
    console.log('[Socket Auth] Authentication successful for user:', {
      userId: user.id,
      role: user.role,
      courtId: user.courtId
    })
    
    next()
  } catch (error) {
    console.error('[Socket Auth] Authentication error:', {
      errorName: error.name,
      errorMessage: error.message,
      stack: error.stack
    })
    
    if (error.name === "JsonWebTokenError") {
      return next(new Error('Invalid token'))
    }
    if (error.name === "TokenExpiredError") {
      return next(new Error('Token expired'))
    }
    
    return next(new Error('Authentication failed: ' + error.message))
  }
}

app.prepare().then(() => {
  const httpServer = createServer(handler)
  
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  })

  // Middleware for authentication with error handling
  io.use((socket, next) => {
    authenticateSocketUser(socket, (err) => {
      if (err) {
        console.error('[Socket Middleware] Authentication failed:', err.message)
        return next(err)
      }
      next()
    })
  })

  io.on('connection', (socket) => {
    // Check if authentication was successful
    if (!socket.userId) {
      console.error('[Socket Connection] User connected without proper authentication - userId is undefined')
      socket.disconnect(true)
      return
    }
    
    console.log(`[Socket Connection] User connected: ${socket.userId} (${socket.userRole})`)
    
    // Join vendor to their specific room for order updates
    if (socket.userRole === 'vendor') {
      // Join vendor-specific room
      socket.join(`vendor-${socket.userId}`)
    } else if (socket.userRole === 'user') {
      // Join customer-specific room (customers have role 'user')
      socket.join(`customer-${socket.userId}`)
    }

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`)
    })

    // Handle vendor joining their queue room
    socket.on('join-vendor-queue', (vendorId) => {
      if (socket.userRole === 'vendor') {
        socket.join(`vendor-queue-${vendorId}`)
      }
    })

    // Handle leaving vendor queue room
    socket.on('leave-vendor-queue', (vendorId) => {
      socket.leave(`vendor-queue-${vendorId}`)
    })

    // Handle customer joining their order room
    socket.on('join-customer-order', (parentOrderId) => {
      console.log(`[Socket] User ${socket.userId} (${socket.userRole}) attempting to join customer-order-${parentOrderId}`)
      if (socket.userRole === 'user') {
        socket.join(`customer-order-${parentOrderId}`)
        console.log(`[Socket] User ${socket.userId} successfully joined customer-order-${parentOrderId}`)
      } else {
        console.log(`[Socket] User ${socket.userId} denied - wrong role: ${socket.userRole}`)
      }
    })

    // Handle customer leaving their order room
    socket.on('leave-customer-order', (parentOrderId) => {
      console.log(`[Socket] User ${socket.userId} leaving customer-order-${parentOrderId}`)
      socket.leave(`customer-order-${parentOrderId}`)
    })

    // Handle customer joining their orders room
    socket.on('join-customer-orders', (userId) => {
      console.log(`[Socket] User ${socket.userId} (${socket.userRole}) attempting to join customer-orders-${userId}`)
      if (socket.userRole === 'user' && socket.userId === userId) {
        socket.join(`customer-orders-${userId}`)
        console.log(`[Socket] User ${socket.userId} successfully joined customer-orders-${userId}`)
      } else {
        console.log(`[Socket] User ${socket.userId} denied - wrong role or user mismatch: ${socket.userRole}, requested: ${userId}`)
      }
    })

    // Handle customer leaving their orders room
    socket.on('leave-customer-orders', (userId) => {
      console.log(`[Socket] User ${socket.userId} leaving customer-orders-${userId}`)
      socket.leave(`customer-orders-${userId}`)
    })
  })

  // Store io instance globally so we can use it in API routes
  global.io = io

  httpServer
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
    })
})
