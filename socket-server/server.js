require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const emitRoutes = require('./emit-routes');

// Create Express app
const app = express();

// Apply CORS middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.NEXT_PUBLIC_APP_URL] 
    : ['http://localhost:3000'],
  methods: ['GET', 'POST'],
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.send('Aahaar Socket.io Server');
});

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// API routes for emitting events
app.use('/emit', emitRoutes);

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? [process.env.NEXT_PUBLIC_APP_URL] 
      : ['http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// Namespace for vendor real-time updates
const vendorNamespace = io.of('/vendor');

// Namespace for app user real-time updates  
const appNamespace = io.of('/app');

// Vendor namespace handlers
vendorNamespace.on('connection', (socket) => {
  console.log(`🏪 Vendor connected: ${socket.id}`);
  
  // Join vendor-specific room
  socket.on('join-vendor-room', (vendorId) => {
    console.log(`🏪 Vendor ${vendorId} joined room: vendor-${vendorId}`);
    socket.join(`vendor-${vendorId}`);
    socket.vendorId = vendorId;
    
    // Send confirmation
    socket.emit('joined-vendor-room', { vendorId, room: `vendor-${vendorId}` });
  });

  // Leave vendor room
  socket.on('leave-vendor-room', (vendorId) => {
    console.log(`🏪 Vendor ${vendorId} left room: vendor-${vendorId}`);
    socket.leave(`vendor-${vendorId}`);
    delete socket.vendorId;
  });

  socket.on('disconnect', () => {
    console.log(`🏪 Vendor disconnected: ${socket.id}`);
  });
});

// App user namespace handlers
appNamespace.on('connection', (socket) => {
  console.log(`📱 App user connected: ${socket.id}`);
  
  // Join user-specific room for order updates
  socket.on('join-user-room', (userId) => {
    console.log(`📱 User ${userId} joined room: user-${userId}`);
    socket.join(`user-${userId}`);
    socket.userId = userId;
    
    // Send confirmation
    socket.emit('joined-user-room', { userId, room: `user-${userId}` });
  });

  // Join order-specific room for specific order tracking
  socket.on('join-order-room', (parentOrderId) => {
    console.log(`📱 User joined order room: order-${parentOrderId}`);
    socket.join(`order-${parentOrderId}`);
    socket.parentOrderId = parentOrderId;
    
    // Send confirmation
    socket.emit('joined-order-room', { parentOrderId, room: `order-${parentOrderId}` });
  });

  // Leave user room
  socket.on('leave-user-room', (userId) => {
    console.log(`📱 User ${userId} left room: user-${userId}`);
    socket.leave(`user-${userId}`);
    delete socket.userId;
  });

  // Leave order room
  socket.on('leave-order-room', (parentOrderId) => {
    console.log(`📱 User left order room: order-${parentOrderId}`);
    socket.leave(`order-${parentOrderId}`);
    delete socket.parentOrderId;
  });

  socket.on('disconnect', () => {
    console.log(`📱 App user disconnected: ${socket.id}`);
  });
});

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`✅ Socket.io server running on port ${PORT}`);
});

// Expose io for external imports
module.exports = { io, vendorNamespace, appNamespace };
