// Socket.io client utilities for connecting to deployed socket server
// This file only provides client-side socket utilities and does not create a server

const SOCKET_URL = process.env.NODE_ENV === 'development' 
  ? 'https://aahaar-cms-socket.onrender.com' 
  : process.env.NEXT_PUBLIC_SOCKET_URL || 'https://aahaar-cms-socket.onrender.com'

console.log('🔗 Socket client configured for:', SOCKET_URL)

// Helper functions to emit events via API routes (since we're using external socket server)
const emitToVendor = async (vendorId, event, data) => {
  try {
    console.log(`🔔 Emitting to vendor ${vendorId}: ${event}`, data)
    const response = await fetch('/api/socket/emit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        namespace: 'vendor',
        room: `vendor-${vendorId}`,
        event,
        data
      })
    })
    
    if (response.ok) {
      console.log('✅ Event emitted successfully')
      return true
    } else {
      console.error('❌ Failed to emit event:', await response.text())
      return false
    }
  } catch (error) {
    console.error('❌ Error emitting to vendor:', error)
    return false
  }
}

const emitToUser = async (userId, event, data) => {
  try {
    console.log(`� Emitting to user ${userId}: ${event}`, data)
    const response = await fetch('/api/socket/emit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        namespace: 'app',
        room: `user-${userId}`,
        event,
        data
      })
    })
    
    if (response.ok) {
      console.log('✅ Event emitted successfully')
      return true
    } else {
      console.error('❌ Failed to emit event:', await response.text())
      return false
    }
  } catch (error) {
    console.error('❌ Error emitting to user:', error)
    return false
  }
}

const emitToOrder = async (parentOrderId, event, data) => {
  try {
    console.log(`🔔 Emitting to order ${parentOrderId}: ${event}`, data)
    const response = await fetch('/api/socket/emit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        namespace: 'app',
        room: `order-${parentOrderId}`,
        event,
        data
      })
    })
    
    if (response.ok) {
      console.log('✅ Event emitted successfully')
      return true
    } else {
      console.error('❌ Failed to emit event:', await response.text())
      return false
    }
  } catch (error) {
    console.error('❌ Error emitting to order:', error)
    return false
  }
}

export { 
  SOCKET_URL,
  emitToVendor, 
  emitToUser, 
  emitToOrder 
}
